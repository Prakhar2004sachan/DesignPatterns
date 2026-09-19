# 02_Builder_Exercise

Implementations of the **02_Builder_Exercise** pattern across 4 languages:
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
cmake -B build && cmake --build build && ./build/p_02_Builder_Exercise
```


Exercise

Build a Builder for an HTTP request object in Rust, C++, JavaScript, and TypeScript.

Product — HttpRequest with:

method (required)
url (required)
headers (map, optional, default empty)
body (optional)
timeoutMs (optional, default 30_000)
followRedirects (optional, default true)
Requirements:

Create a builder with fluent, chainable methods for each field.
build() must validate that method and url are set. If not, return an error (Rust Result, C++ exception or std::optional, JS/TS throw).
The resulting HttpRequest should be immutable — no setters after construction.
The builder should not be reusable after build() in Rust and C++ (enforce via ownership / &&).
Language-specific requirements:

Rust: Implement two versions — one fluent with self by value, one typestate where build() only exists after method and url are set. Compare.
C++: Implement one fluent version with && on build(). Add a [[nodiscard]] attribute. Use std::optional for optional fields.
JavaScript: Implement one class-based version with #private fields, and one closure-based version. Compare line count and readability.
TypeScript: Implement one interface-based fluent builder and one closure-based builder using satisfies. Then implement a compile-time required-fields version where build() is only callable after .method() and .url() — using the this parameter trick from section 10c.
Then answer:

How many lines does each language need to express the same idea?
Which language gives you compile-time safety on required fields? Which gives it at runtime? Which gives none?
What happens if you add a new optional field, retries? Which languages make that a one-line change? Which require touching multiple places?
Would you actually use a builder for this in production, or would you prefer a config object? Justify.