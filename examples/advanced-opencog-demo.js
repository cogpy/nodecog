#!/usr/bin/env node
'use strict';

/**
 * Advanced OpenCog Features Demonstration
 * 
 * This example demonstrates the new Phase 3 features:
 * - PLN (Probabilistic Logic Networks) for reasoning
 * - Temporal reasoning for time-based knowledge
 * - Performance profiling integration
 * - Security vulnerability analysis
 * - Build optimization recommendations
 */

const opencog = require('opencog');
const { AtomType } = require('internal/opencog/atomspace');

console.log('='.repeat(70));
console.log('OpenCog Phase 3: Advanced Features Demonstration');
console.log('='.repeat(70));
console.log();

// Create cognitive system
console.log('1. Creating Cognitive System with Advanced Components...');
const system = opencog.createCognitiveSystem({
  atomspace: { maxSize: 10000 },
  attention: { targetSTI: 5000 },
  cognitiveLoop: { cycleInterval: 100 },
});

console.log('   ✓ AtomSpace created');
console.log('   ✓ AttentionBank initialized');
console.log('   ✓ AgentOrchestrator configured');
console.log();

// Demonstrate PLN (Probabilistic Logic Networks)
console.log('2. Demonstrating PLN (Probabilistic Logic Networks)...');
const { PLNEngine, TruthValue, PLNRules } = opencog.PLN;

const plnEngine = new PLNEngine(system.atomspace, {
  minConfidence: 0.1,
  minStrength: 0.01,
  maxInferences: 20,
});

// Create knowledge base with probabilistic truth values
const cat = system.atomspace.addAtom(AtomType.CONCEPT, 'cat');
const mammal = system.atomspace.addAtom(AtomType.CONCEPT, 'mammal');
const animal = system.atomspace.addAtom(AtomType.CONCEPT, 'animal');
const vertebrate = system.atomspace.addAtom(AtomType.CONCEPT, 'vertebrate');

// Add implications with truth values
system.atomspace.addAtom(
  AtomType.IMPLICATION,
  'cat-mammal',
  [cat, mammal],
  { strength: 0.98, confidence: 0.95 }
);

system.atomspace.addAtom(
  AtomType.IMPLICATION,
  'mammal-vertebrate',
  [mammal, vertebrate],
  { strength: 0.99, confidence: 0.98 }
);

system.atomspace.addAtom(
  AtomType.IMPLICATION,
  'vertebrate-animal',
  [vertebrate, animal],
  { strength: 1.0, confidence: 0.99 }
);

console.log('   ✓ Created knowledge base with probabilistic truth values');

// Run PLN inference
const inferences = plnEngine.forwardChain(5);
console.log(`   ✓ Performed ${inferences.length} probabilistic inferences`);

// Show some inferred knowledge
if (inferences.length > 0) {
  console.log('   ✓ Sample inferences:');
  for (const inf of inferences.slice(0, 3)) {
    console.log(`     - ${inf.rule}: ${inf.truthValue.toString()}`);
  }
}

const plnStats = plnEngine.getStats();
console.log(`   ✓ Total inferences performed: ${plnStats.inferencesPerformed}`);
console.log();

// Demonstrate Temporal Reasoning
console.log('3. Demonstrating Temporal Reasoning System...');
const { TemporalEngine } = opencog.Temporal;

const temporalEngine = new TemporalEngine(system.atomspace, {
  decayRate: 0.01,
  temporalWindow: 86400000, // 24 hours
});

// Add temporal events
const now = Date.now();
const event1 = temporalEngine.addEvent('system_start', now - 3600000, now - 3599000, {
  type: 'lifecycle',
  importance: 'high',
});

const event2 = temporalEngine.addEvent('module_load', now - 1800000, now - 1799000, {
  type: 'performance',
  module: 'express',
});

const event3 = temporalEngine.addEvent('security_scan', now - 900000, now - 899000, {
  type: 'security',
  status: 'completed',
});

console.log('   ✓ Created 3 temporal events');

// Create temporal relationships
const links = temporalEngine.createTemporalLinks();
console.log(`   ✓ Created ${links.length} temporal relationship links`);

// Get temporal statistics
const tempStats = temporalEngine.getStats();
console.log(`   ✓ Event count: ${tempStats.eventCount}`);
console.log(`   ✓ Time span: ${(tempStats.timeSpan / 1000 / 60).toFixed(1)} minutes`);

// Apply temporal decay
event1.attentionValue = { sti: 100, lti: 50, vlti: false };
event2.attentionValue = { sti: 100, lti: 50, vlti: false };
event3.attentionValue = { sti: 100, lti: 50, vlti: false };

temporalEngine.applyTemporalDecay();
console.log('   ✓ Applied temporal attention decay');
console.log(`     - Older event STI: ${event1.attentionValue.sti.toFixed(2)}`);
console.log(`     - Recent event STI: ${event3.attentionValue.sti.toFixed(2)}`);
console.log();

// Demonstrate Performance Profiling
console.log('4. Demonstrating Performance Profiling Integration...');
const PerformanceProfilerAgent = opencog.PerformanceProfilerAgent;

const perfAgent = new PerformanceProfilerAgent(system.atomspace, {
  loadTimeThreshold: 100,
});

// Simulate module loads with performance data
const express = system.atomspace.addAtom('NPM_MODULE', 'express');
const lodash = system.atomspace.addAtom('NPM_MODULE', 'lodash');
const myApp = system.atomspace.addAtom('LOCAL_MODULE', './app.js');

perfAgent.trackModuleLoad('express', 250);
perfAgent.trackModuleLoad('express', 230);
perfAgent.trackModuleLoad('lodash', 85);
perfAgent.trackModuleLoad('./app.js', 45);

console.log('   ✓ Tracked module load times');

// Run performance analysis
perfAgent.execute();

const perfReport = perfAgent.getPerformanceReport();
console.log(`   ✓ Identified ${perfReport.bottlenecks.length} performance bottlenecks`);

if (perfReport.bottlenecks.length > 0) {
  console.log('   ✓ Top bottlenecks:');
  for (const bottleneck of perfReport.bottlenecks.slice(0, 3)) {
    console.log(`     - ${bottleneck.module}: ${bottleneck.averageLoadTime.toFixed(2)}ms average`);
  }
}

console.log(`   ✓ Generated ${perfReport.recommendations.length} optimization recommendations`);
console.log();

// Demonstrate Security Analysis
console.log('5. Demonstrating Security Vulnerability Analysis...');
const SecurityAnalyzerAgent = opencog.SecurityAnalyzerAgent;

const secAgent = new SecurityAnalyzerAgent(system.atomspace);

// Add modules with varying security profiles
const safePackage = system.atomspace.addAtom('NPM_MODULE', 'safe-package');
const riskyPackage = system.atomspace.addAtom('NPM_MODULE', 'event-stream'); // Known vulnerable

// Create some dependencies
system.atomspace.addAtom('DEPENDS_ON', 'dep1', [myApp.id, express.id]);
system.atomspace.addAtom('DEPENDS_ON', 'dep2', [myApp.id, lodash.id]);
system.atomspace.addAtom('DEPENDS_ON', 'dep3', [myApp.id, riskyPackage.id]);

console.log('   ✓ Created dependency graph');

// Run security analysis
secAgent.execute();

const secReport = secAgent.getSecurityReport();
console.log(`   ✓ Analyzed ${secReport.totalModulesAnalyzed} modules for security`);
console.log('   ✓ Risk distribution:');
console.log(`     - Critical: ${secReport.riskDistribution.critical}`);
console.log(`     - High: ${secReport.riskDistribution.high}`);
console.log(`     - Medium: ${secReport.riskDistribution.medium}`);
console.log(`     - Low: ${secReport.riskDistribution.low}`);

if (secReport.vulnerabilities.length > 0) {
  console.log(`   ✓ Found ${secReport.vulnerabilities.length} security concerns`);
  for (const vuln of secReport.vulnerabilities.slice(0, 2)) {
    console.log(`     - ${vuln.module}: ${vuln.riskLevel} risk`);
  }
}
console.log();

// Demonstrate Build Optimization
console.log('6. Demonstrating Build Optimization Analysis...');
const BuildOptimizationAgent = opencog.BuildOptimizationAgent;

const buildAgent = new BuildOptimizationAgent(system.atomspace);

// Add more modules for realistic analysis
const unusedModule = system.atomspace.addAtom('LOCAL_MODULE', './unused.js');
const heavyLib = system.atomspace.addAtom('NPM_MODULE', 'moment');

// Run build optimization analysis
buildAgent.execute();

const buildReport = buildAgent.getOptimizationReport();
console.log(`   ✓ Analyzed ${buildReport.bundleAnalysis.totalModules} modules`);
console.log(`   ✓ Estimated bundle size: ${buildReport.bundleAnalysis.estimatedSize}KB`);

if (buildReport.deadCode && buildReport.deadCode.length > 0) {
  console.log(`   ✓ Found ${buildReport.deadCode.length} unused modules`);
}

if (buildReport.bundleAnalysis.heavyModules.length > 0) {
  console.log(`   ✓ Heavy modules detected:`);
  for (const mod of buildReport.bundleAnalysis.heavyModules.slice(0, 3)) {
    console.log(`     - ${mod.name}: ~${mod.estimatedSize}KB`);
  }
}

console.log(`   ✓ Generated ${buildReport.optimizations.length} optimization strategies`);
console.log();

// Deploy all agents to orchestrator
console.log('7. Deploying Advanced Agents to Orchestrator...');
system.addAgent(perfAgent);
system.addAgent(secAgent);
system.addAgent(buildAgent);

console.log('   ✓ PerformanceProfilerAgent deployed');
console.log('   ✓ SecurityAnalyzerAgent deployed');
console.log('   ✓ BuildOptimizationAgent deployed');
console.log();

// Run a few cognitive cycles
console.log('8. Running Autonomous Cognitive Cycles...');
console.log('   Running 5 cycles with all agents...');

let cycleCount = 0;
system.cognitiveLoop.on('cycle', () => {
  cycleCount++;
  if (cycleCount >= 5) {
    system.stop();
  }
});

system.start();

// Wait for cycles to complete
setTimeout(() => {
  console.log(`   ✓ Completed ${cycleCount} cognitive cycles`);
  console.log();
  
  // Display final statistics
  console.log('9. Final System Statistics');
  console.log('   =========================');
  
  const atomCount = system.atomspace.getAtoms().length;
  console.log(`   Total atoms in knowledge base: ${atomCount}`);
  
  const orchestratorStats = system.orchestrator.getStats();
  console.log(`   Agent executions: ${orchestratorStats.totalExecutions}`);
  console.log(`   Average cycle time: ${orchestratorStats.averageExecutionTime.toFixed(2)}ms`);
  
  console.log();
  console.log('10. Key Recommendations Summary');
  console.log('    ============================');
  
  // Performance recommendations
  if (perfReport.recommendations.length > 0) {
    console.log('    Performance:');
    for (const rec of perfReport.recommendations.slice(0, 2)) {
      console.log(`    - ${rec.issue}`);
      if (rec.suggestions.length > 0) {
        console.log(`      → ${rec.suggestions[0]}`);
      }
    }
  }
  
  // Security recommendations
  if (secReport.recommendations.length > 0) {
    console.log('    Security:');
    for (const rec of secReport.recommendations.slice(0, 2)) {
      console.log(`    - ${rec.module}: ${rec.riskLevel} risk`);
      if (rec.recommendations.length > 0) {
        console.log(`      → ${rec.recommendations[0]}`);
      }
    }
  }
  
  // Build optimization recommendations
  if (buildReport.optimizations.length > 0) {
    console.log('    Build Optimization:');
    for (const opt of buildReport.optimizations.slice(0, 2)) {
      console.log(`    - ${opt.recommendation}`);
      if (opt.suggestions && opt.suggestions.length > 0) {
        console.log(`      → ${opt.suggestions[0]}`);
      }
    }
  }
  
  console.log();
  console.log('='.repeat(70));
  console.log('Demonstration Complete!');
  console.log('='.repeat(70));
  console.log();
  console.log('Phase 3 Features Demonstrated:');
  console.log('✓ PLN (Probabilistic Logic Networks)');
  console.log('✓ Temporal Reasoning');
  console.log('✓ Performance Profiling');
  console.log('✓ Security Analysis');
  console.log('✓ Build Optimization');
  console.log();
  console.log('All advanced cognitive features are working together autonomously!');
  console.log();
  
}, 1000);
