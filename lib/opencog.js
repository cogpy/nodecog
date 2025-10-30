'use strict';

/**
 * OpenCog - Autonomous Multi-Agent Orchestration System
 * 
 * This module implements an OpenCog-inspired cognitive architecture
 * for autonomous multi-agent systems in pure Node.js.
 * 
 * Core Components:
 * - AtomSpace: Hypergraph knowledge representation
 * - Agent: Base class for cognitive agents
 * - AgentOrchestrator: Manages agent execution and scheduling
 * - AttentionBank: Attention allocation mechanism
 * - CognitiveLoop: Autonomous cognitive cycle
 * 
 * Phase 4 Components:
 * - DistributedAtomSpace: Multi-node knowledge sharing
 * - ESMAgentArena: Training academy for autonomous ESM agents
 * - MOSES: Meta-Optimizing Semantic Evolutionary Search
 * - NLPProcessor: Natural language processing
 * - Planner: Goal-directed planning and behavior
 * - CognitiveVisualizer: Real-time cognitive dashboard
 */

const { EventEmitter } = require('events');

module.exports = {
  // Core (Phases 1-3)
  AtomSpace: require('internal/opencog/atomspace'),
  Agent: require('internal/opencog/agent'),
  AgentOrchestrator: require('internal/opencog/orchestrator'),
  AttentionBank: require('internal/opencog/attention'),
  CognitiveLoop: require('internal/opencog/cognitive_loop'),
  NodeSpace: require('internal/opencog/nodespace'),
  ModuleAnalyzerAgent: require('internal/opencog/module_analyzer_agent'),
  PLN: require('internal/opencog/pln'),
  Temporal: require('internal/opencog/temporal'),
  PerformanceProfilerAgent: require('internal/opencog/performance_profiler_agent'),
  SecurityAnalyzerAgent: require('internal/opencog/security_analyzer_agent'),
  BuildOptimizationAgent: require('internal/opencog/build_optimization_agent'),
  
  // Phase 4: Distributed & Advanced Features
  DistributedAtomSpace: require('internal/opencog/distributed_atomspace'),
  ESMAgentArena: require('internal/opencog/esm_agent_arena'),
  MOSES: require('internal/opencog/moses'),
  NLPProcessor: require('internal/opencog/nlp'),
  Planner: require('internal/opencog/planning'),
  CognitiveVisualizer: require('internal/opencog/visualization'),
  
  // Factory functions
  createCognitiveSystem,
  createDistributedCognitiveSystem,
};

/**
 * Factory function to create a complete cognitive system
 * @param {Object} options - Configuration options
 * @returns {Object} Configured cognitive system
 */
function createCognitiveSystem(options = {}) {
  const atomspace = new module.exports.AtomSpace(options.atomspace);
  const attentionBank = new module.exports.AttentionBank(atomspace, options.attention);
  const orchestrator = new module.exports.AgentOrchestrator(atomspace, attentionBank, options.orchestrator);
  const cognitiveLoop = new module.exports.CognitiveLoop(orchestrator, options.cognitiveLoop);
  
  // Optionally create NodeSpace for module tracking
  const nodespace = options.enableNodeSpace !== false ? 
    new module.exports.NodeSpace(atomspace, options.nodespace) : null;

  return {
    atomspace,
    attentionBank,
    orchestrator,
    cognitiveLoop,
    nodespace,
    
    /**
     * Start the autonomous cognitive cycle
     */
    start() {
      return cognitiveLoop.start();
    },
    
    /**
     * Stop the cognitive cycle
     */
    stop() {
      return cognitiveLoop.stop();
    },
    
    /**
     * Add an agent to the system
     */
    addAgent(agent) {
      return orchestrator.addAgent(agent);
    },
    
    /**
     * Remove an agent from the system
     */
    removeAgent(agentId) {
      return orchestrator.removeAgent(agentId);
    },
  };
}

/**
 * Factory function to create a distributed cognitive system (Phase 4)
 * @param {Object} options - Configuration options
 * @returns {Object} Configured distributed cognitive system
 */
function createDistributedCognitiveSystem(options = {}) {
  // Create distributed atomspace
  const atomspace = new module.exports.DistributedAtomSpace({
    ...options.atomspace,
    nodeId: options.nodeId,
    syncStrategy: options.syncStrategy,
  });
  
  const attentionBank = new module.exports.AttentionBank(atomspace, options.attention);
  const orchestrator = new module.exports.AgentOrchestrator(atomspace, attentionBank, options.orchestrator);
  const cognitiveLoop = new module.exports.CognitiveLoop(orchestrator, options.cognitiveLoop);
  
  // Phase 4 components
  const esmArena = options.enableESMArena !== false ?
    new module.exports.ESMAgentArena(atomspace, options.esmArena) : null;
    
  const moses = options.enableMOSES !== false ?
    new module.exports.MOSES(options.moses) : null;
    
  const nlp = options.enableNLP !== false ?
    new module.exports.NLPProcessor(atomspace, options.nlp) : null;
    
  const planner = options.enablePlanner !== false ?
    new module.exports.Planner(atomspace, options.planner) : null;
    
  const visualizer = options.enableVisualizer !== false ?
    new module.exports.CognitiveVisualizer(atomspace, options.visualizer) : null;

  return {
    atomspace,
    attentionBank,
    orchestrator,
    cognitiveLoop,
    
    // Phase 4 components
    esmArena,
    moses,
    nlp,
    planner,
    visualizer,
    
    /**
     * Register a peer node for distributed operations
     */
    registerPeer(nodeId, connectionInfo) {
      return atomspace.registerPeer(nodeId, connectionInfo);
    },
    
    /**
     * Synchronize with peers
     */
    async syncWithPeers() {
      return atomspace.syncWithPeers();
    },
    
    /**
     * Start the autonomous cognitive cycle
     */
    start() {
      return cognitiveLoop.start();
    },
    
    /**
     * Stop the cognitive cycle
     */
    stop() {
      return cognitiveLoop.stop();
    },
    
    /**
     * Add an agent to the system
     */
    addAgent(agent) {
      return orchestrator.addAgent(agent);
    },
    
    /**
     * Remove an agent from the system
     */
    removeAgent(agentId) {
      return orchestrator.removeAgent(agentId);
    },
    
    /**
     * Register an ESM agent in the arena
     */
    registerESMAgent(code, options) {
      if (!esmArena) throw new Error('ESM Arena not enabled');
      return esmArena.registerAgent(code, options);
    },
    
    /**
     * Process natural language
     */
    processNaturalLanguage(text) {
      if (!nlp) throw new Error('NLP not enabled');
      return nlp.processSentence(text);
    },
    
    /**
     * Create a goal for planning
     */
    createGoal(description, condition, priority) {
      if (!planner) throw new Error('Planner not enabled');
      return planner.createGoal(description, condition, priority);
    },
    
    /**
     * Generate dashboard visualization
     */
    generateDashboard(options) {
      if (!visualizer) throw new Error('Visualizer not enabled');
      return visualizer.generateDashboard(options);
    },
    
    /**
     * Get comprehensive system statistics
     */
    getSystemStats() {
      return {
        atomspace: atomspace.getDistributedStats(),
        agents: orchestrator.getStats(),
        esmArena: esmArena?.getArenaStats(),
        moses: moses?.getStats(),
        nlp: nlp?.getStats(),
        planner: planner?.getStats(),
        visualizer: visualizer?.getStats(),
      };
    },
  };
}
