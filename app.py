from flask import Flask, render_template
from flask_assets import Bundle, Environment

app = Flask(__name__)

assets = Environment(app)
css = Bundle("css/*.css", output="dist/main.css")
js = Bundle("js/**/*.js", output="dist/main.js")

assets.register("css", css)
assets.register("js", js)
css.build()
js.build()

@app.route("/")
def hello_world():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)