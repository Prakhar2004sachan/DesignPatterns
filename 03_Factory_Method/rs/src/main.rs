trait Document {
    fn open(&self);
    fn edit(&self);
    fn save(&self);
}

struct WordDocument;
impl Document for WordDocument {
    fn open(&self) {
        println!("Word: open");
    }
    
    fn edit(&self) {
        println!("Word: edit");
    }
    
    fn save(&self) {
        println!("Word: save");        
    }
}

struct PdfDocument;
impl Document for PdfDocument {
    fn open(&self) {
        println!("Pdf: open");
    }

    fn edit(&self) {
        println!("Pdf: edit");
    }

    fn save(&self) {
        println!("Pdf: save");
    }
}

// 2. CREATOR (Abstract)
trait Editor {
    type Doc: Document;
    // ===> THIS IS THE FACTORY METHOD <===
    fn create_document(&self) -> Self::Doc;
    // Core business logic relies on the factory method:
    fn run(&self) {
        let document = self.create_document();
        document.open();
        document.edit();
        document.save();
    }
}
// 3. CONCRETE CREATORS (They decide which Product to instantiate)
struct WordEditor;
impl Editor for WordEditor {
    type Doc = WordDocument;
    fn create_document(&self) -> Self::Doc {
        WordDocument
    }
}
struct PdfEditor;
impl Editor for PdfEditor {
    type Doc = PdfDocument;
    fn create_document(&self) -> Self::Doc {
        PdfDocument
    }
}


// Method 3

fn run_editor<F, D>(create: F) 
where  
    F: Fn() -> D,
    D: Document,
{
    let doc = create();
    doc.open();
    doc.edit();
    doc.save();
}


fn main() {
    println!("=== [Rust] 03_Factory_Method ===");
    
    // Client works with the Creator:
    let pdf_editor = PdfEditor;
    let word_editor = WordEditor;

    pdf_editor.run();
    word_editor.run();

    run_editor(|| WordDocument);
    run_editor(|| PdfDocument);
}
