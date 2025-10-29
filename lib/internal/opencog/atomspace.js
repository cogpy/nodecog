'use strict';

const { EventEmitter } = require('events');

/**
 * Atom types for the hypergraph
 */
const AtomType = {
  NODE: 'NODE',
  LINK: 'LINK',
  CONCEPT: 'CONCEPT',
  PREDICATE: 'PREDICATE',
  VARIABLE: 'VARIABLE',
  INHERITANCE: 'INHERITANCE',
  SIMILARITY: 'SIMILARITY',
  EVALUATION: 'EVALUATION',
  EXECUTION: 'EXECUTION',
  IMPLICATION: 'IMPLICATION',
};

/**
 * Atom - Basic unit in the AtomSpace hypergraph
 */
class Atom {
  constructor(type, name, outgoing = [], truthValue = { strength: 1.0, confidence: 1.0 }) {
    this.id = Atom.generateId();
    this.type = type;
    this.name = name;
    this.outgoing = outgoing; // Array of outgoing atoms (for links)
    this.incoming = new Set(); // Set of incoming atoms
    this.truthValue = truthValue;
    this.attention = { sti: 0, lti: 0, vlti: false }; // Short-term, long-term importance, very long-term
    this.timestamp = Date.now();
  }

  static _idCounter = 0;
  static generateId() {
    return `atom_${++Atom._idCounter}_${Date.now()}`;
  }

  /**
   * Get the string representation of the atom
   */
  toString() {
    if (this.outgoing.length === 0) {
      return `(${this.type} "${this.name}")`;
    }
    const outgoingStr = this.outgoing.map(a => a.toString()).join(' ');
    return `(${this.type} ${outgoingStr})`;
  }
}

/**
 * AtomSpace - Hypergraph knowledge representation system
 * Inspired by OpenCog's AtomSpace
 */
class AtomSpace extends EventEmitter {
  constructor(options = {}) {
    super();
    this.atoms = new Map(); // id -> Atom
    this.index = {
      byType: new Map(), // type -> Set of atom ids
      byName: new Map(), // name -> Set of atom ids
      byPattern: new Map(), // pattern hash -> Set of atom ids
    };
    this.maxSize = options.maxSize || 100000;
    this.forgettingEnabled = options.forgettingEnabled ?? true;
  }

  /**
   * Add an atom to the atomspace
   */
  addAtom(type, name, outgoing = [], truthValue) {
    // Check if atom already exists
    const existing = this._findExisting(type, name, outgoing);
    if (existing) {
      // Merge truth values
      if (truthValue) {
        existing.truthValue = this._mergeTruthValues(existing.truthValue, truthValue);
      }
      existing.timestamp = Date.now();
      this.emit('atom-updated', existing);
      return existing;
    }

    const atom = new Atom(type, name, outgoing, truthValue);
    this.atoms.set(atom.id, atom);

    // Update indices
    if (!this.index.byType.has(type)) {
      this.index.byType.set(type, new Set());
    }
    this.index.byType.get(type).add(atom.id);

    if (name) {
      if (!this.index.byName.has(name)) {
        this.index.byName.set(name, new Set());
      }
      this.index.byName.get(name).add(atom.id);
    }

    // Update incoming sets for outgoing atoms
    for (const outAtom of outgoing) {
      outAtom.incoming.add(atom);
    }

    this.emit('atom-added', atom);

    // Check size limits
    if (this.atoms.size > this.maxSize && this.forgettingEnabled) {
      this._forget();
    }

    return atom;
  }

  /**
   * Get an atom by ID
   */
  getAtom(id) {
    return this.atoms.get(id);
  }

  /**
   * Remove an atom from the atomspace
   */
  removeAtom(id) {
    const atom = this.atoms.get(id);
    if (!atom) return false;

    // Remove from indices
    this.index.byType.get(atom.type)?.delete(id);
    this.index.byName.get(atom.name)?.delete(id);

    // Update incoming sets
    for (const outAtom of atom.outgoing) {
      outAtom.incoming.delete(atom);
    }

    // Remove incoming links
    for (const inAtom of atom.incoming) {
      this.removeAtom(inAtom.id);
    }

    this.atoms.delete(id);
    this.emit('atom-removed', atom);
    return true;
  }

  /**
   * Query atoms by type
   */
  getAtomsByType(type) {
    const ids = this.index.byType.get(type) || new Set();
    return Array.from(ids).map(id => this.atoms.get(id)).filter(Boolean);
  }

  /**
   * Query atoms by name
   */
  getAtomsByName(name) {
    const ids = this.index.byName.get(name) || new Set();
    return Array.from(ids).map(id => this.atoms.get(id)).filter(Boolean);
  }

  /**
   * Pattern matching - find atoms matching a pattern
   */
  patternMatch(pattern) {
    const results = [];
    
    for (const atom of this.atoms.values()) {
      if (this._matchPattern(atom, pattern)) {
        results.push(atom);
      }
    }
    
    return results;
  }

  /**
   * Get all atoms in the atomspace
   */
  getAllAtoms() {
    return Array.from(this.atoms.values());
  }

  /**
   * Get atoms with high attention values
   */
  getAttentionalFocus(limit = 10) {
    return Array.from(this.atoms.values())
      .sort((a, b) => b.attention.sti - a.attention.sti)
      .slice(0, limit);
  }

  /**
   * Clear the atomspace
   */
  clear() {
    this.atoms.clear();
    this.index.byType.clear();
    this.index.byName.clear();
    this.index.byPattern.clear();
    this.emit('cleared');
  }

  /**
   * Private: Find existing atom
   */
  _findExisting(type, name, outgoing) {
    const candidates = this.getAtomsByName(name);
    return candidates.find(atom => 
      atom.type === type && 
      atom.outgoing.length === outgoing.length &&
      atom.outgoing.every((a, i) => a.id === outgoing[i]?.id)
    );
  }

  /**
   * Private: Merge truth values
   */
  _mergeTruthValues(tv1, tv2) {
    // Simple averaging for now
    return {
      strength: (tv1.strength + tv2.strength) / 2,
      confidence: Math.max(tv1.confidence, tv2.confidence),
    };
  }

  /**
   * Private: Pattern matching helper
   */
  _matchPattern(atom, pattern) {
    if (pattern.type && atom.type !== pattern.type) return false;
    if (pattern.name && atom.name !== pattern.name) return false;
    if (pattern.truthValueMin && atom.truthValue.strength < pattern.truthValueMin) return false;
    if (pattern.attentionMin && atom.attention.sti < pattern.attentionMin) return false;
    return true;
  }

  /**
   * Private: Forget low-attention atoms to manage memory
   */
  _forget() {
    const atoms = Array.from(this.atoms.values());
    const toRemove = atoms
      .sort((a, b) => a.attention.sti - b.attention.sti)
      .slice(0, Math.floor(this.atoms.size * 0.1)); // Remove bottom 10%

    for (const atom of toRemove) {
      if (!atom.attention.vlti) { // Don't forget very long-term important atoms
        this.removeAtom(atom.id);
      }
    }

    this.emit('forgotten', toRemove.length);
  }
}

module.exports = AtomSpace;
module.exports.AtomType = AtomType;
module.exports.Atom = Atom;
