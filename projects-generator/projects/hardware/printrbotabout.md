none
## About
{} For experimentation purposes, I bought a Printrbot JR 3D printer when the wooden model (Version 1) was still being sold.
[g
 @hardware-projects/printing/printrbot/printer_then.jpg~The original assembled Printrbot JR 3D printer
 [
    {} With that printer, I've been able to fine-tune it to reliably print at 0.3 mm layer heights and sometimes print at 0.1 mm resolution.
    {} Over the past years I've performed minor updates, mainly replacing the printbed (first to acrylic (which melted), then to 4130 steel), and updating the firmware.
 ]
]
[g
 @hardware-projects/printing/printrbot/printer_now.jpg~The assembled Printrbot JR 3D printer, with modifications
 {}  I have since upgraded to a newer printer, but even with this older printer I was able to reliably print with it, accounting for the limitations and strengths of its design.
]
## Software Settings
{} To reliably print with this printer, I have used the following settings:
[g
<table border="1">
    <tr> <th><b>Parameter</b></th> <th><b>Setting</b> </th> <th><b>Units</b> </th> </tr>
    <tr> <td>Heater Temp</td> <td>196-200</td> <td><sup>O</sup>C</td> </tr>
    <tr> <td>Perimeter Speed </td> <td>60 </td> <td>mm/s </td> </tr>
    <tr> <td>Small Perimeter Speed </td> <td>60 </td> <td>mm/s </td> </tr>
    <tr> <td>Infill Speed </td> <td>80 </td> <td>mm/s </td> </tr>
    <tr> <td>Support Speed</td> <td>90 </td> <td>mm/s </td> </tr>
    <tr> <td>Bridges Speed </td> <td>90 </td> <td>mm/s </td> </tr>
    <tr> <td>Gap Speed </td> <td>30 </td> <td>mm/s </td> </tr>
    <tr> <td>Travel Speed </td> <td>130 </td> <td>mm/s </td> </tr>
</table>
[
]
]
{} However, those settings are only applicable when using either <a href="http://www.repetier.com/documentation/repetier-host/">Repetier-Host</a> or <a href="http://www.mattercontrol.com/">Matter Control</a> to load up the STL file, <a href="http://slic3r.org/">Slic3r</a> to slice the file into layers, and either program to send the slices to the 3D printer for printing.
{} To actually design the models to 3D print, I either use an existing model on <a href="https://www.thingiverse.com/">Thingiverse</a> or design my own.
{} Designing a 3D model can be done with a variety of software:
-> <a href="http://www.autodesk.com/products/inventor/overview">Autodesk Inventor</a>: <small>Sketch-and-constraint based 3D modeling software.
Expensive for both personal and professional use, but I have used this software in high-school design courses.</small>
- <a href="http://www.blender.org/">Blender</a>: Subdivision freeform modeling tool.
<small>Has an immense learning curve and is very focused towards the arts, making it harder to design objects to precise dimentions.</small>
- <a href="https://brlcad.org/">BRL-CAD</a>: A <a href="https://en.wikipedia.org/wiki/Constructive_solid_geometry">CSG</a>-based modeling tool, with extensive functionality.
<small>Has a moderate learning curve. I used this for a few models before moving onto other software.</small>
- <a href="http://www.openscad.org/">OpenSCAD</a>: A CSG modeling tool designed heavily for programmers and those who need to script objects.
<small>It's not always the fastest, but is useful enough that I continue to yse this for a good number of my 3D printing projects.</small>
- <a href="http://www.solidworks.com/">Solidworks</a>: Sketch-and-constraint based 3D modeling software.
<small>Expensive for both personal and professional use, but I used this software throughout university.</small>
- <a href="http://www.wings3d.com">Wings3D</a>: A subdivision modeling tool like Blender, but with a much easier to use UI.
<small>However, just like Blender, it is not focused for engineering designs. I use this tool sparingly.</small>
-< ... There are many other tools out there, notably <a href="https://www.freecad.org/">FreeCAD</a>. However I don't have enough experience with other tools to rate them.
{} At the end of the day, the software isn't what makes a good design. A good design comes from a good idea and a time commitment to implement it. Tooling helps express the design efficiently, but doesn't itself form the design.
{} One great example of this is the Printrbot's laser-cut parts -- there are many parts, but
they all work together to allow you to make more parts of your own designs.
[g
@hardware-projects/printing/printrbot/3dp_parts.jpg~The wooden parts making up the Printrbot JR 3D printer
]