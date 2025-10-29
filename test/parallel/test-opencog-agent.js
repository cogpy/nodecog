'use strict';

require('../common');
const assert = require('assert');
const { Agent, InferenceAgent, AttentionAllocationAgent, PatternMinerAgent } = require('internal/opencog/agent');
const { AtomSpace, AtomType } = require('internal/opencog/atomspace');
const { AttentionBank } = require('internal/opencog/attention');

// Test Agent base class
{
  class TestAgent extends Agent {
    async run(atomspace, attentionBank) {
      return { success: true };
    }
  }
  
  const agent = new TestAgent({ name: 'TestAgent' });
  assert.strictEqual(agent.name, 'TestAgent');
  assert.strictEqual(agent.enabled, true);
  assert.strictEqual(agent.frequency, 1);
}

// Test agent execution
{
  class TestAgent extends Agent {
    async run(atomspace, attentionBank) {
      return { processed: 5 };
    }
  }
  
  const agent = new TestAgent();
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  agent.execute(atomspace, attentionBank, 1).then((result) => {
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.result.processed, 5);
  });
}

// Test agent frequency
{
  const agent = new Agent({ frequency: 3 });
  
  assert.strictEqual(agent.shouldRun(1), false);
  assert.strictEqual(agent.shouldRun(2), false);
  assert.strictEqual(agent.shouldRun(3), true);
  assert.strictEqual(agent.shouldRun(6), true);
}

// Test agent enable/disable
{
  const agent = new Agent();
  
  assert.strictEqual(agent.enabled, true);
  agent.disable();
  assert.strictEqual(agent.enabled, false);
  agent.enable();
  assert.strictEqual(agent.enabled, true);
}

// Test InferenceAgent
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  const cat = atomspace.addAtom(AtomType.CONCEPT, 'cat', [], { strength: 0.9, confidence: 0.9 });
  const animal = atomspace.addAtom(AtomType.CONCEPT, 'animal');
  const impl = atomspace.addAtom(AtomType.IMPLICATION, 'cat-implies-animal', [cat, animal], { strength: 0.8, confidence: 0.8 });
  
  const agent = new InferenceAgent();
  agent.run(atomspace, attentionBank).then((result) => {
    assert.ok(result.inferences >= 0);
  });
}

// Test AttentionAllocationAgent
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  const cat = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const animal = atomspace.addAtom(AtomType.CONCEPT, 'animal');
  const link = atomspace.addAtom(AtomType.INHERITANCE, 'cat-animal', [cat, animal]);
  
  cat.attention.sti = 100;
  
  const agent = new AttentionAllocationAgent();
  agent.run(atomspace, attentionBank).then((result) => {
    assert.ok(result.attentionSpreads >= 0);
  });
}

// Test PatternMinerAgent
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  const cat = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const dog = atomspace.addAtom(AtomType.CONCEPT, 'dog');
  const animal = atomspace.addAtom(AtomType.CONCEPT, 'animal');
  
  atomspace.addAtom(AtomType.INHERITANCE, 'cat-animal', [cat, animal]);
  atomspace.addAtom(AtomType.INHERITANCE, 'dog-animal', [dog, animal]);
  
  const agent = new PatternMinerAgent({ minSupport: 0.5 });
  agent.run(atomspace, attentionBank).then((result) => {
    assert.ok(result.patternsDiscovered >= 0);
  });
}

// Test agent statistics
{
  const agent = new Agent({ name: 'TestAgent' });
  agent.runCount = 5;
  agent.totalTime = 500;
  agent.avgTime = 100;
  
  const stats = agent.getStats();
  assert.strictEqual(stats.name, 'TestAgent');
  assert.strictEqual(stats.runCount, 5);
  assert.strictEqual(stats.avgTime, 100);
}

// Test agent events
{
  class TestAgent extends Agent {
    async run(atomspace, attentionBank) {
      return { success: true };
    }
  }
  
  const agent = new TestAgent();
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  let beforeRunCalled = false;
  let afterRunCalled = false;
  
  agent.on('before-run', () => { beforeRunCalled = true; });
  agent.on('after-run', () => { afterRunCalled = true; });
  
  agent.execute(atomspace, attentionBank, 1).then(() => {
    assert.ok(beforeRunCalled);
    assert.ok(afterRunCalled);
  });
}
