
from dataclasses import dataclass
from typing import List
from flask import Blueprint, render_template

recommendations = Blueprint('recommendations', __name__, url_prefix='/recommendations', template_folder='../templates/recommendations')

@dataclass
class Reference:
    name: str
    link: str
    moreDetails: str = None
    moreDetailsLink: str = None

# Renders vertically within each horizontal slice
@dataclass
class ReferenceGroup:
    title: str
    lastUpdated: str
    references: List[Reference]

# Renders horizontally
@dataclass
class ReferenceSet:
    referenceGroups: List[ReferenceGroup]

referenceSets = [
    ReferenceSet([
        ReferenceGroup("Astronomy", "June 2024", [
            Reference("Visualization (Celestia)", "https://celestiaproject.space/"),
            Reference("Planetarium (Stellarium)", "http://stellarium.org/"),
        ]),
        ReferenceGroup("Hiking and Backpacking", "June 2024", [
            Reference("Maps (Caltopo)", "https://caltopo.com/map.html"),
            Reference("GPX Editor (GPS Track Editor)", "http://www.gpstrackeditor.com"),
            Reference("A Better Route planner", "https://abetterrouteplanner.com/")
        ]),
        ReferenceGroup("Geography / GIS", "June 2024", [
            Reference("King County GIS download", "https://kingcounty.gov/services/gis/GISData.aspx"),
            Reference("USGS National Map", "https://apps.nationalmap.gov/viewer/"),
            Reference("GIS Editor (QGIS)", "https://www.qgis.org"),
        ]),
    ]),
    ReferenceSet([
        ReferenceGroup("Software Development", "June 2024", [
            Reference("Bitvise SSH Client", "https://www.bitvise.com/ssh-client-download"),
            Reference("Diff Tool / Editor/ light IDE (Visual Studio Code)", "https://code.visualstudio.com/"),
            Reference("C# / C++ IDE (Visual Studio)", "https://visualstudio.microsoft.com/"),
            Reference("Python IDE (PyCharm)", "https://www.jetbrains.com/pycharm/"),
            Reference("Java IDE (NetBeans)", "https://netbeans.org/"),
            Reference("Java IDE 2 (Eclipse)", "https://www.eclipse.org/"),
            Reference("Java IDE 3 (Code::Blocks)", "http://www.codeblocks.org/"),
            Reference("Game Design IDE (Unity)", "https://unity3d.com/"),
            Reference("Code Management (git)", "https://git-scm.com/"),
            Reference("GPU Render Analysis (RenderDoc)", "https://renderdoc.org/"),
            Reference("OpenGl/WebGl/WebGPU", "https://math.hws.edu/graphicsbook/"),
        ])
    ]),
    ReferenceSet([
        ReferenceGroup("C++ Libraries", "June 2024", [
            Reference("Package management (vcpkg)", "https://github.com/microsoft/vcpkg"),
            Reference("Image / Font Libraries (STB)", "https://github.com/nothings/stb"),
            Reference("JSON Parsing (nlohmann JSON)", "https://github.com/nlohmann/json"),
            Reference("Linear Algebra (Eigen)", "http://eigen.tuxfamily.org/index.php?title=Main_Page"),
            Reference("Game / Multimedia Graphics (SFML)", "https://www.sfml-dev.org/"),
        ]),
        ReferenceGroup("Go Libraries", "June 2024", [
            Reference("OpenGL bindings", "https://github.com/go-gl/gl"),
            Reference("OpenSimplex random noise algorithm", "https://github.com/ojrac/opensimplex-go"),
        ]),
        ReferenceGroup("Rust Libraries", "June 2024", [
            Reference("Kiss3D graphics library", "https://github.com/sebcrozet/kiss3d"),
        ]),
    ]),
    ReferenceSet([
        ReferenceGroup("Mathematics", "June 2024", [
            Reference("Online Math (MathStudio)", "http://mathstud.io/"),
            Reference("General (Octave)", "https://www.gnu.org/software/octave/"),
            Reference("Algebra (wxMaxima)", "https://wxmaxima-developers.github.io/wxmaxima/"),
            Reference("Visualizations (ParaView)", "https://www.paraview.org/"),
            Reference("Like MATLAB (Scilab)", "https://www.scilab.org/"),
        ]),
        ReferenceGroup("Electronics", "June 2024", [
            Reference("Antenna Design (4nec2)", "https://www.qsl.net/4nec2/"),
            Reference("PCB Design (KiCad)", "http://kicad-pcb.org/"),
            Reference("Simulation (LTspice)", "https://www.analog.com/en/design-center/design-tools-and-calculators/ltspice-simulator.html"),
        ]),
    ]),
    ReferenceSet([
        ReferenceGroup("Web Development", "June 2024", [
            Reference("HTML / CSS / JS reference", "https://developer.mozilla.org/en-US/"),
            Reference("CSS Grid details", "https://learncssgrid.com/"),
        ]),
        ReferenceGroup("Machine Learning", "June 2024", [
            Reference("Models and tooling (Hugging Face)", "https://huggingface.co/"),
            Reference("Windows AI", "https://learn.microsoft.com/en-us/windows/ai/"),
            Reference("Model Renderer (shows Alexnet)", "http://ethereon.github.io/netscope/#/preset/alexnet"),
        ]),
    ]),
    ReferenceSet([
        ReferenceGroup("3D Modeling", "June 2024", [
            Reference("Artistic Modeling (Blender)", "https://www.blender.org/"),
            Reference("CAD (FreeCAD)", "https://www.freecadweb.org/"),
            Reference("Voxel Art (MagicaVoxel)", "https://ephtracy.github.io/"),
            Reference("CAD for Programmers (OpenSCAD)", "http://www.openscad.org/"),
            Reference("Ray Tracing (POV-Ray)", "http://povray.org/"),
            Reference("More Art Modeling (Wings 3D)", "http://www.wings3d.com/"),
            Reference("See more details at:", "/projects/hardware/printrbotabout")
        ]),
        ReferenceGroup("3D Printing", "June 2024", [
            Reference("Models (MyMiniFactory)", "https://www.myminifactory.com"),
            Reference("More Models (Thingiverse)", "https://www.thingiverse.com"),
            Reference("Image to 3D Converter", "http://clonerbox.com/image_3D_converter.php"),
        ]),
    ]),
    ReferenceSet([
        ReferenceGroup("Audio", "June 2024", [
            Reference("Audio processing (Audacity)", "https://www.audacityteam.org/"),
            Reference("Software Defined Radio Receiver (SDR#)", "https://airspy.com/download/"),
            Reference("SDR to parse trucked transmissions (Unitrucker)", "http://unitrunker.com/"),
        ]),
        ReferenceGroup("Image Manipulation", "June 2024", [
            Reference("Editing (GIMP)", "https://www.gimp.org/"),
            Reference("Panoramas (Hugin)", "http://hugin.sourceforge.net/"),
            Reference("Photo conversion (ImageMagick)", "http://www.imagemagick.org/"),
            Reference("More Editing (Paint.net)", "https://www.getpaint.net/index.html"),
            Reference("Image Compression (jpeg-recompress)", "https://github.com/danielgtaylor/jpeg-archive#jpeg-recompress"),
        ]),
    ]),
    ReferenceSet([
        ReferenceGroup("Multimedia", "June 2024", [
            Reference("Video Converter 2 (ffmpeg)", "https://ffmpeg.org/",
                "Useful ffmpeg snippets", "https://github.com/GuMiner/Scripts/blob/master/FFmpegSnippets.txt"),
            Reference("Video converter (Handbrake)", "https://handbrake.fr/"),
            Reference("Video Editor (Magix Movie Studio)", "https://www.magix.com/us/video-editor/movie-studio/"),
            Reference("eBook Management (Calibre)", "https://calibre-ebook.com/"),
            Reference("Text Editor (Notepad++)", "https://notepad-plus-plus.org/"),
            Reference("Office Suite (Office)", "https://www.office.com/"),
            Reference("Paper scanning (NAPS2)", "https://www.naps2.com/"),
        ]),
        ReferenceGroup("File Management", "June 2024", [
            Reference("Compression (7-Zip)", "https://www.7-zip.org/"),
            Reference("Searching (SwiftSearch)", "https://sourceforge.net/projects/swiftsearch/files/"),
            Reference("Music Player (MusicBee)", "https://getmusicbee.com/"),
            Reference("PDF viewer (Sumatra PDF)", "https://www.sumatrapdfreader.org"),
            Reference("Video Playback (VLC)", "https://www.videolan.org/vlc/"),
        ])
    ])
]

@recommendations.route("/")
def index():
    return render_template("recommendations.html", referenceSets=referenceSets)

@dataclass
class Attribution:
    name: str
    link: str
    details: str

attributionSet = {
    "javaScript": [
        Attribution("BabylonJS", "https://www.babylonjs.com/", "3D WebGL graphics"),
        Attribution("esbuild", "https://esbuild.github.io/", "JavaScript bundling & minification"),
        Attribution("htmx", "https://htmx.org/", "Client/Server HTML attribute-based"),
        Attribution("Pico CSS", "https://picocss.com/", "Small CSS styling library"),
        Attribution("sass", "https://sass-lang.com/", "CSS extension language to more easily generate CSS"),
        Attribution("Socket.IO", "https://socket.io/", "Client/Server realtime communication"),
        Attribution("TypeScript", "https://www.typescriptlang.org/", "Language built on JavaScript to more easily generate JavaScript"),
    ],
    "python": [
        Attribution("Flask", "https://flask.palletsprojects.com/en/3.0.x/", "General backend"),
        Attribution("Jinja2", "https://jinja.palletsprojects.com/en/3.0.x/", "Server-side HTML page templates"),
        Attribution("Flask-Compress", "https://pypi.org/project/Flask-Compress/", "Flask support for page / asset compressiond"),
        Attribution("Flask-SocketIO", "https://flask-socketio.readthedocs.io/en/latest/", "Flask support for Socket IO"),
        Attribution("Gunicorn", "https://gunicorn.org/", "WSGI HTTP server to run Flask on Debian")
    ]
}

@recommendations.route("/attributions")
def attributions():
    return render_template("attributions.html", attributions=attributionSet)