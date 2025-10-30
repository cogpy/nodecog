#!/usr/bin/env node

/**
 * NodeSpace with Cognitive Agent Demonstration
 * 
 * Shows how OpenCog agents can reason about module dependencies
 * using the NodeSpace metagraph representation
 */

'use strict';

const opencog = require('../lib/opencog');
const { ModuleAnalyzerAgent } = opencog;

console.log('='.repeat(70));
console.log('NodeSpace + Cognitive Agent Integration');
console.log('Demonstrating AI-powered Module Analysis');
console.log('='.repeat(70));
console.log();

// Create cognitive system
console.log('1. Creating Cognitive System...');
const system = opencog.createCognitiveSystem({
  atomspace: { maxSize: 10000 },
  nodespace: {
    trackDependencies: true,
    trackExports: true,
    autoAttention: true,
  },
  attention: {
    targetSTI: 1000,
  },
});

const { nodespace, atomspace, attentionBank } = system;
console.log('   ✓ Cognitive system initialized');
console.log();

// Build a complex module structure
console.log('2. Building Module Dependency Graph...');

// Core modules
nodespace.registerModule('fs', 'builtin');
nodespace.registerModule('path', 'builtin');
nodespace.registerModule('http', 'builtin');
nodespace.registerModule('events', 'builtin');

// NPM packages
nodespace.registerModule('express', 'npm', { version: '4.18.0' });
nodespace.registerModule('lodash', 'npm', { version: '4.17.21' });
nodespace.registerModule('axios', 'npm', { version: '1.4.0' });
nodespace.registerModule('moment', 'npm', { version: '2.29.0' });

// Application modules
nodespace.registerModule('/app.js', 'local');
nodespace.registerModule('/routes/api.js', 'local');
nodespace.registerModule('/routes/users.js', 'local');
nodespace.registerModule('/models/user.js', 'local');
nodespace.registerModule('/models/post.js', 'local');
nodespace.registerModule('/utils/validation.js', 'local');
nodespace.registerModule('/utils/database.js', 'local');
nodespace.registerModule('/utils/logger.js', 'local');
nodespace.registerModule('/utils/cache.js', 'local');
nodespace.registerModule('/services/email.js', 'local');
nodespace.registerModule('/services/auth.js', 'local');
nodespace.registerModule('/middleware/cors.js', 'local');
nodespace.registerModule('/config/index.js', 'local');

// Dead module (no dependents)
nodespace.registerModule('/old/deprecated.js', 'local');

console.log(`   ✓ Registered ${nodespace.stats.modulesTracked} modules`);
console.log();

// Create dependencies
console.log('3. Creating Dependency Relationships...');

// Main app dependencies
nodespace.trackDependency('/app.js', 'express');
nodespace.trackDependency('/app.js', '/routes/api.js');
nodespace.trackDependency('/app.js', '/routes/users.js');
nodespace.trackDependency('/app.js', '/middleware/cors.js');
nodespace.trackDependency('/app.js', '/config/index.js');
nodespace.trackDependency('/app.js', '/utils/logger.js');

// Route dependencies
nodespace.trackDependency('/routes/api.js', 'express');
nodespace.trackDependency('/routes/api.js', '/utils/validation.js');
nodespace.trackDependency('/routes/api.js', '/services/auth.js');

nodespace.trackDependency('/routes/users.js', 'express');
nodespace.trackDependency('/routes/users.js', '/models/user.js');
nodespace.trackDependency('/routes/users.js', '/utils/validation.js');
nodespace.trackDependency('/routes/users.js', '/services/auth.js');

// Model dependencies
nodespace.trackDependency('/models/user.js', '/utils/database.js');
nodespace.trackDependency('/models/user.js', 'lodash');
nodespace.trackDependency('/models/user.js', '/utils/validation.js');

nodespace.trackDependency('/models/post.js', '/utils/database.js');
nodespace.trackDependency('/models/post.js', '/models/user.js');
nodespace.trackDependency('/models/post.js', 'moment');

// Service dependencies
nodespace.trackDependency('/services/email.js', 'axios');
nodespace.trackDependency('/services/email.js', '/utils/logger.js');

nodespace.trackDependency('/services/auth.js', '/models/user.js');
nodespace.trackDependency('/services/auth.js', '/utils/cache.js');
nodespace.trackDependency('/services/auth.js', 'lodash');

// Utility dependencies
nodespace.trackDependency('/utils/database.js', 'fs');
nodespace.trackDependency('/utils/database.js', 'path');
nodespace.trackDependency('/utils/database.js', '/utils/logger.js');

nodespace.trackDependency('/utils/logger.js', 'fs');
nodespace.trackDependency('/utils/logger.js', 'path');
nodespace.trackDependency('/utils/logger.js', 'moment');

nodespace.trackDependency('/utils/cache.js', 'lodash');

nodespace.trackDependency('/utils/validation.js', 'lodash');

// Config dependencies
nodespace.trackDependency('/config/index.js', 'fs');
nodespace.trackDependency('/config/index.js', 'path');

// Express internal
nodespace.trackDependency('express', 'http');
nodespace.trackDependency('express', 'events');

// Create a circular dependency for demonstration
nodespace.trackDependency('/utils/cache.js', '/services/auth.js');
// Now: /services/auth.js → /utils/cache.js → /services/auth.js

console.log(`   ✓ Created ${nodespace.stats.dependenciesTracked} dependencies`);
console.log();

// Add the Module Analyzer Agent
console.log('4. Deploying Module Analyzer Agent...');

const analyzerAgent = new ModuleAnalyzerAgent(nodespace);
system.addAgent(analyzerAgent);

console.log('   ✓ Module Analyzer Agent deployed');
console.log();

// Run the agent
console.log('5. Running Cognitive Analysis...');

// Execute the agent manually
const result = analyzerAgent.execute(atomspace, attentionBank);

console.log(`   ✓ Analysis complete (success: ${result.success})`);
console.log();

// Get the analysis report
const report = analyzerAgent.getAnalysisReport();

// Display results
console.log('6. Analysis Results:');
console.log('='.repeat(70));
console.log();

console.log('Summary:');
console.log(`  • Dead Modules: ${report.summary.deadModules}`);
console.log(`  • Circular Dependencies: ${report.summary.circularDeps}`);
console.log(`  • Critical Modules: ${report.summary.criticalModules}`);
console.log(`  • Underutilized Modules: ${report.summary.underutilized}`);
console.log(`  • Dependency Hotspots: ${report.summary.hotspots}`);
console.log();

if (report.details.deadModules.length > 0) {
  console.log('Dead Modules (no dependents):');
  report.details.deadModules.forEach(m => {
    console.log(`  • ${m.path} (${m.type})`);
  });
  console.log();
}

if (report.details.circularDeps.length > 0) {
  console.log('Circular Dependencies:');
  report.details.circularDeps.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.cycle.join(' → ')}`);
    console.log(`     Severity: ${c.severity} modules in cycle`);
  });
  console.log();
}

if (report.details.criticalModules.length > 0) {
  console.log('Critical Modules (heavily depended upon):');
  report.details.criticalModules
    .sort((a, b) => b.dependentCount - a.dependentCount)
    .forEach(m => {
      console.log(`  • ${m.path}`);
      console.log(`    Dependents: ${m.dependentCount}, Attention: ${m.attention}`);
    });
  console.log();
}

if (report.details.hotspots.length > 0) {
  console.log('Dependency Hotspots (many dependencies):');
  report.details.hotspots
    .sort((a, b) => b.dependencyCount - a.dependencyCount)
    .forEach(m => {
      console.log(`  • ${m.path}`);
      console.log(`    Dependencies: ${m.dependencyCount}, Attention: ${m.attention}`);
    });
  console.log();
}

// Recommendations
console.log('7. Cognitive Recommendations:');
console.log('='.repeat(70));
console.log();

report.recommendations.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec.type.toUpperCase()}`);
  console.log(`   Severity: ${rec.severity}`);
  console.log(`   Message: ${rec.message}`);
  console.log(`   Action: ${rec.action}`);
  console.log();
});

// Attention analysis
console.log('8. Attention Allocation:');
console.log('='.repeat(70));
console.log();

const stats = nodespace.getStatistics();
console.log(`Average Attention: ${stats.averageAttention.toFixed(2)}`);
console.log();

console.log('Top 5 Most Important Modules (by attention):');
stats.mostAttended.forEach((m, i) => {
  console.log(`  ${i + 1}. ${m.path} (STI: ${m.sti})`);
});
console.log();

// Demonstrate cognitive reasoning
console.log('9. Cognitive Reasoning Example:');
console.log('='.repeat(70));
console.log();

console.log('Question: "What modules should I focus on for testing?"');
console.log();
console.log('Answer (from cognitive analysis):');

const testPriority = [];

// Critical modules with many dependents
report.details.criticalModules.forEach(m => {
  testPriority.push({
    module: m.path,
    reason: `Critical module with ${m.dependentCount} dependents`,
    priority: 'HIGH',
  });
});

// Modules in circular dependencies
report.details.circularDeps.forEach(c => {
  c.cycle.forEach(path => {
    if (!testPriority.find(t => t.module === path)) {
      testPriority.push({
        module: path,
        reason: 'Part of circular dependency',
        priority: 'HIGH',
      });
    }
  });
});

// Hotspots (complex modules)
report.details.hotspots.forEach(m => {
  if (!testPriority.find(t => t.module === m.path)) {
    testPriority.push({
      module: m.path,
      reason: `Complex module with ${m.dependencyCount} dependencies`,
      priority: 'MEDIUM',
    });
  }
});

testPriority
  .sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  })
  .forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.module}`);
    console.log(`     Priority: ${item.priority}`);
    console.log(`     Reason: ${item.reason}`);
  });

console.log();

console.log('='.repeat(70));
console.log('Demonstration Complete!');
console.log('='.repeat(70));
console.log();
console.log('This demonstrates how OpenCog agents can:');
console.log('✓ Analyze module dependencies using metagraph topology');
console.log('✓ Identify patterns (dead code, circular deps, etc.)');
console.log('✓ Apply attention-based reasoning');
console.log('✓ Generate actionable recommendations');
console.log('✓ Answer complex queries about code structure');
console.log();
