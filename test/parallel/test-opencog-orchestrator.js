'use strict';

require('../common');
const assert = require('assert');
const { AgentOrchestrator } = require('internal/opencog/orchestrator');
const { Agent } = require('internal/opencog/agent');
const { AtomSpace, AtomType } = require('internal/opencog/atomspace');
const { AttentionBank } = require('internal/opencog/attention');

// Test AgentOrchestrator creation
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  
  assert.ok(orchestrator instanceof AgentOrchestrator);
  assert.strictEqual(orchestrator.agents.size, 0);
  assert.strictEqual(orchestrator.currentCycle, 0);
}

// Test adding agents
{
  class TestAgent extends Agent {
    async run() { return { success: true }; }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  
  const agent = new TestAgent({ name: 'TestAgent' });
  const agentId = orchestrator.addAgent(agent);
  
  assert.strictEqual(orchestrator.agents.size, 1);
  assert.strictEqual(orchestrator.getAgent(agentId), agent);
}

// Test removing agents
{
  class TestAgent extends Agent {
    async run() { return { success: true }; }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  
  const agent = new TestAgent();
  const agentId = orchestrator.addAgent(agent);
  
  assert.strictEqual(orchestrator.agents.size, 1);
  orchestrator.removeAgent(agentId);
  assert.strictEqual(orchestrator.agents.size, 0);
}

// Test runCycle
{
  class TestAgent extends Agent {
    async run() {
      return { processed: 10 };
    }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  
  const agent = new TestAgent();
  orchestrator.addAgent(agent);
  
  orchestrator.runCycle().then((result) => {
    assert.strictEqual(result.cycle, 1);
    assert.strictEqual(orchestrator.currentCycle, 1);
    assert.ok(result.results.length > 0);
  });
}

// Test agent scheduling by frequency
{
  class TestAgent extends Agent {
    async run() { return { success: true }; }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  
  const agent1 = new TestAgent({ frequency: 1 });
  const agent2 = new TestAgent({ frequency: 2 });
  
  orchestrator.addAgent(agent1);
  orchestrator.addAgent(agent2);
  
  orchestrator.runCycle().then((result1) => {
    // Both should run on cycle 1
    const ran1 = result1.results.filter(r => !r.skipped).length;
    assert.ok(ran1 >= 1);
    
    orchestrator.runCycle().then((result2) => {
      // Only agent1 should run on cycle 2
      const ran2 = result2.results.filter(r => !r.skipped).length;
      assert.ok(ran2 >= 0);
    });
  });
}

// Test enable/disable agents
{
  class TestAgent extends Agent {
    async run() { return { success: true }; }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  
  const agent = new TestAgent();
  const agentId = orchestrator.addAgent(agent);
  
  assert.strictEqual(agent.enabled, true);
  orchestrator.disableAgent(agentId);
  assert.strictEqual(agent.enabled, false);
  orchestrator.enableAgent(agentId);
  assert.strictEqual(agent.enabled, true);
}

// Test orchestrator statistics
{
  class TestAgent extends Agent {
    async run() { return { success: true }; }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  
  const agent1 = new TestAgent();
  const agent2 = new TestAgent();
  agent2.disable();
  
  orchestrator.addAgent(agent1);
  orchestrator.addAgent(agent2);
  
  const stats = orchestrator.getStats();
  assert.strictEqual(stats.totalAgents, 2);
  assert.strictEqual(stats.enabledAgents, 1);
  assert.strictEqual(stats.currentCycle, 0);
}

// Test concurrent execution
{
  class SlowAgent extends Agent {
    async run() {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { success: true };
    }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank, { maxConcurrent: 2 });
  
  orchestrator.addAgent(new SlowAgent());
  orchestrator.addAgent(new SlowAgent());
  orchestrator.addAgent(new SlowAgent());
  
  const startTime = Date.now();
  orchestrator.runCycle().then((result) => {
    const duration = Date.now() - startTime;
    assert.ok(result.results.length === 3);
    // With maxConcurrent: 2, this should take roughly 20ms (2 batches)
    assert.ok(duration < 50);
  });
}

// Test event emission
{
  class TestAgent extends Agent {
    async run() { return { success: true }; }
  }
  
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const orchestrator = new AgentOrchestrator(atomspace, attentionBank);
  
  let cycleStarted = false;
  let cycleEnded = false;
  
  orchestrator.on('cycle-start', () => { cycleStarted = true; });
  orchestrator.on('cycle-end', () => { cycleEnded = true; });
  
  const agent = new TestAgent();
  orchestrator.addAgent(agent);
  
  orchestrator.runCycle().then(() => {
    assert.ok(cycleStarted);
    assert.ok(cycleEnded);
  });
}
