#include <iostream>
#include <memory>
#include <string>

// Abstracted Product
class Button{
public:
    virtual ~Button() = default;
    virtual void paint () const = 0;
};

class CheckBox{
public:
    virtual ~CheckBox() = default;
    virtual void paint() const = 0;
};

// Abstracted Factory
class GuiFactory{
public:
    virtual ~GuiFactory() = default;
    virtual std::unique_ptr<Button> createButton () const = 0;
    virtual std::unique_ptr<CheckBox> createCheckBox() const = 0;
};

// Concrete Products: Windows
class WindowsButton : public Button {
public:
    void paint() const override {
        std::cout << "Windows Button\n";
    }
};

class WindowsCheckBox : public CheckBox {
public:
    void paint() const override {
        std::cout << "Windows CheckBox\n";
    }
};

// Concrete Product : Mac
class MacButton : public Button {
public:
    void paint() const override {
        std::cout << "Mac Button\n";
    }
};

class MacCheckBox : public CheckBox {
public: 
    void paint() const override {
        std::cout << "Mac CheckBox\n";
    }
};

// Concrete Factories
class WindowsFactory : public GuiFactory {
public:
    std::unique_ptr<Button> createButton() const override {
        return std::make_unique<WindowsButton>();
    }
    std::unique_ptr<CheckBox> createCheckBox() const override {
        return std::make_unique<WindowsCheckBox>();
    }
};

class MacFactory : public GuiFactory {
public: 
    std::unique_ptr<Button> createButton() const override {
        return std::make_unique<MacButton>();
    }
    std::unique_ptr<CheckBox> createCheckBox() const override {
        return std::make_unique<MacCheckBox>();
    }
};

// Client code
void renderUI(const GuiFactory& factory) {
    auto button = factory.createButton();
    auto checkbox = factory.createCheckBox();

    button->paint();
    checkbox->paint();
}

int main() {
    std::string os = "windows";
    std::unique_ptr<GuiFactory> factory;

    if (os == "mac") {
        factory = std::make_unique<MacFactory>();
    } else {
        factory = std::make_unique<WindowsFactory>();
    }

   renderUI(*factory);
}
