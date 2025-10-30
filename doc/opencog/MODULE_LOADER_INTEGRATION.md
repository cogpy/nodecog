# OpenCog Module Loader Integration

This document describes the integration of OpenCog's NodeSpace and orchestration system with Node.js's internal module loader.

## Overview

The OpenCog integration automatically tracks module dependencies in real-time as your application loads modules. It creates a cognitive knowledge graph (metagraph) of your module structure, enabling AI-powered analysis and reasoning about code dependencies.

## Features

### Automatic Module Tracking

When enabled, the module loader automatically:
- Registers every loaded module in the NodeSpace
- Tracks dependency relationships between modules
- Classifies modules by type (builtin, npm, local, json)
- Records module exports
- Tracks both CommonJS and ES modules

### Cognitive Analysis

The integrated ModuleAnalyzerAgent can:
- Detect dead code (unused modules)
- Find circular dependencies
- Identify critical modules
- Analyze dependency patterns
- Generate optimization recommendations

### Runtime API

Access the cognitive module graph at runtime:
```javascript
// Get module dependencies
const deps = process.opencog.getModuleDependencies('/path/to/module.js');

// Analyze entire module graph
const stats = process.opencog.analyzeModules();

// Detect circular dependencies
const circles = process.opencog.detectCircularDependencies();

// Access low-level components
const nodespace = process.opencog.nodespace;
const atomspace = process.opencog.atomspace;
const orchestrator = process.opencog.orchestrator;
```

## Configuration

### Environment Variables

#### NODE_OPENCOG_ENABLE

Enable OpenCog module tracking.

```bash
NODE_OPENCOG_ENABLE=1 node app.js
```

**Values:**
- `1` or `true`: Enable OpenCog integration
- Any other value or unset: Disabled (default)

#### NODE_OPENCOG_AUTO_ANALYZE

Enable autonomous cognitive analysis with the ModuleAnalyzerAgent.

```bash
NODE_OPENCOG_ENABLE=1 NODE_OPENCOG_AUTO_ANALYZE=1 node app.js
```

**Values:**
- `1` or `true`: Enable automatic analysis
- Any other value or unset: Disabled (default)

**Note:** Requires `NODE_OPENCOG_ENABLE=1` to work.

### Combined Usage

```bash
# Full cognitive analysis
NODE_OPENCOG_ENABLE=1 NODE_OPENCOG_AUTO_ANALYZE=1 node app.js
```

## How It Works

### CommonJS Module Tracking

The integration hooks into `Module._load()` in the CommonJS module loader. After each module successfully loads:

1. **Module Registration**: The module is registered as a typed atom in the AtomSpace
   - Builtin modules (fs, path, etc.) → `BUILTIN_MODULE` atom type
   - npm packages → `NPM_MODULE` atom type
   - Local files → `LOCAL_MODULE` atom type
   - JSON files → `JSON_MODULE` atom type

2. **Dependency Tracking**: A `DEPENDS_ON` link is created from parent to child module

3. **Export Tracking**: Module exports are registered as `EXPORT_SYMBOL` atoms

### ES Module Tracking

The integration hooks into `ModuleJob` in the ESM loader. After each module is linked:

1. **Module Registration**: Similar to CommonJS, but with ESM metadata
2. **Import Tracking**: All import statements create dependency links
3. **Dynamic Imports**: Also tracked when they occur

### Cognitive Processing

When `NODE_OPENCOG_AUTO_ANALYZE=1`:

1. An `AgentOrchestrator` is created with the `ModuleAnalyzerAgent`
2. The agent periodically analyzes the module graph
3. Attention values are allocated based on module importance
4. Analysis results are available via `process.opencog.analyzeModules()`

## Examples

### Basic Usage

```javascript
// app.js
const fs = require('fs');
const path = require('path');

if (process.opencog) {
  console.log('OpenCog is tracking modules!');
  
  const stats = process.opencog.analyzeModules();
  console.log(`Total modules loaded: ${stats.totalModules}`);
  console.log(`Builtin modules: ${stats.builtinCount}`);
  console.log(`NPM modules: ${stats.npmCount}`);
  console.log(`Local modules: ${stats.localCount}`);
}
```

Run with:
```bash
NODE_OPENCOG_ENABLE=1 node app.js
```

### Dependency Analysis

```javascript
// analyze-deps.js
const myModule = require('./my-module');

if (process.opencog) {
  // Get dependencies of a specific module
  const deps = process.opencog.getModuleDependencies('./my-module.js');
  console.log('Dependencies:', deps.map(d => d.name));
  
  // Detect circular dependencies
  const circular = process.opencog.detectCircularDependencies();
  if (circular.length > 0) {
    console.log('Warning: Circular dependencies detected:');
    circular.forEach(cycle => {
      console.log('  -', cycle.join(' → '));
    });
  }
}
```

Run with:
```bash
NODE_OPENCOG_ENABLE=1 node analyze-deps.js
```

### Cognitive Analysis

```javascript
// cognitive-analysis.js
const express = require('express');
const myApp = require('./app');

if (process.opencog) {
  // Trigger analysis
  const stats = process.opencog.analyzeModules();
  
  console.log('Module Graph Statistics:');
  console.log(`  Total: ${stats.totalModules}`);
  console.log(`  Most important: ${stats.mostAttended?.name}`);
  console.log(`  Max depth: ${stats.maxDependencyDepth}`);
  
  // Access orchestrator for custom agents
  if (process.opencog.orchestrator) {
    console.log('Orchestrator is running');
    const cycleStats = process.opencog.orchestrator.getStatistics();
    console.log(`  Cycles executed: ${cycleStats.totalCycles}`);
  }
}
```

Run with:
```bash
NODE_OPENCOG_ENABLE=1 NODE_OPENCOG_AUTO_ANALYZE=1 node cognitive-analysis.js
```

### Export Graph for Visualization

```javascript
// export-graph.js
require('./app');

if (process.opencog && process.opencog.nodespace) {
  const graph = process.opencog.nodespace.exportGraph();
  
  // Write to file for visualization with D3.js, Cytoscape, etc.
  const fs = require('fs');
  fs.writeFileSync('module-graph.json', JSON.stringify(graph, null, 2));
  console.log('Module graph exported to module-graph.json');
}
```

Run with:
```bash
NODE_OPENCOG_ENABLE=1 node export-graph.js
```

## Performance Considerations

### Overhead

The integration adds minimal overhead:
- **Module registration**: < 1ms per module
- **Dependency tracking**: < 0.5ms per dependency
- **Export tracking**: Proportional to number of exports

### Memory Usage

- AtomSpace default max size: 50,000 atoms
- Typical module: 2-5 atoms (module + dependencies + exports)
- Large application (1000 modules): ~3000-5000 atoms

### When to Enable

**Development**: Always enable for dependency analysis and debugging
```bash
NODE_OPENCOG_ENABLE=1 npm run dev
```

**Testing**: Enable to detect circular dependencies and dead code
```bash
NODE_OPENCOG_ENABLE=1 npm test
```

**Production**: Generally not needed unless you want runtime analysis
- Consider memory overhead
- Analysis can run in background without blocking

## Advanced Usage

### Custom Agents

Add your own cognitive agents:

```javascript
const { Agent } = require('opencog');

class CustomModuleAgent extends Agent {
  constructor() {
    super({
      id: 'custom-module-agent',
      frequency: 1000, // Run every second
      priority: 5,
    });
  }
  
  execute(atomspace, attentionBank) {
    // Your custom analysis logic
    const modules = atomspace.getAllAtoms()
      .filter(a => a.type.includes('MODULE'));
    
    // Do something with modules
    console.log(`Analyzing ${modules.length} modules`);
    
    return {
      success: true,
      modulesAnalyzed: modules.length,
    };
  }
}

// Add to orchestrator
if (process.opencog && process.opencog.orchestrator) {
  const agent = new CustomModuleAgent();
  process.opencog.orchestrator.addAgent(agent);
}
```

### Direct AtomSpace Access

```javascript
if (process.opencog) {
  const { atomspace, nodespace } = process.opencog;
  
  // Query all builtin modules
  const builtins = atomspace.getAllAtoms()
    .filter(a => a.type === 'BUILTIN_MODULE');
  
  console.log('Builtin modules:', builtins.map(a => a.name));
  
  // Find modules with high attention
  const important = atomspace.getAllAtoms()
    .filter(a => a.type.includes('MODULE'))
    .filter(a => a.attention.sti > 50)
    .sort((a, b) => b.attention.sti - a.attention.sti);
  
  console.log('Most important modules:', important.map(a => a.name));
}
```

## Troubleshooting

### OpenCog not available

If `process.opencog` is undefined even with `NODE_OPENCOG_ENABLE=1`:

1. Check if Node.js was built with OpenCog support
2. Verify the `opencog` module is available: `require('opencog')`
3. Ensure environment variable is set before Node.js starts

### Module tracking not working

1. Verify `NODE_OPENCOG_ENABLE=1` is set
2. Check that modules are being loaded (not cached)
3. Look for errors in stderr (integration fails silently by design)

### High memory usage

1. Reduce AtomSpace size in initialization code
2. Disable `NODE_OPENCOG_AUTO_ANALYZE` if not needed
3. Monitor with `process.opencog.atomspace.getStatistics()`

## API Reference

### process.opencog

The global OpenCog integration object.

#### Properties

- `nodespace`: NodeSpace instance tracking modules
- `atomspace`: AtomSpace instance (knowledge graph)
- `orchestrator`: AgentOrchestrator instance (if AUTO_ANALYZE enabled)

#### Methods

##### getModuleDependencies(modulePath)

Get all dependencies of a module.

**Parameters:**
- `modulePath` (string): Path to the module

**Returns:** Array of dependency objects with `name` and `type` properties

##### analyzeModules()

Analyze the entire module graph and return statistics.

**Returns:** Statistics object with:
- `totalModules`: Total number of modules
- `builtinCount`: Number of builtin modules
- `npmCount`: Number of npm modules
- `localCount`: Number of local modules
- `jsonCount`: Number of JSON modules
- `mostAttended`: Most important module
- `maxDependencyDepth`: Maximum dependency chain length

##### detectCircularDependencies()

Find all circular dependency chains.

**Returns:** Array of circular dependency chains (each chain is an array of module paths)

## See Also

- [NodeSpace Documentation](./NODESPACE.md)
- [OpenCog Overview](./README.md)
- [Cognitive Agents](./AGENTS.md)
- [AtomSpace Guide](./ATOMSPACE.md)
