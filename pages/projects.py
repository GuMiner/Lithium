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
    "agow": Project("agow", f"{GITHUB_PREFIX}/agow", f"{image_prefix}/Agow.png",
                    "March 2017", "...", ["Software", "Games"]),
    "adventure": Project("C# Adventure API", f"{GITHUB_PREFIX}/Adventure", f"{image_prefix}/AdventurePort.png",
                         "October 2017", "...", ["Software", "Games"]),
    "temper": Project("Temper Fine", f"{GITHUB_PREFIX}/TemperFine", f"{image_prefix}/TemperFine.png",
                      "February 2016", "...", ["Software", "Games"]),
    "asteroida": Project("Asteroida Graphica", f"{GITHUB_PREFIX}/AsteroidaGraphica", f"{image_prefix}/AsteroidaGraphica.png",
                         "December 2015", "...", ["Software", "Games"]),
}

image_prefix = '/static/projects/simulation-projects'
simulations = {
    "dpc": Project("DPC++ Experiments", f"{GITHUB_PREFIX}/DPC-experiments", f"{image_prefix}/DPCExperiments.png", 
                   "February 2021", "...", ["Simulation", "Software"]),
    "simulator": Project("Simulator", "/projects/simulation/simulator", f"{image_prefix}/Simulator.png",
                    "April 2015", "May 2024", ["Simulation", "Software"]),
    "fluxsim": Project("Flux Sim", "/projects/simulation/fluxsim", f"{image_prefix}/FluxSim.png",
                    "August 2014",  "May 2024", ["Simulation", "Software"]),
    "beamflow": Project("Beam Flow", "/projects/simulation/beamflow", f"{image_prefix}/BeamFlow.png",
                    "December 2011",  "May 2024", ["Simulation", "Software"]),
    "vectorflow": Project("Vector Flow", "/projects/simulation/vectorflow", f"{image_prefix}/VectorFlow.png",
                   "June 2010", "May 2024", ["Simulation", "Software"]),
    "fieldsim": Project("Field Simulator", "/projects/simulation/fieldsim", f"{image_prefix}/FieldSimulator.png",
                     "January 2009", "May 2024", ["Simulation", "Software" ])
}

image_prefix = '/static/projects/hardware-projects'
hardwares = {
    "geiger": Project("DIY Geiger Counter", "/projects/hardware/geiger", f"{image_prefix}/GeigerCounter.png",
        "November 2013", "June 2024", ["Printer", "Electronics", "Hardware"  ]),
    "millboard": Project("Mill Board Electronics", "/projects/hardware/millboard", f"{image_prefix}/MillBoardElectronics.png",
        "February 2015", "June 2024", ["LaserMill", "Electronics", "Hardware"  ]),

    # Laser Cut
    "chessboard": Project( "Laser-engraved chess board", "/projects/hardware/chessboard", f"{image_prefix}/laser-cut/ChessBoard.png",
        "April 2015", "June 2024", ["LaserMill", "Games", "Hardware"  ]),
    "descentmodels": Project( "Descent Laser Models", "/projects/hardware/descentmodels", f"{image_prefix}/laser-cut/DescentModels.png",
        "August 2014", "June 2024", ["LaserMill", "Hardware"  ]),
    "filamentholder": Project("Filament Holder", "/projects/hardware/filamentholder", f"{image_prefix}/laser-cut/FilamentHolder.png",
        "July 2014", "June 2024", ["LaserMill", "Hardware"  ]),
    "saturnvmodel": Project("Saturn V Model", "/projects/hardware/saturnvmodel", f"{image_prefix}/laser-cut/SaturnVModel.png",
        "October 2014", "June 2024", ["LaserMill", "Hardware"  ]),
    "spaceshuttlemodel": Project("Space Shuttle Model", "/projects/hardware/spaceshuttlemodel", f"{image_prefix}/laser-cut/SpaceShuttleModel.png",
        "July 2014", "June 2024", ["LaserMill", "Hardware"  ]),
    "wavegenerator": Project("Wave Generator", "/projects/hardware/wavegenerator", f"{image_prefix}/laser-cut/WaveGenerator.png",
        "July 2014", "June 2024", ["LaserMill", "Hardware"  ]),

    # 3D Printed
    "printrbotabout": Project("About the Printrbot Jr", "/projects/hardware/printrbotabout", f"{image_prefix}/printing/PrintrbotAbout.png",
        "July 2013", "June 2024", ["Printer", "Electronics", "Hardware"  ]),
    "geturbine": Project("GE Turbine Model", "/projects/hardware/geturbine", f"{image_prefix}/printing/GETurbine.png",
        "January 2016", "May 2024", ["Printer", "Hardware"  ]),
    "n64logo": Project("Nintendo 64 Logo", "/projects/hardware/n64logo", f"{image_prefix}/printing/N64Logo.png",
        "February 2016", "May 2024", ["Printer", "Hardware"  ]),
    "gearholder": Project("Gear Holder", "/projects/hardware/gearholder", f"{image_prefix}/printing/GearHolder.png",
        "December 2015", "May 2024", ["Printer", "Hardware"  ]),
    "phoneholder": Project("Phone Holder", "/projects/hardware/phoneholder", f"{image_prefix}/printing/PhoneHolder.png",
        "April 2016", "May 2024", ["Printer", "Hardware" ]),

    # 3D Printed - Cases
    "galileocase": Project("Intel Galileo Gen 2 Case", "/projects/hardware/galileocase", f"{image_prefix}/printing/cases/GalileoCase.png",
        "August 2014", "June 2024", ["Printer", "Hardware"  ]),
    "nanocase": Project("Arduino Nano Case", "/projects/hardware/nanocase", f"{image_prefix}/printing/cases/NanoCase.png",
        "November 2015", "June 2024", ["Printer", "Hardware"  ]),
    "picase": Project("Raspberry Pi Case", "/projects/hardware/picase", f"{image_prefix}/printing/cases/PiCase.png",
        "October 2015", "June 2024", ["Printer", "Hardware"  ]),
    "utilitycases": Project( "Utility Cases", "/projects/hardware/utilitycases", f"{image_prefix}/printing/cases/UtilityCases.png",
        "March 2014", "June 2024",  ["Printer", "Hardware"  ]),
}

image_prefix = '/static/projects/mobile-projects'
mobiles = {
    # TODO add new Android apps
    "SimpleSensor": Project("SimpleSensor", f"{GITHUB_PREFIX}/garmin-simple-sensor", f"{image_prefix}/SimpleSensor.png",
        "November 2018", "...", ["Software", "Mobile" ]),
    "SimpleClarity": Project("SimpleClarity", f"{GITHUB_PREFIX}/garmin-simple-clarity", f"{image_prefix}/SimpleClarity.png",
        "January 2019", "...", ["Software", "Mobile" ]),
    "Playlist DJ": Project("Playlist DJ", f"{GITHUB_PREFIX}/playlist-dj", f"{image_prefix}/PlaylistDJ.png",
        "August 2020", "...", ["Software", "Mobile" ]),
    "SuperTag": Project("SuperTag", f"{GITHUB_PREFIX}/SuperTag", f"{image_prefix}/SuperTag.png",
        "March 2021", "...", ["Software", "Electronics", "Mobile" ]),
    "cncmillsoftware": Project("Pro CNC 3020 Software", "/projects/mobile/cncmillsoftware", f"{image_prefix}/CncMillSoftware.png",
        "May 2015", "June 2024", ["LaserMill", "Software", "Mobile" ]),
    "skigps": Project("Ski GPS Traces", "/projects/mobile/skigps", f"{image_prefix}/SkiGpsTraces.png",
        "January 2019", "June 2024", ["Software", "Mobile" ]),
    # Windows Mobile
    "algorithmassistant": Project("Algorithm Assistant", "/projects/mobile/algorithmassistant", f"{image_prefix}/AlgorithmAssistant.png",
        "December 2013", "June 2024", ["Mobile", "Software" ]),
    "specialistscalculator": Project("Specialists Calculator", "/projects/mobile/specialistscalculator", f"{image_prefix}/SpecialistsCalculator.png",
        "August 2014", "June 2024", ["Mobile", "Software" ]),
     # PDA projects
     "draftingprogram": Project("iPAQ PDA Drafting Program", "/projects/mobile/draftingprogram", f"{image_prefix}/pda/DraftingProgram.png",
        "January 2011", "...", ["Mobile", "Software" ]),
     "fractalviewer": Project("iPAQ PDA Fractal Viewer", "/projects/mobile/fractalviewer", f"{image_prefix}/pda/FractalViewer.png",
        "March 2011", "June 2024", ["Mobile", "Software" ]),
     "lissajouscurves": Project("iPAQ PDA Lissajous Curves", "/projects/mobile/lissajouscurves", f"{image_prefix}/pda/LissajousCurves.png",
        "August 2010", "...", ["Mobile", "Software" ]),
     "particlecollider": Project("iPAQ PDA Particle Collider", "/projects/mobile/particlecollider", f"{image_prefix}/pda/ParticleCollider.png",
        "July 2011", "June 2024", ["Mobile", "Software" ]),
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

def _sorted_projects(projects):
    return sorted(projects.values(), key=lambda project: _get_sortable_date(project.date))

def _most_recent_projects(projects):
    return _sorted_projects(projects)[0:2]

### Project landing pages ###
@projects.route("")
def index():
    most_recent_projects = \
        _most_recent_projects(mobiles) + \
        _most_recent_projects(simulations) + \
        _most_recent_projects(games_data) + \
        _most_recent_projects(hardwares)
    return render_template("projects.html", projects=most_recent_projects)

@projects.route("/games")
def games():
    return render_template("games_projects.html", projects=games_data.values())

@projects.route("/simulation")
def simulation():
    return render_template("simulation.html", projects=simulations.values())

@projects.route("/hardware")
def hardware():
    return render_template("hardware.html", projects=_sorted_projects(hardwares))

@projects.route("/mobile")
def mobile():
    return render_template("mobile.html", projects=_sorted_projects(mobiles))

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

@projects.route("/mobile/<project>")
def mobile_project(project: str):
    return _lookup_project("mobile", project, mobiles)
