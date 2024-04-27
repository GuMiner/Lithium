
from flask import Blueprint, render_template, abort

projects = Blueprint('projects', __name__, url_prefix='/projects', template_folder='templates/projects')

@projects.route("/")
def index():
    return render_template("projects.html")