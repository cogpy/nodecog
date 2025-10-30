'use strict';

const { internalBinding } = require('internal/bootstrap/realm');
const cognitiveBinding = internalBinding('cognitive_synergy');

/**
 * Cognitive Synergy Engine - JavaScript API
 * 
 * This module provides JavaScript access to the V8+libuv cognitive synergy engine
 * that allows OpenCog's cognitive scheduler to control when JavaScript code runs.
 */

class CognitiveSynergyEngine {
  constructor(config = {}) {
    this.config = {
      cognitiveTick: config.cognitiveTick || 5,
      workerThreads: config.workerThreads || 4,
      maxMicrotasks: config.maxMicrotasks || 100,
      attentionBased: config.attentionBased !== false,
      monitoring: config.monitoring !== false,
    };
    
    this.initialized = false;
    this.isolates = new Map();
  }
  
  /**
   * Initialize the cognitive synergy engine
   */
  initialize() {
    if (this.initialized) {
      throw new Error('Engine already initialized');
    }
    
    cognitiveBinding.createEngine(this.config);
    this.initialized = true;
  }
  
  /**
   * Destroy the cognitive synergy engine
   */
  destroy() {
    if (!this.initialized) {
      return;
    }
    
    // Destroy all isolates
    for (const id of this.isolates.keys()) {
      this.destroyIsolate(id);
    }
    
    cognitiveBinding.destroyEngine();
    this.initialized = false;
  }
  
  /**
   * Create a new isolate with cognitive control
   * @param {string} id - Unique identifier for the isolate
   * @param {object} options - Isolate configuration options
   * @returns {IsolateContext} - The created isolate context
   */
  createIsolate(id, options = {}) {
    if (!this.initialized) {
      throw new Error('Engine not initialized');
    }
    
    if (this.isolates.has(id)) {
      throw new Error(`Isolate ${id} already exists`);
    }
    
    const success = cognitiveBinding.createIsolate(id);
    if (!success) {
      throw new Error(`Failed to create isolate ${id}`);
    }
    
    const context = new IsolateContext(this, id, options);
    this.isolates.set(id, context);
    
    return context;
  }
  
  /**
   * Destroy an isolate
   * @param {string} id - Isolate identifier
   */
  destroyIsolate(id) {
    if (!this.isolates.has(id)) {
      return;
    }
    
    cognitiveBinding.destroyIsolate(id);
    this.isolates.delete(id);
  }
  
  /**
   * Get an existing isolate
   * @param {string} id - Isolate identifier
   * @returns {IsolateContext|undefined}
   */
  getIsolate(id) {
    return this.isolates.get(id);
  }
  
  /**
   * Get engine statistics
   * @returns {object} - Engine statistics
   */
  getStats() {
    if (!this.initialized) {
      throw new Error('Engine not initialized');
    }
    
    return cognitiveBinding.getStats();
  }
  
  /**
   * Create a shared buffer for zero-copy communication
   * @param {number} size - Buffer size in bytes
   * @returns {SharedArrayBuffer}
   */
  createSharedBuffer(size) {
    return cognitiveBinding.createSharedBuffer(size);
  }
}

/**
 * Represents an isolated execution context with cognitive control
 */
class IsolateContext {
  constructor(engine, id, options = {}) {
    this._engine = engine;
    this._id = id;
    this._sti = options.sti || 50.0;
    this._lti = options.lti || 50.0;
    
    // Set initial attention values
    this.setSTI(this._sti);
    this.setLTI(this._lti);
  }
  
  /**
   * Get the isolate ID
   */
  get id() {
    return this._id;
  }
  
  /**
   * Set Short-Term Importance (STI)
   * @param {number} value - STI value
   */
  setSTI(value) {
    this._sti = value;
    cognitiveBinding.setSTI(this._id, value);
  }
  
  /**
   * Get Short-Term Importance (STI)
   * @returns {number} - Current STI value
   */
  getSTI() {
    return cognitiveBinding.getSTI(this._id);
  }
  
  /**
   * Set Long-Term Importance (LTI)
   * @param {number} value - LTI value
   */
  setLTI(value) {
    this._lti = value;
    cognitiveBinding.setLTI(this._id, value);
  }
  
  /**
   * Get Long-Term Importance (LTI)
   * @returns {number} - Current LTI value
   */
  getLTI() {
    return cognitiveBinding.getLTI(this._id);
  }
  
  /**
   * Get memory usage for this isolate
   * @returns {number} - Memory usage in bytes
   */
  getMemoryUsage() {
    return cognitiveBinding.getMemoryUsage(this._id);
  }
  
  /**
   * Increase STI (boost attention)
   * @param {number} amount - Amount to increase
   */
  boost(amount = 10) {
    const current = this.getSTI();
    this.setSTI(current + amount);
  }
  
  /**
   * Decrease STI (reduce attention)
   * @param {number} amount - Amount to decrease
   */
  decay(amount = 5) {
    const current = this.getSTI();
    this.setSTI(Math.max(1.0, current - amount));
  }
}

/**
 * Factory function to create a cognitive synergy engine
 */
function createCognitiveSynergyEngine(config) {
  const engine = new CognitiveSynergyEngine(config);
  engine.initialize();
  return engine;
}

module.exports = {
  CognitiveSynergyEngine,
  IsolateContext,
  createCognitiveSynergyEngine,
};
