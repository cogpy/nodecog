'use strict';

/**
 * ESM Agent Arena - Execution environment for autonomous ESM agents
 * 
 * Provides isolated execution contexts for ECMAScript Module agents
 * with their own AtomSpace views over the distributed nodespace.
 * Implements an MLOps "Training Academy" for agent evolution.
 */

const { EventEmitter } = require('events');
const vm = require('vm');
const { Agent } = require('internal/opencog/agent');

/**
 * Agent execution context state
 */
const AgentState = {
  INITIALIZING: 'initializing',
  TRAINING: 'training',
  ACTIVE: 'active',
  PAUSED: 'paused',
  TERMINATED: 'terminated',
  ERROR: 'error',
};

/**
 * ESMAgentContext - Isolated execution context for an ESM agent
 * 
 * Each agent gets its own context with:
 * - Isolated VM context
 * - AtomSpace view (slice of distributed knowledge)
 * - Performance metrics
 * - Training state
 */
class ESMAgentContext {
  constructor(agentId, code, atomspaceView, options = {}) {
    this.agentId = agentId;
    this.code = code;
    this.atomspaceView = atomspaceView;
    this.state = AgentState.INITIALIZING;
    
    // Execution environment
    this.vmContext = null;
    this.sandbox = null;
    
    // Training metrics
    this.metrics = {
      executionCount: 0,
      totalExecutionTime: 0,
      avgExecutionTime: 0,
      successRate: 0,
      successCount: 0,
      errorCount: 0,
      lastExecution: null,
      fitness: 0,
      generation: 0,
    };
    
    // Training state
    this.trainingEpoch = 0;
    this.trainingObjective = options.trainingObjective || null;
    this.maxTrainingEpochs = options.maxTrainingEpochs || 100;
    
    // Memory limits
    this.memoryLimit = options.memoryLimit || 50 * 1024 * 1024; // 50MB default
    this.timeoutMs = options.timeoutMs || 5000; // 5s default
    
    // Initialize VM context
    this._initializeContext();
  }

  /**
   * Initialize the VM execution context
   */
  _initializeContext() {
    this.sandbox = {
      console: {
        log: (...args) => this._log('log', args),
        error: (...args) => this._log('error', args),
        warn: (...args) => this._log('warn', args),
      },
      atomspace: this.atomspaceView,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Date,
      Math,
      JSON,
      Array,
      Object,
      Map,
      Set,
      WeakMap,
      WeakSet,
      Promise,
    };
    
    this.vmContext = vm.createContext(this.sandbox);
    this.state = AgentState.TRAINING;
  }

  /**
   * Execute the agent code
   */
  async execute(input = {}) {
    if (this.state === AgentState.TERMINATED) {
      throw new Error('Cannot execute terminated agent');
    }

    const startTime = Date.now();
    this.metrics.executionCount++;

    try {
      // Create execution wrapper
      const wrappedCode = `
        (async function(input) {
          ${this.code}
        })
      `;

      // Compile and run
      const script = new vm.Script(wrappedCode, {
        filename: `agent_${this.agentId}.mjs`,
        timeout: this.timeoutMs,
      });

      const agentFunction = script.runInContext(this.vmContext, {
        timeout: this.timeoutMs,
        displayErrors: true,
      });

      const result = await agentFunction(input);

      // Update metrics
      const executionTime = Date.now() - startTime;
      this.metrics.totalExecutionTime += executionTime;
      this.metrics.avgExecutionTime = 
        this.metrics.totalExecutionTime / this.metrics.executionCount;
      this.metrics.successCount++;
      this.metrics.successRate = 
        this.metrics.successCount / this.metrics.executionCount;
      this.metrics.lastExecution = Date.now();

      // Update fitness based on performance
      this._updateFitness(result, executionTime);

      if (this.state === AgentState.TRAINING) {
        this.trainingEpoch++;
        if (this.trainingEpoch >= this.maxTrainingEpochs) {
          this.state = AgentState.ACTIVE;
        }
      }

      return {
        success: true,
        result,
        executionTime,
        metrics: { ...this.metrics },
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.metrics.errorCount++;
      this.metrics.successRate = 
        this.metrics.successCount / this.metrics.executionCount;
      this.state = AgentState.ERROR;

      return {
        success: false,
        error: error.message,
        executionTime,
        metrics: { ...this.metrics },
      };
    }
  }

  /**
   * Update fitness score based on execution results
   */
  _updateFitness(result, executionTime) {
    let fitness = 0;

    // Performance component (faster is better)
    const performanceFitness = Math.max(0, 1 - (executionTime / this.timeoutMs));
    fitness += performanceFitness * 0.3;

    // Success rate component
    fitness += this.metrics.successRate * 0.3;

    // Result quality component (if training objective exists)
    if (this.trainingObjective && result) {
      const objectiveFitness = this._evaluateObjective(result);
      fitness += objectiveFitness * 0.4;
    } else {
      // Default: successful execution contributes
      fitness += 0.4;
    }

    // Exponential moving average for smooth fitness updates
    const alpha = 0.3;
    this.metrics.fitness = alpha * fitness + (1 - alpha) * this.metrics.fitness;
  }

  /**
   * Evaluate how well result meets training objective
   */
  _evaluateObjective(result) {
    if (!this.trainingObjective) return 0;

    // Example objectives:
    // - maximize: higher values are better
    // - minimize: lower values are better
    // - target: closer to target is better
    
    const { type, value, metric } = this.trainingObjective;
    const resultValue = metric ? result[metric] : result;

    switch (type) {
      case 'maximize':
        return Math.min(1, resultValue / value);
      case 'minimize':
        return Math.max(0, 1 - (resultValue / value));
      case 'target':
        return Math.max(0, 1 - Math.abs(resultValue - value) / value);
      default:
        return 0;
    }
  }

  /**
   * Pause agent execution
   */
  pause() {
    if (this.state === AgentState.ACTIVE || this.state === AgentState.TRAINING) {
      this.state = AgentState.PAUSED;
      return true;
    }
    return false;
  }

  /**
   * Resume agent execution
   */
  resume() {
    if (this.state === AgentState.PAUSED) {
      this.state = this.trainingEpoch >= this.maxTrainingEpochs ? 
        AgentState.ACTIVE : AgentState.TRAINING;
      return true;
    }
    return false;
  }

  /**
   * Terminate agent context
   */
  terminate() {
    this.state = AgentState.TERMINATED;
    this.vmContext = null;
    this.sandbox = null;
  }

  /**
   * Clone context for evolution
   */
  clone(mutationRate = 0.1) {
    // Create slightly mutated version of code for evolution
    let mutatedCode = this.code;
    
    if (Math.random() < mutationRate) {
      // Simple mutation: adjust numeric constants
      mutatedCode = this.code.replace(/\d+(\.\d+)?/g, (match) => {
        const num = parseFloat(match);
        const mutation = (Math.random() - 0.5) * 0.2; // ±10%
        return (num * (1 + mutation)).toFixed(2);
      });
    }

    const clone = new ESMAgentContext(
      `${this.agentId}_gen${this.metrics.generation + 1}`,
      mutatedCode,
      this.atomspaceView,
      {
        trainingObjective: this.trainingObjective,
        maxTrainingEpochs: this.maxTrainingEpochs,
        memoryLimit: this.memoryLimit,
        timeoutMs: this.timeoutMs,
      }
    );

    clone.metrics.generation = this.metrics.generation + 1;
    return clone;
  }

  /**
   * Get context statistics
   */
  getStats() {
    return {
      agentId: this.agentId,
      state: this.state,
      metrics: { ...this.metrics },
      trainingEpoch: this.trainingEpoch,
      maxTrainingEpochs: this.maxTrainingEpochs,
    };
  }

  /**
   * Private: Log handler
   */
  _log(level, args) {
    // Log to arena event system (handled by parent arena)
    if (this.onLog) {
      this.onLog(level, args);
    }
  }
}

/**
 * ESMAgentArena - Training academy for autonomous ESM agents
 * 
 * Manages multiple agent contexts with:
 * - Agent lifecycle management
 * - Training and evolution
 * - Performance monitoring
 * - Distributed execution over nodespace
 */
class ESMAgentArena extends EventEmitter {
  constructor(distributedAtomspace, options = {}) {
    super();
    
    this.atomspace = distributedAtomspace;
    this.agents = new Map(); // agentId -> ESMAgentContext
    this.activeAgents = new Set();
    this.trainingAgents = new Set();
    
    // Arena configuration
    this.maxAgents = options.maxAgents || 100;
    this.evolutionEnabled = options.evolutionEnabled !== false;
    this.selectionStrategy = options.selectionStrategy || 'tournament'; // 'tournament', 'roulette', 'elite'
    this.populationSize = options.populationSize || 20;
    
    // Training academy settings
    this.academyMode = options.academyMode || 'competitive'; // 'competitive', 'cooperative', 'hybrid'
    this.generationLimit = options.generationLimit || 50;
    this.currentGeneration = 0;
    
    // Statistics
    this.stats = {
      totalAgentsCreated: 0,
      totalExecutions: 0,
      totalTrainingEpochs: 0,
      averageFitness: 0,
      bestFitness: 0,
      worstFitness: 1,
    };
  }

  /**
   * Register a new ESM agent in the arena
   */
  registerAgent(code, options = {}) {
    if (this.agents.size >= this.maxAgents) {
      throw new Error(`Arena at capacity (${this.maxAgents} agents)`);
    }

    const agentId = options.id || `agent_${this.stats.totalAgentsCreated}`;
    
    // Create atomspace view for this agent (scoped subset)
    const atomspaceView = this._createAtomSpaceView(agentId);
    
    const context = new ESMAgentContext(agentId, code, atomspaceView, options);
    
    // Set up logging
    context.onLog = (level, args) => {
      this.emit('agent-log', { agentId, level, message: args.join(' ') });
    };
    
    this.agents.set(agentId, context);
    this.trainingAgents.add(agentId);
    this.stats.totalAgentsCreated++;
    
    this.emit('agent-registered', {
      agentId,
      totalAgents: this.agents.size,
      state: context.state,
    });
    
    return agentId;
  }

  /**
   * Execute an agent
   */
  async executeAgent(agentId, input = {}) {
    const context = this.agents.get(agentId);
    if (!context) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const result = await context.execute(input);
    this.stats.totalExecutions++;

    // Move to active if training complete
    if (context.state === AgentState.ACTIVE && this.trainingAgents.has(agentId)) {
      this.trainingAgents.delete(agentId);
      this.activeAgents.add(agentId);
    }

    this._updateStats();

    this.emit('agent-executed', {
      agentId,
      success: result.success,
      fitness: context.metrics.fitness,
      state: context.state,
    });

    return result;
  }

  /**
   * Run a training epoch for all training agents
   */
  async runTrainingEpoch(trainingData = {}) {
    const results = [];
    
    for (const agentId of this.trainingAgents) {
      const result = await this.executeAgent(agentId, trainingData);
      results.push({ agentId, ...result });
    }

    this.stats.totalTrainingEpochs++;

    this.emit('training-epoch-complete', {
      epoch: this.stats.totalTrainingEpochs,
      agentsTrained: results.length,
      averageFitness: this._calculateAverageFitness(),
    });

    return results;
  }

  /**
   * Evolve agent population (genetic algorithm style)
   */
  async evolvePopulation() {
    if (!this.evolutionEnabled) {
      throw new Error('Evolution not enabled for this arena');
    }

    const population = Array.from(this.agents.values());
    
    // Sort by fitness
    population.sort((a, b) => b.metrics.fitness - a.metrics.fitness);

    // Selection
    const selected = this._selectForReproduction(population);

    // Crossover and mutation
    const offspring = [];
    for (let i = 0; i < selected.length; i += 2) {
      const parent1 = selected[i];
      const parent2 = selected[i + 1] || selected[0];
      
      // Create offspring through cloning with mutation
      const child1 = parent1.clone(0.1);
      const child2 = parent2.clone(0.1);
      
      offspring.push(child1, child2);
    }

    // Replace worst performers with offspring
    const toReplace = population.slice(-offspring.length);
    for (let i = 0; i < offspring.length && i < toReplace.length; i++) {
      const oldAgent = toReplace[i];
      this.removeAgent(oldAgent.agentId);
      
      this.agents.set(offspring[i].agentId, offspring[i]);
      this.trainingAgents.add(offspring[i].agentId);
    }

    this.currentGeneration++;

    this.emit('population-evolved', {
      generation: this.currentGeneration,
      populationSize: this.agents.size,
      offspringCreated: offspring.length,
      bestFitness: population[0].metrics.fitness,
    });

    return {
      generation: this.currentGeneration,
      bestFitness: population[0].metrics.fitness,
      averageFitness: this._calculateAverageFitness(),
    };
  }

  /**
   * Remove an agent from the arena
   */
  removeAgent(agentId) {
    const context = this.agents.get(agentId);
    if (!context) return false;

    context.terminate();
    this.agents.delete(agentId);
    this.activeAgents.delete(agentId);
    this.trainingAgents.delete(agentId);

    this.emit('agent-removed', { agentId, remainingAgents: this.agents.size });
    return true;
  }

  /**
   * Get agent by ID
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
   * Get top performing agents
   */
  getTopAgents(limit = 10) {
    return Array.from(this.agents.values())
      .sort((a, b) => b.metrics.fitness - a.metrics.fitness)
      .slice(0, limit);
  }

  /**
   * Get arena statistics
   */
  getArenaStats() {
    return {
      ...this.stats,
      totalAgents: this.agents.size,
      activeAgents: this.activeAgents.size,
      trainingAgents: this.trainingAgents.size,
      currentGeneration: this.currentGeneration,
      academyMode: this.academyMode,
      topAgents: this.getTopAgents(5).map(a => ({
        id: a.agentId,
        fitness: a.metrics.fitness,
        generation: a.metrics.generation,
      })),
    };
  }

  /**
   * Private: Create atomspace view for agent
   */
  _createAtomSpaceView(agentId) {
    // Create a scoped view of the atomspace for this agent
    // In a full implementation, this would be a proxy or filtered view
    return {
      addAtom: (...args) => this.atomspace.addAtom(...args),
      getAtom: (...args) => this.atomspace.getAtom(...args),
      getAtomsByType: (...args) => this.atomspace.getAtomsByType(...args),
      patternMatch: (...args) => this.atomspace.patternMatch(...args),
      // Add agent-specific prefix to queries
      agentId,
    };
  }

  /**
   * Private: Select agents for reproduction
   */
  _selectForReproduction(population) {
    const selectionSize = Math.floor(this.populationSize / 2);
    
    switch (this.selectionStrategy) {
      case 'elite':
        // Select top performers
        return population.slice(0, selectionSize);
        
      case 'tournament': {
        // Tournament selection
        const selected = [];
        const tournamentSize = 3;
        
        for (let i = 0; i < selectionSize; i++) {
          const tournament = [];
          for (let j = 0; j < tournamentSize; j++) {
            const random = Math.floor(Math.random() * population.length);
            tournament.push(population[random]);
          }
          tournament.sort((a, b) => b.metrics.fitness - a.metrics.fitness);
          selected.push(tournament[0]);
        }
        return selected;
      }
      
      case 'roulette': {
        // Fitness-proportionate selection
        const selected = [];
        const totalFitness = population.reduce((sum, a) => sum + a.metrics.fitness, 0);
        
        for (let i = 0; i < selectionSize; i++) {
          let spin = Math.random() * totalFitness;
          for (const agent of population) {
            spin -= agent.metrics.fitness;
            if (spin <= 0) {
              selected.push(agent);
              break;
            }
          }
        }
        return selected;
      }
      
      default:
        return population.slice(0, selectionSize);
    }
  }

  /**
   * Private: Calculate average fitness
   */
  _calculateAverageFitness() {
    if (this.agents.size === 0) return 0;
    
    const totalFitness = Array.from(this.agents.values())
      .reduce((sum, agent) => sum + agent.metrics.fitness, 0);
    
    return totalFitness / this.agents.size;
  }

  /**
   * Private: Update arena statistics
   */
  _updateStats() {
    const agents = Array.from(this.agents.values());
    
    if (agents.length === 0) return;
    
    const fitnesses = agents.map(a => a.metrics.fitness);
    this.stats.averageFitness = this._calculateAverageFitness();
    this.stats.bestFitness = Math.max(...fitnesses);
    this.stats.worstFitness = Math.min(...fitnesses);
  }

  /**
   * Destroy arena and cleanup
   */
  destroy() {
    for (const context of this.agents.values()) {
      context.terminate();
    }
    this.agents.clear();
    this.activeAgents.clear();
    this.trainingAgents.clear();
  }
}

module.exports = ESMAgentArena;
module.exports.ESMAgentContext = ESMAgentContext;
module.exports.AgentState = AgentState;
