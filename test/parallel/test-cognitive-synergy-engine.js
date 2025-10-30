'use strict';

const common = require('../common');
const assert = require('assert');

// Test cognitive synergy engine basic functionality
// Note: This is a smoke test to verify the API exists and works

const { internalBinding } = require('internal/test/binding');

// Check if cognitive synergy binding is available
let cognitiveBinding;
try {
  cognitiveBinding = internalBinding('cognitive_synergy');
} catch (err) {
  common.skip('Cognitive synergy binding not available');
}

// Test 1: Engine creation and destruction
{
  const config = {
    cognitiveTick: 5,
    workerThreads: 2,
    maxMicrotasks: 50,
  };
  
  const result = cognitiveBinding.createEngine(config);
  assert.strictEqual(result, true, 'Engine should be created successfully');
  
  const engineExists = cognitiveBinding.getEngine();
  assert.strictEqual(engineExists, true, 'Engine should exist after creation');
  
  cognitiveBinding.destroyEngine();
  console.log('✓ Engine creation and destruction');
}

// Test 2: Isolate management
{
  cognitiveBinding.createEngine({
    cognitiveTick: 5,
    workerThreads: 2,
  });
  
  const isolateCreated = cognitiveBinding.createIsolate('test-isolate');
  assert.strictEqual(isolateCreated, true, 'Isolate should be created');
  
  const isolateExists = cognitiveBinding.getIsolate('test-isolate');
  assert.strictEqual(isolateExists, true, 'Isolate should exist');
  
  cognitiveBinding.destroyIsolate('test-isolate');
  console.log('✓ Isolate creation and destruction');
  
  cognitiveBinding.destroyEngine();
}

// Test 3: STI/LTI management
{
  cognitiveBinding.createEngine({});
  cognitiveBinding.createIsolate('attention-test');
  
  // Set STI
  cognitiveBinding.setSTI('attention-test', 100);
  const sti = cognitiveBinding.getSTI('attention-test');
  assert.strictEqual(sti, 100, 'STI should be 100');
  
  // Set LTI
  cognitiveBinding.setLTI('attention-test', 80);
  const lti = cognitiveBinding.getLTI('attention-test');
  assert.strictEqual(lti, 80, 'LTI should be 80');
  
  console.log('✓ STI/LTI management');
  
  cognitiveBinding.destroyIsolate('attention-test');
  cognitiveBinding.destroyEngine();
}

// Test 4: Memory usage tracking
{
  cognitiveBinding.createEngine({});
  cognitiveBinding.createIsolate('memory-test');
  
  const memoryUsage = cognitiveBinding.getMemoryUsage('memory-test');
  assert.strictEqual(typeof memoryUsage, 'number', 'Memory usage should be a number');
  assert.ok(memoryUsage >= 0, 'Memory usage should be non-negative');
  
  console.log('✓ Memory usage tracking');
  
  cognitiveBinding.destroyIsolate('memory-test');
  cognitiveBinding.destroyEngine();
}

// Test 5: Engine statistics
{
  cognitiveBinding.createEngine({});
  cognitiveBinding.createIsolate('stats-1');
  cognitiveBinding.createIsolate('stats-2');
  
  const stats = cognitiveBinding.getStats();
  assert.strictEqual(typeof stats, 'object', 'Stats should be an object');
  assert.strictEqual(stats.isolateCount, 2, 'Should have 2 isolates');
  
  console.log('✓ Engine statistics');
  
  cognitiveBinding.destroyIsolate('stats-1');
  cognitiveBinding.destroyIsolate('stats-2');
  cognitiveBinding.destroyEngine();
}

// Test 6: Shared buffer creation
{
  const bufferSize = 1024;
  const buffer = cognitiveBinding.createSharedBuffer(bufferSize);
  
  assert.ok(buffer instanceof ArrayBuffer, 'Should return an ArrayBuffer');
  assert.strictEqual(buffer.byteLength, bufferSize, 'Buffer size should match');
  
  console.log('✓ Shared buffer creation');
}

// Test 7: Multiple isolates with different STI values
{
  cognitiveBinding.createEngine({ attentionBased: true });
  
  cognitiveBinding.createIsolate('high-priority');
  cognitiveBinding.setSTI('high-priority', 100);
  
  cognitiveBinding.createIsolate('medium-priority');
  cognitiveBinding.setSTI('medium-priority', 50);
  
  cognitiveBinding.createIsolate('low-priority');
  cognitiveBinding.setSTI('low-priority', 10);
  
  const stats = cognitiveBinding.getStats();
  assert.strictEqual(stats.isolateCount, 3, 'Should have 3 isolates');
  
  console.log('✓ Multiple isolates with different priorities');
  
  cognitiveBinding.destroyIsolate('high-priority');
  cognitiveBinding.destroyIsolate('medium-priority');
  cognitiveBinding.destroyIsolate('low-priority');
  cognitiveBinding.destroyEngine();
}

// Test 8: Error handling - operations without engine
{
  assert.throws(() => {
    cognitiveBinding.createIsolate('no-engine');
  }, /Engine not initialized/, 'Should throw when engine not initialized');
  
  console.log('✓ Error handling');
}

console.log('\n✅ All cognitive synergy engine tests passed');
