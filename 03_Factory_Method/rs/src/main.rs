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

// Creator ==> has real logic + factory method
trait DocumentEditor {
    fn create_document(&self) -> Box<dyn Document>;

    // Algorithm uses the product
    fn run(&self){
        let doc = self.create_document();
        doc.open();
        doc.edit();
        doc.save();
    }
}

struct WordEditor;
impl DocumentEditor for WordEditor {
    fn create_document(&self) -> Box<dyn Document> {
        Box::new(WordDocument)
    }
}

struct PdfEditor;
impl DocumentEditor for PdfEditor{
    fn create_document(&self) -> Box<dyn Document> {
        Box::new(PdfDocument)
    }
}


fn main() {
    println!("=== [Rust] 03_Factory_Method ===");
    
    let editor: Box<dyn  DocumentEditor> = Box::new(WordEditor);
    editor.run();
}
