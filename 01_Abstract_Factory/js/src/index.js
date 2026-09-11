// Abstract product
class Button {
  paint() {
    throw new Error("Abstract method: paint()");
  }
}

class CheckBox {
  paint() {
    throw new Error("Abstract method: paint()");
  }
}

// Concrete Product windows
class WindowsButton extends Button {
  paint(){
    console.log("Windows Button \n")
  }
}

class WindowsCheckbox extends CheckBox {
  paint(){
    console.log("Windows Checkbox \n")
  }
}

// Concrete Product Mac
class MacButton extends Button {
  paint(){
    console.log("Mac Button \n")
  }
}

class MacCheckbox extends CheckBox {
  paint(){
    console.log("Mac Checkbox \n")
  }
}

// Abstract Factory
class GuiFactory{
  createButton(){
    throw new Error("Abstract method: createButton()");
  }
  createCheckbox(){
    throw new Error("Abstract method: createCheckbox()");
  }
}

// Concrete Factory windows
class WindowsFactory extends GuiFactory {
  createButton(){
    return new WindowsButton();
  }
  createCheckbox(){
    return new WindowsCheckbox();
  }
}

// Concrete Factory Mac
class MacFactory extends GuiFactory {
  createButton(){
    return new MacButton();
  }
  createCheckbox(){
    return new MacCheckbox();
  }
}

// Client 
function renderFactory(factory){
  const button = factory.createButton();
  const checkbox = factory.createCheckbox();

  button.paint();
  checkbox.paint();
}

function main() {
  console.log("=== [JavaScript] Abstract_Factory ===");

  const os = "mac";

  let factory;
  if (os == "mac") {
    factory = new MacFactory();
  } else {
    factory = new WindowsFactory();
  }

  renderFactory(factory);
}

main();
