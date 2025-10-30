'use strict';

/**
 * Tests for NodeSpace - OpenCog AtomSpace-based Module System
 */

const common = require('../common');
const assert = require('assert');
const opencog = require('../../lib/opencog');
const { AtomSpace, NodeSpace } = opencog;
const { NodeSpaceAtomType } = NodeSpace;

// Test 1: NodeSpace creation
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  assert.ok(nodespace instanceof NodeSpace);
  assert.strictEqual(nodespace.atomspace, atomspace);
  assert.strictEqual(nodespace.stats.modulesTracked, 0);
}

// Test 2: Module registration
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  const moduleAtom = nodespace.registerModule('/path/to/module.js', 'local');
  
  assert.ok(moduleAtom);
  assert.strictEqual(moduleAtom.type, NodeSpaceAtomType.LOCAL_MODULE);
  assert.strictEqual(moduleAtom.name, '/path/to/module.js');
  assert.strictEqual(nodespace.stats.modulesTracked, 1);
}

// Test 3: Builtin module registration
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  const builtinAtom = nodespace.registerModule('fs', 'builtin');
  
  assert.ok(builtinAtom);
  assert.strictEqual(builtinAtom.type, NodeSpaceAtomType.BUILTIN_MODULE);
  assert.strictEqual(nodespace.stats.builtinsTracked, 1);
  // Builtins should have higher attention
  assert.ok(builtinAtom.attention.sti > 0);
}

// Test 4: Dependency tracking
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  const moduleA = nodespace.registerModule('/app.js', 'local');
  const moduleB = nodespace.registerModule('/utils.js', 'local');
  
  const depLink = nodespace.trackDependency('/app.js', '/utils.js', 'require');
  
  assert.ok(depLink);
  assert.strictEqual(depLink.type, NodeSpaceAtomType.DEPENDS_ON);
  assert.strictEqual(nodespace.stats.dependenciesTracked, 1);
  
  // Verify dependency graph
  const deps = nodespace.getDependencies('/app.js');
  assert.strictEqual(deps.length, 1);
  assert.strictEqual(deps[0].name, '/utils.js');
}

// Test 5: Export tracking
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  nodespace.registerModule('/module.js', 'local');
  const exportAtom = nodespace.trackExport('/module.js', 'myFunction', 'function');
  
  assert.ok(exportAtom);
  assert.strictEqual(exportAtom.type, NodeSpaceAtomType.EXPORT_SYMBOL);
  assert.strictEqual(nodespace.stats.exportsTracked, 1);
  
  // Verify exports
  const exports = nodespace.getExports('/module.js');
  assert.strictEqual(exports.length, 1);
  assert.strictEqual(exports[0].metadata.name, 'myFunction');
}

// Test 6: Get dependents
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  nodespace.registerModule('/app.js', 'local');
  nodespace.registerModule('/utils.js', 'local');
  nodespace.registerModule('/helpers.js', 'local');
  
  nodespace.trackDependency('/app.js', '/utils.js');
  nodespace.trackDependency('/helpers.js', '/utils.js');
  
  const dependents = nodespace.getDependents('/utils.js');
  assert.strictEqual(dependents.length, 2);
}

// Test 7: Find modules by type
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  nodespace.registerModule('fs', 'builtin');
  nodespace.registerModule('path', 'builtin');
  nodespace.registerModule('/app.js', 'local');
  nodespace.registerModule('express', 'npm');
  
  const builtins = nodespace.findModulesByType('builtin');
  assert.strictEqual(builtins.length, 2);
  
  const locals = nodespace.findModulesByType('local');
  assert.strictEqual(locals.length, 1);
  
  const npms = nodespace.findModulesByType('npm');
  assert.strictEqual(npms.length, 1);
}

// Test 8: Dependency chain
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  nodespace.registerModule('/a.js', 'local');
  nodespace.registerModule('/b.js', 'local');
  nodespace.registerModule('/c.js', 'local');
  
  nodespace.trackDependency('/a.js', '/b.js');
  nodespace.trackDependency('/b.js', '/c.js');
  
  const chain = nodespace.getDependencyChain('/a.js', '/c.js');
  assert.ok(chain);
  assert.strictEqual(chain.length, 3);
  assert.deepStrictEqual(chain, ['/a.js', '/b.js', '/c.js']);
}

// Test 9: Circular dependency detection
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  nodespace.registerModule('/a.js', 'local');
  nodespace.registerModule('/b.js', 'local');
  nodespace.registerModule('/c.js', 'local');
  
  // Create circular dependency: a -> b -> c -> a
  nodespace.trackDependency('/a.js', '/b.js');
  nodespace.trackDependency('/b.js', '/c.js');
  nodespace.trackDependency('/c.js', '/a.js');
  
  const circles = nodespace.detectCircularDependencies();
  assert.ok(circles.length > 0);
  assert.ok(circles[0].includes('/a.js'));
  assert.ok(circles[0].includes('/b.js'));
  assert.ok(circles[0].includes('/c.js'));
}

// Test 10: Statistics
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  nodespace.registerModule('fs', 'builtin');
  nodespace.registerModule('/app.js', 'local');
  nodespace.trackDependency('/app.js', 'fs');
  nodespace.trackExport('/app.js', 'main', 'function');
  
  const stats = nodespace.getStatistics();
  assert.strictEqual(stats.modulesTracked, 2);
  assert.strictEqual(stats.dependenciesTracked, 1);
  assert.strictEqual(stats.exportsTracked, 1);
  assert.strictEqual(stats.builtinsTracked, 1);
  assert.ok(stats.totalAtoms > 0);
  assert.ok(Array.isArray(stats.loadOrder));
  assert.strictEqual(stats.loadOrder.length, 2);
}

// Test 11: Export graph
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  nodespace.registerModule('/a.js', 'local');
  nodespace.registerModule('/b.js', 'local');
  nodespace.trackDependency('/a.js', '/b.js');
  
  const graph = nodespace.exportGraph();
  assert.ok(graph.nodes);
  assert.ok(graph.edges);
  assert.strictEqual(graph.nodes.length, 2);
  assert.strictEqual(graph.edges.length, 1);
  assert.strictEqual(graph.edges[0].fromPath, '/a.js');
  assert.strictEqual(graph.edges[0].toPath, '/b.js');
}

// Test 12: Clear NodeSpace
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  nodespace.registerModule('/app.js', 'local');
  nodespace.registerModule('/utils.js', 'local');
  
  assert.strictEqual(nodespace.stats.modulesTracked, 2);
  
  nodespace.clear();
  
  assert.strictEqual(nodespace.stats.modulesTracked, 0);
  assert.strictEqual(nodespace.moduleRegistry.size, 0);
  assert.strictEqual(nodespace.loadOrder.length, 0);
}

// Test 13: Events
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  let moduleRegisteredEvent = null;
  let dependencyTrackedEvent = null;
  let exportTrackedEvent = null;
  
  nodespace.on('module-registered', (event) => {
    moduleRegisteredEvent = event;
  });
  
  nodespace.on('dependency-tracked', (event) => {
    dependencyTrackedEvent = event;
  });
  
  nodespace.on('export-tracked', (event) => {
    exportTrackedEvent = event;
  });
  
  const moduleA = nodespace.registerModule('/app.js', 'local');
  assert.ok(moduleRegisteredEvent);
  assert.strictEqual(moduleRegisteredEvent.path, '/app.js');
  
  const moduleB = nodespace.registerModule('/utils.js', 'local');
  nodespace.trackDependency('/app.js', '/utils.js');
  assert.ok(dependencyTrackedEvent);
  assert.strictEqual(dependencyTrackedEvent.from, '/app.js');
  assert.strictEqual(dependencyTrackedEvent.to, '/utils.js');
  
  nodespace.trackExport('/app.js', 'main');
  assert.ok(exportTrackedEvent);
  assert.strictEqual(exportTrackedEvent.module, '/app.js');
  assert.strictEqual(exportTrackedEvent.export, 'main');
}

// Test 14: Module metadata
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  const metadata = {
    version: '1.0.0',
    author: 'test',
    description: 'Test module',
  };
  
  const moduleAtom = nodespace.registerModule('/app.js', 'local', metadata);
  
  assert.ok(moduleAtom.metadata);
  assert.strictEqual(moduleAtom.metadata.version, '1.0.0');
  assert.strictEqual(moduleAtom.metadata.author, 'test');
  assert.strictEqual(moduleAtom.metadata.type, 'local');
}

// Test 15: Attention spreading
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace, { autoAttention: true });
  
  const moduleA = nodespace.registerModule('/app.js', 'local');
  const moduleB = nodespace.registerModule('/utils.js', 'local');
  
  // Set high attention on moduleA
  moduleA.attention.sti = 100;
  
  // Track dependency - should spread attention
  nodespace.trackDependency('/app.js', '/utils.js');
  
  // moduleB should have gained some attention
  assert.ok(moduleB.attention.sti > 10);
}

// Test 16: Disable tracking options
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace, {
    trackDependencies: false,
    trackExports: false,
  });
  
  nodespace.registerModule('/app.js', 'local');
  nodespace.registerModule('/utils.js', 'local');
  
  const depLink = nodespace.trackDependency('/app.js', '/utils.js');
  assert.strictEqual(depLink, null);
  
  const exportAtom = nodespace.trackExport('/app.js', 'main');
  assert.strictEqual(exportAtom, null);
}

// Test 17: Duplicate module registration
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  const atom1 = nodespace.registerModule('/app.js', 'local');
  const atom2 = nodespace.registerModule('/app.js', 'local');
  
  // Should return the same atom
  assert.strictEqual(atom1, atom2);
  assert.strictEqual(nodespace.stats.modulesTracked, 1);
}

// Test 18: Most attended modules
{
  const atomspace = new AtomSpace();
  const nodespace = new NodeSpace(atomspace);
  
  const m1 = nodespace.registerModule('/a.js', 'local');
  const m2 = nodespace.registerModule('/b.js', 'local');
  const m3 = nodespace.registerModule('/c.js', 'local');
  
  m1.attention.sti = 100;
  m2.attention.sti = 50;
  m3.attention.sti = 25;
  
  const stats = nodespace.getStatistics();
  assert.ok(stats.mostAttended);
  assert.strictEqual(stats.mostAttended[0].path, '/a.js');
  assert.strictEqual(stats.mostAttended[1].path, '/b.js');
}

console.log('All NodeSpace tests passed!');
