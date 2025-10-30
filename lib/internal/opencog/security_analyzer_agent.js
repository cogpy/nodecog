'use strict';

// Security Analysis Agent
// Analyzes dependencies for security vulnerabilities and risks

const Agent = require('./agent');

/**
 * Security Vulnerability Scanner Agent
 * Analyzes module dependencies for security risks
 */
class SecurityAnalyzerAgent extends Agent {
  constructor(atomspace, options = {}) {
    super(atomspace, {
      name: 'SecurityAnalyzer',
      frequency: options.frequency || 60000, // Run every minute
      priority: options.priority || 8,
    });
    
    this.vulnerabilities = [];
    this.riskLevels = new Map();
    this.knownVulnerablePatterns = [
      // Patterns that indicate potential security issues
      { pattern: /eval\s*\(/, risk: 'high', issue: 'Use of eval()' },
      { pattern: /exec\s*\(/, risk: 'high', issue: 'Use of exec()' },
      { pattern: /Function\s*\(/, risk: 'medium', issue: 'Dynamic function creation' },
      { pattern: /__proto__/, risk: 'high', issue: 'Prototype pollution risk' },
      { pattern: /innerHTML/, risk: 'medium', issue: 'XSS risk' },
    ];
  }

  /**
   * Execute security analysis
   */
  execute() {
    this.analyzeModuleDependencies();
    this.assessDependencyRisks();
    this.identifyVulnerablePatterns();
    this.updateSecurityAttention();
    this.generateSecurityRecommendations();
  }

  /**
   * Analyze module dependencies for security
   */
  analyzeModuleDependencies() {
    const modules = this.atomspace.getAtoms().filter(atom =>
      atom.type && (
        atom.type === 'NPM_MODULE' ||
        atom.type === 'LOCAL_MODULE'
      )
    );
    
    for (const module of modules) {
      this.assessModuleSecurity(module);
    }
  }

  /**
   * Assess security of a module
   */
  assessModuleSecurity(module) {
    if (!module.securityData) {
      module.securityData = {
        riskLevel: 'unknown',
        issues: [],
        lastAnalyzed: Date.now(),
      };
    }
    
    // Check dependency depth
    const depthRisk = this.assessDependencyDepth(module);
    
    // Check for circular dependencies (security implication)
    const circularRisk = this.checkCircularDependencies(module);
    
    // Assess based on module type
    let typeRisk = 'low';
    if (module.type === 'NPM_MODULE') {
      // NPM modules have higher risk due to supply chain
      typeRisk = 'medium';
    }
    
    // Calculate overall risk
    const risks = [depthRisk, circularRisk, typeRisk];
    const riskScore = this.calculateRiskScore(risks);
    
    module.securityData.riskLevel = this.getRiskLevel(riskScore);
    module.securityData.riskScore = riskScore;
    module.securityData.lastAnalyzed = Date.now();
    
    this.riskLevels.set(module.id, module.securityData.riskLevel);
  }

  /**
   * Assess risk based on dependency depth
   */
  assessDependencyDepth(module) {
    const dependencies = this.getModuleDependencies(module);
    const depth = dependencies.length;
    
    if (depth > 20) return 'high';
    if (depth > 10) return 'medium';
    return 'low';
  }

  /**
   * Check for circular dependencies (potential security issue)
   */
  checkCircularDependencies(module) {
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (moduleId) => {
      if (recursionStack.has(moduleId)) return true;
      if (visited.has(moduleId)) return false;
      
      visited.add(moduleId);
      recursionStack.add(moduleId);
      
      const deps = this.getModuleDependencies({ id: moduleId });
      for (const dep of deps) {
        if (hasCycle(dep.id)) return true;
      }
      
      recursionStack.delete(moduleId);
      return false;
    };
    
    return hasCycle(module.id) ? 'high' : 'low';
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
   * Calculate risk score from risk levels
   */
  calculateRiskScore(risks) {
    const scores = { low: 1, medium: 5, high: 10, critical: 20 };
    let total = 0;
    for (const risk of risks) {
      total += scores[risk] || 0;
    }
    return total / risks.length;
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score >= 15) return 'critical';
    if (score >= 8) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Assess dependency risks
   */
  assessDependencyRisks() {
    const npmModules = this.atomspace.getAtoms().filter(atom =>
      atom.type === 'NPM_MODULE'
    );
    
    for (const module of npmModules) {
      // Check for known vulnerable package patterns
      if (this.isKnownVulnerablePattern(module.name)) {
        if (!module.securityData.issues) {
          module.securityData.issues = [];
        }
        module.securityData.issues.push({
          type: 'known-vulnerability',
          severity: 'high',
          description: 'Module name matches known vulnerable pattern',
        });
        module.securityData.riskLevel = 'high';
      }
      
      // Check for outdated or unmaintained indicators
      if (this.isPotentiallyUnmaintained(module.name)) {
        if (!module.securityData.issues) {
          module.securityData.issues = [];
        }
        module.securityData.issues.push({
          type: 'maintenance-risk',
          severity: 'medium',
          description: 'Module may be unmaintained',
        });
      }
    }
  }

  /**
   * Check if module name matches known vulnerable patterns
   */
  isKnownVulnerablePattern(name) {
    // Simple heuristics - in real implementation, this would check against
    // a database of known vulnerabilities
    const suspiciousPatterns = [
      /event-stream/, // Historical npm incident
      /flatmap-stream/,
      /getcookies/,
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Check if module is potentially unmaintained
   */
  isPotentiallyUnmaintained(name) {
    // Heuristic: very short names or deprecated patterns
    return name.length <= 2;
  }

  /**
   * Identify vulnerable code patterns
   */
  identifyVulnerablePatterns() {
    // This would analyze source code if available
    // For now, we'll mark modules with high-risk dependencies
    const modules = this.atomspace.getAtoms().filter(atom =>
      atom.securityData && atom.securityData.riskLevel === 'high'
    );
    
    for (const module of modules) {
      this.vulnerabilities.push({
        module: module.name,
        type: module.type,
        riskLevel: module.securityData.riskLevel,
        issues: module.securityData.issues || [],
      });
    }
  }

  /**
   * Update attention based on security risks
   */
  updateSecurityAttention() {
    const modules = this.atomspace.getAtoms().filter(atom =>
      atom.securityData
    );
    
    for (const module of modules) {
      const riskLevel = module.securityData.riskLevel;
      let stiBoost = 0;
      
      switch (riskLevel) {
        case 'critical':
          stiBoost = 200;
          break;
        case 'high':
          stiBoost = 100;
          break;
        case 'medium':
          stiBoost = 50;
          break;
        case 'low':
          stiBoost = 10;
          break;
      }
      
      if (module.attentionValue && stiBoost > 0) {
        module.attentionValue.sti += stiBoost;
      }
    }
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations() {
    const recommendations = [];
    
    for (const vuln of this.vulnerabilities) {
      const rec = {
        module: vuln.module,
        riskLevel: vuln.riskLevel,
        issues: vuln.issues,
        recommendations: [],
      };
      
      // Generate specific recommendations
      if (vuln.type === 'NPM_MODULE') {
        rec.recommendations.push('Run npm audit to check for known vulnerabilities');
        rec.recommendations.push('Consider updating to latest version');
        rec.recommendations.push('Check GitHub security advisories');
      }
      
      if (vuln.issues.length > 0) {
        rec.recommendations.push('Review security issues identified');
        rec.recommendations.push('Consider alternative packages');
      }
      
      if (vuln.riskLevel === 'critical' || vuln.riskLevel === 'high') {
        rec.recommendations.push('URGENT: Address high-risk security issues immediately');
        rec.recommendations.push('Consider removing this dependency if possible');
      }
      
      recommendations.push(rec);
    }
    
    this.recommendations = recommendations;
    return recommendations;
  }

  /**
   * Get security report
   */
  getSecurityReport() {
    const riskDistribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
    };
    
    for (const [, level] of this.riskLevels) {
      riskDistribution[level]++;
    }
    
    return {
      vulnerabilities: this.vulnerabilities,
      recommendations: this.recommendations || [],
      riskDistribution: riskDistribution,
      totalModulesAnalyzed: this.riskLevels.size,
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = super.getStats();
    stats.vulnerabilities = this.vulnerabilities.length;
    stats.recommendations = this.recommendations ? this.recommendations.length : 0;
    stats.modulesAnalyzed = this.riskLevels.size;
    return stats;
  }
}

module.exports = SecurityAnalyzerAgent;
