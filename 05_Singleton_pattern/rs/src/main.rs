use std::sync::OnceLock;

// Using Once Lock
struct Config {
    name: String,
    retries: u32
}

static INSTANCE : OnceLock<Config> = OnceLock::new();

fn config() -> &'static Config{
    INSTANCE.get_or_init(|| Config { name: "Hello".into(), retries: 3 })
}

fn main() {
    println!("=== [Rust] 05_Singleton_pattern ===");
    println!("{}", config().name);
    println!("{}", config().retries);
}
