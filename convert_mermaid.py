import os
import re

def convert_mermaid_to_component(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace:
    # ```mermaid
    # <some text>
    # ```
    # with:
    # <PatternDiagram chart={`
    # <some text>
    # `} />
    
    # Regex to match ```mermaid ... ```
    pattern = re.compile(r'```mermaid\n(.*?)\n```', re.DOTALL)
    
    def replacer(match):
        chart_content = match.group(1)
        # Escape any backticks or ${} inside the chart content if present, though mermaid usually doesn't have them
        chart_content = chart_content.replace('`', '\\`').replace('$', '\\$')
        return f"<PatternDiagram chart={{`\n{chart_content}\n`}} />"
        
    new_content = pattern.sub(replacer, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

docs_dir = '/Users/prakharsachan/Developer/DesignPattern/docs/content/docs'
for root, dirs, files in os.walk(docs_dir):
    for file in files:
        if file.endswith('.mdx'):
            convert_mermaid_to_component(os.path.join(root, file))
