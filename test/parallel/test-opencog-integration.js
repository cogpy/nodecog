'use strict';

require('../common');
const assert = require('assert');
const opencog = require('opencog');
const { AtomType } = require('internal/opencog/atomspace');

// Test createCognitiveSystem factory
{
  const system = opencog.createCognitiveSystem({
    atomspace: { maxSize: 1000 },
    attention: { targetSTI: 5000 },
    orchestrator: { maxConcurrent: 3 },
    cognitiveLoop: { cycleInterval: 100 }
  });
  
  assert.ok(system.atomspace);
  assert.ok(system.attentionBank);
  assert.ok(system.orchestrator);
  assert.ok(system.cognitiveLoop);
  assert.ok(typeof system.start === 'function');
  assert.ok(typeof system.stop === 'function');
  assert.ok(typeof system.addAgent === 'function');
}

// Test full cognitive system operation
{
  const system = opencog.createCognitiveSystem({
    cognitiveLoop: { cycleInterval: 50, maxCycles: 5 }
  });
  
  // Add some knowledge
  const cat = system.atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const dog = system.atomspace.addAtom(AtomType.CONCEPT, 'dog');
  const animal = system.atomspace.addAtom(AtomType.CONCEPT, 'animal');
  
  system.atomspace.addAtom(AtomType.INHERITANCE, 'cat-animal', [cat, animal], 
    { strength: 0.9, confidence: 0.9 });
  system.atomspace.addAtom(AtomType.INHERITANCE, 'dog-animal', [dog, animal],
    { strength: 0.9, confidence: 0.9 });
  
  // Add cognitive agents
  const inferenceAgent = new opencog.Agent.InferenceAgent({ frequency: 1 });
  const attentionAgent = new opencog.Agent.AttentionAllocationAgent({ frequency: 1 });
  
  system.addAgent(inferenceAgent);
  system.addAgent(attentionAgent);
  
  // Stimulate some atoms
  system.attentionBank.stimulate(cat.id, 100);
  
  // Start autonomous operation
  system.start();
  
  setTimeout(() => {
    system.stop();
    
    // Verify system operated
    const stats = system.cognitiveLoop.getStats();
    assert.ok(stats.cycleCount >= 5);
    assert.ok(system.atomspace.atoms.size >= 3);
  }, 500);
}

// Test agent interaction with knowledge base
{
  const system = opencog.createCognitiveSystem();
  
  // Create knowledge: "If X is a cat, then X is an animal"
  const cat = system.atomspace.addAtom(AtomType.CONCEPT, 'cat', [], 
    { strength: 0.95, confidence: 0.9 });
  const animal = system.atomspace.addAtom(AtomType.CONCEPT, 'animal');
  const implication = system.atomspace.addAtom(AtomType.IMPLICATION, 'rule', 
    [cat, animal], { strength: 0.9, confidence: 0.9 });
  
  // Add inference agent
  const agent = new opencog.Agent.InferenceAgent();
  system.addAgent(agent);
  
  // Run single cognitive cycle
  system.cognitiveLoop.runSingleCycle().then(() => {
    // Check that inference occurred
    const animalAtom = system.atomspace.getAtomsByName('animal')[0];
    assert.ok(animalAtom);
    assert.ok(animalAtom.truthValue.strength > 0);
  });
}

// Test attention spreading
{
  const system = opencog.createCognitiveSystem();
  
  const cat = system.atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const mammal = system.atomspace.addAtom(AtomType.CONCEPT, 'mammal');
  const animal = system.atomspace.addAtom(AtomType.CONCEPT, 'animal');
  
  system.atomspace.addAtom(AtomType.INHERITANCE, 'cat-mammal', [cat, mammal]);
  system.atomspace.addAtom(AtomType.INHERITANCE, 'mammal-animal', [mammal, animal]);
  
  // Focus attention on cat
  system.attentionBank.stimulate(cat.id, 100);
  
  // Add attention agent
  const agent = new opencog.Agent.AttentionAllocationAgent();
  system.addAgent(agent);
  
  // Run cycle
  system.cognitiveLoop.runSingleCycle().then(() => {
    // Attention should have spread to connected concepts
    assert.ok(mammal.attention.sti > 0);
  });
}

// Test pattern mining
{
  const system = opencog.createCognitiveSystem();
  
  // Create multiple similar patterns
  const cat = system.atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const dog = system.atomspace.addAtom(AtomType.CONCEPT, 'dog');
  const bird = system.atomspace.addAtom(AtomType.CONCEPT, 'bird');
  const animal = system.atomspace.addAtom(AtomType.CONCEPT, 'animal');
  
  system.atomspace.addAtom(AtomType.INHERITANCE, 'cat-animal', [cat, animal]);
  system.atomspace.addAtom(AtomType.INHERITANCE, 'dog-animal', [dog, animal]);
  system.atomspace.addAtom(AtomType.INHERITANCE, 'bird-animal', [bird, animal]);
  
  const agent = new opencog.Agent.PatternMinerAgent({ minSupport: 0.5 });
  system.addAgent(agent);
  
  system.cognitiveLoop.runSingleCycle().then((result) => {
    assert.ok(result);
  });
}

// Test system lifecycle
{
  const system = opencog.createCognitiveSystem({ 
    cognitiveLoop: { cycleInterval: 20 }
  });
  
  assert.strictEqual(system.cognitiveLoop.running, false);
  
  system.start();
  assert.strictEqual(system.cognitiveLoop.running, true);
  
  setTimeout(() => {
    system.stop();
    assert.strictEqual(system.cognitiveLoop.running, false);
  }, 100);
}

// Test multi-agent coordination
{
  class CustomAgent1 extends opencog.Agent {
    async run(atomspace) {
      const concepts = atomspace.getAtomsByType(AtomType.CONCEPT);
      return { processed: concepts.length };
    }
  }
  
  class CustomAgent2 extends opencog.Agent {
    async run(atomspace) {
      const links = atomspace.getAtomsByType(AtomType.INHERITANCE);
      return { processed: links.length };
    }
  }
  
  const system = opencog.createCognitiveSystem();
  
  system.atomspace.addAtom(AtomType.CONCEPT, 'test1');
  system.atomspace.addAtom(AtomType.CONCEPT, 'test2');
  
  system.addAgent(new CustomAgent1({ frequency: 1 }));
  system.addAgent(new CustomAgent2({ frequency: 2 }));
  
  system.cognitiveLoop.runSingleCycle().then((result) => {
    assert.ok(result.results.length >= 1);
  });
}

// Test system state persistence
{
  const system = opencog.createCognitiveSystem();
  
  // Add knowledge
  const cat = system.atomspace.addAtom(AtomType.CONCEPT, 'cat');
  system.attentionBank.stimulate(cat.id, 75);
  system.attentionBank.setLTI(cat.id, 50);
  
  // Verify state
  assert.strictEqual(cat.attention.sti, 75);
  assert.strictEqual(cat.attention.lti, 50);
  
  // Run cycles
  system.cognitiveLoop.runSingleCycle().then(() => {
    // State should persist
    assert.ok(cat.attention.sti >= 0);
    assert.strictEqual(cat.attention.lti, 50);
  });
}
