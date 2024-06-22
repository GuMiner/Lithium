none
## About
[g
[
 {} <b>{{ project.name }}</b> project tested if real-time CSG generation with volumetric texture map creation was feasible for use within a computer game.
 {} Overall, while performance was acceptable rendering one object, the resulting application was not scalable for use within a production computer game
]
 @software-projects/code-gell/checkerboard volumetric texture shaded.png~A volumetrically-rendered checkerboard
]
[g
[
 {} <b>{{ project.name }}</b> uses a <a href="https://github.com/GuMiner/Surface-Netgen-Fork">modified version</a> of the <a href="http://sourceforge.net/projects/netgen-mesher/">Netgen library</a>, which I had stripped-down to only generate triangles, surface meshes, and overall improve performance and usability for realtime operations.
 {} When given a description of an object, this program will send it through my Netgen variant to determine the triangles forming the object' s mesh, put the triangles on a texture image, and fill the texture using an appropriate volumetric voxel texture. With this process, <b>{{ project.name }}</b> renders in real-time object <i>cuts</i> and <i>holes</i> instead of the defined triangles of an <i>object itself</i>.
]
@software-projects/code-gell/Triangle ID texture shaded.png~CSG from Netgen, without volumetric textures
]
## Implementation
[g
 [
    {} This program uses modern OpenGL 4.0 rendering, along with <a href="http://glew.sourceforge.net/">GLEW</a>, <a href="https://github.com/GuMiner/Surface-Netgen-Fork">Surface-Netgen-Fork</a>, and <a href="http://www.glfw.org/index.html">GLFW3</a>.
    {} For more information, see the source code on <a href="https://github.com/GuMiner/Volumetric-CSG-Texture-Mapping">GitHub</a>.
 ]
 @software-projects/code-gell/Watermelon volumetric texture shaded.png~'Watermellon' volumetric texture shaded object
 @software-projects/code-gell/High-Res fragment shaded.png~Volumetric fragment-shared object
]