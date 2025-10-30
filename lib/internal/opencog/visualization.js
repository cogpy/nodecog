'use strict';

/**
 * Visualization - Real-time cognitive dashboard
 * 
 * Provides visualization and monitoring capabilities for the
 * cognitive system, including AtomSpace, agents, and metrics.
 */

const { EventEmitter } = require('events');

/**
 * Visualization types
 */
const VisualizationType = {
  GRAPH: 'graph',           // Network graph
  TIMELINE: 'timeline',     // Time-based events
  HEATMAP: 'heatmap',       // Attention heatmap
  METRICS: 'metrics',       // Performance metrics
  HIERARCHY: 'hierarchy',   // Hierarchical tree
};

/**
 * CognitiveVisualizer - Generate visualization data
 */
class CognitiveVisualizer extends EventEmitter {
  constructor(atomspace, options = {}) {
    super();
    
    this.atomspace = atomspace;
    this.updateInterval = options.updateInterval || 1000; // ms
    this.maxHistorySize = options.maxHistorySize || 100;
    
    // Visualization state
    this.metricsHistory = [];
    this.eventLog = [];
    this.snapshots = [];
    
    // Configuration
    this.enableAutoUpdate = options.enableAutoUpdate !== false;
    this.colorScheme = options.colorScheme || 'default';
    
    if (this.enableAutoUpdate) {
      this._startAutoUpdate();
    }
  }

  /**
   * Generate AtomSpace graph visualization data
   */
  generateAtomSpaceGraph(options = {}) {
    const maxNodes = options.maxNodes || 100;
    const minAttention = options.minAttention || 0;
    const types = options.types || null;
    
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();
    
    // Get atoms based on filters
    let atoms = Array.from(this.atomspace.atoms.values());
    
    if (minAttention > 0) {
      atoms = atoms.filter(a => a.attention.sti >= minAttention);
    }
    
    if (types) {
      atoms = atoms.filter(a => types.includes(a.type));
    }
    
    // Sort by attention and limit
    atoms.sort((a, b) => b.attention.sti - a.attention.sti);
    atoms = atoms.slice(0, maxNodes);
    
    // Create nodes
    for (const atom of atoms) {
      const node = {
        id: atom.id,
        label: atom.name || atom.type,
        type: atom.type,
        attention: atom.attention.sti,
        confidence: atom.truthValue.confidence,
        strength: atom.truthValue.strength,
        size: this._calculateNodeSize(atom),
        color: this._getNodeColor(atom),
      };
      
      nodes.push(node);
      nodeMap.set(atom.id, node);
    }
    
    // Create edges
    for (const atom of atoms) {
      for (const outgoing of atom.outgoing) {
        if (nodeMap.has(outgoing.id)) {
          edges.push({
            from: atom.id,
            to: outgoing.id,
            strength: atom.truthValue.strength,
            type: atom.type,
          });
        }
      }
    }
    
    return {
      type: VisualizationType.GRAPH,
      nodes,
      edges,
      metadata: {
        totalAtoms: this.atomspace.atoms.size,
        displayedNodes: nodes.length,
        displayedEdges: edges.length,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Generate attention heatmap
   */
  generateAttentionHeatmap() {
    const atoms = Array.from(this.atomspace.atoms.values());
    const typeGroups = new Map();
    
    // Group atoms by type
    for (const atom of atoms) {
      if (!typeGroups.has(atom.type)) {
        typeGroups.set(atom.type, []);
      }
      typeGroups.get(atom.type).push(atom);
    }
    
    const heatmap = [];
    
    // Calculate average attention per type
    for (const [type, atoms] of typeGroups) {
      const avgAttention = atoms.reduce((sum, a) => sum + a.attention.sti, 0) / atoms.length;
      const maxAttention = Math.max(...atoms.map(a => a.attention.sti));
      const minAttention = Math.min(...atoms.map(a => a.attention.sti));
      
      heatmap.push({
        type,
        count: atoms.length,
        avgAttention,
        maxAttention,
        minAttention,
        intensity: this._normalizeAttention(avgAttention),
      });
    }
    
    // Sort by average attention
    heatmap.sort((a, b) => b.avgAttention - a.avgAttention);
    
    return {
      type: VisualizationType.HEATMAP,
      data: heatmap,
      metadata: {
        types: heatmap.length,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Generate performance metrics visualization
   */
  generateMetricsVisualization() {
    const currentMetrics = this._captureMetrics();
    
    // Add to history
    this.metricsHistory.push(currentMetrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
    
    return {
      type: VisualizationType.METRICS,
      current: currentMetrics,
      history: this.metricsHistory,
      charts: [
        {
          name: 'Atom Count',
          data: this.metricsHistory.map(m => ({
            timestamp: m.timestamp,
            value: m.atomCount,
          })),
        },
        {
          name: 'Average Attention',
          data: this.metricsHistory.map(m => ({
            timestamp: m.timestamp,
            value: m.avgAttention,
          })),
        },
        {
          name: 'Peak Attention',
          data: this.metricsHistory.map(m => ({
            timestamp: m.timestamp,
            value: m.peakAttention,
          })),
        },
      ],
      metadata: {
        historySize: this.metricsHistory.length,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Generate event timeline
   */
  generateEventTimeline(options = {}) {
    const maxEvents = options.maxEvents || 50;
    
    return {
      type: VisualizationType.TIMELINE,
      events: this.eventLog.slice(-maxEvents),
      metadata: {
        totalEvents: this.eventLog.length,
        displayedEvents: Math.min(this.eventLog.length, maxEvents),
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Generate complete dashboard data
   */
  generateDashboard(options = {}) {
    return {
      graph: this.generateAtomSpaceGraph(options.graph),
      heatmap: this.generateAttentionHeatmap(),
      metrics: this.generateMetricsVisualization(),
      timeline: this.generateEventTimeline(options.timeline),
      summary: this._generateSummary(),
      timestamp: Date.now(),
    };
  }

  /**
   * Log an event for timeline visualization
   */
  logEvent(type, description, data = {}) {
    const event = {
      type,
      description,
      data,
      timestamp: Date.now(),
    };
    
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxHistorySize) {
      this.eventLog.shift();
    }
    
    this.emit('event-logged', event);
  }

  /**
   * Create a snapshot of current state
   */
  createSnapshot(label = '') {
    const snapshot = {
      label,
      timestamp: Date.now(),
      atomCount: this.atomspace.atoms.size,
      graph: this.generateAtomSpaceGraph({ maxNodes: 50 }),
      metrics: this._captureMetrics(),
    };
    
    this.snapshots.push(snapshot);
    if (this.snapshots.length > 10) {
      this.snapshots.shift();
    }
    
    this.emit('snapshot-created', { label, timestamp: snapshot.timestamp });
    return snapshot;
  }

  /**
   * Export visualization data as JSON
   */
  exportData(format = 'json') {
    const data = {
      atomspace: {
        totalAtoms: this.atomspace.atoms.size,
        types: this._getAtomTypeCounts(),
      },
      metrics: this.metricsHistory,
      events: this.eventLog,
      snapshots: this.snapshots,
      timestamp: Date.now(),
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    return data;
  }

  /**
   * Get visualization statistics
   */
  getStats() {
    return {
      metricsHistorySize: this.metricsHistory.length,
      eventLogSize: this.eventLog.length,
      snapshotsCount: this.snapshots.length,
      updateInterval: this.updateInterval,
      autoUpdateEnabled: this.enableAutoUpdate,
    };
  }

  /**
   * Private: Calculate node size based on attention
   */
  _calculateNodeSize(atom) {
    const baseSize = 10;
    const attentionFactor = Math.min(atom.attention.sti / 100, 3);
    return baseSize + (attentionFactor * 10);
  }

  /**
   * Private: Get node color based on type and attention
   */
  _getNodeColor(atom) {
    const colors = {
      CONCEPT: '#4CAF50',
      LINK: '#2196F3',
      NODE: '#FF9800',
      PREDICATE: '#9C27B0',
      WORD: '#00BCD4',
      SENTENCE: '#3F51B5',
      default: '#757575',
    };
    
    let baseColor = colors[atom.type] || colors.default;
    
    // Adjust opacity based on attention
    const opacity = Math.min(atom.attention.sti / 100, 1);
    return `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
  }

  /**
   * Private: Normalize attention value to 0-1
   */
  _normalizeAttention(attention) {
    const maxAttention = 100; // Assumed max
    return Math.min(attention / maxAttention, 1);
  }

  /**
   * Private: Capture current metrics
   */
  _captureMetrics() {
    const atoms = Array.from(this.atomspace.atoms.values());
    const attentions = atoms.map(a => a.attention.sti);
    
    return {
      timestamp: Date.now(),
      atomCount: atoms.length,
      avgAttention: attentions.length > 0 ? 
        attentions.reduce((a, b) => a + b, 0) / attentions.length : 0,
      peakAttention: attentions.length > 0 ? Math.max(...attentions) : 0,
      minAttention: attentions.length > 0 ? Math.min(...attentions) : 0,
      typeCount: new Set(atoms.map(a => a.type)).size,
    };
  }

  /**
   * Private: Generate summary statistics
   */
  _generateSummary() {
    const atoms = Array.from(this.atomspace.atoms.values());
    const typeCounts = this._getAtomTypeCounts();
    
    return {
      totalAtoms: atoms.length,
      types: Object.keys(typeCounts).length,
      topTypes: Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      attentionStats: {
        avg: this._captureMetrics().avgAttention,
        peak: this._captureMetrics().peakAttention,
      },
      recentEvents: this.eventLog.slice(-5).length,
    };
  }

  /**
   * Private: Get atom type counts
   */
  _getAtomTypeCounts() {
    const counts = {};
    for (const atom of this.atomspace.atoms.values()) {
      counts[atom.type] = (counts[atom.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * Private: Start auto-update timer
   */
  _startAutoUpdate() {
    this.updateTimer = setInterval(() => {
      const dashboard = this.generateDashboard();
      this.emit('dashboard-update', dashboard);
    }, this.updateInterval);
  }

  /**
   * Stop auto-updates
   */
  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopAutoUpdate();
    this.metricsHistory = [];
    this.eventLog = [];
    this.snapshots = [];
  }
}

module.exports = CognitiveVisualizer;
module.exports.VisualizationType = VisualizationType;
