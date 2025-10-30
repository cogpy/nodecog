#include "cognitive_napi_bridge.h"
#include "node_binding.h"
#include "env.h"
#include "util.h"
#include "v8.h"

namespace node {
namespace cognitive {

using v8::Context;
using v8::FunctionCallbackInfo;
using v8::Local;
using v8::Object;
using v8::Value;
using v8::Number;
using v8::Boolean;

std::unique_ptr<CognitiveSynergyEngine> CognitiveNAPIBridge::engine_;

// V8-style binding methods
static void CreateEngine(const FunctionCallbackInfo<Value>& args) {
  CognitiveSynergyConfig config;
  // TODO: Parse config from args[0]
  
  CognitiveNAPIBridge::engine_ = std::make_unique<CognitiveSynergyEngine>(config);
  
  if (!CognitiveNAPIBridge::engine_->Initialize()) {
    // Note: Can't easily throw error without Environment, so just return false
    args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), false));
    return;
  }
  
  args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), true));
}

static void DestroyEngine(const FunctionCallbackInfo<Value>& args) {
  CognitiveNAPIBridge::engine_.reset();
  args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), true));
}

static void GetEngine(const FunctionCallbackInfo<Value>& args) {
  bool exists = CognitiveNAPIBridge::engine_ != nullptr;
  args.GetReturnValue().Set(Boolean::New(args.GetIsolate(), exists));
}

// V8-style initialization function for internal binding
void Initialize(Local<Object> exports,
                Local<Value> module,
                Local<Context> context,
                void* priv) {
  // Use SetFastMethodNoSideEffect for binding methods
  // These are simpler and don't require Environment
  exports->Set(context,
               FIXED_ONE_BYTE_STRING(context->GetIsolate(), "createEngine"),
               v8::FunctionTemplate::New(context->GetIsolate(), CreateEngine)
                   ->GetFunction(context).ToLocalChecked()).Check();
  
  exports->Set(context,
               FIXED_ONE_BYTE_STRING(context->GetIsolate(), "destroyEngine"),
               v8::FunctionTemplate::New(context->GetIsolate(), DestroyEngine)
                   ->GetFunction(context).ToLocalChecked()).Check();
  
  exports->Set(context,
               FIXED_ONE_BYTE_STRING(context->GetIsolate(), "getEngine"),
               v8::FunctionTemplate::New(context->GetIsolate(), GetEngine)
                   ->GetFunction(context).ToLocalChecked()).Check();
}

}  // namespace cognitive
}  // namespace node

// Register the internal binding
NODE_BINDING_CONTEXT_AWARE_INTERNAL(cognitive_synergy, 
                                     node::cognitive::Initialize)
