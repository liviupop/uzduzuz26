# Seed-8
## The Silicon Seed reference computer, in simulation
*uzinaduzina, October 2026, version 0.2. Released under CC0.*

Seed-8 is the smallest machine we found that still deserves the name computer: it keeps a program in its memory, follows it one job at a time, and can decide what to do next from a result. This folder holds the whole machine, built **only from 609 two-input NAND gates**, a plain description of what it should do, and the proof that the two agree.

Version 0.2 is simpler than 0.1: **eight jobs instead of sixteen, 609 gates instead of 1,756**, and every part has a plain name.

---

## How to read a number

Imagine eight cups in a row. The first, on the right, holds one pebble; the second, two; then four, eight, sixteen, thirty-two, sixty-four, one hundred and twenty-eight. Each cup holds twice as much as the one before. A cup is either full or empty. To show a number, fill the cups that add up to it.

The machine's lamps are those cups. A lit lamp is a full cup:

| Lamp worth | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|---|
| 69 | dark | **lit** | dark | dark | dark | **lit** | dark | **lit** |
| written | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 1 |

64 + 4 + 1 = 69, written `01000101`. Each 0 or 1 is a **bit**; eight bits are a **byte**. Eight lamps can show any number from 0 to 255.

It works because each cup is one more than all the smaller cups together (1 + 2 + 4 = 7, the next is 8), so every number has exactly one way of being written. Everything in Seed-8 is written like this: numbers, jobs and box numbers alike. What a number means depends only on where it sits.

---

## The machine, in plain words

| Part | Name in the code | What it is |
|---|---|---|
| **The boxes** | memory | 256 numbered boxes, each holding one number from 0 to 255. The program lives here too. |
| **The hand** | A | The one number the machine is holding now. All reckoning happens here. |
| **The pawn** | PC | The box it stands on and reads next. After each reading it steps on to the next box, like a pawn on a board; on a jump it leaps straight to another box. |
| **The job** | JOB | What it has been told to do now: one of eight things. |
| **The box** | BOX | The number of the box the job is about. |
| **CARRY** lamp | C | The last addition went past 255, like "write 0, carry 1" at school. |
| **EMPTY** lamp | | The hand holds 0. It is not stored: it simply looks at the hand. |
| **STOP** lamp | H | The machine has stopped. |
| **The switches** | box 254 | Reading box 254 gives what the eight switches show. |
| **The lamps** | box 255 | Writing to box 255 lights the eight lamps. |

Every job takes **two boxes**: the first says which job (0 to 7), the second says which box. Every job takes **three turns of the crank**: read the job, read the box number, do it.

### The eight jobs

| Number | Job | What it does |
|---|---|---|
| 0 | STOP | Stop. |
| 1 | LOAD | Take the number from the box into the hand. |
| 2 | STORE | Put the hand's number into the box. |
| 3 | ADD | Add the box's number to the hand. CARRY lights if it goes past 255. |
| 4 | NAND | Compare the hand with the box, lamp by lamp: a lamp goes dark only where both are lit. This is the very gate the machine is made of; every other kind of logic can be built from it. |
| 5 | JUMP | Go on from that box. |
| 6 | JUMP-IF-EMPTY | If the hand is empty, go on from that box. |
| 7 | JUMP-IF-CARRY | If CARRY is lit, go on from that box. |

There is no subtraction job. To take d away, the machine makes "minus d": NAND d with itself (every lamp flips), add one, then add. In eight lamps, 256 is the same as 0, so adding 256 − d is the same as taking d away. A clock face works the same way.

---

## The four programs

| Program | What it does |
|---|---|
| `boot` | Counts 1, 2, 3, then finds every prime number up to 31 by itself and shows each one. |
| `mirror` | The lamps copy the switches, forever. |
| `adder` | The right four switches are one number (0 to 15), the left four another; the lamps show the sum. |
| `conformance` | The number of the year. |

### The number of the year
- Put the **year index** on the switches. Year 1 is 2027, Germination Zero. Years above 255 put their high part in box 253.
- The machine stirs the year through 24 rounds that use **all eight jobs**, then shows two numbers on the lamps: the high part, then the low part.
- Every round can be undone, so **each of the 65,536 possible inputs gives a different number**. This was checked for all of them.
- It takes 444 jobs, 1,332 crank turns: about two minutes on relays at ten turns a second, about twenty minutes by hand at one turn a second.

| Year index | Year | Lamps show | Number of the year |
|---|---|---|---|
| 1 | 2027 | 166, 226 | 0xA6E2 |
| 2 | 2028 | 204, 49 | 0xCC31 |
| 3 | 2029 | 231, 240 | 0xE7F0 |
| 4 | 2030 | 90, 137 | 0x5A89 |
| 5 | 2031 | 148, 166 | 0x94A6 |
| 6 | 2032 | 78, 74 | 0x4E4A |
| 7 | 2033 | 204, 92 | 0xCC5C |
| 8 | 2034 | 57, 59 | 0x393B |
| 9 | 2035 | 10, 205 | 0x0ACD |
| 10 | 2036 | 37, 83 | 0x2553 |

These numbers replace the ones from version 0.1. Any change to the machine's jobs or to the conformance program changes every number of the year, which is why both are now fixed.

---

## What it is made of

All 609 gates are two-input NAND gates. This is where they go:

| Gates | Part |
|---|---|
| 262 | The 31 remembered bits: hand 8, pawn 8, job 3, box 8, CARRY, STOP, step 2. Each bit is two latches of four gates. |
| 80 | The pawn: one step forward, or a jump |
| 68 | Addition: 8 columns, as at school (9 gates per column) |
| 62 | What goes in the hand: LOAD, ADD or NAND |
| 55 | Telling each part when to take its value, and starting up |
| 27 | Which of the 8 jobs |
| 26 | Which box to look at |
| 22 | The EMPTY lamp |
| 7 | Counting the three steps |

How it got smaller than version 0.1:
- **Eight jobs instead of sixteen.** Subtraction, OR, AND, XOR, rotation and "load a number directly" are gone; the programs build them from NAND and ADD.
- **The switches and lamps are just two more boxes**, so IN and OUT jobs and a separate lamp register are no longer needed.
- **The EMPTY lamp looks at the hand** instead of remembering a separate flag.
- **Each remembered bit is 8 gates instead of 20**: the latches are only opened when that part should change.
- The memory of 256 boxes is still a separate woven block, not gates, as in core rope and magnetic core memory.

The two seeds of the genome are literal in the code: the NAND gate computes, and two NAND gates feeding each other remember one bit.

---

## What has been checked
- **Gates and description agree.** Every program gives the same lamps on the gate machine and on the job-by-job description: the full start-up output and final memory, the mirror and the adder for several switch settings, and the number of the year for 50 years from 1 to 1000. The browser panel runs the same gates and gives the same numbers in the same number of turns.
- **Every year has its own number**, checked for all 65,536 inputs.
- **The ritual notices broken machines.** One gate at a time was broken (stuck lit or stuck dark), for 200 randomly chosen gates. The number of the year alone notices **94.5%** of these 400 faults; the full ceremony (start-up, mirror, adder, number of the year) notices **96%**. The smaller machine is easier to check than version 0.1 (86% and 88%), because almost every gate now does something the programs use. A few faults can never be seen from outside, such as a broken start-up line once the machine has already started.

## Files

| File | What it is |
|---|---|
| `isa.py` | The eight jobs, an assembler and the job-by-job description |
| `nand.py` | The machine as 609 NAND gates, and a ~100-line gate simulator of our own |
| `programs/*.s` | The four programs, with comments in plain words |
| `test_conformance.py` | Checks that gates and description agree |
| `fault_test.py` | Breaks one gate at a time and checks whether the ritual notices |
| `seed8-panel.html` | The front panel in a browser, in Romanian and English |
| `seed8_data.json` | The gates, the programs and the first numbers of the year, as data |

Run `python3 test_conformance.py`. It needs nothing but Python 3.

## Not done yet
- The same machine drawn in a common educational simulator (Logisim-evolution or Digital).
- The four-level explanations (hand, image, sign, idea) for the NAND gate, the latch and the adder.
- The relay and mechanical bodies.
- A founding program that lets new programs be entered from the switches.
