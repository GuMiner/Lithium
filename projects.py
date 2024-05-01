from dataclasses import dataclass
from flask import Blueprint, render_template
from markupsafe import escape
from typing import List

projects = Blueprint('projects', __name__, url_prefix='/projects', template_folder='templates/projects')

GITHUB_PREFIX = "https://github.com/GuMiner"

@dataclass
class Project:
    name: str
    link: str
    image: str
    date: str
    tags: List[str]


@projects.route("/")
def index():
    return render_template("projects.html")

@projects.route("/games")
def games():
    image_prefix = '/static/projects/game-projects'
    games = [
        Project("Asteroida Graphica", f"{GITHUB_PREFIX}/AsteroidaGraphica", f"{image_prefix}/AsteroidaGraphica.png", "December 2015", ["Software", "Games"]),
        Project("Temper Fine", f"{GITHUB_PREFIX}/TemperFine", f"{image_prefix}/TemperFine.png", "February 2016", ["Software", "Games"]),
        Project("agow", f"{GITHUB_PREFIX}/agow", f"{image_prefix}/Agow.png", "March 2017", ["Software", "Games"]),
        Project("C# Adventure API", f"{GITHUB_PREFIX}/Adventure", f"{image_prefix}/AdventurePort.png", "October 2017", ["Software"])
    ]

    return render_template("games.html", projects=games)

@projects.route("/simulation")
def simulation():
    image_prefix = '/static/projects/simulation-projects'
    simulations = [
        Project("DPC++ Experiments", f"{GITHUB_PREFIX}/DPC-experiments", f"{image_prefix}/DPCExperiments.png", "February 2021", ["Simulation", "Software"]),
        Project("Simulator", "simulation/simulator", f"{image_prefix}/Simulator.png", "April 2015", ["Simulation", "Software"]),
        Project("Flux Sim", "SimulationProjects/FluxSim", f"{image_prefix}/FluxSim.png", "August 2014", ["Simulation", "Software"]),
        Project("Beam Flow", "SimulationProjects/BeamFlow", f"{image_prefix}/BeamFlow.png", "December 2011", ["Simulation", "Software"]),
        Project("Vector Flow", "SimulationProjects/VectorFlow", f"{image_prefix}/VectorFlow.png", "June 2010", ["Simulation", "Software"]),
        Project("Field Simulator", "SimulationProjects/FieldSimulator", f"{image_prefix}/FieldSimulator.png", "January 2009", ["Simulation", "Software" ])
    ]

    return render_template("simulation.html", projects=simulations)

@projects.route("/simulation/<project>")
def simulation_project(project):
    return render_template(f"/simulation/{escape(project)}.html")