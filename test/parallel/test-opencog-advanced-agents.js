'use strict';

// Test Performance Profiler, Security Analyzer, and Build Optimization Agents

const common = require('../common');
const assert = require('assert');
const { AtomSpace } = require('internal/opencog/atomspace');
const PerformanceProfilerAgent = require('internal/opencog/performance_profiler_agent');
const SecurityAnalyzerAgent = require('internal/opencog/security_analyzer_agent');
const BuildOptimizationAgent = require('internal/opencog/build_optimization_agent');

// Test PerformanceProfilerAgent - Creation
{
  const atomspace = new AtomSpace();
  const agent = new PerformanceProfilerAgent(atomspace);
  
  assert.strictEqual(agent.name, 'PerformanceProfiler');
  assert.ok(agent.frequency > 0);
  assert.ok(agent.priority >= 0);
  
  common.printSkipMessage('PerformanceProfilerAgent creation');
}

// Test PerformanceProfilerAgent - Track Module Load
{
  const atomspace = new AtomSpace();
  const agent = new PerformanceProfilerAgent(atomspace);
  
  agent.trackModuleLoad('test-module', 150);
  agent.trackModuleLoad('test-module', 100);
  agent.trackModuleLoad('test-module', 125);
  
  const data = agent.performanceData.get('test-module');
  assert.ok(data);
  assert.strictEqual(data.loadCount, 3);
  assert.ok(data.averageLoadTime > 0);
  
  common.printSkipMessage('PerformanceProfilerAgent track module load');
}

// Test PerformanceProfilerAgent - Identify Bottlenecks
{
  const atomspace = new AtomSpace();
  const agent = new PerformanceProfilerAgent(atomspace, {
    loadTimeThreshold: 50,
  });
  
  // Add modules with performance data
  const slowModule = atomspace.addAtom('NPM_MODULE', 'slow-module');
  slowModule.performanceData = {
    averageLoadTime: 200,
    loadCount: 5,
    isSlow: true,
  };
  
  const fastModule = atomspace.addAtom('NPM_MODULE', 'fast-module');
  fastModule.performanceData = {
    averageLoadTime: 10,
    loadCount: 3,
    isSlow: false,
  };
  
  agent.identifyBottlenecks();
  
  assert.ok(agent.bottlenecks.length > 0);
  assert.strictEqual(agent.bottlenecks[0].module, 'slow-module');
  
  common.printSkipMessage('PerformanceProfilerAgent identify bottlenecks');
}

// Test PerformanceProfilerAgent - Generate Recommendations
{
  const atomspace = new AtomSpace();
  const agent = new PerformanceProfilerAgent(atomspace);
  
  const slowModule = atomspace.addAtom('NPM_MODULE', 'heavy-lib');
  slowModule.performanceData = {
    averageLoadTime: 300,
    loadCount: 10,
    isSlow: true,
  };
  
  agent.bottlenecks = [{
    module: 'heavy-lib',
    type: 'NPM_MODULE',
    averageLoadTime: 300,
    loadCount: 10,
  }];
  
  const recommendations = agent.generateRecommendations();
  
  assert.ok(recommendations.length > 0);
  assert.ok(recommendations[0].suggestions.length > 0);
  
  common.printSkipMessage('PerformanceProfilerAgent generate recommendations');
}

// Test PerformanceProfilerAgent - Performance Report
{
  const atomspace = new AtomSpace();
  const agent = new PerformanceProfilerAgent(atomspace);
  
  agent.trackModuleLoad('module1', 150);
  agent.bottlenecks = [{ module: 'module1' }];
  agent.recommendations = [{ module: 'module1' }];
  
  const report = agent.getPerformanceReport();
  
  assert.ok(report.bottlenecks);
  assert.ok(report.recommendations);
  assert.strictEqual(report.totalModulesTracked, 1);
  
  common.printSkipMessage('PerformanceProfilerAgent performance report');
}

// Test SecurityAnalyzerAgent - Creation
{
  const atomspace = new AtomSpace();
  const agent = new SecurityAnalyzerAgent(atomspace);
  
  assert.strictEqual(agent.name, 'SecurityAnalyzer');
  assert.ok(agent.frequency > 0);
  assert.ok(agent.priority >= 0);
  
  common.printSkipMessage('SecurityAnalyzerAgent creation');
}

// Test SecurityAnalyzerAgent - Assess Module Security
{
  const atomspace = new AtomSpace();
  const agent = new SecurityAnalyzerAgent(atomspace);
  
  const module = atomspace.addAtom('NPM_MODULE', 'test-package');
  agent.assessModuleSecurity(module);
  
  assert.ok(module.securityData);
  assert.ok(module.securityData.riskLevel);
  assert.ok(module.securityData.lastAnalyzed > 0);
  
  common.printSkipMessage('SecurityAnalyzerAgent assess module security');
}

// Test SecurityAnalyzerAgent - Calculate Risk Score
{
  const atomspace = new AtomSpace();
  const agent = new SecurityAnalyzerAgent(atomspace);
  
  const risks = ['low', 'medium', 'high'];
  const score = agent.calculateRiskScore(risks);
  
  assert.ok(score > 0);
  
  const level = agent.getRiskLevel(score);
  assert.ok(['low', 'medium', 'high', 'critical'].includes(level));
  
  common.printSkipMessage('SecurityAnalyzerAgent calculate risk score');
}

// Test SecurityAnalyzerAgent - Known Vulnerable Pattern
{
  const atomspace = new AtomSpace();
  const agent = new SecurityAnalyzerAgent(atomspace);
  
  assert.ok(agent.isKnownVulnerablePattern('event-stream'));
  assert.ok(!agent.isKnownVulnerablePattern('safe-package'));
  
  common.printSkipMessage('SecurityAnalyzerAgent known vulnerable pattern');
}

// Test SecurityAnalyzerAgent - Circular Dependency Risk
{
  const atomspace = new AtomSpace();
  const agent = new SecurityAnalyzerAgent(atomspace);
  
  const module1 = atomspace.addAtom('LOCAL_MODULE', 'module1');
  const module2 = atomspace.addAtom('LOCAL_MODULE', 'module2');
  
  // Create circular dependency
  atomspace.addAtom('DEPENDS_ON', 'dep1', [module1.id, module2.id]);
  atomspace.addAtom('DEPENDS_ON', 'dep2', [module2.id, module1.id]);
  
  const risk = agent.checkCircularDependencies(module1);
  assert.strictEqual(risk, 'high');
  
  common.printSkipMessage('SecurityAnalyzerAgent circular dependency risk');
}

// Test SecurityAnalyzerAgent - Security Report
{
  const atomspace = new AtomSpace();
  const agent = new SecurityAnalyzerAgent(atomspace);
  
  const module = atomspace.addAtom('NPM_MODULE', 'risky-module');
  module.securityData = {
    riskLevel: 'high',
    issues: [{ type: 'test', severity: 'high' }],
  };
  
  agent.riskLevels.set(module.id, 'high');
  agent.vulnerabilities = [{ module: 'risky-module', riskLevel: 'high' }];
  
  const report = agent.getSecurityReport();
  
  assert.ok(report.vulnerabilities);
  assert.ok(report.riskDistribution);
  assert.strictEqual(report.riskDistribution.high, 1);
  
  common.printSkipMessage('SecurityAnalyzerAgent security report');
}

// Test BuildOptimizationAgent - Creation
{
  const atomspace = new AtomSpace();
  const agent = new BuildOptimizationAgent(atomspace);
  
  assert.strictEqual(agent.name, 'BuildOptimizer');
  assert.ok(agent.frequency > 0);
  assert.ok(agent.priority >= 0);
  
  common.printSkipMessage('BuildOptimizationAgent creation');
}

// Test BuildOptimizationAgent - Calculate Module Usage
{
  const atomspace = new AtomSpace();
  const agent = new BuildOptimizationAgent(atomspace);
  
  const module = atomspace.addAtom('LOCAL_MODULE', 'my-module');
  const dependent1 = atomspace.addAtom('LOCAL_MODULE', 'dep1');
  const dependent2 = atomspace.addAtom('LOCAL_MODULE', 'dep2');
  
  atomspace.addAtom('DEPENDS_ON', 'link1', [dependent1.id, module.id]);
  atomspace.addAtom('DEPENDS_ON', 'link2', [dependent2.id, module.id]);
  
  const usage = agent.calculateModuleUsage(module);
  
  assert.strictEqual(usage.dependentCount, 2);
  
  common.printSkipMessage('BuildOptimizationAgent calculate module usage');
}

// Test BuildOptimizationAgent - Identify Dead Code
{
  const atomspace = new AtomSpace();
  const agent = new BuildOptimizationAgent(atomspace);
  
  const usedModule = atomspace.addAtom('LOCAL_MODULE', 'used');
  usedModule.buildData = { isUnused: false };
  
  const unusedModule = atomspace.addAtom('LOCAL_MODULE', 'unused');
  unusedModule.buildData = { isUnused: true };
  
  agent.identifyDeadCode();
  
  assert.ok(agent.deadCode);
  assert.ok(agent.deadCode.length > 0);
  assert.strictEqual(agent.deadCode[0].module, 'unused');
  
  common.printSkipMessage('BuildOptimizationAgent identify dead code');
}

// Test BuildOptimizationAgent - Estimate Module Size
{
  const atomspace = new AtomSpace();
  const agent = new BuildOptimizationAgent(atomspace);
  
  const momentModule = atomspace.addAtom('NPM_MODULE', 'moment');
  const size = agent.estimateModuleSize(momentModule);
  
  assert.ok(size > 0);
  // moment is known to be large
  assert.ok(size > 50);
  
  common.printSkipMessage('BuildOptimizationAgent estimate module size');
}

// Test BuildOptimizationAgent - Code Splitting Opportunities
{
  const atomspace = new AtomSpace();
  const agent = new BuildOptimizationAgent(atomspace);
  
  const heavyModule = atomspace.addAtom('NPM_MODULE', 'heavy-lib');
  heavyModule.buildData = { isHeavilyUsed: true, usageCount: 10 };
  
  // Add many dependencies
  for (let i = 0; i < 15; i++) {
    const dep = atomspace.addAtom('NPM_MODULE', `dep-${i}`);
    atomspace.addAtom('DEPENDS_ON', `link-${i}`, [heavyModule.id, dep.id]);
  }
  
  agent.identifyCodeSplittingOpportunities();
  
  assert.ok(agent.codeSplittingOpportunities);
  assert.ok(agent.codeSplittingOpportunities.length > 0);
  
  common.printSkipMessage('BuildOptimizationAgent code splitting opportunities');
}

// Test BuildOptimizationAgent - Optimization Report
{
  const atomspace = new AtomSpace();
  const agent = new BuildOptimizationAgent(atomspace);
  
  agent.deadCode = [{ module: 'unused' }];
  agent.bundleAnalysis = {
    totalModules: 10,
    npmModules: 5,
    localModules: 5,
    heavyModules: [{ name: 'heavy', estimatedSize: 200 }],
    estimatedSize: 500,
  };
  agent.optimizations = [{ category: 'test' }];
  
  const report = agent.getOptimizationReport();
  
  assert.ok(report.deadCode);
  assert.ok(report.bundleAnalysis);
  assert.ok(report.optimizations);
  assert.ok(report.summary);
  assert.strictEqual(report.summary.deadCodeModules, 1);
  
  common.printSkipMessage('BuildOptimizationAgent optimization report');
}

// Test BuildOptimizationAgent - Generate Recommendations
{
  const atomspace = new AtomSpace();
  const agent = new BuildOptimizationAgent(atomspace);
  
  agent.deadCode = [{ module: 'unused1' }, { module: 'unused2' }];
  agent.bundleAnalysis = {
    npmModules: 25,
    heavyModules: [
      { name: 'heavy1', estimatedSize: 200 },
      { name: 'heavy2', estimatedSize: 150 },
    ],
  };
  
  const recommendations = agent.generateOptimizationRecommendations();
  
  assert.ok(recommendations.length > 0);
  assert.ok(recommendations.some(r => r.category === 'dead-code-elimination'));
  assert.ok(recommendations.some(r => r.category === 'bundle-size-optimization'));
  
  common.printSkipMessage('BuildOptimizationAgent generate recommendations');
}

common.printSkipMessage('All Advanced Agent tests passed');
