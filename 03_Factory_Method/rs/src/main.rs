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
struct Editor<D: Document>{
    document: D
}

impl <D: Document> Editor<D> {
    fn new(document: D) -> Self{
        Editor { document }
    }

    fn run(&self){
        self.document.open();
        self.document.edit();
        self.document.save();
    }
}

fn main() {
    println!("=== [Rust] 03_Factory_Method ===");
    
    let pdf_editor = Editor::new(PdfDocument);
    let word_editor = Editor::new(WordDocument);

    pdf_editor.run();
    word_editor.run();
}
