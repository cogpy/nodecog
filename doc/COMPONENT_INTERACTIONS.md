# NodeCog Component Interactions and Data Flows

## Overview

This document details the interactions between NodeCog components, data flows, and communication patterns using Mermaid diagrams and detailed descriptions.

## Table of Contents

- [System Startup Flow](#system-startup-flow)
- [Knowledge Creation Flow](#knowledge-creation-flow)
- [Attention Dynamics Flow](#attention-dynamics-flow)
- [Agent Orchestration Flow](#agent-orchestration-flow)
- [Reasoning Pipeline Flow](#reasoning-pipeline-flow)
- [Module Loading Flow](#module-loading-flow)
- [Distributed Synchronization Flow](#distributed-synchronization-flow)
- [Cognitive Synergy Engine Flow](#cognitive-synergy-engine-flow)
- [Component Communication Patterns](#component-communication-patterns)

## System Startup Flow

### Initialization Sequence

```mermaid
sequenceDiagram
    participant Main as Application
    participant System as Cognitive System
    participant AS as AtomSpace
    participant AB as Attention Bank
    participant Orch as Orchestrator
    participant Loop as Cognitive Loop
    
    Main->>System: createCognitiveSystem(config)
    System->>AS: new AtomSpace(config.atomspace)
    AS-->>System: atomspace instance
    
    System->>AB: new AttentionBank(atomspace, config.attention)
    AB-->>System: attention bank instance
    
    System->>Orch: new AgentOrchestrator(config.orchestrator)
    Orch-->>System: orchestrator instance
    
    System->>Loop: new CognitiveLoop(atomspace, ab, orch, config.loop)
    Loop-->>System: cognitive loop instance
    
    System-->>Main: cognitive system
    
    Main->>Loop: start()
    activate Loop
    Loop->>Loop: begin autonomous operation
    Loop-->>Main: started
```

### Component Initialization Details

```mermaid
flowchart TB
    Start([Start]) --> LoadConfig[Load Configuration]
    LoadConfig --> InitAS[Initialize AtomSpace]
    InitAS --> BuildIndex[Build Indices]
    BuildIndex --> InitAB[Initialize Attention Bank]
    InitAB --> SetDefaults[Set Default STI/LTI]
    SetDefaults --> InitOrch[Initialize Orchestrator]
    InitOrch --> LoadAgents[Load Agent Definitions]
    LoadAgents --> InitLoop[Initialize Cognitive Loop]
    InitLoop --> SetupHooks[Setup Event Hooks]
    SetupHooks --> ValidateSystem[Validate System State]
    ValidateSystem --> Decision{Valid?}
    Decision -->|Yes| StartLoop[Start Cognitive Loop]
    Decision -->|No| Error([Error])
    StartLoop --> Running([Running])
```

## Knowledge Creation Flow

### Adding Knowledge to AtomSpace

```mermaid
sequenceDiagram
    participant Client
    participant AS as AtomSpace
    participant Index
    participant AB as Attention Bank
    participant Listeners as Event Listeners
    
    Client->>AS: addNode('CONCEPT', 'Dog')
    AS->>AS: check if exists
    
    alt Atom exists
        AS->>AS: merge truth values
        AS->>Index: update timestamp
        AS->>Listeners: emit 'atom-updated'
        AS-->>Client: existing atom
    else Atom is new
        AS->>AS: create new Atom
        AS->>Index: add to byType index
        AS->>Index: add to byName index
        AS->>AB: initialize attention (STI=0, LTI=0)
        AS->>Listeners: emit 'atom-added'
        AS-->>Client: new atom
    end
    
    Client->>AS: addLink('INHERITANCE', [dog, animal])
    AS->>AS: create link atom
    AS->>AS: update incoming sets
    AS->>Index: add to indices
    AS->>AB: initialize attention
    AS->>Listeners: emit 'atom-added'
    AS-->>Client: new link
```

### Knowledge Graph Building

```mermaid
graph TB
    subgraph "Input Layer"
        CODE[Source Code]
        TEXT[Text Data]
        DATA[Structured Data]
    end
    
    subgraph "Parsing Layer"
        PARSE[Code Parser]
        NLP[NLP Parser]
        STRUCT[Data Parser]
    end
    
    subgraph "Transformation Layer"
        ATOMIFY[Atomification]
        EXTRACT[Entity Extraction]
        RELATE[Relationship Detection]
    end
    
    subgraph "Knowledge Layer"
        NODES[Node Atoms]
        LINKS[Link Atoms]
        PATTERNS[Pattern Atoms]
    end
    
    subgraph "Enrichment Layer"
        TV[Truth Value Assignment]
        ATT[Attention Allocation]
        META[Metadata Tagging]
    end
    
    CODE --> PARSE
    TEXT --> NLP
    DATA --> STRUCT
    
    PARSE --> ATOMIFY
    NLP --> EXTRACT
    STRUCT --> ATOMIFY
    
    ATOMIFY --> NODES
    EXTRACT --> NODES
    ATOMIFY --> LINKS
    RELATE --> LINKS
    EXTRACT --> PATTERNS
    
    NODES --> TV
    LINKS --> TV
    NODES --> ATT
    LINKS --> ATT
    NODES --> META
    LINKS --> META
```

## Attention Dynamics Flow

### Attention Spreading Process

```mermaid
sequenceDiagram
    participant Agent
    participant AB as Attention Bank
    participant Source as Source Atom
    participant N1 as Neighbor 1
    participant N2 as Neighbor 2
    participant N3 as Neighbor 3
    
    Agent->>AB: stimulate(sourceAtom, 100)
    AB->>Source: STI += 100
    Source-->>AB: STI = 120
    
    AB->>AB: check if STI > threshold (100)
    
    alt STI above threshold
        AB->>AB: spreadAttention(source)
        AB->>Source: get connected atoms
        Source-->>AB: [N1, N2, N3]
        
        AB->>AB: calculate spread amount
        Note right of AB: amount = 120 * 0.2 / 3 = 8
        
        AB->>N1: STI += 8
        AB->>N2: STI += 8
        AB->>N3: STI += 8
        AB->>Source: STI -= 24
        
        N1-->>AB: STI updated
        N2-->>AB: STI updated
        N3-->>AB: STI updated
        Source-->>AB: STI = 96
    end
    
    AB-->>Agent: complete
```

### Decay and Normalization Cycle

```mermaid
flowchart LR
    subgraph "Decay Phase"
        D1[All Atoms]
        D2[Apply Decay Rate]
        D3[STI *= 0.99]
        D1 --> D2 --> D3
    end
    
    subgraph "Normalization Phase"
        N1[Calculate Total STI]
        N2{Total > Max?}
        N3[Scale Factor = Max/Total]
        N4[Apply to All Atoms]
        N5[Skip]
        N1 --> N2
        N2 -->|Yes| N3 --> N4
        N2 -->|No| N5
    end
    
    subgraph "Forgetting Phase"
        F1[Select Low STI Atoms]
        F2[Check VLTI Flag]
        F3[Remove Atoms]
        F4[Update Indices]
        F1 --> F2 --> F3 --> F4
    end
    
    D3 --> N1
    N4 --> F1
    N5 --> F1
```

### Attention Value Evolution

```mermaid
graph TB
    subgraph "STI Evolution Over Time"
        T0[T=0: STI=100]
        T1[T=1: STI=99]
        T2[T=2: STI=98.01]
        T3[T=3: STI=97.03]
        T4[T=4: STI=96.06]
        
        T0 -.decay.-> T1
        T1 -.decay.-> T2
        T2 -.decay.-> T3
        T3 -.decay.-> T4
    end
    
    subgraph "STI with Stimulation"
        S0[T=0: STI=100]
        S1[T=1: STI=149]
        S2[T=2: STI=147.51]
        S3[T=3: STI=146.04]
        
        S0 -.stimulate +50.-> S1
        S1 -.decay.-> S2
        S2 -.decay.-> S3
    end
    
    subgraph "STI with Spreading"
        P0[Parent: STI=100]
        P1[Parent: STI=80]
        C1[Child1: STI=10]
        C2[Child2: STI=10]
        
        P0 -.spread.-> P1
        P0 -.spread.-> C1
        P0 -.spread.-> C2
    end
```

## Agent Orchestration Flow

### Agent Selection and Execution

```mermaid
sequenceDiagram
    participant Loop as Cognitive Loop
    participant Orch as Orchestrator
    participant Q as Priority Queue
    participant A1 as Agent 1 (P=100)
    participant A2 as Agent 2 (P=80)
    participant A3 as Agent 3 (P=60)
    participant Stats as Statistics
    
    Loop->>Orch: runCycle()
    Orch->>Orch: get current cycle number
    
    Orch->>A1: shouldRun(cycle)
    A1-->>Orch: true
    Orch->>A2: shouldRun(cycle)
    A2-->>Orch: true
    Orch->>A3: shouldRun(cycle)
    A3-->>Orch: false
    
    Orch->>Q: add(A1, priority=100)
    Orch->>Q: add(A2, priority=80)
    
    Orch->>Q: pop() // highest priority
    Q-->>Orch: A1
    
    Orch->>Stats: recordStart(A1)
    Orch->>A1: run()
    activate A1
    A1->>A1: execute logic
    A1-->>Orch: complete
    deactivate A1
    Orch->>Stats: recordEnd(A1, duration)
    
    Orch->>Q: pop()
    Q-->>Orch: A2
    
    Orch->>Stats: recordStart(A2)
    Orch->>A2: run()
    activate A2
    A2->>A2: execute logic
    A2-->>Orch: complete
    deactivate A2
    Orch->>Stats: recordEnd(A2, duration)
    
    Orch-->>Loop: cycle complete
```

### Concurrent Agent Execution

```mermaid
flowchart TB
    Start([Start Cycle]) --> SelectAgents[Select Runnable Agents]
    SelectAgents --> SortByPriority[Sort by Priority]
    SortByPriority --> LimitConcurrency[Limit to maxConcurrency]
    LimitConcurrency --> CreateBatches[Create Execution Batches]
    
    CreateBatches --> Batch1[Batch 1: Agents 1-4]
    CreateBatches --> Batch2[Batch 2: Agents 5-8]
    CreateBatches --> Batch3[Batch 3: Agents 9-12]
    
    Batch1 --> Execute1[Execute Concurrently]
    Batch2 --> Execute2[Execute Concurrently]
    Batch3 --> Execute3[Execute Concurrently]
    
    Execute1 --> Wait1[Wait for Completion]
    Execute2 --> Wait2[Wait for Completion]
    Execute3 --> Wait3[Wait for Completion]
    
    Wait1 --> UpdateStats1[Update Statistics]
    Wait2 --> UpdateStats2[Update Statistics]
    Wait3 --> UpdateStats3[Update Statistics]
    
    UpdateStats1 --> Merge[Merge Results]
    UpdateStats2 --> Merge
    UpdateStats3 --> Merge
    
    Merge --> End([End Cycle])
```

## Reasoning Pipeline Flow

### Forward Chaining Process

```mermaid
sequenceDiagram
    participant Client
    participant PLN as PLN Reasoner
    participant Rules as Rule Engine
    participant AS as AtomSpace
    participant Matcher as Pattern Matcher
    
    Client->>PLN: forwardChain(maxSteps=10)
    
    loop For each step
        PLN->>AS: getAllAtoms()
        AS-->>PLN: atom set
        
        loop For each rule
            PLN->>Rules: getRule(i)
            Rules-->>PLN: rule
            
            PLN->>Matcher: findPremiseMatches(rule, atoms)
            Matcher->>Matcher: pattern matching
            Matcher-->>PLN: matching sets
            
            loop For each match set
                PLN->>PLN: computeTruthValue(premises)
                PLN->>PLN: instantiateConclusion(match)
                
                alt Confidence > threshold
                    PLN->>AS: addAtom(conclusion)
                    AS-->>PLN: new atom
                    PLN->>PLN: record inference step
                else Confidence too low
                    PLN->>PLN: skip
                end
            end
        end
        
        PLN->>PLN: check convergence
        
        alt Converged
            PLN->>PLN: break loop
        end
    end
    
    PLN-->>Client: inferred atoms
```

### Backward Chaining Process

```mermaid
graph TB
    Start([Goal: Mortal?Socrates?]) --> CheckAS{In AtomSpace?}
    
    CheckAS -->|Yes| Found([Proven])
    CheckAS -->|No| FindRule[Find Rule with<br/>Matching Conclusion]
    
    FindRule --> Rule1[Rule: Mortal?X? ← Man?X?]
    
    Rule1 --> Subgoal1[Subgoal: Man?Socrates?]
    
    Subgoal1 --> CheckAS2{In AtomSpace?}
    CheckAS2 -->|Yes| ProvePremise[Prove Premise]
    CheckAS2 -->|No| FindRule2[Find Rule for<br/>Man?X?]
    
    FindRule2 --> Rule2[Rule: Man?X? ← Human?X?]
    
    Rule2 --> Subgoal2[Subgoal: Human?Socrates?]
    
    Subgoal2 --> CheckAS3{In AtomSpace?}
    CheckAS3 -->|Yes| ProvePremise2[Premise Proven]
    CheckAS3 -->|No| Failed([Not Provable])
    
    ProvePremise --> AddConclusion1[Add: Man?Socrates?]
    ProvePremise2 --> AddConclusion2[Add: Human?Socrates?]
    
    AddConclusion1 --> AddFinal[Add: Mortal?Socrates?]
    AddConclusion2 --> AddConclusion1
    
    AddFinal --> Proven([Goal Proven])
```

### Truth Value Computation Flow

```mermaid
flowchart LR
    subgraph "Deduction"
        D1[A→B: s=0.9, c=0.8]
        D2[B→C: s=0.8, c=0.7]
        D3[Compute: s = 0.9×0.8<br/>c = 0.8×0.7]
        D4[A→C: s=0.72, c=0.56]
        
        D1 --> D3
        D2 --> D3
        D3 --> D4
    end
    
    subgraph "Induction"
        I1[Observation 1: s=0.9]
        I2[Observation 2: s=0.85]
        I3[Observation 3: s=0.88]
        I4[Compute: s = avg<br/>c = √n/√n+1]
        I5[Pattern: s=0.88, c=0.63]
        
        I1 --> I4
        I2 --> I4
        I3 --> I4
        I4 --> I5
    end
    
    subgraph "Abduction"
        A1[A→B: s=0.8, c=0.7]
        A2[B: s=0.9, c=0.8]
        A3[Compute: s = sB<br/>c = sAB×cAB×cB]
        A4[A: s=0.9, c=0.45]
        
        A1 --> A3
        A2 --> A3
        A3 --> A4
    end
```

## Module Loading Flow

### NodeSpace Module Tracking

```mermaid
sequenceDiagram
    participant App as Application
    participant Loader as ESM Loader
    participant NS as NodeSpace
    participant AS as AtomSpace
    participant AB as Attention Bank
    
    App->>Loader: import './module.js'
    activate Loader
    
    Loader->>NS: recordModule('module.js')
    NS->>AS: addNode('MODULE', 'module.js')
    AS-->>NS: module atom
    NS->>AB: setSTI(module, 50)
    
    Loader->>Loader: parse module
    Loader->>Loader: extract dependencies
    
    loop For each dependency
        Loader->>NS: recordDependency(module, dep)
        NS->>AS: addNode('MODULE', dep)
        NS->>AS: addLink('DEPENDS_ON', [module, dep])
        NS->>AB: spreadAttention(module)
    end
    
    Loader->>Loader: load and execute
    Loader-->>App: module exports
    deactivate Loader
    
    App->>App: use module
    App->>NS: incrementUseCount(module)
    NS->>AB: stimulate(module, 10)
```

### Dependency Graph Construction

```mermaid
graph TB
    subgraph "Application Modules"
        APP[app.js]
        UTIL[utils.js]
        CONFIG[config.js]
    end
    
    subgraph "Framework Modules"
        EXPRESS[express]
        OPENCOG[opencog]
    end
    
    subgraph "NodeSpace Representation"
        APP_ATOM[MODULE: app.js<br/>STI: 100]
        UTIL_ATOM[MODULE: utils.js<br/>STI: 80]
        CONFIG_ATOM[MODULE: config.js<br/>STI: 60]
        EXPRESS_ATOM[MODULE: express<br/>STI: 70]
        OPENCOG_ATOM[MODULE: opencog<br/>STI: 90]
        
        DEP1[DEPENDS_ON]
        DEP2[DEPENDS_ON]
        DEP3[DEPENDS_ON]
        DEP4[DEPENDS_ON]
    end
    
    APP --> UTIL
    APP --> EXPRESS
    APP --> OPENCOG
    UTIL --> CONFIG
    
    APP_ATOM --> DEP1
    DEP1 --> UTIL_ATOM
    
    APP_ATOM --> DEP2
    DEP2 --> EXPRESS_ATOM
    
    APP_ATOM --> DEP3
    DEP3 --> OPENCOG_ATOM
    
    UTIL_ATOM --> DEP4
    DEP4 --> CONFIG_ATOM
```

## Distributed Synchronization Flow

### Atom Replication Process

```mermaid
sequenceDiagram
    participant N1 as Node 1
    participant SM1 as Sync Manager 1
    participant Network
    participant SM2 as Sync Manager 2
    participant N2 as Node 2
    
    N1->>SM1: atom added (A)
    SM1->>SM1: check sync strategy
    
    alt Broadcast Strategy
        SM1->>Network: broadcast(A)
        Network->>SM2: atom message
        SM2->>SM2: validate atom
        SM2->>N2: addAtom(A)
        N2-->>SM2: added
        SM2->>Network: ack
        Network->>SM1: ack received
    end
    
    alt Pull Strategy
        SM2->>Network: request changes(since T)
        Network->>SM1: change request
        SM1->>SM1: collect changes
        SM1->>Network: changes [A, B, C]
        Network->>SM2: change batch
        SM2->>N2: apply changes
        N2-->>SM2: applied
    end
    
    alt Attention-Based Strategy
        SM1->>SM1: check A.sti > threshold
        
        alt High attention
            SM1->>Network: priority sync(A)
            Network->>SM2: atom message (priority)
            SM2->>N2: addAtom(A) immediately
        else Low attention
            SM1->>SM1: queue for batch
            SM1->>SM1: wait for batch interval
            SM1->>Network: batch sync([A, ...])
        end
    end
```

### Conflict Resolution Flow

```mermaid
flowchart TB
    Start([Receive Remote Atom]) --> CheckExists{Atom Exists<br/>Locally?}
    
    CheckExists -->|No| AddAtom[Add Atom to Local AtomSpace]
    CheckExists -->|Yes| CompareVersions{Same Content?}
    
    CompareVersions -->|Yes| UpdateTimestamp[Update Timestamp Only]
    CompareVersions -->|No| DetectConflict[Conflict Detected]
    
    DetectConflict --> CheckStrategy{Resolution<br/>Strategy?}
    
    CheckStrategy -->|Merge| MergeTruthValues[Merge Truth Values<br/>Average STI/LTI]
    CheckStrategy -->|Priority| ComparePriority{Compare<br/>Priorities?}
    CheckStrategy -->|Manual| QueueManual[Queue for Manual Resolution]
    
    ComparePriority -->|Local Higher| KeepLocal[Keep Local Version]
    ComparePriority -->|Remote Higher| UseRemote[Use Remote Version]
    ComparePriority -->|Equal| UseNewer{Compare<br/>Timestamps?}
    
    UseNewer -->|Local Newer| KeepLocal
    UseNewer -->|Remote Newer| UseRemote
    
    MergeTruthValues --> RecordResolution[Record Resolution in Log]
    KeepLocal --> RecordResolution
    UseRemote --> RecordResolution
    QueueManual --> RecordResolution
    
    AddAtom --> UpdateVersion[Update Version Vector]
    UpdateTimestamp --> UpdateVersion
    RecordResolution --> UpdateVersion
    
    UpdateVersion --> End([Complete])
```

### Version Vector Synchronization

```mermaid
sequenceDiagram
    participant N1 as Node 1<br/>V=[1,0,0]
    participant N2 as Node 2<br/>V=[0,1,0]
    participant N3 as Node 3<br/>V=[0,0,1]
    
    Note over N1,N3: Initial State
    
    N1->>N1: local update
    N1->>N1: V=[2,0,0]
    
    N1->>N2: sync(atom, V=[2,0,0])
    N2->>N2: merge vectors
    N2->>N2: V=[2,1,0]
    
    N2->>N2: local update
    N2->>N2: V=[2,2,0]
    
    N2->>N3: sync(atom, V=[2,2,0])
    N3->>N3: merge vectors
    N3->>N3: V=[2,2,1]
    
    N3->>N3: local update
    N3->>N3: V=[2,2,2]
    
    N3->>N1: sync(atom, V=[2,2,2])
    N1->>N1: merge vectors
    N1->>N1: V=[2,2,2]
    
    Note over N1,N3: Synchronized State
```

## Cognitive Synergy Engine Flow

### Multi-Isolate Execution

```mermaid
sequenceDiagram
    participant App as Application
    participant CSE as Cognitive Synergy Engine
    participant Sched as Cognitive Scheduler
    participant I1 as Isolate 1 (Reasoning)
    participant I2 as Isolate 2 (Perception)
    participant I3 as Isolate 3 (Planning)
    
    App->>CSE: createIsolate('reasoning', {sti: 100})
    CSE->>I1: initialize
    I1-->>CSE: ready
    
    App->>CSE: createIsolate('perception', {sti: 80})
    CSE->>I2: initialize
    I2-->>CSE: ready
    
    App->>CSE: createIsolate('planning', {sti: 60})
    CSE->>I3: initialize
    I3-->>CSE: ready
    
    App->>CSE: start()
    activate CSE
    
    loop Cognitive Loop
        CSE->>Sched: selectNextIsolate()
        Sched->>Sched: compare STI values
        Sched-->>CSE: I1 (highest STI)
        
        CSE->>I1: runMicrotasks()
        activate I1
        I1->>I1: execute JavaScript
        I1-->>CSE: complete
        deactivate I1
        
        CSE->>Sched: decay(I1)
        CSE->>Sched: updateAttention(I1)
        
        CSE->>Sched: selectNextIsolate()
        Sched-->>CSE: I2
        
        CSE->>I2: runMicrotasks()
        activate I2
        I2->>I2: execute JavaScript
        I2-->>CSE: complete
        deactivate I2
    end
    
    deactivate CSE
```

### Attention-Based Scheduling

```mermaid
flowchart TB
    Start([Cognitive Tick]) --> GetIsolates[Get All Isolates]
    GetIsolates --> SortBySTI[Sort by STI Value]
    
    SortBySTI --> Select[Select Highest STI]
    Select --> CheckReady{Isolate Ready?}
    
    CheckReady -->|Yes| Execute[Execute Microtasks]
    CheckReady -->|No| NextIsolate[Next Isolate]
    
    Execute --> Monitor[Monitor Resources]
    Monitor --> CheckMemory{Memory<br/>Pressure?}
    
    CheckMemory -->|High| ReduceSTI[Reduce STI by 10%]
    CheckMemory -->|Normal| MaintainSTI[Maintain STI]
    
    ReduceSTI --> ApplyDecay[Apply Decay Rate]
    MaintainSTI --> ApplyDecay
    
    ApplyDecay --> UpdateMetrics[Update Metrics]
    UpdateMetrics --> NextIsolate
    
    NextIsolate --> CheckDone{All Isolates<br/>Processed?}
    CheckDone -->|No| SortBySTI
    CheckDone -->|Yes| Sleep[Sleep Until Next Tick]
    
    Sleep --> Start
```

## Component Communication Patterns

### Event-Driven Communication

```mermaid
graph LR
    subgraph "Publishers"
        AS[AtomSpace]
        AB[Attention Bank]
        Orch[Orchestrator]
    end
    
    subgraph "Event Bus"
        EB[Event Emitter]
    end
    
    subgraph "Subscribers"
        VIZ[Visualization]
        LOGGER[Logger]
        PERSIST[Persistence]
        MONITOR[Monitor]
    end
    
    AS -->|atom-added| EB
    AS -->|atom-updated| EB
    AS -->|atom-removed| EB
    
    AB -->|attention-changed| EB
    AB -->|focus-shifted| EB
    
    Orch -->|agent-started| EB
    Orch -->|agent-completed| EB
    Orch -->|cycle-complete| EB
    
    EB -->|events| VIZ
    EB -->|events| LOGGER
    EB -->|events| PERSIST
    EB -->|events| MONITOR
```

### Request-Response Pattern

```mermaid
sequenceDiagram
    participant Client
    participant API as API Layer
    participant Service as Service Layer
    participant AS as AtomSpace
    participant Cache
    
    Client->>API: GET /atoms?type=CONCEPT
    API->>Cache: check(query)
    
    alt Cache Hit
        Cache-->>API: cached results
        API-->>Client: 200 OK (from cache)
    else Cache Miss
        Cache-->>API: not found
        API->>Service: getAtomsByType('CONCEPT')
        Service->>AS: query
        AS-->>Service: atoms
        Service->>Service: transform
        Service-->>API: results
        API->>Cache: store(query, results)
        API-->>Client: 200 OK (fresh)
    end
```

### Pub-Sub Pattern for Distributed Atoms

```mermaid
graph TB
    subgraph "Publishers (Nodes)"
        P1[Node 1]
        P2[Node 2]
        P3[Node 3]
    end
    
    subgraph "Message Broker"
        TOPIC1[Topic: high-attention]
        TOPIC2[Topic: concepts]
        TOPIC3[Topic: relations]
    end
    
    subgraph "Subscribers (Nodes)"
        S1[Node 4]
        S2[Node 5]
        S3[Node 6]
    end
    
    P1 -->|publish| TOPIC1
    P2 -->|publish| TOPIC2
    P3 -->|publish| TOPIC3
    
    TOPIC1 -->|subscribe| S1
    TOPIC1 -->|subscribe| S2
    
    TOPIC2 -->|subscribe| S2
    TOPIC2 -->|subscribe| S3
    
    TOPIC3 -->|subscribe| S1
    TOPIC3 -->|subscribe| S3
```

### Pipeline Pattern for Data Processing

```mermaid
flowchart LR
    Input[Raw Input] --> Stage1[Tokenization]
    Stage1 --> Stage2[Entity Extraction]
    Stage2 --> Stage3[Atomification]
    Stage3 --> Stage4[Relationship Detection]
    Stage4 --> Stage5[Truth Value Assignment]
    Stage5 --> Stage6[Attention Allocation]
    Stage6 --> Output[AtomSpace]
    
    Stage1 -.error.-> ErrorHandler[Error Handler]
    Stage2 -.error.-> ErrorHandler
    Stage3 -.error.-> ErrorHandler
    Stage4 -.error.-> ErrorHandler
    Stage5 -.error.-> ErrorHandler
    Stage6 -.error.-> ErrorHandler
    
    ErrorHandler --> Retry{Retry?}
    Retry -->|Yes| Stage1
    Retry -->|No| Failed[Failed Pipeline]
```

## Performance Monitoring Flow

### Metrics Collection

```mermaid
sequenceDiagram
    participant System as Cognitive System
    participant Collector as Metrics Collector
    participant Aggregator
    participant Storage
    participant Dashboard
    
    loop Every Second
        System->>Collector: atomspace.size
        System->>Collector: attention.totalSTI
        System->>Collector: orchestrator.activeAgents
        
        Collector->>Aggregator: raw metrics
        
        Aggregator->>Aggregator: compute avg, min, max
        Aggregator->>Storage: store time-series
        
        Storage->>Dashboard: update visualization
    end
```

### Performance Bottleneck Detection

```mermaid
flowchart TB
    Start([Monitor]) --> CollectMetrics[Collect Metrics]
    CollectMetrics --> AnalyzeCPU{CPU > 80%?}
    
    AnalyzeCPU -->|Yes| CheckComponent[Identify Component]
    AnalyzeCPU -->|No| AnalyzeMemory{Memory > 80%?}
    
    AnalyzeMemory -->|Yes| CheckComponent
    AnalyzeMemory -->|No| AnalyzeLatency{Latency > 100ms?}
    
    AnalyzeLatency -->|Yes| CheckComponent
    AnalyzeLatency -->|No| OK[All OK]
    
    CheckComponent --> ProfilerAgent{Agent<br/>Profiler?}
    CheckComponent --> ProfilerAtomSpace{AtomSpace<br/>Profiler?}
    CheckComponent --> ProfilerAttention{Attention<br/>Profiler?}
    
    ProfilerAgent --> Optimize1[Optimize Agent Logic]
    ProfilerAtomSpace --> Optimize2[Optimize Indices]
    ProfilerAttention --> Optimize3[Adjust Decay Rate]
    
    Optimize1 --> Alert[Send Alert]
    Optimize2 --> Alert
    Optimize3 --> Alert
    
    Alert --> Start
    OK --> Start
```

## Conclusion

This document provides comprehensive visualization of how NodeCog components interact and how data flows through the system. The Mermaid diagrams illustrate:

1. **Sequence flows** - Temporal ordering of operations
2. **State transitions** - Component state changes
3. **Data flows** - How information moves through the system
4. **Communication patterns** - Inter-component messaging
5. **Deployment patterns** - Distributed system architecture

These diagrams serve as essential documentation for understanding, maintaining, and extending the NodeCog cognitive architecture.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-30
**Diagrams**: Mermaid.js
