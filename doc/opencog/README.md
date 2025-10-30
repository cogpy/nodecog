# OpenCog Autonomous Multi-Agent Orchestration System

A pure Node.js implementation of an OpenCog-inspired autonomous multi-agent cognitive architecture for knowledge representation, reasoning, and autonomous operation.

## Overview

This system provides a complete cognitive architecture with the following components:

### Core Components
- **AtomSpace**: Hypergraph knowledge representation system
- **AttentionBank**: Economic attention allocation mechanism (ECAN-inspired)
- **Agent Framework**: Base class for cognitive agents with autonomous operation
- **AgentOrchestrator**: Multi-agent scheduling and coordination
- **CognitiveLoop**: Autonomous cognitive cycle manager
- **NodeSpace**: AtomSpace-based module system for Node.js

### Phase 3 Advanced Features (NEW)
- **PLN (Probabilistic Logic Networks)**: Advanced probabilistic reasoning
- **Temporal Reasoning**: Time-based knowledge and inference
- **Performance Profiling**: Automatic performance analysis
- **Security Analysis**: Vulnerability detection and risk assessment
- **Build Optimization**: Code structure analysis and recommendations

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

### 6. Module Loader Integration

**NEW**: Automatic integration with Node.js module loader for real-time dependency tracking:

- **Automatic Tracking**: All loaded modules are tracked in NodeSpace
- **Real-time Dependencies**: Dependency graph built as modules load
- **Type Detection**: Automatic classification (builtin, npm, local, json)
- **Export Tracking**: Module exports registered in AtomSpace
- **ESM Support**: Both CommonJS and ES modules tracked
- **Runtime API**: Access module graph via `process.opencog`
- **Cognitive Analysis**: Optional autonomous analysis with ModuleAnalyzerAgent

Enable with environment variables:
```bash
# Enable module tracking
NODE_OPENCOG_ENABLE=1 node app.js

# Enable with autonomous analysis
NODE_OPENCOG_ENABLE=1 NODE_OPENCOG_AUTO_ANALYZE=1 node app.js
```

See [Module Loader Integration Guide](./MODULE_LOADER_INTEGRATION.md) for complete documentation.

### 7. PLN (Probabilistic Logic Networks) - Phase 3

**NEW**: Advanced probabilistic reasoning with truth values:

- **Truth Values**: Strength and confidence for probabilistic inference
- **Inference Rules**: Deduction, induction, abduction, revision, and more
- **Forward Chaining**: Automatic inference generation
- **Query System**: Probabilistic pattern matching

See [Phase 3 Features Documentation](./PHASE3_FEATURES.md) for complete guide.

```javascript
const { PLNEngine, TruthValue } = require('opencog').PLN;

const engine = new PLNEngine(atomspace, {
  minConfidence: 0.1,
  maxInferences: 100,
});

const inferences = engine.forwardChain(10);
```

### 8. Temporal Reasoning - Phase 3

**NEW**: Time-based knowledge representation and reasoning:

- **Temporal Events**: Events with time intervals
- **Temporal Relationships**: BEFORE, AFTER, DURING, OVERLAPS
- **Temporal Patterns**: Sequential pattern matching
- **Temporal Decay**: Attention decay over time
- **Transitivity Inference**: Automatic temporal inference

```javascript
const { TemporalEngine } = require('opencog').Temporal;

const engine = new TemporalEngine(atomspace);
const event = engine.addEvent('login', startTime, endTime, { userId: '123' });
const relations = engine.findTemporalRelations(event1, event2);
```

### 9. Performance Profiling - Phase 3

**NEW**: Automatic performance monitoring and optimization:

- **Load Time Tracking**: Monitor module load times
- **Bottleneck Detection**: Identify slow modules
- **Optimization Recommendations**: Actionable suggestions
- **Attention-Based Prioritization**: Focus on critical performance issues

```javascript
const { PerformanceProfilerAgent } = require('opencog');

const agent = new PerformanceProfilerAgent(atomspace);
agent.trackModuleLoad('express', 250);
const report = agent.getPerformanceReport();
```

### 10. Security Analysis - Phase 3

**NEW**: Cognitive security vulnerability detection:

- **Risk Assessment**: Analyze module security risks
- **Vulnerability Detection**: Identify known vulnerable patterns
- **Dependency Analysis**: Assess supply chain risks
- **Security Recommendations**: Prioritized remediation steps

```javascript
const { SecurityAnalyzerAgent } = require('opencog');

const agent = new SecurityAnalyzerAgent(atomspace);
agent.execute();
const report = agent.getSecurityReport();
```

### 11. Build Optimization - Phase 3

**NEW**: Automated build analysis and optimization:

- **Dead Code Detection**: Find unused modules
- **Bundle Analysis**: Estimate and optimize bundle size
- **Code Splitting**: Identify lazy loading opportunities
- **Optimization Strategies**: Comprehensive recommendations

```javascript
const { BuildOptimizationAgent } = require('opencog');

const agent = new BuildOptimizationAgent(atomspace);
agent.execute();
const report = agent.getOptimizationReport();
```

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

## Running the Demos

### Basic Demo
```bash
node examples/opencog-demo.js
```

### NodeSpace Demo
```bash
node examples/nodespace-demo.js
```

### Advanced Features Demo (Phase 3)
```bash
node examples/advanced-opencog-demo.js
```

## Documentation

- [OpenCog Overview](./README.md) - This document
- [NodeSpace Guide](./NODESPACE.md) - Module dependency tracking
- [Module Loader Integration](./MODULE_LOADER_INTEGRATION.md) - Integration guide
- [Phase 3 Features](./PHASE3_FEATURES.md) - Advanced features documentation

## Architecture

```
Cognitive Loop → Agent Orchestrator → [Agents] → AtomSpace + AttentionBank
```

## License

MIT License (same as Node.js)
