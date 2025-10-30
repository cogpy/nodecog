#ifndef SRC_COGNITIVE_SYNERGY_ENGINE_H_
#define SRC_COGNITIVE_SYNERGY_ENGINE_H_

#include <memory>
#include <unordered_map>
#include <vector>
#include "v8.h"
#include "uv.h"
#include "node.h"
#include "node_platform.h"

namespace node {
namespace cognitive {

// Forward declarations
class CognitiveScheduler;
class IsolateContext;

// Configuration for cognitive synergy engine
struct CognitiveSynergyConfig {
  // Cognitive loop tick interval in milliseconds
  uint64_t cognitive_tick_ms = 5;
  
  // Number of worker threads for libuv threadpool
  int worker_threads = 4;
  
  // Maximum microtasks per isolate per slice
  int max_microtasks_per_slice = 100;
  
  // Enable attention-based scheduling
  bool attention_based_scheduling = true;
  
  // Enable performance monitoring
  bool enable_monitoring = true;
};

// Represents an isolated V8 execution context with cognitive control
class IsolateContext {
 public:
  IsolateContext(v8::Isolate* isolate,
                 node::Environment* env,
                 const std::string& id);
  ~IsolateContext();
  
  // Execute pending tasks for this isolate
  void ExecuteTasks(int max_microtasks);
  
  // Perform microtask checkpoint
  void PerformMicrotaskCheckpoint();
  
  // Get/Set attention values
  void SetSTI(double sti) { sti_ = sti; }
  double GetSTI() const { return sti_; }
  void SetLTI(double lti) { lti_ = lti; }
  double GetLTI() const { return lti_; }
  
  // Get isolate and environment
  v8::Isolate* isolate() const { return isolate_; }
  node::Environment* environment() const { return env_; }
  const std::string& id() const { return id_; }
  
  // Resource tracking
  size_t GetMemoryUsage() const;
  double GetCPUTime() const;
  
 private:
  v8::Isolate* isolate_;
  node::Environment* env_;
  std::string id_;
  
  // Attention economics
  double sti_ = 50.0;  // Short-term importance
  double lti_ = 50.0;  // Long-term importance
  
  // Performance metrics
  size_t memory_usage_ = 0;
  double cpu_time_ = 0.0;
};

// Cognitive scheduler that decides which isolate runs when
class CognitiveScheduler {
 public:
  explicit CognitiveScheduler(const CognitiveSynergyConfig& config);
  ~CognitiveScheduler();
  
  // Select next isolate to run based on STI/LTI
  IsolateContext* SelectNextIsolate();
  
  // Update attention values
  void UpdateAttention();
  
  // Decay attention over time
  void DecayAttention();
  
  // Register/unregister isolates
  void RegisterIsolate(IsolateContext* context);
  void UnregisterIsolate(const std::string& id);
  
  // Get statistics
  size_t GetIsolateCount() const { return isolates_.size(); }
  
 private:
  CognitiveSynergyConfig config_;
  std::vector<IsolateContext*> isolates_;
  size_t current_index_ = 0;
};

// Main cognitive synergy engine
class CognitiveSynergyEngine {
 public:
  explicit CognitiveSynergyEngine(const CognitiveSynergyConfig& config);
  ~CognitiveSynergyEngine();
  
  // Initialize the engine
  bool Initialize();
  
  // Create a new isolate with cognitive control
  IsolateContext* CreateIsolate(const std::string& id);
  
  // Destroy an isolate
  void DestroyIsolate(const std::string& id);
  
  // Get isolate by id
  IsolateContext* GetIsolate(const std::string& id);
  
  // Start the cognitive loop
  void Start();
  
  // Stop the cognitive loop
  void Stop();
  
  // Run the event loop (blocking)
  int Run();
  
  // Get the libuv loop
  uv_loop_t* loop() { return loop_; }
  
  // Get the platform
  node::MultiIsolatePlatform* platform() { return platform_.get(); }
  
  // Get the scheduler
  CognitiveScheduler* scheduler() { return scheduler_.get(); }
  
 private:
  // libuv callbacks
  static void OnPrepare(uv_prepare_t* handle);
  static void OnCheck(uv_check_t* handle);
  static void OnCognitiveTick(uv_timer_t* handle);
  static void OnIdle(uv_idle_t* handle);
  
  // Initialize libuv hooks
  void InitializeLibuvHooks();
  
  CognitiveSynergyConfig config_;
  uv_loop_t* loop_;
  std::unique_ptr<node::MultiIsolatePlatform> platform_;
  std::unique_ptr<CognitiveScheduler> scheduler_;
  
  // libuv handles
  uv_prepare_t prepare_handle_;
  uv_check_t check_handle_;
  uv_timer_t cognitive_timer_;
  uv_idle_t idle_handle_;
  
  // Isolate management
  std::unordered_map<std::string, std::unique_ptr<IsolateContext>> isolates_;
  
  // State
  bool running_ = false;
  IsolateContext* current_isolate_ = nullptr;
};

}  // namespace cognitive
}  // namespace node

#endif  // SRC_COGNITIVE_SYNERGY_ENGINE_H_
