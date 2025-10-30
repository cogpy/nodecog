# OpenCog Phase 3: Advanced Features

This document describes the advanced features implemented in Phase 3 of the OpenCog integration for Node.js.

## Overview

Phase 3 adds powerful cognitive capabilities to the OpenCog system:

1. **PLN (Probabilistic Logic Networks)** - Advanced probabilistic reasoning
2. **Temporal Reasoning** - Time-based knowledge representation and inference
3. **Performance Profiling** - Automatic performance analysis and optimization
4. **Security Analysis** - Vulnerability detection and risk assessment
5. **Build Optimization** - Code structure analysis and optimization recommendations

## PLN (Probabilistic Logic Networks)

PLN provides probabilistic reasoning capabilities with truth values representing strength and confidence.

### Truth Values

Every atom can have a truth value with two components:
- **Strength**: Probability or degree of truth (0.0 to 1.0)
- **Confidence**: Certainty or weight of evidence (0.0 to 1.0)

```javascript
const { TruthValue } = require('opencog').PLN;

const tv = new TruthValue(0.8, 0.9); // 80% strength, 90% confidence
console.log(tv.toString()); // "TV(0.800, 0.900)"
```

### PLN Inference Rules

PLN provides several logical inference rules:

#### Deduction
`A→B, B→C ⊢ A→C`

```javascript
const { PLNRules } = require('opencog').PLN;

const tvAB = new TruthValue(0.9, 0.8);
const tvBC = new TruthValue(0.8, 0.9);
const tvAC = PLNRules.deduction(tvAB, tvBC);
```

#### Revision
Combine two truth values for the same statement:

```javascript
const tv1 = new TruthValue(0.8, 0.7);
const tv2 = new TruthValue(0.6, 0.8);
const tvRevised = PLNRules.revision(tv1, tv2);
```

#### Other Rules
- **Induction**: `A→B ⊢ B→A` (with reduced confidence)
- **Abduction**: `B→C, A→C ⊢ A→B` (hypothesis generation)
- **Conjunction**: `P(A ∧ B)`
- **Disjunction**: `P(A ∨ B)`
- **Negation**: `P(¬A)`
- **Modus Ponens**: `A, A→B ⊢ B`

### PLN Engine

The PLN Engine performs automatic forward chaining inference:

```javascript
const { PLNEngine } = require('opencog').PLN;
const { AtomSpace, AtomType } = require('opencog');

const atomspace = new AtomSpace();
const engine = new PLNEngine(atomspace, {
  inferenceDepth: 3,
  minConfidence: 0.1,
  minStrength: 0.01,
  maxInferences: 100,
});

// Add knowledge
const cat = atomspace.addAtom(AtomType.CONCEPT, 'cat');
const mammal = atomspace.addAtom(AtomType.CONCEPT, 'mammal');

atomspace.addAtom(
  AtomType.IMPLICATION,
  'cat-mammal',
  [cat, mammal],
  { strength: 0.98, confidence: 0.95 }
);

// Perform inference
const inferences = engine.forwardChain(10);
console.log(`Made ${inferences.length} inferences`);
```

### Query with Probabilistic Inference

```javascript
const result = engine.query({ type: AtomType.CONCEPT, name: 'cat' });
console.log(`Query result: ${result.toString()}`);
```

## Temporal Reasoning

The Temporal Reasoning system handles time-based relationships and temporal patterns.

### Temporal Types

- **TemporalPoint**: A point in time
- **TemporalInterval**: A time interval with start and end
- **TemporalEvent**: An event occurring over an interval
- **TemporalEngine**: Engine for temporal reasoning

### Creating Temporal Events

```javascript
const { TemporalEngine } = require('opencog').Temporal;
const { AtomSpace } = require('opencog');

const atomspace = new AtomSpace();
const engine = new TemporalEngine(atomspace);

const now = Date.now();
const event = engine.addEvent(
  'user_login',
  now,
  now + 1000,
  { userId: '123', action: 'login' }
);
```

### Temporal Relationships

The engine automatically detects temporal relationships:
- **BEFORE**: Event A happens before Event B
- **AFTER**: Event A happens after Event B
- **DURING**: Event A occurs during Event B
- **OVERLAPS**: Events A and B overlap in time
- **SIMULTANEOUS**: Events A and B occur at the same time

```javascript
const event1 = engine.addEvent('start', now, now + 1000);
const event2 = engine.addEvent('end', now + 2000, now + 3000);

const relations = engine.findTemporalRelations(event1, event2);
// Returns: [{ type: 'BEFORE', source: event1, target: event2 }]
```

### Temporal Pattern Matching

Find sequences of events matching a pattern:

```javascript
const pattern = [
  (e) => e.temporalData.data.type === 'login',
  (e) => e.temporalData.data.type === 'access',
  (e) => e.temporalData.data.type === 'logout',
];

const matches = engine.findTemporalPattern(pattern);
```

### Temporal Attention Decay

Events decay in importance over time:

```javascript
engine.applyTemporalDecay();
// Older events get lower attention values
```

### Getting Recent Events

```javascript
const recentEvents = engine.getRecentEvents(3600000); // Last hour
console.log(`Found ${recentEvents.length} recent events`);
```

## Performance Profiling

Automatic performance monitoring and bottleneck detection.

### Performance Profiler Agent

```javascript
const { PerformanceProfilerAgent } = require('opencog');

const agent = new PerformanceProfilerAgent(atomspace, {
  loadTimeThreshold: 100, // ms
  executionTimeThreshold: 50, // ms
});

// Track module loads
agent.trackModuleLoad('express', 250);
agent.trackModuleLoad('lodash', 85);

// Run analysis
agent.execute();

// Get report
const report = agent.getPerformanceReport();
console.log(`Found ${report.bottlenecks.length} bottlenecks`);
```

### Performance Report Structure

```javascript
{
  bottlenecks: [
    {
      module: 'express',
      type: 'NPM_MODULE',
      averageLoadTime: 250,
      loadCount: 5,
      totalTime: 1250
    }
  ],
  recommendations: [
    {
      module: 'express',
      issue: 'Slow load time: 250ms',
      impact: 'high',
      suggestions: [
        'Consider lazy loading this module',
        'Check for lighter alternatives'
      ]
    }
  ],
  totalModulesTracked: 10,
  slowModules: 2
}
```

## Security Analysis

Cognitive security vulnerability detection and risk assessment.

### Security Analyzer Agent

```javascript
const { SecurityAnalyzerAgent } = require('opencog');

const agent = new SecurityAnalyzerAgent(atomspace, {
  frequency: 60000, // Check every minute
});

// Run analysis
agent.execute();

// Get security report
const report = agent.getSecurityReport();
```

### Security Report Structure

```javascript
{
  vulnerabilities: [
    {
      module: 'event-stream',
      type: 'NPM_MODULE',
      riskLevel: 'high',
      issues: [
        {
          type: 'known-vulnerability',
          severity: 'high',
          description: 'Module name matches known vulnerable pattern'
        }
      ]
    }
  ],
  recommendations: [
    {
      module: 'event-stream',
      riskLevel: 'high',
      recommendations: [
        'URGENT: Address high-risk security issues immediately',
        'Run npm audit to check for known vulnerabilities'
      ]
    }
  ],
  riskDistribution: {
    critical: 0,
    high: 1,
    medium: 2,
    low: 5,
    unknown: 0
  },
  totalModulesAnalyzed: 8
}
```

### Risk Assessment

The agent assesses risk based on:
- Dependency depth
- Circular dependencies
- Known vulnerable patterns
- Module maintenance status
- Supply chain risks

### Risk Levels

- **Critical**: Immediate action required
- **High**: Should be addressed soon
- **Medium**: Monitor and plan remediation
- **Low**: Acceptable risk level

## Build Optimization

Automated build analysis and optimization recommendations.

### Build Optimization Agent

```javascript
const { BuildOptimizationAgent } = require('opencog');

const agent = new BuildOptimizationAgent(atomspace);

// Run optimization analysis
agent.execute();

// Get optimization report
const report = agent.getOptimizationReport();
```

### Optimization Report Structure

```javascript
{
  deadCode: [
    {
      module: './unused.js',
      type: 'LOCAL_MODULE',
      reason: 'No other modules depend on this module',
      recommendation: 'Consider removing if truly unused'
    }
  ],
  bundleAnalysis: {
    totalModules: 25,
    npmModules: 15,
    localModules: 10,
    heavyModules: [
      { name: 'moment', estimatedSize: 230 }
    ],
    estimatedSize: 1200 // KB
  },
  codeSplittingOpportunities: [
    {
      module: 'heavy-lib',
      type: 'code-splitting',
      reason: 'Module has 15 dependencies',
      benefit: 'Can improve initial load time',
      suggestion: 'Consider lazy loading or code splitting'
    }
  ],
  optimizations: [
    {
      category: 'dead-code-elimination',
      impact: 'medium',
      modules: ['./unused.js'],
      recommendation: 'Remove 1 unused module(s)',
      estimatedSavings: '10KB'
    },
    {
      category: 'bundle-size-optimization',
      impact: 'high',
      modules: ['moment'],
      recommendation: 'Optimize 1 large module(s)',
      estimatedSavings: '69KB',
      suggestions: [
        'Consider lighter alternatives',
        'Use tree shaking if available',
        'Import only needed components'
      ]
    }
  ]
}
```

### Optimization Categories

1. **Dead Code Elimination**: Remove unused modules
2. **Bundle Size Optimization**: Reduce size of heavy modules
3. **Code Splitting**: Lazy load large dependencies
4. **Dependency Management**: Review and optimize dependencies

## Integration Example

Complete example using all Phase 3 features:

```javascript
const opencog = require('opencog');

// Create cognitive system
const system = opencog.createCognitiveSystem({
  atomspace: { maxSize: 10000 },
  attention: { targetSTI: 5000 },
});

// 1. Add PLN reasoning
const { PLNEngine } = opencog.PLN;
const plnEngine = new PLNEngine(system.atomspace);

// 2. Add temporal reasoning
const { TemporalEngine } = opencog.Temporal;
const temporalEngine = new TemporalEngine(system.atomspace);

// 3. Deploy agents
system.addAgent(new opencog.PerformanceProfilerAgent(system.atomspace));
system.addAgent(new opencog.SecurityAnalyzerAgent(system.atomspace));
system.addAgent(new opencog.BuildOptimizationAgent(system.atomspace));

// 4. Start autonomous operation
system.start();
```

## Performance Considerations

### PLN
- Inference complexity: O(n²) for deduction with n implications
- Recommended max atoms: 10,000
- Tune `maxInferences` to balance thoroughness vs speed

### Temporal Reasoning
- Memory usage: ~1KB per temporal event
- Decay overhead: O(n) where n is number of events
- Use `temporalWindow` to limit memory usage

### Agents
- Performance Agent: < 10ms per cycle
- Security Agent: < 50ms per cycle
- Build Agent: < 30ms per cycle

## Best Practices

1. **PLN Configuration**
   - Set appropriate confidence thresholds
   - Limit inference depth for performance
   - Use revision to combine conflicting evidence

2. **Temporal Reasoning**
   - Apply decay regularly to prevent memory bloat
   - Use temporal windows for large event sets
   - Index events by time for faster queries

3. **Security Analysis**
   - Run security agent regularly (every minute)
   - Address high/critical risks immediately
   - Keep vulnerability patterns updated

4. **Build Optimization**
   - Run optimization analysis before builds
   - Implement recommendations incrementally
   - Monitor bundle size trends

## API Reference

See individual module documentation:
- [PLN API](./PLN.md)
- [Temporal API](./TEMPORAL.md)
- [Performance Profiler API](./PERFORMANCE_PROFILER.md)
- [Security Analyzer API](./SECURITY_ANALYZER.md)
- [Build Optimizer API](./BUILD_OPTIMIZER.md)

## Future Enhancements

Potential Phase 4 features:
- MOSES (Meta-Optimizing Semantic Evolutionary Search)
- Natural language processing capabilities
- Planning and goal-directed behavior
- Distributed AtomSpace across multiple nodes
- Real-time visualization dashboard

## License

MIT License (same as Node.js)
