none
## About
After attempting to build CNC milling hardware, I decided to instead purchase a 3020-aluminum based CNC engraver.
This relatively-inexpensive device was sufficiently sturdy to repurpose as a low-end mill, for soft materials.
[g
@mobile-projects/cnc-mill-software/Mill.jpg~Pro CNC 3020 4-axis mill
]
## Precision
{
I found the hardware overall to be fairly sturdy, with stepper motors driving lead screws to move the x, y, and z axis.
Each stepper motor micro-step moves each axis 0.00254 mm (2.54 µm) -- which probably means this device was designed around Imperial standards,
because that nicely translates to 0.1 mils (1000 mils = 1 inch) per micro-step. By default, each stepper motor runs at 16x micro stepping,
with 1600 steps per axis revolution.
}
{
In practice, this device isn't nearly that accurate, but it's nice to see the limitation is not in the control hardware.
}

## Software
The software that came with the device required both Windows XP and a Parallel port.
Having neither, I decided to write my own using the microcontrollers I had on hand.

[g
@mobile-projects/cnc-mill-software/MillMisspelling.jpg~Parallel port was misspelled as parakkel port too.
]

With those microcontrollers, I wrote the following:

[g
<b>Version 1:</b> This initial software verified that I could drive the mill, at a pitifully slow speed.
@mobile-projects/cnc-mill-software/V1Results.jpg~Netduino (C#)
]

[g
<b>Version 2:</b> This software worked excellently -- until the Raspberry PI had software interrupts which caused stuttering.
@mobile-projects/cnc-mill-software/V2Results.jpg~Raspberry PI (C)
]

{
<b>Version 3:</b> I tried writing code for the <a href="https://www.parallax.com/propeller/">Parallax Propeller</a>, which was even <i>slower</i> than the Netduino -- too slow to be usable.
}

[g
{
 <b>Version 4:</b> I stopped trying to reinvent the wheel and bought an Arduino Nano and installed <a href="https://github.com/grbl/grbl/wiki">GRBL</a> on it.
 <br/> <br/>
 Unfortunately, the Arduino Nano is significantly more sensitive to voltage transients when running the mill spindle. I have to run the mill at a slow feedrate and spindle rate to avoid resetting the device due to electrical noise
 <br/> <br/>
 However, I was able to run at a reasonable rate, unlike the Netduinio, Parallax Propeller, or Raspberry PI.
}
@mobile-projects/cnc-mill-software/V4Results.jpg~Arduino Nano (GRBL)
]

## Epilogue
{
 Due to the difficulties in using the device (and difficulty in transporting it), I sold it a few years later, focusing my attention elsewhere.
}