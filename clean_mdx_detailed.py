import os

emojis_to_remove = ['🦀', '⚡', '💙', '🟨', '❌', '✅', '👉', '📓', '🎯', '🏗️', '🧠', '📜', '🛠️', '🧬', '🏭', '📦', '💡', '⚠️']

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for emoji in emojis_to_remove:
        content = content.replace(emoji + ' ', '')
        content = content.replace(emoji, '')
        
    target_intent_1 = "## 1. Intent & Mental Model\n\nProvide an interface for creating **families of related or dependent objects** without specifying their concrete classes."
    replacement_intent_1 = """## 1. Intent & Mental Model

The **Abstract Factory Pattern** provides an interface for creating **families of related or dependent objects** without specifying their concrete classes.

> **Beginner's Intuition:** Imagine you are building a cross-platform application UI. You have buttons, checkboxes, and windows. If a user is on macOS, they should see a Mac Button and a Mac Checkbox. If they are on Windows, they should see a Windows Button and a Windows Checkbox. You never want to accidentally mix a Mac Button inside a Windows Window. The Abstract Factory guarantees this by grouping the creation of these related components into a single "Factory". Instead of calling `new MacButton()`, you ask the factory `factory.createButton()`, and the factory ensures you get the right one for your environment."""
    content = content.replace(target_intent_1, replacement_intent_1)
    
    target_intent_2 = "## 1. Intent & Problem It Solves\n\nSeparate the **construction of a complex object** from its representation so that the same construction process can create different representations."
    replacement_intent_2 = """## 1. Intent & Problem It Solves

The **Builder Pattern** separates the **construction of a complex object** from its representation so that the same construction process can create different representations.

> **Beginner's Intuition:** Imagine you are ordering a custom pizza. Instead of giving the chef a massive, rigid list of 15 ingredients at once (and risking getting them in the wrong order, like cheese before the sauce), you talk to a "Pizza Builder". You say, "add cheese", then "add pepperoni", and finally "bake it". The Builder pattern applies this to code. When an object requires many optional parameters, setting them step-by-step through a builder prevents giant, confusing constructors and ensures the object is only created when it's fully valid."""
    content = content.replace(target_intent_2, replacement_intent_2)
    
    target_intent_3 = "## 1. Intent & Mental Model\n\nDefine an interface for creating **a single object**, but let **subclasses or implementations decide which concrete class to instantiate**."
    replacement_intent_3 = """## 1. Intent & Mental Model

The **Factory Method Pattern** defines an interface for creating **a single object**, but lets **subclasses or implementations decide which concrete class to instantiate**.

> **Beginner's Intuition:** Think of a logistics company. Originally, they only delivered by trucks, so their system is hardcoded to create `Truck` objects. Later, they add sea deliveries. Instead of rewriting the entire system, they create a general `Logistics` base class with a `createTransport()` method. A `RoadLogistics` subclass overrides it to return a `Truck`, while a `SeaLogistics` subclass overrides it to return a `Ship`. The main application just calls `createTransport()` without worrying about the exact vehicle type."""
    content = content.replace(target_intent_3, replacement_intent_3)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

docs_dir = '/Users/prakharsachan/Developer/DesignPattern/docs/content/docs'
for root, dirs, files in os.walk(docs_dir):
    for file in files:
        if file.endswith('.mdx'):
            process_file(os.path.join(root, file))
