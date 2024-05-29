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
        "February 2015", "...", ["LaserMill", "Electronics" ]),

    # Laser Cut
    "chessboard": Project( "Laser-engraved chess board", "hardware/chessboard", f"{image_prefix}/laser-cut/ChessBoard.png",
        "April 2015", "...", ["LaserMill", "Games" ]),
    "descentmodels": Project( "Descent Laser Models", "hardware/descentmodels", f"{image_prefix}/laser-cut/DescentModels.png",
        "August 2014", "...", ["LaserMill" ]),
    "filamentholder": Project("Filament Holder", "hardware/filamentholder", f"{image_prefix}/laser-cut/FilamentHolder.png",
        "July 2014", "...", ["LaserMill" ]),
    "saturnvmodel": Project("Saturn V Model", "hardware/saturnvmodel", f"{image_prefix}/laser-cut/SaturnVModel.png",
        "October 2014", "...", ["LaserMill" ]),
    "spaceshuttlemodel": Project("Space Shuttle Model", "hardware/spaceshuttlemodel", f"{image_prefix}/laser-cut/SpaceShuttleModel.png",
        "July 2014", "...", ["LaserMill" ]),
    "wavegenerator": Project("Wave Generator", "hardware/wavegenerator", f"{image_prefix}/laser-cut/WaveGenerator.png",
        "July 2014", "...", ["LaserMill" ]),

    # 3D Printed
    "printrbotabout": Project("About the Printrbot Jr", "hardware/printrbotabout", f"{image_prefix}/printing/PrintrbotAbout.png",
        "July 2013", "...", ["Printer", "Electronics" ]),
    "geturbine": Project("GE Turbine Model", "hardware/geturbine", f"{image_prefix}/printing/GETurbine.png",
        "January 2016", "May 2024", ["Printer" ]),
    "n64logo": Project("Nintendo 64 Logo", "hardware/n64logo", f"{image_prefix}/printing/N64Logo.png",
        "February 2016", "May 2024", ["Printer" ]),
    "gearholder": Project("Gear Holder", "hardware/gearholder", f"{image_prefix}/printing/GearHolder.png",
        "December 2015", "May 2024", ["Printer" ]),
    "phoneholder": Project("Phone Holder", "hardware/phoneholder", f"{image_prefix}/printing/PhoneHolder.png",
        "April 2016", "May 2024", ["Printer" ]),

    # 3D Printed - Cases
    "galileocase": Project("Intel Galileo Gen 2 Case", "hardware/galileocase", f"{image_prefix}/printing/cases/GalileoCase.png",
        "August 2014", "...", ["Printer" ]),
    "nanocase": Project("Arduino Nano Case", "hardware/nanocase", f"{image_prefix}/printing/cases/NanoCase.png",
        "November 2015", "...", ["Printer" ]),
    "picase": Project("Raspberry Pi Case", "hardware/picase", f"{image_prefix}/printing/cases/PiCase.png",
        "October 2015", "...", ["Printer" ]),
    "utilitycases": Project( "Utility Cases", "hardware/utilitycases", f"{image_prefix}/printing/cases/UtilityCases.png",
        "March 2014", "...",    ["Printer" ]),
}

def _get_sortable_date(date: str):
    parts = date.split(" ")
    expanded_year = int(parts[1]) * 100
    
    # Month lookup. There probably is a more Pythonic way of doing this.
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    for i in range(0, len(months)):
        if parts[0] == months[i]:
            # Add the month to the year (and negate) for descending sorting
            return -(expanded_year + i)
    
    raise Exception(f"Month not found: {date}")

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
    return render_template("hardware.html", projects=sorted(hardwares.values(), key=lambda hardware: _get_sortable_date(hardware.date)))

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
