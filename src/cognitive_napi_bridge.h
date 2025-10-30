#ifndef SRC_COGNITIVE_NAPI_BRIDGE_H_
#define SRC_COGNITIVE_NAPI_BRIDGE_H_

#include "node_api.h"
#include "cognitive_synergy_engine.h"
#include <memory>

namespace node {
namespace cognitive {

// N-API bridge to expose cognitive synergy engine to JavaScript
class CognitiveNAPIBridge {
 public:
  // Initialize the N-API module
  static napi_value Init(napi_env env, napi_value exports);
  
 private:
  // Engine lifecycle
  static napi_value CreateEngine(napi_env env, napi_callback_info info);
  static napi_value DestroyEngine(napi_env env, napi_callback_info info);
  static napi_value GetEngine(napi_env env, napi_callback_info info);
  
  // Isolate management
  static napi_value CreateIsolate(napi_env env, napi_callback_info info);
  static napi_value DestroyIsolate(napi_env env, napi_callback_info info);
  static napi_value GetIsolate(napi_env env, napi_callback_info info);
  
  // Attention management
  static napi_value SetSTI(napi_env env, napi_callback_info info);
  static napi_value GetSTI(napi_env env, napi_callback_info info);
  static napi_value SetLTI(napi_env env, napi_callback_info info);
  static napi_value GetLTI(napi_env env, napi_callback_info info);
  
  // Scheduler control
  static napi_value SelectNextIsolate(napi_env env, napi_callback_info info);
  static napi_value UpdateAttention(napi_env env, napi_callback_info info);
  static napi_value DecayAttention(napi_env env, napi_callback_info info);
  
  // Statistics
  static napi_value GetMemoryUsage(napi_env env, napi_callback_info info);
  static napi_value GetStats(napi_env env, napi_callback_info info);
  
  // Shared memory for zero-copy communication
  static napi_value CreateSharedBuffer(napi_env env, napi_callback_info info);
  
  // Global engine instance
  static std::unique_ptr<CognitiveSynergyEngine> engine_;
};

}  // namespace cognitive
}  // namespace node

#endif  // SRC_COGNITIVE_NAPI_BRIDGE_H_
