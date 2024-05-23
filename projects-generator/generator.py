from enum import Enum
import os
from pathlib import Path

class Mode(Enum):
    Start = 1,
    Imports = 2,
    Content = 3,

class Snippets:
    math_css = [
        '',
        '{% block css %}',
        '<link rel="stylesheet" href="/static/math.css">',
        '{% endblock css %}']
    
    math_js = [
        '',
        '{% block scripts %}',
        '<script type="text/javascript" src="/static/math.js"></script>',
        '{% endblock scripts %}']
    
    base_header = [
        '{# GENERATED CONTENT #}',
        '{% extends "_base.html" %}']

    main_header = [
        '',
        '{% block content %}',
        '{% include "_projects_header.html" %}',
        '{% include "_project_header.html" %}']

def _generate_image(depth, short_line):
    parts = short_line[1:].split('~', 1)
    return [
        f'{depth}<article>',
        f'{depth}  <img src="../../static/projects/{parts[0]}" alt="{parts[1]}"/>',
        f'{depth}  <footer>{parts[1]}</footer>',
        f'{depth}</article>'
    ]

def _generate_math(depth, short_line):
    parts = short_line[1:].split('~', 1)
    return [
        f'{depth}<blockquote class="align-center">',
        f'{depth}  $${parts[0]}$$',
        f'{depth}  <cite>{parts[1]}</cite>',
        f'{depth}</blockquote>'
    ]

def _process_file(script_path, lines):
    mode = Mode.Start
    output_file = None
    output_lines = []
    output_lines += Snippets.base_header

    depth = ''
    footer = []

    for line in lines:
        if mode == Mode.Start:
            # Figure out where the file will be stored
            output_file = line
            mode = Mode.Imports
        elif mode == Mode.Imports:
            # Add in any extra imports if required
            if 'math' in line:
                output_lines += Snippets.math_css
                footer = Snippets.math_js

            # Add in default imports
            output_lines += Snippets.main_header
            mode = Mode.Content
        elif mode == Mode.Content:
            short_line = line.strip()
            # Basic paragraph content
            if short_line.startswith('{} '):
                output_lines += [
                    f'{depth}<p>',
                    f'{depth}  {short_line[3:]}',
                    f'{depth}</p>']
            # Divs/Grids
            elif short_line.startswith('['):
                if short_line.startswith('[g'):
                    output_lines += [f'{depth}<div class="grid">']
                else:
                    output_lines += [f'{depth}<div>']
                depth += '  '
            elif short_line.startswith(']'):
                depth = depth[:-2]
                output_lines += [f'{depth}</div>']
            # Paragraphs
            elif short_line.startswith('{'):
                output_lines += [f'{depth}<p>']
                depth += '  '
            elif short_line.startswith('}'):
                depth = depth[:-2]
                output_lines += [f'{depth}</p>']
            # Headers
            elif short_line.startswith('## '):
                output_lines += [f'{depth}<h2>{short_line[3:]}</h2>']
            # Images
            elif short_line.startswith("@"):
                output_lines += _generate_image(depth, short_line)
            # Math
            elif short_line.startswith("%"):
                output_lines += _generate_math(depth, short_line)
            # Bullet-point lists
            elif short_line.startswith("-"):
                if short_line.startswith('->'):
                    output_lines += [f'{depth}<ul>']
                    depth += '  '

                output_lines += [f'{depth}<li>{short_line[2:].strip()}</li>']

                if short_line.startswith('-<'):
                    depth = depth[:-2]
                    output_lines += [f'{depth}</ul>']
            # Plain text
            else:
                output_lines += [f'{depth}{short_line}']

    output_lines += ['{% endblock content %}']
    output_lines += footer

    output_path = os.path.join(script_path, f'../templates/projects/{output_file}.html')
    print(f'Saving {output_path}')
    Path(output_path).write_text('\n'.join(output_lines))
    

# Converts project files into HTML from a more condensed syntax.
# File format:
#   Path, ie 'simulation/fluxsim'
#   Imports, ie 'none' or 'math'
#   Content, in pseudo markdown format. Examples:
#     ## H2 header
#     { == (Paragraph start)
#     } == (Paragraph end)
#     [ == (div start. Specify '[g' for the grid class)
#     ] == (div end)
#     {} ...content... == Embed the content in a paragraph
#     @image_path~alt_text_and_title == An image with alt text
#     %Katex$$MATH$$block~title_of_math_block == A math block
#     - == Bullet point list. Use '->' to start the list and '-<' to end it, with '-' for all other entries.
if __name__ == "__main__":
    script_path = os.path.abspath(os.path.dirname(__file__))
    projects_path = os.path.join(script_path, 'projects')

    for file in os.listdir(projects_path):
        file_path = Path(os.path.join(projects_path, file))
        lines = file_path.read_text().splitlines()
        _process_file(script_path, lines)