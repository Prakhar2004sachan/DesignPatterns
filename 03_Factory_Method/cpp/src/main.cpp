#include <iostream>
#include <memory>

// 03_Factory_Method Pattern - C++ Implementation

// Product
class Document{
    public:
        virtual ~Document() = default;
        virtual void open() const = 0;
        virtual void edit() const = 0;
        virtual void save() const = 0;
};

class WordDocument : public Document{
    public:
        void open() const override {
            std::cout << "Word: open\n";
        }

        void edit() const override {
            std::cout << "Word: edit\n";
        }

        void save() const override {
            std::cout << "Word: save\n";
        }
};

class PdfDocument : public Document{
    public:
        void open() const override {
            std::cout << "Pdf: open\n";
        }

        void edit() const override {
            std::cout << "Pdf: edit\n";
        }

        void save() const override {
            std::cout << "Pdf: save\n";
        }
};

// Creator
class DocumentEditor {
    public:
        virtual ~DocumentEditor() = default;

        // Factory method
        virtual std::unique_ptr<Document> createDocument() const = 0;

        // Template methods
        void run() const {
            auto doc = createDocument();
            doc -> open();
            doc->edit();
            doc->save();
        }
};

class WordEditor : public DocumentEditor {
    public:
        std::unique_ptr<Document> createDocument() const override {
            return  std::make_unique<WordDocument>();
        }
};

class PdfEditor : public DocumentEditor {
    public:
        std::unique_ptr<Document> createDocument () const override {
            return std::make_unique<PdfDocument>();
        }
};

int main() {
    std::cout << "=== [C++] 03_Factory_Method ===" << std::endl;
    
    std::unique_ptr<DocumentEditor> editor = std::make_unique<WordEditor>();

    editor->run();

    return 0;
}
