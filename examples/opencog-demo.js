#!/usr/bin/env node
'use strict';

/**
 * OpenCog Autonomous Multi-Agent System - Example Usage
 * 
 * This example demonstrates the core capabilities of the OpenCog-inspired
 * autonomous multi-agent orchestration system.
 */

// Since we're in the Node.js source tree, we'll load modules directly
const path = require('path');
const { EventEmitter } = require('events');

// Load our OpenCog modules
const AtomSpace = require(path.join(__dirname, '../lib/internal/opencog/atomspace.js'));
const Agent = require(path.join(__dirname, '../lib/internal/opencog/agent.js'));
const AttentionBank = require(path.join(__dirname, '../lib/internal/opencog/attention.js'));
const AgentOrchestrator = require(path.join(__dirname, '../lib/internal/opencog/orchestrator.js'));
const CognitiveLoop = require(path.join(__dirname, '../lib/internal/opencog/cognitive_loop.js'));

// Get additional exports
const { AtomType, Atom } = AtomSpace;
const { InferenceAgent, AttentionAllocationAgent, PatternMinerAgent } = Agent;

console.log('='.repeat(70));
console.log('OpenCog Autonomous Multi-Agent Orchestration System');
console.log('Demonstration of Cognitive Architecture in Pure Node.js');
console.log('='.repeat(70));
console.log();

// Create the cognitive system
console.log('1. Creating Cognitive System Components...');
const atomspace = new AtomSpace({ maxSize: 10000, forgettingEnabled: true });
const attentionBank = new AttentionBank(atomspace, { targetSTI: 10000, decayRate: 0.95 });
const orchestrator = new AgentOrchestrator(atomspace, attentionBank, { maxConcurrent: 5 });
const cognitiveLoop = new CognitiveLoop(orchestrator, { 
  cycleInterval: 100, 
  maxCycles: 10,
  autoDecay: true,
  autoNormalize: true 
});
console.log('   ✓ AtomSpace created');
console.log('   ✓ AttentionBank initialized');
console.log('   ✓ AgentOrchestrator configured');
console.log('   ✓ CognitiveLoop ready');
console.log();

// Build a knowledge base
console.log('2. Building Knowledge Base...');
const cat = atomspace.addAtom(AtomType.CONCEPT, 'cat', [], { strength: 0.9, confidence: 0.9 });
const dog = atomspace.addAtom(AtomType.CONCEPT, 'dog', [], { strength: 0.9, confidence: 0.9 });
const bird = atomspace.addAtom(AtomType.CONCEPT, 'bird', [], { strength: 0.9, confidence: 0.9 });
const mammal = atomspace.addAtom(AtomType.CONCEPT, 'mammal', [], { strength: 0.8, confidence: 0.8 });
const animal = atomspace.addAtom(AtomType.CONCEPT, 'animal', [], { strength: 0.95, confidence: 0.95 });
const vertebrate = atomspace.addAtom(AtomType.CONCEPT, 'vertebrate', [], { strength: 0.85, confidence: 0.85 });

// Create inheritance relationships
atomspace.addAtom(AtomType.INHERITANCE, 'cat-is-mammal', [cat, mammal], { strength: 0.99, confidence: 0.95 });
atomspace.addAtom(AtomType.INHERITANCE, 'dog-is-mammal', [dog, mammal], { strength: 0.99, confidence: 0.95 });
atomspace.addAtom(AtomType.INHERITANCE, 'mammal-is-animal', [mammal, animal], { strength: 0.95, confidence: 0.9 });
atomspace.addAtom(AtomType.INHERITANCE, 'bird-is-animal', [bird, animal], { strength: 0.95, confidence: 0.9 });
atomspace.addAtom(AtomType.INHERITANCE, 'animal-is-vertebrate', [animal, vertebrate], { strength: 0.8, confidence: 0.8 });

// Create some implications for inference
atomspace.addAtom(AtomType.IMPLICATION, 'mammal-implies-warm-blooded', 
  [mammal, atomspace.addAtom(AtomType.PREDICATE, 'warm-blooded')], 
  { strength: 0.95, confidence: 0.9 });

console.log(`   ✓ Created ${atomspace.atoms.size} atoms in knowledge base`);
console.log(`   ✓ Concepts: cat, dog, bird, mammal, animal, vertebrate`);
console.log(`   ✓ Relationships: inheritance hierarchy`);
console.log(`   ✓ Rules: implication rules`);
console.log();

// Set initial attention
console.log('3. Allocating Initial Attention...');
attentionBank.stimulate(cat.id, 150);
attentionBank.stimulate(dog.id, 100);
attentionBank.stimulate(mammal.id, 75);
attentionBank.setVLTI(animal.id, true); // Mark as very important
console.log('   ✓ Focused attention on: cat (STI: 150), dog (STI: 100)');
console.log('   ✓ Marked "animal" as very long-term important');
console.log();

// Add cognitive agents
console.log('4. Deploying Cognitive Agents...');
const inferenceAgent = new InferenceAgent({ 
  name: 'InferenceEngine',
  frequency: 1,
  maxInferences: 20 
});
const attentionAgent = new AttentionAllocationAgent({ 
  name: 'AttentionSpreadAgent',
  frequency: 1,
  spreadFactor: 0.3 
});
const patternAgent = new PatternMinerAgent({ 
  name: 'PatternDiscovery',
  frequency: 2,
  minSupport: 0.3 
});

orchestrator.addAgent(inferenceAgent);
orchestrator.addAgent(attentionAgent);
orchestrator.addAgent(patternAgent);
console.log(`   ✓ ${inferenceAgent.name} deployed`);
console.log(`   ✓ ${attentionAgent.name} deployed`);
console.log(`   ✓ ${patternAgent.name} deployed`);
console.log();

// Set up event logging
let cycleResults = [];
cognitiveLoop.on('cycle-complete', (data) => {
  cycleResults.push(data);
  console.log(`   Cycle ${data.cycle}: ${data.duration}ms, ` +
              `${data.result.results.filter(r => !r.skipped).length} agents active`);
});

// Start autonomous operation
console.log('5. Starting Autonomous Cognitive Loop...');
console.log('   Running for 10 cycles...');
console.log();

cognitiveLoop.start();

// Wait for completion and display results
setTimeout(() => {
  cognitiveLoop.stop();
  
  console.log();
  console.log('6. Results Summary');
  console.log('='.repeat(70));
  
  // AtomSpace statistics
  const atoms = atomspace.getAllAtoms();
  console.log(`\nAtomSpace Statistics:`);
  console.log(`   Total Atoms: ${atoms.length}`);
  console.log(`   Concepts: ${atomspace.getAtomsByType(AtomType.CONCEPT).length}`);
  console.log(`   Links: ${atoms.filter(a => a.outgoing.length > 0).length}`);
  
  // Attention statistics
  const attentionStats = attentionBank.getStats();
  console.log(`\nAttention System:`);
  console.log(`   Total STI: ${attentionStats.totalSTI.toFixed(2)}`);
  console.log(`   Average STI: ${attentionStats.avgSTI.toFixed(2)}`);
  console.log(`   Attentional Focus (top 5):`);
  attentionStats.topAtoms.forEach((a, i) => {
    console.log(`     ${i + 1}. ${a.name}: STI=${a.sti.toFixed(2)}, LTI=${a.lti.toFixed(2)}`);
  });
  
  // Agent statistics
  const orchestratorStats = orchestrator.getStats();
  console.log(`\nAgent Performance:`);
  orchestratorStats.agentStats.forEach(stat => {
    console.log(`   ${stat.name}:`);
    console.log(`     - Runs: ${stat.runCount}`);
    console.log(`     - Avg Time: ${stat.avgTime.toFixed(2)}ms`);
  });
  
  // Cognitive loop statistics
  const loopStats = cognitiveLoop.getStats();
  console.log(`\nCognitive Loop:`);
  console.log(`   Total Cycles: ${loopStats.cycleCount}`);
  console.log(`   Uptime: ${loopStats.uptime}ms`);
  console.log(`   Avg Cycle Time: ${loopStats.avgCycleTime.toFixed(2)}ms`);
  
  console.log();
  console.log('='.repeat(70));
  console.log('Demonstration Complete!');
  console.log();
  console.log('Key Features Demonstrated:');
  console.log('  • Hypergraph knowledge representation (AtomSpace)');
  console.log('  • Economic attention allocation (ECAN)');
  console.log('  • Multi-agent orchestration and scheduling');
  console.log('  • Autonomous cognitive cycles');
  console.log('  • Inference, attention spreading, and pattern mining');
  console.log('='.repeat(70));
  
}, 1500);
