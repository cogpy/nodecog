#ifndef SRC_COGNITIVE_NAPI_BRIDGE_H_
#define SRC_COGNITIVE_NAPI_BRIDGE_H_

#include "cognitive_synergy_engine.h"
#include <memory>

namespace node {
namespace cognitive {

// Bridge to expose cognitive synergy engine to JavaScript
class CognitiveNAPIBridge {
 public:
  // Global engine instance
  static std::unique_ptr<CognitiveSynergyEngine> engine_;
};

// V8-style initialization function
void Initialize(v8::Local<v8::Object> exports,
                v8::Local<v8::Value> module,
                v8::Local<v8::Context> context,
                void* priv);

}  // namespace cognitive
}  // namespace node

#endif  // SRC_COGNITIVE_NAPI_BRIDGE_H_
