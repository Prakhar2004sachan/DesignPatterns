// 04_Prototype_Pattern Pattern - JavaScript Implementation

// Shallow clone - spread / object.assign
const originalObj = { name: "periods", tags: ["new", "old"] };
const shallowObj = { ...originalObj };
shallowObj.tags.push("c");

console.log("------------------ Shallow Clone ---------------");
console.log("Original Object ---> ", originalObj);
console.log("Shallow Object ----> ", shallowObj);
console.log("\n");

// Deep clone - structuredClone
const originalObj2 = { name: "Alice", tags: ["a", "b"] };
const deep = structuredClone(originalObj2);
deep.tags.push("c");

console.log("------------------ Deep Clone ---------------");
console.log("Original Object 2 ---> ", originalObj2);
console.log("Deep Object ----> ", deep);
console.log("\n");

// Class Based clone
class Shape {
  clone() {
    throw new Error("abstract clone");
  }
  draw() {
    throw new Error("abstract draw");
  }
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

// Prototype registry
class ShapeRegistry {
  #prototypes = new Map();

  register(key, proto){
      this.#prototypes.set(key, proto);
  }
  create(key){
    const proto = this.#prototypes.get(key)
    if(!proto) throw new Error(`Unknown: ${key}`);
    return proto.clone();
  }
}

// clone using object create 
const baseShape = {
  draw() { console.log(`Drawing ${this.kind}`); },
  clone() { return Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this)); },
};



function main() {
  console.log("=== [JavaScript] 04_Prototype_Pattern ===");

  const shapes = [new Circle(2), new Square(3)];
  const copies = shapes.map((s) => s.clone());

  copies.forEach((s) => s.draw());

  // Prototype registry 
  const registry = new ShapeRegistry();
  registry.register("circle", new Circle(5))
  registry.register("sq", new Square(16))

  const sq = registry.create("sq");
  sq.draw();

  const circle = Object.create(baseShape);
  circle.kind = "circle";
  circle.radius = 2;

  const copy = circle.clone();
  copy.draw();
}

main();
