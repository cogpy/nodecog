'use strict';

// PLN (Probabilistic Logic Networks) Implementation
// Advanced reasoning engine with probabilistic truth value computation

const { AtomType } = require('./atomspace');

/**
 * Truth value with strength and confidence
 */
class TruthValue {
  constructor(strength = 0.5, confidence = 0.0) {
    this.strength = Math.max(0, Math.min(1, strength));
    this.confidence = Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get count (positive evidence)
   */
  get count() {
    return this.confidence * this.strength;
  }

  /**
   * Get total count
   */
  get totalCount() {
    return this.confidence;
  }

  clone() {
    return new TruthValue(this.strength, this.confidence);
  }

  toString() {
    return `TV(${this.strength.toFixed(3)}, ${this.confidence.toFixed(3)})`;
  }
}

/**
 * PLN Inference Rules
 */
class PLNRules {
  /**
   * Deduction rule: A→B, B→C ⊢ A→C
   * Uses term logic formulas
   */
  static deduction(tvAB, tvBC, atomspace = null) {
    // Simple term logic formula
    const strength = tvAB.strength * tvBC.strength;
    const confidence = Math.min(tvAB.confidence, tvBC.confidence) * 0.9;
    return new TruthValue(strength, confidence);
  }

  /**
   * Induction rule: A→B ⊢ B→A
   * Inductive inference with reduced confidence
   */
  static induction(tvAB, priorB = 0.5) {
    // Bayes rule approximation
    const strength = tvAB.strength * priorB;
    const confidence = tvAB.confidence * 0.8; // Reduced for induction
    return new TruthValue(strength, confidence);
  }

  /**
   * Abduction rule: B→C, A→C ⊢ A→B
   * Hypothesis generation
   */
  static abduction(tvBC, tvAC, priorB = 0.5) {
    const strength = (tvBC.strength * tvAC.strength) / Math.max(0.01, priorB);
    const confidence = Math.min(tvBC.confidence, tvAC.confidence) * 0.7;
    return new TruthValue(Math.min(1, strength), confidence);
  }

  /**
   * Revision rule: Combine two truth values for same statement
   */
  static revision(tv1, tv2) {
    const w1 = tv1.confidence;
    const w2 = tv2.confidence;
    const wSum = w1 + w2;
    
    if (wSum === 0) return new TruthValue(0.5, 0);
    
    const strength = (tv1.strength * w1 + tv2.strength * w2) / wSum;
    const confidence = Math.min(1, wSum);
    return new TruthValue(strength, confidence);
  }

  /**
   * Conjunction: P(A ∧ B)
   */
  static conjunction(tvA, tvB, independence = 0.8) {
    const strength = tvA.strength * tvB.strength;
    const confidence = Math.min(tvA.confidence, tvB.confidence) * independence;
    return new TruthValue(strength, confidence);
  }

  /**
   * Disjunction: P(A ∨ B)
   */
  static disjunction(tvA, tvB, independence = 0.8) {
    const strength = tvA.strength + tvB.strength - tvA.strength * tvB.strength;
    const confidence = Math.min(tvA.confidence, tvB.confidence) * independence;
    return new TruthValue(strength, confidence);
  }

  /**
   * Negation: P(¬A)
   */
  static negation(tv) {
    return new TruthValue(1 - tv.strength, tv.confidence);
  }

  /**
   * Modus ponens: A, A→B ⊢ B
   */
  static modusPonens(tvA, tvAB) {
    const strength = tvA.strength * tvAB.strength;
    const confidence = Math.min(tvA.confidence, tvAB.confidence) * 0.95;
    return new TruthValue(strength, confidence);
  }
}

/**
 * PLN Inference Engine
 */
class PLNEngine {
  constructor(atomspace, options = {}) {
    this.atomspace = atomspace;
    this.inferenceDepth = options.inferenceDepth || 3;
    this.minConfidence = options.minConfidence || 0.1;
    this.minStrength = options.minStrength || 0.01;
    this.maxInferences = options.maxInferences || 100;
    this.inferencesPerformed = 0;
  }

  /**
   * Perform forward chaining inference
   */
  forwardChain(maxIterations = 10) {
    const newInferences = [];
    this.inferencesPerformed = 0;

    for (let i = 0; i < maxIterations; i++) {
      const inferences = this._performInferenceStep();
      if (inferences.length === 0) break;
      newInferences.push(...inferences);
      
      if (this.inferencesPerformed >= this.maxInferences) break;
    }

    return newInferences;
  }

  /**
   * Perform one step of inference
   */
  _performInferenceStep() {
    const inferences = [];
    
    // Get all implication links
    const implications = this.atomspace.getAtomsByType(AtomType.IMPLICATION);
    
    // Try deduction: A→B, B→C ⊢ A→C
    for (let i = 0; i < implications.length; i++) {
      for (let j = 0; j < implications.length; j++) {
        if (i === j) continue;
        
        const ab = implications[i];
        const bc = implications[j];
        
        // Check if B matches (ab.outgoing[1] === bc.outgoing[0])
        if (ab.outgoing && bc.outgoing &&
            ab.outgoing.length === 2 && bc.outgoing.length === 2 &&
            ab.outgoing[1] === bc.outgoing[0]) {
          
          const inference = this._tryDeduction(ab, bc);
          if (inference) {
            inferences.push(inference);
            this.inferencesPerformed++;
          }
        }
      }
      
      if (this.inferencesPerformed >= this.maxInferences) break;
    }
    
    return inferences;
  }

  /**
   * Try to apply deduction rule
   */
  _tryDeduction(ab, bc) {
    if (!ab.truthValue || !bc.truthValue) return null;
    
    const tvAB = new TruthValue(ab.truthValue.strength, ab.truthValue.confidence);
    const tvBC = new TruthValue(bc.truthValue.strength, bc.truthValue.confidence);
    
    // Check minimum thresholds
    if (tvAB.confidence < this.minConfidence || tvBC.confidence < this.minConfidence) {
      return null;
    }
    
    const tvAC = PLNRules.deduction(tvAB, tvBC);
    
    if (tvAC.strength < this.minStrength || tvAC.confidence < this.minConfidence) {
      return null;
    }
    
    // Create new implication A→C if it doesn't exist or has lower confidence
    const a = ab.outgoing[0];
    const c = bc.outgoing[1];
    
    // Check if this inference already exists
    const existing = this.atomspace.getAtoms().find(atom =>
      atom.type === AtomType.IMPLICATION &&
      atom.outgoing && atom.outgoing.length === 2 &&
      atom.outgoing[0] === a && atom.outgoing[1] === c
    );
    
    if (existing) {
      // Update if new confidence is higher
      if (tvAC.confidence > existing.truthValue.confidence) {
        existing.truthValue = { strength: tvAC.strength, confidence: tvAC.confidence };
        return {
          type: 'deduction-update',
          atom: existing,
          rule: 'deduction',
          premises: [ab, bc],
          truthValue: tvAC,
        };
      }
      return null;
    }
    
    // Create new atom
    const newAtom = this.atomspace.addAtom(
      AtomType.IMPLICATION,
      `deduced_${a}_${c}`,
      [a, c],
      { strength: tvAC.strength, confidence: tvAC.confidence }
    );
    
    return {
      type: 'deduction-new',
      atom: newAtom,
      rule: 'deduction',
      premises: [ab, bc],
      truthValue: tvAC,
    };
  }

  /**
   * Query with probabilistic inference
   * Returns truth value for a query pattern
   */
  query(pattern) {
    // Simple pattern matching with truth values
    const matches = this.atomspace.getAtoms().filter(atom => {
      if (pattern.type && atom.type !== pattern.type) return false;
      if (pattern.name && !atom.name.includes(pattern.name)) return false;
      return true;
    });
    
    if (matches.length === 0) {
      return new TruthValue(0, 0);
    }
    
    // Combine truth values of all matches
    let combinedTV = matches[0].truthValue 
      ? new TruthValue(matches[0].truthValue.strength, matches[0].truthValue.confidence)
      : new TruthValue(0.5, 0);
    
    for (let i = 1; i < matches.length; i++) {
      const tv = matches[i].truthValue
        ? new TruthValue(matches[i].truthValue.strength, matches[i].truthValue.confidence)
        : new TruthValue(0.5, 0);
      combinedTV = PLNRules.revision(combinedTV, tv);
    }
    
    return combinedTV;
  }

  /**
   * Get inference statistics
   */
  getStats() {
    return {
      inferencesPerformed: this.inferencesPerformed,
      maxInferences: this.maxInferences,
      minConfidence: this.minConfidence,
      minStrength: this.minStrength,
      inferenceDepth: this.inferenceDepth,
    };
  }
}

module.exports = {
  TruthValue,
  PLNRules,
  PLNEngine,
};
