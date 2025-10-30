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
 */

const { EventEmitter } = require('events');

module.exports = {
  AtomSpace: require('internal/opencog/atomspace'),
  Agent: require('internal/opencog/agent'),
  AgentOrchestrator: require('internal/opencog/orchestrator'),
  AttentionBank: require('internal/opencog/attention'),
  CognitiveLoop: require('internal/opencog/cognitive_loop'),
  NodeSpace: require('internal/opencog/nodespace'),
  ModuleAnalyzerAgent: require('internal/opencog/module_analyzer_agent'),
  createCognitiveSystem,
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
