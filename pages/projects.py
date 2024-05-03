from dataclasses import dataclass
from flask import Blueprint, render_template
from markupsafe import escape
from typing import List

projects = Blueprint('projects', __name__, url_prefix='/projects', template_folder='../templates/projects')

GITHUB_PREFIX = "https://github.com/GuMiner"

@dataclass
class Project:
    name: str
    link: str
    image: str
    date: str
    updated: str
    tags: List[str]


@projects.route("/")
def index():
    return render_template("projects.html")

image_prefix = '/static/projects/game-projects'
games_data = {
    "asteroida": Project("Asteroida Graphica", f"{GITHUB_PREFIX}/AsteroidaGraphica", f"{image_prefix}/AsteroidaGraphica.png",
                         "December 2015", "...", ["Software", "Games"]),
    "temper": Project("Temper Fine", f"{GITHUB_PREFIX}/TemperFine", f"{image_prefix}/TemperFine.png",
                      "February 2016", "...", ["Software", "Games"]),
    "agow": Project("agow", f"{GITHUB_PREFIX}/agow", f"{image_prefix}/Agow.png",
                    "March 2017", "...", ["Software", "Games"]),
    "adventure": Project("C# Adventure API", f"{GITHUB_PREFIX}/Adventure", f"{image_prefix}/AdventurePort.png",
                         "October 2017", "...", ["Software"])
}

@projects.route("/games")
def games():
    return render_template("games.html", projects=games_data.values())

image_prefix = '/static/projects/simulation-projects'
simulations = {
    "dpc": Project("DPC++ Experiments", f"{GITHUB_PREFIX}/DPC-experiments", f"{image_prefix}/DPCExperiments.png", 
                   "February 2021", "...", ["Simulation", "Software"]),
    "simulator": Project("Simulator", "simulation/simulator", f"{image_prefix}/Simulator.png",
                    "April 2015", "May 2024", ["Simulation", "Software"]),
    "fluxsim": Project("Flux Sim", "simulation/fluxsim", f"{image_prefix}/FluxSim.png",
                    "August 2014",  "May 2024", ["Simulation", "Software"]),
    "beam": Project("Beam Flow", "SimulationProjects/BeamFlow", f"{image_prefix}/BeamFlow.png",
                    "December 2011",  "...", ["Simulation", "Software"]),
    "vec": Project("Vector Flow", "SimulationProjects/VectorFlow", f"{image_prefix}/VectorFlow.png",
                   "June 2010", "...", ["Simulation", "Software"]),
    "field": Project("Field Simulator", "SimulationProjects/FieldSimulator", f"{image_prefix}/FieldSimulator.png",
                     "January 2009", "...", ["Simulation", "Software" ])
}

@projects.route("/simulation")
def simulation():
    return render_template("simulation.html", projects=simulations.values())

@projects.route("/simulation/<project>")
def simulation_project(project: str):
    lower_project = project.lower()
    if lower_project in simulations and GITHUB_PREFIX not in simulations[lower_project].link:
        return render_template(f"/simulation/{escape(project)}.html", project=simulations[lower_project])
    else:
        return render_template("errors/not_found.html")
