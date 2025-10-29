'use strict';

const { EventEmitter } = require('events');

/**
 * AttentionBank - Manages attention allocation in the cognitive system
 * 
 * Implements Economic Attention Networks (ECAN) inspired by OpenCog
 * Manages Short-Term Importance (STI) and Long-Term Importance (LTI)
 */
class AttentionBank extends EventEmitter {
  constructor(atomspace, options = {}) {
    super();
    this.atomspace = atomspace;
    this.totalSTI = 0;
    this.totalLTI = 0;
    this.targetSTI = options.targetSTI || 10000;
    this.targetLTI = options.targetLTI || 10000;
    this.decayRate = options.decayRate || 0.9;
    this.minSTI = options.minSTI || -1000;
    this.maxSTI = options.maxSTI || 1000;
    this.attentionalFocusSize = options.attentionalFocusSize || 100;
    this.rentEnabled = options.rentEnabled ?? true;
  }

  /**
   * Stimulate an atom - increase its STI
   */
  stimulate(atomId, amount = 10) {
    const atom = this.atomspace.getAtom(atomId);
    if (!atom) return false;

    const oldSTI = atom.attention.sti;
    atom.attention.sti = Math.min(
      this.maxSTI,
      Math.max(this.minSTI, atom.attention.sti + amount)
    );
    
    this.totalSTI += (atom.attention.sti - oldSTI);
    this.emit('stimulated', { atomId, amount, newSTI: atom.attention.sti });
    
    return true;
  }

  /**
   * Set atom's long-term importance
   */
  setLTI(atomId, lti) {
    const atom = this.atomspace.getAtom(atomId);
    if (!atom) return false;

    const oldLTI = atom.attention.lti;
    atom.attention.lti = lti;
    this.totalLTI += (lti - oldLTI);
    
    this.emit('lti-changed', { atomId, oldLTI, newLTI: lti });
    return true;
  }

  /**
   * Mark atom as very long-term important (won't be forgotten)
   */
  setVLTI(atomId, vlti = true) {
    const atom = this.atomspace.getAtom(atomId);
    if (!atom) return false;

    atom.attention.vlti = vlti;
    this.emit('vlti-changed', { atomId, vlti });
    return true;
  }

  /**
   * Get the attentional focus - atoms with highest STI
   */
  getAttentionalFocus(limit) {
    return this.atomspace.getAttentionalFocus(limit || this.attentionalFocusSize);
  }

  /**
   * Decay all STI values (attention spreading and rent)
   */
  decaySTI() {
    const atoms = this.atomspace.getAllAtoms();
    let totalDecay = 0;

    for (const atom of atoms) {
      if (this.rentEnabled && atom.attention.sti > 0) {
        const rent = atom.attention.sti * (1 - this.decayRate);
        atom.attention.sti = Math.max(0, atom.attention.sti - rent);
        totalDecay += rent;
      }
    }

    this.totalSTI -= totalDecay;
    this.emit('sti-decayed', { totalDecay, atomsAffected: atoms.length });
    
    return totalDecay;
  }

  /**
   * Normalize STI to maintain economy
   */
  normalizeSTI() {
    if (this.totalSTI === 0 || this.totalSTI === this.targetSTI) return;

    const scaleFactor = this.targetSTI / this.totalSTI;
    const atoms = this.atomspace.getAllAtoms();

    for (const atom of atoms) {
      atom.attention.sti *= scaleFactor;
    }

    this.totalSTI = this.targetSTI;
    this.emit('sti-normalized', { scaleFactor });
  }

  /**
   * Normalize LTI to maintain economy
   */
  normalizeLTI() {
    if (this.totalLTI === 0 || this.totalLTI === this.targetLTI) return;

    const scaleFactor = this.targetLTI / this.totalLTI;
    const atoms = this.atomspace.getAllAtoms();

    for (const atom of atoms) {
      atom.attention.lti *= scaleFactor;
    }

    this.totalLTI = this.targetLTI;
    this.emit('lti-normalized', { scaleFactor });
  }

  /**
   * Update attention values based on usage
   */
  updateAttention(atomId, accessed = true) {
    if (accessed) {
      this.stimulate(atomId, 5);
    }
  }

  /**
   * Spread importance through the hypergraph
   */
  spreadImportance(diffusionFactor = 0.1) {
    const atoms = this.atomspace.getAttentionalFocus(50);
    const updates = new Map();

    for (const atom of atoms) {
      const spreadAmount = atom.attention.sti * diffusionFactor;
      
      // Spread to outgoing atoms
      for (const outAtom of atom.outgoing) {
        const current = updates.get(outAtom.id) || 0;
        updates.set(outAtom.id, current + spreadAmount);
      }
      
      // Spread to incoming atoms (less)
      for (const inAtom of atom.incoming) {
        const current = updates.get(inAtom.id) || 0;
        updates.set(inAtom.id, current + spreadAmount * 0.5);
      }
    }

    // Apply updates
    for (const [atomId, amount] of updates) {
      this.stimulate(atomId, amount);
    }

    this.emit('importance-spread', { atomsAffected: updates.size });
    return updates.size;
  }

  /**
   * Get attention statistics
   */
  getStats() {
    const atoms = this.atomspace.getAllAtoms();
    const focus = this.getAttentionalFocus(10);
    
    return {
      totalAtoms: atoms.length,
      totalSTI: this.totalSTI,
      totalLTI: this.totalLTI,
      targetSTI: this.targetSTI,
      targetLTI: this.targetLTI,
      focusSize: focus.length,
      avgSTI: atoms.length > 0 ? this.totalSTI / atoms.length : 0,
      avgLTI: atoms.length > 0 ? this.totalLTI / atoms.length : 0,
      topAtoms: focus.slice(0, 5).map(a => ({
        id: a.id,
        name: a.name,
        sti: a.attention.sti,
        lti: a.attention.lti,
      })),
    };
  }

  /**
   * Reset all attention values
   */
  reset() {
    const atoms = this.atomspace.getAllAtoms();
    
    for (const atom of atoms) {
      atom.attention.sti = 0;
      atom.attention.lti = 0;
      atom.attention.vlti = false;
    }
    
    this.totalSTI = 0;
    this.totalLTI = 0;
    this.emit('reset');
  }
}

module.exports = AttentionBank;
