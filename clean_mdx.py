import os
import re
import glob

# A regex to match common emojis (basic block, excluding some standard text symbols if possible, but comprehensive enough for the ones used)
# A simple way to strip specific known emojis or a general range
emojis_to_remove = ['🦀', '⚡', '💙', '🟨', '❌', '✅', '👉', '📓', '🎯', '🏗️', '🧠', '📜', '🛠️', '🧬', '🏭', '📦', '💡', '⚠️']

def remove_emojis_from_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for emoji in emojis_to_remove:
        content = content.replace(emoji + ' ', '')
        content = content.replace(emoji, '')
        
    # Also add some beginner friendly expansions if we find specific headers
    target_intent = "## 1. Intent & Mental Model\n\nProvide an interface for creating **families of related or dependent objects** without specifying their concrete classes.\n\n> **TL;DR:** The client code works exclusively with abstract factories and abstract products. At runtime, a concrete factory is supplied, producing a matching suite of products. You are guaranteed never to mix incompatible products (e.g. a Mac Button inside a Windows Window)."
    replacement_intent = """## 1. Intent & Mental Model

The **Abstract Factory Pattern** provides an interface for creating **families of related or dependent objects** without specifying their concrete classes. 

> **Beginner's Intuition:** Imagine you are building a cross-platform application UI. You have buttons, checkboxes, and windows. If a user is on macOS, they should see a Mac Button and a Mac Checkbox. If they are on Windows, they should see a Windows Button and a Windows Checkbox. You never want to accidentally mix a Mac Button inside a Windows Window. The Abstract Factory guarantees this by grouping the creation of these related components into a single "Factory". Instead of calling `new MacButton()`, you ask the factory `factory.createButton()`, and the factory ensures you get the right one for your environment."""
    content = content.replace(target_intent, replacement_intent)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

# Update 01, 02, 03
docs_dir = '/Users/prakharsachan/Developer/DesignPattern/docs/content/docs'
for root, dirs, files in os.walk(docs_dir):
    for file in files:
        if file.endswith('.mdx'):
            remove_emojis_from_file(os.path.join(root, file))
