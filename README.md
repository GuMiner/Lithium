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
pip install cssmin
pip install jsmin
```

## Development Debugging
```bash
# Can add in --watch if necessary, although my SCSS changes super rarely.
sass scss/index.scss scss/index.css

# Can also add in --watch for JS changes.
esbuild js/index.ts --bundle --outdir=static

flask --debug run
```

## Production release
```bash
esbuild js/index.ts --bundle --outdir=static --minify
```

# Reference
- **Flask**: https://flask.palletsprojects.com/en/3.0.x/
- **Jinja**: https://jinja.palletsprojects.com/en/3.0.x/
- **htmx**: https://htmx.org/docs/#introduction
- **picocss**: https://picocss.com/docs
- **babylonjs**: https://doc.babylonjs.com/journey

