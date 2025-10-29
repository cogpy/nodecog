'use strict';

const { EventEmitter } = require('events');

/**
 * CognitiveLoop - Autonomous cognitive cycle manager
 * 
 * Implements the main autonomous loop that continuously executes
 * cognitive agents and maintains the system's operation
 */
class CognitiveLoop extends EventEmitter {
  constructor(orchestrator, options = {}) {
    super();
    this.orchestrator = orchestrator;
    this.running = false;
    this.cycleInterval = options.cycleInterval || 100; // ms between cycles
    this.maxCycles = options.maxCycles || Infinity;
    this.autoDecay = options.autoDecay ?? true;
    this.autoNormalize = options.autoNormalize ?? true;
    this.decayInterval = options.decayInterval || 10; // Decay every N cycles
    this.normalizeInterval = options.normalizeInterval || 20; // Normalize every N cycles
    this.timer = null;
    this.cycleCount = 0;
    this.startTime = null;
    this.pauseRequested = false;
  }

  /**
   * Start the autonomous cognitive loop
   */
  start() {
    if (this.running) {
      throw new Error('Cognitive loop is already running');
    }

    this.running = true;
    this.startTime = Date.now();
    this.cycleCount = 0;
    this.pauseRequested = false;
    
    this.emit('started');
    this._scheduleNextCycle();
    
    return this;
  }

  /**
   * Stop the cognitive loop
   */
  stop() {
    if (!this.running) {
      return this;
    }

    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    this.emit('stopped', {
      totalCycles: this.cycleCount,
      totalTime: Date.now() - this.startTime,
    });
    
    return this;
  }

  /**
   * Pause the cognitive loop (can be resumed)
   */
  pause() {
    if (!this.running) {
      return this;
    }

    this.pauseRequested = true;
    this.emit('paused');
    return this;
  }

  /**
   * Resume the cognitive loop
   */
  resume() {
    if (!this.running || !this.pauseRequested) {
      return this;
    }

    this.pauseRequested = false;
    this.emit('resumed');
    this._scheduleNextCycle();
    return this;
  }

  /**
   * Run a single cycle manually
   */
  async runSingleCycle() {
    if (this.running && !this.pauseRequested) {
      throw new Error('Cannot run single cycle while loop is running');
    }

    return await this._executeCycle();
  }

  /**
   * Get cognitive loop statistics
   */
  getStats() {
    const uptime = this.startTime ? Date.now() - this.startTime : 0;
    const avgCycleTime = this.cycleCount > 0 ? uptime / this.cycleCount : 0;

    return {
      running: this.running,
      paused: this.pauseRequested,
      cycleCount: this.cycleCount,
      uptime,
      avgCycleTime,
      cycleInterval: this.cycleInterval,
      maxCycles: this.maxCycles,
      orchestratorStats: this.orchestrator.getStats(),
    };
  }

  /**
   * Set the cycle interval
   */
  setCycleInterval(interval) {
    if (interval < 0) {
      throw new Error('Cycle interval must be non-negative');
    }
    this.cycleInterval = interval;
    this.emit('interval-changed', { interval });
  }

  /**
   * Private: Schedule the next cycle
   */
  _scheduleNextCycle() {
    if (!this.running || this.pauseRequested) {
      return;
    }

    this.timer = setTimeout(async () => {
      await this._executeCycle();
      
      if (this.running && !this.pauseRequested && this.cycleCount < this.maxCycles) {
        this._scheduleNextCycle();
      } else if (this.cycleCount >= this.maxCycles) {
        this.stop();
        this.emit('max-cycles-reached');
      }
    }, this.cycleInterval);
  }

  /**
   * Private: Execute one cognitive cycle
   */
  async _executeCycle() {
    const cycleStart = Date.now();
    this.cycleCount++;
    
    try {
      // Run orchestrator cycle
      const result = await this.orchestrator.runCycle();
      
      // Periodic maintenance
      if (this.autoDecay && this.cycleCount % this.decayInterval === 0) {
        this.orchestrator.attentionBank.decaySTI();
      }
      
      if (this.autoNormalize && this.cycleCount % this.normalizeInterval === 0) {
        this.orchestrator.attentionBank.normalizeSTI();
        this.orchestrator.attentionBank.normalizeLTI();
      }
      
      const cycleDuration = Date.now() - cycleStart;
      
      this.emit('cycle-complete', {
        cycle: this.cycleCount,
        duration: cycleDuration,
        result,
      });
      
      return result;
    } catch (error) {
      this.emit('cycle-error', {
        cycle: this.cycleCount,
        error,
      });
      
      // Continue running despite errors
      return { error: error.message };
    }
  }
}

module.exports = CognitiveLoop;
