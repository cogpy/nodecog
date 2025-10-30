# NodeSpace: OpenCog Metagraph Implementation for Node.js Modules

## Problem Statement

> Derive optimal opencog 'nodespace' implementation of node modules considering how the opencog atomspace is a metagraph (typed hypergraph) and how node types etc can be implemented using the atomspace knowledge graph topology

## Solution Overview

NodeSpace is a novel implementation that maps Node.js module system concepts to OpenCog's AtomSpace metagraph (typed hypergraph) topology. This creates a knowledge graph representation of module dependencies, enabling sophisticated reasoning and analysis.

## Metagraph Architecture

### What is a Metagraph?

A **metagraph** (or typed hypergraph) is a generalization of a graph where:
- **Nodes (Atoms)** have types (not just labels)
- **Edges (Links)** can connect any number of nodes (not just two)
- **Types** form a hierarchy and enable specialized reasoning
- **Attributes** store metadata (truth values, attention values)

### NodeSpace Metagraph Structure

NodeSpace leverages this metagraph topology to represent the Node.js module system:

```
┌─────────────────────────────────────────────────────────────┐
│                    AtomSpace Metagraph                       │
│                                                               │
│  ┌────────────────┐         ┌────────────────┐              │
│  │  MODULE Atoms  │         │  LINK Atoms    │              │
│  │                │         │                │              │
│  │ BUILTIN_MODULE │────────▶│ DEPENDS_ON     │              │
│  │ NPM_MODULE     │         │ EXPORTS        │              │
│  │ LOCAL_MODULE   │         │ IMPORTS        │              │
│  │ JSON_MODULE    │         │ REQUIRES       │              │
│  └────────────────┘         └────────────────┘              │
│          │                          │                        │
│          │                          │                        │
│          ▼                          ▼                        │
│  ┌────────────────┐         ┌────────────────┐              │
│  │   Attributes   │         │   Attributes   │              │
│  │                │         │                │              │
│  │ • Attention    │         │ • Truth Values │              │
│  │ • Metadata     │         │ • Import Type  │              │
│  │ • Load Time    │         │ • Timestamp    │              │
│  └────────────────┘         └────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Type System Mapping

### Module Types → Atom Types

Node.js has different categories of modules. NodeSpace maps each to a specialized atom type:

| Node.js Concept | AtomSpace Type | Example |
|----------------|----------------|---------|
| Core module | `BUILTIN_MODULE` | fs, path, http |
| npm package | `NPM_MODULE` | express, lodash |
| Local file | `LOCAL_MODULE` | /app.js, /lib/utils.js |
| JSON file | `JSON_MODULE` | package.json, config.json |

### Relationships → Link Types

Module relationships are represented as typed links:

| Relationship | AtomSpace Link Type | Semantics |
|-------------|---------------------|-----------|
| Dependency | `DEPENDS_ON(A, B)` | A requires/imports B |
| Export | `EXPORTS(M, S)` | Module M exports symbol S |
| Import | `IMPORTS(M, S)` | Module M imports symbol S |
| Parent | `PARENT_OF(A, B)` | A is parent module of B |

## Hypergraph Representation

Traditional graphs have edges connecting exactly two nodes. Hypergraphs allow edges (links) to connect any number of nodes, enabling complex relationships:

```javascript
// Traditional graph: A → B (edge connects 2 nodes)

// Hypergraph: DEPENDS_ON(A, B, C, D) (link connects N nodes)
// Example: Module A transitively depends on B, C, and D
```

NodeSpace uses this capability for:

1. **Multi-way dependencies**: Express that module A depends on B through C
2. **Export bundles**: Group related exports together
3. **Import resolution**: Track complex import patterns

## Knowledge Graph Topology

The topology (structure) of the knowledge graph enables powerful queries:

### 1. Dependency Chains

Find the path from one module to another:

```
/app.js → express → http → events
```

### 2. Dependency Trees

Visualize the complete dependency tree:

```
/app.js
├── express
│   ├── http
│   └── events
├── /config.json
└── /routes/api.js
    └── /utils/validation.js
```

### 3. Circular Dependencies

Detect cycles in the dependency graph:

```
A → B → C → A  (circular!)
```

### 4. Attention Flow

Track importance through the graph:

```
express (STI: 100)
  ↓ spreads attention (20%)
http (STI: 20)
  ↓ spreads attention (20%)
events (STI: 4)
```

## Implementation Highlights

### 1. Typed Atoms for Modules

```javascript
// Creating a builtin module atom
const fsModule = atomspace.addAtom(
  NodeSpaceAtomType.BUILTIN_MODULE,
  'fs',
  [],
  { strength: 1.0, confidence: 1.0 }
);

// Higher attention for builtins
fsModule.attention.sti = 50;
fsModule.attention.lti = 30;
fsModule.attention.vlti = true; // Very long-term important
```

### 2. Typed Links for Dependencies

```javascript
// Creating a dependency link
const dependencyLink = atomspace.addAtom(
  NodeSpaceAtomType.DEPENDS_ON,
  'app-depends-on-fs',
  [appModule, fsModule],
  { strength: 1.0, confidence: 0.9 }
);

// Store metadata
dependencyLink.metadata = {
  importType: 'require',
  timestamp: Date.now()
};
```

### 3. Attention Economics

Modules receive attention based on:
- **Type**: Builtin modules get more attention
- **Usage**: Frequently depended-upon modules gain attention
- **Recency**: Recently loaded modules have higher STI
- **Importance**: User-marked important modules have high LTI

```javascript
// Attention spreads through dependencies
nodespace.trackDependency('/app.js', 'express');
// express gains 20% of app.js's attention
```

### 4. Pattern Matching

Query the metagraph for patterns:

```javascript
// Find all modules that depend on 'express'
const pattern = {
  type: NodeSpaceAtomType.DEPENDS_ON,
  outgoing: [anyModule, expressModule]
};
const matches = atomspace.patternMatch(pattern);
```

## Benefits of Metagraph Representation

### 1. **Rich Type System**
Different atom types enable specialized behavior:
- Builtin modules get automatic VLTI flag
- NPM modules track versions
- Local modules track file paths

### 2. **Flexible Relationships**
Multiple link types express different semantics:
- `DEPENDS_ON` for runtime dependencies
- `EXPORTS` for public API
- `IMPORTS` for what's used

### 3. **Probabilistic Reasoning**
Truth values represent uncertainty:
- Strength: How strong is the dependency?
- Confidence: How sure are we about it?

### 4. **Attention Economics**
Automatically track what's important:
- Core dependencies get high attention
- Rarely used modules fade
- Critical paths maintain importance

### 5. **Cognitive Integration**
Works with full OpenCog architecture:
- Agents can reason about modules
- Inference can find indirect dependencies
- Learning can optimize load order

### 6. **Query Power**
Complex graph queries become simple:
- "Find all modules in this dependency chain"
- "What's the most important module?"
- "Are there any circular dependencies?"

## Usage Example

```javascript
const opencog = require('opencog');

// Create system with NodeSpace
const system = opencog.createCognitiveSystem({
  atomspace: { maxSize: 10000 },
  nodespace: {
    trackDependencies: true,
    trackExports: true,
    autoAttention: true
  }
});

const { nodespace } = system;

// Register modules (creates typed atoms)
nodespace.registerModule('fs', 'builtin');
nodespace.registerModule('express', 'npm');
nodespace.registerModule('/app.js', 'local');

// Track dependencies (creates typed links)
nodespace.trackDependency('/app.js', 'express');
nodespace.trackDependency('/app.js', 'fs');
nodespace.trackDependency('express', 'http');

// Track exports
nodespace.trackExport('/app.js', 'startServer', 'function');

// Query the metagraph
const deps = nodespace.getDependencies('/app.js');
console.log('Dependencies:', deps.map(d => d.name));

const chain = nodespace.getDependencyChain('/app.js', 'http');
console.log('Chain:', chain);

const circles = nodespace.detectCircularDependencies();
console.log('Circular deps:', circles);

// Attention-based queries
const stats = nodespace.getStatistics();
console.log('Most important:', stats.mostAttended);
```

## Advanced Features

### 1. Export Symbol Tracking

```javascript
// Export symbols are also atoms
nodespace.trackExport('/user.js', 'User', 'class');
nodespace.trackExport('/user.js', 'createUser', 'function');

// Query what a module exports
const exports = nodespace.getExports('/user.js');
```

### 2. Dependency Analysis

```javascript
// Find what depends on a module
const dependents = nodespace.getDependents('express');

// Find dependency chain
const chain = nodespace.getDependencyChain('/app.js', 'events');

// Detect circular dependencies
const cycles = nodespace.detectCircularDependencies();
```

### 3. Graph Export

```javascript
// Export as JSON for visualization
const graph = nodespace.exportGraph();
// Use with D3.js, Cytoscape, etc.
```

## Integration with OpenCog Agents

Agents can reason about modules:

```javascript
class ModuleOptimizerAgent extends Agent {
  execute(atomspace, attentionBank) {
    // Find modules with low attention
    const lowAttention = atomspace.getAllAtoms()
      .filter(a => a.attention.sti < 10)
      .filter(a => a.type.includes('MODULE'));
    
    // Maybe they're dead code?
    for (const module of lowAttention) {
      const dependents = nodespace.getDependents(module.name);
      if (dependents.length === 0) {
        console.log('Dead code:', module.name);
      }
    }
  }
}
```

## Conclusion

NodeSpace demonstrates how OpenCog's metagraph (typed hypergraph) topology can be leveraged to create an intelligent module system. By representing modules as typed atoms and dependencies as typed links, we gain:

1. **Rich semantic representation** of module relationships
2. **Powerful query capabilities** through graph topology
3. **Attention-based importance tracking**
4. **Integration with cognitive architecture** for reasoning
5. **Extensibility** through type system

This approach shows how OpenCog's knowledge representation can be applied to practical software engineering problems, making the module system itself a subject of cognitive reasoning.

## See Also

- [NodeSpace API Documentation](./doc/opencog/NODESPACE.md)
- [OpenCog Documentation](./doc/opencog/README.md)
- [Examples](./examples/nodespace-demo.js)
