#include <iostream>
#include <memory>
#include <string>

// 02_Builder Pattern - C++ Implementation

class Pizza{
public:
    std::string size;
    bool cheese = false;
    bool pepperoni = false;
    bool olives = false;

    void describe() const {
        std::cout << "Pizza(" << size
                  << ", cheese=" << cheese
                  << ", pepperoni=" << pepperoni
                  << ", olives=" << olives << ")\n";
    }
};

class PizzaBuilder{
public: 
    virtual ~PizzaBuilder() = default;
    virtual void buildSize() = 0;
    virtual void buildCheese() = 0;
    virtual void buildPepperoni() = 0;
    virtual void buildOlives() = 0;
    virtual std::unique_ptr<Pizza> getResult() = 0;

};

// Concrete builder
class MargheritaBuilder : public PizzaBuilder {
    std::unique_ptr<Pizza> pizza_ = std::make_unique<Pizza>();

public:
    void buildSize() override {pizza_ -> size  = "large";}
    void buildCheese() override {pizza_-> cheese = true;}
    void buildPepperoni() override {pizza_ -> pepperoni = true;}
    void buildOlives() override {pizza_ -> olives = true;}

    std::unique_ptr<Pizza> getResult() override {return  std::move(pizza_) ;}
};

// Director
class Waiter{
public:
    std::unique_ptr<Pizza> construct(PizzaBuilder& b){
        b.buildSize();
        b.buildCheese();
        b.buildPepperoni();
        b.buildOlives();
        return b.getResult();
    }
};

int main() {
    std::cout << "=== [C++] 02_Builder ===" << std::endl;

    MargheritaBuilder builder;
    Waiter waiter;

    auto pizza = waiter.construct(builder);
    pizza->describe();
    return 0;
}
