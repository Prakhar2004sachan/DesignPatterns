use std::cell::RefCell;
use std::sync::{Arc, LazyLock, Mutex, OnceLock};
use std::thread;

// Static and const delclared varibales is the global variable

// Using Once Lock
struct Config {
    name: String,
    retries: u32
}

static INSTANCE : OnceLock<Config> = OnceLock::new();

fn config() -> &'static Config{
    INSTANCE.get_or_init(|| Config { name: "Hello".into(), retries: 3 })
}

// Using Lazy Lock
static CONFIG: LazyLock<Config> = LazyLock::new(|| Config {
    retries: 3,
    name: "prod".into(),
});

// Mutable global state 
struct Counter {
    count: u64,
}

static  COUNTER : OnceLock<Mutex<Counter>> = OnceLock::new();

fn counter() -> &'static Mutex<Counter> {
    COUNTER.get_or_init(|| Mutex::new(Counter{
        count: 0
    }))
}

fn increment() {
    let mut c = counter().lock().unwrap();
    c.count += 1;
}

// =========================================================================
// BETTER ALTERNATIVES (Avoiding Global Variables entirely)
// =========================================================================

// 1. Dependency Primitives
#[derive(Debug, Clone)]
struct LocalConfig {
    db_url: String,
}

#[derive(Debug)]
struct Logger {
    level: String,
}

struct SharedState {
    request_count: u64,
}

// Alternative A: Pass Dependencies Explicitly
// Instead of reaching out to a global variable, this function requests exactly what it needs.
fn run_service(config: &LocalConfig) {
    println!("[Explicit Pass] Running service with DB: {}", config.db_url);
}

// Alternative B: Use a Context Struct
// Bundle all cross-cutting dependencies into one container and pass that down.
struct AppContext {
    config: LocalConfig,
    logger: Logger,
}

fn handle_request(ctx: &AppContext) {
    println!("[Context Struct] Logger level: {}", ctx.logger.level);
    println!("[Context Struct] Target DB: {}", ctx.config.db_url);
}

// Thread local singleton - per thread singleton
thread_local! {
    static LOCAL: RefCell<u32> = RefCell::new(0);
}

fn main() {
    println!("=== [Rust] 05_Singleton_pattern ===");

    // Once lock
    println!("{}", config().name);
    println!("{}", config().retries);


    // Lazy lock
    println!("{}", CONFIG.name);

    // Mutable global variable
    increment();
    increment();
    println!("{}", counter().lock().unwrap().count); 

    println!("--- Alternative A: Explicit Passing ---");
    let local_cfg = LocalConfig { db_url: "localhost:5432".to_string() };
    run_service(&local_cfg); // Easily testable! We can mock or change local_cfg right here.
    println!();

    println!("--- Alternative B: Context Struct ---");
    let context = AppContext {
        config: LocalConfig { db_url: "production_db:5432".to_string() },
        logger: Logger { level: "INFO".to_string() },
    };
    handle_request(&context);
    println!();

    // Testing Alternative C: Arc<T> / Arc<Mutex<T>> for Shared Ownership
    println!("--- Alternative C: Shared Ownership (Arc) across Threads ---");
    
    // Instead of a global static, we create it inside main()
    // Arc allows safe multiple-ownership across threads.
    // Mutex allows safe internal mutability across threads.
    let shared_state = Arc::new(Mutex::new(SharedState { request_count: 0 }));

    let mut thread_handles = vec![];

    for i in 0..3 {
        // Clone the pointer (increments reference count), not the actual data inside
        let state_clone = Arc::clone(&shared_state);
        
        let handle = thread::spawn(move || {
            let mut data = state_clone.lock().unwrap();
            data.request_count += 1;
            println!("  [Thread {}] Incremented count to {}", i, data.request_count);
        });
        thread_handles.push(handle);
    }

    // Wait for all threads to finish
    for handle in thread_handles {
        handle.join().unwrap();
    }

    // Final result without using a single global static variable
    println!("Final Threaded Arc Count: {}", shared_state.lock().unwrap().request_count);
    
    println!("Thread-local Singleton");

    // In main thread:
    LOCAL.with(|v| *v.borrow_mut() += 10);
    LOCAL.with(|v| println!("Main thread sees: {}", *v.borrow())); // Prints 10
    // In a background thread:
    std::thread::spawn(|| {
        LOCAL.with(|v| println!("New thread sees: {}", *v.borrow())); // Prints 0! Fresh copy!
        LOCAL.with(|v| *v.borrow_mut() += 50);
        LOCAL.with(|v| println!("New thread updated to: {}", *v.borrow())); // Prints 50
    }).join().unwrap();
    // Back in main thread:
    LOCAL.with(|v| println!("Main thread STILL sees: {}", *v.borrow())); // Still 10! Untouched!

}
