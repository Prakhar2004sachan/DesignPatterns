# Design Patterns Multi-Language Repository

This repository contains design pattern implementations in **Rust**, **JavaScript**, **TypeScript**, and **C++**.

## Quick Start: Scaffold a New Pattern

To create a new pattern structure with all 4 projects:

```bash
./create-projects.sh <Folder_Name>
```

### Examples:

```bash
# Single pattern
./create-projects.sh Singleton

# Multiple patterns at once
./create-projects.sh Factory AbstractFactory Observer Strategy

# Nested directories
./create-projects.sh creational/Builder

# Interactive mode (prompts for name)
./create-projects.sh
```

---

## Structure Created

```text
<Folder_Name>/
├── rs/               # Rust (Cargo project)
│   ├── Cargo.toml
│   └── src/main.rs
├── js/               # JavaScript (Node.js ES Module)
│   ├── package.json
│   └── src/index.js
├── ts/               # TypeScript (Node.js + tsconfig)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/index.ts
├── cpp/              # C++ (CMake + Makefile, C++20)
│   ├── CMakeLists.txt
│   ├── Makefile
│   └── src/main.cpp
└── README.md         # Quick-run instructions for each language
```

---

## How to Run Each Project

Inside any generated pattern folder:

| Language | Directory | Run Command | Watch / Dev Command |
| :--- | :--- | :--- | :--- |
| **Rust** | `rs/` | `cargo run` | `cargo watch -x run` (if installed) |
| **JavaScript** | `js/` | `npm start` | `npm run dev` |
| **TypeScript** | `ts/` | `npm start` | `npm run dev` |
| **C++** | `cpp/` | `make run` | `make run` or `cmake -B build && cmake --build build` |
