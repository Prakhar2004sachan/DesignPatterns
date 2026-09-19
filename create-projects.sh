#!/usr/bin/env bash

set -euo pipefail

# -----------------------------------------------------------------------------
# Multi-Language Project Scaffolder (Rust, JavaScript, TypeScript, C++)
# Structure created:
#   <Folder_Name>/
#   ├── rs/       (Rust - Cargo project)
#   ├── js/       (JavaScript - Node.js ES Modules)
#   ├── ts/       (TypeScript - Node.js + tsconfig)
#   ├── cpp/      (C++ - CMakeLists.txt + Makefile)
#   └── README.md (Quick-run guide)
# -----------------------------------------------------------------------------

# Colors for terminal output
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_banner() {
  echo -e "${BOLD}${CYAN}======================================================${NC}"
  echo -e "${BOLD}${CYAN}   Multi-Language Project Generator (rs, js, ts, cpp) ${NC}"
  echo -e "${BOLD}${CYAN}======================================================${NC}"
}

usage() {
  echo -e "${BOLD}Usage:${NC}"
  echo -e "  $0 <folder_name_1> [folder_name_2 ...]"
  echo -e "  $0                 # (Interactive mode)"
  echo ""
  echo -e "${BOLD}Examples:${NC}"
  echo -e "  $0 FactoryPattern"
  echo -e "  $0 \"Abstract Factory\" Singleton Observer"
  exit 0
}

# Check for help flag
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
fi

# Sanitize strings for package / identifier names
sanitize_pkg_name() {
  local raw="$1"
  local clean
  clean=$(echo "$raw" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed -E 's/[^a-z0-9_-]//g')
  # Ensure it does not start with a digit or hyphen
  if [[ "$clean" =~ ^[0-9-] ]]; then
    clean="p_${clean}"
  fi
  if [ -z "$clean" ]; then
    clean="project"
  fi
  echo "$clean"
}

sanitize_ident_name() {
  local raw="$1"
  local clean
  clean=$(echo "$raw" | tr ' ' '_' | sed -E 's/[^a-zA-Z0-9_]//g')
  if [[ "$clean" =~ ^[0-9] ]]; then
    clean="p_${clean}"
  fi
  if [ -z "$clean" ]; then
    clean="project"
  fi
  echo "$clean"
}

scaffold_project() {
  local target_dir="$1"
  local base_name
  base_name="$(basename "$target_dir")"
  local pkg_name
  pkg_name="$(sanitize_pkg_name "$base_name")"
  local ident_name
  ident_name="$(sanitize_ident_name "$base_name")"

  echo -e "\n${BOLD}${BLUE}==> Creating project suite in: ${GREEN}${target_dir}${NC}"

  # Create root target folder
  mkdir -p "$target_dir"

  # ---------------------------------------------------------------------------
  # 1. Rust Project (rs)
  # ---------------------------------------------------------------------------
  local rs_dir="$target_dir/rs"
  mkdir -p "$rs_dir/src"

  local rs_pkg="${pkg_name}_rs"
  # Try cargo init if cargo is installed, otherwise fallback to template
  if command -v cargo &>/dev/null; then
    (
      cd "$rs_dir"
      cargo init --bin --vcs none --name "$rs_pkg" --quiet 2>/dev/null || true
    )
  fi

  # Ensure Cargo.toml exists
  if [[ ! -f "$rs_dir/Cargo.toml" ]]; then
    cat <<EOF > "$rs_dir/Cargo.toml"
[package]
name = "${rs_pkg}"
version = "0.1.0"
edition = "2021"

[dependencies]
EOF
  fi

  # Populate src/main.rs with informative starter code
  cat <<EOF > "$rs_dir/src/main.rs"
fn main() {
    println!("=== [Rust] ${base_name} ===");
    // TODO: Implement ${base_name} pattern in Rust
}
EOF

  cat <<EOF > "$rs_dir/.gitignore"
/target
**/*.rs.bk
Cargo.lock
EOF

  echo -e "  ${GREEN}[✓]${NC} Rust project (${CYAN}rs/${NC})"

  # ---------------------------------------------------------------------------
  # 2. JavaScript Project (js)
  # ---------------------------------------------------------------------------
  local js_dir="$target_dir/js"
  mkdir -p "$js_dir/src"

  cat <<EOF > "$js_dir/package.json"
{
  "name": "${pkg_name}-js",
  "version": "1.0.0",
  "description": "${base_name} implementation in JavaScript",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
EOF

  cat <<EOF > "$js_dir/src/index.js"
// ${base_name} Pattern - JavaScript Implementation

function main() {
  console.log("=== [JavaScript] ${base_name} ===");
  // TODO: Implement ${base_name} pattern in JavaScript
}

main();
EOF

  cat <<EOF > "$js_dir/.gitignore"
node_modules/
.DS_Store
EOF

  echo -e "  ${GREEN}[✓]${NC} JavaScript project (${CYAN}js/${NC})"

  # ---------------------------------------------------------------------------
  # 3. TypeScript Project (ts)
  # ---------------------------------------------------------------------------
  local ts_dir="$target_dir/ts"
  mkdir -p "$ts_dir/src"

  cat <<EOF > "$ts_dir/package.json"
{
  "name": "${pkg_name}-ts",
  "version": "1.0.0",
  "description": "${base_name} implementation in TypeScript",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "start": "node --experimental-strip-types src/index.ts",
    "dev": "node --watch --experimental-strip-types src/index.ts",
    "build": "tsc",
    "run:dist": "node dist/index.js"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

  cat <<EOF > "$ts_dir/tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
EOF

  cat <<EOF > "$ts_dir/src/index.ts"
// ${base_name} Pattern - TypeScript Implementation

function main(): void {
  console.log("=== [TypeScript] ${base_name} ===");
  // TODO: Implement ${base_name} pattern in TypeScript
}

main();
EOF

  cat <<EOF > "$ts_dir/.gitignore"
node_modules/
dist/
.DS_Store
EOF

  echo -e "  ${GREEN}[✓]${NC} TypeScript project (${CYAN}ts/${NC})"

  # ---------------------------------------------------------------------------
  # 4. C++ Project (cpp)
  # ---------------------------------------------------------------------------
  local cpp_dir="$target_dir/cpp"
  mkdir -p "$cpp_dir/src"

  local cpp_bin="${ident_name}"

  cat <<EOF > "$cpp_dir/CMakeLists.txt"
cmake_minimum_required(VERSION 3.15)
project(${ident_name}_cpp CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(${cpp_bin} src/main.cpp)
EOF

  cat <<EOF > "$cpp_dir/Makefile"
SDKROOT ?= \$(shell xcrun --sdk macosx --show-sdk-path 2>/dev/null)
SYSROOT_FLAG = \$(if \$(SDKROOT),-isysroot \$(SDKROOT),)

CXX ?= clang++
CXXFLAGS ?= -std=c++20 -Wall -Wextra -O2 \$(SYSROOT_FLAG)
SRC = src/main.cpp
TARGET = bin/${cpp_bin}

all: build

build:
	@mkdir -p bin
	\$(CXX) \$(CXXFLAGS) \$(SRC) -o \$(TARGET)

run: build
	@./\$(TARGET)

clean:
	rm -rf bin build

.PHONY: all build run clean
EOF

  cat <<EOF > "$cpp_dir/src/main.cpp"
#include <iostream>

// ${base_name} Pattern - C++ Implementation

int main() {
    std::cout << "=== [C++] ${base_name} ===" << std::endl;
    // TODO: Implement ${base_name} pattern in C++
    return 0;
}
EOF

  cat <<EOF > "$cpp_dir/.gitignore"
bin/
build/
*.o
*.out
compile_commands.json
.DS_Store
EOF

  echo -e "  ${GREEN}[✓]${NC} C++ project (${CYAN}cpp/${NC})"

  # ---------------------------------------------------------------------------
  # 5. Root README.md
  # ---------------------------------------------------------------------------
  cat <<EOF > "$target_dir/README.md"
# ${base_name}

Implementations of the **${base_name}** pattern across 4 languages:
- [Rust](./rs) (\`rs\`)
- [JavaScript](./js) (\`js\`)
- [TypeScript](./ts) (\`ts\`)
- [C++](./cpp) (\`cpp\`)

---

## Quick Run Guide

### 🦀 Rust (\`rs\`)
\`\`\`bash
cd rs
cargo run
\`\`\`

### 🟨 JavaScript (\`js\`)
\`\`\`bash
cd js
npm start
# or watch mode:
npm run dev
\`\`\`

### 🔷 TypeScript (\`ts\`)
\`\`\`bash
cd ts
# Direct run (Node 22 native type stripping):
npm start
# or watch mode:
npm run dev
\`\`\`

### ⚡ C++ (\`cpp\`)
\`\`\`bash
cd cpp
# Quick build and run with Makefile:
make run

# Or with CMake:
cmake -B build && cmake --build build && ./build/${cpp_bin}
\`\`\`
EOF

  echo -e "  ${GREEN}[✓]${NC} Guide (${CYAN}README.md${NC})"
  echo -e "${GREEN}${BOLD}Done!${NC} Scaffolded ${target_dir} -> (rs, js, ts, cpp)"
}

# Main execution
print_banner

TARGETS=("$@")

# If no arguments provided, prompt interactively
if [ ${#TARGETS[@]} -eq 0 ]; then
  read -rp "Enter folder name for the project: " input_name
  if [ -z "$input_name" ]; then
    echo -e "${RED}Error: Folder name cannot be empty.${NC}"
    exit 1
  fi
  TARGETS=("$input_name")
fi

for target in "${TARGETS[@]}"; do
  scaffold_project "$target"
done

echo -e "\n${BOLD}${GREEN}All projects created successfully!${NC}\n"
