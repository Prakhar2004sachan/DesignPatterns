# Abstract_Factory

Implementations of the **Abstract_Factory** pattern across 4 languages:
- [Rust](./rs) (`rs`)
- [JavaScript](./js) (`js`)
- [TypeScript](./ts) (`ts`)
- [C++](./cpp) (`cpp`)

---

## Quick Run Guide

### 🦀 Rust (`rs`)
```bash
cd rs
cargo run
```

### 🟨 JavaScript (`js`)
```bash
cd js
npm start
# or watch mode:
npm run dev
```

### 🔷 TypeScript (`ts`)
```bash
cd ts
# Direct run (Node 22 native type stripping):
npm start
# or watch mode:
npm run dev
```

### ⚡ C++ (`cpp`)
```bash
cd cpp
# Quick build and run with Makefile:
make run

# Or with CMake:
cmake -B build && cmake --build build && ./build/Abstract_Factory
```

## Tradeoffs

### Pros

- Guarantees product family consistency.
- Isolates concrete classes from client.
- Easy to swap entire families (e.g., theming, platform).
- Supports Open/Closed for new families.

### Cons

- Adding a new product type (e.g., Scrollbar) forces changes in every factory — this is the well-known "extensibility axis" problem.
- More classes / traits / indirection.
- Overkill when there is only one family, or when families are open-ended and unstable.

## When to use

- Systems that must be independent of how their products are created.
- Multiple platform/variant families that must stay consistent.
- A library that should be configured with a family by the user.

## When NOT to use

- Only one family ever exists → just instantiate directly.
- Only one product per factory → use Factory Method.
- Families change constantly → consider a registry or DI container instead.