// 03_Factory_Method Pattern - JavaScript Implementation

// Product
class Document {
  open() {
    throw new Error("Abstract open");
  }

  edit() {
    throw new Error("Abstract edit");
  }

  save() {
    throw new Error("Abstract save");
  }
}

class WordDocument extends Document {
  open() {
    console.log("Word : open");
  }

  edit() {
    console.log("Word : edit");
  }

  save() {
    console.log("Word: save");
  }
}

class PdfDocument extends Document {
  open() {
    console.log("Pdf : open");
  }

  edit() {
    console.log("Pdf : edit");
  }

  save() {
    console.log("Pdf: save");
  }
}

// Creator
class DocumentEditor {
  createDocument() {
    throw new Error("Abstract Create Document");
  }

  run(){
    const doc = this.createDocument();
    doc.open();
    doc.edit();
    doc.save();
  }
}

class WordEditor extends DocumentEditor {
  createDocument(){
    return new WordDocument();
  }
}

class PdfEditor extends DocumentEditor {
  createDocument(){
    return new PdfDocument();
  }
}

const wordDocument = () => ({
  open: () => console.log("Word: open"),
  edit: () => console.log("Word: edit"),
  save: () => console.log("Word: save"),
});

const pdfDocument = () => ({
  open: () => console.log("PDF: open"),
  edit: () => console.log("PDF: edit"),
  save: () => console.log("PDF: save"),
});

function runEditor(createDocument) {
  const doc = createDocument();
  doc.open();
  doc.edit();
  doc.save();
}


function main() {
  console.log("=== [JavaScript] 03_Factory_Method ===");

  const wordEditor = new WordEditor();
  const pdfEditor = new PdfEditor();

  wordEditor.run();
  pdfEditor.run();

  runEditor(pdfDocument);
}

main();
