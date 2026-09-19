// 03_Factory_Method Pattern - TypeScript Implementation

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

abstract class DocumentEditor {
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

function main(): void {
  console.log("=== [TypeScript] 03_Factory_Method ===");

  const wordEditor = new WordEditor();
  const pdfEditor = new PdfEditor();

  wordEditor.run();
  pdfEditor.run();
}

main();
