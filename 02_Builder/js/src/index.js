// 02_Builder Pattern - JavaScript Implementation

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

  size(s) {
    this.#size = s;
    return this;
  }

  cheese() {
    this.#cheese = true;
    return this;
  }

  pepperoni() {
    this.#pepperoni = true;
    return this;
  }

  olives() {
    this.#olives = true;
    return this;
  }

  build() {
    return new Pizza({
      size: this.#size,
      cheese: this.#cheese,
      pepperoni: this.#pepperoni,
      olives: this.#olives,
    });
  }
}

function main() {
  console.log("=== [JavaScript] 02_Builder ===");

  const pizzaBuilder = new PizzaBuilder().size("large").cheese();
  const pizza = pizzaBuilder.build();

  console.log(pizza);
}

main();
