cmake_minimum_required(VERSION 3.10)
project(CognitiveSynergyEmbedder)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Node.js
find_package(PkgConfig REQUIRED)

# Set Node.js paths (adjust these paths based on your Node.js installation)
set(NODE_SRC_DIR "${CMAKE_SOURCE_DIR}/../..")
set(NODE_INCLUDE_DIR "${NODE_SRC_DIR}/src")
set(NODE_DEPS_DIR "${NODE_SRC_DIR}/deps")

# Include directories
include_directories(
  ${NODE_INCLUDE_DIR}
  ${NODE_DEPS_DIR}/v8/include
  ${NODE_DEPS_DIR}/libuv/include
)

# Source files
set(SOURCES
  embedder.cc
  ${NODE_SRC_DIR}/src/cognitive_synergy_engine.cc
)

# Create executable
add_executable(embedder ${SOURCES})

# Link libraries
# Note: You may need to adjust these library paths
target_link_libraries(embedder
  # Link against Node.js libraries (if available as shared library)
  # Otherwise, you'll need to build Node.js and link against libnode
  pthread
  dl
)

# Installation
install(TARGETS embedder DESTINATION bin)

# Print configuration
message(STATUS "Node.js source directory: ${NODE_SRC_DIR}")
message(STATUS "Node.js include directory: ${NODE_INCLUDE_DIR}")
message(STATUS "V8 include directory: ${NODE_DEPS_DIR}/v8/include")
message(STATUS "libuv include directory: ${NODE_DEPS_DIR}/libuv/include")
