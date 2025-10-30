/**
 * Minimal Cognitive Synergy Engine Embedder
 * 
 * This is a C++ application that embeds Node.js with V8+libuv
 * under OpenCog's cognitive scheduler control.
 * 
 * Compile with:
 *   g++ -std=c++17 -I../../src -I../../deps/v8/include -I../../deps/libuv/include \
 *       embedder.cc -o embedder -lnode -luv
 */

#include "../../src/cognitive_synergy_engine.h"
#include <iostream>
#include <thread>
#include <chrono>

using namespace node::cognitive;

// Example: Bootstrap script to run in isolate
const char* BOOTSTRAP_SCRIPT = R"(
  // AtomSpace integration
  const { AtomSpace, AttentionBank } = require('opencog');
  
  const atomspace = new AtomSpace();
  const attention = new AttentionBank(atomspace);
  
  // Add some knowledge
  const concept = atomspace.addNode('CONCEPT', 'CognitiveAgent');
  attention.setSTI(concept, 100);
  
  console.log('Cognitive agent initialized with attention:', attention.getSTI(concept));
  
  // Export for other isolates to access
  global.cognitiveState = {
    atomspace,
    attention,
    concept
  };
)";

int main(int argc, char** argv) {
  std::cout << "========================================\n";
  std::cout << "Cognitive Synergy Engine Embedder\n";
  std::cout << "========================================\n\n";
  
  // Configure cognitive synergy engine
  CognitiveSynergyConfig config;
  config.cognitive_tick_ms = 5;       // 5ms cognitive loop tick
  config.worker_threads = 4;           // 4 libuv worker threads
  config.max_microtasks_per_slice = 100;
  config.attention_based_scheduling = true;
  config.enable_monitoring = true;
  
  std::cout << "Configuration:\n";
  std::cout << "  Cognitive tick: " << config.cognitive_tick_ms << "ms\n";
  std::cout << "  Worker threads: " << config.worker_threads << "\n";
  std::cout << "  Max microtasks: " << config.max_microtasks_per_slice << "\n";
  std::cout << "  Attention-based: " << (config.attention_based_scheduling ? "yes" : "no") << "\n\n";
  
  // Create cognitive synergy engine
  CognitiveSynergyEngine engine(config);
  
  if (!engine.Initialize()) {
    std::cerr << "Failed to initialize cognitive synergy engine\n";
    return 1;
  }
  
  std::cout << "Cognitive synergy engine initialized\n\n";
  
  // Create isolates for different cognitive functions
  std::cout << "Creating isolates...\n";
  
  IsolateContext* reasoning = engine.CreateIsolate("reasoning");
  if (!reasoning) {
    std::cerr << "Failed to create reasoning isolate\n";
    return 1;
  }
  reasoning->SetSTI(100.0);  // High priority
  reasoning->SetLTI(90.0);
  std::cout << "  ✓ Reasoning isolate created (STI: 100, LTI: 90)\n";
  
  IsolateContext* perception = engine.CreateIsolate("perception");
  if (!perception) {
    std::cerr << "Failed to create perception isolate\n";
    return 1;
  }
  perception->SetSTI(80.0);
  perception->SetLTI(70.0);
  std::cout << "  ✓ Perception isolate created (STI: 80, LTI: 70)\n";
  
  IsolateContext* planning = engine.CreateIsolate("planning");
  if (!planning) {
    std::cerr << "Failed to create planning isolate\n";
    return 1;
  }
  planning->SetSTI(60.0);
  planning->SetLTI(80.0);
  std::cout << "  ✓ Planning isolate created (STI: 60, LTI: 80)\n";
  
  IsolateContext* background = engine.CreateIsolate("background");
  if (!background) {
    std::cerr << "Failed to create background isolate\n";
    return 1;
  }
  background->SetSTI(20.0);
  background->SetLTI(50.0);
  std::cout << "  ✓ Background isolate created (STI: 20, LTI: 50)\n\n";
  
  // Print statistics
  std::cout << "Engine statistics:\n";
  std::cout << "  Total isolates: " << engine.scheduler()->GetIsolateCount() << "\n";
  std::cout << "  Memory usage:\n";
  std::cout << "    - Reasoning: " << reasoning->GetMemoryUsage() << " bytes\n";
  std::cout << "    - Perception: " << perception->GetMemoryUsage() << " bytes\n";
  std::cout << "    - Planning: " << planning->GetMemoryUsage() << " bytes\n";
  std::cout << "    - Background: " << background->GetMemoryUsage() << " bytes\n\n";
  
  // Start the cognitive loop
  std::cout << "Starting cognitive synergy engine...\n\n";
  std::cout << "The cognitive loop is now running:\n";
  std::cout << "  • uv_prepare: Attention allocation & task scheduling\n";
  std::cout << "  • uv_check: Microtask checkpoints\n";
  std::cout << "  • uv_timer: Cognitive loop ticks (every 5ms)\n";
  std::cout << "  • uv_idle: Background maintenance\n\n";
  
  // Run for a short time to demonstrate
  std::thread runner([&engine]() {
    // Run the event loop
    engine.Run();
  });
  
  // Simulate attention changes
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  
  std::cout << "Simulating attention changes...\n";
  reasoning->SetSTI(reasoning->GetSTI() + 20);  // Boost reasoning
  background->SetSTI(background->GetSTI() * 0.8);  // Decay background
  
  std::cout << "  ✓ Boosted reasoning STI to: " << reasoning->GetSTI() << "\n";
  std::cout << "  ✓ Decayed background STI to: " << background->GetSTI() << "\n\n";
  
  // Let it run for a bit more
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  
  // Stop the engine
  std::cout << "Stopping cognitive synergy engine...\n";
  engine.Stop();
  
  if (runner.joinable()) {
    runner.join();
  }
  
  std::cout << "\n";
  std::cout << "Final statistics:\n";
  std::cout << "  Reasoning STI: " << reasoning->GetSTI() << "\n";
  std::cout << "  Perception STI: " << perception->GetSTI() << "\n";
  std::cout << "  Planning STI: " << planning->GetSTI() << "\n";
  std::cout << "  Background STI: " << background->GetSTI() << "\n\n";
  
  // Cleanup
  std::cout << "Cleaning up...\n";
  engine.DestroyIsolate("reasoning");
  engine.DestroyIsolate("perception");
  engine.DestroyIsolate("planning");
  engine.DestroyIsolate("background");
  
  std::cout << "\n========================================\n";
  std::cout << "Cognitive Synergy Engine Stopped\n";
  std::cout << "========================================\n";
  
  return 0;
}
