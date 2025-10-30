/**
 * NodeSpace ESM Loader Hooks
 * 
 * These hooks integrate the ES Module loader with OpenCog's NodeSpace,
 * creating a live software hypergraph in the AtomSpace.
 * 
 * Usage: node --experimental-loader ./lib/internal/nodespace_loader.mjs script.js
 */

import { pathToFileURL } from 'url';

// Global NodeSpace instance (injected by bootstrap)
let nodespace = null;

/**
 * Initialize the loader with NodeSpace
 */
export function initialize(data) {
  if (data && data.nodespace) {
    nodespace = data.nodespace;
  } else if (process.opencog && process.opencog.nodespace) {
    nodespace = process.opencog.nodespace;
  }
}

/**
 * Resolve hook - intercepts module resolution
 * Records DEPENDS_ON relationships in NodeSpace
 */
export async function resolve(specifier, context, nextResolve) {
  const result = await nextResolve(specifier, context);
  
  // Record import relationship in NodeSpace
  if (nodespace && context.parentURL) {
    try {
      nodespace.recordImport(context.parentURL, result.url, {
        format: result.format,
        timestamp: Date.now(),
      });
      
      // Update attention for this module
      const parentModule = nodespace.getModule(context.parentURL);
      if (parentModule) {
        // Boost STI for actively imported modules
        parentModule.atom.sti += 1;
      }
    } catch (error) {
      // Don't break module loading if NodeSpace recording fails
      console.error('NodeSpace recording error:', error);
    }
  }
  
  return result;
}

/**
 * Load hook - intercepts module loading
 * Records EXPORTS relationships and module metadata in NodeSpace
 */
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  
  // Record module in NodeSpace
  if (nodespace) {
    try {
      nodespace.recordModule(url, {
        format: result.format,
        source: result.source,
        shortCircuit: result.shortCircuit,
        timestamp: Date.now(),
      });
      
      // Extract and record exports
      if (result.format === 'module' && result.source) {
        const exports = extractExports(result.source.toString());
        for (const exportName of exports) {
          nodespace.recordExport(url, exportName);
        }
      }
      
      // Track module as active
      const module = nodespace.getModule(url);
      if (module) {
        module.atom.sti = Math.min(100, module.atom.sti + 5);
        module.lastLoaded = Date.now();
      }
    } catch (error) {
      // Don't break module loading if NodeSpace recording fails
      console.error('NodeSpace recording error:', error);
    }
  }
  
  return result;
}

/**
 * Extract exported identifiers from module source
 * This is a simplified implementation - a real parser would be more robust
 */
function extractExports(source) {
  const exports = new Set();
  
  // Match: export function name(...
  // Match: export class name...
  // Match: export const/let/var name...
  const directExports = source.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)/g);
  for (const match of directExports) {
    exports.add(match[1]);
  }
  
  // Match: export { name, name as alias }
  const namedExports = source.matchAll(/export\s*{([^}]+)}/g);
  for (const match of namedExports) {
    const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]);
    for (const name of names) {
      if (name) exports.add(name);
    }
  }
  
  // Match: export default
  if (/export\s+default\s+/.test(source)) {
    exports.add('default');
  }
  
  return Array.from(exports);
}

/**
 * Global preload hook (if needed for advanced integration)
 */
export function globalPreload(context) {
  return `
    // Initialize NodeSpace integration
    if (globalThis.process && globalThis.process.opencog) {
      const { NodeSpace } = globalThis.process.opencog;
      if (NodeSpace && !globalThis.process.opencog.nodespace) {
        // Create global NodeSpace instance if not already created
        globalThis.process.opencog.nodespace = new NodeSpace(
          globalThis.process.opencog.atomspace
        );
      }
    }
  `;
}
