# 02_Builder

Implementations of the **02_Builder** pattern across 4 languages:
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
cmake -B build && cmake --build build && ./build/p_02_Builder
```


# Builder

## 1. Intent

Separate the **construction** of a complex object from its **representation**, so that the same construction process can create different representations.

In plain terms: when an object has **many parts**, **many optional parameters**, or must be assembled in **multiple steps**, don't cram all of that into a giant constructor. Instead, move the assembly logic into a separate object — the **Builder** — that accumulates pieces and produces the final product when asked.

---

## 2. The Problem It Solves

### Problem A — Telescoping constructors

Imagine a `Pizza` class:

```
Pizza(size, cheese, pepperoni, mushrooms, olives, bacon, pineapple, ...)
```

Every new topping adds a parameter. Callers write:

```cpp
Pizza p = new Pizza(LARGE, true, false, true, false, false, true, ...);
```

Nobody can read that. Nobody can remember the order. And when someone adds a topping, every call site breaks.

This is called the **telescoping constructor anti-pattern** — one constructor per combination, or one constructor with an ever-growing parameter list.

### Problem B — Optional parameters

Even with defaults, you often can't set "just the third optional parameter" without naming the first two.

### Problem C — Multi-step construction

Some objects are built in stages: read config → validate → apply defaults → assemble parts → freeze. Forcing all of that into a constructor makes it unreadable and untestable.

### Problem D — Multiple representations

A document can be rendered as HTML, PDF, or Markdown. The *steps* to build it are the same; the *output* differs. Builder lets one construction process produce different representations.

### Problem E — Object validity

Sometimes you need to construct something piece by piece but only "commit" it when it's complete. Builder lets you stage partial state without exposing a half-built object.

---

## 3. Structure — Classic GoF

```
        ┌─────────────┐         ┌──────────────┐
        │  Director   │────────►│   Builder    │
        │             │         │  (interface) │
        │ +construct()│         │ +buildPartA()│
        └─────────────┘         │ +buildPartB()│
                                │ +getResult() │
                                └──────┬───────┘
                                       │
                        ┌──────────────┼──────────────┐
                        │              │              │
                ConcreteBuilderA  ConcreteBuilderB  ...
                        │
                        ▼
                   ┌─────────┐
                   │ Product │
                   └─────────┘
```

| Role | Responsibility |
|---|---|
| **Builder** | Interface declaring the steps to build parts and retrieve the result. |
| **Concrete Builder** | Implements the steps for one specific representation. Tracks the product being built. |
| **Director** | Knows the *order* of steps. Calls builder methods in sequence. Does not know the concrete builder. |
| **Product** | The complex object being built. |

**Key insight:** the Director knows *how to assemble*, the Builder knows *what to assemble*. Swapping builders swaps the output without changing the assembly sequence.

---

## 4. Structure — Fluent Builder (the modern variant)

The classic GoF version separates Director and Builder. In practice, most modern code fuses them into a single object with **chainable methods**:

```
Pizza p = Pizza.builder()
    .size(LARGE)
    .cheese()
    .pepperoni()
    .build();
```

There is no Director — the client *is* the director. Each method returns the builder itself (or a new one), enabling chaining.

This is the version you'll see in Rust, modern C++, Kotlin, TypeScript, and Java.

---

## 5. Structure — Step Builder (compile-time enforced order)

An advanced variant where **each step returns a different interface**, so the compiler forces you to call methods in the correct order:

```
PizzaBuilder.start()
    .size(LARGE)       // returns SizeStep
    .dough(THIN)       // returns DoughStep
    .addTopping(...)   // returns ToppingStep
    .build();          // only available on final step
```

You cannot call `.build()` before `.dough()` — the type system forbids it. This is the **Typestate pattern** in Rust, and it's expressible in C++ and TypeScript too.

---

## 6. Builder vs Abstract Factory

They are often confused. The difference:

| | Abstract Factory | Builder |
|---|---|---|
| **What it creates** | A family of related objects | One complex object |
| **How** | Instantaneous — one call per product | Multi-step — accumulate parts over time |
| **Focus** | *Which* concrete classes | *How* to assemble the parts |
| **Client role** | Client asks factory for products | Client (or Director) drives the steps |
| **Result** | Multiple separate objects | One finished product |

Use Abstract Factory when you have **families of products**. Use Builder when you have **one complex object with many parts**.

---

## 7. Rust Implementation

Rust has no constructors, no optional parameters, no method overloading. The Builder pattern is therefore **extremely idiomatic** — it's how you build configs, HTTP clients, futures, etc.

### 7a. Fluent builder with `self` (consuming)

The most common Rust builder: each method takes `self` by value and returns `Self`, so the builder is consumed and can't be reused accidentally.

```rust
#[derive(Debug)]
struct Pizza {
    size: String,
    cheese: bool,
    pepperoni: bool,
    mushrooms: bool,
    olives: bool,
}

struct PizzaBuilder {
    size: String,
    cheese: bool,
    pepperoni: bool,
    mushrooms: bool,
    olives: bool,
}

impl PizzaBuilder {
    fn new() -> Self {
        PizzaBuilder {
            size: "medium".into(),
            cheese: false,
            pepperoni: false,
            mushrooms: false,
            olives: false,
        }
    }

    fn size(mut self, size: &str) -> Self {
        self.size = size.into();
        self
    }

    fn cheese(mut self) -> Self {
        self.cheese = true;
        self
    }

    fn pepperoni(mut self) -> Self {
        self.pepperoni = true;
        self
    }

    fn mushrooms(mut self) -> Self {
        self.mushrooms = true;
        self
    }

    fn olives(mut self) -> Self {
        self.olives = true;
        self
    }

    fn build(self) -> Pizza {
        Pizza {
            size: self.size,
            cheese: self.cheese,
            pepperoni: self.pepperoni,
            mushrooms: self.mushrooms,
            olives: self.olives,
        }
    }
}

fn main() {
    let pizza = PizzaBuilder::new()
        .size("large")
        .cheese()
        .pepperoni()
        .olives()
        .build();

    println!("{:#?}", pizza);
}
```

**Why `self` by value?** It prevents this bug:

```rust
let mut b = PizzaBuilder::new();
b.cheese();
let p1 = b.build();
let p2 = b.build(); // would be allowed with &mut self — probably not wanted
```

With consuming `self`, each builder can only produce one product. The borrow checker enforces the lifecycle.

### 7b. Builder with `&mut self`

Sometimes you *want* to reuse the builder. Then use `&mut self` and return `&mut Self`:

```rust
impl PizzaBuilder {
    fn cheese(&mut self) -> &mut Self {
        self.cheese = true;
        self
    }
    fn build(&self) -> Pizza { /* clone fields */ }
}
```

This is more flexible but requires `mut` bindings and allows accidental reuse.

### 7c. Typestate builder — compile-time step enforcement

Rust can enforce the order of steps using generics + `PhantomData`. This is the **Typestate pattern**:

```rust
use std::marker::PhantomData;

struct NoSize;
struct HasSize;

struct PizzaBuilder<State> {
    size: Option<String>,
    cheese: bool,
    _state: PhantomData<State>,
}

impl PizzaBuilder<NoSize> {
    fn new() -> Self {
        PizzaBuilder { size: None, cheese: false, _state: PhantomData }
    }

    // size() transitions NoSize → HasSize
    fn size(self, s: &str) -> PizzaBuilder<HasSize> {
        PizzaBuilder {
            size: Some(s.into()),
            cheese: self.cheese,
            _state: PhantomData,
        }
    }
}

impl PizzaBuilder<HasSize> {
    fn cheese(mut self) -> Self {
        self.cheese = true;
        self
    }

    // build() only exists when size has been set
    fn build(self) -> Pizza {
        Pizza {
            size: self.size.unwrap(),
            cheese: self.cheese,
        }
    }
}

fn main() {
    // ✅ compiles
    let p = PizzaBuilder::new().size("large").cheese().build();

    // ❌ does NOT compile — build() doesn't exist yet
    // let bad = PizzaBuilder::new().build();
}
```

This is how libraries like `http`, `typed-builder`, and `derive_builder` give you compile-time safety on required fields.

### 7d. The `derive_builder` crate

In real Rust code you don't hand-write builders — you derive them:

```rust
use derive_builder::Builder;

#[derive(Builder)]
struct Pizza {
    size: String,
    #[builder(default)]
    cheese: bool,
    #[builder(default)]
    pepperoni: bool,
}
```

The macro generates the entire builder with `&mut self` chaining and an `Error`-returning `build()`.

### Rust notes

- `self` by value → one-shot builder, borrow-checker enforced.
- `&mut self` → reusable builder, needs `mut` binding.
- Typestate → compile-time required fields.
- Prefer `Into<String>` / `AsRef<str>` for string parameters.
- Provide sane defaults in `new()`.
- `build()` should return `Result` if validation can fail.

---

## 8. C++ Implementation

C++ has constructors and default arguments, so builders are used more selectively — but still heavily for configs, DSLs, and complex objects.

### 8a. Classic GoF version

```cpp
#include <iostream>
#include <memory>
#include <string>

// Product
class Pizza {
public:
    std::string size;
    bool cheese = false;
    bool pepperoni = false;
    bool olives = false;

    void describe() const {
        std::cout << "Pizza(" << size
                  << ", cheese=" << cheese
                  << ", pepperoni=" << pepperoni
                  << ", olives=" << olives << ")\n";
    }
};

// Builder interface
class PizzaBuilder {
public:
    virtual ~PizzaBuilder() = default;
    virtual void buildSize() = 0;
    virtual void buildCheese() = 0;
    virtual void buildPepperoni() = 0;
    virtual std::unique_ptr<Pizza> getResult() = 0;
};

// Concrete builder
class MargheritaBuilder : public PizzaBuilder {
    std::unique_ptr<Pizza> pizza_ = std::make_unique<Pizza>();
public:
    void buildSize() override      { pizza_->size = "medium"; }
    void buildCheese() override    { pizza_->cheese = true; }
    void buildPepperoni() override { /* none */ }
    std::unique_ptr<Pizza> getResult() override { return std::move(pizza_); }
};

// Director
class Waiter {
public:
    std::unique_ptr<Pizza> construct(PizzaBuilder& b) {
        b.buildSize();
        b.buildCheese();
        b.buildPepperoni();
        return b.getResult();
    }
};

int main() {
    MargheritaBuilder builder;
    Waiter waiter;
    auto pizza = waiter.construct(builder);
    pizza->describe();
}
```

This is the "textbook" version. It's rarely written this way in modern C++.

### 8b. Fluent builder (idiomatic modern C++)

```cpp
class Pizza {
public:
    std::string size = "medium";
    bool cheese = false;
    bool pepperoni = false;
    bool olives = false;
};

class PizzaBuilder {
    Pizza pizza_;
public:
    PizzaBuilder& size(const std::string& s) { pizza_.size = s; return *this; }
    PizzaBuilder& cheese()    { pizza_.cheese = true;    return *this; }
    PizzaBuilder& pepperoni() { pizza_.pepperoni = true; return *this; }
    PizzaBuilder& olives()    { pizza_.olives = true;    return *this; }

    Pizza build() && { return std::move(pizza_); }  // rvalue-qualified
};

int main() {
    Pizza p = PizzaBuilder{}
        .size("large")
        .cheese()
        .pepperoni()
        .build();
}
```

**The `&&` on `build()`** is a C++11+ trick: it makes `build()` callable only on rvalues, preventing reuse of the builder after building. This is the C++ analogue of Rust's consuming `self`.

### 8c. Named Parameter Idiom (a Builder variant)

C++ has no named parameters, so the fluent builder doubles as the **Named Parameter Idiom**:

```cpp
Window w = WindowBuilder()
    .width(800)
    .height(600)
    .title("Hello")
    .resizable(true);
```

Each setter returns `*this` by reference. This is arguably the most common C++ use of Builder — it's not about multiple representations, it's about readable construction.

### 8d. Typestate in C++

You can also do compile-time step enforcement with templates, but it's verbose. Most C++ teams accept runtime checks instead.

### C++ notes

- Prefer the **fluent builder** over the classic Director+Builder unless you genuinely need multiple representations.
- Use `&&` on the terminal method to prevent reuse.
- Return `std::unique_ptr<Product>` if the product is polymorphic; return by value otherwise.
- Use `[[nodiscard]]` on `build()`.
- Policy-based builders (templates) give zero-overhead when the product type is fixed.

---

## 9. JavaScript Implementation

JS has object literals, so a plain config object often replaces the builder entirely. But builders still appear in DSLs, libraries (e.g., `knex`, `chai`), and complex object assembly.

### 9a. Fluent class-based builder

```js
class Pizza {
  constructor({ size, cheese, pepperoni, olives }) {
    this.size = size;
    this.cheese = cheese;
    this.pepperoni = pepperoni;
    this.olives = olives;
  }
}

class PizzaBuilder {
  #size = "medium";
  #cheese = false;
  #pepperoni = false;
  #olives = false;

  size(s)      { this.#size = s;      return this; }
  cheese()     { this.#cheese = true; return this; }
  pepperoni()  { this.#pepperoni = true; return this; }
  olives()     { this.#olives = true; return this; }

  build() {
    return new Pizza({
      size: this.#size,
      cheese: this.#cheese,
      pepperoni: this.#pepperoni,
      olives: this.#olives,
    });
  }
}

const pizza = new PizzaBuilder()
  .size("large")
  .cheese()
  .pepperoni()
  .build();

console.log(pizza);
```

Private fields (`#field`) prevent external mutation — the JS analogue of Rust's consuming `self`.

### 9b. Closure-based builder (very idiomatic JS)

```js
const pizzaBuilder = () => {
  let size = "medium";
  let cheese = false;
  let pepperoni = false;

  return {
    size(s)     { size = s;          return this; },
    cheese()    { cheese = true;     return this; },
    pepperoni() { pepperoni = true;  return this; },
    build()     { return { size, cheese, pepperoni }; },
  };
};

const pizza = pizzaBuilder().size("large").cheese().build();
```

Closures act as private state. This is arguably the cleanest JS builder.

### 9c. When NOT to use a builder in JS

If the object is simple and immutable, just use an object literal:

```js
const pizza = { size: "large", cheese: true, pepperoni: true };
```

Builders are worth it when:
- Construction involves **validation**.
- The object has **many derived fields**.
- The construction is **multi-step** or **async**.
- You're building a **DSL** (e.g., query builders).

### JS notes

- Return `this` for chaining.
- Use `#private` fields to prevent tampering.
- Use closures if you prefer a functional style.
- `build()` should throw on invalid state.
- Consider `Object.freeze(product)` to make the result immutable.

---

## 10. TypeScript Implementation

TS makes Builder shine: interfaces for the builder contract, generics for the product type, and — importantly — you can enforce **required fields at compile time**.

### 10a. Fluent class-based builder

```ts
interface PizzaOptions {
  size: string;
  cheese: boolean;
  pepperoni: boolean;
  olives: boolean;
}

class Pizza {
  constructor(public readonly options: Readonly<PizzaOptions>) {}
}

class PizzaBuilder {
  private opts: Partial<PizzaOptions> = { size: "medium" };

  size(s: string): this     { this.opts.size = s;          return this; }
  cheese(): this            { this.opts.cheese = true;     return this; }
  pepperoni(): this         { this.opts.pepperoni = true;  return this; }
  olives(): this            { this.opts.olives = true;     return this; }

  build(): Pizza {
    const { size = "medium", cheese = false, pepperoni = false, olives = false } = this.opts;
    return new Pizza({ size, cheese, pepperoni, olives });
  }
}

const pizza = new PizzaBuilder().size("large").cheese().build();
```

### 10b. Interface-based builder contract

```ts
interface Builder<T> {
  build(): T;
}

interface PizzaBuilder extends Builder<Pizza> {
  size(s: string): this;
  cheese(): this;
  pepperoni(): this;
}

class DefaultPizzaBuilder implements PizzaBuilder {
  private opts: Partial<PizzaOptions> = {};
  size(s: string): this { this.opts.size = s; return this; }
  cheese(): this { this.opts.cheese = true; return this; }
  pepperoni(): this { this.opts.pepperoni = true; return this; }
  build(): Pizza {
    return new Pizza({
      size: this.opts.size ?? "medium",
      cheese: this.opts.cheese ?? false,
      pepperoni: this.opts.pepperoni ?? false,
      olives: this.opts.olives ?? false,
    });
  }
}
```

### 10c. Compile-time required fields (the TS typestate trick)

This is TS's killer feature for builders. Using conditional types and a `Set` generic, you can force `.build()` to exist only after required fields are set.

```ts
type Pizza = { size: string; cheese: boolean };

class PizzaBuilder<Has extends string = never> {
  private size?: string;
  private cheese = false;

  size(s: string): PizzaBuilder<Has | "size"> {
    this.size = s;
    return this as PizzaBuilder<Has | "size">;
  }

  cheeseOn(): PizzaBuilder<Has | "cheese"> {
    this.cheese = true;
    return this as PizzaBuilder<Has | "cheese">;
  }

  // build() only exists once both are set
  build(this: PizzaBuilder<"size" | "cheese">): Pizza {
    return { size: this.size!, cheese: this.cheese };
  }
}

const p = new PizzaBuilder().size("large").cheeseOn().build(); // ✅
// new PizzaBuilder().size("large").build();                    // ❌ compile error
// new PizzaBuilder().build();                                  // ❌ compile error
```

The `this` parameter type on `build()` is the trick — `this` must already satisfy `PizzaBuilder<"size" | "cheese">`.

This is the TS analogue of Rust's typestate builder. It is one of the strongest arguments for using TypeScript over JavaScript.

### 10d. Closure-based builder with `satisfies`

For simple cases, closures + `satisfies` are cleaner:

```ts
interface PizzaBuilder {
  size(s: string): PizzaBuilder;
  cheese(): PizzaBuilder;
  build(): Pizza;
}

const pizzaBuilder = (): PizzaBuilder => {
  let size = "medium";
  let cheese = false;
  return {
    size(s) { size = s; return this; },
    cheese() { cheese = true; return this; },
    build() { return { size, cheese }; },
  } satisfies PizzaBuilder;
};
```

`satisfies` checks the shape without widening the inferred type — you keep both safety and precise inference.

### TS notes

- `private`/`#field` for internal builder state.
- `readonly` on the product to make it immutable.
- `this` return type for fluent chaining (preserves subclass types).
- Conditional types to enforce required fields at compile time.
- `satisfies` for object-literal builders.
- For async builds, make `build(): Promise<Product>`.

---

## 11. Side-by-Side Comparison

| Concern | Rust | C++ | JS | TypeScript |
|---|---|---|---|---|
| **Preferred style** | Fluent, consuming `self` | Fluent with `&&` terminal | Fluent class or closure | Fluent class or closure |
| **Immutability after build** | Move semantics | `std::move` + `&&` | `Object.freeze` | `readonly` |
| **Compile-time required fields** | Typestate + `PhantomData` | Templates (verbose) | ❌ | Conditional types + `this` |
| **Private state** | Module privacy / no `pub` | `private` | `#field` or closure | `private` / `#field` |
| **Reusable builder** | `&mut self` | `*this` reference | `this` | `this` |
| **Async construction** | `async fn build()` via `.await` | Futures/`std::async` | `async build()` | `async build(): Promise<T>` |
| **Boilerplate** | High (unless `derive_builder`) | Medium | Low | Low–Medium |
| **Safety** | Strong (borrow checker) | Medium (manual) | Weak (runtime) | Strong (compile-time) |
| **Idiomatic alternative** | `derive_builder`, `Default` + struct update | Named Parameter Idiom, designated initializers (C++20) | Object literal | Object literal with `satisfies` |

---

## 12. Tradeoffs

**Pros**

- Eliminates telescoping constructors.
- Makes optional parameters explicit and readable.
- Supports step-by-step construction with validation.
- Allows multiple representations of the same construction process (classic GoF).
- Separates construction logic from the product, aiding testability.
- In Rust and TS, can enforce required fields at **compile time**.

**Cons**

- More code: you must write a builder class/struct plus the product.
- Duplicate fields between builder and product.
- Adds indirection — the product is constructed in two places.
- For simple objects, it's pure overhead (an object literal or named parameters would do).
- The classic GoF Director+Builder version is rarely worth the ceremony in modern code.

**When to use**

- Object has **many optional parameters** (rule of thumb: more than 4–5).
- Construction is **multi-step** or has **validation**.
- You need to build the **same shape with different representations**.
- You want a **DSL** (query builders, config builders, test data builders).
- You want to enforce **required fields at compile time** (Rust typestate, TS conditional types).

**When NOT to use**

- Object has few fields and no optional complexity → use a struct/object literal.
- All fields are required and known → use a plain constructor.
- You only need defaults → use `Default` in Rust, default arguments in C++, object spread in JS/TS.
- You're building a family of related objects → use Abstract Factory.

---

## 13. Alternatives

| Alternative | When it's better |
|---|---|
| **Plain struct/class constructor** | Few fields, all required. |
| **Default arguments** (C++, JS, TS) | Small number of options. |
| **Object literal / struct update** (JS/TS/Rust `..Default::default()`) | Simple config with defaults. |
| **Designated initializers** (C++20, C99) | Named fields in a struct literal. |
| **`Default` trait + struct update** (Rust) | Config objects with mostly-default fields. |
| **Named Parameter Idiom** (C++) | Fluent setters as a substitute for named args. |
| **Abstract Factory** | Multiple products forming a family. |
| **Prototype** | Clone an existing configured object instead of rebuilding. |
| **Factory Method** | Single product, decide subclass at runtime. |
| **Freeze + validation function** | Simple immutable config with a `validate()` step. |

---

## 14. Mental Model

> **Abstract Factory** answers: *"Which family of objects should I create?"*
> **Builder** answers: *"How do I assemble this one complex object, step by step?"*

If your construction code looks like:

```js
new Pizza("large", true, false, true, false, false, true, null, undefined, ...)
```

…or you find yourself writing three constructors for the same class…

…a Builder wants to be born.

If your construction looks like:

```js
const p = Pizza.builder()
  .size("large")
  .cheese()
  .pepperoni()
  .build();
```

…you've already met one.

---

## 15. Exercise

Build a **Builder for an HTTP request object** in **Rust, C++, JavaScript, and TypeScript**.

**Product — `HttpRequest` with:**

- `method` (required)
- `url` (required)
- `headers` (map, optional, default empty)
- `body` (optional)
- `timeoutMs` (optional, default 30_000)
- `followRedirects` (optional, default true)

**Requirements:**

1. Create a builder with fluent, chainable methods for each field.
2. `build()` must **validate** that `method` and `url` are set. If not, return an error (Rust `Result`, C++ exception or `std::optional`, JS/TS `throw`).
3. The resulting `HttpRequest` should be **immutable** — no setters after construction.
4. The builder should not be reusable after `build()` in Rust and C++ (enforce via ownership / `&&`).

**Language-specific requirements:**

- **Rust:** Implement two versions — one fluent with `self` by value, one typestate where `build()` only exists after `method` and `url` are set. Compare.
- **C++:** Implement one fluent version with `&&` on `build()`. Add a `[[nodiscard]]` attribute. Use `std::optional` for optional fields.
- **JavaScript:** Implement one class-based version with `#private` fields, and one closure-based version. Compare line count and readability.
- **TypeScript:** Implement one interface-based fluent builder and one closure-based builder using `satisfies`. Then implement a **compile-time required-fields** version where `build()` is only callable after `.method()` and `.url()` — using the `this` parameter trick from section 10c.

**Then answer:**

1. How many lines does each language need to express the same idea?
2. Which language gives you **compile-time safety** on required fields? Which gives it at runtime? Which gives none?
3. What happens if you add a new optional field, `retries`? Which languages make that a one-line change? Which require touching multiple places?
4. Would you actually use a builder for this in production, or would you prefer a config object? Justify.

---

Say **"next"** when you're ready for the next Creational pattern — **Factory Method** — or **"review Builder"** if you want to walk through the exercise together first.