# Cognitive Synergy Engine Embedder

This directory contains a minimal embedder application that demonstrates how to use the Cognitive Synergy Engine at the C++ level.

## Overview

The Cognitive Synergy Engine allows you to embed V8 and libuv under OpenCog's cognitive scheduler control, giving you fine-grained control over when JavaScript code executes based on attention economics.

## Building

### Prerequisites

- CMake 3.10 or higher
- C++17 compatible compiler
- Node.js source code (this repository)

### Build Steps

```bash
# Create build directory
mkdir build
cd build

# Configure
cmake ..

# Build
make

# Run
./embedder
```

## Architecture

The embedder demonstrates:

1. **Engine Initialization**: Creating and configuring the cognitive synergy engine
2. **Isolate Management**: Creating multiple V8 isolates for different cognitive functions
3. **Attention Control**: Setting and adjusting STI/LTI values
4. **Cognitive Loop**: Running the libuv loop with cognitive hooks
5. **Resource Monitoring**: Tracking memory usage per isolate

## Key Components

### CognitiveSynergyEngine

The main engine class that:
- Initializes V8 and libuv
- Manages multiple isolates
- Runs the cognitive scheduler
- Provides attention-based task scheduling

### IsolateContext

Represents an isolated execution context with:
- V8 isolate and Node.js environment
- STI (Short-Term Importance) value
- LTI (Long-Term Importance) value
- Resource tracking (memory, CPU)

### CognitiveScheduler

Decides which isolate runs next based on:
- STI/LTI values
- Memory pressure
- Attention decay
- Custom scheduling policies

## libuv Hooks

The engine uses libuv hooks to integrate cognitive control:

- **uv_prepare**: Runs before I/O polling
  - Selects next isolate based on attention
  - Schedules tasks for execution

- **uv_check**: Runs after I/O polling
  - Performs microtask checkpoints
  - Ensures promises settle deterministically

- **uv_timer**: Cognitive loop tick (default: 5ms)
  - Decays attention over time
  - Updates attention based on resource usage
  - Triggers cognitive events

- **uv_idle**: Low-priority background tasks
  - Flushes NodeSpace deltas
  - Runs maintenance operations

## Example Output

```
========================================
Cognitive Synergy Engine Embedder
========================================

Configuration:
  Cognitive tick: 5ms
  Worker threads: 4
  Max microtasks: 100
  Attention-based: yes

Cognitive synergy engine initialized

Creating isolates...
  ✓ Reasoning isolate created (STI: 100, LTI: 90)
  ✓ Perception isolate created (STI: 80, LTI: 70)
  ✓ Planning isolate created (STI: 60, LTI: 80)
  ✓ Background isolate created (STI: 20, LTI: 50)

Engine statistics:
  Total isolates: 4
  ...
```

## Integration with OpenCog

The embedder can be extended to:

1. **Load AtomSpace**: Initialize the AtomSpace and connect it to isolates
2. **Sync Attention**: Map atom STI/LTI to isolate STI/LTI
3. **Run Agents**: Execute cognitive agents in different isolates
4. **Share Knowledge**: Use SharedArrayBuffer for zero-copy knowledge sharing

## Advanced Usage

### Custom Scheduling Policy

Implement custom scheduling by modifying `CognitiveScheduler::SelectNextIsolate()`:

```cpp
IsolateContext* CustomScheduler::SelectNextIsolate() {
  // Your custom logic here
  // Examples:
  // - Round-robin
  // - Priority queue
  // - Deadline scheduling
  // - Attention + deadline hybrid
}
```

### Memory Limits

Set per-isolate memory limits:

```cpp
v8::Isolate::CreateParams params;
params.array_buffer_allocator = ...;
params.constraints.set_max_old_space_size(100);  // 100MB limit
```

### Snapshot Support

Use V8 snapshots for faster startup:

```cpp
// Create snapshot with preloaded code
v8::StartupData snapshot = CreateSnapshot();
params.snapshot_blob = &snapshot;
```

## Next Steps

- Integrate with NodeSpace for module dependency tracking
- Add ESM loader hooks for attention-based module loading
- Implement distributed AtomSpace synchronization
- Add cognitive dashboard for real-time monitoring

## Resources

- [V8 Embedder's Guide](https://v8.dev/docs/embed)
- [Node.js Embedding Guide](https://nodejs.org/api/embedding.html)
- [libuv Documentation](https://docs.libuv.org/)
- [OpenCog Framework](https://opencog.org/)
