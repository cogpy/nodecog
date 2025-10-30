'use strict';

/**
 * Distributed AtomSpace - Multi-node knowledge sharing
 * 
 * Extends AtomSpace to support distributed knowledge representation
 * across multiple Node.js instances with synchronization and replication.
 */

const { EventEmitter } = require('events');
const { AtomSpace } = require('internal/opencog/atomspace');

/**
 * Synchronization strategy for distributed atomspace
 */
const SyncStrategy = {
  EVENTUAL_CONSISTENCY: 'eventual',  // Best effort, eventually consistent
  STRONG_CONSISTENCY: 'strong',      // All nodes must agree
  CONFLICT_FREE: 'crdt',             // CRDT-based conflict-free replication
  ATTENTION_BASED: 'attention',      // Sync high-attention atoms first
};

/**
 * DistributedAtomSpace - Multi-node knowledge graph
 * 
 * Enables multiple Node.js instances to share a common knowledge base
 * with configurable synchronization and replication strategies.
 */
class DistributedAtomSpace extends AtomSpace {
  constructor(options = {}) {
    super(options);
    
    this.nodeId = options.nodeId || DistributedAtomSpace.generateNodeId();
    this.peers = new Map(); // nodeId -> peer connection info
    this.syncStrategy = options.syncStrategy || SyncStrategy.EVENTUAL_CONSISTENCY;
    this.syncInterval = options.syncInterval || 1000; // ms
    this.replicationFactor = options.replicationFactor || 2; // Number of copies
    
    // Distributed metadata
    this.atomOwnership = new Map(); // atomId -> nodeId (primary owner)
    this.atomReplicas = new Map();  // atomId -> Set of nodeIds (replicas)
    this.pendingSync = new Map();   // atomId -> sync queue
    this.vectorClock = new Map();   // nodeId -> counter (for causality)
    
    // Statistics
    this.syncStats = {
      syncsSent: 0,
      syncsReceived: 0,
      conflicts: 0,
      resolutions: 0,
    };
    
    // Initialize vector clock for this node
    this.vectorClock.set(this.nodeId, 0);
    
    // Start sync loop if enabled
    if (options.autoSync !== false) {
      this._startSyncLoop();
    }
  }

  static _nodeCounter = 0;
  static generateNodeId() {
    return `node_${++DistributedAtomSpace._nodeCounter}_${Date.now()}`;
  }

  /**
   * Register a peer node for distributed operations
   */
  registerPeer(nodeId, connectionInfo = {}) {
    if (nodeId === this.nodeId) {
      throw new Error('Cannot register self as peer');
    }

    this.peers.set(nodeId, {
      nodeId,
      connected: true,
      lastSync: 0,
      latency: 0,
      ...connectionInfo,
    });

    // Initialize vector clock for peer
    if (!this.vectorClock.has(nodeId)) {
      this.vectorClock.set(nodeId, 0);
    }

    this.emit('peer-registered', { nodeId, peerCount: this.peers.size });
    return true;
  }

  /**
   * Unregister a peer node
   */
  unregisterPeer(nodeId) {
    const removed = this.peers.delete(nodeId);
    if (removed) {
      this.emit('peer-unregistered', { nodeId, peerCount: this.peers.size });
    }
    return removed;
  }

  /**
   * Add atom to distributed atomspace with ownership tracking
   */
  addAtom(type, name, outgoing = [], truthValue) {
    const atom = super.addAtom(type, name, outgoing, truthValue);
    
    // Set ownership to this node
    if (!this.atomOwnership.has(atom.id)) {
      this.atomOwnership.set(atom.id, this.nodeId);
      atom.metadata = atom.metadata || {};
      atom.metadata.owner = this.nodeId;
      atom.metadata.created = Date.now();
    }

    // Increment vector clock
    const currentClock = this.vectorClock.get(this.nodeId) || 0;
    this.vectorClock.set(this.nodeId, currentClock + 1);
    atom.metadata.vectorClock = new Map(this.vectorClock);

    // Queue for replication
    this._queueForReplication(atom);

    return atom;
  }

  /**
   * Replicate an atom from a remote node
   */
  replicateAtom(atomData, sourceNodeId) {
    // Check if we should accept this replication
    if (!this._shouldAcceptReplication(atomData, sourceNodeId)) {
      return null;
    }

    // Add or update atom
    const atom = super.addAtom(
      atomData.type,
      atomData.name,
      atomData.outgoing || [],
      atomData.truthValue
    );

    // Update ownership and replica tracking
    if (!this.atomOwnership.has(atom.id)) {
      this.atomOwnership.set(atom.id, sourceNodeId);
    }

    if (!this.atomReplicas.has(atom.id)) {
      this.atomReplicas.set(atom.id, new Set());
    }
    this.atomReplicas.get(atom.id).add(this.nodeId);

    // Merge vector clocks
    if (atomData.vectorClock) {
      this._mergeVectorClock(atomData.vectorClock);
    }

    this.emit('atom-replicated', {
      atomId: atom.id,
      sourceNodeId,
      currentReplicas: this.atomReplicas.get(atom.id).size,
    });

    this.syncStats.syncsReceived++;
    return atom;
  }

  /**
   * Synchronize with all peers
   */
  async syncWithPeers() {
    const syncPromises = [];
    
    for (const [nodeId, peer] of this.peers) {
      if (peer.connected) {
        syncPromises.push(this._syncWithPeer(nodeId));
      }
    }

    const results = await Promise.allSettled(syncPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.emit('sync-completed', {
      peersAttempted: this.peers.size,
      successful,
      failed,
    });

    return { successful, failed };
  }

  /**
   * Get atoms owned by this node
   */
  getLocalAtoms() {
    return Array.from(this.atoms.values()).filter(atom =>
      this.atomOwnership.get(atom.id) === this.nodeId
    );
  }

  /**
   * Get atoms replicated from other nodes
   */
  getReplicatedAtoms() {
    return Array.from(this.atoms.values()).filter(atom =>
      this.atomOwnership.get(atom.id) !== this.nodeId
    );
  }

  /**
   * Get replication status for an atom
   */
  getReplicationStatus(atomId) {
    return {
      owner: this.atomOwnership.get(atomId),
      replicas: Array.from(this.atomReplicas.get(atomId) || []),
      replicationFactor: this.replicationFactor,
      isFullyReplicated: (this.atomReplicas.get(atomId)?.size || 0) >= this.replicationFactor,
    };
  }

  /**
   * Resolve conflicts using configured strategy
   */
  resolveConflict(localAtom, remoteAtom, remoteNodeId) {
    this.syncStats.conflicts++;

    switch (this.syncStrategy) {
      case SyncStrategy.STRONG_CONSISTENCY:
        // Last-write-wins based on timestamp
        return localAtom.timestamp > remoteAtom.timestamp ? localAtom : remoteAtom;

      case SyncStrategy.ATTENTION_BASED:
        // Higher attention wins
        return localAtom.attention.sti > remoteAtom.attention.sti ? localAtom : remoteAtom;

      case SyncStrategy.CONFLICT_FREE:
        // Merge truth values (CRDT-style)
        const merged = this._mergeTruthValues(
          localAtom.truthValue,
          remoteAtom.truthValue
        );
        localAtom.truthValue = merged;
        this.syncStats.resolutions++;
        return localAtom;

      case SyncStrategy.EVENTUAL_CONSISTENCY:
      default:
        // Use vector clock to determine causality
        const localClock = localAtom.metadata?.vectorClock || new Map();
        const remoteClock = remoteAtom.vectorClock || new Map();
        
        if (this._happensBefore(localClock, remoteClock)) {
          return remoteAtom;
        } else if (this._happensBefore(remoteClock, localClock)) {
          return localAtom;
        } else {
          // Concurrent updates - merge
          return this._mergeAtoms(localAtom, remoteAtom);
        }
    }
  }

  /**
   * Get distributed atomspace statistics
   */
  getDistributedStats() {
    return {
      nodeId: this.nodeId,
      peers: this.peers.size,
      localAtoms: this.getLocalAtoms().length,
      replicatedAtoms: this.getReplicatedAtoms().length,
      totalAtoms: this.atoms.size,
      syncStrategy: this.syncStrategy,
      replicationFactor: this.replicationFactor,
      vectorClock: Object.fromEntries(this.vectorClock),
      syncStats: { ...this.syncStats },
      pendingSync: this.pendingSync.size,
    };
  }

  /**
   * Private: Queue atom for replication to peers
   */
  _queueForReplication(atom) {
    if (this.peers.size === 0) return;

    if (!this.pendingSync.has(atom.id)) {
      this.pendingSync.set(atom.id, {
        atom,
        timestamp: Date.now(),
        attempts: 0,
      });
    }
  }

  /**
   * Private: Sync with a specific peer
   */
  async _syncWithPeer(peerNodeId) {
    const peer = this.peers.get(peerNodeId);
    if (!peer || !peer.connected) {
      return { success: false, reason: 'peer_unavailable' };
    }

    const atomsToSync = [];
    const now = Date.now();

    // Select atoms to sync based on strategy
    for (const [atomId, syncData] of this.pendingSync) {
      const atom = this.atoms.get(atomId);
      if (!atom) continue;

      if (this.syncStrategy === SyncStrategy.ATTENTION_BASED) {
        // Only sync high-attention atoms
        if (atom.attention.sti < 10) continue;
      }

      atomsToSync.push({
        id: atom.id,
        type: atom.type,
        name: atom.name,
        truthValue: atom.truthValue,
        attention: atom.attention,
        vectorClock: new Map(this.vectorClock),
        timestamp: atom.timestamp,
      });
    }

    // Simulate network sync (in real implementation, this would use WebSockets/HTTP)
    this.emit('sync-to-peer', {
      peerNodeId,
      atomCount: atomsToSync.length,
      atoms: atomsToSync,
    });

    this.syncStats.syncsSent++;
    peer.lastSync = now;

    // Clear successfully synced atoms from queue
    for (const atomData of atomsToSync) {
      this.pendingSync.delete(atomData.id);
    }

    return { success: true, atomsSynced: atomsToSync.length };
  }

  /**
   * Private: Check if replication should be accepted
   */
  _shouldAcceptReplication(atomData, sourceNodeId) {
    // Always accept from registered peers
    if (!this.peers.has(sourceNodeId)) {
      return false;
    }

    // Check if we already have enough replicas
    const replicas = this.atomReplicas.get(atomData.id);
    if (replicas && replicas.size >= this.replicationFactor) {
      return false;
    }

    return true;
  }

  /**
   * Private: Merge vector clocks
   */
  _mergeVectorClock(remoteClock) {
    for (const [nodeId, counter] of remoteClock) {
      const localCounter = this.vectorClock.get(nodeId) || 0;
      this.vectorClock.set(nodeId, Math.max(localCounter, counter));
    }
  }

  /**
   * Private: Check if clock1 happens before clock2
   */
  _happensBefore(clock1, clock2) {
    let allLessOrEqual = true;
    let atLeastOneLess = false;

    for (const [nodeId, counter] of clock1) {
      const otherCounter = clock2.get(nodeId) || 0;
      if (counter > otherCounter) {
        allLessOrEqual = false;
        break;
      }
      if (counter < otherCounter) {
        atLeastOneLess = true;
      }
    }

    return allLessOrEqual && atLeastOneLess;
  }

  /**
   * Private: Merge two atoms (CRDT-style)
   */
  _mergeAtoms(atom1, atom2) {
    // Merge truth values
    atom1.truthValue = this._mergeTruthValues(
      atom1.truthValue,
      atom2.truthValue
    );

    // Merge attention values
    atom1.attention.sti = Math.max(atom1.attention.sti, atom2.attention.sti);
    atom1.attention.lti = Math.max(atom1.attention.lti, atom2.attention.lti);

    // Update timestamp to latest
    atom1.timestamp = Math.max(atom1.timestamp, atom2.timestamp);

    this.syncStats.resolutions++;
    return atom1;
  }

  /**
   * Private: Start automatic sync loop
   */
  _startSyncLoop() {
    this.syncTimer = setInterval(() => {
      if (this.peers.size > 0 && this.pendingSync.size > 0) {
        this.syncWithPeers().catch(err => {
          this.emit('sync-error', { error: err.message });
        });
      }
    }, this.syncInterval);
  }

  /**
   * Stop the sync loop
   */
  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopSync();
    this.peers.clear();
    this.atomOwnership.clear();
    this.atomReplicas.clear();
    this.pendingSync.clear();
    this.clear();
  }
}

module.exports = DistributedAtomSpace;
module.exports.SyncStrategy = SyncStrategy;
