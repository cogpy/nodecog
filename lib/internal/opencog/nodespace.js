'use strict';

/**
 * NodeSpace - OpenCog AtomSpace-based Module System
 * 
 * Maps Node.js modules to AtomSpace hypergraph representation:
 * - Modules as nodes in the knowledge graph
 * - Dependencies as typed links
 * - Module metadata stored in atom properties
 * - Leverages metagraph topology for module resolution
 */

const { EventEmitter } = require('events');

/**
 * Extended AtomTypes for NodeSpace
 * These represent different aspects of the Node.js module system
 */
const NodeSpaceAtomType = {
  // Module types
  MODULE: 'MODULE',                     // A Node.js module
  BUILTIN_MODULE: 'BUILTIN_MODULE',     // Node.js core module
  NPM_MODULE: 'NPM_MODULE',             // External npm package
  LOCAL_MODULE: 'LOCAL_MODULE',         // Local file module
  JSON_MODULE: 'JSON_MODULE',           // JSON module
  
  // Relationship types
  DEPENDS_ON: 'DEPENDS_ON',             // Module A depends on Module B
  EXPORTS: 'EXPORTS',                   // Module exports symbol
  IMPORTS: 'IMPORTS',                   // Module imports symbol
  REQUIRES: 'REQUIRES',                 // Module requires another module
  PARENT_OF: 'PARENT_OF',               // Parent-child module relationship
  
  // Export/Import types
  EXPORT_SYMBOL: 'EXPORT_SYMBOL',       // Exported symbol/function/class
  IMPORT_SYMBOL: 'IMPORT_SYMBOL',       // Imported symbol
  
  // Metadata types
  MODULE_PATH: 'MODULE_PATH',           // File path of module
  MODULE_VERSION: 'MODULE_VERSION',     // Module version
  MODULE_PACKAGE: 'MODULE_PACKAGE',     // Package information
};

/**
 * NodeSpace - AtomSpace-based module system
 * Integrates with Node.js module loading to create a knowledge graph
 */
class NodeSpace extends EventEmitter {
  constructor(atomspace, options = {}) {
    super();
    
    if (!atomspace) {
      throw new Error('NodeSpace requires an AtomSpace instance');
    }
    
    this.atomspace = atomspace;
    this.options = {
      trackDependencies: options.trackDependencies ?? true,
      trackExports: options.trackExports ?? true,
      trackBuiltins: options.trackBuiltins ?? true,
      autoAttention: options.autoAttention ?? true,
      ...options,
    };
    
    // Module registry: path -> module atom
    this.moduleRegistry = new Map();
    
    // Dependency graph cache
    this.dependencyGraph = new Map();
    
    // Module load order
    this.loadOrder = [];
    
    // Statistics
    this.stats = {
      modulesTracked: 0,
      dependenciesTracked: 0,
      exportsTracked: 0,
      builtinsTracked: 0,
    };
  }

  /**
   * Register a module in the NodeSpace
   * Creates an atom representing the module
   */
  registerModule(modulePath, moduleType, metadata = {}) {
    // Check if already registered
    if (this.moduleRegistry.has(modulePath)) {
      return this.moduleRegistry.get(modulePath);
    }

    // Determine the correct atom type based on module type
    let atomType;
    switch (moduleType) {
      case 'builtin':
        atomType = NodeSpaceAtomType.BUILTIN_MODULE;
        this.stats.builtinsTracked++;
        break;
      case 'npm':
        atomType = NodeSpaceAtomType.NPM_MODULE;
        break;
      case 'json':
        atomType = NodeSpaceAtomType.JSON_MODULE;
        break;
      case 'local':
      default:
        atomType = NodeSpaceAtomType.LOCAL_MODULE;
    }

    // Create module atom
    const moduleAtom = this.atomspace.addAtom(
      atomType,
      modulePath,
      [],
      {
        strength: 1.0,
        confidence: 1.0,
      }
    );

    // Store metadata
    if (metadata) {
      moduleAtom.metadata = {
        type: moduleType,
        path: modulePath,
        loadTime: Date.now(),
        ...metadata,
      };
    }

    // Apply attention if enabled
    if (this.options.autoAttention) {
      // Builtin modules get higher initial attention
      const initialSTI = moduleType === 'builtin' ? 50 : 10;
      moduleAtom.attention.sti = initialSTI;
      moduleAtom.attention.lti = moduleType === 'builtin' ? 30 : 5;
    }

    // Register in cache
    this.moduleRegistry.set(modulePath, moduleAtom);
    this.loadOrder.push(modulePath);
    this.stats.modulesTracked++;

    this.emit('module-registered', {
      path: modulePath,
      type: moduleType,
      atom: moduleAtom,
    });

    return moduleAtom;
  }

  /**
   * Track a dependency between modules
   */
  trackDependency(fromPath, toPath, importType = 'require') {
    if (!this.options.trackDependencies) return null;

    // Ensure both modules are registered
    const fromModule = this.moduleRegistry.get(fromPath);
    const toModule = this.moduleRegistry.get(toPath);

    if (!fromModule || !toModule) {
      return null;
    }

    // Create dependency link
    const dependencyLink = this.atomspace.addAtom(
      NodeSpaceAtomType.DEPENDS_ON,
      `${fromPath}-depends-on-${toPath}`,
      [fromModule, toModule],
      {
        strength: 1.0,
        confidence: 0.9,
      }
    );

    dependencyLink.metadata = {
      importType,
      timestamp: Date.now(),
    };

    // Update dependency graph cache
    if (!this.dependencyGraph.has(fromPath)) {
      this.dependencyGraph.set(fromPath, new Set());
    }
    this.dependencyGraph.get(fromPath).add(toPath);

    // Spread attention from dependent to dependency
    if (this.options.autoAttention) {
      toModule.attention.sti += Math.floor(fromModule.attention.sti * 0.2);
    }

    this.stats.dependenciesTracked++;

    this.emit('dependency-tracked', {
      from: fromPath,
      to: toPath,
      type: importType,
      link: dependencyLink,
    });

    return dependencyLink;
  }

  /**
   * Track an exported symbol from a module
   */
  trackExport(modulePath, exportName, exportType = 'function') {
    if (!this.options.trackExports) return null;

    const moduleAtom = this.moduleRegistry.get(modulePath);
    if (!moduleAtom) return null;

    // Create export symbol atom
    const exportAtom = this.atomspace.addAtom(
      NodeSpaceAtomType.EXPORT_SYMBOL,
      `${modulePath}::${exportName}`,
      [],
      {
        strength: 0.9,
        confidence: 0.9,
      }
    );

    exportAtom.metadata = {
      name: exportName,
      type: exportType,
      module: modulePath,
    };

    // Create export link
    const exportLink = this.atomspace.addAtom(
      NodeSpaceAtomType.EXPORTS,
      `${modulePath}-exports-${exportName}`,
      [moduleAtom, exportAtom],
      {
        strength: 1.0,
        confidence: 1.0,
      }
    );

    this.stats.exportsTracked++;

    this.emit('export-tracked', {
      module: modulePath,
      export: exportName,
      type: exportType,
      atom: exportAtom,
    });

    return exportAtom;
  }

  /**
   * Get a module atom by path
   */
  getModule(modulePath) {
    return this.moduleRegistry.get(modulePath);
  }

  /**
   * Get all dependencies of a module
   */
  getDependencies(modulePath) {
    const moduleAtom = this.moduleRegistry.get(modulePath);
    if (!moduleAtom) return [];

    // Query atomspace for DEPENDS_ON links
    const dependencies = [];
    for (const link of moduleAtom.incoming) {
      if (link.type === NodeSpaceAtomType.DEPENDS_ON && 
          link.outgoing[0]?.id === moduleAtom.id) {
        dependencies.push(link.outgoing[1]);
      }
    }

    return dependencies;
  }

  /**
   * Get all modules that depend on this module
   */
  getDependents(modulePath) {
    const moduleAtom = this.moduleRegistry.get(modulePath);
    if (!moduleAtom) return [];

    const dependents = [];
    for (const link of moduleAtom.incoming) {
      if (link.type === NodeSpaceAtomType.DEPENDS_ON && 
          link.outgoing[1]?.id === moduleAtom.id) {
        dependents.push(link.outgoing[0]);
      }
    }

    return dependents;
  }

  /**
   * Get all exports from a module
   */
  getExports(modulePath) {
    const moduleAtom = this.moduleRegistry.get(modulePath);
    if (!moduleAtom) return [];

    const exports = [];
    for (const link of moduleAtom.incoming) {
      if (link.type === NodeSpaceAtomType.EXPORTS && 
          link.outgoing[0]?.id === moduleAtom.id) {
        exports.push(link.outgoing[1]);
      }
    }

    return exports;
  }

  /**
   * Find modules by type
   */
  findModulesByType(moduleType) {
    let atomType;
    switch (moduleType) {
      case 'builtin':
        atomType = NodeSpaceAtomType.BUILTIN_MODULE;
        break;
      case 'npm':
        atomType = NodeSpaceAtomType.NPM_MODULE;
        break;
      case 'json':
        atomType = NodeSpaceAtomType.JSON_MODULE;
        break;
      case 'local':
        atomType = NodeSpaceAtomType.LOCAL_MODULE;
        break;
      default:
        return [];
    }

    return this.atomspace.getAtomsByType(atomType);
  }

  /**
   * Get dependency chain from one module to another
   */
  getDependencyChain(fromPath, toPath) {
    const visited = new Set();
    const chain = [];

    const dfs = (currentPath) => {
      if (currentPath === toPath) {
        return true;
      }

      if (visited.has(currentPath)) {
        return false;
      }

      visited.add(currentPath);
      const deps = this.dependencyGraph.get(currentPath) || new Set();

      for (const dep of deps) {
        chain.push(dep);
        if (dfs(dep)) {
          return true;
        }
        chain.pop();
      }

      return false;
    };

    if (dfs(fromPath)) {
      return [fromPath, ...chain];
    }

    return null;
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies() {
    const circles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (path, chain = []) => {
      if (recursionStack.has(path)) {
        // Found a cycle
        const cycleStart = chain.indexOf(path);
        circles.push([...chain.slice(cycleStart), path]);
        return;
      }

      if (visited.has(path)) {
        return;
      }

      visited.add(path);
      recursionStack.add(path);
      chain.push(path);

      const deps = this.dependencyGraph.get(path) || new Set();
      for (const dep of deps) {
        dfs(dep, [...chain]);
      }

      recursionStack.delete(path);
    };

    for (const modulePath of this.moduleRegistry.keys()) {
      if (!visited.has(modulePath)) {
        dfs(modulePath);
      }
    }

    return circles;
  }

  /**
   * Get module load statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      totalAtoms: this.atomspace.atoms.size,
      averageAttention: this._calculateAverageAttention(),
      mostAttended: this._getMostAttendedModules(5),
      loadOrder: this.loadOrder,
    };
  }

  /**
   * Private: Calculate average attention across all modules
   */
  _calculateAverageAttention() {
    const modules = Array.from(this.moduleRegistry.values());
    if (modules.length === 0) return 0;

    const totalSTI = modules.reduce((sum, m) => sum + m.attention.sti, 0);
    return totalSTI / modules.length;
  }

  /**
   * Private: Get most attended modules
   */
  _getMostAttendedModules(limit = 5) {
    return Array.from(this.moduleRegistry.values())
      .sort((a, b) => b.attention.sti - a.attention.sti)
      .slice(0, limit)
      .map(m => ({
        path: m.name,
        sti: m.attention.sti,
        type: m.type,
      }));
  }

  /**
   * Clear the NodeSpace
   */
  clear() {
    this.moduleRegistry.clear();
    this.dependencyGraph.clear();
    this.loadOrder = [];
    this.stats = {
      modulesTracked: 0,
      dependenciesTracked: 0,
      exportsTracked: 0,
      builtinsTracked: 0,
    };
    this.emit('cleared');
  }

  /**
   * Export the module graph as JSON
   */
  exportGraph() {
    const nodes = [];
    const edges = [];

    for (const [path, atom] of this.moduleRegistry) {
      nodes.push({
        id: atom.id,
        path,
        type: atom.type,
        attention: atom.attention,
        metadata: atom.metadata,
      });
    }

    for (const [fromPath, deps] of this.dependencyGraph) {
      const fromAtom = this.moduleRegistry.get(fromPath);
      for (const toPath of deps) {
        const toAtom = this.moduleRegistry.get(toPath);
        if (fromAtom && toAtom) {
          edges.push({
            from: fromAtom.id,
            to: toAtom.id,
            fromPath,
            toPath,
          });
        }
      }
    }

    return { nodes, edges };
  }
}

module.exports = NodeSpace;
module.exports.NodeSpaceAtomType = NodeSpaceAtomType;
