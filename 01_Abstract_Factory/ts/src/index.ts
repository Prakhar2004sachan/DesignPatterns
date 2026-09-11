// Abstract product
interface Button {
  paint: () => void;
}

interface CheckBox {
  paint: () => void;
}

// Abstract factory
interface GuiFactory {
  createButton: () => Button;
  createCheckBox: () => CheckBox;
}

// Concrete Product Windows
class WindowsButton implements Button {
  paint(): void {
    console.log("Windows Button \n");
  }
}

class WindowsCheckBox implements CheckBox {
  paint(): void {
    console.log("Windows CheckBox \n");
  }
}

// Concrete Product Mac
class MacButton implements Button {
  paint(): void {
    console.log("Mac Button \n");
  }
}

class MacCheckBox implements CheckBox {
  paint(): void {
    console.log("Mac CheckBox \n");
  }
}

// Concrete factory : Windows
class WindowsFactory implements GuiFactory {
  createButton(): Button {
    return new WindowsButton();
  }
  createCheckBox(): CheckBox {
    return new WindowsCheckBox();
  }
}

// Concrete factory : Mac
class MacFactory implements GuiFactory {
  createButton(): Button {
    return new MacButton();
  }
  createCheckBox(): Button {
    return new MacCheckBox();
  }
}

// Client
function renderFactory(factory: GuiFactory): void {
  const button = factory.createButton();
  const checkbox = factory.createCheckBox();

  button.paint();
  checkbox.paint();
}

function main(): void {
  const os = "mac";

  let factory: GuiFactory;
  if (os == "mac"){
    factory = new MacFactory();
  } else {
    factory = new WindowsFactory();
  }

  renderFactory(factory);
}

main();
