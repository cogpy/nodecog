#!/usr/bin/env node
'use strict';

/**
 * Simple example showing OpenCog NodeSpace tracking module dependencies
 * 
 * This creates a small application with multiple modules and shows how
 * OpenCog automatically tracks the dependency graph.
 * 
 * Run with:
 *   NODE_OPENCOG_ENABLE=1 node examples/simple-app-with-opencog.js
 */

console.log('Simple Application with OpenCog Module Tracking\n');

// Import some core modules
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Create a simple application structure
class MyApp extends EventEmitter {
  constructor() {
    super();
    this.started = false;
  }
  
  start() {
    this.started = true;
    this.emit('started');
    console.log('Application started!');
  }
  
  getStatus() {
    return {
      started: this.started,
      timestamp: Date.now(),
    };
  }
}

// Create and start app
const app = new MyApp();
app.on('started', () => {
  console.log('App is running...\n');
  
  // Show OpenCog tracking if enabled
  if (process.opencog) {
    console.log('━'.repeat(60));
    console.log('OpenCog Module Tracking Report');
    console.log('━'.repeat(60));
    console.log();
    
    // Get statistics
    const stats = process.opencog.analyzeModules();
    
    console.log('Module Statistics:');
    console.log(`  Total modules loaded: ${stats.totalModules}`);
    console.log(`  - Builtin: ${stats.builtinCount}`);
    console.log(`  - NPM: ${stats.npmCount}`);
    console.log(`  - Local: ${stats.localCount}`);
    console.log();
    
    // Show most important modules
    console.log('Module Importance (by attention):');
    const allModules = process.opencog.nodespace.getAllModules();
    const sorted = allModules
      .sort((a, b) => b.attention.sti - a.attention.sti)
      .slice(0, 5);
    
    sorted.forEach((mod, i) => {
      console.log(`  ${i + 1}. ${mod.name} (STI: ${mod.attention.sti})`);
    });
    console.log();
    
    // Show dependencies
    console.log('Module Dependencies:');
    const scriptDeps = process.opencog.getModuleDependencies(process.argv[1]);
    if (scriptDeps && scriptDeps.length > 0) {
      console.log(`  This script depends on ${scriptDeps.length} modules:`);
      scriptDeps.forEach(dep => {
        console.log(`    - ${dep.name}`);
      });
    }
    console.log();
    
    // Check for circular dependencies
    const circular = process.opencog.detectCircularDependencies();
    console.log('Circular Dependencies:');
    if (circular.length > 0) {
      console.log(`  ⚠️  Found ${circular.length} circular dependency chains`);
    } else {
      console.log('  ✓ None detected');
    }
    console.log();
    
    // Show orchestrator status
    if (process.opencog.orchestrator) {
      console.log('Cognitive Analysis:');
      console.log('  ✓ Autonomous analysis is running');
      const orchStats = process.opencog.orchestrator.getStatistics();
      console.log(`  Cycles executed: ${orchStats.totalCycles || 0}`);
      console.log();
    }
    
    console.log('━'.repeat(60));
    console.log();
    
  } else {
    console.log('ℹ️  OpenCog is not enabled');
    console.log('   Run with: NODE_OPENCOG_ENABLE=1 node ' + process.argv[1]);
    console.log();
  }
  
  // Get app status
  const status = app.getStatus();
  console.log('Application Status:');
  console.log('  Started:', status.started);
  console.log('  Time:', new Date(status.timestamp).toISOString());
  console.log();
});

app.start();
