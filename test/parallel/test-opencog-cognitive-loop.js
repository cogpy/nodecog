'use strict';

require('../common');
const assert = require('assert');
const { CognitiveLoop } = require('internal/opencog/cognitive_loop');
const { AgentOrchestrator } = require('internal/opencog/orchestrator');
const { Agent } = require('internal/opencog/agent');
const { AtomSpace } = require('internal/opencog/atomspace');
const { AttentionBank } = require('internal/opencog/attention');

// Test CognitiveLoop creation
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  const cognitiveLoop = new CognitiveLoop(orchestrator);
  
  assert.ok(cognitiveLoop instanceof CognitiveLoop);
  assert.strictEqual(cognitiveLoop.running, false);
  assert.strictEqual(cognitiveLoop.cycleCount, 0);
}

// Test start and stop
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  const cognitiveLoop = new CognitiveLoop(orchestrator, { cycleInterval: 10 });
  
  cognitiveLoop.start();
  assert.strictEqual(cognitiveLoop.running, true);
  
  setTimeout(() => {
    cognitiveLoop.stop();
    assert.strictEqual(cognitiveLoop.running, false);
  }, 50);
}

// Test pause and resume
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  const cognitiveLoop = new CognitiveLoop(orchestrator, { cycleInterval: 10 });
  
  cognitiveLoop.start();
  assert.strictEqual(cognitiveLoop.running, true);
  assert.strictEqual(cognitiveLoop.pauseRequested, false);
  
  cognitiveLoop.pause();
  assert.strictEqual(cognitiveLoop.pauseRequested, true);
  
  cognitiveLoop.resume();
  assert.strictEqual(cognitiveLoop.pauseRequested, false);
  
  setTimeout(() => cognitiveLoop.stop(), 50);
}

// Test runSingleCycle
{
  class TestAgent extends Agent {
    async run() { return { success: true }; }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  const cognitiveLoop = new CognitiveLoop(orchestrator);
  
  const agent = new TestAgent();
  orchestrator.addAgent(agent);
  
  cognitiveLoop.runSingleCycle().then((result) => {
    assert.ok(result);
    assert.strictEqual(cognitiveLoop.cycleCount, 1);
  });
}

// Test maxCycles
{
  class TestAgent extends Agent {
    async run() { return { success: true }; }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  const cognitiveLoop = new CognitiveLoop(orchestrator, { 
    cycleInterval: 10, 
    maxCycles: 3 
  });
  
  const agent = new TestAgent();
  orchestrator.addAgent(agent);
  
  let stopped = false;
  cognitiveLoop.on('max-cycles-reached', () => { stopped = true; });
  
  cognitiveLoop.start();
  
  setTimeout(() => {
    assert.strictEqual(cognitiveLoop.running, false);
    assert.ok(stopped);
    assert.ok(cognitiveLoop.cycleCount >= 3);
  }, 100);
}

// Test cycleInterval
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  const cognitiveLoop = new CognitiveLoop(orchestrator, { cycleInterval: 50 });
  
  assert.strictEqual(cognitiveLoop.cycleInterval, 50);
  
  cognitiveLoop.setCycleInterval(100);
  assert.strictEqual(cognitiveLoop.cycleInterval, 100);
}

// Test getStats
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  const cognitiveLoop = new CognitiveLoop(orchestrator);
  
  const stats = cognitiveLoop.getStats();
  assert.strictEqual(stats.running, false);
  assert.strictEqual(stats.cycleCount, 0);
  assert.ok(stats.orchestratorStats);
}

// Test event emission
{
  class TestAgent extends Agent {
    async run() { return { success: true }; }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  const cognitiveLoop = new CognitiveLoop(orchestrator, { cycleInterval: 10 });
  
  const agent = new TestAgent();
  orchestrator.addAgent(agent);
  
  let started = false;
  let cycleComplete = false;
  
  cognitiveLoop.on('started', () => { started = true; });
  cognitiveLoop.on('cycle-complete', () => { cycleComplete = true; });
  
  cognitiveLoop.start();
  
  setTimeout(() => {
    cognitiveLoop.stop();
    assert.ok(started);
    assert.ok(cycleComplete);
  }, 50);
}

// Test auto decay and normalize
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  const cognitiveLoop = new CognitiveLoop(orchestrator, {
    cycleInterval: 10,
    autoDecay: true,
    autoNormalize: true,
    decayInterval: 2,
    normalizeInterval: 3
  });
  
  assert.strictEqual(cognitiveLoop.autoDecay, true);
  assert.strictEqual(cognitiveLoop.autoNormalize, true);
  assert.strictEqual(cognitiveLoop.decayInterval, 2);
  assert.strictEqual(cognitiveLoop.normalizeInterval, 3);
}
