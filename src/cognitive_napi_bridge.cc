#include "cognitive_napi_bridge.h"
#include "node_api.h"
#include <string>

namespace node {
namespace cognitive {

std::unique_ptr<CognitiveSynergyEngine> CognitiveNAPIBridge::engine_;

// Helper to get string from napi_value
static std::string GetStringFromValue(napi_env env, napi_value value) {
  size_t length;
  napi_get_value_string_utf8(env, value, nullptr, 0, &length);
  std::string result(length, '\0');
  napi_get_value_string_utf8(env, value, &result[0], length + 1, &length);
  return result;
}

// Helper to get double from napi_value
static double GetDoubleFromValue(napi_env env, napi_value value) {
  double result;
  napi_get_value_double(env, value, &result);
  return result;
}

napi_value CognitiveNAPIBridge::CreateEngine(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  CognitiveSynergyConfig config;
  
  // Parse config object if provided
  if (argc > 0) {
    napi_value cognitive_tick_ms, worker_threads, max_microtasks;
    
    napi_get_named_property(env, args[0], "cognitiveTick", &cognitive_tick_ms);
    napi_get_value_uint32(env, cognitive_tick_ms, 
                          reinterpret_cast<uint32_t*>(&config.cognitive_tick_ms));
    
    napi_get_named_property(env, args[0], "workerThreads", &worker_threads);
    napi_get_value_int32(env, worker_threads, &config.worker_threads);
    
    napi_get_named_property(env, args[0], "maxMicrotasks", &max_microtasks);
    napi_get_value_int32(env, max_microtasks, &config.max_microtasks_per_slice);
  }
  
  engine_ = std::make_unique<CognitiveSynergyEngine>(config);
  
  if (!engine_->Initialize()) {
    napi_throw_error(env, nullptr, "Failed to initialize cognitive synergy engine");
    return nullptr;
  }
  
  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

napi_value CognitiveNAPIBridge::DestroyEngine(napi_env env, napi_callback_info info) {
  engine_.reset();
  
  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

napi_value CognitiveNAPIBridge::GetEngine(napi_env env, napi_callback_info info) {
  napi_value result;
  napi_get_boolean(env, engine_ != nullptr, &result);
  return result;
}

napi_value CognitiveNAPIBridge::CreateIsolate(napi_env env, napi_callback_info info) {
  if (!engine_) {
    napi_throw_error(env, nullptr, "Engine not initialized");
    return nullptr;
  }
  
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 1) {
    napi_throw_error(env, nullptr, "Isolate ID required");
    return nullptr;
  }
  
  std::string id = GetStringFromValue(env, args[0]);
  IsolateContext* context = engine_->CreateIsolate(id);
  
  napi_value result;
  napi_get_boolean(env, context != nullptr, &result);
  return result;
}

napi_value CognitiveNAPIBridge::DestroyIsolate(napi_env env, napi_callback_info info) {
  if (!engine_) {
    napi_throw_error(env, nullptr, "Engine not initialized");
    return nullptr;
  }
  
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 1) {
    napi_throw_error(env, nullptr, "Isolate ID required");
    return nullptr;
  }
  
  std::string id = GetStringFromValue(env, args[0]);
  engine_->DestroyIsolate(id);
  
  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

napi_value CognitiveNAPIBridge::GetIsolate(napi_env env, napi_callback_info info) {
  if (!engine_) {
    napi_throw_error(env, nullptr, "Engine not initialized");
    return nullptr;
  }
  
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 1) {
    napi_throw_error(env, nullptr, "Isolate ID required");
    return nullptr;
  }
  
  std::string id = GetStringFromValue(env, args[0]);
  IsolateContext* context = engine_->GetIsolate(id);
  
  napi_value result;
  napi_get_boolean(env, context != nullptr, &result);
  return result;
}

napi_value CognitiveNAPIBridge::SetSTI(napi_env env, napi_callback_info info) {
  if (!engine_) {
    napi_throw_error(env, nullptr, "Engine not initialized");
    return nullptr;
  }
  
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 2) {
    napi_throw_error(env, nullptr, "Isolate ID and STI value required");
    return nullptr;
  }
  
  std::string id = GetStringFromValue(env, args[0]);
  double sti = GetDoubleFromValue(env, args[1]);
  
  IsolateContext* context = engine_->GetIsolate(id);
  if (context) {
    context->SetSTI(sti);
  }
  
  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

napi_value CognitiveNAPIBridge::GetSTI(napi_env env, napi_callback_info info) {
  if (!engine_) {
    napi_throw_error(env, nullptr, "Engine not initialized");
    return nullptr;
  }
  
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 1) {
    napi_throw_error(env, nullptr, "Isolate ID required");
    return nullptr;
  }
  
  std::string id = GetStringFromValue(env, args[0]);
  IsolateContext* context = engine_->GetIsolate(id);
  
  napi_value result;
  if (context) {
    napi_create_double(env, context->GetSTI(), &result);
  } else {
    napi_create_double(env, 0.0, &result);
  }
  
  return result;
}

napi_value CognitiveNAPIBridge::SetLTI(napi_env env, napi_callback_info info) {
  if (!engine_) {
    napi_throw_error(env, nullptr, "Engine not initialized");
    return nullptr;
  }
  
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 2) {
    napi_throw_error(env, nullptr, "Isolate ID and LTI value required");
    return nullptr;
  }
  
  std::string id = GetStringFromValue(env, args[0]);
  double lti = GetDoubleFromValue(env, args[1]);
  
  IsolateContext* context = engine_->GetIsolate(id);
  if (context) {
    context->SetLTI(lti);
  }
  
  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

napi_value CognitiveNAPIBridge::GetLTI(napi_env env, napi_callback_info info) {
  if (!engine_) {
    napi_throw_error(env, nullptr, "Engine not initialized");
    return nullptr;
  }
  
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 1) {
    napi_throw_error(env, nullptr, "Isolate ID required");
    return nullptr;
  }
  
  std::string id = GetStringFromValue(env, args[0]);
  IsolateContext* context = engine_->GetIsolate(id);
  
  napi_value result;
  if (context) {
    napi_create_double(env, context->GetLTI(), &result);
  } else {
    napi_create_double(env, 0.0, &result);
  }
  
  return result;
}

napi_value CognitiveNAPIBridge::GetMemoryUsage(napi_env env, napi_callback_info info) {
  if (!engine_) {
    napi_throw_error(env, nullptr, "Engine not initialized");
    return nullptr;
  }
  
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 1) {
    napi_throw_error(env, nullptr, "Isolate ID required");
    return nullptr;
  }
  
  std::string id = GetStringFromValue(env, args[0]);
  IsolateContext* context = engine_->GetIsolate(id);
  
  napi_value result;
  if (context) {
    napi_create_int64(env, context->GetMemoryUsage(), &result);
  } else {
    napi_create_int64(env, 0, &result);
  }
  
  return result;
}

napi_value CognitiveNAPIBridge::GetStats(napi_env env, napi_callback_info info) {
  if (!engine_) {
    napi_throw_error(env, nullptr, "Engine not initialized");
    return nullptr;
  }
  
  napi_value result;
  napi_create_object(env, &result);
  
  napi_value isolate_count;
  napi_create_int64(env, engine_->scheduler()->GetIsolateCount(), &isolate_count);
  napi_set_named_property(env, result, "isolateCount", isolate_count);
  
  return result;
}

napi_value CognitiveNAPIBridge::CreateSharedBuffer(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 1) {
    napi_throw_error(env, nullptr, "Buffer size required");
    return nullptr;
  }
  
  int64_t size;
  napi_get_value_int64(env, args[0], &size);
  
  // Create a SharedArrayBuffer for zero-copy communication
  void* data;
  napi_value arraybuffer;
  napi_create_arraybuffer(env, size, &data, &arraybuffer);
  
  return arraybuffer;
}

napi_value CognitiveNAPIBridge::Init(napi_env env, napi_value exports) {
  napi_property_descriptor desc[] = {
    { "createEngine", nullptr, CreateEngine, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "destroyEngine", nullptr, DestroyEngine, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "getEngine", nullptr, GetEngine, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "createIsolate", nullptr, CreateIsolate, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "destroyIsolate", nullptr, DestroyIsolate, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "getIsolate", nullptr, GetIsolate, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "setSTI", nullptr, SetSTI, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "getSTI", nullptr, GetSTI, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "setLTI", nullptr, SetLTI, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "getLTI", nullptr, GetLTI, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "getMemoryUsage", nullptr, GetMemoryUsage, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "getStats", nullptr, GetStats, nullptr, nullptr, nullptr, napi_default, nullptr },
    { "createSharedBuffer", nullptr, CreateSharedBuffer, nullptr, nullptr, nullptr, napi_default, nullptr },
  };
  
  napi_define_properties(env, exports, sizeof(desc) / sizeof(*desc), desc);
  return exports;
}

}  // namespace cognitive
}  // namespace node

// Module initialization
NAPI_MODULE(NODE_GYP_MODULE_NAME, node::cognitive::CognitiveNAPIBridge::Init)
