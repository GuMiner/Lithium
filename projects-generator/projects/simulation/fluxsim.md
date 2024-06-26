none
{
## About
[g
[
 {} <b>{{ project.name }}</b> is a thermal simulation program I wrote to test the <a href="http://eigen.tuxfamily.org/index.php?title=Main_Page">Eigen</a> matrix math library and the <a href="http://www.sfml-dev.org/">SFML</a> graphics library.
 {} The thermal dynamics are performed by iteratively solving a large spare matrix linking each neighboring cell(image pixel) to each other cell and equalizing the temperatures, simulating heat flow.
 {} The physics and mathematical infrastructure for this program were derived from <a href="https://books.google.com/books/about/Nuclear_heat_transport.html?id=97UjAAAAMAAJ">Nuclear Heat Transport</a> by <i>M. M. El-Wakil</i>
]
@simulation-projects/flux-sim/FluxSim1.png~Partially-equalized random thermal distribution
]
}
{
## Capabilities
[g
@simulation-projects/flux-sim/FluxSim2.png~Substantially-equalized random thermal distribution
@simulation-projects/flux-sim/FluxSim3.png~Heat flow from a cold aluminum rectangle to hot walls
]
This application accurately simulates the thermal transport over time within a piece of aluminum, although other materials can be added with material files which specify the material heat capacity at different temperatures.
}
{
[g
[
  {} Because this application simply simulates a massive 2D grid as a matrix, it was easy to add support for insulated points and fixed-temperature points.
  {} Simulating additional geometry, while certainly possible, has not been experimented with.
]
@simulation-projects/flux-sim/FluxSim4.png~Fixed-temperature points, evenly distributed throughout the simulation grid
]
}
## Software
{
This program is written in platform-independent C++ code, but you'll have to source the libraries yourself and I have not tested Unix/OS X compilation.
<br />
The Windows executable can be downloaded <a href="/static/projects/simulation-projects/flux-sim/FluxSim_WinExecutable.zip">here</a> -- you'll also need the
Visual Studio 2012 (32-bit) <a href="https://www.microsoft.com/en-us/download/details.aspx?id=30679">C++ redistributable</a>.
<br />
The source code and assets can be downloaded <a href="/static/projects/simulation-projects/flux-sim/FluxSim_SourcesAssets.zip">here</a>
}
<blockquote>
    <video controls alt="FluxSim demo video">
        <source src="/static/projects/simulation-projects/flux-sim/demo.mp4" type="video/mp4">
        Your browser does not support the video tag. Unfortuantely, the video will not play here.
    </video>
    <footer>
        FluxSim in action, simulating heat flow.
    </footer>
</blockquote>