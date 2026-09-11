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
