/**
 * Cognitive Synergy Engine Example
 * 
 * Demonstrates how to use the V8+libuv cognitive synergy engine
 * to run JavaScript under OpenCog's cognitive scheduler control.
 */

'use strict';

const { createCognitiveSynergyEngine } = require('internal/cognitive_synergy');
const opencog = require('opencog');

// Example 1: Basic engine usage
function basicEngineExample() {
  console.log('\n=== Basic Engine Example ===\n');
  
  // Create cognitive synergy engine
  const engine = createCognitiveSynergyEngine({
    cognitiveTick: 5,        // 5ms cognitive loop tick
    workerThreads: 4,         // 4 libuv worker threads
    maxMicrotasks: 100,       // Max 100 microtasks per slice
    attentionBased: true,     // Use attention-based scheduling
    monitoring: true,         // Enable performance monitoring
  });
  
  console.log('Cognitive Synergy Engine created');
  console.log('Stats:', engine.getStats());
  
  // Create isolates for different agent families
  const mainIsolate = engine.createIsolate('main', {
    sti: 100,  // High initial attention
    lti: 100,
  });
  
  const backgroundIsolate = engine.createIsolate('background', {
    sti: 20,   // Lower initial attention
    lti: 50,
  });
  
  console.log('\nCreated isolates:');
  console.log('- Main isolate STI:', mainIsolate.getSTI());
  console.log('- Background isolate STI:', backgroundIsolate.getSTI());
  
  // Simulate attention changes
  setTimeout(() => {
    mainIsolate.boost(50);
    backgroundIsolate.decay(5);
    
    console.log('\nAfter attention changes:');
    console.log('- Main isolate STI:', mainIsolate.getSTI());
    console.log('- Background isolate STI:', backgroundIsolate.getSTI());
    
    engine.destroy();
    console.log('\nEngine destroyed');
  }, 100);
}

// Example 2: Integration with OpenCog AtomSpace
function atomspaceIntegrationExample() {
  console.log('\n=== AtomSpace Integration Example ===\n');
  
  // Create cognitive system
  const system = opencog.createCognitiveSystem();
  const { atomspace, attentionBank } = system;
  
  // Create cognitive synergy engine
  const engine = createCognitiveSynergyEngine({
    cognitiveTick: 5,
    attentionBased: true,
  });
  
  console.log('Created cognitive system with synergy engine');
  
  // Create isolates for different cognitive tasks
  const reasoningIsolate = engine.createIsolate('reasoning', { sti: 80, lti: 90 });
  const perceptionIsolate = engine.createIsolate('perception', { sti: 60, lti: 70 });
  const planningIsolate = engine.createIsolate('planning', { sti: 70, lti: 80 });
  
  // Add some knowledge to AtomSpace
  const conceptA = atomspace.addNode('CONCEPT', 'A');
  const conceptB = atomspace.addNode('CONCEPT', 'B');
  const link = atomspace.addLink('INHERITANCE', [conceptA, conceptB]);
  
  // Set attention in AtomSpace
  attentionBank.setSTI(conceptA, 80);
  attentionBank.setSTI(conceptB, 60);
  
  // Sync isolate attention with atom attention
  reasoningIsolate.setSTI(attentionBank.getSTI(conceptA));
  perceptionIsolate.setSTI(attentionBank.getSTI(conceptB));
  
  console.log('\nIsolate attention synced with AtomSpace:');
  console.log('- Reasoning isolate STI:', reasoningIsolate.getSTI());
  console.log('- Perception isolate STI:', perceptionIsolate.getSTI());
  
  // Cleanup
  setTimeout(() => {
    engine.destroy();
    console.log('\nCleaned up');
  }, 100);
}

// Example 3: Memory-based scheduling
function memoryBasedSchedulingExample() {
  console.log('\n=== Memory-Based Scheduling Example ===\n');
  
  const engine = createCognitiveSynergyEngine({
    cognitiveTick: 10,
    attentionBased: true,
  });
  
  // Create isolates with different memory profiles
  const lightweightIsolate = engine.createIsolate('lightweight', { sti: 50 });
  const heavyIsolate = engine.createIsolate('heavy', { sti: 50 });
  
  console.log('Initial state:');
  console.log('- Lightweight isolate memory:', lightweightIsolate.getMemoryUsage());
  console.log('- Heavy isolate memory:', heavyIsolate.getMemoryUsage());
  console.log('- Lightweight STI:', lightweightIsolate.getSTI());
  console.log('- Heavy STI:', heavyIsolate.getSTI());
  
  // Note: In a real scenario, the isolates would be running code
  // and the scheduler would adjust STI based on actual memory usage
  
  setTimeout(() => {
    console.log('\nAfter cognitive scheduling:');
    console.log('- Lightweight STI:', lightweightIsolate.getSTI());
    console.log('- Heavy STI:', heavyIsolate.getSTI());
    
    engine.destroy();
    console.log('\nEngine destroyed');
  }, 50);
}

// Example 4: Shared memory communication
function sharedMemoryExample() {
  console.log('\n=== Shared Memory Example ===\n');
  
  const engine = createCognitiveSynergyEngine();
  
  // Create shared buffer for zero-copy communication
  const bufferSize = 1024 * 1024;  // 1MB
  const sharedBuffer = engine.createSharedBuffer(bufferSize);
  
  console.log('Created shared buffer:', sharedBuffer.byteLength, 'bytes');
  
  // Create isolates that can share this buffer
  const writer = engine.createIsolate('writer');
  const reader = engine.createIsolate('reader');
  
  console.log('Created writer and reader isolates');
  console.log('Shared buffer can be used for zero-copy AtomSpace access');
  
  // In a real scenario, the shared buffer would be used for:
  // - Sharing PLN tensors
  // - Sharing ESN states
  // - Zero-copy AtomSpace data structures
  // - Fast inter-isolate communication via Atomics.wait/notify
  
  setTimeout(() => {
    engine.destroy();
    console.log('\nEngine destroyed');
  }, 50);
}

// Run all examples
function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Cognitive Synergy Engine (V8+libuv) Examples        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  basicEngineExample();
  
  setTimeout(() => {
    atomspaceIntegrationExample();
  }, 200);
  
  setTimeout(() => {
    memoryBasedSchedulingExample();
  }, 400);
  
  setTimeout(() => {
    sharedMemoryExample();
  }, 600);
  
  setTimeout(() => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  All examples completed                               ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  }, 800);
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  basicEngineExample,
  atomspaceIntegrationExample,
  memoryBasedSchedulingExample,
  sharedMemoryExample,
  runAllExamples,
};
