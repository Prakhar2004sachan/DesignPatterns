# 04_Prototype_Pattern

Implementations of the **04_Prototype_Pattern** pattern across 4 languages:
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
cmake -B build && cmake --build build && ./build/p_04_Prototype_Pattern
```


# Prototype

## 1. Intent

Create new objects by **cloning existing ones** (the "prototypes") rather than instantiating them from scratch. The prototype itself is the factory.

In plain terms: if you already have a fully configured object, and you need another one just like it (or slightly different), **copy it** instead of rebuilding it.

---

## 2. The Problem It Solves

### Problem A — Expensive construction

Suppose constructing an object requires:

- A database query
- A file read
- A network call
- Heavy computation

If you need many similar objects, re-running construction for each is wasteful. Clone a configured instance instead.

### Problem B — Complex configuration

An object might need dozens of fields set in a specific order with validation. Once you have one valid instance, cloning it is simpler and safer than redoing the setup.

### Problem C — Unknown concrete type

You have a `Box<dyn Shape>` and want another one just like it. You cannot write `new TheConcreteType()` because you don't know what it is at compile time. `clone()` lets the object duplicate itself.

### Problem D — Preserving configuration

A framework hands you a configured `Widget`. You want a variant with one field changed. Clone, then mutate.

### Problem E — Avoiding parallel class hierarchies

Factory Method requires a Creator subclass per Product. Prototype avoids this entirely: you register prototype *instances*, not classes.

---

## 3. The Central Issue — Shallow vs Deep Copy

This is the heart of Prototype. Get it wrong and you get aliasing bugs that are nightmares to debug.

### Shallow copy

Copies the object's fields **by value**, but **references/pointers are copied as-is**. So two objects share the same underlying data.

```
Original:  { name: "Alice", tags: ───► ["a", "b"] }
Shallow:   { name: "Alice", tags: ───► ["a", "b"] }   ← same array!
```

Mutating `shallow.tags.push("c")` also mutates `original.tags`.

### Deep copy

Recursively clones everything reachable. The two objects share nothing.

```
Original:  { name: "Alice", tags: ───► ["a", "b"] }
Deep:      { name: "Alice", tags: ───► ["a", "b"] }   ← separate array
```

### How each language handles it

| Language | Default copy behavior | Deep copy mechanism |
|---|---|---|
| Rust | **No implicit copy** — must call `.clone()` explicitly | `Clone::clone` (shallow by default; manual for deep) |
| C++ | Copy constructor / copy assignment (usually shallow for pointers) | Manual deep copy in copy ctor |
| JavaScript | Spread `{...obj}` is shallow | `structuredClone()` (built-in), or manual |
| TypeScript | Same as JS | `structuredClone()` (typed), or manual |

**Rule:** Prototype forces you to *decide* shallow or deep per pattern. There is no universally right answer.

---

## 4. Structure — Classic GoF

```
        ┌──────────────────┐
        │   Prototype      │
        │                  │
        │ +clone(): Self   │
        └────────┬─────────┘
                 │
      ┌──────────┼──────────┐
      │          │          │
ConcreteA   ConcreteB   ConcreteC
      │          │          │
      └──────────┴──────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ PrototypeRegistry│
        │  +get(key)       │
        │  +register(key)  │
        └──────────────────┘
```

| Role | Responsibility |
|---|---|
| **Prototype** | Declares `clone()`. |
| **Concrete Prototype** | Implements `clone()` to return a copy of itself. |
| **Client** | Calls `clone()` on a prototype instead of `new`. |
| **Registry** (optional) | Stores named prototypes; client asks for a clone by key. |

**Key point:** the prototype itself is the factory. No Creator subclass hierarchy is needed — each product knows how to copy itself.

---

## 5. Prototype vs Other Creational Patterns

| Pattern | How it creates | Decided by |
|---|---|---|
| **Factory Method** | Constructs new instance | Subclass overrides `createX()` |
| **Abstract Factory** | Constructs a family | Concrete factory object |
| **Builder** | Assembles step by step | Builder + Director |
| **Prototype** | **Clones existing instance** | The prototype object itself |

Prototype is the only one that doesn't call a constructor. This makes it uniquely useful when construction is expensive or when the concrete type is unknown.

---

## 6. Rust Implementation

Rust has **Prototype built into the language** as the `Clone` trait. This is the single biggest reason Prototype feels more native in Rust than in any other language on this list.

### 6a. `#[derive(Clone)]` — shallow clone

```rust
#[derive(Clone, Debug)]
struct Config {
    name: String,
    retries: u32,
    tags: Vec<String>,
}

fn main() {
    let original = Config {
        name: "prod".into(),
        retries: 3,
        tags: vec!["a".into(), "b".into()],
    };

    let mut copy = original.clone();
    copy.tags.push("c".into());

    println!("original tags: {:?}", original.tags); // ["a", "b"]
    println!("copy tags:     {:?}", copy.tags);     // ["a", "b", "c"]
}
```

`#[derive(Clone)]` produces a **deep-ish** clone: `String` and `Vec` implement `Clone` themselves, so the derive recursively clones them. For fields like `Rc<T>` or `Arc<T>`, the derive clones the **reference**, not the underlying data — that's shallow.

### 6b. Manual `Clone` for deep copy across `Rc`

```rust
use std::rc::Rc;

#[derive(Debug)]
struct Node {
    value: i32,
    children: Vec<Rc<Node>>,
}

impl Clone for Node {
    fn clone(&self) -> Self {
        Node {
            value: self.value,
            // deep clone: clone each Rc's contents
            children: self.children.iter().map(|c| Rc::new((**c).clone())).collect(),
        }
    }
}
```

The derive would have shared the `Rc`s; the manual impl breaks the sharing.

### 6c. Prototype with `Box<dyn Trait>` — the object-safe clone problem

Rust's `Clone` trait is **not object-safe** — you cannot write `Box<dyn Clone>`. The common workaround is a helper trait:

```rust
trait Shape: ShapeClone {
    fn draw(&self);
    fn area(&self) -> f64;
}

trait ShapeClone {
    fn clone_box(&self) -> Box<dyn Shape>;
}

impl<T> ShapeClone for T
where
    T: 'static + Shape + Clone,
{
    fn clone_box(&self) -> Box<dyn Shape> {
        Box::new(self.clone())
    }
}

impl Clone for Box<dyn Shape> {
    fn clone(&self) -> Box<dyn Shape> {
        self.clone_box()
    }
}

#[derive(Clone)]
struct Circle { radius: f64 }

impl Shape for Circle {
    fn draw(&self) { println!("Circle r={}", self.radius); }
    fn area(&self) -> f64 { std::f64::consts::PI * self.radius * self.radius }
}

#[derive(Clone)]
struct Square { side: f64 }

impl Shape for Square {
    fn draw(&self) { println!("Square s={}", self.side); }
    fn area(&self) -> f64 { self.side * self.side }
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 2.0 }),
        Box::new(Square { side: 3.0 }),
    ];

    let copies: Vec<Box<dyn Shape>> = shapes.iter().map(|s| s.clone()).collect();
    for s in &copies {
        s.draw();
    }
}
```

This `clone_box` trick is a well-known Rust idiom. The `dyn-clone` crate packages it.

### 6d. Prototype Registry in Rust

```rust
use std::collections::HashMap;

struct ShapeRegistry {
    prototypes: HashMap<String, Box<dyn Shape>>,
}

impl ShapeRegistry {
    fn new() -> Self {
        ShapeRegistry { prototypes: HashMap::new() }
    }

    fn register(&mut self, key: &str, proto: Box<dyn Shape>) {
        self.prototypes.insert(key.into(), proto);
    }

    fn create(&self, key: &str) -> Option<Box<dyn Shape>> {
        self.prototypes.get(key).map(|p| p.clone())
    }
}
```

### 6e. `Clone` is the language's Prototype

Everywhere the standard library needs to duplicate a value, it uses `Clone`. `Vec::clone`, `to_vec`, `to_owned`, `String::clone` — all Prototype. When you derive `Clone`, you're opting into the pattern.

### Rust notes

- Prefer `#[derive(Clone)]` and clone explicitly — Rust never clones implicitly.
- For `Box<dyn Trait>`, use the `clone_box` helper or the `dyn-clone` crate.
- `Rc::clone` is **shallow** (increments refcount); `(*rc).clone()` is deep.
- `Arc` for threads, `Rc` for single-thread.
- Cloning is explicit — the compiler forces you to think about it. This is a feature, not a bug.

---

## 7. C++ Implementation

C++ has a **copy constructor**, so Prototype is partly built-in. But when polymorphic copying through a base pointer is needed, a virtual `clone()` is required.

### 7a. Virtual `clone()` — the classical GoF form

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual std::unique_ptr<Shape> clone() const = 0;
    virtual void draw() const = 0;
};

class Circle : public Shape {
    double radius_;
public:
    explicit Circle(double r) : radius_(r) {}

    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Circle>(*this); // uses copy ctor
    }

    void draw() const override {
        std::cout << "Circle r=" << radius_ << "\n";
    }
};

class Square : public Shape {
    double side_;
public:
    explicit Square(double s) : side_(s) {}

    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Square>(*this);
    }

    void draw() const override {
        std::cout << "Square s=" << side_ << "\n";
    }
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(2.0));
    shapes.push_back(std::make_unique<Square>(3.0));

    std::vector<std::unique_ptr<Shape>> copies;
    for (const auto& s : shapes) {
        copies.push_back(s->clone());
    }

    for (const auto& c : copies) c->draw();
}
```

### 7b. Covariant return types (C++ feature)

C++ allows an override to return a **more derived type** than the base declares:

```cpp
class Circle : public Shape {
public:
    Circle* clone() const override { return new Circle(*this); }  // returns Circle*
};
```

This works because `Circle*` is convertible to `Shape*`. But returning raw pointers is unsafe — prefer `unique_ptr`.

### 7c. Deep copy via copy constructor

```cpp
class Document {
    std::string title_;
    std::vector<std::string> lines_;  // value type → deep copied automatically
public:
    Document(const Document&) = default;              // deep for value members
    Document& operator=(const Document&) = default;
};

class DocWithPointer {
    std::string title_;
    char* buffer_;   // raw pointer → shallow by default!
public:
    DocWithPointer(const DocWithPointer& other)
        : title_(other.title_),
          buffer_(new char[/* size */]) {
        std::memcpy(buffer_, other.buffer_, /* size */); // manual deep copy
    }

    ~DocWithPointer() { delete[] buffer_; }
};
```

**Rule of Three/Five:** if you define a destructor, copy constructor, or copy assignment, you probably need all three (or five with moves). Prototype forces this decision.

### 7d. Better: use value types and `std::unique_ptr`/`std::shared_ptr`

Modern C++ avoids raw owning pointers, so deep copy is often the default via value semantics:

```cpp
class ModernDoc {
    std::string title_;
    std::vector<std::string> lines_;
    std::shared_ptr<Config> config_;   // shared → shallow clone of config
public:
    ModernDoc clone() const { return *this; }  // deep for value members, shallow for shared_ptr
};
```

Decide per member: `shared_ptr` means "share this", `unique_ptr` means "own this exclusively" (and can't be copied — must clone manually).

### C++ notes

- Virtual `clone()` returning `std::unique_ptr<Base>` is the canonical form.
- Use copy constructors for value semantics; use `clone()` for polymorphic copying.
- Watch Rule of Three/Five whenever you have raw resources.
- `shared_ptr` = shallow clone by design; `unique_ptr` = non-copyable, forces explicit deep clone.
- Prototype registry: `std::unordered_map<std::string, std::unique_ptr<Shape>>`.

---

## 8. JavaScript Implementation

JS has **prototypal inheritance built into the language**. The very term "prototype" comes from JS's object model — but that's a different (though related) concept from the GoF Prototype pattern.

- **JS prototype chain** = delegation mechanism for property lookup.
- **GoF Prototype** = cloning objects to create new ones.

They intersect when you use `Object.create(proto)`.

### 8a. Shallow clone — spread / `Object.assign`

```js
const original = { name: "Alice", tags: ["a", "b"] };
const shallow = { ...original };
shallow.tags.push("c");

console.log(original.tags); // ["a", "b", "c"] — SHARED array!
```

`Object.assign({}, original)` has the same behavior.

### 8b. Deep clone — `structuredClone` (modern)

```js
const original = { name: "Alice", tags: ["a", "b"] };
const deep = structuredClone(original);
deep.tags.push("c");

console.log(original.tags); // ["a", "b"]
console.log(deep.tags);     // ["a", "b", "c"]
```

`structuredClone` handles: objects, arrays, Maps, Sets, Dates, RegExps, ArrayBuffers, typed arrays. It **does not** handle: functions, DOM nodes, class instances (loses prototype), Symbols.

### 8c. The old JSON trick

```js
const deep = JSON.parse(JSON.stringify(original));
```

Limitations: loses `undefined`, functions, Dates (become strings), Maps, Sets, class identity, cyclic references crash it. Avoid in modern code — use `structuredClone`.

### 8d. Class-based Prototype with `clone()`

```js
class Shape {
  clone() { throw new Error("abstract clone"); }
  draw()  { throw new Error("abstract draw"); }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }
  clone() {
    return new Circle(this.radius);
  }
  draw() {
    console.log(`Circle r=${this.radius}`);
  }
}

class Square extends Shape {
  constructor(side) {
    super();
    this.side = side;
  }
  clone() {
    return new Square(this.side);
  }
  draw() {
    console.log(`Square s=${this.side}`);
  }
}

const shapes = [new Circle(2), new Square(3)];
const copies = shapes.map(s => s.clone());
copies.forEach(s => s.draw());
```

The advantage over `structuredClone`: preserves class identity and prototype chain.

### 8e. Prototype Registry in JS

```js
class ShapeRegistry {
  #prototypes = new Map();

  register(key, proto) { this.#prototypes.set(key, proto); }
  create(key) {
    const proto = this.#prototypes.get(key);
    if (!proto) throw new Error(`Unknown: ${key}`);
    return proto.clone();
  }
}

const registry = new ShapeRegistry();
registry.register("circle", new Circle(1));
registry.register("square", new Square(1));

const c = registry.create("circle");
c.draw();
```

### 8f. `Object.create` — the JS-native form

```js
const baseShape = {
  draw() { console.log(`Drawing ${this.kind}`); },
  clone() { return Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this)); },
};

const circle = Object.create(baseShape);
circle.kind = "circle";
circle.radius = 2;

const copy = circle.clone();
copy.draw(); // "Drawing circle"
```

`Object.create(proto)` sets the prototype chain; `Object.getOwnPropertyDescriptors` copies own properties. This is JS-specific but rarely needed in modern code.

### JS notes

- `{...obj}` = shallow. `structuredClone(obj)` = deep (modern). `JSON.parse(JSON.stringify(obj))` = legacy deep.
- `structuredClone` loses class prototypes. Use a `clone()` method for class instances.
- JS's prototype chain is unrelated to GoF Prototype except via `Object.create`.
- Prototype registry = `Map` of named prototypes.
- Watch for functions and DOM nodes — they can't be structured-cloned.

---

## 9. TypeScript Implementation

TypeScript layers types on JS's cloning. It gives you compile-time contracts for `clone()` and typed `structuredClone`.

### 9a. Interface + `clone()`

```ts
interface Shape {
  clone(): Shape;
  draw(): void;
}

class Circle implements Shape {
  constructor(public readonly radius: number) {}

  clone(): Circle {
    return new Circle(this.radius);
  }

  draw(): void {
    console.log(`Circle r=${this.radius}`);
  }
}

class Square implements Shape {
  constructor(public readonly side: number) {}

  clone(): Square {
    return new Square(this.side);
  }

  draw(): void {
    console.log(`Square s=${this.side}`);
  }
}

const shapes: Shape[] = [new Circle(2), new Square(3)];
const copies = shapes.map(s => s.clone());
copies.forEach(s => s.draw());
```

Notice `clone(): Circle` in `Circle` — TS allows **covariant return types**, just like C++. The interface says `Shape`, the impl narrows it.

### 9b. Generic clone interface

```ts
interface Cloneable<T> {
  clone(): T;
}

class Config implements Cloneable<Config> {
  constructor(
    public readonly name: string,
    public readonly retries: number,
    public readonly tags: readonly string[],
  ) {}

  clone(): Config {
    return new Config(this.name, this.retries, [...this.tags]);
  }
}
```

The generic `<T>` forces the return type to match the implementing class.

### 9c. `structuredClone` with types

```ts
const original = { name: "Alice", tags: ["a", "b"] };
const deep: typeof original = structuredClone(original);
```

TS's lib.d.ts types `structuredClone<T>(value: T): T`, preserving the type. `readonly` fields survive in type but not at runtime (it's a JS clone).

### 9d. Readonly + deep clone helper

```ts
function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

const original: Readonly<{ name: string; tags: string[] }> = {
  name: "Alice",
  tags: ["a", "b"],
};
const copy = deepClone(original);
```

**Caveat:** `structuredClone` doesn't preserve class prototypes. For class instances, prefer a `clone()` method.

### 9e. Registry in TS

```ts
class ShapeRegistry {
  private prototypes = new Map<string, Shape>();

  register(key: string, proto: Shape): void {
    this.prototypes.set(key, proto);
  }

  create(key: string): Shape {
    const proto = this.prototypes.get(key);
    if (!proto) throw new Error(`Unknown: ${key}`);
    return proto.clone();
  }
}
```

### 9f. Discriminated union cloning (idiomatic TS for closed sets)

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function cloneShape(s: Shape): Shape {
  switch (s.kind) {
    case "circle": return { ...s };
    case "square": return { ...s };
  }
}
```

For flat shapes, spread is enough. For nested structures, use `structuredClone(s)` inside each branch.

### TS notes

- Use `interface Cloneable<T>` or a `clone(): this` return type for precise typing.
- `clone(): this` (the polymorphic `this` type) is powerful — it preserves the exact subtype.
- `structuredClone<T>` is typed but doesn't preserve class prototypes.
- For class instances, implement `clone()` explicitly.
- Use `readonly` and `Readonly<T>` to discourage mutation after cloning.

---

## 10. Side-by-Side Comparison

| Concern | Rust | C++ | JS | TypeScript |
|---|---|---|---|---|
| **Built-in clone** | `Clone` trait | copy constructor | spread / `structuredClone` | spread / `structuredClone` (typed) |
| **Polymorphic clone** | `clone_box` helper (trait not object-safe) | virtual `clone()` returning `unique_ptr` | method `clone()` returning `new X(this)` | method `clone()` with covariant return |
| **Deep clone** | manual impl for `Rc` | manual in copy ctor | `structuredClone` | `structuredClone` |
| **Shallow clone** | `Rc::clone` (refcount) | copy of `shared_ptr` | `{...obj}` | `{...obj}` |
| **Class identity preserved** | yes (Rust has no classes) | yes | only if manual `clone()` | only if manual `clone()` |
| **Explicit or implicit** | explicit (must call `.clone()`) | implicit (copy ctor) | explicit | explicit |
| **Registry** | `HashMap<String, Box<dyn T>>` | `unordered_map<string, unique_ptr<T>>` | `Map` | `Map<string, Shape>` |
| **Object safety** | trait not object-safe → workaround | fine (virtual) | fine | fine |
| **Safety** | strong | manual (Rule of Three/Five) | weak (runtime) | strong (compile-time) |
| **Preferred form** | `#[derive(Clone)]` + `clone_box` for `dyn` | virtual `clone()` | `structuredClone` + `clone()` for classes | same + typed interface |

---

## 11. Tradeoffs

**Pros**

- Avoids expensive re-construction (DB, network, heavy compute).
- Avoids parallel class hierarchies (no Creator subclasses).
- Lets you clone objects whose concrete type is unknown at compile time.
- Preserves object configuration without re-running setup.
- Natural fit with registries of configured instances.
- In Rust, it's the language's default duplication mechanism.

**Cons**

- **Shallow vs deep** is a pervasive footgun. Getting it wrong creates aliasing bugs.
- Deep cloning is expensive for large object graphs; cloning is not free.
- Cloning objects with resources (file handles, sockets, locks) is often meaningless or dangerous.
- Cyclic references break naive deep clones (JS's `structuredClone` handles them; hand-rolled ones often don't).
- Clone logic must be maintained per class — forgetting a field silently produces incomplete copies.
- In C++, Rule of Three/Five adds ceremony.

**When to use**

- Construction is expensive (I/O, network, heavy computation).
- The concrete type is unknown at runtime.
- Many similar objects differ only in a few fields.
- You want a registry of preconfigured templates.
- Avoiding parallel Creator hierarchies matters.

**When NOT to use**

- Objects are cheap to construct (plain data) → just construct them.
- Objects hold OS resources (sockets, file handles, threads) → cloning is usually wrong.
- Deep cloning a large graph is more expensive than rebuilding.
- Types are simple and known → direct construction is clearer.

---

## 12. Alternatives

| Alternative | When it's better |
|---|---|
| **Direct construction** | Cheap, simple objects. |
| **Factory Method** | You want a named creation step per type. |
| **Abstract Factory** | You need a family of related products. |
| **Builder** | Complex multi-step construction with validation. |
| **Serialization round-trip** | Objects are serializable; deep clone comes free (but slower). |
| **Immutable data + structural sharing** | Persistent data structures (e.g., Immutable.js, Rust `im`). |
| **Copy-on-write** | Share until modified; avoids cloning entirely. |
| **`Default` + struct update** (Rust) | Config with most fields defaulted. |
| **Factory function** | One-line construction; no class hierarchy. |

---

## 13. Relationship to Other Patterns

Prototype appears inside or alongside:

- **Abstract Factory** — a factory may clone prototypes instead of constructing.
- **Composite** — cloning a composite clones the entire tree (deep clone).
- **Decorator** — cloning a decorated object clones the whole wrapper chain.
- **Memento** — mementos are often clones of object state.
- **Command** — cloning a command preserves its captured state.
- **Registry** — prototypes are typically stored in a registry keyed by name.

Where a pattern needs "duplicate this configured thing", Prototype is usually the underlying mechanism.

---

## 14. Mental Model

> **Prototype** = "Don't build it — **copy** it."

If your construction code looks like:

```js
const query1 = new Query("users").where("age", ">", 18).limit(10);
const query2 = new Query("users").where("age", ">", 18).limit(20);
const query3 = new Query("users").where("age", ">", 18).limit(50);
```

…a Prototype wants to be born:

```js
const base = new Query("users").where("age", ">", 18);
const query1 = base.clone().limit(10);
const query2 = base.clone().limit(20);
const query3 = base.clone().limit(50);
```

In Rust, every `.clone()` call you write is an instance of this pattern. In JS/TS, `structuredClone` is the built-in form. In C++, `clone()` on a polymorphic type is the classic shape.

---

## 15. Exercise

Build a **Prototype-based document system** in **Rust, C++, JavaScript, and TypeScript**.

**Prototype interface — `Document` with:**

- `clone()` — return a deep copy.
- `title()` — return the title.
- `appendSection(text)` — add a section.

**Concrete prototypes:**

- `Report` — has a title and a list of sections.
- `Invoice` — has a title, a list of line items (each with description + amount), and a total.

**Prototype Registry:**

- A `DocumentRegistry` that stores named prototypes.
- `create(key)` returns a **clone** of the stored prototype.

**Requirements:**

1. The client must be able to fetch a prototype by name and get an independent copy.
2. Mutating the copy must not affect the original or other copies.
3. `clone()` must be **deep**: nested lists/items must be copied.

**Language-specific requirements:**

- **Rust:**
  - Implement `Document` as a trait with `clone_box()` (use the object-safe workaround).
  - Derive `Clone` where possible; write a manual `Clone` for at least one type with a nested structure.
  - Implement the registry with `HashMap<String, Box<dyn Document>>`.
  - Bonus: use `Rc` to share immutable parts between clones (structural sharing) and compare to full deep clone.

- **C++:**
  - Implement `Document` with virtual `clone()` returning `std::unique_ptr<Document>`.
  - Write copy constructors for `Report` and `Invoice` that deep-copy nested vectors.
  - Implement the registry with `std::unordered_map<std::string, std::unique_ptr<Document>>`.
  - Note where the Rule of Three/Five applies.

- **JavaScript:**
  - Implement two variants: (a) class-based `clone()` methods, (b) plain-object prototypes with `structuredClone`.
  - Compare: which preserves class identity? Which is shorter? Which is safer for nested structures?
  - Show a case where `{...obj}` (shallow) silently shares nested arrays — and fix it.

- **TypeScript:**
  - Implement `interface Cloneable<T> { clone(): T }` and have `Report`/`Invoice` implement it.
  - Use `clone(): this` on at least one type to demonstrate the polymorphic `this` return type.
  - Implement the registry with `Map<string, Document>`.
  - Add a `structuredClone` helper with proper generic typing.

**Then answer:**

1. Which language made Prototype feel most natural, and why?
2. In each language, what happens if you forget to deep-clone a nested list? Write the bug and the fix.
3. For an object holding a `Socket` or a file handle, does `clone()` make sense? What would you do instead?
4. Where in each language's standard library is Prototype already used (e.g., Rust `Clone`, C++ copy ctor, JS `structuredClone`)?

---

Say **"next"** when you're ready for **Singleton** — the last Creational pattern — or **"review Prototype"** to walk through the exercise.