none
## About
{} <b>{{ project.name }}</b> focused on how to capture ski performance data and render it from downhill ski resorts.
[g
@mobile-projects/ski-gps/GoogleEarthTraces.png~Ski runs overlaid on Google Earth from <a href="https://www.whistlerblackcomb.com/">Whistler Blackcomb</a> ski resort
]

## Process
-> Acquire GPS trace data from ski runs. Several different smartwatches, such as those used for <a href="https://github.com/GuMiner/garmin-simple-clarity">SimpleClarity</a>, can be used.
- Export the data in GPX format
- Import the data into <a href="http://www.gpstrackeditor.com/">GPS Track Editor</a>
- Delete incorrect traces, such as lift lines, and break apart each run into separate tracks.
@mobile-projects/ski-gps/GpsTrackEditorTraces.png~Ski runs in the GPS Track Editor application
- Export the data as GPX format
-< Import the data into <a href="https://earth.google.com/">Google Earth</a> and display as desired!