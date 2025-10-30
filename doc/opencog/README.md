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

### Phase 3 Advanced Features
- **PLN (Probabilistic Logic Networks)**: Advanced probabilistic reasoning
- **Temporal Reasoning**: Time-based knowledge and inference
- **Performance Profiling**: Automatic performance analysis
- **Security Analysis**: Vulnerability detection and risk assessment
- **Build Optimization**: Code structure analysis and recommendations

### Phase 4 Distributed Cognitive Architecture (NEW) ✨
- **Distributed AtomSpace**: Multi-node knowledge sharing with sync strategies
- **ESM Agent Arena**: MLOps Training Academy for autonomous ESM agents
- **MOSES**: Meta-Optimizing Semantic Evolutionary Search for program synthesis
- **NLP Integration**: Natural language processing with AtomSpace grounding
- **Planning System**: Goal-directed behavior and hierarchical task planning
- **Visualization Dashboard**: Real-time cognitive monitoring and visualization

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

Automated build analysis and optimization:

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

### 12. Distributed AtomSpace - Phase 4 ✨

**NEW**: Multi-node knowledge sharing with distributed synchronization:

- **Peer Network**: Register and manage peer nodes
- **Sync Strategies**: Eventual, strong, CRDT, attention-based
- **Vector Clocks**: Causality tracking across nodes
- **Conflict Resolution**: Automatic merge strategies
- **Replication**: Configurable replication factors

```javascript
const { DistributedAtomSpace, SyncStrategy } = require('opencog');

const das = new DistributedAtomSpace({
  nodeId: 'node-1',
  syncStrategy: SyncStrategy.EVENTUAL_CONSISTENCY,
});

das.registerPeer('node-2', { address: 'localhost:8001' });
await das.syncWithPeers();
```

### 13. ESM Agent Arena - Phase 4 ✨

**NEW**: MLOps Training Academy for autonomous ESM agents:

- **Isolated Execution**: VM-based agent contexts
- **Fitness Training**: Objective-based optimization
- **Evolution**: Genetic algorithm agent improvement
- **Academy Modes**: Competitive, cooperative, hybrid
- **Lifecycle Management**: Training → Active → Deployment

```javascript
const { ESMAgentArena } = require('opencog');

const arena = new ESMAgentArena(distributedAtomspace, {
  maxAgents: 100,
  evolutionEnabled: true,
});

const agentId = arena.registerAgent(code, {
  trainingObjective: { type: 'maximize', value: 100 },
});

await arena.executeAgent(agentId, input);
await arena.evolvePopulation();
```

### 14. MOSES - Phase 4 ✨

**NEW**: Meta-Optimizing Semantic Evolutionary Search for program synthesis:

- **Program Evolution**: Evolve programs to solve tasks
- **Multiple Representations**: JavaScript, tree, linear
- **Deme Expansion**: MOSES-specific optimization
- **Fitness Modes**: Accuracy, MSE, F1, custom

```javascript
const { MOSES, RepresentationType } = require('opencog');

const moses = new MOSES({
  representationType: RepresentationType.JAVASCRIPT,
  populationSize: 100,
});

moses.initializePopulation();
const result = await moses.evolve(trainingData);
```

### 15. NLP Integration - Phase 4 ✨

**NEW**: Natural language processing with AtomSpace grounding:

- **Sentence Processing**: Full NLP pipeline
- **Relationship Extraction**: Semantic triples
- **Concept Grounding**: Link NL to knowledge
- **Semantic Similarity**: Concept comparison
- **Natural Queries**: Question answering

```javascript
const { NLPProcessor } = require('opencog');

const nlp = new NLPProcessor(atomspace);

const result = nlp.processSentence('The cat runs fast');
const relationships = nlp.extractRelationships(text);
const similarity = nlp.similarity('cat', 'dog');
```

### 16. Planning System - Phase 4 ✨

**NEW**: Goal-directed behavior and hierarchical planning:

- **Goal Management**: Create and track goals
- **Action Registration**: Define available actions
- **Plan Generation**: A* forward search
- **Reactive Planning**: Event-driven triggers
- **Plan Execution**: With automatic replanning

```javascript
const { Planner, Action, ActionType } = require('opencog');

const planner = new Planner(atomspace);

const action = new Action('move', ActionType.PRIMITIVE, executor, {
  preconditions: [(state) => state.energy > 0],
  effects: [(state) => { state.position += 1; }],
});

planner.registerAction(action);
const goal = planner.createGoal('Reach goal', condition, priority);
const plan = await planner.planForGoal(goal.id, state);
```

### 17. Visualization Dashboard - Phase 4 ✨

**NEW**: Real-time cognitive system monitoring:

- **Graph Visualization**: AtomSpace network graphs
- **Attention Heatmaps**: Distribution by type
- **Metrics Tracking**: Performance over time
- **Event Timeline**: System event history
- **Snapshots**: State comparison

```javascript
const { CognitiveVisualizer } = require('opencog');

const viz = new CognitiveVisualizer(atomspace, {
  enableAutoUpdate: true,
  updateInterval: 1000,
});

const dashboard = viz.generateDashboard();
const snapshot = viz.createSnapshot('before-training');
viz.logEvent('training-complete', 'Training finished');
```

## Quick Start

### Basic System
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

### Distributed System (Phase 4) ✨
```javascript
const opencog = require('opencog');

// Create distributed cognitive system with all Phase 4 features
const system = opencog.createDistributedCognitiveSystem({
  nodeId: 'my-node-1',
  syncStrategy: 'eventual',
  enableESMArena: true,
  enableMOSES: true,
  enableNLP: true,
  enablePlanner: true,
  enableVisualizer: true,
});

// Register peers for distributed operation
system.registerPeer('node-2', { address: 'localhost:8001' });

// Use Phase 4 features
const agentId = system.registerESMAgent(code, options);
system.processNaturalLanguage('Hello, world!');
const goal = system.createGoal(description, condition, priority);
const dashboard = system.generateDashboard();

// Get comprehensive statistics
const stats = system.getSystemStats();
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

### Distributed Cognitive Architecture Demo (Phase 4) ✨
```bash
node examples/phase4-opencog-demo.js
```

## Documentation

- [OpenCog Overview](./README.md) - This document
- [NodeSpace Guide](./NODESPACE.md) - Module dependency tracking
- [Module Loader Integration](./MODULE_LOADER_INTEGRATION.md) - Integration guide
- [Phase 3 Features](./PHASE3_FEATURES.md) - Advanced features documentation
- [Phase 4 Features](./PHASE4_FEATURES.md) - **NEW**: Distributed architecture guide

## Architecture

### Phase 1-3 Architecture
```
Cognitive Loop → Agent Orchestrator → [Agents] → AtomSpace + AttentionBank
```

### Phase 4 Distributed Architecture ✨
```
┌─────────────────────────────────────────────────────────┐
│              Distributed AtomSpace Network               │
│  Node 1 ◄──► Node 2 ◄──► Node 3 ◄──► Node N            │
│    ▲            ▲            ▲            ▲              │
│    └────────────┴────────────┴────────────┘              │
│              Knowledge Substrate                         │
└─────────────────────────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────┐    ┌──────▼──────┐    ┌─────▼─────┐
│  ESM   │    │    MOSES     │    │  Planner  │
│ Arena  │    │   Engine     │    │  System   │
└────────┘    └──────────────┘    └───────────┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │  NLP  │ Planning │  Viz    │
        └─────────────────────────────┘
```

## License

MIT License (same as Node.js)
