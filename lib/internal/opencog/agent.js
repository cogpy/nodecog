'use strict';

const { EventEmitter } = require('events');

/**
 * Agent - Base class for cognitive agents
 * 
 * Agents are autonomous components that operate on the AtomSpace
 * Each agent has a specific cognitive function and can be scheduled
 * by the AgentOrchestrator
 */
class Agent extends EventEmitter {
  constructor(options = {}) {
    super();
    this.id = options.id || Agent.generateId();
    this.name = options.name || this.constructor.name;
    this.frequency = options.frequency || 1; // Execution frequency (lower = more frequent)
    this.enabled = options.enabled ?? true;
    this.priority = options.priority || 0;
    this.lastRun = 0;
    this.runCount = 0;
    this.totalTime = 0;
    this.avgTime = 0;
  }

  static _idCounter = 0;
  static generateId() {
    return `agent_${++Agent._idCounter}`;
  }

  /**
   * Run the agent - must be implemented by subclasses
   * @param {AtomSpace} atomspace - The atomspace to operate on
   * @param {AttentionBank} attentionBank - The attention allocation system
   * @returns {Promise<Object>} Result of the agent execution
   */
  async run(atomspace, attentionBank) {
    throw new Error('Agent.run() must be implemented by subclass');
  }

  /**
   * Check if agent should run based on frequency
   */
  shouldRun(currentCycle) {
    if (!this.enabled) return false;
    return currentCycle % this.frequency === 0;
  }

  /**
   * Execute the agent with timing and error handling
   */
  async execute(atomspace, attentionBank, currentCycle) {
    if (!this.shouldRun(currentCycle)) {
      return { skipped: true, agent: this.name };
    }

    const startTime = Date.now();
    this.emit('before-run', { agent: this.name, cycle: currentCycle });

    try {
      const result = await this.run(atomspace, attentionBank);
      const duration = Date.now() - startTime;
      
      this.lastRun = currentCycle;
      this.runCount++;
      this.totalTime += duration;
      this.avgTime = this.totalTime / this.runCount;

      this.emit('after-run', { 
        agent: this.name, 
        cycle: currentCycle, 
        duration, 
        result 
      });

      return {
        success: true,
        agent: this.name,
        duration,
        result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.emit('error', { agent: this.name, cycle: currentCycle, error });
      
      return {
        success: false,
        agent: this.name,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Get agent statistics
   */
  getStats() {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      frequency: this.frequency,
      priority: this.priority,
      runCount: this.runCount,
      lastRun: this.lastRun,
      avgTime: this.avgTime,
      totalTime: this.totalTime,
    };
  }

  /**
   * Enable the agent
   */
  enable() {
    this.enabled = true;
    this.emit('enabled');
  }

  /**
   * Disable the agent
   */
  disable() {
    this.enabled = false;
    this.emit('disabled');
  }
}

/**
 * Predefined agent types for common cognitive tasks
 */

/**
 * InferenceAgent - Performs logical inference on the AtomSpace
 */
class InferenceAgent extends Agent {
  constructor(options = {}) {
    super({ ...options, name: 'InferenceAgent' });
    this.maxInferences = options.maxInferences || 10;
  }

  async run(atomspace, attentionBank) {
    const inferences = [];
    const implications = atomspace.getAtomsByType('IMPLICATION');
    
    for (let i = 0; i < Math.min(implications.length, this.maxInferences); i++) {
      const impl = implications[i];
      if (impl.outgoing.length === 2) {
        const [antecedent, consequent] = impl.outgoing;
        
        // Simple forward chaining: if antecedent exists with high truth value, assert consequent
        if (antecedent.truthValue.strength > 0.7) {
          const newTruthValue = {
            strength: antecedent.truthValue.strength * impl.truthValue.strength,
            confidence: Math.min(antecedent.truthValue.confidence, impl.truthValue.confidence),
          };
          
          const result = atomspace.addAtom(
            consequent.type,
            consequent.name,
            consequent.outgoing,
            newTruthValue
          );
          
          inferences.push({ antecedent: antecedent.id, consequent: result.id });
        }
      }
    }
    
    return { inferences: inferences.length };
  }
}

/**
 * AttentionAllocationAgent - Spreads attention through the hypergraph
 */
class AttentionAllocationAgent extends Agent {
  constructor(options = {}) {
    super({ ...options, name: 'AttentionAllocationAgent' });
    this.spreadFactor = options.spreadFactor || 0.5;
  }

  async run(atomspace, attentionBank) {
    const focusAtoms = atomspace.getAttentionalFocus(20);
    let spreads = 0;
    
    for (const atom of focusAtoms) {
      // Spread attention to connected atoms
      for (const outAtom of atom.outgoing) {
        const spreadAmount = atom.attention.sti * this.spreadFactor;
        attentionBank.stimulate(outAtom.id, spreadAmount);
        spreads++;
      }
      
      for (const inAtom of atom.incoming) {
        const spreadAmount = atom.attention.sti * this.spreadFactor * 0.5;
        attentionBank.stimulate(inAtom.id, spreadAmount);
        spreads++;
      }
    }
    
    return { attentionSpreads: spreads };
  }
}

/**
 * PatternMinerAgent - Discovers patterns in the AtomSpace
 */
class PatternMinerAgent extends Agent {
  constructor(options = {}) {
    super({ ...options, name: 'PatternMinerAgent' });
    this.minSupport = options.minSupport || 0.1;
  }

  async run(atomspace, attentionBank) {
    const patterns = new Map();
    const links = atomspace.getAtomsByType('LINK');
    
    // Simple pattern mining: find frequently occurring link structures
    for (const link of links) {
      const pattern = `${link.type}:${link.outgoing.map(a => a.type).join('-')}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    
    const discovered = Array.from(patterns.entries())
      .filter(([_, count]) => count / links.length >= this.minSupport)
      .map(([pattern, count]) => ({ pattern, count }));
    
    return { patternsDiscovered: discovered.length };
  }
}

module.exports = Agent;
module.exports.InferenceAgent = InferenceAgent;
module.exports.AttentionAllocationAgent = AttentionAllocationAgent;
module.exports.PatternMinerAgent = PatternMinerAgent;
