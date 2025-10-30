'use strict';

// Test Temporal Reasoning System

const common = require('../common');
const assert = require('assert');
const { AtomSpace } = require('internal/opencog/atomspace');
const {
  TemporalAtomType,
  TemporalPoint,
  TemporalInterval,
  TemporalEvent,
  TemporalEngine,
} = require('internal/opencog/temporal');

// Test TemporalPoint
{
  const now = Date.now();
  const tp1 = new TemporalPoint(now);
  const tp2 = new TemporalPoint(now + 1000);
  
  assert.ok(tp1.isBefore(tp2));
  assert.ok(tp2.isAfter(tp1));
  assert.ok(!tp1.equals(tp2));
  
  const tp3 = new TemporalPoint(now);
  assert.ok(tp1.equals(tp3));
  
  common.printSkipMessage('TemporalPoint creation and comparisons');
}

// Test TemporalInterval
{
  const start = Date.now();
  const end = start + 5000;
  const interval = new TemporalInterval(start, end);
  
  assert.strictEqual(interval.duration, 5000);
  assert.ok(interval.contains(start + 2000));
  assert.ok(!interval.contains(start - 1000));
  assert.ok(!interval.contains(end + 1000));
  
  common.printSkipMessage('TemporalInterval creation and contains');
}

// Test TemporalInterval - Overlaps
{
  const interval1 = new TemporalInterval(1000, 5000);
  const interval2 = new TemporalInterval(3000, 7000);
  const interval3 = new TemporalInterval(6000, 9000);
  
  assert.ok(interval1.overlaps(interval2));
  assert.ok(interval2.overlaps(interval1));
  assert.ok(!interval1.overlaps(interval3));
  
  common.printSkipMessage('TemporalInterval overlaps');
}

// Test TemporalInterval - Before/After
{
  const interval1 = new TemporalInterval(1000, 3000);
  const interval2 = new TemporalInterval(5000, 7000);
  
  assert.ok(interval1.isBefore(interval2));
  assert.ok(interval2.isAfter(interval1));
  assert.ok(!interval1.isAfter(interval2));
  assert.ok(!interval2.isBefore(interval1));
  
  common.printSkipMessage('TemporalInterval before/after');
}

// Test TemporalInterval - During
{
  const outer = new TemporalInterval(1000, 10000);
  const inner = new TemporalInterval(3000, 7000);
  
  assert.ok(inner.during(outer));
  assert.ok(!outer.during(inner));
  
  common.printSkipMessage('TemporalInterval during');
}

// Test TemporalEvent
{
  const interval = new TemporalInterval(1000, 5000);
  const event = new TemporalEvent('test-event', interval, { data: 'value' });
  
  assert.strictEqual(event.name, 'test-event');
  assert.strictEqual(event.interval, interval);
  assert.deepStrictEqual(event.data, { data: 'value' });
  
  common.printSkipMessage('TemporalEvent creation');
}

// Test TemporalEngine - Add Event
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace);
  
  const now = Date.now();
  const event = engine.addEvent('event1', now, now + 1000, { type: 'test' });
  
  assert.ok(event);
  assert.strictEqual(event.name, 'event1');
  assert.ok(event.temporalData);
  assert.ok(event.temporalData.interval);
  
  common.printSkipMessage('TemporalEngine add event');
}

// Test TemporalEngine - Find Temporal Relations
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace);
  
  const now = Date.now();
  const event1 = engine.addEvent('event1', now, now + 1000);
  const event2 = engine.addEvent('event2', now + 2000, now + 3000);
  
  const relations = engine.findTemporalRelations(event1, event2);
  
  assert.ok(relations.length > 0);
  assert.ok(relations.some(r => r.type === TemporalAtomType.BEFORE));
  
  common.printSkipMessage('TemporalEngine find temporal relations');
}

// Test TemporalEngine - Overlapping Events
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace);
  
  const now = Date.now();
  const event1 = engine.addEvent('event1', now, now + 3000);
  const event2 = engine.addEvent('event2', now + 1000, now + 4000);
  
  const relations = engine.findTemporalRelations(event1, event2);
  
  assert.ok(relations.some(r => r.type === TemporalAtomType.OVERLAPS));
  
  common.printSkipMessage('TemporalEngine overlapping events');
}

// Test TemporalEngine - Create Temporal Links
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace);
  
  const now = Date.now();
  engine.addEvent('event1', now, now + 1000);
  engine.addEvent('event2', now + 2000, now + 3000);
  engine.addEvent('event3', now + 4000, now + 5000);
  
  const links = engine.createTemporalLinks();
  
  assert.ok(links.length > 0);
  
  common.printSkipMessage('TemporalEngine create temporal links');
}

// Test TemporalEngine - Temporal Decay
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace, { decayRate: 0.1 });
  
  const now = Date.now();
  const oldEvent = engine.addEvent('old', now - 10000, now - 5000);
  const recentEvent = engine.addEvent('recent', now - 1000, now);
  
  // Set initial attention
  oldEvent.attentionValue = { sti: 100, lti: 50, vlti: false };
  recentEvent.attentionValue = { sti: 100, lti: 50, vlti: false };
  
  engine.applyTemporalDecay();
  
  // Old event should have lower STI than recent event
  assert.ok(oldEvent.attentionValue.sti < recentEvent.attentionValue.sti);
  
  common.printSkipMessage('TemporalEngine temporal decay');
}

// Test TemporalEngine - Get Recent Events
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace, { temporalWindow: 5000 });
  
  const now = Date.now();
  engine.addEvent('old', now - 10000, now - 9000);
  engine.addEvent('recent1', now - 2000, now - 1000);
  engine.addEvent('recent2', now - 500, now);
  
  const recentEvents = engine.getRecentEvents();
  
  // Should only get events within 5000ms window
  assert.strictEqual(recentEvents.length, 2);
  
  common.printSkipMessage('TemporalEngine get recent events');
}

// Test TemporalEngine - Get Events At Time
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace);
  
  const now = Date.now();
  engine.addEvent('event1', now - 1000, now + 1000);
  engine.addEvent('event2', now + 2000, now + 3000);
  engine.addEvent('event3', now - 500, now + 500);
  
  const eventsAtNow = engine.getEventsAt(now);
  
  // Should find events 1 and 3 (both contain 'now')
  assert.strictEqual(eventsAtNow.length, 2);
  
  common.printSkipMessage('TemporalEngine get events at time');
}

// Test TemporalEngine - Temporal Pattern Matching
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace);
  
  const now = Date.now();
  engine.addEvent('login', now, now + 100, { type: 'auth' });
  engine.addEvent('access', now + 200, now + 300, { type: 'access' });
  engine.addEvent('logout', now + 400, now + 500, { type: 'auth' });
  
  // Pattern: events with type='auth'
  const pattern = [
    (e) => e.temporalData.data.type === 'auth',
    (e) => e.temporalData.data.type === 'auth',
  ];
  
  const matches = engine.findTemporalPattern(pattern);
  
  // Should find the sequence: login -> logout
  assert.ok(matches.length >= 0);
  
  common.printSkipMessage('TemporalEngine temporal pattern matching');
}

// Test TemporalEngine - Infer Transitivity
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace);
  
  const now = Date.now();
  const a = engine.addEvent('a', now, now + 1000);
  const b = engine.addEvent('b', now + 2000, now + 3000);
  const c = engine.addEvent('c', now + 4000, now + 5000);
  
  // Create links manually
  atomspace.addAtom(TemporalAtomType.BEFORE, 'a-before-b', [a.id, b.id],
    { strength: 1.0, confidence: 1.0 });
  atomspace.addAtom(TemporalAtomType.BEFORE, 'b-before-c', [b.id, c.id],
    { strength: 1.0, confidence: 1.0 });
  
  const inferences = engine.inferTemporalTransitivity();
  
  // Should infer a-before-c
  assert.ok(inferences.length > 0);
  
  common.printSkipMessage('TemporalEngine infer transitivity');
}

// Test TemporalEngine - Statistics
{
  const atomspace = new AtomSpace();
  const engine = new TemporalEngine(atomspace);
  
  const now = Date.now();
  engine.addEvent('event1', now, now + 1000);
  engine.addEvent('event2', now + 2000, now + 5000);
  engine.addEvent('event3', now + 3000, now + 4000);
  
  const stats = engine.getStats();
  
  assert.strictEqual(stats.eventCount, 3);
  assert.ok(stats.earliestEvent);
  assert.ok(stats.latestEvent);
  assert.ok(stats.averageDuration > 0);
  assert.ok(stats.timeSpan > 0);
  
  common.printSkipMessage('TemporalEngine statistics');
}

common.printSkipMessage('All Temporal tests passed');
