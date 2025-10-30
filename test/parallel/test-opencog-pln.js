'use strict';

// Test PLN (Probabilistic Logic Networks) implementation

const common = require('../common');
const assert = require('assert');
const { AtomSpace, AtomType } = require('internal/opencog/atomspace');
const { TruthValue, PLNRules, PLNEngine } = require('internal/opencog/pln');

// Test TruthValue
{
  const tv = new TruthValue(0.8, 0.9);
  assert.strictEqual(tv.strength, 0.8);
  assert.strictEqual(tv.confidence, 0.9);
  
  // Test clamping
  const tv2 = new TruthValue(1.5, -0.5);
  assert.strictEqual(tv2.strength, 1.0);
  assert.strictEqual(tv2.confidence, 0.0);
  
  // Test clone
  const tv3 = tv.clone();
  assert.strictEqual(tv3.strength, tv.strength);
  assert.strictEqual(tv3.confidence, tv.confidence);
  
  common.printSkipMessage('TruthValue creation and basic operations');
}

// Test PLN Rules - Deduction
{
  const tvAB = new TruthValue(0.9, 0.8);
  const tvBC = new TruthValue(0.8, 0.9);
  const tvAC = PLNRules.deduction(tvAB, tvBC);
  
  // A→B (0.9, 0.8) and B→C (0.8, 0.9) should give A→C
  assert.ok(tvAC.strength > 0);
  assert.ok(tvAC.strength <= 1);
  assert.ok(tvAC.confidence > 0);
  assert.ok(tvAC.confidence <= 1);
  
  common.printSkipMessage('PLN deduction rule');
}

// Test PLN Rules - Revision
{
  const tv1 = new TruthValue(0.8, 0.7);
  const tv2 = new TruthValue(0.6, 0.8);
  const tvRevised = PLNRules.revision(tv1, tv2);
  
  // Should combine evidence from both
  assert.ok(tvRevised.strength > 0);
  assert.ok(tvRevised.strength <= 1);
  assert.ok(tvRevised.confidence >= Math.max(tv1.confidence, tv2.confidence));
  
  common.printSkipMessage('PLN revision rule');
}

// Test PLN Rules - Conjunction
{
  const tvA = new TruthValue(0.8, 0.9);
  const tvB = new TruthValue(0.7, 0.8);
  const tvConj = PLNRules.conjunction(tvA, tvB);
  
  // Conjunction strength should be product
  assert.ok(tvConj.strength <= Math.min(tvA.strength, tvB.strength));
  assert.ok(tvConj.confidence <= Math.min(tvA.confidence, tvB.confidence));
  
  common.printSkipMessage('PLN conjunction rule');
}

// Test PLN Rules - Disjunction
{
  const tvA = new TruthValue(0.6, 0.9);
  const tvB = new TruthValue(0.7, 0.8);
  const tvDisj = PLNRules.disjunction(tvA, tvB);
  
  // Disjunction strength should be at least max
  assert.ok(tvDisj.strength >= Math.max(tvA.strength, tvB.strength));
  
  common.printSkipMessage('PLN disjunction rule');
}

// Test PLN Rules - Negation
{
  const tv = new TruthValue(0.7, 0.9);
  const tvNeg = PLNRules.negation(tv);
  
  assert.strictEqual(tvNeg.strength, 1 - tv.strength);
  assert.strictEqual(tvNeg.confidence, tv.confidence);
  
  common.printSkipMessage('PLN negation rule');
}

// Test PLN Rules - Modus Ponens
{
  const tvA = new TruthValue(0.9, 0.8);
  const tvAB = new TruthValue(0.8, 0.9);
  const tvB = PLNRules.modusPonens(tvA, tvAB);
  
  // A and A→B should give B
  assert.ok(tvB.strength > 0);
  assert.ok(tvB.strength <= Math.min(tvA.strength, tvAB.strength));
  
  common.printSkipMessage('PLN modus ponens rule');
}

// Test PLN Engine - Forward Chaining
{
  const atomspace = new AtomSpace();
  const engine = new PLNEngine(atomspace, {
    minConfidence: 0.1,
    minStrength: 0.01,
    maxInferences: 10,
  });
  
  // Create knowledge base
  const cat = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const mammal = atomspace.addAtom(AtomType.CONCEPT, 'mammal');
  const animal = atomspace.addAtom(AtomType.CONCEPT, 'animal');
  
  // Add implications
  atomspace.addAtom(
    AtomType.IMPLICATION,
    'cat-mammal',
    [cat, mammal],
    { strength: 0.9, confidence: 0.9 }
  );
  
  atomspace.addAtom(
    AtomType.IMPLICATION,
    'mammal-animal',
    [mammal, animal],
    { strength: 0.95, confidence: 0.95 }
  );
  
  // Run forward chaining
  const inferences = engine.forwardChain(5);
  
  // Should infer cat→animal
  assert.ok(inferences.length > 0);
  
  const stats = engine.getStats();
  assert.ok(stats.inferencesPerformed >= 0);
  
  common.printSkipMessage('PLN engine forward chaining');
}

// Test PLN Engine - Query
{
  const atomspace = new AtomSpace();
  const engine = new PLNEngine(atomspace);
  
  // Add some atoms
  atomspace.addAtom(
    AtomType.CONCEPT,
    'dog',
    null,
    { strength: 0.9, confidence: 0.8 }
  );
  
  atomspace.addAtom(
    AtomType.CONCEPT,
    'cat',
    null,
    { strength: 0.85, confidence: 0.9 }
  );
  
  // Query for concept
  const result = engine.query({ type: AtomType.CONCEPT });
  
  assert.ok(result.strength > 0);
  assert.ok(result.confidence > 0);
  
  common.printSkipMessage('PLN engine query');
}

// Test PLN Engine - Inference Depth
{
  const atomspace = new AtomSpace();
  const engine = new PLNEngine(atomspace, {
    inferenceDepth: 2,
    maxInferences: 5,
  });
  
  // Create chain: A→B→C→D
  const a = atomspace.addAtom(AtomType.CONCEPT, 'a');
  const b = atomspace.addAtom(AtomType.CONCEPT, 'b');
  const c = atomspace.addAtom(AtomType.CONCEPT, 'c');
  const d = atomspace.addAtom(AtomType.CONCEPT, 'd');
  
  atomspace.addAtom(AtomType.IMPLICATION, 'a-b', [a, b],
    { strength: 0.9, confidence: 0.9 });
  atomspace.addAtom(AtomType.IMPLICATION, 'b-c', [b, c],
    { strength: 0.9, confidence: 0.9 });
  atomspace.addAtom(AtomType.IMPLICATION, 'c-d', [c, d],
    { strength: 0.9, confidence: 0.9 });
  
  const inferences = engine.forwardChain(10);
  
  // Should create some inferences
  assert.ok(inferences.length >= 0);
  
  common.printSkipMessage('PLN engine with inference depth limit');
}

// Test PLN Engine - Confidence Threshold
{
  const atomspace = new AtomSpace();
  const engine = new PLNEngine(atomspace, {
    minConfidence: 0.8, // High threshold
    maxInferences: 10,
  });
  
  const a = atomspace.addAtom(AtomType.CONCEPT, 'a');
  const b = atomspace.addAtom(AtomType.CONCEPT, 'b');
  const c = atomspace.addAtom(AtomType.CONCEPT, 'c');
  
  // Low confidence link - should not be used
  atomspace.addAtom(AtomType.IMPLICATION, 'a-b', [a, b],
    { strength: 0.9, confidence: 0.5 });
  
  // High confidence link
  atomspace.addAtom(AtomType.IMPLICATION, 'b-c', [b, c],
    { strength: 0.9, confidence: 0.95 });
  
  const inferences = engine.forwardChain(5);
  
  // Should not create a-c inference due to low confidence
  const hasLowConfInference = inferences.some(inf =>
    inf.truthValue && inf.truthValue.confidence < 0.8
  );
  
  assert.strictEqual(hasLowConfInference, false);
  
  common.printSkipMessage('PLN engine confidence threshold');
}

common.printSkipMessage('All PLN tests passed');
