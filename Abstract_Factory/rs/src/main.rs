/* Abstract Product */
trait Button {
    fn paint(&self);
}

trait Checkbox {
    fn paint(&self);
}


/* Abstract Factory */
trait GuiFactory {
    fn create_button(&self) -> Box<dyn Button>;
    fn create_checkbox(&self) -> Box<dyn Checkbox>;
}

/* Concrete Products: Windows */
struct WindowsButton;
impl Button for WindowsButton {
    fn paint(&self) {
        println!("Rendering Windows button");
    }
}
struct WindowsCheckbox;
impl Checkbox for WindowsCheckbox {
    fn paint(&self) {
        println!("Rendering Windows checkbox");
    }
}

/* Concrete Products: Mac */
struct MacButton;
impl Button for MacButton {
    fn paint(&self) {
        println!("Rendering Mac button");
    }
}
struct MacCheckbox;
impl Checkbox for MacCheckbox {
    fn paint(&self) {
        println!("Rendering Mac checkbox");
    }
}

/* Concrete Factories */
struct WindowsFactory;
impl GuiFactory for WindowsFactory {
    fn create_button(&self) -> Box<dyn Button> {
        Box::new(WindowsButton)
    }
    fn create_checkbox(&self) -> Box<dyn Checkbox> {
        Box::new(WindowsCheckbox)
    }
}

struct MacFactory;
impl GuiFactory for MacFactory {
    fn create_button(&self) -> Box<dyn Button> {
        Box::new(MacButton)
    }
    fn create_checkbox(&self) -> Box<dyn Checkbox> {
        Box::new(MacCheckbox)
    }
}

/* Client */
fn render_factory(factory : &dyn GuiFactory) {
    let button = factory.create_button();
    let checkbox = factory.create_checkbox();

    button.paint();
    checkbox.paint();
}

fn main() {
    let os = "mac";

    let factory : Box<dyn GuiFactory> = match os {
        "windows" => Box::new(WindowsFactory),
        "mac" => Box::new(MacFactory),
        _ => panic!("Unknown OS"),
    };

    render_factory(&*factory);
}
