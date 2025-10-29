'use strict';

require('../common');
const assert = require('assert');
const { AtomSpace, AtomType } = require('internal/opencog/atomspace');

// Test AtomSpace creation
{
  const atomspace = new AtomSpace();
  assert.ok(atomspace instanceof AtomSpace);
  assert.strictEqual(atomspace.atoms.size, 0);
}

// Test adding atoms
{
  const atomspace = new AtomSpace();
  const atom1 = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const atom2 = atomspace.addAtom(AtomType.CONCEPT, 'dog');
  
  assert.strictEqual(atomspace.atoms.size, 2);
  assert.strictEqual(atom1.type, AtomType.CONCEPT);
  assert.strictEqual(atom1.name, 'cat');
  assert.strictEqual(atom2.name, 'dog');
}

// Test atom deduplication
{
  const atomspace = new AtomSpace();
  const atom1 = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const atom2 = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  assert.strictEqual(atomspace.atoms.size, 1);
  assert.strictEqual(atom1.id, atom2.id);
}

// Test link atoms
{
  const atomspace = new AtomSpace();
  const cat = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const animal = atomspace.addAtom(AtomType.CONCEPT, 'animal');
  const inheritance = atomspace.addAtom(AtomType.INHERITANCE, 'cat-animal', [cat, animal]);
  
  assert.strictEqual(atomspace.atoms.size, 3);
  assert.strictEqual(inheritance.outgoing.length, 2);
  assert.strictEqual(inheritance.outgoing[0], cat);
  assert.strictEqual(inheritance.outgoing[1], animal);
  assert.ok(cat.incoming.has(inheritance));
  assert.ok(animal.incoming.has(inheritance));
}

// Test query by type
{
  const atomspace = new AtomSpace();
  atomspace.addAtom(AtomType.CONCEPT, 'cat');
  atomspace.addAtom(AtomType.CONCEPT, 'dog');
  atomspace.addAtom(AtomType.PREDICATE, 'likes');
  
  const concepts = atomspace.getAtomsByType(AtomType.CONCEPT);
  const predicates = atomspace.getAtomsByType(AtomType.PREDICATE);
  
  assert.strictEqual(concepts.length, 2);
  assert.strictEqual(predicates.length, 1);
}

// Test query by name
{
  const atomspace = new AtomSpace();
  atomspace.addAtom(AtomType.CONCEPT, 'cat');
  atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  const atoms = atomspace.getAtomsByName('cat');
  assert.strictEqual(atoms.length, 1);
}

// Test truth values
{
  const atomspace = new AtomSpace();
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat', [], { strength: 0.8, confidence: 0.9 });
  
  assert.strictEqual(atom.truthValue.strength, 0.8);
  assert.strictEqual(atom.truthValue.confidence, 0.9);
}

// Test attention values
{
  const atomspace = new AtomSpace();
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  atom.attention.sti = 100;
  atom.attention.lti = 50;
  
  assert.strictEqual(atom.attention.sti, 100);
  assert.strictEqual(atom.attention.lti, 50);
}

// Test getAttentionalFocus
{
  const atomspace = new AtomSpace();
  const atom1 = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const atom2 = atomspace.addAtom(AtomType.CONCEPT, 'dog');
  const atom3 = atomspace.addAtom(AtomType.CONCEPT, 'bird');
  
  atom1.attention.sti = 100;
  atom2.attention.sti = 50;
  atom3.attention.sti = 75;
  
  const focus = atomspace.getAttentionalFocus(2);
  assert.strictEqual(focus.length, 2);
  assert.strictEqual(focus[0], atom1);
  assert.strictEqual(focus[1], atom3);
}

// Test removeAtom
{
  const atomspace = new AtomSpace();
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  assert.strictEqual(atomspace.atoms.size, 1);
  atomspace.removeAtom(atom.id);
  assert.strictEqual(atomspace.atoms.size, 0);
}

// Test clear
{
  const atomspace = new AtomSpace();
  atomspace.addAtom(AtomType.CONCEPT, 'cat');
  atomspace.addAtom(AtomType.CONCEPT, 'dog');
  
  assert.strictEqual(atomspace.atoms.size, 2);
  atomspace.clear();
  assert.strictEqual(atomspace.atoms.size, 0);
}

// Test pattern matching
{
  const atomspace = new AtomSpace();
  atomspace.addAtom(AtomType.CONCEPT, 'cat', [], { strength: 0.9, confidence: 0.8 });
  atomspace.addAtom(AtomType.CONCEPT, 'dog', [], { strength: 0.5, confidence: 0.8 });
  
  const results = atomspace.patternMatch({ type: AtomType.CONCEPT, truthValueMin: 0.8 });
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].name, 'cat');
}

// Test event emission
{
  const atomspace = new AtomSpace();
  let atomAdded = false;
  
  atomspace.on('atom-added', () => {
    atomAdded = true;
  });
  
  atomspace.addAtom(AtomType.CONCEPT, 'cat');
  assert.ok(atomAdded);
}

// Test forgetting mechanism
{
  const atomspace = new AtomSpace({ maxSize: 5, forgettingEnabled: true });
  
  for (let i = 0; i < 10; i++) {
    const atom = atomspace.addAtom(AtomType.CONCEPT, `concept${i}`);
    atom.attention.sti = i; // Incrementing STI
  }
  
  assert.ok(atomspace.atoms.size <= 5);
}
