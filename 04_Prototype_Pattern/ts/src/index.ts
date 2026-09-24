// 04_Prototype_Pattern Pattern - TypeScript Implementation

interface Shape {
  clone(): Shape;
  draw(): void;
}

class Circle implements Shape {
  readonly r: number;

  constructor(r: number) {
    this.r = r;
  }

  draw(): void {
    console.log(`Drawing circle with radius : ${this.r}`);
  }

  clone(): Shape {
    return new Circle(this.r);
  }
}

class Square implements Shape {
  readonly s: number;

  constructor(s: number) {
    this.s = s;
  }

  draw(): void {
    console.log(`Drawing square with sides : ${this.s}`);
  }

  clone(): Shape {
    return new Square(this.s);
  }
}

// Generics
interface Clonable<T> {
  clone(): T;
}

class Config implements Clonable<Config> {
  readonly name: string;
  readonly retries: number;
  readonly tags: string[];

  constructor(name: string, retries: number, tags: string[]) {
    this.name = name;
    this.retries = retries;
    this.tags = tags;
  }

  clone(): Config {
    return new Config(this.name, this.retries, this.tags);
  }
}

function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

// Prototype registory
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

function main(): void {
  console.log("=== [TypeScript] 04_Prototype_Pattern ===");

  const shapes: Shape[] = [new Circle(2), new Square(3)];
  const copies = shapes.map((s) => s.clone());
  copies.forEach((s) => s.draw());

  const original2 = { name: "Alice", tags: ["a", "b"] };
  const deep: typeof original = structuredClone(original2);
  console.log(deep)

  // Readonly + deep clone
  const original: Readonly<{ name: string; tags: string[] }> = {
    name: "Alice",
    tags: ["a", "b"],
  };
  const copy = deepClone(original);
  console.log(copy)
}

main();
