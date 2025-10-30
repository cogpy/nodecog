# NodeCog Technical Architecture

## Executive Summary

NodeCog is a cognitive architecture implementation that integrates OpenCog-inspired knowledge representation, attention allocation, and autonomous agent orchestration with Node.js runtime capabilities. This document provides comprehensive technical architecture documentation with formal specifications and visual diagrams.

## Table of Contents

- [System Overview](#system-overview)
- [Core Components](#core-components)
- [Component Diagrams](#component-diagrams)
- [Formal Specifications](#formal-specifications)
- [Data Flow Architecture](#data-flow-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Interaction Sequences](#interaction-sequences)

## System Overview

### High-Level Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        APP[Application Code]
        AGENTS[Cognitive Agents]
    end
    
    subgraph "Cognitive Architecture Layer"
        LOOP[Cognitive Loop]
        ORCH[Agent Orchestrator]
        PLN[PLN Reasoning]
        TEMPORAL[Temporal Reasoning]
        PLANNING[Planning System]
        NLP[NLP Integration]
    end
    
    subgraph "Knowledge Layer"
        AS[AtomSpace]
        AB[Attention Bank]
        NS[NodeSpace]
        DAS[Distributed AtomSpace]
    end
    
    subgraph "Runtime Layer"
        V8[V8 Engine]
        LIBUV[libuv Event Loop]
        CSE[Cognitive Synergy Engine]
    end
    
    subgraph "Infrastructure Layer"
        MOSES[MOSES]
        ARENA[ESM Agent Arena]
        VIZ[Visualization]
    end
    
    APP --> LOOP
    AGENTS --> ORCH
    LOOP --> AB
    LOOP --> AS
    ORCH --> AGENTS
    AB --> AS
    AS --> NS
    AS --> DAS
    PLN --> AS
    TEMPORAL --> AS
    PLANNING --> AS
    NLP --> AS
    CSE --> V8
    CSE --> LIBUV
    AS --> CSE
    MOSES --> AGENTS
    ARENA --> AGENTS
    VIZ --> AS
    VIZ --> AB
```

### System Layers

1. **Application Layer**: User code and cognitive agents
2. **Cognitive Architecture Layer**: Autonomous reasoning and orchestration
3. **Knowledge Layer**: Hypergraph knowledge representation
4. **Runtime Layer**: V8/libuv integration with cognitive control
5. **Infrastructure Layer**: Meta-optimization and visualization

## Core Components

### AtomSpace - Hypergraph Knowledge Store

```mermaid
classDiagram
    class AtomSpace {
        +Map~string,Atom~ atoms
        +Index index
        +number maxSize
        +boolean forgettingEnabled
        +addAtom(type, name, outgoing, truthValue) Atom
        +removeAtom(atomId) boolean
        +getAtom(atomId) Atom
        +getAtomsByType(type) Atom[]
        +getAtomsByName(name) Atom[]
        +patternMatch(pattern) Atom[]
        +forget(threshold) number
        +exportToJSON() object
    }
    
    class Atom {
        +string id
        +string type
        +string name
        +Atom[] outgoing
        +Set~Atom~ incoming
        +TruthValue truthValue
        +AttentionValue attention
        +number timestamp
        +toString() string
    }
    
    class TruthValue {
        +number strength
        +number confidence
    }
    
    class AttentionValue {
        +number sti
        +number lti
        +boolean vlti
    }
    
    class Index {
        +Map~string,Set~ byType
        +Map~string,Set~ byName
        +Map~string,Set~ byPattern
    }
    
    AtomSpace --> Atom : manages
    Atom --> TruthValue : has
    Atom --> AttentionValue : has
    AtomSpace --> Index : uses
```

### Attention Bank - Economic Attention Allocation

```mermaid
classDiagram
    class AttentionBank {
        +AtomSpace atomspace
        +AttentionConfig config
        +number totalSTI
        +number totalLTI
        +setSTI(atom, value) void
        +setLTI(atom, value) void
        +decay(rate) void
        +normalize() void
        +spreadAttention(sourceAtom, factor) void
        +getAttentionalFocus(n) Atom[]
        +stimulate(atom, amount) void
        +updateImportance(atom) void
    }
    
    class AttentionConfig {
        +number maxSTI
        +number maxLTI
        +number decayRate
        +number spreadFactor
        +number focusThreshold
    }
    
    class ForgettingStrategy {
        <<interface>>
        +shouldForget(atom) boolean
    }
    
    class STIBasedForgetting {
        +number threshold
        +shouldForget(atom) boolean
    }
    
    class LRUForgetting {
        +number maxAge
        +shouldForget(atom) boolean
    }
    
    AttentionBank --> AttentionConfig : configured by
    AttentionBank ..> ForgettingStrategy : uses
    ForgettingStrategy <|.. STIBasedForgetting
    ForgettingStrategy <|.. LRUForgetting
```

### Agent System - Autonomous Cognitive Agents

```mermaid
classDiagram
    class Agent {
        <<abstract>>
        +string name
        +number priority
        +number frequency
        +AtomSpace atomspace
        +AttentionBank attentionBank
        +run() Promise~void~
        +getPriority() number
        +shouldRun() boolean
    }
    
    class AgentOrchestrator {
        +Agent[] agents
        +OrchestrationConfig config
        +Map~string,AgentStats~ stats
        +addAgent(agent) void
        +removeAgent(name) void
        +runCycle() Promise~void~
        +getStats() object
    }
    
    class OrchestrationConfig {
        +number maxConcurrency
        +string schedulingStrategy
        +number defaultPriority
    }
    
    class AgentStats {
        +number executions
        +number totalTime
        +number avgTime
        +number lastExecution
        +number errors
    }
    
    class PerformanceProfilerAgent {
        +analyzePerformance() void
        +generateReport() object
    }
    
    class SecurityAnalyzerAgent {
        +scanForVulnerabilities() void
        +assessRisk() object
    }
    
    class BuildOptimizationAgent {
        +analyzeCodeStructure() void
        +optimizeBuild() object
    }
    
    Agent <|-- PerformanceProfilerAgent
    Agent <|-- SecurityAnalyzerAgent
    Agent <|-- BuildOptimizationAgent
    AgentOrchestrator --> Agent : manages
    AgentOrchestrator --> OrchestrationConfig : uses
    AgentOrchestrator --> AgentStats : tracks
```

### Cognitive Loop - Autonomous Operation

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Running: start()
    Running --> AgentSelection: cycle begins
    AgentSelection --> AgentExecution: select agents
    AgentExecution --> AttentionUpdate: agents complete
    AttentionUpdate --> Decay: update STI/LTI
    Decay --> Normalization: decay attention
    Normalization --> Forgetting: normalize economy
    Forgetting --> CycleComplete: remove low-attention atoms
    CycleComplete --> Running: sleep
    Running --> Paused: pause()
    Paused --> Running: resume()
    Running --> Stopped: stop()
    Stopped --> [*]
    
    note right of AgentSelection
        Priority-based agent selection
        using attention values
    end note
    
    note right of Decay
        Exponential decay of STI
        Configurable decay rate
    end note
```

### Distributed AtomSpace - Multi-Node Knowledge Sharing

```mermaid
graph TB
    subgraph "Node 1"
        AS1[AtomSpace 1]
        DAS1[Distributed AtomSpace 1]
        SYNC1[Sync Manager 1]
    end
    
    subgraph "Node 2"
        AS2[AtomSpace 2]
        DAS2[Distributed AtomSpace 2]
        SYNC2[Sync Manager 2]
    end
    
    subgraph "Node 3"
        AS3[AtomSpace 3]
        DAS3[Distributed AtomSpace 3]
        SYNC3[Sync Manager 3]
    end
    
    AS1 <--> DAS1
    AS2 <--> DAS2
    AS3 <--> DAS3
    
    DAS1 <--> SYNC1
    DAS2 <--> SYNC2
    DAS3 <--> SYNC3
    
    SYNC1 <-.sync.-> SYNC2
    SYNC2 <-.sync.-> SYNC3
    SYNC3 <-.sync.-> SYNC1
    
    SYNC1 -.broadcast.-> SYNC2
    SYNC1 -.broadcast.-> SYNC3
```

## Formal Specifications

### Z++ Specification for AtomSpace

```z++
schema AtomSpace
  atoms: seq Atom
  index: Index
  maxSize: ℕ
  forgettingEnabled: 𝔹

where
  # Size constraint
  #atoms ≤ maxSize
  
  # Unique atom IDs
  ∀ i, j: dom atoms • i ≠ j ⇒ atoms[i].id ≠ atoms[j].id
  
  # Index consistency
  ∀ a: ran atoms • 
    a.id ∈ index.byType[a.type] ∧
    (a.name ≠ null ⇒ a.id ∈ index.byName[a.name])
end

schema Atom
  id: ID
  type: AtomType
  name: String
  outgoing: seq Atom
  incoming: set Atom
  truthValue: TruthValue
  attention: AttentionValue
  timestamp: ℕ

where
  # Truth value bounds
  0 ≤ truthValue.strength ≤ 1 ∧
  0 ≤ truthValue.confidence ≤ 1
  
  # Attention value bounds
  attention.sti ∈ ℝ ∧
  attention.lti ∈ ℝ ∧
  attention.vlti ∈ 𝔹
  
  # Incoming/outgoing consistency
  ∀ o: ran outgoing • this ∈ o.incoming
  ∀ i: incoming • this ∈ ran i.outgoing
end

schema TruthValue
  strength: [0..1]
  confidence: [0..1]

where
  # Combined certainty constraint
  strength × confidence ≤ 1
end

operation addAtom
  Δ(AtomSpace)
  type?: AtomType
  name?: String
  outgoing?: seq Atom
  truthValue?: TruthValue
  result!: Atom

where
  # Size constraint
  #atoms < maxSize
  
  # Create new atom
  result! = Atom(
    id: generateId(),
    type: type?,
    name: name?,
    outgoing: outgoing? or [],
    truthValue: truthValue? or TruthValue(1.0, 1.0)
  )
  
  # Update atomspace
  atoms' = atoms ⌢ ⟨result!⟩
  
  # Update indices
  index'.byType[type?] = index.byType[type?] ∪ {result!.id}
  name? ≠ null ⇒ 
    index'.byName[name?] = index.byName[name?] ∪ {result!.id}
end
```

### Z++ Specification for Attention Dynamics

```z++
schema AttentionBank
  atomspace: AtomSpace
  config: AttentionConfig
  totalSTI: ℝ
  totalLTI: ℝ

where
  # Conservation of attention
  totalSTI = Σ{a: ran atomspace.atoms • a.attention.sti}
  totalLTI = Σ{a: ran atomspace.atoms • a.attention.lti}
  
  # Bounds
  totalSTI ≤ config.maxSTI
  totalLTI ≤ config.maxLTI
end

schema AttentionConfig
  maxSTI: ℝ₊
  maxLTI: ℝ₊
  decayRate: [0..1]
  spreadFactor: [0..1]
  focusThreshold: ℝ₊
end

operation decay
  Δ(AttentionBank)
  rate?: [0..1]

where
  # Exponential decay of STI
  ∀ a: ran atomspace.atoms •
    a.attention.sti' = a.attention.sti × (1 - (rate? or config.decayRate))
  
  # LTI remains constant
  ∀ a: ran atomspace.atoms •
    a.attention.lti' = a.attention.lti
  
  # Update total
  totalSTI' = totalSTI × (1 - (rate? or config.decayRate))
end

operation spreadAttention
  Δ(AttentionBank)
  source?: Atom
  factor?: [0..1]

where
  source? ∈ ran atomspace.atoms
  
  # Spread to connected atoms
  ∀ a: source?.outgoing ∪ source?.incoming •
    let amount = source?.attention.sti × (factor? or config.spreadFactor)
    a.attention.sti' = a.attention.sti + amount
    source?.attention.sti' = source?.attention.sti - amount
  
  # Preserve total attention
  totalSTI' = totalSTI
end

operation normalize
  Δ(AttentionBank)

where
  # Normalize STI to maxSTI
  let currentTotal = Σ{a: ran atomspace.atoms • a.attention.sti}
  currentTotal > config.maxSTI ⇒
    ∀ a: ran atomspace.atoms •
      a.attention.sti' = a.attention.sti × (config.maxSTI / currentTotal)
  
  # Update total
  totalSTI' = min(totalSTI, config.maxSTI)
end
```

### Z++ Specification for Cognitive Operations

```z++
schema CognitiveLoop
  atomspace: AtomSpace
  attentionBank: AttentionBank
  orchestrator: AgentOrchestrator
  config: LoopConfig
  state: {idle, running, paused, stopped}
  cycleCount: ℕ

where
  state ∈ {idle, running, paused, stopped}
end

schema LoopConfig
  interval: ℕ₊
  autoDecay: 𝔹
  autoNormalize: 𝔹
  autoForget: 𝔹
  decayRate: [0..1]
end

operation runCycle
  Δ(CognitiveLoop)

where
  state = running
  
  # Execute agent orchestration
  orchestrator.runCycle()
  
  # Auto decay if enabled
  config.autoDecay ⇒
    attentionBank.decay(config.decayRate)
  
  # Auto normalize if enabled
  config.autoNormalize ⇒
    attentionBank.normalize()
  
  # Auto forget if enabled
  config.autoForget ⇒
    let threshold = attentionBank.config.focusThreshold
    atomspace.forget(threshold)
  
  # Increment cycle count
  cycleCount' = cycleCount + 1
end

schema AgentOrchestrator
  agents: seq Agent
  config: OrchestrationConfig
  stats: Agent ↦ AgentStats

where
  # All agents have stats
  dom stats = ran agents
  
  # Agents sorted by priority
  ∀ i, j: dom agents • 
    i < j ⇒ agents[i].priority ≥ agents[j].priority
end

operation runCycle
  Δ(AgentOrchestrator)

where
  # Select agents to run
  let runnable = {a: ran agents | a.shouldRun()}
  
  # Execute in priority order with concurrency limit
  ∀ a: runnable •
    a.run()
    stats[a].executions' = stats[a].executions + 1
    stats[a].lastExecution' = now()
end
```

### Z++ Specification for PLN Reasoning

```z++
schema PLNReasoner
  atomspace: AtomSpace
  rules: seq InferenceRule
  config: PLNConfig

where
  # All rules are valid
  ∀ r: ran rules • r.isValid()
end

schema InferenceRule
  name: String
  premises: seq Pattern
  conclusion: Pattern
  formula: TruthValue × seq TruthValue → TruthValue

where
  # Premises and conclusion must be valid patterns
  ∀ p: ran premises • p.isValid()
  conclusion.isValid()
end

schema Pattern
  type: AtomType
  constraints: seq Constraint

where
  # All constraints must be satisfiable
  ∃ a: Atom • matches(a, this)
end

operation forwardChain
  Δ(PLNReasoner)
  maxSteps?: ℕ
  result!: seq Atom

where
  # Apply rules forward until no new atoms or max steps
  let step = 0
  let newAtoms = ∅
  
  while step < (maxSteps? or ∞) ∧ ¬ converged() do
    ∀ r: ran rules •
      let matches = findMatches(r.premises)
      ∀ m: matches •
        let conclusion = applyRule(r, m)
        conclusion ∉ ran atomspace.atoms ⇒
          atomspace.addAtom(conclusion)
          newAtoms' = newAtoms ∪ {conclusion}
    step' = step + 1
  
  result! = newAtoms
end

operation backwardChain
  Δ(PLNReasoner)
  goal?: Atom
  result!: 𝔹

where
  # Try to prove goal by finding matching rules
  goal? ∈ ran atomspace.atoms ∨
  ∃ r: ran rules •
    matches(goal?, r.conclusion) ∧
    ∀ p: r.premises • backwardChain(p)
  
  result! = goal? ∈ ran atomspace.atoms
end
```

## Data Flow Architecture

### Knowledge Flow Diagram

```mermaid
flowchart LR
    subgraph "Input Sources"
        CODE[Source Code]
        DATA[External Data]
        SENSORS[Sensor Input]
    end
    
    subgraph "Processing Pipeline"
        PARSE[Parser/Analyzer]
        TRANS[Transformer]
        REASON[Reasoner]
    end
    
    subgraph "Knowledge Storage"
        AS[AtomSpace]
        NS[NodeSpace]
        DAS[Distributed AtomSpace]
    end
    
    subgraph "Attention System"
        AB[Attention Bank]
        FOCUS[Attentional Focus]
    end
    
    subgraph "Output"
        ACTIONS[Actions]
        INSIGHTS[Insights]
        VIZ[Visualizations]
    end
    
    CODE --> PARSE
    DATA --> TRANS
    SENSORS --> TRANS
    
    PARSE --> AS
    TRANS --> AS
    
    AS --> REASON
    REASON --> AS
    
    AS <--> NS
    AS <--> DAS
    AS <--> AB
    
    AB --> FOCUS
    FOCUS --> ACTIONS
    FOCUS --> INSIGHTS
    
    AS --> VIZ
    AB --> VIZ
```

### Attention Spreading Flow

```mermaid
sequenceDiagram
    participant Agent
    participant AtomSpace
    participant AttentionBank
    participant Atom1
    participant Atom2
    
    Agent->>AtomSpace: getAtom(id)
    AtomSpace-->>Agent: atom1
    
    Agent->>AttentionBank: stimulate(atom1, amount)
    AttentionBank->>Atom1: increase STI
    Atom1-->>AttentionBank: updated
    
    AttentionBank->>AttentionBank: spreadAttention(atom1)
    
    loop For each connected atom
        AttentionBank->>Atom2: transfer STI
        Atom2-->>AttentionBank: updated
    end
    
    AttentionBank->>AttentionBank: normalize()
    AttentionBank-->>Agent: complete
```

## Deployment Architecture

### Single Node Deployment

```mermaid
deployment
    node "Application Server" {
        component "Node.js Runtime" {
            artifact "V8 Engine"
            artifact "libuv"
            artifact "Cognitive Synergy Engine"
        }
        
        component "Cognitive Architecture" {
            artifact "AtomSpace"
            artifact "Attention Bank"
            artifact "Agent Orchestrator"
        }
        
        component "Application Layer" {
            artifact "User Code"
            artifact "Cognitive Agents"
        }
    }
    
    database "Persistent Storage" {
        artifact "AtomSpace Snapshots"
        artifact "Agent State"
    }
    
    node "Monitoring" {
        component "Visualization Dashboard"
    }
```

### Distributed Deployment

```mermaid
deployment
    node "Node 1" {
        component "AtomSpace 1"
        component "Sync Manager 1"
        component "Agent Set A"
    }
    
    node "Node 2" {
        component "AtomSpace 2"
        component "Sync Manager 2"
        component "Agent Set B"
    }
    
    node "Node 3" {
        component "AtomSpace 3"
        component "Sync Manager 3"
        component "Agent Set C"
    }
    
    node "Coordinator" {
        component "Global Orchestrator"
        component "Sync Coordinator"
    }
    
    database "Shared Knowledge Base" {
        artifact "Global AtomSpace"
    }
    
    cloud "Network" {
    }
    
    Node1 -.-> Network: sync
    Node2 -.-> Network: sync
    Node3 -.-> Network: sync
    Coordinator --> Network: coordinate
    Network --> "Shared Knowledge Base": persist
```

## Interaction Sequences

### Agent Execution Sequence

```mermaid
sequenceDiagram
    participant CL as Cognitive Loop
    participant Orch as Orchestrator
    participant Agent as Cognitive Agent
    participant AS as AtomSpace
    participant AB as Attention Bank
    
    CL->>Orch: runCycle()
    Orch->>Orch: select runnable agents
    
    loop For each agent
        Orch->>Agent: shouldRun()
        Agent-->>Orch: true/false
        
        alt Agent should run
            Orch->>Agent: run()
            Agent->>AS: query patterns
            AS-->>Agent: matching atoms
            
            Agent->>Agent: process knowledge
            
            Agent->>AS: addAtom(result)
            AS-->>Agent: new atom
            
            Agent->>AB: stimulate(atom)
            AB-->>Agent: updated
            
            Agent-->>Orch: complete
            Orch->>Orch: update stats
        end
    end
    
    Orch-->>CL: cycle complete
    CL->>AB: decay()
    CL->>AB: normalize()
    CL->>AS: forget()
```

### Pattern Matching Sequence

```mermaid
sequenceDiagram
    participant Client
    participant AS as AtomSpace
    participant Index
    participant Matcher as Pattern Matcher
    
    Client->>AS: patternMatch(pattern)
    AS->>Index: getAtomsByType(pattern.type)
    Index-->>AS: candidate atoms
    
    AS->>Matcher: match(pattern, candidates)
    
    loop For each candidate
        Matcher->>Matcher: checkConstraints(candidate)
        
        alt Constraints satisfied
            Matcher->>Matcher: add to results
        end
    end
    
    Matcher-->>AS: matching atoms
    AS-->>Client: results
```

### Distributed Sync Sequence

```mermaid
sequenceDiagram
    participant N1 as Node 1
    participant SM1 as Sync Manager 1
    participant SM2 as Sync Manager 2
    participant N2 as Node 2
    
    N1->>SM1: atom added
    SM1->>SM1: prepare sync message
    
    alt Broadcast Strategy
        SM1->>SM2: broadcast(atom)
        SM2->>N2: addAtom(atom)
    else Pull Strategy
        SM2->>SM1: request changes since T
        SM1-->>SM2: atom delta
        SM2->>N2: apply delta
    else Attention-Based Strategy
        SM1->>SM1: check STI > threshold
        alt High attention
            SM1->>SM2: priority sync(atom)
            SM2->>N2: addAtom(atom)
        else Low attention
            SM1->>SM1: queue for batch sync
        end
    end
    
    SM2->>SM2: detect conflicts
    alt No conflict
        SM2-->>SM1: ack
    else Conflict
        SM2->>SM1: merge request
        SM1->>SM1: merge truth values
        SM1-->>SM2: merged atom
        SM2->>N2: update atom
    end
```

### Reasoning Pipeline Sequence

```mermaid
sequenceDiagram
    participant User
    participant PLN as PLN Reasoner
    participant AS as AtomSpace
    participant Rules as Rule Engine
    
    User->>PLN: forwardChain(maxSteps)
    
    loop Until convergence or max steps
        PLN->>AS: query all atoms
        AS-->>PLN: atom set
        
        PLN->>Rules: apply rules to atoms
        
        loop For each rule
            Rules->>Rules: find premise matches
            
            alt Premises satisfied
                Rules->>Rules: compute conclusion truth value
                Rules->>AS: addAtom(conclusion)
                AS-->>Rules: new atom
            end
        end
        
        PLN->>PLN: check convergence
    end
    
    PLN-->>User: inferred atoms
```

## Performance Characteristics

### Complexity Analysis

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| addAtom | O(1) average | O(1) |
| getAtom | O(1) | O(1) |
| patternMatch | O(n × m) | O(k) |
| spreadAttention | O(d) | O(1) |
| decay | O(n) | O(1) |
| normalize | O(n) | O(1) |
| forget | O(n) | O(1) |
| forwardChain | O(r × n^p) | O(n) |

Where:
- n = number of atoms
- m = pattern complexity
- k = number of matches
- d = degree (connected atoms)
- r = number of rules
- p = max rule premises

### Scalability Metrics

```mermaid
graph LR
    subgraph "Horizontal Scaling"
        N1[Node 1<br/>10K atoms]
        N2[Node 2<br/>10K atoms]
        N3[Node 3<br/>10K atoms]
        
        N1 -.-> N2
        N2 -.-> N3
        N3 -.-> N1
    end
    
    subgraph "Vertical Scaling"
        AS[AtomSpace<br/>100K atoms]
        AB[Attention Bank<br/>Optimized]
        IDX[Indices<br/>Hash-based]
        
        AS --> IDX
        AB --> AS
    end
    
    style N1 fill:#90EE90
    style N2 fill:#90EE90
    style N3 fill:#90EE90
    style AS fill:#87CEEB
```

## Security Considerations

### Threat Model

```mermaid
graph TB
    subgraph "Threats"
        T1[Code Injection]
        T2[DoS Attacks]
        T3[Data Leakage]
        T4[Privilege Escalation]
    end
    
    subgraph "Mitigations"
        M1[Input Validation]
        M2[Resource Limits]
        M3[Access Control]
        M4[Sandboxing]
    end
    
    subgraph "Security Agents"
        SA[Security Analyzer]
        VA[Vulnerability Scanner]
    end
    
    T1 -.mitigated by.-> M1
    T1 -.mitigated by.-> M4
    T2 -.mitigated by.-> M2
    T3 -.mitigated by.-> M3
    T4 -.mitigated by.-> M3
    T4 -.mitigated by.-> M4
    
    SA --> M1
    SA --> M3
    VA --> M1
    VA --> M4
```

## Appendix

### Glossary

- **Atom**: Basic unit of knowledge in the hypergraph
- **AtomSpace**: Hypergraph knowledge representation system
- **STI**: Short-Term Importance - immediate attention value
- **LTI**: Long-Term Importance - long-term significance value
- **VLTI**: Very Long-Term Importance - protection from forgetting
- **ECAN**: Economic Attention Network - attention allocation mechanism
- **PLN**: Probabilistic Logic Networks - reasoning system
- **MOSES**: Meta-Optimizing Semantic Evolutionary Search

### References

1. OpenCog Framework Documentation
2. V8 JavaScript Engine Architecture
3. libuv Design Overview
4. Hypergraph Theory and Applications
5. Attention Economics in Cognitive Architectures

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-30 | Initial comprehensive architecture documentation |

---

**Document Status**: Complete
**Last Updated**: 2025-10-30
**Maintained By**: NodeCog Architecture Team
