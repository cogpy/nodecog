'use strict';

/**
 * ModuleAnalyzerAgent
 * 
 * Cognitive agent that analyzes module dependencies and importance
 * using NodeSpace and AtomSpace reasoning capabilities
 */

const { Agent } = require('internal/opencog/agent');
const { NodeSpaceAtomType } = require('internal/opencog/nodespace');

/**
 * Module Analyzer Agent
 * Analyzes module structure, identifies patterns, and optimizes attention allocation
 */
class ModuleAnalyzerAgent extends Agent {
  constructor(nodespace) {
    super({
      name: 'ModuleAnalyzerAgent',
      description: 'Analyzes module dependencies and patterns',
      frequency: 1.0,
      priority: 5,
    });
    
    this.nodespace = nodespace;
    this.analysis = {
      deadModules: [],
      circularDeps: [],
      criticalModules: [],
      underutilized: [],
      hotspots: [],
    };
  }

  /**
   * Execute analysis cycle
   */
  execute(atomspace, attentionBank) {
    if (!this.nodespace) {
      return { success: false, reason: 'NodeSpace not available' };
    }

    // Reset analysis
    this.analysis = {
      deadModules: [],
      circularDeps: [],
      criticalModules: [],
      underutilized: [],
      hotspots: [],
    };

    // Run analyses
    this._findDeadModules();
    this._detectCircularDependencies();
    this._identifyCriticalModules();
    this._findUnderutilizedModules();
    this._identifyHotspots();
    this._optimizeAttention(attentionBank);

    return {
      success: true,
      analysis: this.analysis,
    };
  }

  /**
   * Find modules with no dependents (potential dead code)
   */
  _findDeadModules() {
    const allModules = Array.from(this.nodespace.moduleRegistry.keys());
    
    for (const modulePath of allModules) {
      const module = this.nodespace.getModule(modulePath);
      
      // Skip builtin modules - they're always potentially useful
      if (module.type === NodeSpaceAtomType.BUILTIN_MODULE) {
        continue;
      }
      
      const dependents = this.nodespace.getDependents(modulePath);
      
      if (dependents.length === 0) {
        this.analysis.deadModules.push({
          path: modulePath,
          type: module.type,
          attention: module.attention.sti,
        });
        
        // Reduce attention on dead modules
        module.attention.sti = Math.max(0, module.attention.sti - 5);
        module.attention.lti = Math.max(0, module.attention.lti - 2);
      }
    }
  }

  /**
   * Detect circular dependencies
   */
  _detectCircularDependencies() {
    const circles = this.nodespace.detectCircularDependencies();
    
    this.analysis.circularDeps = circles.map(circle => ({
      cycle: circle,
      severity: circle.length,
    }));

    // Mark modules in circles with special attention
    for (const circle of circles) {
      for (const modulePath of circle) {
        const module = this.nodespace.getModule(modulePath);
        if (module) {
          // Increase STI to bring attention to the problem
          module.attention.sti += 10;
        }
      }
    }
  }

  /**
   * Identify critical modules (high dependency count)
   */
  _identifyCriticalModules() {
    const allModules = Array.from(this.nodespace.moduleRegistry.keys());
    
    for (const modulePath of allModules) {
      const dependents = this.nodespace.getDependents(modulePath);
      
      // Critical if 3+ modules depend on it
      if (dependents.length >= 3) {
        const module = this.nodespace.getModule(modulePath);
        
        this.analysis.criticalModules.push({
          path: modulePath,
          type: module.type,
          dependentCount: dependents.length,
          attention: module.attention.sti,
        });
        
        // Boost attention for critical modules
        module.attention.sti = Math.max(module.attention.sti, 50);
        module.attention.lti += 5;
        
        // Mark as very long-term important if widely used
        if (dependents.length >= 5) {
          module.attention.vlti = true;
        }
      }
    }
  }

  /**
   * Find modules with low attention but dependencies
   */
  _findUnderutilizedModules() {
    const allModules = Array.from(this.nodespace.moduleRegistry.keys());
    
    for (const modulePath of allModules) {
      const module = this.nodespace.getModule(modulePath);
      const dependents = this.nodespace.getDependents(modulePath);
      
      // Has dependents but low attention
      if (dependents.length > 0 && module.attention.sti < 20) {
        this.analysis.underutilized.push({
          path: modulePath,
          type: module.type,
          dependentCount: dependents.length,
          attention: module.attention.sti,
        });
      }
    }
  }

  /**
   * Identify dependency hotspots (modules with many dependencies)
   */
  _identifyHotspots() {
    const allModules = Array.from(this.nodespace.moduleRegistry.keys());
    
    for (const modulePath of allModules) {
      const dependencies = this.nodespace.getDependencies(modulePath);
      
      // Hotspot if depends on 5+ modules
      if (dependencies.length >= 5) {
        const module = this.nodespace.getModule(modulePath);
        
        this.analysis.hotspots.push({
          path: modulePath,
          type: module.type,
          dependencyCount: dependencies.length,
          attention: module.attention.sti,
        });
        
        // Moderate attention boost - might need refactoring
        module.attention.sti += 10;
      }
    }
  }

  /**
   * Optimize attention allocation based on analysis
   */
  _optimizeAttention(attentionBank) {
    if (!attentionBank) return;

    // Spread attention through dependency graph
    const criticalPaths = this.analysis.criticalModules;
    
    for (const critical of criticalPaths) {
      const module = this.nodespace.getModule(critical.path);
      if (module) {
        // Spread attention to dependencies of critical modules
        const dependencies = this.nodespace.getDependencies(critical.path);
        const attentionToSpread = Math.floor(module.attention.sti * 0.3);
        
        for (const dep of dependencies) {
          dep.attention.sti += Math.floor(attentionToSpread / dependencies.length);
        }
      }
    }
  }

  /**
   * Get analysis report
   */
  getAnalysisReport() {
    const report = {
      summary: {
        deadModules: this.analysis.deadModules.length,
        circularDeps: this.analysis.circularDeps.length,
        criticalModules: this.analysis.criticalModules.length,
        underutilized: this.analysis.underutilized.length,
        hotspots: this.analysis.hotspots.length,
      },
      details: this.analysis,
      recommendations: this._generateRecommendations(),
    };
    
    return report;
  }

  /**
   * Generate recommendations based on analysis
   */
  _generateRecommendations() {
    const recommendations = [];
    
    // Dead module recommendations
    if (this.analysis.deadModules.length > 0) {
      recommendations.push({
        type: 'dead-code',
        severity: 'low',
        message: `Found ${this.analysis.deadModules.length} potentially unused modules`,
        action: 'Review and consider removing unused modules',
        modules: this.analysis.deadModules.map(m => m.path),
      });
    }
    
    // Circular dependency recommendations
    if (this.analysis.circularDeps.length > 0) {
      recommendations.push({
        type: 'circular-dependency',
        severity: 'high',
        message: `Found ${this.analysis.circularDeps.length} circular dependencies`,
        action: 'Refactor to break circular dependencies',
        cycles: this.analysis.circularDeps.map(c => c.cycle),
      });
    }
    
    // Critical module recommendations
    if (this.analysis.criticalModules.length > 0) {
      recommendations.push({
        type: 'critical-modules',
        severity: 'medium',
        message: `${this.analysis.criticalModules.length} modules are heavily depended upon`,
        action: 'Ensure critical modules are well-tested and stable',
        modules: this.analysis.criticalModules.map(m => m.path),
      });
    }
    
    // Hotspot recommendations
    if (this.analysis.hotspots.length > 0) {
      recommendations.push({
        type: 'dependency-hotspots',
        severity: 'medium',
        message: `${this.analysis.hotspots.length} modules have many dependencies`,
        action: 'Consider refactoring to reduce coupling',
        modules: this.analysis.hotspots.map(m => m.path),
      });
    }
    
    return recommendations;
  }
}

module.exports = ModuleAnalyzerAgent;
