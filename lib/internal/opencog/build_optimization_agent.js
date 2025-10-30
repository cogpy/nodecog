'use strict';

// Build Optimization Agent
// Analyzes module structure and provides build optimization recommendations

const Agent = require('./agent');

/**
 * Build Optimization Agent
 * Analyzes dependencies and provides optimization recommendations
 */
class BuildOptimizationAgent extends Agent {
  constructor(atomspace, options = {}) {
    super(atomspace, {
      name: 'BuildOptimizer',
      frequency: options.frequency || 30000, // Run every 30 seconds
      priority: options.priority || 6,
    });
    
    this.optimizations = [];
    this.bundleAnalysis = null;
  }

  /**
   * Execute build optimization analysis
   */
  execute() {
    this.analyzeModuleUsage();
    this.identifyDeadCode();
    this.analyzeBundleSize();
    this.identifyCodeSplittingOpportunities();
    this.generateOptimizationRecommendations();
  }

  /**
   * Analyze module usage patterns
   */
  analyzeModuleUsage() {
    const modules = this.atomspace.getAtoms().filter(atom =>
      atom.type && (
        atom.type === 'BUILTIN_MODULE' ||
        atom.type === 'NPM_MODULE' ||
        atom.type === 'LOCAL_MODULE'
      )
    );
    
    for (const module of modules) {
      const usage = this.calculateModuleUsage(module);
      
      if (!module.buildData) {
        module.buildData = {};
      }
      
      module.buildData.usageCount = usage.dependentCount;
      module.buildData.isHeavilyUsed = usage.dependentCount > 5;
      module.buildData.isUnused = usage.dependentCount === 0;
    }
  }

  /**
   * Calculate module usage
   */
  calculateModuleUsage(module) {
    // Count how many modules depend on this one
    const dependents = this.atomspace.getAtoms().filter(atom =>
      atom.type === 'DEPENDS_ON' &&
      atom.outgoing &&
      atom.outgoing[1] === module.id
    );
    
    return {
      dependentCount: dependents.length,
      dependents: dependents,
    };
  }

  /**
   * Identify dead code (unused modules)
   */
  identifyDeadCode() {
    const unusedModules = this.atomspace.getAtoms().filter(atom =>
      atom.buildData && atom.buildData.isUnused &&
      atom.type === 'LOCAL_MODULE' // Focus on local modules
    );
    
    this.deadCode = unusedModules.map(module => ({
      module: module.name,
      type: module.type,
      reason: 'No other modules depend on this module',
      recommendation: 'Consider removing if truly unused',
    }));
  }

  /**
   * Analyze bundle size implications
   */
  analyzeBundleSize() {
    const modules = this.atomspace.getAtoms().filter(atom =>
      atom.type && (
        atom.type === 'NPM_MODULE' ||
        atom.type === 'LOCAL_MODULE'
      )
    );
    
    // Estimate bundle impact
    const analysis = {
      totalModules: modules.length,
      npmModules: 0,
      localModules: 0,
      heavyModules: [],
      estimatedSize: 0,
    };
    
    for (const module of modules) {
      if (module.type === 'NPM_MODULE') {
        analysis.npmModules++;
        // Estimate size (rough heuristic)
        const estimatedSize = this.estimateModuleSize(module);
        analysis.estimatedSize += estimatedSize;
        
        if (estimatedSize > 100) { // > 100KB
          analysis.heavyModules.push({
            name: module.name,
            estimatedSize: estimatedSize,
          });
        }
      } else if (module.type === 'LOCAL_MODULE') {
        analysis.localModules++;
      }
    }
    
    this.bundleAnalysis = analysis;
  }

  /**
   * Estimate module size (simplified heuristic)
   */
  estimateModuleSize(module) {
    // Known large modules (rough estimates in KB)
    const knownSizes = {
      'moment': 230,
      'lodash': 71,
      'axios': 13,
      'express': 208,
      'react': 120,
      'react-dom': 120,
      'vue': 85,
      'angular': 1200,
    };
    
    // Check if it's a known module
    for (const [name, size] of Object.entries(knownSizes)) {
      if (module.name.includes(name)) {
        return size;
      }
    }
    
    // Default estimate based on dependencies
    const deps = this.getModuleDependencies(module);
    return 10 + (deps.length * 5); // Base 10KB + 5KB per dependency
  }

  /**
   * Get module dependencies
   */
  getModuleDependencies(module) {
    const depLinks = this.atomspace.getAtoms().filter(atom =>
      atom.type === 'DEPENDS_ON' &&
      atom.outgoing &&
      atom.outgoing[0] === module.id
    );
    
    return depLinks.map(link => {
      const depId = link.outgoing[1];
      return this.atomspace.getAtomById(depId);
    }).filter(Boolean);
  }

  /**
   * Identify code splitting opportunities
   */
  identifyCodeSplittingOpportunities() {
    const opportunities = [];
    
    // Find heavily used modules that could be split
    const heavyModules = this.atomspace.getAtoms().filter(atom =>
      atom.buildData && atom.buildData.isHeavilyUsed
    );
    
    for (const module of heavyModules) {
      const deps = this.getModuleDependencies(module);
      
      if (deps.length > 10) {
        opportunities.push({
          module: module.name,
          type: 'code-splitting',
          reason: `Module has ${deps.length} dependencies`,
          benefit: 'Can improve initial load time',
          suggestion: 'Consider lazy loading or code splitting',
        });
      }
    }
    
    // Find modules that are only used conditionally
    const conditionalModules = this.findConditionalModules();
    for (const module of conditionalModules) {
      opportunities.push({
        module: module.name,
        type: 'lazy-loading',
        reason: 'Module appears to be conditionally used',
        benefit: 'Reduce initial bundle size',
        suggestion: 'Use dynamic import() for lazy loading',
      });
    }
    
    this.codeSplittingOpportunities = opportunities;
  }

  /**
   * Find modules that might be conditionally used
   */
  findConditionalModules() {
    // Heuristic: modules with low usage count might be conditional
    return this.atomspace.getAtoms().filter(atom =>
      atom.buildData &&
      atom.buildData.usageCount > 0 &&
      atom.buildData.usageCount <= 2 &&
      atom.type === 'NPM_MODULE'
    );
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations() {
    const recommendations = [];
    
    // Dead code recommendations
    if (this.deadCode && this.deadCode.length > 0) {
      recommendations.push({
        category: 'dead-code-elimination',
        impact: 'medium',
        modules: this.deadCode.map(d => d.module),
        recommendation: `Remove ${this.deadCode.length} unused module(s)`,
        estimatedSavings: `${this.deadCode.length * 10}KB`,
      });
    }
    
    // Bundle size recommendations
    if (this.bundleAnalysis && this.bundleAnalysis.heavyModules.length > 0) {
      recommendations.push({
        category: 'bundle-size-optimization',
        impact: 'high',
        modules: this.bundleAnalysis.heavyModules.map(m => m.name),
        recommendation: `Optimize ${this.bundleAnalysis.heavyModules.length} large module(s)`,
        estimatedSavings: `${this.bundleAnalysis.heavyModules.reduce((sum, m) => sum + m.estimatedSize * 0.3, 0).toFixed(0)}KB`,
        suggestions: [
          'Consider lighter alternatives',
          'Use tree shaking if available',
          'Import only needed components',
        ],
      });
    }
    
    // Code splitting recommendations
    if (this.codeSplittingOpportunities && this.codeSplittingOpportunities.length > 0) {
      recommendations.push({
        category: 'code-splitting',
        impact: 'high',
        modules: this.codeSplittingOpportunities.map(o => o.module),
        recommendation: `Implement code splitting for ${this.codeSplittingOpportunities.length} module(s)`,
        estimatedSavings: 'Faster initial load time',
        suggestions: [
          'Use dynamic import() for lazy loading',
          'Split routes and components',
          'Consider using React.lazy() or similar',
        ],
      });
    }
    
    // NPM module recommendations
    if (this.bundleAnalysis && this.bundleAnalysis.npmModules > 20) {
      recommendations.push({
        category: 'dependency-management',
        impact: 'medium',
        recommendation: `Review ${this.bundleAnalysis.npmModules} NPM dependencies`,
        suggestions: [
          'Audit dependencies with npm ls',
          'Remove unused dependencies',
          'Consider alternatives to large libraries',
        ],
      });
    }
    
    this.optimizations = recommendations;
    return recommendations;
  }

  /**
   * Get optimization report
   */
  getOptimizationReport() {
    return {
      deadCode: this.deadCode || [],
      bundleAnalysis: this.bundleAnalysis,
      codeSplittingOpportunities: this.codeSplittingOpportunities || [],
      optimizations: this.optimizations,
      summary: {
        deadCodeModules: (this.deadCode || []).length,
        heavyModules: this.bundleAnalysis ? this.bundleAnalysis.heavyModules.length : 0,
        splittingOpportunities: (this.codeSplittingOpportunities || []).length,
        totalRecommendations: this.optimizations.length,
      },
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = super.getStats();
    stats.deadCodeModules = (this.deadCode || []).length;
    stats.optimizations = this.optimizations.length;
    stats.bundleSize = this.bundleAnalysis ? this.bundleAnalysis.estimatedSize : 0;
    return stats;
  }
}

module.exports = BuildOptimizationAgent;
