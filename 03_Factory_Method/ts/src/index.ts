// 03_Factory_Method Pattern - TypeScript Implementation

//  Product
abstract class Document {
  abstract open() : void;
  abstract edit() : void;
  abstract save() : void;
}

class WordDocument extends Document {
  open(): void {
    console.log("Word : open");
  }

  edit(): void {
    console.log("Word : edit");
  }

  save(): void {
    console.log("Word : save");
  }
}

class PdfDocument extends Document {
  open(): void {
    console.log("Pdf : open");
  }

  edit(): void {
    console.log("Pdf : edit");
  }

  save(): void {
    console.log("Pdf : save");
  }
}

interface Documentv2 {
  open() : void;
  edit() : void;
  save() : void;
}

class WordDocumentv2 implements Documentv2 {
  open() {
    console.log("Word: open");
  }
  edit() {
    console.log("Word: edit");
  }
  save() {
    console.log("Word: save");
  }
}

// Creator
abstract class DocumentEditor {

  // Factory
  abstract createDocument() : Document;

  run() : void {
    const doc = this.createDocument();
    doc.open();
    doc.edit();
    doc.save();
  };
}

class WordEditor extends DocumentEditor {
  createDocument(): Document {
    return new WordDocument();
  }
}

class PdfEditor extends DocumentEditor {
  createDocument(): Document {
    return new PdfDocument();
  }
}

interface Creator<T extends Documentv2>{
  create() : T;
}

function runEditor<T extends Documentv2>(creator: Creator<T>): void {
  const doc = creator.create();
  doc.open();
  doc.edit();
  doc.save();
}

function main(): void {
  console.log("=== [TypeScript] 03_Factory_Method ===");

  const wordEditor = new WordEditor();
  const pdfEditor = new PdfEditor();

  wordEditor.run();
  pdfEditor.run();

  runEditor({create: () => new WordDocument()});
}

main();
