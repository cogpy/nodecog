'use strict';

/**
 * Planning System - Goal-directed behavior and planning
 * 
 * Implements hierarchical task planning and goal-directed behavior
 * for cognitive agents using AtomSpace as the knowledge base.
 */

const { EventEmitter } = require('events');

/**
 * Plan action types
 */
const ActionType = {
  PRIMITIVE: 'primitive',     // Atomic action
  COMPOSITE: 'composite',     // Sequence of actions
  CONDITIONAL: 'conditional', // If-then-else
  LOOP: 'loop',               // Repetitive action
  PARALLEL: 'parallel',       // Concurrent actions
};

/**
 * Goal status
 */
const GoalStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  ACHIEVED: 'achieved',
  FAILED: 'failed',
  ABANDONED: 'abandoned',
};

/**
 * Goal - Represents a desired state
 */
class Goal {
  constructor(id, description, condition, priority = 0) {
    this.id = id;
    this.description = description;
    this.condition = condition; // Function to check if goal is achieved
    this.priority = priority;
    this.status = GoalStatus.PENDING;
    this.subgoals = [];
    this.plan = null;
    this.createdAt = Date.now();
    this.achievedAt = null;
  }

  /**
   * Check if goal is achieved
   */
  isAchieved(state) {
    if (typeof this.condition === 'function') {
      return this.condition(state);
    }
    return false;
  }

  /**
   * Add a subgoal
   */
  addSubgoal(subgoal) {
    this.subgoals.push(subgoal);
  }
}

/**
 * Action - Represents a single action in a plan
 */
class Action {
  constructor(name, type, executor, options = {}) {
    this.name = name;
    this.type = type;
    this.executor = executor; // Function to execute the action
    this.preconditions = options.preconditions || [];
    this.effects = options.effects || [];
    this.cost = options.cost || 1;
    this.duration = options.duration || 1;
  }

  /**
   * Check if action can be executed in current state
   */
  canExecute(state) {
    return this.preconditions.every(precond => precond(state));
  }

  /**
   * Execute the action
   */
  async execute(state, ...args) {
    if (!this.canExecute(state)) {
      throw new Error(`Preconditions not met for action: ${this.name}`);
    }
    
    const result = await this.executor(state, ...args);
    
    // Apply effects
    for (const effect of this.effects) {
      effect(state);
    }
    
    return result;
  }
}

/**
 * Plan - Sequence of actions to achieve a goal
 */
class Plan {
  constructor(goal, actions = []) {
    this.goal = goal;
    this.actions = actions;
    this.currentStep = 0;
    this.status = 'pending';
    this.estimatedCost = this._calculateCost();
    this.estimatedDuration = this._calculateDuration();
  }

  /**
   * Calculate plan cost
   */
  _calculateCost() {
    return this.actions.reduce((sum, action) => sum + action.cost, 0);
  }

  /**
   * Calculate plan duration
   */
  _calculateDuration() {
    return this.actions.reduce((sum, action) => sum + action.duration, 0);
  }

  /**
   * Execute the plan
   */
  async execute(state) {
    this.status = 'executing';
    const results = [];
    
    for (let i = this.currentStep; i < this.actions.length; i++) {
      const action = this.actions[i];
      
      try {
        const result = await action.execute(state);
        results.push({ action: action.name, result, success: true });
        this.currentStep = i + 1;
      } catch (error) {
        results.push({ action: action.name, error: error.message, success: false });
        this.status = 'failed';
        return { success: false, results, failedAt: i };
      }
    }
    
    this.status = 'completed';
    return { success: true, results };
  }
}

/**
 * Planner - Hierarchical task planner
 */
class Planner extends EventEmitter {
  constructor(atomspace, options = {}) {
    super();
    
    this.atomspace = atomspace;
    this.goals = new Map(); // id -> Goal
    this.actions = new Map(); // name -> Action
    this.plans = new Map(); // goalId -> Plan
    
    // Planning parameters
    this.maxPlanningDepth = options.maxPlanningDepth || 10;
    this.planningTimeout = options.planningTimeout || 5000; // ms
    this.replanOnFailure = options.replanOnFailure !== false;
    
    // Statistics
    this.stats = {
      goalsCreated: 0,
      goalsAchieved: 0,
      goalsFailed: 0,
      plansGenerated: 0,
      plansExecuted: 0,
      actionsExecuted: 0,
    };
  }

  /**
   * Register an action
   */
  registerAction(action) {
    this.actions.set(action.name, action);
    
    this.emit('action-registered', { name: action.name, type: action.type });
    return action;
  }

  /**
   * Create a new goal
   */
  createGoal(description, condition, priority = 0) {
    const id = `goal_${this.stats.goalsCreated}`;
    const goal = new Goal(id, description, condition, priority);
    
    this.goals.set(id, goal);
    this.stats.goalsCreated++;
    
    this.emit('goal-created', { id, description, priority });
    return goal;
  }

  /**
   * Generate a plan to achieve a goal using forward search
   */
  async planForGoal(goalId, initialState = {}) {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    // Check if goal is already achieved
    if (goal.isAchieved(initialState)) {
      goal.status = GoalStatus.ACHIEVED;
      this.stats.goalsAchieved++;
      return new Plan(goal, []);
    }

    goal.status = GoalStatus.ACTIVE;

    // Forward search with A* algorithm
    const plan = await this._forwardSearch(goal, initialState);
    
    if (plan) {
      this.plans.set(goalId, plan);
      this.stats.plansGenerated++;
      
      this.emit('plan-generated', {
        goalId,
        actionCount: plan.actions.length,
        estimatedCost: plan.estimatedCost,
      });
      
      return plan;
    }

    goal.status = GoalStatus.FAILED;
    this.stats.goalsFailed++;
    return null;
  }

  /**
   * Execute a plan
   */
  async executePlan(goalId, state = {}) {
    const plan = this.plans.get(goalId);
    if (!plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }

    this.stats.plansExecuted++;
    
    this.emit('plan-execution-start', {
      goalId,
      actionCount: plan.actions.length,
    });

    const result = await plan.execute(state);
    
    if (result.success) {
      const goal = this.goals.get(goalId);
      goal.status = GoalStatus.ACHIEVED;
      goal.achievedAt = Date.now();
      this.stats.goalsAchieved++;
    } else if (this.replanOnFailure) {
      // Try to replan
      this.emit('plan-failed-replanning', { goalId });
      const newPlan = await this.planForGoal(goalId, state);
      if (newPlan) {
        return this.executePlan(goalId, state);
      }
    }

    this.stats.actionsExecuted += result.results.length;
    
    this.emit('plan-execution-complete', {
      goalId,
      success: result.success,
      actionsExecuted: result.results.length,
    });

    return result;
  }

  /**
   * Decompose a high-level goal into subgoals
   */
  decomposeGoal(goalId, decomposition) {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    for (const subgoalDesc of decomposition) {
      const subgoal = this.createGoal(
        subgoalDesc.description,
        subgoalDesc.condition,
        goal.priority - 1
      );
      goal.addSubgoal(subgoal);
    }

    this.emit('goal-decomposed', {
      goalId,
      subgoals: goal.subgoals.length,
    });

    return goal.subgoals;
  }

  /**
   * Get active goals sorted by priority
   */
  getActiveGoals() {
    return Array.from(this.goals.values())
      .filter(g => g.status === GoalStatus.ACTIVE || g.status === GoalStatus.PENDING)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get planning statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalGoals: this.goals.size,
      activeGoals: this.getActiveGoals().length,
      availableActions: this.actions.size,
      activePlans: this.plans.size,
    };
  }

  /**
   * Private: Forward search for plan
   */
  async _forwardSearch(goal, initialState) {
    const startTime = Date.now();
    const queue = [{ state: { ...initialState }, actions: [], cost: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      // Timeout check
      if (Date.now() - startTime > this.planningTimeout) {
        this.emit('planning-timeout', { goalId: goal.id });
        return null;
      }

      // Get node with lowest cost (priority queue would be better)
      queue.sort((a, b) => a.cost - b.cost);
      const node = queue.shift();

      // Check if goal is achieved
      if (goal.isAchieved(node.state)) {
        return new Plan(goal, node.actions);
      }

      // Check depth limit
      if (node.actions.length >= this.maxPlanningDepth) {
        continue;
      }

      // State hash for visited check
      const stateHash = JSON.stringify(node.state);
      if (visited.has(stateHash)) {
        continue;
      }
      visited.add(stateHash);

      // Expand node - try all applicable actions
      for (const action of this.actions.values()) {
        if (action.canExecute(node.state)) {
          const newState = { ...node.state };
          
          // Apply effects
          for (const effect of action.effects) {
            effect(newState);
          }

          queue.push({
            state: newState,
            actions: [...node.actions, action],
            cost: node.cost + action.cost,
          });
        }
      }
    }

    // No plan found
    return null;
  }
}

/**
 * Reactive planner - Responds to state changes
 */
class ReactivePlanner extends Planner {
  constructor(atomspace, options = {}) {
    super(atomspace, options);
    
    this.triggers = new Map(); // condition -> goalId
    this.monitoringInterval = options.monitoringInterval || 1000; // ms
    this.monitoring = false;
  }

  /**
   * Register a reactive trigger
   */
  addTrigger(condition, goalId) {
    this.triggers.set(condition, goalId);
  }

  /**
   * Start monitoring for triggers
   */
  startMonitoring(state) {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.monitorTimer = setInterval(() => {
      this._checkTriggers(state);
    }, this.monitoringInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.monitoring = false;
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  /**
   * Private: Check triggers
   */
  _checkTriggers(state) {
    for (const [condition, goalId] of this.triggers) {
      if (condition(state)) {
        this.emit('trigger-activated', { goalId });
        
        // Automatically plan and execute
        this.planForGoal(goalId, state)
          .then(plan => {
            if (plan) {
              return this.executePlan(goalId, state);
            }
          })
          .catch(err => {
            this.emit('reactive-planning-error', { goalId, error: err.message });
          });
      }
    }
  }
}

module.exports = Planner;
module.exports.ReactivePlanner = ReactivePlanner;
module.exports.Goal = Goal;
module.exports.Action = Action;
module.exports.Plan = Plan;
module.exports.ActionType = ActionType;
module.exports.GoalStatus = GoalStatus;
