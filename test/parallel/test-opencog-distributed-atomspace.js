'use strict';

// Test Distributed AtomSpace implementation

const common = require('../common');
const assert = require('assert');
const DistributedAtomSpace = require('internal/opencog/distributed_atomspace');
const { SyncStrategy } = require('internal/opencog/distributed_atomspace');

// Test DistributedAtomSpace creation
{
  const das = new DistributedAtomSpace({
    nodeId: 'test-node-1',
    syncStrategy: SyncStrategy.EVENTUAL_CONSISTENCY,
  });
  
  assert.strictEqual(das.nodeId, 'test-node-1');
  assert.strictEqual(das.syncStrategy, SyncStrategy.EVENTUAL_CONSISTENCY);
  assert.strictEqual(das.peers.size, 0);
  
  das.destroy();
  common.printSkipMessage('DistributedAtomSpace creation');
}

// Test peer registration
{
  const das = new DistributedAtomSpace({ nodeId: 'node1' });
  
  const registered = das.registerPeer('node2', { address: 'localhost:8001' });
  assert.strictEqual(registered, true);
  assert.strictEqual(das.peers.size, 1);
  assert.ok(das.peers.has('node2'));
  
  // Cannot register self
  assert.throws(() => {
    das.registerPeer('node1');
  }, /Cannot register self as peer/);
  
  das.destroy();
  common.printSkipMessage('Peer registration');
}

// Test atom ownership tracking
{
  const das = new DistributedAtomSpace({ nodeId: 'node1' });
  
  const atom = das.addAtom('CONCEPT', 'test-concept', [], { strength: 1.0, confidence: 1.0 });
  
  assert.ok(atom);
  assert.strictEqual(das.atomOwnership.get(atom.id), 'node1');
  assert.strictEqual(atom.metadata.owner, 'node1');
  assert.ok(atom.metadata.vectorClock);
  
  das.destroy();
  common.printSkipMessage('Atom ownership tracking');
}

// Test atom replication
{
  const das = new DistributedAtomSpace({ nodeId: 'node1' });
  das.registerPeer('node2');
  
  const atomData = {
    id: 'remote-atom-1',
    type: 'CONCEPT',
    name: 'remote-concept',
    truthValue: { strength: 0.9, confidence: 0.8 },
    vectorClock: new Map([['node2', 5]]),
  };
  
  const replicated = das.replicateAtom(atomData, 'node2');
  
  assert.ok(replicated);
  assert.strictEqual(das.atomOwnership.get(replicated.id), 'node2');
  assert.ok(das.atomReplicas.has(replicated.id));
  
  das.destroy();
  common.printSkipMessage('Atom replication');
}

// Test local vs replicated atoms
{
  const das = new DistributedAtomSpace({ nodeId: 'node1' });
  das.registerPeer('node2');
  
  // Add local atom
  const localAtom = das.addAtom('CONCEPT', 'local', [], { strength: 1.0, confidence: 1.0 });
  
  // Replicate remote atom
  const replicatedAtom = das.replicateAtom({
    id: 'remote-1',
    type: 'CONCEPT',
    name: 'remote',
    truthValue: { strength: 0.9, confidence: 0.9 },
    vectorClock: new Map([['node2', 1]]),
  }, 'node2');
  
  const localAtoms = das.getLocalAtoms();
  const replicatedAtoms = das.getReplicatedAtoms();
  
  assert.strictEqual(localAtoms.length, 1);
  assert.strictEqual(replicatedAtoms.length, 1);
  assert.strictEqual(localAtoms[0].id, localAtom.id);
  assert.strictEqual(replicatedAtoms[0].id, replicatedAtom.id);
  
  das.destroy();
  common.printSkipMessage('Local vs replicated atoms');
}

// Test replication status
{
  const das = new DistributedAtomSpace({
    nodeId: 'node1',
    replicationFactor: 3,
  });
  
  das.registerPeer('node2');
  das.registerPeer('node3');
  
  const atom = das.addAtom('CONCEPT', 'test', [], { strength: 1.0, confidence: 1.0 });
  
  const status = das.getReplicationStatus(atom.id);
  assert.strictEqual(status.owner, 'node1');
  assert.strictEqual(status.replicationFactor, 3);
  
  das.destroy();
  common.printSkipMessage('Replication status');
}

// Test vector clock merging
{
  const das = new DistributedAtomSpace({ nodeId: 'node1' });
  
  // Initial vector clock
  assert.ok(das.vectorClock.has('node1'));
  
  // Replicate atom with vector clock
  das.registerPeer('node2');
  const atomData = {
    id: 'test-atom',
    type: 'CONCEPT',
    name: 'test',
    truthValue: { strength: 1.0, confidence: 1.0 },
    vectorClock: new Map([['node2', 10], ['node3', 5]]),
  };
  
  das.replicateAtom(atomData, 'node2');
  
  // Vector clock should be merged
  assert.ok(das.vectorClock.has('node2'));
  assert.ok(das.vectorClock.has('node3'));
  assert.strictEqual(das.vectorClock.get('node2'), 10);
  assert.strictEqual(das.vectorClock.get('node3'), 5);
  
  das.destroy();
  common.printSkipMessage('Vector clock merging');
}

// Test sync strategies
{
  const strategies = [
    SyncStrategy.EVENTUAL_CONSISTENCY,
    SyncStrategy.STRONG_CONSISTENCY,
    SyncStrategy.CONFLICT_FREE,
    SyncStrategy.ATTENTION_BASED,
  ];
  
  for (const strategy of strategies) {
    const das = new DistributedAtomSpace({
      nodeId: 'node1',
      syncStrategy: strategy,
    });
    
    assert.strictEqual(das.syncStrategy, strategy);
    das.destroy();
  }
  
  common.printSkipMessage('Sync strategies');
}

// Test conflict resolution
{
  const das = new DistributedAtomSpace({
    nodeId: 'node1',
    syncStrategy: SyncStrategy.CONFLICT_FREE,
  });
  
  const localAtom = {
    id: 'atom1',
    type: 'CONCEPT',
    name: 'test',
    truthValue: { strength: 0.8, confidence: 0.7 },
    attention: { sti: 50, lti: 20 },
    timestamp: Date.now(),
  };
  
  const remoteAtom = {
    id: 'atom1',
    type: 'CONCEPT',
    name: 'test',
    truthValue: { strength: 0.6, confidence: 0.9 },
    attention: { sti: 30, lti: 10 },
    timestamp: Date.now() + 1000,
    vectorClock: new Map([['node2', 5]]),
  };
  
  const resolved = das.resolveConflict(localAtom, remoteAtom, 'node2');
  
  assert.ok(resolved);
  // CRDT merge should combine truth values
  assert.ok(resolved.truthValue);
  
  das.destroy();
  common.printSkipMessage('Conflict resolution');
}

// Test distributed statistics
{
  const das = new DistributedAtomSpace({ nodeId: 'node1' });
  das.registerPeer('node2');
  das.registerPeer('node3');
  
  das.addAtom('CONCEPT', 'local1', [], { strength: 1.0, confidence: 1.0 });
  das.addAtom('CONCEPT', 'local2', [], { strength: 1.0, confidence: 1.0 });
  
  das.replicateAtom({
    id: 'remote1',
    type: 'CONCEPT',
    name: 'remote1',
    truthValue: { strength: 0.9, confidence: 0.9 },
    vectorClock: new Map([['node2', 1]]),
  }, 'node2');
  
  const stats = das.getDistributedStats();
  
  assert.strictEqual(stats.nodeId, 'node1');
  assert.strictEqual(stats.peers, 2);
  assert.strictEqual(stats.localAtoms, 2);
  assert.strictEqual(stats.replicatedAtoms, 1);
  assert.strictEqual(stats.totalAtoms, 3);
  assert.ok(stats.vectorClock);
  
  das.destroy();
  common.printSkipMessage('Distributed statistics');
}

// Test sync loop
{
  const das = new DistributedAtomSpace({
    nodeId: 'node1',
    syncInterval: 100,
    autoSync: false, // Disable auto-sync for testing
  });
  
  das.registerPeer('node2');
  
  das.addAtom('CONCEPT', 'test', [], { strength: 1.0, confidence: 1.0 });
  
  // Pending sync should be queued
  assert.ok(das.pendingSync.size > 0);
  
  das.destroy();
  common.printSkipMessage('Sync loop');
}

// Test peer unregistration
{
  const das = new DistributedAtomSpace({ nodeId: 'node1' });
  
  das.registerPeer('node2');
  das.registerPeer('node3');
  assert.strictEqual(das.peers.size, 2);
  
  const removed = das.unregisterPeer('node2');
  assert.strictEqual(removed, true);
  assert.strictEqual(das.peers.size, 1);
  assert.ok(!das.peers.has('node2'));
  
  const notRemoved = das.unregisterPeer('nonexistent');
  assert.strictEqual(notRemoved, false);
  
  das.destroy();
  common.printSkipMessage('Peer unregistration');
}

// Test cleanup and destroy
{
  const das = new DistributedAtomSpace({
    nodeId: 'node1',
    syncInterval: 100,
  });
  
  das.registerPeer('node2');
  das.addAtom('CONCEPT', 'test', [], { strength: 1.0, confidence: 1.0 });
  
  das.destroy();
  
  assert.strictEqual(das.peers.size, 0);
  assert.strictEqual(das.atomOwnership.size, 0);
  assert.strictEqual(das.atomReplicas.size, 0);
  assert.strictEqual(das.pendingSync.size, 0);
  assert.strictEqual(das.atoms.size, 0);
  
  common.printSkipMessage('Cleanup and destroy');
}
