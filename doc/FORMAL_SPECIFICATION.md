# NodeCog Formal Specification in Z++

## Introduction

This document provides comprehensive formal specifications for the NodeCog cognitive architecture using Z++ notation. Z++ extends the Z notation with object-oriented features suitable for specifying complex systems.

## Table of Contents

- [Basic Types and Constants](#basic-types-and-constants)
- [AtomSpace Specification](#atomspace-specification)
- [Attention Dynamics Specification](#attention-dynamics-specification)
- [Agent System Specification](#agent-system-specification)
- [Cognitive Loop Specification](#cognitive-loop-specification)
- [PLN Reasoning Specification](#pln-reasoning-specification)
- [Temporal Reasoning Specification](#temporal-reasoning-specification)
- [Distributed AtomSpace Specification](#distributed-atomspace-specification)
- [Invariants and Theorems](#invariants-and-theorems)

## Basic Types and Constants

```z++
[ID, String, Time]

AtomType ::= NODE | LINK | CONCEPT | PREDICATE | VARIABLE | 
             INHERITANCE | SIMILARITY | EVALUATION | EXECUTION | 
             IMPLICATION | TEMPORAL_LINK | PREDICTIVE_IMPLICATION

SchedulingStrategy ::= PRIORITY_BASED | ROUND_ROBIN | 
                       ATTENTION_BASED | FIFO

SyncStrategy ::= BROADCAST | PULL | ATTENTION_BASED | HYBRID

AgentState ::= IDLE | READY | RUNNING | SUSPENDED | COMPLETED | FAILED

ℝ₊ == {x : ℝ | x ≥ 0}
ℝ₊₊ == {x : ℝ | x > 0}
```

## AtomSpace Specification

### Core Data Structures

```z++
schema TruthValue
  strength: [0..1]
  confidence: [0..1]

where
  # Strength and confidence must be in valid range
  0 ≤ strength ≤ 1 ∧ 0 ≤ confidence ≤ 1
  
  # Combined certainty constraint
  strength × confidence ≤ 1
end

operation mergeTruthValues
  tv1?: TruthValue
  tv2?: TruthValue
  result!: TruthValue

where
  # Higher confidence truth value dominates
  tv1?.confidence > tv2?.confidence ⇒
    result! = tv1?
  tv2?.confidence > tv1?.confidence ⇒
    result! = tv2?
  tv1?.confidence = tv2?.confidence ⇒
    result!.strength = (tv1?.strength + tv2?.strength) / 2 ∧
    result!.confidence = max(tv1?.confidence, tv2?.confidence)
end

schema AttentionValue
  sti: ℝ
  lti: ℝ
  vlti: 𝔹

where
  # STI can be negative (low importance)
  sti ∈ ℝ
  
  # LTI should be non-negative
  lti ≥ 0
  
  # VLTI protects from forgetting
  vlti ∈ {true, false}
end

schema Atom
  id: ID
  type: AtomType
  name: String
  outgoing: seq Atom
  incoming: set Atom
  truthValue: TruthValue
  attention: AttentionValue
  timestamp: Time
  metadata: String ↦ String

where
  # Unique ID
  id ≠ null
  
  # Valid atom type
  type ∈ AtomType
  
  # Consistency between incoming and outgoing
  ∀ o: ran outgoing • this ∈ o.incoming
  ∀ i: incoming • this ∈ ran i.outgoing
  
  # No self-loops
  this ∉ ran outgoing
  
  # Valid truth value
  truthValue.strength ∈ [0..1] ∧
  truthValue.confidence ∈ [0..1]
  
  # Timestamp is monotonic
  timestamp ≥ 0
end

schema AtomSpaceIndex
  byType: AtomType ↦ ℙ ID
  byName: String ↦ ℙ ID
  byPattern: String ↦ ℙ ID
  byTimestamp: Time ↦ ℙ ID

where
  # Index coverage - all atoms must be indexed
  ∀ type: dom byType • byType[type] ≠ ∅
  
  # No duplicate IDs in indices
  ∀ type: dom byType • 
    ∀ id₁, id₂: byType[type] • id₁ = id₂ ∨ id₁ ≠ id₂
end

schema AtomSpace
  atoms: ID ↦ Atom
  index: AtomSpaceIndex
  maxSize: ℕ₊
  forgettingEnabled: 𝔹
  currentSize: ℕ

where
  # Size constraints
  currentSize = #atoms
  currentSize ≤ maxSize
  
  # Unique atom IDs
  ∀ id₁, id₂: dom atoms • id₁ ≠ id₂ ⇒ atoms[id₁] ≠ atoms[id₂]
  
  # Index consistency
  ∀ id: dom atoms • 
    let a = atoms[id]
    id ∈ index.byType[a.type] ∧
    (a.name ≠ null ⇒ id ∈ index.byName[a.name]) ∧
    id ∈ index.byTimestamp[a.timestamp]
  
  # Atom reference integrity
  ∀ a: ran atoms •
    ∀ o: ran a.outgoing • o.id ∈ dom atoms
end
```

### AtomSpace Operations

```z++
operation ΞAtomSpace
  Δ(AtomSpace)

where
  atoms' = atoms
  index' = index
  maxSize' = maxSize
  forgettingEnabled' = forgettingEnabled
  currentSize' = currentSize
end

operation addAtom
  Δ(AtomSpace)
  type?: AtomType
  name?: String
  outgoing?: seq Atom
  truthValue?: TruthValue
  result!: Atom

where
  # Pre-condition: space available
  currentSize < maxSize
  
  # Generate unique ID
  result!.id ∉ dom atoms
  
  # Create new atom
  result! = Atom(
    id: generateId(),
    type: type?,
    name: name?,
    outgoing: outgoing? or ⟨⟩,
    incoming: ∅,
    truthValue: truthValue? or TruthValue(1.0, 1.0),
    attention: AttentionValue(0, 0, false),
    timestamp: now(),
    metadata: ∅
  )
  
  # Update atoms collection
  atoms' = atoms ∪ {result!.id ↦ result!}
  
  # Update indices
  index'.byType[type?] = index.byType[type?] ∪ {result!.id}
  
  name? ≠ null ⇒ 
    index'.byName[name?] = index.byName[name?] ∪ {result!.id}
  
  index'.byTimestamp[result!.timestamp] = 
    index.byTimestamp[result!.timestamp] ∪ {result!.id}
  
  # Update incoming links
  ∀ o: ran outgoing? •
    atoms'[o.id].incoming = atoms[o.id].incoming ∪ {result!}
  
  # Update size
  currentSize' = currentSize + 1
end

operation removeAtom
  Δ(AtomSpace)
  atomId?: ID
  success!: 𝔹

where
  # Pre-condition: atom exists
  atomId? ∈ dom atoms ⇒
    let a = atoms[atomId?]
    
    # Cannot remove if it has incoming links (unless force=true)
    a.incoming = ∅ ∨ a.attention.vlti = false
    
    # Remove from atoms
    atoms' = {atomId?} ⩤ atoms
    
    # Update indices
    index'.byType[a.type] = index.byType[a.type] ∖ {atomId?}
    a.name ≠ null ⇒
      index'.byName[a.name] = index.byName[a.name] ∖ {atomId?}
    index'.byTimestamp[a.timestamp] = 
      index.byTimestamp[a.timestamp] ∖ {atomId?}
    
    # Update outgoing atoms' incoming sets
    ∀ o: ran a.outgoing •
      atoms'[o.id].incoming = atoms[o.id].incoming ∖ {a}
    
    # Update size
    currentSize' = currentSize - 1
    
    success! = true
  
  atomId? ∉ dom atoms ⇒
    ΞAtomSpace ∧ success! = false
end

operation getAtom
  ΞAtomSpace
  atomId?: ID
  result!: Atom ∪ {null}

where
  atomId? ∈ dom atoms ⇒
    result! = atoms[atomId?]
  atomId? ∉ dom atoms ⇒
    result! = null
end

operation patternMatch
  ΞAtomSpace
  pattern?: Pattern
  result!: seq Atom

where
  # Find all atoms matching the pattern
  result! = ⟨a : ran atoms | matches(a, pattern?)⟩
  
  # Result is ordered by attention (STI)
  ∀ i, j: dom result! • 
    i < j ⇒ result![i].attention.sti ≥ result![j].attention.sti
end

operation forget
  Δ(AtomSpace)
  threshold?: ℝ
  removed!: ℕ

where
  forgettingEnabled = true
  
  # Select atoms to forget
  let toForget = {a : ran atoms | 
    a.attention.sti < (threshold? or 0) ∧
    a.attention.vlti = false ∧
    a.incoming = ∅
  }
  
  # Remove low-attention atoms
  ∀ a: toForget • removeAtom(a.id)
  
  # Count removed atoms
  removed! = #toForget
  
  # Update size
  currentSize' = currentSize - removed!
end
```

### Pattern Matching

```z++
schema Pattern
  type: AtomType ∪ {any}
  nameConstraint: String ∪ {any, none}
  outgoingPattern: seq Pattern
  stiConstraint: ℝ ∪ {any}
  ltiConstraint: ℝ ∪ {any}
  customPredicate: (Atom → 𝔹) ∪ {none}

where
  # Valid type
  type ∈ AtomType ∪ {any}
  
  # Recursive pattern validity
  ∀ p: ran outgoingPattern • p.isValid()
end

function matches
  atom: Atom
  pattern: Pattern
  result: 𝔹

where
  result = 
    (pattern.type = any ∨ atom.type = pattern.type) ∧
    (pattern.nameConstraint = any ∨ 
     pattern.nameConstraint = none ∧ atom.name = null ∨
     atom.name = pattern.nameConstraint) ∧
    (pattern.stiConstraint = any ∨ 
     atom.attention.sti ≥ pattern.stiConstraint) ∧
    (pattern.ltiConstraint = any ∨ 
     atom.attention.lti ≥ pattern.ltiConstraint) ∧
    (#atom.outgoing = #pattern.outgoingPattern) ∧
    (∀ i: dom pattern.outgoingPattern •
      matches(atom.outgoing[i], pattern.outgoingPattern[i])) ∧
    (pattern.customPredicate = none ∨
     pattern.customPredicate(atom) = true)
end
```

## Attention Dynamics Specification

```z++
schema AttentionConfig
  maxSTI: ℝ₊₊
  maxLTI: ℝ₊₊
  minSTI: ℝ
  decayRate: [0..1]
  spreadFactor: [0..1]
  focusThreshold: ℝ₊
  normalizationFrequency: ℕ₊

where
  # Sensible bounds
  maxSTI > 0 ∧ maxLTI > 0
  minSTI < 0
  
  # Decay must be gradual
  0 < decayRate < 0.5
  
  # Spread must be conservative
  0 < spreadFactor < 0.3
  
  # Focus threshold positive
  focusThreshold > 0
end

schema AttentionBank
  atomspace: AtomSpace
  config: AttentionConfig
  totalSTI: ℝ
  totalLTI: ℝ
  focusSet: ℙ ID
  cyclesSinceNormalization: ℕ

where
  # Conservation of attention
  totalSTI = Σ{id: dom atomspace.atoms • 
              atomspace.atoms[id].attention.sti}
  totalLTI = Σ{id: dom atomspace.atoms • 
              atomspace.atoms[id].attention.lti}
  
  # Bounds on total attention
  totalSTI ≤ config.maxSTI
  totalLTI ≤ config.maxLTI
  
  # Focus set contains high-attention atoms
  focusSet = {id: dom atomspace.atoms | 
              atomspace.atoms[id].attention.sti ≥ config.focusThreshold}
  
  # Normalization counter
  cyclesSinceNormalization < config.normalizationFrequency
end

operation setSTI
  Δ(AttentionBank)
  atomId?: ID
  value?: ℝ

where
  atomId? ∈ dom atomspace.atoms
  
  let a = atomspace.atoms[atomId?]
  let oldSTI = a.attention.sti
  
  # Update atom STI
  atomspace'.atoms[atomId?].attention.sti = value?
  
  # Update total STI
  totalSTI' = totalSTI - oldSTI + value?
  
  # Maintain bounds
  totalSTI' ≤ config.maxSTI ⇒
    atomspace'' = atomspace'
  totalSTI' > config.maxSTI ⇒
    normalize()
end

operation setLTI
  Δ(AttentionBank)
  atomId?: ID
  value?: ℝ₊

where
  atomId? ∈ dom atomspace.atoms
  value? ≥ 0
  
  let a = atomspace.atoms[atomId?]
  let oldLTI = a.attention.lti
  
  # Update atom LTI
  atomspace'.atoms[atomId?].attention.lti = value?
  
  # Update total LTI
  totalLTI' = totalLTI - oldLTI + value?
  
  # Maintain bounds
  totalLTI' ≤ config.maxLTI
end

operation decay
  Δ(AttentionBank)
  rate?: [0..1]

where
  let decayRate = rate? or config.decayRate
  
  # Exponential decay of STI
  ∀ id: dom atomspace.atoms •
    let a = atomspace.atoms[id]
    atomspace'.atoms[id].attention.sti = 
      a.attention.sti × (1 - decayRate)
  
  # LTI remains constant
  ∀ id: dom atomspace.atoms •
    atomspace'.atoms[id].attention.lti = 
      atomspace.atoms[id].attention.lti
  
  # Update total STI
  totalSTI' = totalSTI × (1 - decayRate)
  
  # LTI unchanged
  totalLTI' = totalLTI
end

operation spreadAttention
  Δ(AttentionBank)
  sourceId?: ID
  factor?: [0..1]

where
  sourceId? ∈ dom atomspace.atoms
  
  let source = atomspace.atoms[sourceId?]
  let spreadFactor = factor? or config.spreadFactor
  let connected = source.outgoing ∪ source.incoming
  
  # Calculate spread amount per connected atom
  let spreadAmount = (source.attention.sti × spreadFactor) / #connected
  
  # Spread to connected atoms
  ∀ a: connected •
    atomspace'.atoms[a.id].attention.sti = 
      atomspace.atoms[a.id].attention.sti + spreadAmount
  
  # Reduce source attention
  atomspace'.atoms[sourceId?].attention.sti = 
    source.attention.sti - (spreadAmount × #connected)
  
  # Total STI preserved
  totalSTI' = totalSTI
end

operation normalize
  Δ(AttentionBank)

where
  let currentTotal = Σ{id: dom atomspace.atoms • 
                       atomspace.atoms[id].attention.sti}
  
  # Normalize if over budget
  currentTotal > config.maxSTI ⇒
    let scaleFactor = config.maxSTI / currentTotal
    ∀ id: dom atomspace.atoms •
      atomspace'.atoms[id].attention.sti = 
        atomspace.atoms[id].attention.sti × scaleFactor
    totalSTI' = config.maxSTI
  
  # No change if within budget
  currentTotal ≤ config.maxSTI ⇒
    atomspace' = atomspace ∧
    totalSTI' = totalSTI
  
  # Reset normalization counter
  cyclesSinceNormalization' = 0
end

operation stimulate
  Δ(AttentionBank)
  atomId?: ID
  amount?: ℝ₊

where
  atomId? ∈ dom atomspace.atoms
  amount? > 0
  
  # Increase STI
  setSTI(atomId?, atomspace.atoms[atomId?].attention.sti + amount?)
  
  # Spread if STI is high
  atomspace'.atoms[atomId?].attention.sti > config.focusThreshold ⇒
    spreadAttention(atomId?, config.spreadFactor)
end

operation getAttentionalFocus
  ΞAttentionBank
  n?: ℕ₊
  result!: seq ID

where
  # Get top n atoms by STI
  let sorted = sort(dom atomspace.atoms, 
                    λ id₁, id₂ • atomspace.atoms[id₁].attention.sti >
                                 atomspace.atoms[id₂].attention.sti)
  
  result! = sorted[1..min(n?, #sorted)]
  
  # Result is sorted by STI descending
  ∀ i, j: dom result! • 
    i < j ⇒ 
      atomspace.atoms[result![i]].attention.sti ≥ 
      atomspace.atoms[result![j]].attention.sti
end
```

## Agent System Specification

```z++
schema AgentStats
  executions: ℕ
  totalTime: ℝ₊
  avgTime: ℝ₊
  lastExecution: Time
  errors: ℕ
  successRate: [0..1]

where
  # Statistics consistency
  avgTime = totalTime / max(executions, 1)
  successRate = (executions - errors) / max(executions, 1)
  errors ≤ executions
end

schema Agent
  name: String
  priority: ℕ
  frequency: ℕ₊
  atomspace: AtomSpace
  attentionBank: AttentionBank
  state: AgentState
  lastRun: Time
  cycleCount: ℕ

where
  # Valid name
  name ≠ null ∧ #name > 0
  
  # Priority range
  0 ≤ priority ≤ 100
  
  # Frequency must be positive
  frequency > 0
  
  # State is valid
  state ∈ AgentState
end

operation shouldRun
  ΞAgent
  currentCycle?: ℕ
  result!: 𝔹

where
  result! = 
    state = READY ∧
    currentCycle? mod frequency = 0 ∧
    (lastRun = null ∨ now() - lastRun ≥ frequency)
end

operation run
  Δ(Agent)
  result!: AgentState

where
  # Pre-condition: agent is ready
  state = READY
  
  # Update state
  state' = RUNNING
  
  # Execute agent logic (abstract)
  execute()
  
  # Update run timestamp
  lastRun' = now()
  cycleCount' = cycleCount + 1
  
  # Update state based on execution result
  executionSuccessful() ⇒ state'' = READY
  executionFailed() ⇒ state'' = FAILED
  
  result! = state''
end

schema OrchestrationConfig
  maxConcurrency: ℕ₊
  schedulingStrategy: SchedulingStrategy
  defaultPriority: ℕ
  enableStats: 𝔹

where
  maxConcurrency > 0
  0 ≤ defaultPriority ≤ 100
end

schema AgentOrchestrator
  agents: ID ↦ Agent
  config: OrchestrationConfig
  stats: ID ↦ AgentStats
  currentCycle: ℕ
  activeAgents: ℙ ID

where
  # All agents have stats if enabled
  config.enableStats ⇒ dom stats = dom agents
  
  # Active agents are running
  ∀ id: activeAgents • agents[id].state = RUNNING
  
  # Concurrency limit
  #activeAgents ≤ config.maxConcurrency
  
  # Agents are properly indexed
  ∀ id: dom agents • id ≠ null
end

operation addAgent
  Δ(AgentOrchestrator)
  agent?: Agent
  result!: 𝔹

where
  # Agent must be unique
  agent?.name ∉ {a: ran agents • a.name}
  
  # Generate new ID
  let newId = generateId()
  
  # Add agent
  agents' = agents ∪ {newId ↦ agent?}
  
  # Initialize stats if enabled
  config.enableStats ⇒
    stats' = stats ∪ {newId ↦ AgentStats(0, 0, 0, null, 0, 1.0)}
  
  result! = true
end

operation removeAgent
  Δ(AgentOrchestrator)
  agentId?: ID
  result!: 𝔹

where
  agentId? ∈ dom agents ⇒
    # Cannot remove running agent
    agents[agentId?].state ≠ RUNNING
    
    # Remove agent
    agents' = {agentId?} ⩤ agents
    
    # Remove stats
    stats' = {agentId?} ⩤ stats
    
    # Remove from active set
    activeAgents' = activeAgents ∖ {agentId?}
    
    result! = true
  
  agentId? ∉ dom agents ⇒
    ΞAgentOrchestrator ∧ result! = false
end

operation runCycle
  Δ(AgentOrchestrator)
  executed!: ℕ

where
  # Select runnable agents based on strategy
  let runnable = selectRunnableAgents()
  
  # Sort by priority if priority-based
  config.schedulingStrategy = PRIORITY_BASED ⇒
    let sorted = sort(runnable, 
                      λ id₁, id₂ • agents[id₁].priority > agents[id₂].priority)
  
  # Execute agents with concurrency limit
  let toExecute = sorted[1..min(#sorted, config.maxConcurrency)]
  
  ∀ id: toExecute •
    let startTime = now()
    agents[id].run()
    let endTime = now()
    let duration = endTime - startTime
    
    # Update stats
    stats'[id].executions = stats[id].executions + 1
    stats'[id].totalTime = stats[id].totalTime + duration
    stats'[id].lastExecution = endTime
    
    # Update error count if failed
    agents'[id].state = FAILED ⇒
      stats'[id].errors = stats[id].errors + 1
  
  # Update active agents
  activeAgents' = toExecute
  
  # Increment cycle
  currentCycle' = currentCycle + 1
  
  executed! = #toExecute
end
```

## Cognitive Loop Specification

```z++
schema LoopConfig
  interval: ℕ₊
  autoDecay: 𝔹
  autoNormalize: 𝔹
  autoForget: 𝔹
  decayRate: [0..1]
  forgetThreshold: ℝ

where
  interval > 0
  0 < decayRate < 1
end

schema CognitiveLoop
  atomspace: AtomSpace
  attentionBank: AttentionBank
  orchestrator: AgentOrchestrator
  config: LoopConfig
  state: {idle, running, paused, stopped}
  cycleCount: ℕ
  startTime: Time
  statistics: LoopStatistics

where
  state ∈ {idle, running, paused, stopped}
  cycleCount ≥ 0
end

schema LoopStatistics
  totalCycles: ℕ
  totalTime: ℝ₊
  avgCycleTime: ℝ₊
  atomsProcessed: ℕ
  agentsExecuted: ℕ
  atomsForgotten: ℕ

where
  avgCycleTime = totalTime / max(totalCycles, 1)
end

operation start
  Δ(CognitiveLoop)
  result!: 𝔹

where
  state = idle ⇒
    state' = running
    startTime' = now()
    cycleCount' = 0
    result! = true
  
  state ≠ idle ⇒
    ΞCognitiveLoop ∧ result! = false
end

operation pause
  Δ(CognitiveLoop)
  result!: 𝔹

where
  state = running ⇒
    state' = paused
    result! = true
  
  state ≠ running ⇒
    ΞCognitiveLoop ∧ result! = false
end

operation resume
  Δ(CognitiveLoop)
  result!: 𝔹

where
  state = paused ⇒
    state' = running
    result! = true
  
  state ≠ paused ⇒
    ΞCognitiveLoop ∧ result! = false
end

operation stop
  Δ(CognitiveLoop)
  result!: 𝔹

where
  state ∈ {running, paused} ⇒
    state' = stopped
    result! = true
  
  state ∉ {running, paused} ⇒
    ΞCognitiveLoop ∧ result! = false
end

operation runCycle
  Δ(CognitiveLoop)
  result!: CycleResult

where
  # Pre-condition: loop is running
  state = running
  
  let cycleStartTime = now()
  
  # Execute agent orchestration
  let agentsExecuted = orchestrator.runCycle()
  
  # Auto decay if enabled
  config.autoDecay ⇒
    attentionBank.decay(config.decayRate)
  
  # Auto normalize if enabled
  config.autoNormalize ⇒
    attentionBank.normalize()
  
  # Auto forget if enabled
  config.autoForget ⇒
    let forgotten = atomspace.forget(config.forgetThreshold)
    statistics'.atomsForgotten = statistics.atomsForgotten + forgotten
  
  # Update statistics
  let cycleTime = now() - cycleStartTime
  statistics'.totalCycles = statistics.totalCycles + 1
  statistics'.totalTime = statistics.totalTime + cycleTime
  statistics'.agentsExecuted = statistics.agentsExecuted + agentsExecuted
  statistics'.atomsProcessed = statistics.atomsProcessed + #atomspace.atoms
  
  # Increment cycle count
  cycleCount' = cycleCount + 1
  
  # Sleep until next cycle
  sleep(config.interval)
  
  result! = CycleResult(cycleCount', agentsExecuted, cycleTime)
end
```

## PLN Reasoning Specification

```z++
schema InferenceRule
  name: String
  premises: seq Pattern
  conclusion: Pattern
  formula: TruthValueFormula
  cost: ℝ₊

where
  # Valid rule name
  #name > 0
  
  # At least one premise
  #premises > 0
  
  # Premises and conclusion are valid
  ∀ p: ran premises • p.isValid()
  conclusion.isValid()
  
  # Cost is non-negative
  cost ≥ 0
end

schema TruthValueFormula
  compute: seq TruthValue → TruthValue

where
  # Formula must be well-defined
  ∀ tvs: seq TruthValue • 
    compute(tvs).strength ∈ [0..1] ∧
    compute(tvs).confidence ∈ [0..1]
end

# Standard inference formulas

DeductionFormula: TruthValueFormula
where
  # P(A→B) ∧ P(B→C) ⇒ P(A→C)
  compute = λ tvs: seq TruthValue •
    let sAB = tvs[1].strength
    let sBC = tvs[2].strength
    let cAB = tvs[1].confidence
    let cBC = tvs[2].confidence
    TruthValue(
      strength: sAB × sBC,
      confidence: cAB × cBC
    )
end

InductionFormula: TruthValueFormula
where
  # Multiple observations → general pattern
  compute = λ tvs: seq TruthValue •
    let n = #tvs
    let avgStrength = (Σ{tv: ran tvs • tv.strength}) / n
    let avgConfidence = (Σ{tv: ran tvs • tv.confidence}) / n
    TruthValue(
      strength: avgStrength,
      confidence: avgConfidence × sqrt(n) / (sqrt(n) + 1)
    )
end

AbductionFormula: TruthValueFormula
where
  # P(A→B) ∧ P(B) ⇒ P(A)
  compute = λ tvs: seq TruthValue •
    let sAB = tvs[1].strength
    let sB = tvs[2].strength
    let cAB = tvs[1].confidence
    let cB = tvs[2].confidence
    TruthValue(
      strength: sB,
      confidence: sAB × cAB × cB
    )
end

schema PLNConfig
  maxSteps: ℕ₊
  maxComplexity: ℕ₊
  minConfidence: [0..1]
  inferenceStrategy: {forward, backward, bidirectional}

where
  maxSteps > 0
  maxComplexity > 0
  0 < minConfidence ≤ 1
end

schema PLNReasoner
  atomspace: AtomSpace
  rules: seq InferenceRule
  config: PLNConfig
  inferredAtoms: ℙ ID
  inferenceTrace: seq InferenceStep

where
  # All rules are unique
  ∀ i, j: dom rules • i ≠ j ⇒ rules[i].name ≠ rules[j].name
  
  # Inferred atoms are in atomspace
  inferredAtoms ⊆ dom atomspace.atoms
end

schema InferenceStep
  rule: InferenceRule
  premises: seq Atom
  conclusion: Atom
  timestamp: Time

where
  # Premises match rule
  #premises = #rule.premises
  
  # Conclusion is inferred
  conclusion ∉ ran premises
end

operation forwardChain
  Δ(PLNReasoner)
  maxSteps?: ℕ
  result!: seq Atom

where
  let steps = maxSteps? or config.maxSteps
  let newAtoms: seq Atom = ⟨⟩
  let step = 0
  
  while step < steps ∧ ¬ converged() do
    ∀ r: ran rules •
      # Find all matching premise sets
      let matches = findPremiseMatches(r)
      
      ∀ m: matches •
        # Compute conclusion truth value
        let premiseTVs = ⟨a.truthValue | a: m⟩
        let conclusionTV = r.formula.compute(premiseTVs)
        
        # Check confidence threshold
        conclusionTV.confidence ≥ config.minConfidence ⇒
          # Create conclusion atom
          let conclusion = instantiatePattern(r.conclusion, m)
          conclusion.truthValue = conclusionTV
          
          # Add to atomspace if new
          conclusion.id ∉ dom atomspace.atoms ⇒
            atomspace.addAtom(conclusion)
            newAtoms' = newAtoms ⌢ ⟨conclusion⟩
            inferredAtoms' = inferredAtoms ∪ {conclusion.id}
            
            # Record inference step
            inferenceTrace' = inferenceTrace ⌢ 
              ⟨InferenceStep(r, m, conclusion, now())⟩
    
    step' = step + 1
  
  result! = newAtoms
end

operation backwardChain
  Δ(PLNReasoner)
  goal?: Atom
  maxDepth?: ℕ
  result!: 𝔹

where
  # Base case: goal already in atomspace
  goal?.id ∈ dom atomspace.atoms ⇒
    result! = true
  
  # Recursive case: find rule that could prove goal
  goal?.id ∉ dom atomspace.atoms ⇒
    maxDepth? > 0 ⇒
      ∃ r: ran rules •
        matches(goal?, r.conclusion) ∧
        # Try to prove all premises
        (∀ p: r.premises •
          let subgoal = instantiatePattern(p, goal?)
          backwardChain(subgoal, maxDepth? - 1)) ⇒
          # If all premises proven, add conclusion
          atomspace.addAtom(goal?)
          inferredAtoms' = inferredAtoms ∪ {goal?.id}
          result! = true
    
    maxDepth? = 0 ⇒
      result! = false
end
```

## Distributed AtomSpace Specification

```z++
schema NodeConfig
  nodeId: ID
  syncStrategy: SyncStrategy
  syncInterval: ℕ₊
  attentionThreshold: ℝ
  maxBatchSize: ℕ₊

where
  nodeId ≠ null
  syncInterval > 0
  maxBatchSize > 0
end

schema DistributedAtomSpace
  localAtomSpace: AtomSpace
  remoteNodes: ID ↦ NodeConfig
  syncManager: SyncManager
  versionVector: ID ↦ ℕ
  pendingSync: ℙ ID

where
  # All remote nodes have version
  dom remoteNodes = dom versionVector
  
  # Pending sync atoms are in local atomspace
  pendingSync ⊆ dom localAtomSpace.atoms
end

schema SyncMessage
  sourceNode: ID
  targetNode: ID
  atoms: seq Atom
  timestamp: Time
  vectorClock: ID ↦ ℕ

where
  sourceNode ≠ targetNode
  #atoms > 0
end

schema SyncManager
  config: NodeConfig
  messageQueue: seq SyncMessage
  lastSync: ID ↦ Time
  conflicts: seq ConflictRecord

where
  # All nodes have last sync time
  dom lastSync = dom config.remoteNodes
end

schema ConflictRecord
  atom1: Atom
  atom2: Atom
  resolutionStrategy: {merge, priority, manual}
  resolved: 𝔹
  timestamp: Time

where
  # Conflicting atoms have same ID
  atom1.id = atom2.id
  atom1 ≠ atom2
end

operation syncAtom
  Δ(DistributedAtomSpace)
  atomId?: ID
  targetNode?: ID

where
  atomId? ∈ dom localAtomSpace.atoms
  targetNode? ∈ dom remoteNodes
  
  let atom = localAtomSpace.atoms[atomId?]
  let config = remoteNodes[targetNode?]
  
  # Check if atom should be synced based on strategy
  shouldSync(atom, config.syncStrategy, config.attentionThreshold) ⇒
    # Create sync message
    let msg = SyncMessage(
      sourceNode: this.nodeId,
      targetNode: targetNode?,
      atoms: ⟨atom⟩,
      timestamp: now(),
      vectorClock: versionVector
    )
    
    # Send message
    syncManager.messageQueue' = syncManager.messageQueue ⌢ ⟨msg⟩
    
    # Update version vector
    versionVector'[this.nodeId] = versionVector[this.nodeId] + 1
end

operation receiveSyncMessage
  Δ(DistributedAtomSpace)
  msg?: SyncMessage
  result!: ℕ

where
  msg?.targetNode = this.nodeId
  
  let added = 0
  let conflicts = 0
  
  ∀ remoteAtom: ran msg?.atoms •
    # Check if atom exists locally
    remoteAtom.id ∈ dom localAtomSpace.atoms ⇒
      let localAtom = localAtomSpace.atoms[remoteAtom.id]
      
      # Detect conflict
      localAtom ≠ remoteAtom ⇒
        conflicts' = conflicts + 1
        resolveConflict(localAtom, remoteAtom)
      
      # No conflict - update timestamp
      localAtom = remoteAtom ⇒
        localAtomSpace.atoms'[remoteAtom.id].timestamp = now()
    
    # Atom doesn't exist - add it
    remoteAtom.id ∉ dom localAtomSpace.atoms ⇒
      localAtomSpace.addAtom(remoteAtom)
      added' = added + 1
  
  # Update version vector
  versionVector'[msg?.sourceNode] = 
    max(versionVector[msg?.sourceNode], msg?.vectorClock[msg?.sourceNode])
  
  result! = added
end

operation resolveConflict
  Δ(DistributedAtomSpace)
  local?: Atom
  remote?: Atom

where
  local?.id = remote?.id
  local? ≠ remote?
  
  # Record conflict
  let conflict = ConflictRecord(
    atom1: local?,
    atom2: remote?,
    resolutionStrategy: determineStrategy(),
    resolved: false,
    timestamp: now()
  )
  
  syncManager.conflicts' = syncManager.conflicts ⌢ ⟨conflict⟩
  
  # Apply resolution strategy
  conflict.resolutionStrategy = merge ⇒
    let merged = mergeAtoms(local?, remote?)
    localAtomSpace.atoms'[local?.id] = merged
    conflict.resolved' = true
  
  conflict.resolutionStrategy = priority ⇒
    # Keep atom with higher STI
    remote?.attention.sti > local?.attention.sti ⇒
      localAtomSpace.atoms'[local?.id] = remote?
    conflict.resolved' = true
end

function shouldSync
  atom: Atom
  strategy: SyncStrategy
  threshold: ℝ
  result: 𝔹

where
  strategy = BROADCAST ⇒
    result = true
  
  strategy = ATTENTION_BASED ⇒
    result = atom.attention.sti ≥ threshold
  
  strategy = PULL ⇒
    result = false
  
  strategy = HYBRID ⇒
    result = atom.attention.sti ≥ threshold ∨ 
             atom.attention.vlti = true
end
```

## Invariants and Theorems

### AtomSpace Invariants

```z++
invariant AtomSpace.SizeInvariant
  ∀ as: AtomSpace • as.currentSize = #as.atoms ∧ as.currentSize ≤ as.maxSize
end

invariant AtomSpace.IndexConsistency
  ∀ as: AtomSpace •
    ∀ id: dom as.atoms •
      let a = as.atoms[id]
      id ∈ as.index.byType[a.type] ∧
      (a.name ≠ null ⇒ id ∈ as.index.byName[a.name])
end

invariant AtomSpace.LinkConsistency
  ∀ as: AtomSpace •
    ∀ a: ran as.atoms •
      ∀ o: ran a.outgoing • a ∈ o.incoming ∧
      ∀ i: a.incoming • a ∈ ran i.outgoing
end

theorem AtomSpace.AddRemoveNeutral
  ∀ as, as': AtomSpace; a: Atom •
    as.addAtom(a) ⊙ as'.removeAtom(a.id) ⇒
    as' = as
end
```

### Attention Bank Invariants

```z++
invariant AttentionBank.Conservation
  ∀ ab: AttentionBank •
    ab.totalSTI = Σ{id: dom ab.atomspace.atoms • 
                     ab.atomspace.atoms[id].attention.sti}
end

invariant AttentionBank.Bounds
  ∀ ab: AttentionBank •
    ab.totalSTI ≤ ab.config.maxSTI ∧
    ab.totalLTI ≤ ab.config.maxLTI
end

theorem AttentionBank.DecayMonotonic
  ∀ ab, ab': AttentionBank •
    ab.decay() ⇒ ab'.totalSTI ≤ ab.totalSTI
end

theorem AttentionBank.SpreadPreservesTotal
  ∀ ab, ab': AttentionBank; atomId: ID •
    ab.spreadAttention(atomId) ⇒ ab'.totalSTI = ab.totalSTI
end
```

### Cognitive Loop Invariants

```z++
invariant CognitiveLoop.StateTransitions
  ∀ cl: CognitiveLoop •
    (cl.state = idle ⇒ cl.state' ∈ {idle, running}) ∧
    (cl.state = running ⇒ cl.state' ∈ {running, paused, stopped}) ∧
    (cl.state = paused ⇒ cl.state' ∈ {paused, running, stopped}) ∧
    (cl.state = stopped ⇒ cl.state' = stopped)
end

theorem CognitiveLoop.CycleCountMonotonic
  ∀ cl, cl': CognitiveLoop •
    cl.runCycle() ⇒ cl'.cycleCount = cl.cycleCount + 1
end
```

## Conclusion

This formal specification provides a mathematically rigorous foundation for the NodeCog cognitive architecture. The Z++ notation enables precise reasoning about system properties, invariants, and behaviors.

Key benefits of this specification:
1. **Unambiguous semantics** - No room for misinterpretation
2. **Verifiable properties** - Invariants and theorems can be formally proved
3. **Implementation guide** - Specifications map directly to code
4. **Correctness assurance** - Formal verification possible

---

**Document Version**: 1.0
**Last Updated**: 2025-10-30
**Specification Language**: Z++
