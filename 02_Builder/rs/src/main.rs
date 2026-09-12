#[derive(Debug)]
#[allow(dead_code)]
struct Pizza {
    size: String,
    cheese: bool,
    pepperoni: bool,
    olives: bool,
}

struct PizzaBuilder {
    size: String,
    cheese: bool,
    pepperoni: bool,
    olives: bool,
}

#[allow(dead_code)]
impl PizzaBuilder {
    fn new() -> Self {
        PizzaBuilder {
            size: "medium".into(),
            cheese: false,
            pepperoni: false,
            olives: false
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

    fn olives(mut self) -> Self {
        self.olives = true;
        self
    }

    fn build(self) -> Pizza {
        Pizza {
            size: self.size,
            cheese: self.cheese,
            pepperoni: self.pepperoni,
            olives: self.olives,
        }
    }

}

fn main() {
    println!("=== [Rust] 02_Builder ===");
      let pizza = PizzaBuilder::new()
        .size("large")
        .cheese()
        .pepperoni()
        .olives()
        .build();

    println!("{:#?}", pizza);
}
