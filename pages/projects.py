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

image_prefix = '/static/projects/simulation-projects'
simulations = {
    "dpc": Project("DPC++ Experiments", f"{GITHUB_PREFIX}/DPC-experiments", f"{image_prefix}/DPCExperiments.png", 
                   "February 2021", "...", ["Simulation", "Software"]),
    "simulator": Project("Simulator", "simulation/simulator", f"{image_prefix}/Simulator.png",
                    "April 2015", "May 2024", ["Simulation", "Software"]),
    "fluxsim": Project("Flux Sim", "simulation/fluxsim", f"{image_prefix}/FluxSim.png",
                    "August 2014",  "May 2024", ["Simulation", "Software"]),
    "beamflow": Project("Beam Flow", "simulation/beamflow", f"{image_prefix}/BeamFlow.png",
                    "December 2011",  "May 2024", ["Simulation", "Software"]),
    "vectorflow": Project("Vector Flow", "simulation/vectorflow", f"{image_prefix}/VectorFlow.png",
                   "June 2010", "May 2024", ["Simulation", "Software"]),
    "fieldsim": Project("Field Simulator", "simulation/fieldsim", f"{image_prefix}/FieldSimulator.png",
                     "January 2009", "May 2024", ["Simulation", "Software" ])
}

image_prefix = '/static/projects/hardware-projects'
hardwares = {
    "geiger": Project("DIY Geiger Counter", "hardware/geiger", f"{image_prefix}/GeigerCounter.png",
        "November 2013", "...", ["Printer", "Electronics" ]),
    "millboard": Project("Mill Board Electronics", "hardware/millboard", f"{image_prefix}/MillBoardElectronics.png",
        "2015, 2, 1", "...", ["LaserMill", "Electronics" ]),

    # Laser Cut
    "chessboard": Project( "Laser-engraved chess board", "hardware/chessboard", f"{image_prefix}/laser-cut/ChessBoard.png",
        "2015, 4, 1", "...", ["LaserMill", "Games" ]),
    "descentmodels": Project( "Descent Laser Models", "hardware/descentmodels", f"{image_prefix}/laser-cut/DescentModels.png",
        "2014, 8, 1", "...", ["LaserMill" ]),
    "filamentholder": Project("Filament Holder", "hardware/filamentholder", f"{image_prefix}/laser-cut/FilamentHolder.png",
        "2014, 7, 1", "...", ["LaserMill" ]),
    "saturnvmodel": Project("Saturn V Model", "hardware/saturnvmodel", f"{image_prefix}/laser-cut/SaturnVModel.png",
        "2014, 10, 1", "...", ["LaserMill" ]),
    "spaceshuttlemodel": Project("Space Shuttle Model", "hardware/spaceshuttlemodel", f"{image_prefix}/laser-cut/SpaceShuttleModel.png",
        "2014, 7, 1", "...", ["LaserMill" ]),
    "wavegenerator": Project("Wave Generator", "hardware/wavegenerator", f"{image_prefix}/laser-cut/WaveGenerator.png",
        "2014, 7, 1", "...", ["LaserMill" ]),

    # 3D Printed
    "printrbotabout": Project("About the Printrbot Jr", "hardware/printrbotabout", f"{image_prefix}/printing/PrintrbotAbout.png",
        "2013, 7, 1", "...", ["Printer", "Electronics" ]),
    "geturbine": Project("GE Turbine Model", "hardware/geturbine", f"{image_prefix}/printing/GETurbine.png",
        "2016, 1, 1", "...", ["Printer" ]),
    "n64logo": Project("Nintendo 64 Logo", "hardware/n64logo", f"{image_prefix}/printing/N64Logo.png",
        "2016, 2, 1", "...", ["Printer" ]),
    "gearholder": Project("Gear Holder", "hardware/gearholder", f"{image_prefix}/printing/GearHolder.png",
        "2015, 12, 1", "...", ["Printer" ]),
    "phoneholder": Project("Phone Holder", "hardware/phoneholder", f"{image_prefix}/printing/PhoneHolder.png",
        "2016, 4, 1", "...", ["Printer" ]),

    # 3D Printed - Cases
    "galileocase": Project("Intel Galileo Gen 2 Case", "hardware/galileocase", f"{image_prefix}/printing/cases/GalileoCase.png",
        "2014, 8, 1", "...", ["Printer" ]),
    "nanocase": Project("Arduino Nano Case", "hardware/nanocase", f"{image_prefix}/printing/cases/NanoCase.png",
        "2015, 11, 1", "...", ["Printer" ]),
    "picase": Project("Raspberry Pi Case", "hardware/picase", f"{image_prefix}/printing/cases/PiCase.png",
        "2015, 10, 1", "...", ["Printer" ]),
    "utilitycases": Project( "Utility Cases", "hardware/utilitycases", f"{image_prefix}/printing/cases/UtilityCases.png",
        "2014, 3, 1", "...",    ["Printer" ]),
}

### Project landing pages ###
@projects.route("/")
def index():
    return render_template("projects.html")

@projects.route("/games")
def games():
    return render_template("games.html", projects=games_data.values())

@projects.route("/simulation")
def simulation():
    return render_template("simulation.html", projects=simulations.values())

@projects.route("/hardware")
def hardware():
    return render_template("hardware.html", projects=sorted(hardwares.values(), key=lambda hardware: hardware.date))

def _lookup_project(category, project, projects: dict):
    lower_project = project.lower()
    if lower_project in projects and GITHUB_PREFIX not in projects[lower_project].link:
        return render_template(f"/{category}/{escape(project)}.html", project=projects[lower_project])
    else:
        return render_template("errors/not_found.html")

@projects.route("/simulation/<project>")
def simulation_project(project: str):
    return _lookup_project("simulation", project, simulations)

@projects.route("/hardware/<project>")
def hardware_project(project: str):
    return _lookup_project("hardware", project, hardwares)
