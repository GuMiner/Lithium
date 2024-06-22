none
## Conceptual Design
{} This project was initially to create a low-cost, custom electronics board capable of driving six stepper motors. Because my mill design was unusual in requiring six stepper motors, currently-available boards such as the <a href="https://ultimachine.com/collections/hardware">RAMPS board</a> and <a href="http://reprap.org/wiki/Comparison_of_Electronics">other electronics</a> were not be capable of driving my mill.
{} To construct the electronics board, I prototyped a PCB with <a href="http://kicad-pcb.org/">KiCad</a> and send the design out for manufacturing to <a href="https://oshpark.com/">OSH Park</a>. Because OSH Park charges for the total rectangular surface area used, I attempted to collapse a 12-pin keypad, a 128x64 LCD display, six stepper motor drives and an <a href="https://www.microchip.com/en-us/product/ATMEGA328P">ATmega328P-PU microcontroller</a> all on the single board. To support all of these devices, I also used a few <a href="https://www.mouser.com/datasheet/2/302/74HC_HCT595-225040.pdf">serial-to-parallel</a> chips to increase the total number of I/O pins available.
<b>Pins required:</b>
-> Six <a href="https://www.pololu.com/product/1182">stepper motor drivers</a>: 1 (reset) + 6*2 (direction + step) = 13 (output)
- Drill Bit PWM: 1 (speed selection) = 1 (output)
- Drill Bit PWM speed indicator: 1 (actual drill bit speed) =  1 (input)
- 12-button keypad: 1 (current button press value) =  1 (analog input)
- General-purpose potentiometer: 1 (current dial value) =  1 (analog input)
- Computer input line: 1 (data input) = 1 (input)
- 128x64 display: 8 (data lines) + 2 (chip selection) + 3 (reset / clock / command (or) data) = 13 (output) 
- Status LEDs: 2
-< <b>Total:</b> 33
Finally, to complete the design I ensured that:
-> Each stepper motor driver has two headers -- one to swap out the motor, the other to swap out the driver. 
- Each stepper motor driver has it's own transient protection capacitor on the 12 V line.
- The ATmega has additional passive components to reduce the noise on the analog reference 5 V line.
-< The keypad uses a resistor network to uniquely identify each key (which creates a short on two of its pins), to significantly reduce the pin count to 1.

[g
@hardware-projects/mill-board-electronics/Schematicv3.png~The final KiCad schematic, after adding in all the design elements I desired in this board.
]

### PCB Design
[g
@hardware-projects/mill-board-electronics/BoardV1.png~<b>Version 1:</b> Functionally correct, but not space efficient.<br/><small>Used for KiCad experimentation only.</small>
]
[g
@hardware-projects/mill-board-electronics/BoardV2.png~<b>Version 2:</b> More space efficent, but with room for improvement.<br /><small>This layout also puts the keypad and display at unusual right angles to each other.</small>
]
@hardware-projects/mill-board-electronics/BoardV3NoGround.png~<b>Version 3:</b> Very efficient, but still messy (lots of long traces, several vias, etc).<br /> By using smaller traces, I was able to route wires through the space between pins.
@hardware-projects/mill-board-electronics/FinalBoard.png~<b>Version 4:</b> The final result.<br /> I added a ground pane and selected this design for shipping. This only cost $50 for three of these 2-layer ENIG boards.

### Resulting board
After about a month of lead time, I received the order I had submitted.
[g
@hardware-projects/mill-board-electronics/BoardFront.jpg~The front of the manufactured prototype PCB. 
]
[g
@hardware-projects/mill-board-electronics/BoardRear.jpg~The rear of the manufactured prototype PCB.
]

## Testing
{} I went through two main phases testing these boards -- mechanical and electrical -- to verify the operation of the device.

### Mechanical Design Errors
-> <b>Major:</b> The stepper-motor sockets were all 1-pin spaced too far apart (oops). Pins fit when bent.
- <i>Minor:</i> The capacitor pads were too small, so all the capacitors were placed sideways.
- <i>Minor:</i> The LCD covers the backlight pads -- which was OK, because I wasn't planning on using the backlight.
-< <i>Minor:</i> I used the wrong sized-pads for the keypad, so it only accepts smaller pin sizes -- such as the pin sizes the keypad happened to have.

### Electrical Design Errors
{} Although the mill was functional, the ATmega328 microcontroller had a hard time running the whole operation at a reasonable rate.

## End result
[g
@hardware-projects/mill-board-electronics/FinalBoardInPlace.jpg~The prototype PCB board in my electrical testing rig
]