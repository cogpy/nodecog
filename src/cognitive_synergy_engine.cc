#include "cognitive_synergy_engine.h"
#include "env-inl.h"
#include "node_errors.h"
#include "util-inl.h"
#include <algorithm>

namespace node {
namespace cognitive {

// =============================================================================
// IsolateContext Implementation
// =============================================================================

IsolateContext::IsolateContext(v8::Isolate* isolate,
                               node::Environment* env,
                               const std::string& id)
    : isolate_(isolate), env_(env), id_(id) {
  // Initialize with default attention values
}

IsolateContext::~IsolateContext() {
  // Cleanup handled by caller
}

void IsolateContext::ExecuteTasks(int max_microtasks) {
  if (!isolate_) return;
  
  v8::Isolate::Scope isolate_scope(isolate_);
  v8::HandleScope handle_scope(isolate_);
  
  // Execute microtask checkpoint
  // Note: In modern V8, PerformMicrotaskCheckpoint doesn't return a value
  // We execute it once per task slice
  isolate_->PerformMicrotaskCheckpoint();
}

void IsolateContext::PerformMicrotaskCheckpoint() {
  if (!isolate_) return;
  
  v8::Isolate::Scope isolate_scope(isolate_);
  v8::HandleScope handle_scope(isolate_);
  isolate_->PerformMicrotaskCheckpoint();
}

size_t IsolateContext::GetMemoryUsage() const {
  if (!isolate_) return 0;
  
  v8::HeapStatistics stats;
  isolate_->GetHeapStatistics(&stats);
  return stats.used_heap_size();
}

double IsolateContext::GetCPUTime() const {
  // Return accumulated CPU time
  return cpu_time_;
}

// =============================================================================
// CognitiveScheduler Implementation
// =============================================================================

CognitiveScheduler::CognitiveScheduler(const CognitiveSynergyConfig& config)
    : config_(config) {
}

CognitiveScheduler::~CognitiveScheduler() {
}

IsolateContext* CognitiveScheduler::SelectNextIsolate() {
  if (isolates_.empty()) return nullptr;
  
  if (!config_.attention_based_scheduling) {
    // Round-robin scheduling
    current_index_ = (current_index_ + 1) % isolates_.size();
    return isolates_[current_index_];
  }
  
  // Attention-based scheduling: select isolate with highest STI
  IsolateContext* selected = nullptr;
  double max_sti = -1.0;
  
  for (auto* context : isolates_) {
    double sti = context->GetSTI();
    if (sti > max_sti) {
      max_sti = sti;
      selected = context;
    }
  }
  
  return selected;
}

void CognitiveScheduler::UpdateAttention() {
  // Update attention based on resource usage
  for (auto* context : isolates_) {
    size_t memory = context->GetMemoryUsage();
    
    // Adjust STI based on memory pressure
    // Higher memory usage slightly decreases STI
    double memory_factor = 1.0 - (memory / (1024.0 * 1024.0 * 100.0));  // Normalize to 100MB
    memory_factor = std::max(0.5, std::min(1.0, memory_factor));
    
    double current_sti = context->GetSTI();
    context->SetSTI(current_sti * memory_factor);
  }
}

void CognitiveScheduler::DecayAttention() {
  // Apply attention decay
  const double decay_rate = 0.99;  // 1% decay per tick
  
  for (auto* context : isolates_) {
    double sti = context->GetSTI();
    context->SetSTI(sti * decay_rate);
    
    // Prevent STI from going too low
    if (context->GetSTI() < 1.0) {
      context->SetSTI(1.0);
    }
  }
}

void CognitiveScheduler::RegisterIsolate(IsolateContext* context) {
  isolates_.push_back(context);
}

void CognitiveScheduler::UnregisterIsolate(const std::string& id) {
  isolates_.erase(
    std::remove_if(isolates_.begin(), isolates_.end(),
                   [&id](IsolateContext* ctx) { return ctx->id() == id; }),
    isolates_.end());
}

// =============================================================================
// CognitiveSynergyEngine Implementation
// =============================================================================

CognitiveSynergyEngine::CognitiveSynergyEngine(
    const CognitiveSynergyConfig& config)
    : config_(config), loop_(nullptr) {
  scheduler_ = std::make_unique<CognitiveScheduler>(config);
}

CognitiveSynergyEngine::~CognitiveSynergyEngine() {
  Stop();
  
  // Cleanup isolates
  isolates_.clear();
  
  // Cleanup libuv handles
  if (running_) {
    uv_prepare_stop(&prepare_handle_);
    uv_check_stop(&check_handle_);
    uv_timer_stop(&cognitive_timer_);
    uv_idle_stop(&idle_handle_);
  }
  
  // Cleanup platform
  platform_.reset();
  
  // Cleanup loop
  if (loop_) {
    uv_loop_close(loop_);
  }
}

bool CognitiveSynergyEngine::Initialize() {
  // Create libuv loop
  loop_ = uv_default_loop();
  if (!loop_) {
    return false;
  }
  
  // Initialize V8 platform
  platform_ = node::MultiIsolatePlatform::Create(config_.worker_threads);
  v8::V8::InitializePlatform(platform_.get());
  v8::V8::Initialize();
  
  // Initialize libuv hooks
  InitializeLibuvHooks();
  
  return true;
}

void CognitiveSynergyEngine::InitializeLibuvHooks() {
  // uv_prepare: runs before I/O polling
  // Used for attention allocation and task scheduling
  uv_prepare_init(loop_, &prepare_handle_);
  prepare_handle_.data = this;
  uv_prepare_start(&prepare_handle_, OnPrepare);
  
  // uv_check: runs after I/O polling
  // Used for microtask checkpoints
  uv_check_init(loop_, &check_handle_);
  check_handle_.data = this;
  uv_check_start(&check_handle_, OnCheck);
  
  // uv_timer: cognitive loop tick
  uv_timer_init(loop_, &cognitive_timer_);
  cognitive_timer_.data = this;
  uv_timer_start(&cognitive_timer_, OnCognitiveTick, 0, config_.cognitive_tick_ms);
  
  // uv_idle: background tasks
  uv_idle_init(loop_, &idle_handle_);
  idle_handle_.data = this;
  uv_idle_start(&idle_handle_, OnIdle);
}

void CognitiveSynergyEngine::OnPrepare(uv_prepare_t* handle) {
  auto* engine = static_cast<CognitiveSynergyEngine*>(handle->data);
  
  // Select next isolate to run based on attention
  engine->current_isolate_ = engine->scheduler_->SelectNextIsolate();
  
  // If we have an isolate, allow it to execute tasks
  if (engine->current_isolate_) {
    // Execute pending foreground tasks for this isolate
    engine->current_isolate_->ExecuteTasks(
        engine->config_.max_microtasks_per_slice);
  }
}

void CognitiveSynergyEngine::OnCheck(uv_check_t* handle) {
  auto* engine = static_cast<CognitiveSynergyEngine*>(handle->data);
  
  // Perform microtask checkpoints for all isolates that ran
  if (engine->current_isolate_) {
    engine->current_isolate_->PerformMicrotaskCheckpoint();
  }
}

void CognitiveSynergyEngine::OnCognitiveTick(uv_timer_t* handle) {
  auto* engine = static_cast<CognitiveSynergyEngine*>(handle->data);
  
  // Cognitive loop operations
  engine->scheduler_->DecayAttention();
  engine->scheduler_->UpdateAttention();
  
  // TODO: Call into AtomSpace attention allocation
  // TODO: Emit cognitive loop events
}

void CognitiveSynergyEngine::OnIdle(uv_idle_t* handle) {
  auto* engine = static_cast<CognitiveSynergyEngine*>(handle->data);
  
  // Low-priority background tasks
  // TODO: Flush NodeSpace deltas to AtomSpace
  // TODO: Run maintenance tasks
  
  // Don't hog CPU in idle
  uv_idle_stop(handle);
}

IsolateContext* CognitiveSynergyEngine::CreateIsolate(const std::string& id) {
  // Create isolate
  v8::Isolate::CreateParams params;
  params.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
  
  v8::Isolate* isolate = v8::Isolate::New(params);
  if (!isolate) {
    return nullptr;
  }
  
  // Create Node environment
  v8::Isolate::Scope isolate_scope(isolate);
  v8::HandleScope handle_scope(isolate);
  v8::Local<v8::Context> context = v8::Context::New(isolate);
  
  node::IsolateData* isolate_data = 
      node::CreateIsolateData(isolate, loop_, platform_.get());
  
  std::vector<std::string> args;
  std::vector<std::string> exec_args;
  node::Environment* env = 
      node::CreateEnvironment(isolate_data, context, args, exec_args);
  
  // Create isolate context
  auto context_ptr = std::make_unique<IsolateContext>(isolate, env, id);
  auto* result = context_ptr.get();
  
  isolates_[id] = std::move(context_ptr);
  scheduler_->RegisterIsolate(result);
  
  return result;
}

void CognitiveSynergyEngine::DestroyIsolate(const std::string& id) {
  auto it = isolates_.find(id);
  if (it == isolates_.end()) return;
  
  auto* context = it->second.get();
  
  // Unregister from scheduler
  scheduler_->UnregisterIsolate(id);
  
  // Cleanup environment
  if (context->environment()) {
    node::FreeEnvironment(context->environment());
  }
  
  // Cleanup isolate
  if (context->isolate()) {
    context->isolate()->Dispose();
  }
  
  // Remove from map
  isolates_.erase(it);
}

IsolateContext* CognitiveSynergyEngine::GetIsolate(const std::string& id) {
  auto it = isolates_.find(id);
  if (it == isolates_.end()) return nullptr;
  return it->second.get();
}

void CognitiveSynergyEngine::Start() {
  running_ = true;
}

void CognitiveSynergyEngine::Stop() {
  running_ = false;
  
  if (uv_loop_alive(loop_)) {
    uv_stop(loop_);
  }
}

int CognitiveSynergyEngine::Run() {
  Start();
  return uv_run(loop_, UV_RUN_DEFAULT);
}

}  // namespace cognitive
}  // namespace node
