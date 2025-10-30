'use strict';

/**
 * MOSES - Meta-Optimizing Semantic Evolutionary Search
 * 
 * Implements the MOSES algorithm for program synthesis and optimization.
 * Uses evolutionary search with semantic representations to discover
 * optimal programs for given tasks.
 */

const { EventEmitter } = require('events');

/**
 * Representation types for MOSES programs
 */
const RepresentationType = {
  TREE: 'tree',           // Expression trees
  LINEAR: 'linear',       // Linear sequences
  COMBO: 'combo',         // COMBO language (OpenCog's DSL)
  JAVASCRIPT: 'javascript', // JavaScript code
};

/**
 * Fitness evaluation modes
 */
const FitnessMode = {
  ACCURACY: 'accuracy',       // Classification accuracy
  MSE: 'mse',                 // Mean squared error
  F1: 'f1',                   // F1 score
  CUSTOM: 'custom',           // Custom fitness function
};

/**
 * MOSESProgram - Represents an evolved program
 */
class MOSESProgram {
  constructor(representation, type = RepresentationType.JAVASCRIPT) {
    this.representation = representation;
    this.type = type;
    this.fitness = 0;
    this.complexity = this._calculateComplexity();
    this.generation = 0;
    this.age = 0;
  }

  /**
   * Execute the program with given input
   */
  execute(input) {
    try {
      switch (this.type) {
        case RepresentationType.JAVASCRIPT:
          // Create function from representation
          const func = new Function('input', `return (${this.representation})(input)`);
          return func(input);
          
        case RepresentationType.TREE:
          return this._evaluateTree(this.representation, input);
          
        case RepresentationType.LINEAR:
          return this._evaluateLinear(this.representation, input);
          
        default:
          throw new Error(`Unsupported representation type: ${this.type}`);
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Clone this program
   */
  clone() {
    const clone = new MOSESProgram(
      JSON.parse(JSON.stringify(this.representation)),
      this.type
    );
    clone.fitness = this.fitness;
    clone.generation = this.generation;
    clone.age = this.age;
    return clone;
  }

  /**
   * Calculate program complexity
   */
  _calculateComplexity() {
    if (typeof this.representation === 'string') {
      return this.representation.length;
    }
    return JSON.stringify(this.representation).length;
  }

  /**
   * Evaluate expression tree
   */
  _evaluateTree(node, input) {
    if (typeof node === 'number') return node;
    if (node === 'input') return input;
    
    if (typeof node === 'object' && node.op) {
      const left = this._evaluateTree(node.left, input);
      const right = this._evaluateTree(node.right, input);
      
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? left / right : 0;
        case '>': return left > right ? 1 : 0;
        case '<': return left < right ? 1 : 0;
        case '&&': return left && right ? 1 : 0;
        case '||': return left || right ? 1 : 0;
        default: return 0;
      }
    }
    
    return 0;
  }

  /**
   * Evaluate linear representation
   */
  _evaluateLinear(sequence, input) {
    let result = input;
    for (const op of sequence) {
      switch (op.type) {
        case 'add':
          result += op.value;
          break;
        case 'mul':
          result *= op.value;
          break;
        case 'div':
          result = op.value !== 0 ? result / op.value : 0;
          break;
      }
    }
    return result;
  }
}

/**
 * MOSES - Main evolutionary search engine
 */
class MOSES extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.representationType = options.representationType || RepresentationType.JAVASCRIPT;
    this.populationSize = options.populationSize || 100;
    this.maxGenerations = options.maxGenerations || 50;
    this.fitnessMode = options.fitnessMode || FitnessMode.ACCURACY;
    this.customFitness = options.customFitness || null;
    
    // Evolutionary parameters
    this.mutationRate = options.mutationRate || 0.1;
    this.crossoverRate = options.crossoverRate || 0.7;
    this.eliteSize = options.eliteSize || Math.floor(this.populationSize * 0.1);
    this.tournamentSize = options.tournamentSize || 3;
    
    // MOSES-specific parameters
    this.reductionSteps = options.reductionSteps || 5; // Deme expansion steps
    this.metaOptimize = options.metaOptimize !== false; // Meta-optimization
    
    // Population
    this.population = [];
    this.bestProgram = null;
    this.currentGeneration = 0;
    
    // Statistics
    this.stats = {
      generationsCompleted: 0,
      totalEvaluations: 0,
      bestFitness: -Infinity,
      averageFitness: 0,
      diversityScore: 0,
      convergenceRate: 0,
    };
  }

  /**
   * Initialize population with random programs
   */
  initializePopulation(templateProgram = null) {
    this.population = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      let program;
      
      if (templateProgram) {
        // Start from template and mutate
        program = this._mutate(templateProgram.clone());
      } else {
        // Create random program
        program = this._createRandomProgram();
      }
      
      this.population.push(program);
    }
    
    this.emit('population-initialized', {
      size: this.population.length,
      type: this.representationType,
    });
  }

  /**
   * Evolve programs to solve a task
   */
  async evolve(trainingData, validationData = null) {
    this.currentGeneration = 0;
    let previousBestFitness = -Infinity;
    let stagnationCount = 0;
    const maxStagnation = 10;
    
    while (this.currentGeneration < this.maxGenerations) {
      // Evaluate fitness of entire population
      await this._evaluatePopulation(trainingData);
      
      // Update best program
      const currentBest = this._getBestProgram();
      if (!this.bestProgram || currentBest.fitness > this.bestProgram.fitness) {
        this.bestProgram = currentBest.clone();
      }
      
      // Check for convergence
      if (Math.abs(currentBest.fitness - previousBestFitness) < 0.001) {
        stagnationCount++;
        if (stagnationCount >= maxStagnation) {
          this.emit('converged', {
            generation: this.currentGeneration,
            fitness: currentBest.fitness,
          });
          break;
        }
      } else {
        stagnationCount = 0;
      }
      
      previousBestFitness = currentBest.fitness;
      
      // MOSES-specific: Deme expansion and reduction
      if (this.metaOptimize && this.currentGeneration % 5 === 0) {
        await this._demeExpansion(currentBest);
      }
      
      // Selection and reproduction
      const newPopulation = this._evolveGeneration();
      this.population = newPopulation;
      
      // Update statistics
      this._updateStats();
      
      this.emit('generation-complete', {
        generation: this.currentGeneration,
        bestFitness: this.bestProgram.fitness,
        averageFitness: this.stats.averageFitness,
        diversity: this.stats.diversityScore,
      });
      
      this.currentGeneration++;
    }
    
    // Final validation if provided
    if (validationData && this.bestProgram) {
      const validationFitness = await this._evaluateProgram(
        this.bestProgram,
        validationData
      );
      
      this.emit('evolution-complete', {
        generations: this.currentGeneration,
        bestFitness: this.bestProgram.fitness,
        validationFitness,
        program: this.bestProgram,
      });
      
      return {
        program: this.bestProgram,
        fitness: this.bestProgram.fitness,
        validationFitness,
        generations: this.currentGeneration,
      };
    }
    
    return {
      program: this.bestProgram,
      fitness: this.bestProgram.fitness,
      generations: this.currentGeneration,
    };
  }

  /**
   * MOSES deme expansion - explore neighborhood of promising programs
   */
  async _demeExpansion(exemplar) {
    const demeSize = Math.floor(this.populationSize * 0.2);
    const deme = [];
    
    // Create variations of the exemplar
    for (let i = 0; i < demeSize; i++) {
      const variant = exemplar.clone();
      
      // Apply multiple reduction steps
      for (let step = 0; step < this.reductionSteps; step++) {
        this._reduce(variant);
      }
      
      deme.push(variant);
    }
    
    // Replace worst performers in population with deme
    this.population.sort((a, b) => a.fitness - b.fitness);
    for (let i = 0; i < deme.length; i++) {
      this.population[i] = deme[i];
    }
    
    this.emit('deme-expansion', {
      exemplarFitness: exemplar.fitness,
      demeSize: deme.length,
    });
  }

  /**
   * Program reduction - simplify while maintaining semantics
   */
  _reduce(program) {
    // MOSES reduction: simplify program structure
    if (this.representationType === RepresentationType.JAVASCRIPT) {
      // Simple reduction: remove redundant operations
      program.representation = program.representation
        .replace(/\+\s*0/g, '')
        .replace(/\*\s*1/g, '')
        .replace(/\-\s*0/g, '');
    }
    
    program.complexity = program._calculateComplexity();
  }

  /**
   * Evaluate entire population
   */
  async _evaluatePopulation(trainingData) {
    for (const program of this.population) {
      program.fitness = await this._evaluateProgram(program, trainingData);
      program.age++;
      this.stats.totalEvaluations++;
    }
  }

  /**
   * Evaluate a single program's fitness
   */
  async _evaluateProgram(program, data) {
    if (this.customFitness) {
      return this.customFitness(program, data);
    }
    
    let correct = 0;
    let total = 0;
    let errorSum = 0;
    
    for (const sample of data) {
      const output = program.execute(sample.input);
      total++;
      
      if (this.fitnessMode === FitnessMode.ACCURACY) {
        if (output === sample.output || 
            (typeof output === 'number' && 
             Math.abs(output - sample.output) < 0.01)) {
          correct++;
        }
      } else if (this.fitnessMode === FitnessMode.MSE) {
        const error = output - sample.output;
        errorSum += error * error;
      }
    }
    
    if (this.fitnessMode === FitnessMode.ACCURACY) {
      // Accuracy with complexity penalty
      const accuracy = total > 0 ? correct / total : 0;
      const complexityPenalty = program.complexity / 1000;
      return accuracy - complexityPenalty;
    } else if (this.fitnessMode === FitnessMode.MSE) {
      // Negative MSE (higher is better)
      const mse = total > 0 ? errorSum / total : Infinity;
      return -mse;
    }
    
    return 0;
  }

  /**
   * Evolve one generation
   */
  _evolveGeneration() {
    const newPopulation = [];
    
    // Elitism - keep best programs
    const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
    for (let i = 0; i < this.eliteSize; i++) {
      newPopulation.push(sorted[i].clone());
    }
    
    // Generate offspring
    while (newPopulation.length < this.populationSize) {
      // Tournament selection
      const parent1 = this._tournamentSelect();
      const parent2 = this._tournamentSelect();
      
      let offspring;
      if (Math.random() < this.crossoverRate) {
        offspring = this._crossover(parent1, parent2);
      } else {
        offspring = parent1.clone();
      }
      
      if (Math.random() < this.mutationRate) {
        offspring = this._mutate(offspring);
      }
      
      offspring.generation = this.currentGeneration + 1;
      offspring.age = 0;
      newPopulation.push(offspring);
    }
    
    return newPopulation;
  }

  /**
   * Tournament selection
   */
  _tournamentSelect() {
    const tournament = [];
    for (let i = 0; i < this.tournamentSize; i++) {
      const random = Math.floor(Math.random() * this.population.length);
      tournament.push(this.population[random]);
    }
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  /**
   * Crossover two programs
   */
  _crossover(parent1, parent2) {
    const offspring = parent1.clone();
    
    if (this.representationType === RepresentationType.JAVASCRIPT) {
      // Simple string crossover
      const p1 = parent1.representation;
      const p2 = parent2.representation;
      const point = Math.floor(Math.random() * Math.min(p1.length, p2.length));
      offspring.representation = p1.substring(0, point) + p2.substring(point);
    } else if (this.representationType === RepresentationType.TREE) {
      // Tree crossover - swap subtrees
      // Simplified implementation
      if (Math.random() < 0.5) {
        offspring.representation = parent2.representation;
      }
    }
    
    return offspring;
  }

  /**
   * Mutate a program
   */
  _mutate(program) {
    const mutated = program.clone();
    
    if (this.representationType === RepresentationType.JAVASCRIPT) {
      // Mutation strategies for JavaScript
      const mutations = [
        // Change operators
        () => mutated.representation = mutated.representation.replace(/\+/, '-'),
        () => mutated.representation = mutated.representation.replace(/\*/, '/'),
        // Modify constants
        () => mutated.representation = mutated.representation.replace(
          /\d+(\.\d+)?/,
          (match) => (parseFloat(match) * (0.8 + Math.random() * 0.4)).toFixed(2)
        ),
        // Add parentheses for different evaluation order
        () => {
          const parts = mutated.representation.split(' ');
          if (parts.length > 2) {
            const idx = Math.floor(Math.random() * (parts.length - 1));
            parts[idx] = '(' + parts[idx];
            parts[idx + 1] = parts[idx + 1] + ')';
            mutated.representation = parts.join(' ');
          }
        },
      ];
      
      const mutation = mutations[Math.floor(Math.random() * mutations.length)];
      mutation();
    }
    
    mutated.complexity = mutated._calculateComplexity();
    return mutated;
  }

  /**
   * Create random program
   */
  _createRandomProgram() {
    let representation;
    
    if (this.representationType === RepresentationType.JAVASCRIPT) {
      // Generate simple arithmetic expression
      const ops = ['+', '-', '*', '/'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      const const1 = (Math.random() * 10).toFixed(2);
      const const2 = (Math.random() * 10).toFixed(2);
      representation = `(input) => input ${op} ${const1}`;
    } else if (this.representationType === RepresentationType.TREE) {
      representation = {
        op: '+',
        left: 'input',
        right: Math.random() * 10,
      };
    } else {
      representation = [
        { type: 'add', value: Math.random() * 10 },
      ];
    }
    
    return new MOSESProgram(representation, this.representationType);
  }

  /**
   * Get best program from population
   */
  _getBestProgram() {
    return this.population.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }

  /**
   * Update statistics
   */
  _updateStats() {
    if (this.population.length === 0) return;
    
    const fitnesses = this.population.map(p => p.fitness);
    this.stats.bestFitness = Math.max(...fitnesses);
    this.stats.averageFitness = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length;
    this.stats.generationsCompleted = this.currentGeneration;
    
    // Diversity: variance in fitness
    const variance = fitnesses.reduce((sum, f) => 
      sum + Math.pow(f - this.stats.averageFitness, 2), 0
    ) / fitnesses.length;
    this.stats.diversityScore = Math.sqrt(variance);
  }

  /**
   * Get MOSES statistics
   */
  getStats() {
    return {
      ...this.stats,
      populationSize: this.population.length,
      currentGeneration: this.currentGeneration,
      bestProgram: this.bestProgram ? {
        fitness: this.bestProgram.fitness,
        complexity: this.bestProgram.complexity,
        generation: this.bestProgram.generation,
        representation: this.bestProgram.representation,
      } : null,
    };
  }
}

module.exports = MOSES;
module.exports.MOSESProgram = MOSESProgram;
module.exports.RepresentationType = RepresentationType;
module.exports.FitnessMode = FitnessMode;
