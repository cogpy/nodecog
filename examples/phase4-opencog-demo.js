#!/usr/bin/env node

/**
 * Phase 4 OpenCog Demo - Distributed AtomSpace & ESM Agent Arena
 * 
 * Demonstrates:
 * - Distributed AtomSpace with multi-node knowledge sharing
 * - ESM Agent Arena as MLOps training academy
 * - MOSES for program synthesis
 * - NLP integration
 * - Planning and goal-directed behavior
 * - Real-time visualization dashboard
 */

'use strict';

const opencog = require('../lib/opencog');

console.log('='.repeat(80));
console.log('OpenCog Phase 4 Demonstration');
console.log('Distributed Cognitive Architecture with ESM Agent Arena');
console.log('='.repeat(80));
console.log();

async function runDemo() {
  // Create distributed cognitive system
  console.log('1. Creating Distributed Cognitive System...');
  const system = opencog.createDistributedCognitiveSystem({
    nodeId: 'demo-node-1',
    syncStrategy: 'eventual',
    atomspace: {
      maxSize: 10000,
      syncInterval: 2000,
    },
    esmArena: {
      maxAgents: 50,
      populationSize: 20,
      evolutionEnabled: true,
      academyMode: 'competitive',
    },
    moses: {
      populationSize: 30,
      maxGenerations: 20,
    },
    enableNLP: true,
    enablePlanner: true,
    enableVisualizer: true,
  });
  
  console.log('✓ System created with distributed atomspace');
  console.log(`  Node ID: ${system.atomspace.nodeId}`);
  console.log(`  Sync Strategy: ${system.atomspace.syncStrategy}`);
  console.log();
  
  // Register peer nodes for distributed operation
  console.log('2. Registering Peer Nodes...');
  system.registerPeer('demo-node-2', { address: 'localhost:8001', region: 'us-west' });
  system.registerPeer('demo-node-3', { address: 'localhost:8002', region: 'eu-central' });
  console.log('✓ Registered 2 peer nodes');
  console.log();
  
  // Add knowledge to distributed atomspace
  console.log('3. Adding Knowledge to Distributed AtomSpace...');
  const concepts = [];
  concepts.push(system.atomspace.addAtom('CONCEPT', 'autonomous-agent', [], {
    strength: 1.0,
    confidence: 0.95,
  }));
  concepts.push(system.atomspace.addAtom('CONCEPT', 'machine-learning', [], {
    strength: 1.0,
    confidence: 0.90,
  }));
  concepts.push(system.atomspace.addAtom('CONCEPT', 'distributed-system', [], {
    strength: 1.0,
    confidence: 0.92,
  }));
  
  // Create relationships
  system.atomspace.addAtom('INHERITANCE', 'agent-uses-ml', [concepts[0], concepts[1]], {
    strength: 0.9,
    confidence: 0.85,
  });
  
  console.log(`✓ Added ${concepts.length} concepts to atomspace`);
  console.log();
  
  // Natural Language Processing
  console.log('4. NLP Integration - Processing Natural Language...');
  const nlpResults = system.processNaturalLanguage(
    'Autonomous agents use machine learning for intelligent behavior'
  );
  console.log('✓ Sentence processed');
  console.log(`  Words extracted: ${nlpResults.words.length}`);
  console.log(`  Dependencies found: ${nlpResults.dependencies.length}`);
  
  // Extract relationships
  const relationships = system.nlp.extractRelationships(
    'The agent learns from data. The system optimizes performance.'
  );
  console.log(`✓ Extracted ${relationships.length} relationships`);
  console.log();
  
  // ESM Agent Arena - Training Academy
  console.log('5. ESM Agent Arena - Training Academy...');
  
  // Register autonomous ESM agents
  const agent1Code = `
    // Agent that optimizes based on input
    const result = Math.sqrt(input * input + 100);
    return result;
  `;
  
  const agent2Code = `
    // Agent that uses exponential strategy
    const result = Math.exp(input / 10);
    return result;
  `;
  
  const agentId1 = system.registerESMAgent(agent1Code, {
    trainingObjective: { type: 'minimize', value: 50, metric: 'value' },
    maxTrainingEpochs: 20,
  });
  
  const agentId2 = system.registerESMAgent(agent2Code, {
    trainingObjective: { type: 'maximize', value: 100, metric: 'value' },
    maxTrainingEpochs: 20,
  });
  
  console.log(`✓ Registered 2 ESM agents in training arena`);
  console.log(`  Agent 1: ${agentId1}`);
  console.log(`  Agent 2: ${agentId2}`);
  
  // Execute agents
  const result1 = await system.esmArena.executeAgent(agentId1, 10);
  const result2 = await system.esmArena.executeAgent(agentId2, 10);
  
  console.log(`✓ Agent 1 execution - Success: ${result1.success}, Fitness: ${result1.metrics.fitness.toFixed(3)}`);
  console.log(`✓ Agent 2 execution - Success: ${result2.success}, Fitness: ${result2.metrics.fitness.toFixed(3)}`);
  console.log();
  
  // Run training epoch
  console.log('6. Running Training Epoch...');
  const trainingResults = await system.esmArena.runTrainingEpoch({ value: 25 });
  console.log(`✓ Training epoch complete`);
  console.log(`  Agents trained: ${trainingResults.length}`);
  console.log(`  Average fitness: ${system.esmArena._calculateAverageFitness().toFixed(3)}`);
  console.log();
  
  // MOSES - Program Synthesis
  console.log('7. MOSES - Meta-Optimizing Semantic Evolutionary Search...');
  
  // Training data for simple function
  const mosesTrainingData = [
    { input: 1, output: 3 },
    { input: 2, output: 5 },
    { input: 3, output: 7 },
    { input: 4, output: 9 },
    { input: 5, output: 11 },
  ];
  
  system.moses.initializePopulation();
  console.log('✓ MOSES population initialized');
  
  const evolutionResult = await system.moses.evolve(mosesTrainingData);
  console.log('✓ MOSES evolution complete');
  console.log(`  Best program fitness: ${evolutionResult.fitness.toFixed(3)}`);
  console.log(`  Generations: ${evolutionResult.generations}`);
  console.log(`  Program representation: ${evolutionResult.program.representation}`);
  console.log();
  
  // Planning System
  console.log('8. Planning System - Goal-Directed Behavior...');
  
  // Register actions
  const { Action, ActionType } = opencog.Planner;
  
  const learnAction = new Action(
    'learn',
    ActionType.PRIMITIVE,
    (state) => {
      state.knowledge += 10;
      return 'learned';
    },
    {
      effects: [(state) => { state.knowledge += 10; }],
      cost: 1,
    }
  );
  
  const optimizeAction = new Action(
    'optimize',
    ActionType.PRIMITIVE,
    (state) => {
      state.performance += 5;
      return 'optimized';
    },
    {
      preconditions: [(state) => state.knowledge >= 20],
      effects: [(state) => { state.performance += 5; }],
      cost: 2,
    }
  );
  
  system.planner.registerAction(learnAction);
  system.planner.registerAction(optimizeAction);
  
  // Create goal
  const goal = system.createGoal(
    'Achieve high performance',
    (state) => state.performance >= 10,
    100
  );
  
  console.log(`✓ Created goal: ${goal.description}`);
  
  // Generate plan
  const initialState = { knowledge: 0, performance: 0 };
  const plan = await system.planner.planForGoal(goal.id, initialState);
  
  if (plan) {
    console.log(`✓ Plan generated with ${plan.actions.length} actions`);
    console.log(`  Estimated cost: ${plan.estimatedCost}`);
    
    // Execute plan
    const planResult = await system.planner.executePlan(goal.id, initialState);
    console.log(`✓ Plan execution - Success: ${planResult.success}`);
  }
  console.log();
  
  // Visualization Dashboard
  console.log('9. Generating Visualization Dashboard...');
  const dashboard = system.generateDashboard({
    graph: { maxNodes: 20, minAttention: 0 },
    timeline: { maxEvents: 10 },
  });
  
  console.log('✓ Dashboard generated');
  console.log(`  Total nodes in graph: ${dashboard.graph.nodes.length}`);
  console.log(`  Total edges: ${dashboard.graph.edges.length}`);
  console.log(`  Atom types in heatmap: ${dashboard.heatmap.data.length}`);
  console.log(`  Metrics history points: ${dashboard.metrics.history.length}`);
  console.log(`  Events in timeline: ${dashboard.timeline.events.length}`);
  console.log();
  
  console.log('  Summary:');
  console.log(`    Total atoms: ${dashboard.summary.totalAtoms}`);
  console.log(`    Atom types: ${dashboard.summary.types}`);
  console.log(`    Top types: ${dashboard.summary.topTypes.map(t => t.type).join(', ')}`);
  console.log();
  
  // Distributed synchronization
  console.log('10. Distributed Synchronization...');
  const syncResult = await system.syncWithPeers();
  console.log(`✓ Sync complete`);
  console.log(`  Successful syncs: ${syncResult.successful}`);
  console.log(`  Failed syncs: ${syncResult.failed}`);
  console.log();
  
  // System Statistics
  console.log('11. Comprehensive System Statistics...');
  const stats = system.getSystemStats();
  
  console.log('✓ Distributed AtomSpace:');
  console.log(`  Node ID: ${stats.atomspace.nodeId}`);
  console.log(`  Peers: ${stats.atomspace.peers}`);
  console.log(`  Local atoms: ${stats.atomspace.localAtoms}`);
  console.log(`  Replicated atoms: ${stats.atomspace.replicatedAtoms}`);
  console.log(`  Total atoms: ${stats.atomspace.totalAtoms}`);
  
  console.log('✓ ESM Agent Arena:');
  console.log(`  Total agents: ${stats.esmArena.totalAgents}`);
  console.log(`  Active agents: ${stats.esmArena.activeAgents}`);
  console.log(`  Training agents: ${stats.esmArena.trainingAgents}`);
  console.log(`  Average fitness: ${stats.esmArena.averageFitness.toFixed(3)}`);
  console.log(`  Best fitness: ${stats.esmArena.bestFitness.toFixed(3)}`);
  
  console.log('✓ MOSES:');
  console.log(`  Population size: ${stats.moses.populationSize}`);
  console.log(`  Generations completed: ${stats.moses.generationsCompleted}`);
  console.log(`  Total evaluations: ${stats.moses.totalEvaluations}`);
  console.log(`  Best fitness: ${stats.moses.bestFitness.toFixed(3)}`);
  
  console.log('✓ NLP Processor:');
  console.log(`  Sentences processed: ${stats.nlp.sentencesProcessed}`);
  console.log(`  Words processed: ${stats.nlp.wordsProcessed}`);
  console.log(`  Vocabulary size: ${stats.nlp.vocabularySize}`);
  console.log(`  Entities extracted: ${stats.nlp.entitiesExtracted}`);
  
  console.log('✓ Planner:');
  console.log(`  Goals created: ${stats.planner.goalsCreated}`);
  console.log(`  Goals achieved: ${stats.planner.goalsAchieved}`);
  console.log(`  Plans generated: ${stats.planner.plansGenerated}`);
  console.log(`  Plans executed: ${stats.planner.plansExecuted}`);
  
  console.log('✓ Visualizer:');
  console.log(`  Metrics history size: ${stats.visualizer.metricsHistorySize}`);
  console.log(`  Event log size: ${stats.visualizer.eventLogSize}`);
  console.log(`  Snapshots count: ${stats.visualizer.snapshotsCount}`);
  console.log();
  
  // Demonstration complete
  console.log('='.repeat(80));
  console.log('Phase 4 Demonstration Complete!');
  console.log('='.repeat(80));
  console.log();
  console.log('Key Features Demonstrated:');
  console.log('  ✓ Distributed AtomSpace with multi-node knowledge sharing');
  console.log('  ✓ ESM Agent Arena as MLOps Training Academy');
  console.log('  ✓ MOSES for program synthesis and optimization');
  console.log('  ✓ NLP integration for natural language understanding');
  console.log('  ✓ Planning system for goal-directed behavior');
  console.log('  ✓ Real-time visualization dashboard');
  console.log();
  console.log('This creates an ECMA-262 OpenCog-hosted universe where autonomous');
  console.log('ESM agents can train, evolve, and operate over a distributed');
  console.log('knowledge base with cognitive capabilities.');
  console.log();
  
  // Cleanup
  system.esmArena.destroy();
  system.atomspace.destroy();
}

// Run the demo
runDemo().catch(err => {
  console.error('Demo error:', err);
  process.exit(1);
});
