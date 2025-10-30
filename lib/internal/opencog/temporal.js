'use strict';

// Temporal Reasoning System
// Handles time-based relationships and temporal inference

const { AtomType } = require('./atomspace');

/**
 * Temporal atom types
 */
const TemporalAtomType = {
  TEMPORAL_EVENT: 'TEMPORAL_EVENT',
  TEMPORAL_INTERVAL: 'TEMPORAL_INTERVAL',
  TEMPORAL_POINT: 'TEMPORAL_POINT',
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  DURING: 'DURING',
  OVERLAPS: 'OVERLAPS',
  SIMULTANEOUS: 'SIMULTANEOUS',
};

/**
 * Represents a point in time
 */
class TemporalPoint {
  constructor(timestamp) {
    this.timestamp = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  }

  isBefore(other) {
    return this.timestamp < other.timestamp;
  }

  isAfter(other) {
    return this.timestamp > other.timestamp;
  }

  equals(other) {
    return this.timestamp === other.timestamp;
  }

  toString() {
    return new Date(this.timestamp).toISOString();
  }
}

/**
 * Represents a time interval
 */
class TemporalInterval {
  constructor(start, end) {
    this.start = start instanceof TemporalPoint ? start : new TemporalPoint(start);
    this.end = end instanceof TemporalPoint ? end : new TemporalPoint(end);
    
    if (this.start.timestamp > this.end.timestamp) {
      throw new Error('Start time must be before or equal to end time');
    }
  }

  get duration() {
    return this.end.timestamp - this.start.timestamp;
  }

  contains(point) {
    const ts = point instanceof TemporalPoint ? point.timestamp : point;
    return ts >= this.start.timestamp && ts <= this.end.timestamp;
  }

  overlaps(other) {
    return this.start.timestamp <= other.end.timestamp &&
           this.end.timestamp >= other.start.timestamp;
  }

  isBefore(other) {
    return this.end.timestamp < other.start.timestamp;
  }

  isAfter(other) {
    return this.start.timestamp > other.end.timestamp;
  }

  during(other) {
    return this.start.timestamp >= other.start.timestamp &&
           this.end.timestamp <= other.end.timestamp;
  }

  toString() {
    return `[${this.start.toString()} - ${this.end.toString()}]`;
  }
}

/**
 * Temporal event with associated data
 */
class TemporalEvent {
  constructor(name, interval, data = {}) {
    this.name = name;
    this.interval = interval instanceof TemporalInterval 
      ? interval 
      : new TemporalInterval(interval.start, interval.end);
    this.data = data;
  }

  toString() {
    return `Event(${this.name}, ${this.interval.toString()})`;
  }
}

/**
 * Temporal Reasoning Engine
 */
class TemporalEngine {
  constructor(atomspace, options = {}) {
    this.atomspace = atomspace;
    this.currentTime = Date.now();
    this.decayRate = options.decayRate || 0.01;
    this.temporalWindow = options.temporalWindow || 86400000; // 24 hours in ms
  }

  /**
   * Add temporal event to atomspace
   */
  addEvent(name, start, end, data = {}) {
    const interval = new TemporalInterval(start, end);
    const event = new TemporalEvent(name, interval, data);
    
    // Create atom for event
    const atom = this.atomspace.addAtom(
      TemporalAtomType.TEMPORAL_EVENT,
      name,
      null,
      {
        strength: 1.0,
        confidence: 1.0,
      }
    );
    
    // Store temporal data
    atom.temporalData = {
      interval: interval,
      data: data,
      createdAt: Date.now(),
    };
    
    return atom;
  }

  /**
   * Find temporal relationships between events
   */
  findTemporalRelations(event1, event2) {
    const relations = [];
    
    if (!event1.temporalData || !event2.temporalData) {
      return relations;
    }
    
    const interval1 = event1.temporalData.interval;
    const interval2 = event2.temporalData.interval;
    
    if (interval1.isBefore(interval2)) {
      relations.push({
        type: TemporalAtomType.BEFORE,
        source: event1,
        target: event2,
      });
    }
    
    if (interval1.isAfter(interval2)) {
      relations.push({
        type: TemporalAtomType.AFTER,
        source: event1,
        target: event2,
      });
    }
    
    if (interval1.during(interval2)) {
      relations.push({
        type: TemporalAtomType.DURING,
        source: event1,
        target: event2,
      });
    }
    
    if (interval1.overlaps(interval2)) {
      relations.push({
        type: TemporalAtomType.OVERLAPS,
        source: event1,
        target: event2,
      });
    }
    
    return relations;
  }

  /**
   * Create temporal relationship links
   */
  createTemporalLinks() {
    const events = this.atomspace.getAtoms().filter(atom => 
      atom.type === TemporalAtomType.TEMPORAL_EVENT && atom.temporalData
    );
    
    const links = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const relations = this.findTemporalRelations(events[i], events[j]);
        
        for (const rel of relations) {
          const link = this.atomspace.addAtom(
            rel.type,
            `${rel.type}_${events[i].name}_${events[j].name}`,
            [events[i].id, events[j].id],
            { strength: 1.0, confidence: 1.0 }
          );
          links.push(link);
        }
      }
    }
    
    return links;
  }

  /**
   * Apply temporal decay to attention values
   * Events further in the past get lower attention
   */
  applyTemporalDecay() {
    this.currentTime = Date.now();
    const events = this.atomspace.getAtoms().filter(atom => 
      atom.type === TemporalAtomType.TEMPORAL_EVENT && atom.temporalData
    );
    
    for (const event of events) {
      const age = this.currentTime - event.temporalData.interval.end.timestamp;
      const decayFactor = Math.exp(-this.decayRate * age / 1000); // age in seconds
      
      // Apply decay to STI
      if (event.attentionValue) {
        event.attentionValue.sti *= decayFactor;
      }
    }
    
    return events.length;
  }

  /**
   * Get events within temporal window
   */
  getRecentEvents(windowMs = null) {
    const window = windowMs || this.temporalWindow;
    const cutoff = this.currentTime - window;
    
    return this.atomspace.getAtoms().filter(atom => 
      atom.type === TemporalAtomType.TEMPORAL_EVENT &&
      atom.temporalData &&
      atom.temporalData.interval.end.timestamp >= cutoff
    );
  }

  /**
   * Get events at a specific time point
   */
  getEventsAt(timestamp) {
    const point = timestamp instanceof TemporalPoint ? timestamp : new TemporalPoint(timestamp);
    
    return this.atomspace.getAtoms().filter(atom => 
      atom.type === TemporalAtomType.TEMPORAL_EVENT &&
      atom.temporalData &&
      atom.temporalData.interval.contains(point)
    );
  }

  /**
   * Temporal pattern matching
   * Find sequences of events matching a pattern
   */
  findTemporalPattern(pattern) {
    // Pattern is array of event predicates in temporal order
    const events = this.atomspace.getAtoms().filter(atom => 
      atom.type === TemporalAtomType.TEMPORAL_EVENT && atom.temporalData
    );
    
    // Sort by start time
    events.sort((a, b) => 
      a.temporalData.interval.start.timestamp - b.temporalData.interval.start.timestamp
    );
    
    const matches = [];
    
    // Simple sequential matching
    for (let i = 0; i <= events.length - pattern.length; i++) {
      const candidate = [];
      let valid = true;
      
      for (let j = 0; j < pattern.length; j++) {
        const event = events[i + j];
        const predicate = pattern[j];
        
        if (!predicate(event)) {
          valid = false;
          break;
        }
        candidate.push(event);
      }
      
      if (valid) {
        matches.push(candidate);
      }
    }
    
    return matches;
  }

  /**
   * Infer temporal relationships using transitivity
   * If A before B and B before C, then A before C
   */
  inferTemporalTransitivity() {
    const beforeLinks = this.atomspace.getAtoms().filter(atom =>
      atom.type === TemporalAtomType.BEFORE
    );
    
    const newInferences = [];
    
    for (let i = 0; i < beforeLinks.length; i++) {
      for (let j = 0; j < beforeLinks.length; j++) {
        if (i === j) continue;
        
        const ab = beforeLinks[i];
        const bc = beforeLinks[j];
        
        // Check if B matches
        if (ab.outgoing && bc.outgoing &&
            ab.outgoing[1] === bc.outgoing[0]) {
          
          const a = ab.outgoing[0];
          const c = bc.outgoing[1];
          
          // Check if A→C already exists
          const exists = beforeLinks.some(link =>
            link.outgoing &&
            link.outgoing[0] === a &&
            link.outgoing[1] === c
          );
          
          if (!exists) {
            const newLink = this.atomspace.addAtom(
              TemporalAtomType.BEFORE,
              `${TemporalAtomType.BEFORE}_${a}_${c}`,
              [a, c],
              { strength: 0.9, confidence: 0.9 }
            );
            newInferences.push(newLink);
          }
        }
      }
    }
    
    return newInferences;
  }

  /**
   * Get statistics about temporal data
   */
  getStats() {
    const events = this.atomspace.getAtoms().filter(atom => 
      atom.type === TemporalAtomType.TEMPORAL_EVENT && atom.temporalData
    );
    
    if (events.length === 0) {
      return {
        eventCount: 0,
        earliestEvent: null,
        latestEvent: null,
        averageDuration: 0,
      };
    }
    
    let earliest = events[0].temporalData.interval.start.timestamp;
    let latest = events[0].temporalData.interval.end.timestamp;
    let totalDuration = 0;
    
    for (const event of events) {
      const start = event.temporalData.interval.start.timestamp;
      const end = event.temporalData.interval.end.timestamp;
      
      if (start < earliest) earliest = start;
      if (end > latest) latest = end;
      totalDuration += (end - start);
    }
    
    return {
      eventCount: events.length,
      earliestEvent: new Date(earliest).toISOString(),
      latestEvent: new Date(latest).toISOString(),
      averageDuration: totalDuration / events.length,
      timeSpan: latest - earliest,
    };
  }
}

module.exports = {
  TemporalAtomType,
  TemporalPoint,
  TemporalInterval,
  TemporalEvent,
  TemporalEngine,
};
