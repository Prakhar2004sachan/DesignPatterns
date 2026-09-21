#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <cstring>


// 04_Prototype_Pattern Pattern - C++ Implementation

class Shape {
public:
    virtual ~Shape() = default;
    virtual std::unique_ptr<Shape> clone() const = 0;
    virtual void draw() const = 0;
};

class Circle : public Shape {
    double radius_;
public:
    explicit Circle(double r) : radius_(r) {}

    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Circle>(*this); // uses copy ctor
    }

    void draw() const override {
        std::cout << "Circle r=" << radius_ << "\n";   
    }
};

class Square : public Shape {
    double side_;
public:
    explicit Square(double s) : side_(s) {}
    std::unique_ptr<Shape> clone() const override {
        return std::make_unique<Square>(*this);
    }
    void draw() const override {
        std::cout << "Square s=" << side_ << "\n";
    }
};

// Virtual clone
void virtualClone(){
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(2.0));
    shapes.push_back(std::make_unique<Square>(3.0));
    std::vector<std::unique_ptr<Shape>> copies;
    for (const auto& s : shapes) {
        copies.push_back(s->clone());
    }
    for (const auto& c : copies) c->draw();
}

// Covariant return types
// Note: In C++, covariant return types only apply to raw pointers or references
// (Derived* overrides Base*). std::unique_ptr does NOT support covariance.
class CovariantShape {
public:
    virtual ~CovariantShape() = default;
    virtual CovariantShape* clone() const = 0; // Base returns CovariantShape*
    virtual void draw() const = 0;
};

class Triangle : public CovariantShape {
    double base_;
    double height_;
public:
    explicit Triangle(double b = 3.0, double h = 4.0) : base_(b), height_(h) {}

    // Covariant return type: returns Triangle* overriding CovariantShape*!
    Triangle* clone() const override {
        return new Triangle(*this);
    }

    void draw() const override {
        std::cout << "Triangle b=" << base_ << " h=" << height_ << "\n";
    }
};

void covariantClone() {
    std::cout << "\n--- Covariant Return Types Demo ---" << std::endl;
    Triangle original(3.0, 4.0);

    // Covariance in action: clone() returns Triangle* directly, NOT CovariantShape*!
    // No static_cast or dynamic_cast needed!
    Triangle* copy = original.clone();
    copy->draw();

    delete copy; // Clean up heap memory
}

// 3. Deep Copy Demo (Custom Copy Constructor for heap pointers)
class SafeShape : public Shape {
    double* data_;
public:
    explicit SafeShape(double val) : data_(new double(val)) {}

    ~SafeShape() override {
        delete data_;
    }

    // Custom Deep Copy Constructor:
    // This is triggered when someone passes an existing SafeShape (like *this)
    SafeShape(const SafeShape& other)
        : data_(new double(*other.data_)) {
        std::cout << "  -> [Copy Ctor Triggered] Allocated new heap address: "
                  << data_ << " with copied value: " << *data_ << "\n";
    }

    SafeShape& operator=(const SafeShape&) = delete;

    void setValue(double v) { *data_ = v; }
    const double* getAddress() const { return data_; }

    std::unique_ptr<Shape> clone() const override {
        // Step 1: *this dereferences the pointer to get 'const SafeShape&'
        // Step 2: make_unique calls 'new SafeShape(*this)'
        // Step 3: C++ compiler selects SafeShape(const SafeShape& other)!
        return std::make_unique<SafeShape>(*this);
    }

    void draw() const override {
        std::cout << "SafeShape data=" << *data_
                  << " (heap address: " << data_ << ")\n";
    }
};

void deepCopyDemo() {
    std::cout << "\n--- Deep Copy Demo ---" << std::endl;
    auto original = std::make_unique<SafeShape>(42.0);
    std::cout << "Original created: ";
    original->draw();

    std::cout << "Cloning original via original->clone():\n";
    std::unique_ptr<Shape> copy_shape = original->clone();

    auto* copy = dynamic_cast<SafeShape*>(copy_shape.get());
    std::cout << "Clone created:    ";
    copy->draw();

    std::cout << "Mutating copy value to 999.0...\n";
    copy->setValue(999.0);

    std::cout << "After mutation:\n";
    std::cout << "  Original: "; original->draw();
    std::cout << "  Clone:    "; copy->draw();

    std::cout << "Memory addresses are independent ("
              << original->getAddress() << " != " << copy->getAddress()
              << "), proving a true Deep Copy!\n";
}

// 4. Deep copy via copy constructor: Value types vs. Raw Pointers

class Document {
    std::string title_;
    std::vector<std::string> lines_;
public:
    Document(std::string title, std::vector<std::string> lines)
        : title_(std::move(title)), lines_(std::move(lines)) {}

    // Both are explicitly defaulted:
    // Because std::string and std::vector manage their own heap memory (value semantics),
    // the compiler-generated copy ctor & copy assignment produce a 100% DEEP COPY!
    Document(const Document&) = default;              // Copy Constructor
    Document& operator=(const Document&) = default;   // Copy Assignment Operator

    void addLine(const std::string& line) { lines_.push_back(line); }

    void print(const std::string& label) const {
        std::cout << "  " << label << " '" << title_ << "' (" << lines_.size() << " lines):\n";
        for (const auto& line : lines_) {
            std::cout << "      - " << line << "\n";
        }
    }
};

class DocWithPointer {
    std::string title_;
    char* buffer_;   // raw pointer → shallow by default if not handled!
    size_t size_;
public:
    DocWithPointer(std::string title, const char* text)
        : title_(std::move(title)), size_(std::strlen(text) + 1) {
        buffer_ = new char[size_];
        std::memcpy(buffer_, text, size_);
    }

    // Manual Deep Copy Constructor:
    // Without this, the compiler would copy the raw address of buffer_ (shallow copy).
    // Here we allocate a brand-new heap buffer and copy the bytes manually!
    DocWithPointer(const DocWithPointer& other)
        : title_(other.title_),
          buffer_(new char[other.size_]),
          size_(other.size_) {
        std::memcpy(buffer_, other.buffer_, other.size_); // manual deep copy
    }

    // Destructor: required to free manually allocated heap buffer
    ~DocWithPointer() {
        delete[] buffer_;
    }

    // Copy Assignment Operator: deep copy assignment
    DocWithPointer& operator=(const DocWithPointer& other) {
        if (this != &other) {
            delete[] buffer_;
            title_ = other.title_;
            size_ = other.size_;
            buffer_ = new char[size_];
            std::memcpy(buffer_, other.buffer_, size_);
        }
        return *this;
    }

    void mutateFirstChar(char c) { if (size_ > 1) buffer_[0] = c; }

    void print(const std::string& label) const {
        std::cout << "  " << label << " '" << title_ << "': \"" << buffer_
                  << "\" (buffer address=" << static_cast<const void*>(buffer_) << ")\n";
    }
};

void copyConstructorDemo() {
    std::cout << "\n--- Copy Constructor & Assignment Demo ---" << std::endl;

    // 1. Document with Value Members (= default)
    std::cout << "[Document (= default for value members)]\n";
    Document doc1("Design Patterns", {"Creational", "Structural"});

    // Uses Copy Constructor:
    Document doc2 = doc1;
    doc2.addLine("Behavioral"); // Mutating doc2

    doc1.print("Original doc1");
    doc2.print("Clone doc2   ");

    // Uses Copy Assignment Operator:
    Document doc3("Temporary", {});
    doc3 = doc1; // Overwrites doc3 with doc1
    doc3.print("Assigned doc3");

    // 2. DocWithPointer (Manual Deep Copy with memcpy)
    std::cout << "\n[DocWithPointer (Manual deep copy for raw heap pointer)]\n";
    DocWithPointer raw1("Pointers Note", "Hello World");

    // Uses Custom Copy Constructor:
    DocWithPointer raw2 = raw1;
    raw2.mutateFirstChar('J'); // Change "Hello World" to "Jello World" in raw2

    raw1.print("Original raw1");
    raw2.print("Clone raw2   ");
    std::cout << "  Notice buffer addresses are different, original string was NOT modified!\n";
}

// 5. Mixed Ownership: shared_ptr vs unique_ptr in Prototype
// Rule: Decide per member:
// - Value members (string, vector): automatically DEEP copied.
// - shared_ptr: means "share this" -> automatically SHALLOW copied (pointer shared, ref count incremented).
// - unique_ptr: means "own exclusively" -> CANNOT be copied automatically! Must clone manually.

struct Config {
    std::string theme;
    bool autosave;
    Config(std::string t, bool a) : theme(std::move(t)), autosave(a) {}
};

struct Metadata {
    std::string author;
    int revision;
    Metadata(std::string auth, int rev) : author(std::move(auth)), revision(rev) {}
};

class ModernDoc {
    std::string title_;
    std::vector<std::string> lines_;
    std::shared_ptr<Config> config_;       // shared -> shallow clone of config
    std::unique_ptr<Metadata> metadata_;   // exclusive -> manual deep clone required!

public:
    ModernDoc(std::string title, std::vector<std::string> lines,
              std::shared_ptr<Config> config, std::unique_ptr<Metadata> metadata)
        : title_(std::move(title)),
          lines_(std::move(lines)),
          config_(std::move(config)),
          metadata_(std::move(metadata)) {}

    // Custom copy constructor because unique_ptr deletes default copy ctor!
    ModernDoc(const ModernDoc& other)
        : title_(other.title_),                                            // Deep copy (value)
          lines_(other.lines_),                                            // Deep copy (value)
          config_(other.config_),                                          // Shallow copy (shared_ptr ref count++)
          metadata_(other.metadata_                                        // Manual Deep copy (unique_ptr)
                    ? std::make_unique<Metadata>(*other.metadata_)
                    : nullptr) {}

    // Prototype clone method
    ModernDoc clone() const {
        return *this; // uses custom copy constructor
    }

    void addLine(const std::string& line) { lines_.push_back(line); }
    std::shared_ptr<Config> getConfig() const { return config_; }
    Metadata* getMetadata() const { return metadata_.get(); }

    void print(const std::string& label) const {
        std::cout << "  " << label << " '" << title_ << "':\n";
        std::cout << "    - Lines (" << lines_.size() << "): ";
        for (const auto& l : lines_) std::cout << "[" << l << "] ";
        std::cout << "\n";
        std::cout << "    - Config (shared_ptr at " << config_.get()
                  << ", use_count=" << config_.use_count() << "): theme="
                  << config_->theme << ", autosave=" << (config_->autosave ? "true" : "false") << "\n";
        if (metadata_) {
            std::cout << "    - Metadata (unique_ptr at " << metadata_.get()
                      << "): author=" << metadata_->author
                      << ", rev=" << metadata_->revision << "\n";
        }
    }
};

void modernDocDemo() {
    std::cout << "\n--- Mixed Ownership Demo (shared_ptr vs unique_ptr) ---" << std::endl;

    auto shared_cfg = std::make_shared<Config>("Dark", true);
    auto exclusive_meta = std::make_unique<Metadata>("Alice", 1);

    ModernDoc original("System Manual", {"Introduction", "Architecture"}, shared_cfg, std::move(exclusive_meta));
    std::cout << "Original created:\n";
    original.print("Original");

    std::cout << "\nCloning ModernDoc via original.clone()...\n";
    ModernDoc copy = original.clone();
    copy.print("Copy    ");

    std::cout << "\n[1] Mutating Copy's Value member (lines)...\n";
    copy.addLine("Troubleshooting");
    std::cout << "  Original lines count: unchanged (DEEP copy)!\n";

    std::cout << "\n[2] Mutating Shared Config via Copy (theme -> Light)...\n";
    copy.getConfig()->theme = "Light";
    std::cout << "  Original config theme is now: '" << original.getConfig()->theme
              << "' (SHALLOW copy via shared_ptr, both share memory!)\n";

    std::cout << "\n[3] Mutating Metadata via Copy (rev -> 2)...\n";
    copy.getMetadata()->revision = 2;
    std::cout << "  Original metadata rev: " << original.getMetadata()->revision
              << " | Copy metadata rev: " << copy.getMetadata()->revision
              << " (DEEP copy via unique_ptr, independent memory!)\n";

    std::cout << "\nFinal State Comparison:\n";
    original.print("Original Final");
    copy.print("Copy Final    ");
}

int main() {
    std::cout << "=== [C++] 04_Prototype_Pattern ===" << std::endl;

    // Virtual clone
    virtualClone();

    // Covariant clone
    covariantClone();

    // Deep copy demo
    deepCopyDemo();

    // Copy constructor & assignment demo
    copyConstructorDemo();

    // Mixed ownership demo (shared_ptr vs unique_ptr)
    modernDocDemo();

    return 0;
}
