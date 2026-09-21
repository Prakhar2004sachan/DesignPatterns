#include <iostream>
#include <string>
#include <memory>
#include <vector>


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

int main() {
    std::cout << "=== [C++] 04_Prototype_Pattern ===" << std::endl;

    // Virtual clone
    virtualClone();

    
    return 0;
}
