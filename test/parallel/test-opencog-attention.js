'use strict';

require('../common');
const assert = require('assert');
const { AttentionBank } = require('internal/opencog/attention');
const { AtomSpace, AtomType } = require('internal/opencog/atomspace');

// Test AttentionBank creation
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  assert.ok(attentionBank instanceof AttentionBank);
  assert.strictEqual(attentionBank.totalSTI, 0);
  assert.strictEqual(attentionBank.totalLTI, 0);
}

// Test stimulate
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  attentionBank.stimulate(atom.id, 50);
  assert.strictEqual(atom.attention.sti, 50);
  assert.strictEqual(attentionBank.totalSTI, 50);
}

// Test STI bounds
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace, { minSTI: -100, maxSTI: 100 });
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  attentionBank.stimulate(atom.id, 200);
  assert.strictEqual(atom.attention.sti, 100);
  
  attentionBank.stimulate(atom.id, -300);
  assert.strictEqual(atom.attention.sti, -100);
}

// Test setLTI
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  attentionBank.setLTI(atom.id, 75);
  assert.strictEqual(atom.attention.lti, 75);
  assert.strictEqual(attentionBank.totalLTI, 75);
}

// Test setVLTI
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  attentionBank.setVLTI(atom.id, true);
  assert.strictEqual(atom.attention.vlti, true);
}

// Test getAttentionalFocus
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  const atom1 = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const atom2 = atomspace.addAtom(AtomType.CONCEPT, 'dog');
  const atom3 = atomspace.addAtom(AtomType.CONCEPT, 'bird');
  
  atom1.attention.sti = 100;
  atom2.attention.sti = 50;
  atom3.attention.sti = 75;
  
  const focus = attentionBank.getAttentionalFocus(2);
  assert.strictEqual(focus.length, 2);
  assert.strictEqual(focus[0], atom1);
  assert.strictEqual(focus[1], atom3);
}

// Test decaySTI
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace, { decayRate: 0.9, rentEnabled: true });
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  atom.attention.sti = 100;
  attentionBank.totalSTI = 100;
  
  attentionBank.decaySTI();
  assert.ok(atom.attention.sti < 100);
  assert.ok(atom.attention.sti >= 90);
}

// Test normalizeSTI
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace, { targetSTI: 1000 });
  
  const atom1 = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const atom2 = atomspace.addAtom(AtomType.CONCEPT, 'dog');
  
  atom1.attention.sti = 50;
  atom2.attention.sti = 50;
  attentionBank.totalSTI = 100;
  
  attentionBank.normalizeSTI();
  assert.strictEqual(attentionBank.totalSTI, 1000);
  assert.strictEqual(atom1.attention.sti, 500);
  assert.strictEqual(atom2.attention.sti, 500);
}

// Test spreadImportance
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  const cat = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  const animal = atomspace.addAtom(AtomType.CONCEPT, 'animal');
  const link = atomspace.addAtom(AtomType.INHERITANCE, 'cat-animal', [cat, animal]);
  
  cat.attention.sti = 100;
  
  const affected = attentionBank.spreadImportance(0.1);
  assert.ok(affected >= 0);
  assert.ok(animal.attention.sti > 0);
}

// Test getStats
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  atom.attention.sti = 100;
  
  const stats = attentionBank.getStats();
  assert.strictEqual(stats.totalAtoms, 1);
  assert.ok(stats.avgSTI >= 0);
}

// Test reset
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  atom.attention.sti = 100;
  atom.attention.lti = 50;
  attentionBank.totalSTI = 100;
  attentionBank.totalLTI = 50;
  
  attentionBank.reset();
  assert.strictEqual(atom.attention.sti, 0);
  assert.strictEqual(atom.attention.lti, 0);
  assert.strictEqual(attentionBank.totalSTI, 0);
  assert.strictEqual(attentionBank.totalLTI, 0);
}

// Test event emission
{
  const atomspace = new AtomSpace();
  const attentionBank = new AttentionBank(atomspace);
  const atom = atomspace.addAtom(AtomType.CONCEPT, 'cat');
  
  let stimulated = false;
  attentionBank.on('stimulated', () => { stimulated = true; });
  
  attentionBank.stimulate(atom.id, 50);
  assert.ok(stimulated);
}
