# Lithium
A rewrite of Helium in Flask

# Setup

## IDE Functionality
VSCode extensions:
- Python: https://marketplace.visualstudio.com/items?itemName=ms-python.python

## Project creation
```batch
python -m venv .venv
.venv\Scripts\activate
```

```batch
pip install Flask
pip install Flask-Assets
pip install watchdog
pip install pytailwindcss
```

```
tailwindcss_install
tailwindcss init
```

## Development Debugging
```batch
tailwindcss -i ./static/css/main.css -o ./static/dist/main.css --watch
flask --debug run
```

## Production release
```bash
# Minify CSS
tailwindcss -i ./static/css/main.css -o ./static/dist/main.css --minify
```

# Reference
## Flask
https://flask.palletsprojects.com/en/3.0.x/