use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

// ============================================================================
// 1. Why Config { tags: Vec<String> } was ALREADY a Deep Copy in Rust
// ============================================================================
// In JS/Python, objects & arrays are reference types by default.
// In Rust, Vec and String have VALUE (ownership) semantics!
// When you #[derive(Clone)] on Vec<String>, Rust allocates a BRAND NEW heap
// buffer and duplicates every string. It is NOT a shallow copy!
#[derive(Clone, Debug)]
#[allow(dead_code)]
struct ConfigDeep {
    name: String,
    retries: u32,
    tags: Vec<String>,
}

fn demonstrate_value_semantics_clone() {
    println!("\n--- 1. Rust Default Clone (Value Semantics = Independent Heap Copy) ---");
    let original = ConfigDeep {
        name: "prod".into(),
        retries: 3,
        tags: vec!["a".into(), "b".into()],
    };

    let mut copy = original.clone();
    copy.tags.push("c".into());

    println!("Original tags : {:?}", original.tags); // ["a", "b"] -> untouched!
    println!("Copy tags     : {:?}", copy.tags);     // ["a", "b", "c"]
    println!("Why? Rust's Vec::clone() allocated a brand new vector on the heap.");
}

// ============================================================================
// 2. How to create a TRUE Shallow Copy in Rust using Rc (and RefCell for mutation)
// ============================================================================
// If you WANT the JavaScript-style shallow copy (where copy and original share
// the exact same underlying heap data and mutations reflect in both):
#[derive(Clone, Debug)]
#[allow(dead_code)]
struct ConfigShallow {
    name: String,
    // Rc = Shared heap pointer (Reference Counted)
    // RefCell = Allows mutation through a shared reference (&T)
    tags: Rc<RefCell<Vec<String>>>,
}

fn demonstrate_true_shallow_copy() {
    println!("\n--- 2. True Shallow Copy using Rc<RefCell<...>> ---");
    let original = ConfigShallow {
        name: "prod".into(),
        tags: Rc::new(RefCell::new(vec!["a".into(), "b".into()])),
    };

    // Cloning Rc only increments the reference count (pointer copy),
    // it does NOT clone the inner Vec!
    let copy = original.clone();

    println!("Before mutation: Rc strong_count = {}", Rc::strong_count(&original.tags));

    // Mutate via the copy
    copy.tags.borrow_mut().push("c".into());

    println!("Original tags : {:?}", original.tags.borrow()); // ["a", "b", "c"] -> MUTATED!
    println!("Copy tags     : {:?}", copy.tags.borrow());     // ["a", "b", "c"]
    println!("Original address : {:p}", original.tags.as_ptr());
    println!("Copy address     : {:p}", copy.tags.as_ptr());
    println!("Addresses match! Both point to the exact same heap memory.");
}

// ============================================================================
// 3. Tree / Node: Shallow Clone vs Deep Clone with Rc<Node>
// ============================================================================
#[derive(Debug)]
struct Node {
    value: i32,
    children: Vec<Rc<Node>>,
}

impl Node {
    fn new(value: i32) -> Self {
        Node {
            value,
            children: Vec::new(),
        }
    }

    fn add_child(&mut self, child: Node) {
        self.children.push(Rc::new(child));
    }

    // Shallow Clone: clones the Vec and the Rc pointers (O(1) ref count bump per child).
    // The child Nodes themselves are NOT duplicated.
    fn shallow_clone(&self) -> Self {
        Node {
            value: self.value,
            children: self.children.clone(), // Clones the Rc pointers, not the Nodes!
        }
    }

    // Deep Clone: recursively clones each Node into a brand new heap allocation!
    fn deep_clone(&self) -> Self {
        Node {
            value: self.value,
            children: self
                .children
                .iter()
                .map(|c| Rc::new(c.deep_clone())) // Recursive deep clone!
                .collect(),
        }
    }
}

fn demonstrate_tree_shallow_vs_deep() {
    println!("\n--- 3. Node Tree: Shallow Clone vs Deep Clone ---");
    let mut root = Node::new(1);
    root.add_child(Node::new(2));
    root.add_child(Node::new(3));

    println!("Initial state:");
    println!("  Root child 0 address  : {:p}", Rc::as_ptr(&root.children[0]));
    println!("  Root child 0 Rc count : {}", Rc::strong_count(&root.children[0])); // 1

    // ────────────────────────────────────────────────────────────────────────
    // A. SHALLOW CLONE
    // ────────────────────────────────────────────────────────────────────────
    println!("\nStep A: Creating shallow clone...");
    let shallow = root.shallow_clone();
    println!("  Root child 0 address   : {:p}", Rc::as_ptr(&root.children[0]));
    println!("  Shallow child 0 address: {:p}", Rc::as_ptr(&shallow.children[0]));
    println!("  Addresses MATCH! (Same memory location)");
    println!("  Root child 0 Rc count  : {}", Rc::strong_count(&root.children[0])); // 2 (root + shallow)
    println!("  Why count = 2? Because shallow_clone() only copied the Rc POINTER,");
    println!("  incrementing the reference count on the EXISTING child node.");

    // Now let's drop `shallow` so you see count go back to 1:
    drop(shallow);
    println!("\nAfter drop(shallow):");
    println!("  Root child 0 Rc count  : {}", Rc::strong_count(&root.children[0])); // 1

    // ────────────────────────────────────────────────────────────────────────
    // B. DEEP CLONE
    // ────────────────────────────────────────────────────────────────────────
    println!("\nStep B: Creating deep clone...");
    let deep = root.deep_clone();
    println!("  Root child 0 address : {:p}", Rc::as_ptr(&root.children[0]));
    println!("  Deep child 0 address : {:p}", Rc::as_ptr(&deep.children[0]));
    println!("  Addresses DIFFER! (Completely separate memory location)");
    println!("  Root child 0 Rc count: {}", Rc::strong_count(&root.children[0])); // Still 1!
    println!("  Deep child 0 Rc count: {}", Rc::strong_count(&deep.children[0])); // 1 (brand new Rc)
    println!("  Why did count stay 1 on root? Because deep_clone() did NOT copy the pointer.");
    println!("  It dereferenced the child, created a brand-new Node, and wrapped it in a brand-new Rc::new()!");
}

// Prototype with Box<dyn Trait>
trait Shape: ShapeClone {
    fn draw(&self);
    fn area(&self) -> f64;
}

trait ShapeClone {
    fn clone_box(&self) -> Box<dyn Shape>;
}

impl<T> ShapeClone for T 
where
    T : 'static + Shape + Clone,
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

fn demonstrate_with_box_dyn_trait() {
     let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 2.0 }),
        Box::new(Square { side: 3.0 }),
    ];

    let copies: Vec<Box<dyn Shape>> = shapes.iter().map(|s| s.clone()).collect();
    for s in &copies {
        s.draw();
        println!("  area = {:.2}", s.area());
    }    
}

// Prototype registory
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

fn demonstrate_with_box_dyn_trait_registory() {
     let mut registry = ShapeRegistry::new();

     // 1. Setup baseline prototypes once at startup:
    registry.register("small_circle", Box::new(Circle { radius: 2.0 }));
    registry.register("large_circle", Box::new(Circle { radius: 10.0 }));
    registry.register("box", Box::new(Square { side: 4.0 }));
    // 2. Clone whenever needed on demand:
    if let Some(shape) = registry.create("small_circle") {
        shape.draw(); // Prints: Circle r=2
    }
    if let Some(shape) = registry.create("box") {
        shape.draw(); // Prints: Square s=4
    }
    // 3. Asking for an unknown key safely returns None:
    let unknown = registry.create("triangle");
    assert!(
    unknown.is_none(), 
    "Expected 'triangle' to be missing, but found a shape!"
);

}

fn main() {
    println!("=== [Rust] 04_Prototype_Pattern: Shallow vs Deep Copy & Rc ===");
    demonstrate_value_semantics_clone();
    demonstrate_true_shallow_copy();
    demonstrate_tree_shallow_vs_deep();

    // Prototype with Box<dyn Trait>
    demonstrate_with_box_dyn_trait();

    // Prototype registory
    demonstrate_with_box_dyn_trait_registory();
}

