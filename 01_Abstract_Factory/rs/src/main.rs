/*
 * Abstract Factory Pattern (Approach 2: Enum / Parameterized Factory)
 *
 * In idiomatic Rust, instead of dynamic dispatch with traits and heap allocations (`Box<dyn Trait>`),
 * we can leverage Rust's powerful enum system:
 * - Avoids heap allocations (`Box`) and vtable indirection.
 * - Entirely stack-allocated and resolved via static dispatch.
 * - The compiler enforces exhaustive pattern matching across all OS variants.
 */

// 1. Family / Variant Enum
// Represents the distinct families of related products (e.g., Windows vs Mac).
#[derive(Clone, Copy, Debug, PartialEq)]
enum Os {
    Windows,
    Mac,
}

// 2. Concrete Products
// Products are parameterized by the OS variant and match on it during operations.
struct Button {
    os: Os,
}

impl Button {
    fn paint(&self) {
        match self.os {
            Os::Windows => println!("Rendering Windows button"),
            Os::Mac => println!("Rendering Mac button"),
        }
    }
}

struct Checkbox {
    os: Os,
}

impl Checkbox {
    fn paint(&self) {
        match self.os {
            Os::Windows => println!("Rendering Windows checkbox"),
            Os::Mac => println!("Rendering Mac checkbox"),
        }
    }
}

// 3. Concrete Factory
// The factory stores the selected OS family and produces consistent products for that family.
struct GuiFactory {
    os: Os,
}

impl GuiFactory {
    fn new(os: Os) -> Self {
        Self { os }
    }

    fn create_button(&self) -> Button {
        Button { os: self.os }
    }

    fn create_checkbox(&self) -> Checkbox {
        Checkbox { os: self.os }
    }
}

// 4. Client Code
// Operates on the factory to produce and render a cohesive family of UI components.
fn render_factory(factory: &GuiFactory) {
    let button = factory.create_button();
    let checkbox = factory.create_checkbox();

    button.paint();
    checkbox.paint();
}

fn main() {
    let os_str = "windows";

    // Select the product family based on runtime configuration
    let os = match os_str {
        "windows" => Os::Windows,
        "mac" => Os::Mac,
        _ => panic!("Unknown OS"),
    };

    let factory = GuiFactory::new(os);

    render_factory(&factory);
}
