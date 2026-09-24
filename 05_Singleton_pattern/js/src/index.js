// 05_Singleton_pattern Pattern - JavaScript Implementation

// Module level singleton pattern
// config.js
// class Config {
//   constructor() {
//     this.retries = 3;
//     this.name = "prod";
//   }
//   setRetries(n) { this.retries = n; }
// }

// The module exports ONE instance. Every importer gets the same object.
// export const config = new Config();

// Class Architecture
class Config {
  static #instance_;

  static getInstance() {
    if (!this.#instance_) {
      this.#instance_ = new Config();
    }
    return Config.#instance_;
  }

  constructor() {
    if (Config.#instance_) {
      throw new Error("Use Config.getInstance()");
    }
    this.retries = 3;
  }
}

// Closure based singleton
const config = (()=>{
  let instance = null;
  return {
    get(){
      if(!instance){
        instance = { retries: 3, name: "prod" };
      }
      return instance;
    }
  }
})();

function main() {
  console.log("=== [JavaScript] 05_Singleton_pattern ===");

  // Class Architecture
  const a = Config.getInstance();
  const b = Config.getInstance();
  console.log(a === b); // true

  // Closure based singleton
  const a1 = config.get();
  const b1 = config.get();
  console.log(a1 === b1);
}

main();
