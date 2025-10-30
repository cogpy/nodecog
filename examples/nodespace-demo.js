#!/usr/bin/env node

/**
 * NodeSpace Demonstration
 * 
 * Shows how to use OpenCog's NodeSpace to track and analyze
 * Node.js module dependencies using AtomSpace hypergraph topology
 */

'use strict';

const opencog = require('../lib/opencog');
const { NodeSpaceAtomType } = opencog.NodeSpace;

console.log('='.repeat(70));
console.log('NodeSpace - AtomSpace-based Module Dependency Tracking');
console.log('Demonstration of OpenCog Hypergraph for Node.js Modules');
console.log('='.repeat(70));
console.log();

// Create cognitive system with NodeSpace enabled
console.log('1. Creating Cognitive System with NodeSpace...');
const system = opencog.createCognitiveSystem({
  atomspace: { maxSize: 10000 },
  nodespace: {
    trackDependencies: true,
    trackExports: true,
    autoAttention: true,
  },
});

const { nodespace } = system;
console.log('   ✓ AtomSpace created');
console.log('   ✓ NodeSpace initialized');
console.log();

// Simulate a typical Node.js application structure
console.log('2. Registering Application Modules...');

// Core/builtin modules
nodespace.registerModule('fs', 'builtin', { description: 'File system operations' });
nodespace.registerModule('path', 'builtin', { description: 'Path utilities' });
nodespace.registerModule('http', 'builtin', { description: 'HTTP server' });
nodespace.registerModule('events', 'builtin', { description: 'Event emitter' });

// NPM modules
nodespace.registerModule('express', 'npm', { version: '4.18.0', description: 'Web framework' });
nodespace.registerModule('lodash', 'npm', { version: '4.17.21', description: 'Utility library' });
nodespace.registerModule('axios', 'npm', { version: '1.4.0', description: 'HTTP client' });

// Local application modules
nodespace.registerModule('/app.js', 'local', { description: 'Main application' });
nodespace.registerModule('/routes/api.js', 'local', { description: 'API routes' });
nodespace.registerModule('/routes/users.js', 'local', { description: 'User routes' });
nodespace.registerModule('/models/user.js', 'local', { description: 'User model' });
nodespace.registerModule('/utils/validation.js', 'local', { description: 'Validation utilities' });
nodespace.registerModule('/utils/database.js', 'local', { description: 'Database utilities' });
nodespace.registerModule('/config.json', 'json', { description: 'Application config' });

console.log(`   ✓ Registered ${nodespace.stats.modulesTracked} modules`);
console.log(`     - Builtin: ${nodespace.stats.builtinsTracked}`);
console.log(`     - NPM: ${nodespace.findModulesByType('npm').length}`);
console.log(`     - Local: ${nodespace.findModulesByType('local').length}`);
console.log();

// Track dependencies
console.log('3. Tracking Module Dependencies...');

// Main app dependencies
nodespace.trackDependency('/app.js', 'express', 'require');
nodespace.trackDependency('/app.js', '/routes/api.js', 'require');
nodespace.trackDependency('/app.js', '/routes/users.js', 'require');
nodespace.trackDependency('/app.js', '/config.json', 'require');

// API route dependencies
nodespace.trackDependency('/routes/api.js', 'express', 'require');
nodespace.trackDependency('/routes/api.js', '/utils/validation.js', 'require');

// User route dependencies
nodespace.trackDependency('/routes/users.js', 'express', 'require');
nodespace.trackDependency('/routes/users.js', '/models/user.js', 'require');
nodespace.trackDependency('/routes/users.js', '/utils/validation.js', 'require');

// Model dependencies
nodespace.trackDependency('/models/user.js', '/utils/database.js', 'require');
nodespace.trackDependency('/models/user.js', 'lodash', 'require');

// Utility dependencies
nodespace.trackDependency('/utils/database.js', 'fs', 'require');
nodespace.trackDependency('/utils/database.js', 'path', 'require');
nodespace.trackDependency('/utils/validation.js', 'lodash', 'require');

// Express internal dependencies
nodespace.trackDependency('express', 'http', 'require');
nodespace.trackDependency('express', 'events', 'require');

console.log(`   ✓ Tracked ${nodespace.stats.dependenciesTracked} dependencies`);
console.log();

// Track exports
console.log('4. Tracking Module Exports...');

nodespace.trackExport('/app.js', 'startServer', 'function');
nodespace.trackExport('/routes/api.js', 'apiRouter', 'object');
nodespace.trackExport('/routes/users.js', 'userRouter', 'object');
nodespace.trackExport('/models/user.js', 'User', 'class');
nodespace.trackExport('/models/user.js', 'createUser', 'function');
nodespace.trackExport('/utils/validation.js', 'validateEmail', 'function');
nodespace.trackExport('/utils/validation.js', 'validatePassword', 'function');
nodespace.trackExport('/utils/database.js', 'connect', 'function');
nodespace.trackExport('/utils/database.js', 'query', 'function');

console.log(`   ✓ Tracked ${nodespace.stats.exportsTracked} exports`);
console.log();

// Analyze dependencies
console.log('5. Analyzing Module Dependencies...');

const expressDependents = nodespace.getDependents('express');
console.log(`   ✓ Modules depending on 'express': ${expressDependents.length}`);
expressDependents.forEach(m => {
  console.log(`     - ${m.name}`);
});
console.log();

const validationDependents = nodespace.getDependents('/utils/validation.js');
console.log(`   ✓ Modules using validation utils: ${validationDependents.length}`);
validationDependents.forEach(m => {
  console.log(`     - ${m.name}`);
});
console.log();

// Check dependency chain
console.log('6. Dependency Chain Analysis...');

const chain = nodespace.getDependencyChain('/app.js', 'fs');
if (chain) {
  console.log(`   ✓ Dependency chain from /app.js to fs:`);
  console.log(`     ${chain.join(' → ')}`);
} else {
  console.log('   ! No dependency chain found');
}
console.log();

// Detect circular dependencies
console.log('7. Circular Dependency Detection...');

const circles = nodespace.detectCircularDependencies();
if (circles.length > 0) {
  console.log(`   ⚠ Found ${circles.length} circular dependencies:`);
  circles.forEach((circle, i) => {
    console.log(`     ${i + 1}. ${circle.join(' → ')}`);
  });
} else {
  console.log('   ✓ No circular dependencies detected');
}
console.log();

// Statistics
console.log('8. NodeSpace Statistics...');

const stats = nodespace.getStatistics();
console.log(`   Total Atoms: ${stats.totalAtoms}`);
console.log(`   Modules Tracked: ${stats.modulesTracked}`);
console.log(`   Dependencies Tracked: ${stats.dependenciesTracked}`);
console.log(`   Exports Tracked: ${stats.exportsTracked}`);
console.log(`   Average Attention: ${stats.averageAttention.toFixed(2)}`);
console.log();

console.log('   Most Attended Modules:');
stats.mostAttended.forEach((m, i) => {
  console.log(`     ${i + 1}. ${m.path} (STI: ${m.sti}, Type: ${m.type})`);
});
console.log();

// Module type analysis
console.log('9. Module Type Analysis...');

const builtins = nodespace.findModulesByType('builtin');
const npms = nodespace.findModulesByType('npm');
const locals = nodespace.findModulesByType('local');

console.log(`   Builtin Modules: ${builtins.length}`);
builtins.forEach(m => {
  console.log(`     - ${m.name} (attention: ${m.attention.sti})`);
});
console.log();

console.log(`   NPM Modules: ${npms.length}`);
npms.forEach(m => {
  console.log(`     - ${m.name}`);
});
console.log();

console.log(`   Local Modules: ${locals.length}`);
locals.forEach(m => {
  console.log(`     - ${m.name}`);
});
console.log();

// Export graph
console.log('10. Exporting Dependency Graph...');

const graph = nodespace.exportGraph();
console.log(`   ✓ Graph exported with ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
console.log();

console.log('   Sample Dependency Edges:');
graph.edges.slice(0, 5).forEach(edge => {
  console.log(`     ${edge.fromPath} → ${edge.toPath}`);
});
console.log();

// Query specific modules
console.log('11. Module Query Examples...');

const userModel = nodespace.getModule('/models/user.js');
if (userModel) {
  console.log(`   Module: ${userModel.name}`);
  console.log(`   Type: ${userModel.type}`);
  console.log(`   Attention: STI=${userModel.attention.sti}, LTI=${userModel.attention.lti}`);
  
  const deps = nodespace.getDependencies('/models/user.js');
  console.log(`   Dependencies: ${deps.map(d => d.name).join(', ')}`);
  
  const exports = nodespace.getExports('/models/user.js');
  console.log(`   Exports: ${exports.map(e => e.metadata.name).join(', ')}`);
}
console.log();

// Demonstrate hypergraph structure
console.log('12. Hypergraph Structure...');

console.log('   NodeSpace leverages AtomSpace typed hypergraph:');
console.log('   - Modules are represented as typed atoms (BUILTIN_MODULE, NPM_MODULE, etc.)');
console.log('   - Dependencies are represented as DEPENDS_ON links');
console.log('   - Exports are represented as EXPORTS links to EXPORT_SYMBOL atoms');
console.log('   - Attention values track module importance');
console.log('   - Pattern matching enables complex queries');
console.log();

console.log('   AtomSpace Statistics:');
console.log(`   - Total atoms in space: ${system.atomspace.atoms.size}`);
console.log(`   - Indexed by type: ${system.atomspace.index.byType.size} types`);
console.log(`   - Indexed by name: ${system.atomspace.index.byName.size} names`);
console.log();

// Summary
console.log('='.repeat(70));
console.log('NodeSpace Demonstration Complete!');
console.log('='.repeat(70));
console.log();
console.log('Key Features Demonstrated:');
console.log('✓ Module registration with typed atoms (builtin, npm, local, json)');
console.log('✓ Dependency tracking using hypergraph links');
console.log('✓ Export/import relationship mapping');
console.log('✓ Attention-based importance tracking');
console.log('✓ Dependency chain analysis');
console.log('✓ Circular dependency detection');
console.log('✓ Module type queries');
console.log('✓ Graph export for visualization');
console.log('✓ Integration with OpenCog AtomSpace metagraph topology');
console.log();
console.log('The NodeSpace provides a powerful knowledge graph representation');
console.log('of Node.js module systems, enabling advanced analysis, reasoning,');
console.log('and optimization using OpenCog\'s cognitive architecture.');
console.log();
