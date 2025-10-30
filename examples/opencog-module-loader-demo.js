#!/usr/bin/env node
'use strict';

/**
 * OpenCog Module Loader Integration Demo
 * 
 * This example demonstrates how OpenCog's NodeSpace automatically integrates
 * with Node.js's module loader to track dependencies in real-time.
 * 
 * Run with:
 *   NODE_OPENCOG_ENABLE=1 node examples/opencog-module-loader-demo.js
 * 
 * With autonomous analysis:
 *   NODE_OPENCOG_ENABLE=1 NODE_OPENCOG_AUTO_ANALYZE=1 node examples/opencog-module-loader-demo.js
 */

console.log('='.repeat(70));
console.log('OpenCog Module Loader Integration Demo');
console.log('='.repeat(70));
console.log();

// Check if OpenCog is enabled
if (!process.env.NODE_OPENCOG_ENABLE) {
  console.log('⚠️  OpenCog is not enabled!');
  console.log('Run with: NODE_OPENCOG_ENABLE=1 node ' + process.argv[1]);
  process.exit(1);
}

console.log('1. Loading modules...');
console.log();

// Load various types of modules
const fs = require('fs');
const path = require('path');
const util = require('util');
const events = require('events');

console.log('   ✓ Loaded: fs (builtin)');
console.log('   ✓ Loaded: path (builtin)');
console.log('   ✓ Loaded: util (builtin)');
console.log('   ✓ Loaded: events (builtin)');
console.log();

// Check if OpenCog is tracking
console.log('2. Checking OpenCog integration...');
console.log();

if (process.opencog) {
  console.log('   ✓ OpenCog is active and tracking!');
  console.log();
  
  // Show available API
  console.log('3. Available OpenCog API:');
  console.log();
  console.log('   - process.opencog.nodespace');
  console.log('   - process.opencog.atomspace');
  console.log('   - process.opencog.getModuleDependencies(path)');
  console.log('   - process.opencog.analyzeModules()');
  console.log('   - process.opencog.detectCircularDependencies()');
  
  if (process.opencog.orchestrator) {
    console.log('   - process.opencog.orchestrator (autonomous analysis enabled)');
  }
  console.log();
  
  // Get statistics
  console.log('4. Module Graph Statistics:');
  console.log();
  
  const stats = process.opencog.analyzeModules();
  console.log(`   Total modules tracked: ${stats.totalModules}`);
  console.log(`   Builtin modules: ${stats.builtinCount}`);
  console.log(`   NPM modules: ${stats.npmCount}`);
  console.log(`   Local modules: ${stats.localCount}`);
  console.log(`   JSON modules: ${stats.jsonCount}`);
  
  if (stats.mostAttended) {
    console.log(`   Most important: ${stats.mostAttended.name} (attention: ${stats.mostAttended.attention.sti})`);
  }
  
  if (stats.maxDependencyDepth !== undefined) {
    console.log(`   Max dependency depth: ${stats.maxDependencyDepth}`);
  }
  console.log();
  
  // Get dependencies of a specific module
  console.log('5. Analyzing \'fs\' module dependencies:');
  console.log();
  
  const fsDeps = process.opencog.getModuleDependencies('fs');
  if (fsDeps && fsDeps.length > 0) {
    console.log(`   'fs' has ${fsDeps.length} dependencies:`);
    fsDeps.slice(0, 5).forEach(dep => {
      console.log(`   - ${dep.name} (${dep.type})`);
    });
    if (fsDeps.length > 5) {
      console.log(`   ... and ${fsDeps.length - 5} more`);
    }
  } else {
    console.log('   \'fs\' has no tracked dependencies (it\'s a builtin)');
  }
  console.log();
  
  // Check for circular dependencies
  console.log('6. Checking for circular dependencies:');
  console.log();
  
  const circular = process.opencog.detectCircularDependencies();
  if (circular.length > 0) {
    console.log(`   ⚠️  Found ${circular.length} circular dependency chains:`);
    circular.forEach((chain, i) => {
      console.log(`   ${i + 1}. ${chain.join(' → ')}`);
    });
  } else {
    console.log('   ✓ No circular dependencies detected');
  }
  console.log();
  
  // Show orchestrator status if enabled
  if (process.opencog.orchestrator) {
    console.log('7. Orchestrator Status:');
    console.log();
    console.log('   ✓ Autonomous analysis is enabled');
    
    const orchStats = process.opencog.orchestrator.getStatistics();
    console.log(`   Agents deployed: ${orchStats.totalAgents || 0}`);
    console.log(`   Cycles executed: ${orchStats.totalCycles || 0}`);
    
    if (orchStats.totalCycles > 0) {
      console.log(`   Average cycle time: ${orchStats.averageCycleTime.toFixed(2)}ms`);
    }
    console.log();
  }
  
  // Export graph
  console.log('8. Exporting module graph:');
  console.log();
  
  const graph = process.opencog.nodespace.exportGraph();
  console.log(`   Graph has ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
  
  // Optionally save to file
  if (process.argv.includes('--save')) {
    fs.writeFileSync('module-graph.json', JSON.stringify(graph, null, 2));
    console.log('   ✓ Saved to module-graph.json');
  } else {
    console.log('   (Use --save flag to export to file)');
  }
  console.log();
  
  // Show example graph structure
  console.log('9. Example Graph Structure:');
  console.log();
  console.log('   Sample nodes:');
  graph.nodes.slice(0, 3).forEach(node => {
    console.log(`   - ${node.name} (${node.type})`);
  });
  console.log();
  
  if (graph.edges.length > 0) {
    console.log('   Sample edges:');
    graph.edges.slice(0, 3).forEach(edge => {
      console.log(`   - ${edge.from} → ${edge.to} (${edge.type})`);
    });
    console.log();
  }
  
} else {
  console.log('   ✗ OpenCog is not active');
  console.log();
  console.log('   Possible reasons:');
  console.log('   - OpenCog module not built into this Node.js');
  console.log('   - NODE_OPENCOG_ENABLE environment variable not set');
  console.log('   - Error during initialization (check stderr)');
  console.log();
}

console.log('='.repeat(70));
console.log('Demo Complete');
console.log('='.repeat(70));
console.log();

// Show usage hints
if (process.opencog) {
  console.log('Try these commands in your code:');
  console.log();
  console.log('  // Get dependencies of any module');
  console.log('  const deps = process.opencog.getModuleDependencies("/path/to/module");');
  console.log();
  console.log('  // Get overall statistics');
  console.log('  const stats = process.opencog.analyzeModules();');
  console.log();
  console.log('  // Detect circular dependencies');
  console.log('  const circles = process.opencog.detectCircularDependencies();');
  console.log();
  console.log('  // Access raw NodeSpace');
  console.log('  const graph = process.opencog.nodespace.exportGraph();');
  console.log();
  console.log('See doc/opencog/MODULE_LOADER_INTEGRATION.md for more details.');
  console.log();
}
