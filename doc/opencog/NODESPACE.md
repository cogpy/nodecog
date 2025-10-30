# NodeSpace - OpenCog AtomSpace-based Module System

## Overview

NodeSpace is an innovative module system that leverages OpenCog's AtomSpace hypergraph topology to represent, track, and analyze Node.js modules and their relationships. By mapping modules to atoms and dependencies to links in a typed hypergraph (metagraph), NodeSpace enables sophisticated reasoning and analysis of module structures.

## Concepts

### Metagraph Representation

NodeSpace uses the AtomSpace as a **metagraph** (typed hypergraph) where:

- **Nodes (Atoms)**: Represent modules, exports, and symbols
- **Links**: Represent dependencies, imports, exports, and relationships
- **Types**: Different atom types for different module categories
- **Truth Values**: Confidence and strength of relationships
- **Attention Values**: Importance and usage frequency

### Atom Types

NodeSpace defines specialized atom types for the module system:

#### Module Types
- `BUILTIN_MODULE`: Node.js core modules (fs, path, http, etc.)
- `NPM_MODULE`: External npm packages
- `LOCAL_MODULE`: Local application files
- `JSON_MODULE`: JSON configuration files

#### Relationship Types
- `DEPENDS_ON`: Module A depends on Module B
- `EXPORTS`: Module exports a symbol
- `IMPORTS`: Module imports a symbol
- `REQUIRES`: Module requires another module
- `PARENT_OF`: Parent-child module relationship

#### Symbol Types
- `EXPORT_SYMBOL`: Exported function, class, or object
- `IMPORT_SYMBOL`: Imported symbol reference

## Usage

### Basic Setup

```javascript
const opencog = require('opencog');
const { NodeSpace, NodeSpaceAtomType } = opencog;
const { AtomSpace } = opencog;

// Create AtomSpace and NodeSpace
const atomspace = new AtomSpace();
const nodespace = new NodeSpace(atomspace, {
  trackDependencies: true,
  trackExports: true,
  autoAttention: true,
});
```

### Register Modules

```javascript
// Register builtin module
const fsModule = nodespace.registerModule('fs', 'builtin', {
  description: 'File system operations'
});

// Register npm package
const expressModule = nodespace.registerModule('express', 'npm', {
  version: '4.18.0',
  description: 'Web framework'
});

// Register local module
const appModule = nodespace.registerModule('/app.js', 'local', {
  description: 'Main application'
});
```

### Track Dependencies

```javascript
// Track dependency from app.js to express
nodespace.trackDependency('/app.js', 'express', 'require');

// Track dependency from app.js to fs
nodespace.trackDependency('/app.js', 'fs', 'require');
```

### Track Exports

```javascript
// Track exported function
nodespace.trackExport('/app.js', 'startServer', 'function');

// Track exported class
nodespace.trackExport('/models/user.js', 'User', 'class');

// Track exported object
nodespace.trackExport('/config.js', 'config', 'object');
```

### Query Dependencies

```javascript
// Get all dependencies of a module
const deps = nodespace.getDependencies('/app.js');
console.log('Dependencies:', deps.map(d => d.name));

// Get all modules that depend on this module
const dependents = nodespace.getDependents('express');
console.log('Dependents:', dependents.map(d => d.name));

// Get dependency chain
const chain = nodespace.getDependencyChain('/app.js', 'fs');
console.log('Chain:', chain);
```

### Detect Circular Dependencies

```javascript
const circles = nodespace.detectCircularDependencies();
if (circles.length > 0) {
  console.log('Circular dependencies found:');
  circles.forEach(circle => {
    console.log(circle.join(' → '));
  });
}
```

### Query by Module Type

```javascript
// Find all builtin modules
const builtins = nodespace.findModulesByType('builtin');

// Find all npm modules
const npmModules = nodespace.findModulesByType('npm');

// Find all local modules
const localModules = nodespace.findModulesByType('local');
```

### Export Graph

```javascript
// Export dependency graph as JSON
const graph = nodespace.exportGraph();
console.log(`Nodes: ${graph.nodes.length}`);
console.log(`Edges: ${graph.edges.length}`);

// Can be used for visualization tools
```

### Statistics

```javascript
const stats = nodespace.getStatistics();
console.log('Total modules:', stats.modulesTracked);
console.log('Dependencies:', stats.dependenciesTracked);
console.log('Exports:', stats.exportsTracked);
console.log('Average attention:', stats.averageAttention);
console.log('Most attended:', stats.mostAttended);
console.log('Load order:', stats.loadOrder);
```

## Advanced Features

### Attention Mechanism

NodeSpace integrates with OpenCog's attention allocation system:

- **STI (Short-Term Importance)**: Recently accessed or important modules
- **LTI (Long-Term Importance)**: Historically important modules
- **Attention Spreading**: Importance propagates through dependencies

```javascript
// Builtin modules automatically get higher attention
const fsAtom = nodespace.getModule('fs');
console.log('STI:', fsAtom.attention.sti); // Higher value

// Attention spreads through dependencies
nodespace.trackDependency('/app.js', 'express');
// express gains attention from app.js
```

### Metadata Storage

Store rich metadata with modules:

```javascript
nodespace.registerModule('mypackage', 'npm', {
  version: '2.1.0',
  author: 'John Doe',
  license: 'MIT',
  repository: 'https://github.com/user/repo',
  description: 'My awesome package',
  keywords: ['awesome', 'package'],
});

const module = nodespace.getModule('mypackage');
console.log(module.metadata);
```

### Event System

Listen to NodeSpace events:

```javascript
nodespace.on('module-registered', (event) => {
  console.log('Module registered:', event.path);
});

nodespace.on('dependency-tracked', (event) => {
  console.log('Dependency:', event.from, '→', event.to);
});

nodespace.on('export-tracked', (event) => {
  console.log('Export:', event.module, '::', event.export);
});

nodespace.on('cleared', () => {
  console.log('NodeSpace cleared');
});
```

## Integration with Cognitive System

NodeSpace can be integrated with the full OpenCog cognitive system:

```javascript
const system = opencog.createCognitiveSystem({
  atomspace: { maxSize: 10000 },
  attention: { targetSTI: 5000 },
  nodespace: {
    trackDependencies: true,
    trackExports: true,
    autoAttention: true,
  },
  cognitiveLoop: { cycleInterval: 100 }
});

// NodeSpace is automatically created
const { nodespace, atomspace, attentionBank } = system;

// Register modules
nodespace.registerModule('/app.js', 'local');

// Attention is managed by the attention bank
attentionBank.spreadAttention();
attentionBank.decayAttention(0.9);

// Agents can reason about modules
class ModuleAnalyzerAgent extends opencog.Agent {
  execute(atomspace, attentionBank) {
    // Analyze module relationships
    const focusModules = atomspace.getAttentionalFocus(10);
    // Process modules with high attention
  }
}

system.addAgent(new ModuleAnalyzerAgent());
system.start();
```

## Architecture

### Hypergraph Structure

```
MODULE(fs)
  ├─ type: BUILTIN_MODULE
  ├─ attention: { sti: 50, lti: 30, vlti: true }
  └─ incoming: [DEPENDS_ON links from other modules]

MODULE(/app.js)
  ├─ type: LOCAL_MODULE
  ├─ attention: { sti: 10, lti: 5, vlti: false }
  ├─ metadata: { type: 'local', path: '/app.js', ... }
  └─ outgoing: []
  
DEPENDS_ON(/app.js, fs)
  ├─ type: DEPENDS_ON
  ├─ outgoing: [MODULE(/app.js), MODULE(fs)]
  ├─ truthValue: { strength: 1.0, confidence: 0.9 }
  └─ metadata: { importType: 'require', timestamp: ... }

EXPORT_SYMBOL(/app.js::startServer)
  ├─ type: EXPORT_SYMBOL
  ├─ metadata: { name: 'startServer', type: 'function' }
  └─ incoming: [EXPORTS link from MODULE(/app.js)]
```

### Benefits of Metagraph Representation

1. **Rich Type System**: Different atom types for different module categories
2. **Flexible Relationships**: Multiple link types for different relationships
3. **Probabilistic Reasoning**: Truth values for uncertain dependencies
4. **Attention Economics**: Track module importance dynamically
5. **Pattern Matching**: Query complex dependency patterns
6. **Extensibility**: Easy to add new atom types and relationships
7. **Cognitive Integration**: Works with full OpenCog architecture

## Configuration Options

```javascript
const nodespace = new NodeSpace(atomspace, {
  // Enable/disable dependency tracking
  trackDependencies: true,
  
  // Enable/disable export tracking
  trackExports: true,
  
  // Enable/disable builtin module tracking
  trackBuiltins: true,
  
  // Enable/disable automatic attention allocation
  autoAttention: true,
});
```

## API Reference

### NodeSpace Methods

- `registerModule(path, type, metadata)` - Register a module
- `trackDependency(from, to, importType)` - Track dependency
- `trackExport(module, exportName, exportType)` - Track export
- `getModule(path)` - Get module atom
- `getDependencies(path)` - Get module dependencies
- `getDependents(path)` - Get modules depending on this
- `getExports(path)` - Get module exports
- `findModulesByType(type)` - Find modules by type
- `getDependencyChain(from, to)` - Get dependency chain
- `detectCircularDependencies()` - Find circular dependencies
- `getStatistics()` - Get statistics
- `exportGraph()` - Export as JSON graph
- `clear()` - Clear all data

### Events

- `module-registered` - When a module is registered
- `dependency-tracked` - When a dependency is tracked
- `export-tracked` - When an export is tracked
- `cleared` - When NodeSpace is cleared

## Example Use Cases

### 1. Dependency Analysis

Analyze module dependencies to understand application structure:

```javascript
const stats = nodespace.getStatistics();
const mostUsed = stats.mostAttended;
console.log('Most used modules:', mostUsed);
```

### 2. Dead Code Detection

Find modules with no dependents:

```javascript
const allModules = nodespace.getAllModules();
const deadModules = allModules.filter(m => {
  return nodespace.getDependents(m.name).length === 0;
});
```

### 3. Bundle Optimization

Identify core dependencies for bundling:

```javascript
const coreModules = nodespace.findModulesByType('builtin');
const npmModules = nodespace.findModulesByType('npm');
// Analyze which npm modules are most depended upon
```

### 4. Refactoring Support

Find all uses of a module before refactoring:

```javascript
const dependents = nodespace.getDependents('/utils/old-api.js');
console.log('Modules to update:', dependents.map(d => d.name));
```

## See Also

- [AtomSpace Documentation](../opencog/README.md)
- [OpenCog Architecture](../opencog/README.md)
- [Examples](../../examples/nodespace-demo.js)

## License

Part of Node.js OpenCog implementation - MIT License
