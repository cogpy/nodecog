'use strict';

// Test Phase 4 components: ESM Arena, MOSES, NLP, Planning, Visualization

const common = require('../common');
const assert = require('assert');
const DistributedAtomSpace = require('internal/opencog/distributed_atomspace');
const ESMAgentArena = require('internal/opencog/esm_agent_arena');
const { AgentState } = require('internal/opencog/esm_agent_arena');
const MOSES = require('internal/opencog/moses');
const { RepresentationType, FitnessMode } = require('internal/opencog/moses');
const NLPProcessor = require('internal/opencog/nlp');
const { Planner, Goal, Action, ActionType } = require('internal/opencog/planning');
const CognitiveVisualizer = require('internal/opencog/visualization');
const { AtomSpace } = require('internal/opencog/atomspace');

// Test ESMAgentArena creation
{
  const atomspace = new DistributedAtomSpace({ nodeId: 'test-node' });
  const arena = new ESMAgentArena(atomspace, {
    maxAgents: 50,
    populationSize: 10,
  });
  
  assert.strictEqual(arena.maxAgents, 50);
  assert.strictEqual(arena.populationSize, 10);
  assert.strictEqual(arena.agents.size, 0);
  
  arena.destroy();
  atomspace.destroy();
  common.printSkipMessage('ESMAgentArena creation');
}

// Test ESM agent registration
{
  const atomspace = new DistributedAtomSpace({ nodeId: 'test-node' });
  const arena = new ESMAgentArena(atomspace);
  
  const code = 'return input * 2;';
  const agentId = arena.registerAgent(code, {
    timeoutMs: 1000,
    maxTrainingEpochs: 10,
  });
  
  assert.ok(agentId);
  assert.strictEqual(arena.agents.size, 1);
  assert.ok(arena.agents.has(agentId));
  
  const agent = arena.getAgent(agentId);
  assert.strictEqual(agent.state, AgentState.TRAINING);
  
  arena.destroy();
  atomspace.destroy();
  common.printSkipMessage('ESM agent registration');
}

// Test ESM agent execution
{
  const atomspace = new DistributedAtomSpace({ nodeId: 'test-node' });
  const arena = new ESMAgentArena(atomspace);
  
  const code = 'return input + 10;';
  const agentId = arena.registerAgent(code);
  
  arena.executeAgent(agentId, 5).then(result => {
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.result, 15);
    assert.ok(result.metrics);
  });
  
  arena.destroy();
  atomspace.destroy();
  common.printSkipMessage('ESM agent execution');
}

// Test MOSES creation
{
  const moses = new MOSES({
    representationType: RepresentationType.JAVASCRIPT,
    populationSize: 20,
    maxGenerations: 10,
  });
  
  assert.strictEqual(moses.populationSize, 20);
  assert.strictEqual(moses.maxGenerations, 10);
  assert.strictEqual(moses.representationType, RepresentationType.JAVASCRIPT);
  
  common.printSkipMessage('MOSES creation');
}

// Test MOSES population initialization
{
  const moses = new MOSES({ populationSize: 10 });
  moses.initializePopulation();
  
  assert.strictEqual(moses.population.length, 10);
  
  for (const program of moses.population) {
    assert.ok(program);
    assert.ok(program.representation);
  }
  
  common.printSkipMessage('MOSES population initialization');
}

// Test MOSES program execution
{
  const moses = new MOSES();
  moses.initializePopulation();
  
  const program = moses.population[0];
  const result = program.execute(5);
  
  assert.ok(result !== undefined);
  
  common.printSkipMessage('MOSES program execution');
}

// Test MOSES evolution
{
  const moses = new MOSES({
    populationSize: 10,
    maxGenerations: 5,
    fitnessMode: FitnessMode.ACCURACY,
  });
  
  // Simple training data: double the input
  const trainingData = [
    { input: 1, output: 2 },
    { input: 2, output: 4 },
    { input: 3, output: 6 },
    { input: 4, output: 8 },
  ];
  
  moses.initializePopulation();
  
  moses.evolve(trainingData).then(result => {
    assert.ok(result.program);
    assert.ok(result.fitness !== undefined);
    assert.ok(result.generations > 0);
  });
  
  common.printSkipMessage('MOSES evolution');
}

// Test NLP processor creation
{
  const atomspace = new AtomSpace();
  const nlp = new NLPProcessor(atomspace);
  
  assert.strictEqual(nlp.vocabulary.size, 0);
  assert.strictEqual(nlp.entities.size, 0);
  
  common.printSkipMessage('NLP processor creation');
}

// Test NLP sentence processing
{
  const atomspace = new AtomSpace();
  const nlp = new NLPProcessor(atomspace);
  
  const result = nlp.processSentence('The cat runs fast');
  
  assert.ok(result.sentence);
  assert.ok(result.words);
  assert.strictEqual(result.words.length, 4);
  assert.ok(result.dependencies);
  
  common.printSkipMessage('NLP sentence processing');
}

// Test NLP relationship extraction
{
  const atomspace = new AtomSpace();
  const nlp = new NLPProcessor(atomspace);
  
  const text = 'The dog runs. The cat sleeps.';
  const relationships = nlp.extractRelationships(text);
  
  assert.ok(Array.isArray(relationships));
  
  common.printSkipMessage('NLP relationship extraction');
}

// Test NLP concept grounding
{
  const atomspace = new AtomSpace();
  const nlp = new NLPProcessor(atomspace);
  
  const concepts = nlp.groundConcept('machine learning');
  
  assert.ok(Array.isArray(concepts));
  assert.strictEqual(concepts.length, 2);
  
  common.printSkipMessage('NLP concept grounding');
}

// Test NLP similarity
{
  const atomspace = new AtomSpace();
  const nlp = new NLPProcessor(atomspace);
  
  const similarity = nlp.similarity('cat', 'cat');
  assert.strictEqual(similarity, 1.0);
  
  const similarity2 = nlp.similarity('cat dog', 'cat bird');
  assert.ok(similarity2 > 0 && similarity2 < 1);
  
  common.printSkipMessage('NLP similarity');
}

// Test Planner creation
{
  const atomspace = new AtomSpace();
  const planner = new Planner(atomspace, {
    maxPlanningDepth: 5,
    planningTimeout: 3000,
  });
  
  assert.strictEqual(planner.maxPlanningDepth, 5);
  assert.strictEqual(planner.planningTimeout, 3000);
  assert.strictEqual(planner.goals.size, 0);
  assert.strictEqual(planner.actions.size, 0);
  
  common.printSkipMessage('Planner creation');
}

// Test Goal creation
{
  const atomspace = new AtomSpace();
  const planner = new Planner(atomspace);
  
  const goal = planner.createGoal(
    'Reach temperature 20',
    (state) => state.temperature === 20,
    10
  );
  
  assert.ok(goal);
  assert.ok(goal.id);
  assert.strictEqual(goal.description, 'Reach temperature 20');
  assert.strictEqual(goal.priority, 10);
  
  common.printSkipMessage('Goal creation');
}

// Test Action registration
{
  const atomspace = new AtomSpace();
  const planner = new Planner(atomspace);
  
  const action = new Action(
    'heat',
    ActionType.PRIMITIVE,
    (state) => { state.temperature += 1; return 'heated'; },
    {
      preconditions: [(state) => state.temperature < 100],
      effects: [(state) => { state.heated = true; }],
      cost: 1,
    }
  );
  
  planner.registerAction(action);
  
  assert.strictEqual(planner.actions.size, 1);
  assert.ok(planner.actions.has('heat'));
  
  common.printSkipMessage('Action registration');
}

// Test Planning
{
  const atomspace = new AtomSpace();
  const planner = new Planner(atomspace);
  
  // Register actions
  const heatAction = new Action(
    'heat',
    ActionType.PRIMITIVE,
    (state) => { state.temperature += 5; },
    {
      effects: [(state) => { state.temperature += 5; }],
      cost: 1,
    }
  );
  
  planner.registerAction(heatAction);
  
  // Create goal
  const goal = planner.createGoal(
    'Heat to 20',
    (state) => state.temperature >= 20,
    10
  );
  
  const initialState = { temperature: 0 };
  
  planner.planForGoal(goal.id, initialState).then(plan => {
    assert.ok(plan);
    assert.ok(plan.actions);
    assert.ok(plan.estimatedCost >= 0);
  });
  
  common.printSkipMessage('Planning');
}

// Test Visualization creation
{
  const atomspace = new AtomSpace();
  const viz = new CognitiveVisualizer(atomspace, {
    updateInterval: 2000,
    enableAutoUpdate: false,
  });
  
  assert.strictEqual(viz.updateInterval, 2000);
  assert.strictEqual(viz.metricsHistory.length, 0);
  assert.strictEqual(viz.eventLog.length, 0);
  
  viz.destroy();
  common.printSkipMessage('Visualization creation');
}

// Test graph visualization
{
  const atomspace = new AtomSpace();
  const viz = new CognitiveVisualizer(atomspace, { enableAutoUpdate: false });
  
  // Add some atoms
  atomspace.addAtom('CONCEPT', 'test1', [], { strength: 1.0, confidence: 0.9 });
  atomspace.addAtom('CONCEPT', 'test2', [], { strength: 0.8, confidence: 0.8 });
  
  const graph = viz.generateAtomSpaceGraph({ maxNodes: 10 });
  
  assert.strictEqual(graph.type, 'graph');
  assert.ok(graph.nodes);
  assert.ok(graph.edges);
  assert.ok(graph.metadata);
  assert.strictEqual(graph.nodes.length, 2);
  
  viz.destroy();
  common.printSkipMessage('Graph visualization');
}

// Test attention heatmap
{
  const atomspace = new AtomSpace();
  const viz = new CognitiveVisualizer(atomspace, { enableAutoUpdate: false });
  
  atomspace.addAtom('CONCEPT', 'test1', [], { strength: 1.0, confidence: 0.9 });
  atomspace.addAtom('LINK', 'test2', [], { strength: 0.8, confidence: 0.8 });
  
  const heatmap = viz.generateAttentionHeatmap();
  
  assert.strictEqual(heatmap.type, 'heatmap');
  assert.ok(Array.isArray(heatmap.data));
  assert.ok(heatmap.metadata);
  
  viz.destroy();
  common.printSkipMessage('Attention heatmap');
}

// Test metrics visualization
{
  const atomspace = new AtomSpace();
  const viz = new CognitiveVisualizer(atomspace, { enableAutoUpdate: false });
  
  const metrics = viz.generateMetricsVisualization();
  
  assert.strictEqual(metrics.type, 'metrics');
  assert.ok(metrics.current);
  assert.ok(Array.isArray(metrics.history));
  assert.ok(Array.isArray(metrics.charts));
  
  viz.destroy();
  common.printSkipMessage('Metrics visualization');
}

// Test event logging
{
  const atomspace = new AtomSpace();
  const viz = new CognitiveVisualizer(atomspace, { enableAutoUpdate: false });
  
  viz.logEvent('test-event', 'Test event occurred', { data: 123 });
  
  assert.strictEqual(viz.eventLog.length, 1);
  assert.strictEqual(viz.eventLog[0].type, 'test-event');
  assert.strictEqual(viz.eventLog[0].description, 'Test event occurred');
  
  viz.destroy();
  common.printSkipMessage('Event logging');
}

// Test dashboard generation
{
  const atomspace = new AtomSpace();
  const viz = new CognitiveVisualizer(atomspace, { enableAutoUpdate: false });
  
  atomspace.addAtom('CONCEPT', 'test', [], { strength: 1.0, confidence: 0.9 });
  
  const dashboard = viz.generateDashboard();
  
  assert.ok(dashboard.graph);
  assert.ok(dashboard.heatmap);
  assert.ok(dashboard.metrics);
  assert.ok(dashboard.timeline);
  assert.ok(dashboard.summary);
  assert.ok(dashboard.timestamp);
  
  viz.destroy();
  common.printSkipMessage('Dashboard generation');
}

// Test snapshot creation
{
  const atomspace = new AtomSpace();
  const viz = new CognitiveVisualizer(atomspace, { enableAutoUpdate: false });
  
  atomspace.addAtom('CONCEPT', 'test', [], { strength: 1.0, confidence: 0.9 });
  
  const snapshot = viz.createSnapshot('test-snapshot');
  
  assert.strictEqual(snapshot.label, 'test-snapshot');
  assert.ok(snapshot.timestamp);
  assert.ok(snapshot.graph);
  assert.ok(snapshot.metrics);
  assert.strictEqual(viz.snapshots.length, 1);
  
  viz.destroy();
  common.printSkipMessage('Snapshot creation');
}

// Test data export
{
  const atomspace = new AtomSpace();
  const viz = new CognitiveVisualizer(atomspace, { enableAutoUpdate: false });
  
  viz.logEvent('test', 'Test event');
  const exported = viz.exportData('json');
  
  assert.ok(typeof exported === 'string');
  const data = JSON.parse(exported);
  assert.ok(data.atomspace);
  assert.ok(data.metrics);
  assert.ok(data.events);
  
  viz.destroy();
  common.printSkipMessage('Data export');
}
