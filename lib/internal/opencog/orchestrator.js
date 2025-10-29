'use strict';

const { EventEmitter } = require('events');

/**
 * AgentOrchestrator - Manages scheduling and execution of cognitive agents
 * 
 * Coordinates multiple agents operating on the shared AtomSpace
 * Implements priority-based scheduling and resource management
 */
class AgentOrchestrator extends EventEmitter {
  constructor(atomspace, attentionBank, options = {}) {
    super();
    this.atomspace = atomspace;
    this.attentionBank = attentionBank;
    this.agents = new Map(); // id -> Agent
    this.schedule = []; // Sorted array of agents by priority
    this.currentCycle = 0;
    this.running = false;
    this.maxConcurrent = options.maxConcurrent || 5;
    this.schedulingPolicy = options.schedulingPolicy || 'priority'; // 'priority', 'round-robin', 'attention'
  }

  /**
   * Add an agent to the orchestrator
   */
  addAgent(agent) {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent ${agent.id} already exists`);
    }

    this.agents.set(agent.id, agent);
    this._updateSchedule();
    
    this.emit('agent-added', { agentId: agent.id, name: agent.name });
    return agent.id;
  }

  /**
   * Remove an agent from the orchestrator
   */
  removeAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    this.agents.delete(agentId);
    this._updateSchedule();
    
    this.emit('agent-removed', { agentId, name: agent.name });
    return true;
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Enable an agent
   */
  enableAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.enable();
      return true;
    }
    return false;
  }

  /**
   * Disable an agent
   */
  disableAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.disable();
      return true;
    }
    return false;
  }

  /**
   * Run one cognitive cycle - execute all scheduled agents
   */
  async runCycle() {
    this.currentCycle++;
    const cycleStart = Date.now();
    
    this.emit('cycle-start', { cycle: this.currentCycle });

    const results = [];
    const agentsToRun = this._selectAgentsForCycle();

    // Execute agents concurrently in batches
    for (let i = 0; i < agentsToRun.length; i += this.maxConcurrent) {
      const batch = agentsToRun.slice(i, i + this.maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(agent => agent.execute(this.atomspace, this.attentionBank, this.currentCycle))
      );
      results.push(...batchResults);
    }

    const cycleDuration = Date.now() - cycleStart;
    
    this.emit('cycle-end', {
      cycle: this.currentCycle,
      duration: cycleDuration,
      agentsRun: results.filter(r => !r.skipped).length,
      agentsSkipped: results.filter(r => r.skipped).length,
      results,
    });

    return {
      cycle: this.currentCycle,
      duration: cycleDuration,
      results,
    };
  }

  /**
   * Get orchestrator statistics
   */
  getStats() {
    return {
      currentCycle: this.currentCycle,
      running: this.running,
      totalAgents: this.agents.size,
      enabledAgents: this.getAllAgents().filter(a => a.enabled).length,
      agentStats: this.getAllAgents().map(a => a.getStats()),
      schedulingPolicy: this.schedulingPolicy,
    };
  }

  /**
   * Reset the orchestrator
   */
  reset() {
    this.currentCycle = 0;
    this.running = false;
    this.emit('reset');
  }

  /**
   * Private: Update the agent schedule based on scheduling policy
   */
  _updateSchedule() {
    const agents = Array.from(this.agents.values());
    
    switch (this.schedulingPolicy) {
      case 'priority':
        this.schedule = agents.sort((a, b) => b.priority - a.priority);
        break;
      case 'round-robin':
        this.schedule = agents;
        break;
      case 'attention':
        // Agents that work on high-attention atoms get priority
        this.schedule = agents.sort((a, b) => b.priority - a.priority);
        break;
      default:
        this.schedule = agents;
    }
  }

  /**
   * Private: Select agents to run in this cycle
   */
  _selectAgentsForCycle() {
    return this.schedule.filter(agent => 
      agent.enabled && agent.shouldRun(this.currentCycle)
    );
  }
}

module.exports = AgentOrchestrator;
