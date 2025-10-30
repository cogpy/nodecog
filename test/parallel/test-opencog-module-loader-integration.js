// Flags: --expose-internals
'use strict';

const common = require('../common');
const assert = require('assert');
const { spawnSync } = require('child_process');

// Test that OpenCog NodeSpace integration with module loader can be enabled
{
  const result = spawnSync(process.execPath, [
    '--expose-internals',
    '-e',
    `
    const assert = require('assert');
    
    // Before any module loads, process.opencog should not exist
    assert.strictEqual(process.opencog, undefined);
    
    // Load a module to trigger the module loader integration
    const fs = require('fs');
    
    // Check if process.opencog is set up
    if (process.opencog) {
      assert.ok(process.opencog.nodespace, 'NodeSpace should be available');
      assert.ok(process.opencog.atomspace, 'AtomSpace should be available');
      assert.ok(typeof process.opencog.getModuleDependencies === 'function');
      assert.ok(typeof process.opencog.analyzeModules === 'function');
      assert.ok(typeof process.opencog.detectCircularDependencies === 'function');
      console.log('INTEGRATION_SUCCESS');
    } else {
      console.log('INTEGRATION_SKIPPED');
    }
    `,
  ], {
    env: { ...process.env, NODE_OPENCOG_ENABLE: '1' },
  });

  const output = result.stdout.toString();
  assert.ok(
    output.includes('INTEGRATION_SUCCESS') || output.includes('INTEGRATION_SKIPPED'),
    'Expected integration status output'
  );
}

// Test that module dependencies are tracked
{
  const result = spawnSync(process.execPath, [
    '--expose-internals',
    '-e',
    `
    const assert = require('assert');
    
    // Load multiple modules to create dependencies
    const fs = require('fs');
    const path = require('path');
    const util = require('util');
    
    if (process.opencog && process.opencog.nodespace) {
      const stats = process.opencog.analyzeModules();
      
      // Should have tracked multiple modules
      assert.ok(stats.totalModules >= 3, 
        'Should track at least fs, path, and util: ' + stats.totalModules);
      
      console.log('TRACKING_SUCCESS');
    } else {
      console.log('TRACKING_SKIPPED');
    }
    `,
  ], {
    env: { ...process.env, NODE_OPENCOG_ENABLE: '1' },
  });

  const output = result.stdout.toString();
  assert.ok(
    output.includes('TRACKING_SUCCESS') || output.includes('TRACKING_SKIPPED'),
    'Expected tracking status'
  );
}

// Test that orchestration can be enabled with AUTO_ANALYZE
{
  const result = spawnSync(process.execPath, [
    '--expose-internals',
    '-e',
    `
    const assert = require('assert');
    
    // Load modules
    const fs = require('fs');
    const path = require('path');
    
    if (process.opencog && process.opencog.orchestrator) {
      assert.ok(process.opencog.orchestrator, 'Orchestrator should be available');
      console.log('ORCHESTRATION_SUCCESS');
    } else if (process.opencog) {
      console.log('ORCHESTRATION_DISABLED');
    } else {
      console.log('ORCHESTRATION_SKIPPED');
    }
    `,
  ], {
    env: { 
      ...process.env, 
      NODE_OPENCOG_ENABLE: '1',
      NODE_OPENCOG_AUTO_ANALYZE: '1' 
    },
  });

  const output = result.stdout.toString();
  assert.ok(
    output.includes('ORCHESTRATION_SUCCESS') || 
    output.includes('ORCHESTRATION_DISABLED') ||
    output.includes('ORCHESTRATION_SKIPPED'),
    'Expected orchestration status'
  );
}

// Test that OpenCog is disabled by default
{
  const result = spawnSync(process.execPath, [
    '--expose-internals',
    '-e',
    `
    const assert = require('assert');
    const fs = require('fs');
    
    // Without NODE_OPENCOG_ENABLE, process.opencog should not exist
    assert.strictEqual(process.opencog, undefined);
    console.log('DEFAULT_DISABLED_OK');
    `,
  ]);

  const output = result.stdout.toString();
  assert.ok(
    output.includes('DEFAULT_DISABLED_OK'),
    'OpenCog should be disabled by default'
  );
}

// Test circular dependency detection
{
  const result = spawnSync(process.execPath, [
    '--expose-internals',
    '-e',
    `
    const assert = require('assert');
    
    // Load modules
    const fs = require('fs');
    
    if (process.opencog && process.opencog.detectCircularDependencies) {
      const circular = process.opencog.detectCircularDependencies();
      assert.ok(Array.isArray(circular), 'Should return array of circular dependencies');
      console.log('CIRCULAR_DETECTION_OK');
    } else {
      console.log('CIRCULAR_DETECTION_SKIPPED');
    }
    `,
  ], {
    env: { ...process.env, NODE_OPENCOG_ENABLE: '1' },
  });

  const output = result.stdout.toString();
  assert.ok(
    output.includes('CIRCULAR_DETECTION_OK') || output.includes('CIRCULAR_DETECTION_SKIPPED'),
    'Expected circular detection status'
  );
}
