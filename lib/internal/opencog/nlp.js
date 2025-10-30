'use strict';

/**
 * NLP Integration - Natural Language Processing for OpenCog
 * 
 * Integrates NLP capabilities with AtomSpace for semantic understanding,
 * relationship extraction, and knowledge grounding.
 */

const { EventEmitter } = require('events');

/**
 * Linguistic relationship types for AtomSpace
 */
const LinguisticRelation = {
  SUBJECT: 'SUBJECT',
  PREDICATE: 'PREDICATE',
  OBJECT: 'OBJECT',
  MODIFIER: 'MODIFIER',
  DEPENDENCY: 'DEPENDENCY',
  SEMANTIC_ROLE: 'SEMANTIC_ROLE',
  WORD: 'WORD',
  LEMMA: 'LEMMA',
  POS_TAG: 'POS_TAG',
  NAMED_ENTITY: 'NAMED_ENTITY',
};

/**
 * NLPProcessor - Process natural language into AtomSpace structures
 */
class NLPProcessor extends EventEmitter {
  constructor(atomspace, options = {}) {
    super();
    
    this.atomspace = atomspace;
    this.vocabulary = new Map(); // word -> atom
    this.entities = new Map();   // entity -> atom
    this.relations = new Map();  // relation -> atoms
    
    // Configuration
    this.enablePOS = options.enablePOS !== false;
    this.enableNER = options.enableNER !== false;
    this.enableSemanticRoles = options.enableSemanticRoles !== false;
    this.minConfidence = options.minConfidence || 0.5;
    
    // Statistics
    this.stats = {
      sentencesProcessed: 0,
      wordsProcessed: 0,
      entitiesExtracted: 0,
      relationsExtracted: 0,
    };
  }

  /**
   * Process a sentence into AtomSpace
   */
  processSentence(sentence) {
    this.stats.sentencesProcessed++;
    
    // Tokenize
    const tokens = this._tokenize(sentence);
    this.stats.wordsProcessed += tokens.length;
    
    // Create atoms for words
    const wordAtoms = tokens.map(token => this._createWordAtom(token));
    
    // POS tagging (simplified)
    if (this.enablePOS) {
      this._posTag(wordAtoms, tokens);
    }
    
    // Named Entity Recognition (simplified)
    if (this.enableNER) {
      this._extractEntities(wordAtoms, tokens);
    }
    
    // Dependency parsing (simplified)
    const dependencies = this._parseDependencies(wordAtoms, tokens);
    
    // Semantic role labeling (simplified)
    if (this.enableSemanticRoles) {
      this._extractSemanticRoles(wordAtoms, tokens);
    }
    
    // Create sentence atom
    const sentenceAtom = this.atomspace.addAtom(
      'SENTENCE',
      sentence,
      wordAtoms,
      { strength: 1.0, confidence: 0.9 }
    );
    
    this.emit('sentence-processed', {
      sentence,
      tokens: tokens.length,
      entities: this.stats.entitiesExtracted,
      relations: dependencies.length,
    });
    
    return {
      sentence: sentenceAtom,
      words: wordAtoms,
      dependencies,
    };
  }

  /**
   * Extract semantic relationships from text
   */
  extractRelationships(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const relationships = [];
    
    for (const sentence of sentences) {
      const result = this.processSentence(sentence.trim());
      
      // Extract subject-verb-object triples (simplified)
      const triple = this._extractTriple(result.words);
      if (triple) {
        relationships.push(triple);
        this.stats.relationsExtracted++;
      }
    }
    
    return relationships;
  }

  /**
   * Query knowledge using natural language
   */
  query(question) {
    // Process the question
    const result = this.processSentence(question);
    
    // Identify query type
    const queryType = this._identifyQueryType(result.words);
    
    // Extract query parameters
    const parameters = this._extractQueryParameters(result.words);
    
    // Search atomspace
    const answers = this._searchKnowledge(queryType, parameters);
    
    return {
      question,
      queryType,
      parameters,
      answers,
    };
  }

  /**
   * Ground natural language concepts in AtomSpace
   */
  groundConcept(phrase) {
    const tokens = this._tokenize(phrase);
    const concepts = [];
    
    for (const token of tokens) {
      // Look up in vocabulary
      let atom = this.vocabulary.get(token.toLowerCase());
      
      if (!atom) {
        // Create new concept atom
        atom = this.atomspace.addAtom(
          'CONCEPT',
          token.toLowerCase(),
          [],
          { strength: 0.8, confidence: 0.5 }
        );
        this.vocabulary.set(token.toLowerCase(), atom);
      }
      
      concepts.push(atom);
    }
    
    return concepts;
  }

  /**
   * Calculate semantic similarity between phrases
   */
  similarity(phrase1, phrase2) {
    const concepts1 = this.groundConcept(phrase1);
    const concepts2 = this.groundConcept(phrase2);
    
    // Simple word overlap similarity
    const set1 = new Set(concepts1.map(c => c.name));
    const set2 = new Set(concepts2.map(c => c.name));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate text from AtomSpace structures
   */
  generate(atoms) {
    const words = [];
    
    for (const atom of atoms) {
      if (atom.type === LinguisticRelation.WORD || atom.type === 'CONCEPT') {
        words.push(atom.name);
      }
    }
    
    return words.join(' ');
  }

  /**
   * Get NLP statistics
   */
  getStats() {
    return {
      ...this.stats,
      vocabularySize: this.vocabulary.size,
      entitiesKnown: this.entities.size,
      relationsKnown: this.relations.size,
    };
  }

  /**
   * Private: Tokenize text
   */
  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  /**
   * Private: Create word atom
   */
  _createWordAtom(token) {
    let atom = this.vocabulary.get(token);
    
    if (!atom) {
      atom = this.atomspace.addAtom(
        LinguisticRelation.WORD,
        token,
        [],
        { strength: 1.0, confidence: 1.0 }
      );
      this.vocabulary.set(token, atom);
    }
    
    return atom;
  }

  /**
   * Private: POS tagging (simplified)
   */
  _posTag(wordAtoms, tokens) {
    // Very simplified POS tagging
    const commonNouns = ['cat', 'dog', 'house', 'car', 'person', 'system', 'agent'];
    const commonVerbs = ['is', 'are', 'was', 'were', 'run', 'walk', 'execute'];
    const commonAdj = ['big', 'small', 'fast', 'slow', 'good', 'bad', 'autonomous'];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let pos = 'NOUN'; // default
      
      if (commonVerbs.includes(token)) pos = 'VERB';
      else if (commonAdj.includes(token)) pos = 'ADJ';
      
      const posAtom = this.atomspace.addAtom(
        LinguisticRelation.POS_TAG,
        `${token}_${pos}`,
        [wordAtoms[i]],
        { strength: 0.9, confidence: 0.8 }
      );
    }
  }

  /**
   * Private: Named Entity Recognition (simplified)
   */
  _extractEntities(wordAtoms, tokens) {
    // Very simplified NER - just capitalize words
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // If starts with capital, might be named entity
      if (token[0] === token[0].toUpperCase()) {
        const entityAtom = this.atomspace.addAtom(
          LinguisticRelation.NAMED_ENTITY,
          token,
          [wordAtoms[i]],
          { strength: 0.8, confidence: 0.7 }
        );
        
        this.entities.set(token, entityAtom);
        this.stats.entitiesExtracted++;
      }
    }
  }

  /**
   * Private: Dependency parsing (simplified)
   */
  _parseDependencies(wordAtoms, tokens) {
    const dependencies = [];
    
    // Very simplified: adjacent word dependencies
    for (let i = 0; i < wordAtoms.length - 1; i++) {
      const dep = this.atomspace.addAtom(
        LinguisticRelation.DEPENDENCY,
        `${tokens[i]}_${tokens[i + 1]}`,
        [wordAtoms[i], wordAtoms[i + 1]],
        { strength: 0.7, confidence: 0.6 }
      );
      dependencies.push(dep);
    }
    
    return dependencies;
  }

  /**
   * Private: Semantic role labeling (simplified)
   */
  _extractSemanticRoles(wordAtoms, tokens) {
    // Very simplified: first word is subject, middle is predicate, last is object
    if (tokens.length >= 3) {
      this.atomspace.addAtom(
        LinguisticRelation.SUBJECT,
        `subject_${tokens[0]}`,
        [wordAtoms[0]],
        { strength: 0.8, confidence: 0.7 }
      );
      
      const mid = Math.floor(tokens.length / 2);
      this.atomspace.addAtom(
        LinguisticRelation.PREDICATE,
        `predicate_${tokens[mid]}`,
        [wordAtoms[mid]],
        { strength: 0.8, confidence: 0.7 }
      );
      
      this.atomspace.addAtom(
        LinguisticRelation.OBJECT,
        `object_${tokens[tokens.length - 1]}`,
        [wordAtoms[tokens.length - 1]],
        { strength: 0.8, confidence: 0.7 }
      );
    }
  }

  /**
   * Private: Extract subject-verb-object triple
   */
  _extractTriple(wordAtoms) {
    if (wordAtoms.length < 3) return null;
    
    // Very simplified: assume first word is subject, middle is verb, last is object
    return {
      subject: wordAtoms[0],
      predicate: wordAtoms[Math.floor(wordAtoms.length / 2)],
      object: wordAtoms[wordAtoms.length - 1],
    };
  }

  /**
   * Private: Identify query type
   */
  _identifyQueryType(wordAtoms) {
    const firstWord = wordAtoms[0]?.name.toLowerCase();
    
    const questionWords = {
      'what': 'definition',
      'who': 'entity',
      'where': 'location',
      'when': 'time',
      'why': 'reason',
      'how': 'method',
    };
    
    return questionWords[firstWord] || 'general';
  }

  /**
   * Private: Extract query parameters
   */
  _extractQueryParameters(wordAtoms) {
    // Extract key concepts from question (skip question words)
    return wordAtoms
      .slice(1)
      .filter(atom => atom.name.length > 2)
      .map(atom => atom.name);
  }

  /**
   * Private: Search knowledge base
   */
  _searchKnowledge(queryType, parameters) {
    const results = [];
    
    for (const param of parameters) {
      // Find atoms related to the parameter
      const atoms = this.atomspace.getAtomsByName(param);
      
      for (const atom of atoms) {
        // Get related atoms through incoming links
        for (const link of atom.incoming) {
          results.push({
            type: link.type,
            atoms: link.outgoing,
            confidence: link.truthValue.confidence,
          });
        }
      }
    }
    
    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);
    
    return results.slice(0, 10); // Top 10 results
  }
}

module.exports = NLPProcessor;
module.exports.LinguisticRelation = LinguisticRelation;
