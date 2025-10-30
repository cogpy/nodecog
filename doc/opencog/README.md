# OpenCog Autonomous Multi-Agent Orchestration System

A pure Node.js implementation of an OpenCog-inspired autonomous multi-agent cognitive architecture for knowledge representation, reasoning, and autonomous operation.

## Overview

This system provides a complete cognitive architecture with the following components:

- **AtomSpace**: Hypergraph knowledge representation system
- **AttentionBank**: Economic attention allocation mechanism (ECAN-inspired)
- **Agent Framework**: Base class for cognitive agents with autonomous operation
- **AgentOrchestrator**: Multi-agent scheduling and coordination
- **CognitiveLoop**: Autonomous cognitive cycle manager
- **NodeSpace**: AtomSpace-based module system for Node.js (NEW)

## Components

### AtomSpace
Hypergraph knowledge representation using typed atoms and links.

### AttentionBank
Economic attention allocation inspired by OpenCog's ECAN.

### Agent System
Base class for cognitive agents with autonomous scheduling.

### AgentOrchestrator
Multi-agent coordination and execution.

### CognitiveLoop
Autonomous cognitive cycle management.

### NodeSpace
**NEW**: OpenCog AtomSpace-based module dependency tracking system that represents Node.js modules as a typed hypergraph (metagraph). See [NodeSpace Documentation](./NODESPACE.md) for details.

Key features:
- Modules as typed atoms (BUILTIN_MODULE, NPM_MODULE, LOCAL_MODULE)
- Dependencies as typed links (DEPENDS_ON, EXPORTS, IMPORTS)
- Attention-based importance tracking
- Circular dependency detection
- Dependency chain analysis
- Graph export for visualization

## Features

### 1. Hypergraph Knowledge Representation (AtomSpace)

The AtomSpace is a weighted, labeled hypergraph for representing knowledge:

- **Nodes**: Concepts, predicates, variables
- **Links**: Relationships, implications, evaluations
- **Truth Values**: Strength and confidence for probabilistic reasoning
- **Attention Values**: Short-term (STI) and long-term (LTI) importance
- **Pattern Matching**: Query and retrieve knowledge patterns
- **Automatic Forgetting**: Memory management based on attention values

### 2. Economic Attention Allocation (ECAN)

Inspired by OpenCog's ECAN (Economic Attention Networks):

- **STI (Short-Term Importance)**: Focus of current cognitive processes
- **LTI (Long-Term Importance)**: Long-term relevance and value
- **VLTI (Very Long-Term Important)**: Protection from forgetting
- **Attention Spreading**: Importance propagates through the hypergraph
- **Decay and Normalization**: Maintains attention economy
- **Attentional Focus**: Identifies most important atoms

### 3. Multi-Agent Orchestration

Coordinated execution of cognitive agents:

- **Priority-based Scheduling**: Agents execute based on priority
- **Frequency Control**: Agents can run at different frequencies
- **Concurrent Execution**: Batch execution with configurable concurrency
- **Dynamic Agent Management**: Add/remove agents at runtime
- **Performance Monitoring**: Track agent execution statistics

### 4. Autonomous Cognitive Loop

Continuous autonomous operation:

- **Configurable Cycle Interval**: Control thinking speed
- **Auto Decay**: Automatic attention decay over time
- **Auto Normalization**: Maintains attention economy
- **Pause/Resume**: Control execution flow
- **Event System**: Monitor cognitive processes
- **Max Cycles**: Limit for batch operations

### 5. Built-in Cognitive Agents

Ready-to-use agents for common cognitive tasks:

- **InferenceAgent**: Forward chaining logical inference
- **AttentionAllocationAgent**: Spreads attention through the hypergraph
- **PatternMinerAgent**: Discovers frequent patterns in knowledge

## Quick Start

```javascript
const opencog = require('opencog');
const { AtomType } = require('internal/opencog/atomspace');

// Create cognitive system
const system = opencog.createCognitiveSystem({
  atomspace: { maxSize: 10000 },
  attention: { targetSTI: 5000 },
  cognitiveLoop: { cycleInterval: 100 }
});

// Add knowledge
const cat = system.atomspace.addAtom(AtomType.CONCEPT, 'cat');
const animal = system.atomspace.addAtom(AtomType.CONCEPT, 'animal');
system.atomspace.addAtom(AtomType.INHERITANCE, 'cat-is-animal', 
  [cat, animal], { strength: 0.9, confidence: 0.9 });

// Add agents and start
system.addAgent(new opencog.Agent.InferenceAgent());
system.start();
```

## Running the Demo

```bash
node examples/opencog-demo.js
```

## Documentation

See the full documentation in `/doc/opencog/` for detailed API reference and usage examples.

## Architecture

```
Cognitive Loop → Agent Orchestrator → [Agents] → AtomSpace + AttentionBank
```

## License

MIT License (same as Node.js)
