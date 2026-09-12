// 02_Builder Pattern - TypeScript Implementation

interface PizzaOptions {
  size: string;
  cheese: boolean;
  pepperoni: boolean;
  olives: boolean;
}

class Pizza {
  readonly options: Readonly<PizzaOptions>;

  constructor(options: Readonly<PizzaOptions>) {
    this.options = options;
  }
}

class PizzaBuilder {
  private opts: Partial<PizzaOptions> = { size: "medium" };

  size(s: string): this {
    this.opts.size = s;
    return this;
  }
  cheese(): this {
    this.opts.cheese = true;
    return this;
  }
  pepperoni(): this {
    this.opts.pepperoni = true;
    return this;
  }
  olives(): this {
    this.opts.olives = true;
    return this;
  }

  build(): Pizza {
    const {
      size = "medium",
      cheese = false,
      pepperoni = false,
      olives = false,
    } = this.opts;
    return new Pizza({ size, cheese, pepperoni, olives });
  }
}

function main(): void {
  console.log("=== [TypeScript] 02_Builder ===");
  const pizza = new PizzaBuilder().size("large").cheese().build();
  console.log(pizza);
}

main();
