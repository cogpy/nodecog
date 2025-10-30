'use strict';

// Performance Profiling Agent
// Monitors and analyzes performance characteristics of the system

const Agent = require('./agent');

/**
 * Performance Profiling Agent
 * Tracks module load times, execution times, and identifies bottlenecks
 */
class PerformanceProfilerAgent extends Agent {
  constructor(atomspace, options = {}) {
    super(atomspace, {
      name: 'PerformanceProfiler',
      frequency: options.frequency || 5000, // Run every 5 seconds
      priority: options.priority || 5,
    });
    
    this.loadTimeThreshold = options.loadTimeThreshold || 100; // ms
    this.executionTimeThreshold = options.executionTimeThreshold || 50; // ms
    this.performanceData = new Map();
    this.bottlenecks = [];
  }

  /**
   * Execute profiling analysis
   */
  execute() {
    this.analyzeModuleLoadTimes();
    this.identifyBottlenecks();
    this.updateAttentionBasedOnPerformance();
    this.generateRecommendations();
  }

  /**
   * Track module load time
   */
  trackModuleLoad(modulePath, loadTime) {
    if (!this.performanceData.has(modulePath)) {
      this.performanceData.set(modulePath, {
        loadTimes: [],
        totalLoadTime: 0,
        loadCount: 0,
        averageLoadTime: 0,
      });
    }
    
    const data = this.performanceData.get(modulePath);
    data.loadTimes.push(loadTime);
    data.totalLoadTime += loadTime;
    data.loadCount++;
    data.averageLoadTime = data.totalLoadTime / data.loadCount;
    
    // Keep only last 10 measurements
    if (data.loadTimes.length > 10) {
      data.loadTimes.shift();
    }
  }

  /**
   * Analyze module load times
   */
  analyzeModuleLoadTimes() {
    const modules = this.atomspace.getAtoms().filter(atom =>
      atom.type && (
        atom.type === 'BUILTIN_MODULE' ||
        atom.type === 'NPM_MODULE' ||
        atom.type === 'LOCAL_MODULE'
      )
    );
    
    for (const module of modules) {
      const perfData = this.performanceData.get(module.name);
      if (!perfData) continue;
      
      // Store performance data in atom
      if (!module.performanceData) {
        module.performanceData = {};
      }
      
      module.performanceData.averageLoadTime = perfData.averageLoadTime;
      module.performanceData.loadCount = perfData.loadCount;
      module.performanceData.isSlow = perfData.averageLoadTime > this.loadTimeThreshold;
    }
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    this.bottlenecks = [];
    
    const modules = this.atomspace.getAtoms().filter(atom =>
      atom.performanceData && atom.performanceData.isSlow
    );
    
    // Sort by average load time
    modules.sort((a, b) => 
      b.performanceData.averageLoadTime - a.performanceData.averageLoadTime
    );
    
    for (const module of modules.slice(0, 10)) {
      this.bottlenecks.push({
        module: module.name,
        type: module.type,
        averageLoadTime: module.performanceData.averageLoadTime,
        loadCount: module.performanceData.loadCount,
        totalTime: module.performanceData.averageLoadTime * module.performanceData.loadCount,
      });
    }
  }

  /**
   * Update attention values based on performance
   * Slow modules get higher attention for optimization
   */
  updateAttentionBasedOnPerformance() {
    const modules = this.atomspace.getAtoms().filter(atom =>
      atom.performanceData
    );
    
    for (const module of modules) {
      const perfData = module.performanceData;
      
      if (perfData.isSlow) {
        // Increase attention for slow modules
        const slownessFactor = perfData.averageLoadTime / this.loadTimeThreshold;
        const stiBoost = Math.min(100, slownessFactor * 50);
        
        if (module.attentionValue) {
          module.attentionValue.sti += stiBoost;
        }
      }
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    for (const bottleneck of this.bottlenecks) {
      const rec = {
        module: bottleneck.module,
        issue: `Slow load time: ${bottleneck.averageLoadTime.toFixed(2)}ms`,
        impact: 'high',
        suggestions: [],
      };
      
      // Generate specific recommendations
      if (bottleneck.type === 'NPM_MODULE') {
        rec.suggestions.push('Consider lazy loading this module');
        rec.suggestions.push('Check for lighter alternatives');
        rec.suggestions.push('Use dynamic imports if possible');
      } else if (bottleneck.type === 'LOCAL_MODULE') {
        rec.suggestions.push('Profile the module initialization code');
        rec.suggestions.push('Consider code splitting');
        rec.suggestions.push('Check for synchronous I/O operations');
      }
      
      if (bottleneck.loadCount > 5) {
        rec.suggestions.push('Module loaded multiple times - check for circular dependencies');
      }
      
      recommendations.push(rec);
    }
    
    this.recommendations = recommendations;
    return recommendations;
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    return {
      bottlenecks: this.bottlenecks,
      recommendations: this.recommendations || [],
      totalModulesTracked: this.performanceData.size,
      slowModules: this.bottlenecks.length,
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = super.getStats();
    stats.bottlenecks = this.bottlenecks.length;
    stats.trackedModules = this.performanceData.size;
    stats.recommendations = this.recommendations ? this.recommendations.length : 0;
    return stats;
  }
}

module.exports = PerformanceProfilerAgent;
