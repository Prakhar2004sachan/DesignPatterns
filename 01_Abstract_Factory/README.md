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

# Abstract Factory

## 1. Intent

Provide an interface for creating **families of related or dependent objects** without specifying their concrete classes.

The client code works only with **abstract** factories and **abstract** products. At runtime, a concrete factory is plugged in, and it produces a matching family of products. The family is guaranteed to be consistent — you never accidentally mix a Mac button with a Windows checkbox.

---

## 2. The Problem It Solves

Imagine a cross-platform UI toolkit. You need:

- `Button`
- `Checkbox`
- `Scrollbar`

Each must exist for **Windows**, **macOS**, and **Linux**.

Without Abstract Factory, client code becomes:

```cpp
if (os == "windows") {
    auto b = new WindowsButton();
    auto c = new WindowsCheckbox();
} else if (os == "mac") {
    auto b = new MacButton();
    auto c = new MacCheckbox();
}
```

Problems:

- **Rigid** — every new OS means editing every `if/else`.
- **Inconsistent** — nothing stops you from creating `MacButton` + `WindowsCheckbox`.
- **Violates Open/Closed** — the client is not closed to modification.

Abstract Factory fixes this by moving creation behind an interface.

---

## 3. Structure

```
        ┌─────────────────┐          ┌─────────────────┐
        │  AbstractFactory│          │  AbstractProductA│
        │                 │          │                  │
        │ +createProductA │          │ +operationA()    │
        │ +createProductB │          └────────┬─────────┘
        └────────┬────────┘                   │
                 │                    ┌───────┴────────┐
       ┌─────────┴─────────┐          │                │
       │                   │     ProductA1      ProductA2
ConcreteFactory1    ConcreteFactory2
       │                   │
       │ creates ──► ProductA1, ProductB1
       │                   │
       └──► ProductA2, ProductB2
```

Participants:

| Role | Responsibility |
|---|---|
| **Abstract Factory** | Declares creation methods for each product. |
| **Concrete Factory** | Implements creation for one family. |
| **Abstract Product** | Interface for a product type. |
| **Concrete Product** | Implementation of a product for one family. |
| **Client** | Uses only abstract interfaces. |

**Key point:** Abstract Factory ≠ Factory Method. Factory Method creates **one** product; Abstract Factory creates a **family** (2 or more related products).

---

## 4. Rust Implementation

Rust has no classical inheritance, so we use **traits** for abstract products and factories. Dynamic dispatch via `Box<dyn Trait>` is the most direct translation.

```rust
// ---------- Abstract Products ----------
trait Button {
    fn paint(&self);
}

trait Checkbox {
    fn paint(&self);
}

// ---------- Abstract Factory ----------
trait GuiFactory {
    fn create_button(&self) -> Box<dyn Button>;
    fn create_checkbox(&self) -> Box<dyn Checkbox>;
}

// ---------- Concrete Products: Windows ----------
struct WindowsButton;
impl Button for WindowsButton {
    fn paint(&self) { println!("Windows Button"); }
}

struct WindowsCheckbox;
impl Checkbox for WindowsCheckbox {
    fn paint(&self) { println!("Windows Checkbox"); }
}

// ---------- Concrete Products: Mac ----------
struct MacButton;
impl Button for MacButton {
    fn paint(&self) { println!("Mac Button"); }
}

struct MacCheckbox;
impl Checkbox for MacCheckbox {
    fn paint(&self) { println!("Mac Checkbox"); }
}

// ---------- Concrete Factories ----------
struct WindowsFactory;
impl GuiFactory for WindowsFactory {
    fn create_button(&self)   -> Box<dyn Button>   { Box::new(WindowsButton) }
    fn create_checkbox(&self) -> Box<dyn Checkbox> { Box::new(WindowsCheckbox) }
}

struct MacFactory;
impl GuiFactory for MacFactory {
    fn create_button(&self)   -> Box<dyn Button>   { Box::new(MacButton) }
    fn create_checkbox(&self) -> Box<dyn Checkbox> { Box::new(MacCheckbox) }
}

// ---------- Client ----------
fn render_ui(factory: &dyn GuiFactory) {
    let button = factory.create_button();
    let checkbox = factory.create_checkbox();
    button.paint();
    checkbox.paint();
}

fn main() {
    let os = "mac";
    let factory: Box<dyn GuiFactory> = if os == "mac" {
        Box::new(MacFactory)
    } else {
        Box::new(WindowsFactory)
    };

    render_ui(&*factory);
}
```

### Rust idiom — static dispatch with generics

If you know the factory at compile time, skip `Box<dyn ...>` for zero-cost abstraction:

```rust
fn render_ui<F: GuiFactory>(factory: &F) {
    let button = factory.create_button();
    let checkbox = factory.create_checkbox();
    button.paint();
    checkbox.paint();
}
```

### Rust idiom — enum-based factory (often better)

When the set of families is **closed** (known at compile time), Rust programmers usually prefer an `enum` over trait objects. This avoids heap allocation and dynamic dispatch entirely:

```rust
enum Os { Windows, Mac }

struct Button { os: Os }
struct Checkbox { os: Os }

impl Button {
    fn paint(&self) {
        match self.os {
            Os::Windows => println!("Windows Button"),
            Os::Mac     => println!("Mac Button"),
        }
    }
}

impl Checkbox {
    fn paint(&self) {
        match self.os {
            Os::Windows => println!("Windows Checkbox"),
            Os::Mac     => println!("Mac Checkbox"),
        }
    }
}

struct GuiFactory { os: Os }

impl GuiFactory {
    fn create_button(&self)   -> Button   { Button { os: self.os.clone() } }
    fn create_checkbox(&self) -> Checkbox { Checkbox { os: self.os.clone() } }
}
```

**Rule of thumb in Rust:**

- Open set of families → trait objects (`Box<dyn Trait>`).
- Closed set of families → `enum` + `match` (more idiomatic, faster, no allocation).

---

## 5. C++ Implementation

C++ is the language the GoF book was written around. Virtual functions + smart pointers map perfectly.

```cpp
#include <iostream>
#include <memory>
#include <string>

// ---------- Abstract Products ----------
class Button {
public:
    virtual ~Button() = default;
    virtual void paint() const = 0;
};

class Checkbox {
public:
    virtual ~Checkbox() = default;
    virtual void paint() const = 0;
};

// ---------- Abstract Factory ----------
class GuiFactory {
public:
    virtual ~GuiFactory() = default;
    virtual std::unique_ptr<Button>   createButton()   const = 0;
    virtual std::unique_ptr<Checkbox> createCheckbox() const = 0;
};

// ---------- Concrete Products: Windows ----------
class WindowsButton : public Button {
public:
    void paint() const override { std::cout << "Windows Button\n"; }
};

class WindowsCheckbox : public Checkbox {
public:
    void paint() const override { std::cout << "Windows Checkbox\n"; }
};

// ---------- Concrete Products: Mac ----------
class MacButton : public Button {
public:
    void paint() const override { std::cout << "Mac Button\n"; }
};

class MacCheckbox : public Checkbox {
public:
    void paint() const override { std::cout << "Mac Checkbox\n"; }
};

// ---------- Concrete Factories ----------
class WindowsFactory : public GuiFactory {
public:
    std::unique_ptr<Button> createButton() const override {
        return std::make_unique<WindowsButton>();
    }
    std::unique_ptr<Checkbox> createCheckbox() const override {
        return std::make_unique<WindowsCheckbox>();
    }
};

class MacFactory : public GuiFactory {
public:
    std::unique_ptr<Button> createButton() const override {
        return std::make_unique<MacButton>();
    }
    std::unique_ptr<Checkbox> createCheckbox() const override {
        return std::make_unique<MacCheckbox>();
    }
};

// ---------- Client ----------
void renderUI(const GuiFactory& factory) {
    auto button   = factory.createButton();
    auto checkbox = factory.createCheckbox();
    button->paint();
    checkbox->paint();
}

int main() {
    std::string os = "mac";
    std::unique_ptr<GuiFactory> factory;

    if (os == "mac") {
        factory = std::make_unique<MacFactory>();
    } else {
        factory = std::make_unique<WindowsFactory>();
    }

    renderUI(*factory);
}
```

### C++ notes

- Use `std::unique_ptr` for ownership. Never return raw owning pointers.
- Always give abstract base classes a **virtual destructor**.
- You can also do compile-time Abstract Factory with **templates** and **policy classes** (no virtuals, no heap):

```cpp
template <typename FactoryPolicy>
void renderUI() {
    auto button   = FactoryPolicy::createButton();
    auto checkbox = FactoryPolicy::createCheckbox();
    button.paint();
    checkbox.paint();
}

struct MacFactoryPolicy {
    static MacButton   createButton()   { return {}; }
    static MacCheckbox createCheckbox() { return {}; }
};
```

That is the **policy-based design** variant — common in high-performance C++.

---

## 6. JavaScript Implementation

JS has no interfaces, but we can enforce shape by convention, by classes, or by duck typing.

### Class-based version

```js
// ---------- Abstract Products ----------
class Button {
  paint() { throw new Error("Abstract method: paint()"); }
}

class Checkbox {
  paint() { throw new Error("Abstract method: paint()"); }
}

// ---------- Concrete Products: Windows ----------
class WindowsButton extends Button {
  paint() { console.log("Windows Button"); }
}

class WindowsCheckbox extends Checkbox {
  paint() { console.log("Windows Checkbox"); }
}

// ---------- Concrete Products: Mac ----------
class MacButton extends Button {
  paint() { console.log("Mac Button"); }
}

class MacCheckbox extends Checkbox {
  paint() { console.log("Mac Checkbox"); }
}

// ---------- Concrete Factories ----------
class WindowsFactory {
  createButton()   { return new WindowsButton(); }
  createCheckbox() { return new WindowsCheckbox(); }
}

class MacFactory {
  createButton()   { return new MacButton(); }
  createCheckbox() { return new MacCheckbox(); }
}

// ---------- Client ----------
function renderUI(factory) {
  const button   = factory.createButton();
  const checkbox = factory.createCheckbox();
  button.paint();
  checkbox.paint();
}

const os = "mac";
const factory = os === "mac" ? new MacFactory() : new WindowsFactory();
renderUI(factory);
```

### Functional / closure version (very idiomatic JS)

```js
const createWindowsFactory = () => ({
  createButton:   () => ({ paint: () => console.log("Windows Button") }),
  createCheckbox: () => ({ paint: () => console.log("Windows Checkbox") }),
});

const createMacFactory = () => ({
  createButton:   () => ({ paint: () => console.log("Mac Button") }),
  createCheckbox: () => ({ paint: () => console.log("Mac Checkbox") }),
});

function renderUI(factory) {
  factory.createButton().paint();
  factory.createCheckbox().paint();
}

renderUI(createMacFactory());
```

### JS notes

- No compile-time enforcement. You can add a runtime `abstract` guard (as above) but most JS teams skip it.
- The factory is often just **an object literal of functions**. That's duck typing at its finest.
- In TypeScript you'd use `interface GuiFactory` and get compile-time safety back.

---

## 7. Side-by-Side Comparison

| Concern | Rust | C++ | JS |
|---|---|---|---|
| Abstract product | `trait` | pure virtual class | class / duck type |
| Abstract factory | `trait` with factory methods | pure virtual class | object / class |
| Dynamic dispatch | `Box<dyn Trait>` | `virtual` + smart ptr | normal method call |
| Static dispatch | generics `<F: GuiFactory>` | templates / policy | N/A (JIT) |
| Preferred alternative | `enum` + `match` for closed sets | policy-based templates | closures |
| Memory safety | guaranteed | RAII + smart pointers | GC |
| Compile-time contract | strong | strong | weak (unless TS) |

---

## 8. Tradeoffs

**Pros**

- Guarantees **product family consistency**.
- Isolates concrete classes from client.
- Easy to swap entire families (e.g., theming, platform).
- Supports Open/Closed for new families.

**Cons**

- Adding a **new product type** (e.g., `Scrollbar`) forces changes in every factory — this is the well-known "extensibility axis" problem.
- More classes / traits / indirection.
- Overkill when there is only one family, or when families are open-ended and unstable.

**When to use**

- Systems that must be independent of how their products are created.
- Multiple platform/variant families that must stay consistent.
- A library that should be configured with a family by the user.

**When NOT to use**

- Only one family ever exists → just instantiate directly.
- Only one product per factory → use Factory Method.
- Families change constantly → consider a registry or DI container instead.

---

## 9. Alternatives

| Alternative | When it's better |
|---|---|
| **Factory Method** | Only one product per factory. |
| **Builder** | Object construction has many steps/options, not multiple families. |
| **Prototype** | Families defined by cloning existing instances. |
| **Dependency Injection / DI container** | Runtime-configurable families without a class hierarchy. |
| **Enum + match (Rust)** | Closed set of families. |
| **Policy-based templates (C++)** | Zero-overhead, compile-time families. |
| **Closures / object literals (JS)** | Families are just data + functions. |

---

## 10. Mental Model

> **Factory Method** = "create **a** thing, subclass decides which."
> **Abstract Factory** = "create **a matching set of** things, one factory per family."

If you ever catch yourself writing:

```js
if (platform === "mac") {
  new MacButton();
  new MacCheckbox();
  new MacScrollbar();
}
```

…that's a signal an Abstract Factory wants to be born.

---

## 11. Mini Exercise

Build an **Abstract Factory for a database layer** with two product families:

- **Products:** `Connection`, `Command`
- **Families:** `Postgres`, `MySQL`

Requirements:

1. `Connection` exposes `connect()` and `close()`.
2. `Command` exposes `execute(sql)` and `prepare(sql)`.
3. A factory `DatabaseFactory` creates both.
4. A client function `runQuery(factory, sql)` uses the factory without knowing which DB it is.
5. Implement it in **Rust**, **C++**, and **JavaScript**.
6. Bonus (Rust): reimplement using an `enum` instead of `dyn` traits, and compare.

---

When you're ready, say **"next"** and we'll do **Builder** (the second Creational pattern), or say **"review Abstract Factory"** if you want to walk through the exercise together first.

# TypeScript Implementation — Abstract Factory

TypeScript is the sweet spot for Abstract Factory: it gives you **C++-style compile-time contracts** with **JavaScript-style runtime flexibility**. You get real interfaces, `abstract` classes, and generics — plus the ability to fall back to closures whenever a class hierarchy is overkill.

---

## 1. Classic interface-based version

This is the most direct translation. Interfaces define the abstract products and the abstract factory.

```ts
// ---------- Abstract Products ----------
interface Button {
  paint(): void;
}

interface Checkbox {
  paint(): void;
}

// ---------- Abstract Factory ----------
interface GuiFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

// ---------- Concrete Products: Windows ----------
class WindowsButton implements Button {
  paint(): void {
    console.log("Windows Button");
  }
}

class WindowsCheckbox implements Checkbox {
  paint(): void {
    console.log("Windows Checkbox");
  }
}

// ---------- Concrete Products: Mac ----------
class MacButton implements Button {
  paint(): void {
    console.log("Mac Button");
  }
}

class MacCheckbox implements Checkbox {
  paint(): void {
    console.log("Mac Checkbox");
  }
}

// ---------- Concrete Factories ----------
class WindowsFactory implements GuiFactory {
  createButton(): Button {
    return new WindowsButton();
  }
  createCheckbox(): Checkbox {
    return new WindowsCheckbox();
  }
}

class MacFactory implements GuiFactory {
  createButton(): Button {
    return new MacButton();
  }
  createCheckbox(): Checkbox {
    return new MacCheckbox();
  }
}

// ---------- Client ----------
function renderUI(factory: GuiFactory): void {
  const button = factory.createButton();
  const checkbox = factory.createCheckbox();
  button.paint();
  checkbox.paint();
}

const os: "mac" | "windows" = "mac";
const factory: GuiFactory = os === "mac" ? new MacFactory() : new WindowsFactory();
renderUI(factory);
```

**What TS adds over JS here:**

- `interface GuiFactory` is a **compile-time contract**. If `MacFactory` forgets `createCheckbox`, the build fails.
- `implements Button` forces the concrete product to match the shape.
- The `os` variable is a **union literal type** — the compiler knows only `"mac"` or `"windows"` are valid.

---

## 2. `abstract class` variant

If you want to enforce partial implementation or share state/logic between concrete factories, use `abstract class` instead of `interface`.

```ts
abstract class GuiFactory {
  abstract createButton(): Button;
  abstract createCheckbox(): Checkbox;

  // shared behavior — template method style
  render(): void {
    this.createButton().paint();
    this.createCheckbox().paint();
  }
}

class MacFactory extends GuiFactory {
  createButton(): Button {
    return new MacButton();
  }
  createCheckbox(): Checkbox {
    return new MacCheckbox();
  }
}

const f = new MacFactory();
f.render(); // paints both
```

**Interface vs abstract class — when to use which:**

| Use | When |
|---|---|
| `interface` | You only need a contract. No shared code. Preferred by default. |
| `abstract class` | You want shared implementation or protected state. |

---

## 3. Functional / closure version (idiomatic TS)

TS lets you express the same pattern without classes at all. Each "product" is a plain object conforming to an interface, and the factory is just an object literal.

```ts
interface Button {
  paint(): void;
}

interface Checkbox {
  paint(): void;
}

interface GuiFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

const createWindowsFactory = (): GuiFactory => ({
  createButton: () => ({ paint: () => console.log("Windows Button") }),
  createCheckbox: () => ({ paint: () => console.log("Windows Checkbox") }),
});

const createMacFactory = (): GuiFactory => ({
  createButton: () => ({ paint: () => console.log("Mac Button") }),
  createCheckbox: () => ({ paint: () => console.log("Mac Checkbox") }),
});

function renderUI(factory: GuiFactory): void {
  factory.createButton().paint();
  factory.createCheckbox().paint();
}

renderUI(createMacFactory());
```

This is often the **best choice in real TS codebases** — less boilerplate, same type safety, and no `new`.

---

## 4. Advanced TS: generic abstract factory

You can parameterize the family with a **discriminated union** to get exhaustive checking at compile time. This is the TS analogue of Rust's `enum + match`.

```ts
type Platform = "windows" | "mac";

interface Button {
  paint(): void;
}

interface Checkbox {
  paint(): void;
}

class WindowsButton implements Button {
  paint() { console.log("Windows Button"); }
}
class MacButton implements Button {
  paint() { console.log("Mac Button"); }
}

class WindowsCheckbox implements Checkbox {
  paint() { console.log("Windows Checkbox"); }
}
class MacCheckbox implements Checkbox {
  paint() { console.log("Mac Checkbox"); }
}

function createButton(platform: Platform): Button {
  switch (platform) {
    case "windows": return new WindowsButton();
    case "mac":     return new MacButton();
  }
}

function createCheckbox(platform: Platform): Checkbox {
  switch (platform) {
    case "windows": return new WindowsCheckbox();
    case "mac":     return new MacCheckbox();
  }
}

function renderUI(platform: Platform): void {
  createButton(platform).paint();
  createCheckbox(platform).paint();
}
```

The `switch` is **exhaustive**: if you add `"linux"` to `Platform`, TypeScript errors until every `switch` handles it. That's the same safety Rust's `match` gives you.

---

## 5. Fully generic factory (advanced)

If products share a common shape, you can build a truly generic factory:

```ts
interface Product {
  paint(): void;
}

interface Factory<T extends Product> {
  create(): T;
}

class WindowsFactory implements Factory<WindowsButton> {
  create(): WindowsButton {
    return new WindowsButton();
  }
}
```

Use sparingly — generics on factories often add complexity without buying much over a plain interface.

---

## 6. TypeScript-specific tradeoffs

| Concern | TypeScript |
|---|---|
| Compile-time contract | ✅ `interface` / `abstract class` |
| Runtime enforcement | ❌ erased — an incorrect cast can still break at runtime |
| Classes vs closures | Both idiomatic. Closures + interfaces often cleaner. |
| Discriminated unions | ✅ preferred over class hierarchies in modern TS |
| Zero-cost | ❌ TS is erased, but JS engines JIT well |
| `new` keyword | Optional — factories can be plain functions returning objects |

### Key TS idioms to prefer

1. **`interface` over `abstract class`** unless you need shared code.
2. **Object literals + functions** over `new` when there's no state.
3. **Discriminated unions + `switch`** for closed families (mirrors Rust enums).
4. **`readonly` fields** for immutable products.
5. **`satisfies`** (TS 4.9+) to validate a factory object without widening its type:

```ts
const macFactory = {
  createButton: () => new MacButton(),
  createCheckbox: () => new MacCheckbox(),
} satisfies GuiFactory;
```

This gives you a concrete inferred type *and* the contract check.

---

## 7. Updated side-by-side comparison

| Concern | Rust | C++ | JS | **TypeScript** |
|---|---|---|---|---|
| Abstract product | `trait` | pure virtual class | class / duck type | **`interface`** |
| Abstract factory | `trait` with factory methods | pure virtual class | object / class | **`interface` or `abstract class`** |
| Dynamic dispatch | `Box<dyn Trait>` | `virtual` + smart ptr | normal method call | **normal method call** |
| Static dispatch | generics `<F: GuiFactory>` | templates / policy | N/A | **generics `<F extends GuiFactory>`** |
| Compile-time contract | ✅ strong | ✅ strong | ❌ none | ✅ **strong (erased at runtime)** |
| Preferred alternative | `enum` + `match` | policy-based templates | closures | **discriminated unions + closures** |
| Memory | RAII / ownership | RAII + smart pointers | GC | **GC** |
| Boilerplate | medium | high | low | **low-medium** |
| Best fit for closed families | `enum` | templates | object map | **discriminated union** |

---

## 8. Recommended TS version to remember

For most real projects, this is the one to reach for:

```ts
interface GuiFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

const macFactory: GuiFactory = {
  createButton: () => ({ paint: () => console.log("Mac Button") }),
  createCheckbox: () => ({ paint: () => console.log("Mac Checkbox") }),
};
```

…and only escalate to classes or `abstract class` when you need shared behavior or protected state.

---

## 9. Mini exercise update

Add to the earlier DB-layer exercise:

**TypeScript requirement:** implement `DatabaseFactory` using **both**:

1. An `interface`-based version with classes.
2. A closure-based version with `satisfies DatabaseFactory`.

Then compare line count, readability, and how easy it would be to add a third database (`SQLite`).

---

Ready for **Builder**? Or want to walk through the Abstract Factory exercise in TS first?