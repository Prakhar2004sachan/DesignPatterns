# 01_Abstract_Factory_Exercise

Implementations of the **01_Abstract_Factory_Exercise** pattern across 4 languages:
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
cmake -B build && cmake --build build && ./build/p_01_Abstract_Factory_Exercise
```

# Exercise

Build an Abstract Factory for a database layer with two product families:

* Products: Connection, Command
* Families: Postgres, MySQL

### Requirements:

- Connection exposes connect() and close().
- Command exposes execute(sql) and prepare(sql).
- A factory DatabaseFactory creates both.
- A client function runQuery(factory, sql) uses the factory without knowing which DB it is.
- Implement it in Rust, C++, and JavaScript.
- Bonus (Rust): reimplement using an enum instead of dyn traits, and compare.

# Detailed Walkthrough: Abstract Factory — Database Layer Exercise

No code. Just a complete mental model of what you're building, why each piece exists, and what to watch for in each language.

---

## 1. What You Are Actually Building

You are modeling a **database access layer** that must work against **two different database engines** — Postgres and MySQL — without the rest of your application knowing which one it is talking to.

The application will say:

> "Give me a connection, give me a command, run this SQL."

It will never say:

> "Give me a *Postgres* connection."

That distinction is the entire point of the pattern. The application depends on **abstract ideas**, and a factory decides which **concrete reality** fulfills them.

---

## 2. The Two Axes of the Design

Before writing anything, notice you have **two independent dimensions**:

| Axis | Values |
|---|---|
| **Product type** (what kind of object) | `Connection`, `Command` |
| **Family / vendor** (which database) | Postgres, MySQL |

Abstract Factory exists precisely because you have **more than one product type per family**. If you only had `Connection`, you'd use Factory Method. Because you have `Connection` *and* `Command` that must come from the same vendor, you need a factory that produces **a matched set**.

This is the "family consistency" guarantee: you must never end up with a Postgres connection being driven by a MySQL command. The factory pattern makes that impossible by construction.

---

## 3. The Four Roles, Mapped to This Exercise

### Role 1 — Abstract Product A: `Connection`

A **Connection** represents a live session with the database.

- `connect()` — establish the session (open socket, authenticate, allocate handles).
- `close()` — release the session cleanly (flush, disconnect, free resources).

This is the abstract idea. It says *what a connection can do*, not *how Postgres or MySQL does it*. Both vendors will implement this interface, but with completely different internals.

**What you should think about:**

- Does `connect()` return anything? A success flag? An error? In Rust it likely returns `Result`. In C++ maybe `bool` or throws. In JS/TS maybe a `Promise` or throws.
- Does `close()` need to be idempotent? (Calling it twice should not crash.)
- What resources does the connection hold? This matters enormously for ownership.

### Role 2 — Abstract Product B: `Command`

A **Command** represents something you can execute against the database.

- `execute(sql)` — run a statement immediately, presumably for queries that return nothing or return rows directly.
- `prepare(sql)` — pre-compile a statement so it can be executed later, possibly many times, possibly with bound parameters.

**What you should think about:**

- Why two methods? `execute` is fire-and-forget. `prepare` is an optimization and a safety mechanism (parameter binding prevents SQL injection). They represent two different lifecycles.
- Does `Command` need to know about `Connection`? In real databases, yes — a command is bound to a connection. That coupling is itself a design decision. For this exercise you can keep them independent, but notice the question.
- What does `prepare` return? A prepared-statement handle? Or does it mutate the command?

### Role 3 — Abstract Factory: `DatabaseFactory`

An interface with exactly two methods:

- `createConnection()` → returns a `Connection`
- `createCommand()` → returns a `Command`

**Critical property:** the factory does *not* take a vendor parameter. The vendor is baked into the concrete factory. `PostgresFactory.createConnection()` always returns a Postgres connection. `MySqlFactory.createConnection()` always returns a MySQL one.

**What you should think about:**

- Should the factory be stateless? Almost always yes — it's just a dispatcher.
- Should it cache anything? No. Factories create; they don't own.
- Should `createCommand` take a connection? See Role 2. In a stricter design, yes — because a command without a connection is meaningless. But for the exercise, keep it parameterless to isolate the pattern.

### Role 4 — Client: `runQuery(factory, sql)`

This is the function that proves the pattern works.

Its signature takes a `DatabaseFactory` and a SQL string. Its body:

1. Asks the factory for a `Connection`.
2. Calls `connect()` on it.
3. Asks the factory for a `Command`.
4. Calls `execute(sql)` (or `prepare(sql)` then execute).
5. Calls `close()` on the connection.

**The defining requirement:** `runQuery` must contain **zero references** to `Postgres`, `MySQL`, or any concrete class. If you can look at `runQuery` and cannot tell which database is being used, you have succeeded.

This is what "the client uses only abstract interfaces" means in practice. It's the measurable outcome of the pattern.

---

## 4. The Concrete Families

You will have four concrete products:

- `PostgresConnection` — implements `Connection`
- `PostgresCommand` — implements `Command`
- `MySqlConnection` — implements `Connection`
- `MySqlCommand` — implements `Command`

And two concrete factories:

- `PostgresFactory` — creates the two Postgres products
- `MySqlFactory` — creates the two MySQL products

For the exercise, the products don't need real database drivers. They can print things like `"Postgres: connecting..."`. The point is the **structure**, not the networking. But you should make the printed messages distinct enough that you can verify which family was used at runtime.

---

## 5. What "Without Knowing Which DB" Really Means

This phrase trips people up. It does **not** mean the application never chooses a database. Someone, somewhere, must decide "use Postgres." It means:

- The **decision happens once**, at the composition root (the `main` function or a config loader).
- After that decision, **all downstream code is vendor-agnostic**.
- The choice is expressed by **which factory object is passed in**, not by `if` statements scattered through the codebase.

So the flow is:

1. `main` reads config: `"postgres"` or `"mysql"`.
2. `main` constructs the appropriate factory.
3. `main` passes the factory into `runQuery`.
4. `runQuery` never asks "which one am I?"

If you later add SQLite, `main` gains one `if` branch, and `runQuery` is untouched. That's the Open/Closed Principle in action.

---

## 6. Language-by-Language: What to Watch For

### Rust

**The central design question:** trait objects (`Box<dyn Connection>`) or enums?

- **Trait objects** are the direct translation. `createConnection(&self) -> Box<dyn Connection>`. This allows an *open* set of families — anyone can add a new database later by implementing the traits.
- **Enums** are more idiomatic Rust when the set of families is *closed*. You define `enum Connection { Postgres(...), MySql(...) }` and use `match`. No heap allocation, no dynamic dispatch, exhaustive checking.

**Ownership is the real challenge.** A `Connection` owns resources (a socket, a handle). The factory creates it and hands it to the client. The client must drop it, which should trigger cleanup. In Rust, this is `Drop`. In the trait-object version, `Box<dyn Connection>` makes the client the owner. In the enum version, the enum variant owns the inner resource.

**The bonus comparison** asks you to build both and compare:

- **Lines of code** — enums are usually shorter.
- **Performance** — enums avoid vtable dispatch and heap allocation.
- **Extensibility** — trait objects let downstream crates add families; enums force you to edit the enum definition. This is the classic "expression problem."
- **Ergonomics** — `match` is exhaustive and compiler-checked; `dyn` requires discipline.

**Return type of `connect()`:** in Rust it should almost certainly be `Result<(), Error>` — you cannot ignore failure. This is a language-level advantage over C++ and JS.

### C++

**Ownership discipline.** The factory returns products. Who owns them?

- Return `std::unique_ptr<Connection>` and `std::unique_ptr<Command>`. The client owns them; when they go out of scope, the destructors fire.
- Never return raw owning pointers.
- Give both abstract base classes a **virtual destructor**. Otherwise deleting through a base pointer is undefined behavior.

**Runtime polymorphism via `virtual`.** This is the classical GoF implementation. The factory methods are `virtual`, the products' methods are `virtual`, and everything is dispatched through the vtable.

**Policy-based alternative.** For a closed set of families, you can template `runQuery` on a factory type and get zero-overhead dispatch. But this is a bonus, not the main exercise. If you do it, notice how the client function's signature changes from `runQuery(const DatabaseFactory&, ...)` to `template <typename F> runQuery(...)`.

**Error handling.** C++ has no `Result`. You'll either throw exceptions or return `bool`/`std::optional`. Decide and be consistent.

### JavaScript

**No interfaces.** You enforce the contract by **convention** and **duck typing**. If your factory object has `createConnection` and `createCommand`, it *is* a `DatabaseFactory`. Nothing stops a bug where someone passes the wrong object — you'll find out at runtime.

**Two idiomatic styles:**

1. **Class-based** — mirrors C++/Java. `class PostgresFactory { createConnection() { return new PostgresConnection(); } ... }`.
2. **Closure-based** — an object literal of arrow functions. Often shorter and cleaner.

**No ownership rules.** Garbage collection cleans up. But you still need `close()` because database connections are OS-level resources that the GC doesn't know about.

**Async consideration.** Real database operations are asynchronous. `connect()` should probably return a `Promise`. But for the structural exercise, synchronous is fine — just be aware that in production you'd `await`.

### TypeScript (the update)

TypeScript gives you back the compile-time contract that JavaScript lacks.

**Interface-based version:**

- `interface Connection { connect(): void; close(): void; }`
- `interface Command { execute(sql: string): void; prepare(sql: string): void; }`
- `interface DatabaseFactory { createConnection(): Connection; createCommand(): Command; }`
- Concrete classes `implements` these interfaces.
- The compiler rejects any factory that forgets a method.

**Closure-based version with `satisfies`:**

- Same interfaces.
- Factories are object literals of arrow functions.
- `satisfies DatabaseFactory` checks the object conforms **without widening its inferred type**. You get both safety and precise inference.

**Comparison the exercise asks for:**

- **Line count** — closures are almost always shorter. No `class`, no `new`, no `constructor`. Just functions returning objects.
- **Readability** — classes are more explicit and familiar to people from OO backgrounds. Closures are more idiomatic modern TS and compose better with functional code.
- **Adding SQLite** — this is the key test. In the interface version, you write a new class implementing the interface. In the closure version, you write a new function returning an object literal. Both are equally easy — but the closure version is fewer lines. What matters is that **`runQuery` does not change in either case**, and neither does the `DatabaseFactory` interface. That's the Open/Closed payoff.

---

## 7. The SQLite Extension Test

The update asks you to add a third database, **SQLite**, and evaluate how easy it is.

What this reveals:

- **You must add**: `SQLiteConnection`, `SQLiteCommand`, `SQLiteFactory`.
- **You must NOT change**: the abstract `Connection`, `Command`, or `DatabaseFactory` interfaces. Not one line. That is the whole point.
- **You must change exactly one line in the composition root**: the `if/switch` that picks the factory.

If you find yourself editing the abstract interfaces, you've either picked the wrong pattern or discovered the **extensibility axis problem** — the well-known weakness of Abstract Factory. Adding a new *product type* (say, `Transaction`) would force changes everywhere. Adding a new *family* (SQLite) does not.

So the SQLite test is really testing whether you've correctly identified the **family axis** as the open one.

---

## 8. Common Pitfalls to Avoid

1. **Putting vendor logic in the client.** If `runQuery` has `if (factory instanceof PostgresFactory)`, the pattern is broken.
2. **Sharing state between factory and products incorrectly.** The factory should create fresh products; it should not own them.
3. **Forgetting `close()`.** Every `connect()` must be paired with a `close()`, even on error paths. In Rust this is natural (`Drop`); in C++ it's RAII; in JS you need `try/finally`.
4. **Making the factory methods take a vendor string.** That defeats the entire pattern. The vendor is chosen by *which factory you instantiate*, not by a parameter.
5. **Coupling `Command` to a specific connection too early.** It's tempting, but it muddies the exercise. Keep them separate first; add coupling later only if you can justify it.

---

## 9. What You Should Be Able to Say When Done

When the exercise is complete, you should be able to state clearly:

- "The client function `runQuery` has no knowledge of Postgres or MySQL."
- "Adding SQLite required zero changes to the abstract interfaces or the client."
- "The family consistency is guaranteed — a Postgres factory can only produce Postgres products."
- "The trade-off I accepted is that adding a new *product type* would require touching every factory."

If you can say those four things, you have understood Abstract Factory — not just implemented it.

---

## 10. How the Language Versions Differ in Spirit

| Aspect | What changes across languages |
|---|---|
| **Enforcement** | Rust/C++/TS enforce at compile time; JS does not. |
| **Ownership** | Rust and C++ make you reason about it; JS/TS hide it (until resources leak). |
| **Extensibility mechanism** | Rust traits, C++ virtuals, JS duck typing, TS interfaces. |
| **Idiomatic alternative** | Rust enums, C++ templates, JS/TS closures + discriminated unions. |
| **Error handling** | Rust `Result`, C++ exceptions/optional, JS/TS exceptions. |

The **structure** is identical in all four languages. The **idioms** are wildly different. That contrast is the real lesson of doing the same exercise four times.

---