# Silicon Seed
## How to make a computer that still works in a thousand years
*Project concept, uzinaduzina, October 2026, version 0.3*

---

## Manifesto

Every chip in the world begins with an almost agricultural gesture. A small crystal, the seed, is lowered into molten silicon and drawn slowly upward, turning, until the matter follows it and grows in its likeness. Silicon Seed starts from this gesture, and from a few convictions I would rather call axioms than a programme.

The first: making computers is a craft, like pottery or woodworking. Like any craft, it can be lost in two or three generations in which hands no longer learn from other hands. What would remain is only the objects, mute, without the knowledge of how to make them.

The second: nothing lasts through the stubbornness of its material, only through the repetition of a gesture. The shrine at Ise is rebuilt every twenty years, and the ritual has endured for almost thirteen centuries. Our seed will therefore be resown every year, as a collective "Save as…" in which we choose, deliberately and with our names attached, what deserves to be carried forward from the year just ended.

The third: the seed must carry its own explanation, from electricity and arithmetic up to the last layer of software. It is written for a reader about whom we assume nothing: not their language, not their schooling, not even their goodwill. This is archaeology in reverse. We leave behind not a site but a manual for those who will dig it up.

The fourth: it does not open under a single hand. Like a *clacă*, the old Romanian village work-bee where a house was raised by the whole community, it works only when many are present. A memory that one person alone can command becomes, sooner or later, an instrument of power.

The fifth, perhaps the most unsettling: digital technology is changing its state of matter. It was solid once, in tapes and disks you could hold in your hand. It became liquid, detached from its carrier. Now it seems to evaporate into clouds, and into the weights of models that know things without showing where they keep what they know. The seed tries to condense, from time to time, a single drop of this vapour.

I do not claim the list is complete, and how well the idea will hold remains to be seen. But if, a thousand years from now (ten to the power of three), someone holds this seed in their palm without knowing what it is, I would like them to have at least the curiosity to plant it.

---

## 0. The question, asked honestly

Nobody today can promise that an electronic object will start up in a thousand years. We have no data. The oldest original digital computer still working, the Harwell Dekatron (WITCH), is about 75 years old and needed restoration to run again. Any project promising "a computer that lasts 1000 years" without saying how it checks its own promise is, at best, a time capsule with ambitions.

Silicon Seed starts here and shifts the question. **We are not building an object that lasts 1000 years. We are building a seed that can be germinated at any point in the next 1000 years**, and we germinate it, as a test, every year.

This turns one unverifiable promise (1000 years) into a series of **a thousand verifiable tests** (one per year). That is where the feasibility of the whole project lies.

---

## 1. The seed in three layers

A real seed has a genome (the information), a coat that keeps it dormant, and a moment of germination. Silicon Seed has the same three layers.

| Layer | What it is | How long it lasts | Its role |
|---|---|---|---|
| **The genome** | The complete instructions, engraved in fired ceramic and steel, progressively legible from the naked eye to the microscope | Centuries to millennia (fired cuneiform tablets are over 4,000 years old) | The real guarantee. If everything is lost except the genome, the computer can be rebuilt. |
| **The dormant specimen** | A working, unpowered computer, sealed in inert gas, built from components chosen for longevity | Unknown, and the project measures exactly this | The living proof and the long-term experiment. |
| **Germination** | Rebuilding the computer **every year**, by a new cohort of people, **from the genome alone** | As long as the ritual lasts | The test that validates the genome and passes the craft from hand to hand. |

**The basic principle:** the test of a seed is germination. If a new generation cannot rebuild the computer from the instructions alone, the instructions have failed. Better to find out in 2027 than in 3026.

---

## 2. The computer: small, slow, rebuildable

The central paradox: **a computer that lasts 1000 years does not need to be powerful, it needs to be remakeable.** We deliberately choose the simplest machine that still deserves the name computer.

### 2.1. Architecture
- An **8-bit** processor with eight instructions, 256 bytes of memory and a slow clock (from a few hertz to kilohertz). The reference design, **Seed-8**, is built from 609 NAND gates; see seed8-README.md.
- Documented **from the bottom up**: from logic gate to adder, register, control unit and program. Solid pedagogical precedents are the *Nand2Tetris* course and computers built on breadboards, gate by gate.
- Small enough that a group of 6–10 people can build it in a one-week workshop.

### 2.2. The descending ladder of technologies (the key idea)
The same architecture is described in the genome for **four levels of technology**. Whoever finds it rebuilds it at the level their civilisation can afford:

1. **Mechanical**: marbles, levers, gears (precedent: the Digi-Comp II toy computer). Works without electricity.
2. **Electromechanical relays**: need only electricity and coiled wire. Precedent: the relay computers of the 1940s.
3. **Discrete transistors**: need semiconductors, but not chip factories.
4. **Microcontroller**: for those who still have industry, as the fast option.

A civilisation that has lost its chip factories does not lose computing. It steps down one rung.

**One architecture, four bodies, the same answer.** The four levels are not four different machines but one instruction set built in four materials. The same program must give exactly the same result in each; only the speed changes. This is checked by the **conformance program**, a short calculation that every body runs and that must always produce the same number. It is the proof that the four bodies really are one machine, and the yearly ritual turns on it (section 5).

### 2.3. The dormant specimen: construction rules
What we **exclude**, because we know it degrades:
- **electrolytic capacitors** (they dry out);
- **batteries** of any kind;
- **flash / EEPROM memory**, where information is electrical charge that leaks away over years or decades;
- **lead-free solder**, which grows tin whiskers and causes short circuits.

What we **use**:
- **memory as physical structure, woven by hand**:
  - the **founding program** in core rope memory, as in the Apollo guidance computer: a wire threaded through a ring means 1, around it means 0. The program is literally woven and can be read by eye and with an ohmmeter;
  - the **working memory** in magnetic core memory: small ferrite rings strung on a grid of wires. Magnetic cores keep their content **without power**, so a sleeping machine wakes up remembering what it last held;
- **wire-wrap** or welded connections, gold-plated contacts;
- ceramic component packages where possible;
- **hermetic sealing in argon or nitrogen**, dark and dry, with a desiccant and an oxygen absorber inside the capsule;
- **sealed terminals and a window**: power and signal terminals pass through the seal, and a window sits over the lamps. A sleeping specimen can be **woken and tested without opening it**;
- **witness samples**: loose samples of every component type, sealed in the same capsule, which can be examined separately without touching the machine;
- **no internal energy source**: a crank generator and clearly marked terminals, with the voltage engraved on the casing;
- **minimal interface**: switches and small lamps (as on the first personal computers), plus a simple sound output.

### 2.4. Software
- **A single founding program**, woven into physical memory: a tiny interpreter that lets new programs be entered from the switches. The idea comes from the *bootstrappable builds* movement, which rebuilds an entire software toolchain from a seed of a few hundred bytes.
- **The "explain yourself" program**: the first thing the machine does when switched on is demonstrate its own arithmetic, so whoever starts it can check that it works correctly.

---

## 3. The genome: a manual for someone we know nothing about

### 3.1. Material
- **Fired ceramic** as the main layer: cheap, local, tested over millennia. Precedent: *Memory of Mankind* (ceramic tablets deposited in a salt mine in Hallstatt). An added advantage: **potters** make it, so the old craft carries the new one.
- **Laser-engraved stainless steel** as a secondary layer for fine detail. Precedent: the Rosetta Disk (Long Now Foundation).
- Cutting-edge solutions (the quartz glass of Project Silica, the film of the Arctic World Archive) are read as references, but we do not depend on them.

### 3.2. Progressive legibility
The genome is read in steps, without presuppositions:
1. **With the naked eye**: pictograms, counting, the idea of "there is something to read here, get a magnifying glass".
2. **With a magnifying glass**: arithmetic, binary, logic, basic electricity.
3. **With a microscope**: circuit diagrams for the four levels, the founding program bit by bit.

The emphasis is on **diagrams, not language**. Text appears in several languages (at least Romanian and English), as on the Rosetta Stone.

### 3.3. The lesson of wax cylinders
A phonograph cylinder from 120 years ago can still be read because the sound's trace is *visible* in the material. The genome's critical information (the founding program, the diagrams) is stored the same way: **as visible form, not as an encoding** that needs a special reader.

### 3.4. Explained as for a five-year-old, with a path toward the abstract

**The rule:** every concept in the genome is first explained as for a five-year-old. Moving to a more abstract level happens only after the reader **has demonstrated mastery** of the level before, by doing something rather than answering a test.

**Why five.** The five-year-old and the reader of the year 3026 have something essential in common: neither has our context. An explanation that works for the first stands a good chance of working for the second. This gives a writing constraint: at the first level we use **only images that do not go out of date**: hands, stones, water, light, seeds, friends, day and night. Nothing that has the age of a technology (phone, car, screen).

#### The four levels
Each concept is written on four levels, in the order in which people learn: through the hand, the image, the sign, and then the idea (in educational psychology, Jerome Bruner's triad: enactive, iconic, symbolic).

| Level | Register | What it looks like |
|---|---|---|
| **1. The hand** | Story and play, for a five-year-old | Short sentences, one idea, real objects to touch |
| **2. The image** | Drawing, comic strip | The same idea without words, in sequences of pictures |
| **3. The sign** | Numbers, tables, 0 and 1 | The notation, explicitly tied to the earlier pictures |
| **4. The idea** | Abstract, general, formal | The law behind the thing and what can be built from it |

#### Proof of mastery: doing, not answering
Moving up a level is not an exam but a successful gesture. As in Montessori pedagogy, **the material contains its own control of error**: readers see for themselves whether they succeeded, without a teacher telling them.

Example, **the NAND gate** on all four levels:

| Level | The explanation | Proof of mastery |
|---|---|---|
| **1. The hand** | "The light stays on. It goes out only when you and your friend press at the same time." Two children, two buttons, one lamp. | The child says beforehand what the lamp will do, four times in a row, and is right every time. |
| **2. The image** | Four drawings: no hand, left hand, right hand, both hands, each with the lamp on or off. | The reader completes the missing drawing. |
| **3. The sign** | The table of 0 and 1: only for 1 and 1 is the result 0. | Builds a "not" by joining the two inputs of one gate. The lamp confirms it. |
| **4. The idea** | From this single gate any other gate can be built, hence any computation. | Builds "and" and "or" from NAND gates only. |

#### How the levels are locked, physically
The genome can be organised as **boxes inside boxes**. Each box opens with what you learned in the one before. The lock of the next box is the lesson itself: for example, a row of mechanical switches that opens only when you set, in binary, the number of stones drawn on the lid. The lock is itself a small logic circuit. To get past it, you must have understood exactly what the box taught you.

The machine works the same way: the start-up steps in section 6.2 are levels, and the machine opens the next level only after the person has correctly done what the current one asked.

#### Two safety rules
- **You can always step down.** Every abstract level points back to its five-year-old version. Whoever gets lost returns to the hand and the image, without shame.
- **The lock is pedagogical, not a wall.** A complete, unlocked copy of the genome always sits in the open deposit (libraries, CC0 licence). The locked boxes are the recommended path, not the only one. Nobody is permanently barred from knowledge for failing to open a lock.

---

## 4. Many hands: who holds the seed

- **Several copies of the genome, in different places.** This is the archival principle "lots of copies keep stuff safe". Every location holds the complete genome.
- **The dormant specimen does not start under a single hand.** The memory holding the founding program is split across several boards held by different keepers (for example, 3 of 5 needed). The computer works only when people gather, as at a *clacă*.
- **Storage sites** with low natural risk and a stable climate. One lead to explore is **Romania's salt mines** (Turda, Praid, Slănic), with constant temperature and humidity, plus archives, museums and monasteries. The Vrancea seismic zone is avoided.

---

## 5. The ritual: yearly resowing, on two clocks

Resowing happens **every year**, as a calendar custom, so that it is remembered as a feast, not a reporting deadline.

**The date is an equinox**, the day when day and night are equal. It needs no calendar, no institution and no particular language, because it can be found from the sky alone, with a stick and a shadow. It falls on the same day in both hemispheres. Of all possible dates, it is the one most likely to be recoverable in a thousand years, and the genome teaches how to find it.

So that nothing given by a decadal rhythm is lost, the project runs on **two clocks**.

### 5.1. The yearly clock: germination
Every year:
1. **A new cohort** of mixed ages (at least one child and one elder), with no specialist training required, receives **only the genome**.
2. It rebuilds the computer and notes **every place where the instructions were unclear**.
3. **The conformance program is run.** The result is **the number of the year**. It is engraved on a small tablet and added to a growing row. When there are several sites, they exchange their numbers. If all match, the seed germinated everywhere. A thousand years of the project means a thousand matching numbers in a row.
4. The genome is corrected. Its version number goes up by one each year, and every correction is publicly documented.
5. The cohort adds a **"ring of the year"**: a short curatorial note on what changed in technology over the past twelve months and what is worth remembering.
6. **A new specimen is sealed** and deposited, with a small public ceremony. Every sleeping specimen already in storage is **woken through its sealed terminals** and its lamps are read through the window, without breaking the seal.

### 5.2. The long clock: rings and openings
- **The rings condense.** Every ten years, the ten yearly rings are read together and condensed into a **layer of the decade**, which enters the ceramic genome. As in a tree trunk, thin rings show the years and thick ones show the eras. A single year is too short to tell what matters from noise; a decade is not.
- **The dormant specimens are tested every year but opened rarely.** Thanks to the sealed terminals, every specimen can be tested each year without breaking its seal. Opening is reserved for destructive inspection under the microscope, and a specimen can be opened only once, because opening it ends its experiment. Since we seal one a year, we open them on a **ladder of doubling ages**: at each ceremony, the oldest specimen reaching 1, 2, 4, 8, 16, 32, … years of sleep is tested. This gives us, early on, an **ageing curve** for the components, with points growing sparser and longer. No other project in the world has this data.

### 5.3. Why yearly
- **The correction loop is ten times faster.** A faulty genome is fixed in two or three years, not three decades.
- **The craft is passed on continuously.** Last year's gardeners accompany this year's, so the chain of hands never breaks for more than a year.
- **Yearly customs survive better than rare ones.** A ritual you live once a decade is forgotten between editions. A yearly one enters the calendar.
- **The funding has the right shape.** A yearly cycle fits recurring cultural project lines and the annual budgets of local partners.

### 5.4. What the yearly rhythm costs
- **Fatigue and recurring cost.** A yearly resowing with workshops, materials and sealing means roughly €10–20k a year. The project needs a recurring source, not just pilot grants.
- **More specimens to store.** One specimen a year means ten per decade, so the specimen must be small. A shoebox is the ceiling.
- **The risk of routine.** What repeats every year can become a formality. The antidote is a genuinely new cohort and a genuinely curatorial ring every year.

The ritual is at once **technical validation, transmission of craft and cultural event**. The project does not sit in a vault; it happens.

---

## 6. Self-explanation, interface, symbols, roles and access

### 6.1. The paradox of self-explanation
A machine cannot explain itself before it is switched on, and to switch it on you must understand something about it. The way out of the circle is for the explanation to begin **outside the machine and before electricity**, in the object itself and in the genome. The machine takes over the explanation only once it receives power.

The 2009 concept had the machine begin with a language test, then a knowledge test. That is a barrier which assumes we know who will come. We replace it with **depth in layers**: every reader goes as far as they can, without being stopped at the door. The message is not tailored to an age or a schooling; it works on several levels at once.

### 6.2. What starts first: the stepped sequence

| Step | What happens | What the person learns |
|---|---|---|
| **0. Before power** | The object speaks through its shape. The crank *looks* like something that turns. On the casing there is a single wordless picture-instruction: a hand turns, a lamp lights up. The machine tolerates a wide voltage range and has a lamp that says "enough". | That the object needs energy and has received it. No need to know what a volt is. |
| **1. First sign of life** | The lamps count 1, 2, 3, then the primes 2, 3, 5, 7. | That there is a mind here, not an accident. |
| **2. The mirror** | The machine asks for a switch to be pressed and answers by lighting the matching lamp. | That every switch is a bit and the machine sees it. Learning by imitation, like a child. |
| **3. Arithmetic, proven** | The machine adds two numbers entered by the person and shows the result. | Binary, without having read about it, and trust that the machine is correct. |
| **4. The invitation** | The machine lets itself be programmed. | That they can make new things with it. |

### 6.3. Interface: everything visible, nothing hidden
- **One bit, one lamp, one switch.** No screen, no hidden state. The machine is literally transparent, like the exploded iPod cast in resin from the 2009 inspiration folder: you see every part.
- **The front panel is drawn identically in the genome.** What you see on the tablet you find on the machine. Genome and machine are read through each other.
- **Sound is redundant, not essential.** A simple speaker doubles the lamps in rhythm, for those who cannot see or when light does not help.

### 6.4. Symbolic communication: lessons from nuclear waste
The only people who have thought systematically about communicating across 10,000 years are those designing markers for nuclear waste repositories (Human Interference Task Force, USA, 1981). Three lessons:

- **Languages die, pictures last longer, and numbers last longest.** Hence the order of the genome: counted dots, the "equals" sign, addition, binary. Hans Freudenthal built an entire language, Lincos, in 1960, starting exactly this way, from zero. The cover of the Voyager record defines its unit of time through physics (the hydrogen transition), not convention.
- **Every message is given in three registers:** image, number and text in several languages. If one perishes, the other two rebuild it.
- **The most durable message is myth, not inscription.** Thomas Sebeok proposed an "atomic priesthood" to pass on the warning through ritual and legend. Françoise Bastide and Paolo Fabbri proposed "ray cats" that would change colour near radiation, with songs and stories about them. The lesson for us: **institutions fall, customs remain.**

The difference from the nuclear case is essential: they wanted to *repel*, we want to *invite*. Our symbols say "open, learn, rebuild", not "danger".

### 6.5. Roles

| Role | What it does | Why |
|---|---|---|
| **Keepers** | Each holds one of the memory boards (for example, 3 of 5 needed) | Many hands: no one owns the seed alone |
| **Gardeners** | The cohort that rebuilds the machine every year | The germination test and the transmission of craft |
| **Interpreters** | Renew the language layer every year: translate into living languages and note which words have worn out | Languages move faster than ceramic |
| **Curator of the year** | Proposes the "ring of the year" and, every ten years, its condensation into the layer of the decade | Deliberate choice, not accumulation |
| **Witnesses** | The public at the deposit ceremony | The social memory of the place |

A rule from the start: **every cohort includes a child and an elder.** Each resowing thus spans about 70 years of living memory, and today's child becomes the elder of a cohort seventy years from now.

The risk to avoid is that the keepers become a caste, a "priesthood" controlling access. The antidote is rotating roles and a public charter.

### 6.6. How we keep access over the long term
Access is lost in four different ways, so it needs four defences:

1. **Physical access: knowing where it is.** Several deposit sites, coordinates recorded in public registers, and every copy of the genome points to where the others are. A seed nobody can find is as lost as a destroyed one.
2. **Legal access: belonging to no one.** Open licences (CC0 for the genome, an open hardware licence for the schematics), plus legal deposit of the genome as a publication with an ISBN in national libraries. Libraries are the longest-lived institutions we have.
3. **Intellectual access: being able to understand it.** In OAIS terms, the genome is *Representation Information*, and the "designated community" is here "anyone". The yearly ritual is exactly the periodic check OAIS requires: does today's community still understand the genome?
4. **Social access: someone has to care.** The most fragile and most interesting part. Beyond the charter, the seed needs **a story**: a local legend, a custom, perhaps a children's counting rhyme that keeps in verse where it is hidden and how it starts. If in 300 years every institution has fallen but the children of a village still recite the rhyme, the seed can be found.

Here the archivist and the folklorist work together. This is where the project stops being only an engineering problem.

---

## 7. First steps: where we begin

The whole project rests on one starting question: **what is the smallest thing that still deserves the name computer?** The working answer is a machine that holds a program in memory, runs it step by step, and can choose which step comes next depending on a result. Without this conditional branching we have a pocket calculator. With it we have, in principle, any possible computation, given enough memory and time.

The first steps happen on five fronts at once. Each has a first result that is concrete, small and verifiable.

### 7.1. Conceptual: the dependency map
Before any drawing or circuit, we write the **knowledge graph**: a list of every idea needed to get from "count on your fingers" to "write a program", with arrows from each idea to the ideas it rests on. The golden rule: **every concept refers only to concepts that come before it.** No loops, no "see below".

The graph is the skeleton of the genome. The order of the tablets comes from it, and gaps show up immediately: any idea with nothing to rest on is a place where the future reader will stop.

In parallel we define the **zero reader**: someone about whom we assume only that they see, count and have hands. Every page of the genome is checked against them.

*First result:* graph v0 (around 40–60 nodes) and the **one-page genome**, the whole project explained on a single tablet that maps all the others.

### 7.2. Mathematical: a ladder of twelve steps
The genome's mathematics climbs a strict ladder. Each step is written on the four levels of section 3.4: first as for a five-year-old, with stones, hands and light, then as image, as sign, and only at the end as abstract idea.

1. **Counting** with notches (unary)
2. **Equality**: two groups with the same number of dots
3. **Addition**: joining groups
4. **Place value**: the same digit means something else in another position
5. **Binary**: the simplest positional notation, with only two signs
6. **Logic**: yes/no, and/or/not (George Boole, 1854)
7. **The bridge**: switch circuits perform exactly Boole's logic (Claude Shannon, 1937). Here mathematics becomes technology.
8. **One gate makes them all**: every other gate can be built from NAND, "not-and" (Henry Sheffer, 1913)
9. **The adder**: binary addition built from gates
10. **Memory**: a circuit that feeds on its own output and remembers one bit (the feedback loop)
11. **Clock and counter**: time divided into steps
12. **The instruction**: a number that means an action. A program stored in the same memory as the data is the idea that makes a machine a computer.

The observation that organises the whole genome: the entire tower rests on **two seeds**, the NAND gate and the feedback loop. The first computes, the second remembers. If the future reader understands these two things, the rest is construction.

*First result:* the 12 steps on paper, each on four levels, each level with its proof of mastery. We start with steps 1, 5 and 8 (counting, binary, NAND) as the model for the rest.

### 7.3. Technical: one gate in four materials
The project's first technical object is not the computer but **a single NAND gate, built in the four technologies of the descending ladder**:
- **mechanical**: levers or falling marbles;
- **relay**: two relays and a lamp;
- **discrete transistors**: a few components on a small board;
- **integrated circuit**: a common chip with four NAND gates.

If we can make a NAND gate in every material, we can make anything in every material. This is the proof of concept for the whole ladder.

In parallel:
- **Architecture on paper**: 8-bit word, about 16 instructions, a few hundred bytes of memory. The instruction set is chosen to be *explainable*, not efficient.
- **The conformance program, first draft**: a short calculation that the NAND gates in all four materials can already partly check, and that the full machine will later run at every level.
- **Simulation**: the machine is first tested in a free logic-circuit simulator, before any soldering.
- **Honesty about scale**: at the relay level the full machine is expensive and large. The relay version can be a reduced variant (for example 4-bit) of the same architecture, with the genome showing how to widen it.

*First result:* the NAND gate in four materials on one table, plus the simulated architecture.

### 7.4. Craft: hands before schematics
The project starts from the idea that making computers is a craft. So the first steps are also hand workshops, not just desk work:

- **Weaving memory.** The Apollo program memory was woven by women from the textile industry, who threaded wires through or around magnetic rings: through the ring meant 1, around it meant 0. The natural first craft partner is therefore **a weaver**. We test whether a small program can be woven, checked and read with a simple instrument.
- **The tablets.** With a potter we make a first batch of about ten test tablets: size, clay body, firing, glazed or not, then the inscription method (incision, stamping, ceramic decal). We test legibility with the naked eye and a magnifying glass.
- **Gestures as data.** Every construction gesture (winding a relay, soldering, wire-wrapping, weaving) is filmed and described as in intangible heritage documentation. The genome contains gestures, not just schematics.

*First result:* a program of a few bytes woven by hand, and ten ceramic tablets fired and tested.

### 7.5. Philosophical: what "works" means and what we refuse to keep
Four questions must be settled at the start, because they shape everything else:

1. **Identity.** If we rebuild the computer every year from new parts, is it still the same computer? This is the paradox of the Ship of Theseus. The project's answer, taken from the shrine at Ise, is **its central thesis**: identity lies in form and gesture, not in matter. The seed is the same because it is remade the same way, not because it is made of the same silicon.
2. **The addressee.** We write for anyone. What responsibility do we have toward a reader we do not know? At least this: to assume them neither less nor more clever than they are.
3. **Refusal.** Jonas Salk told Danny Hillis, about the 10,000-year clock, to think carefully about what exactly he wanted to preserve. Alongside the list of what enters the genome, we write a **list of what we refuse to keep**: surveillance technologies, weapons, any knowledge that would turn the seed into an instrument of power in the hands of one.
4. **State of matter.** The digital passes from solid to liquid to gas. The seed is a gesture of condensation, and in the long run the project must also say something about knowledge that evaporates into models.

*First result:* the manifesto (already written) completed with the **list of refusals** and a first draft of the charter.

### 7.6. The first 90 days

| Weeks | Step | Front | Depends on |
|---|---|---|---|
| 1–3 | Dependency graph v0 and the one-page genome | conceptual | — |
| 2–6 | The 12-step mathematical ladder, drawn | mathematical | graph v0 |
| 3–8 | The NAND gate in four materials | technical | — |
| 3–8 | The 8-bit architecture on paper and in simulation | technical | the mathematical ladder |
| 4–10 | First batch of tablets with a potter | craft | the one-page genome |
| 4–10 | First woven memory test, with a weaver | craft | the architecture (memory format) |
| 8–12 | **The first "stranger test"**: a child of five or six, a teenager and an elder, with no technical training, work through the NAND gate on all four levels using only the test tablets. We note where each one stopped and why. | all | tablets + gate |
| 10–12 | List of refusals and charter v0 | philosophical | — |

After 90 days the project has what it needs for the larger applications: technical proof (the gate in four materials), craft proof (tablets and woven memory), proof of method (the first stranger test) and a written philosophical position.

---

## 8. The pilot: first germination (24 months)

| Phase | Duration | What we do | Result |
|---|---|---|---|
| **0. Foundation** | months 1–3 | Team, partners, study of precedents (Long Now, Memory of Mankind, Arctic World Archive, Collapse OS, bootstrappable builds) | Reference dossier, project charter |
| **1. The machine** | months 4–9 | Design of the 8-bit architecture. Prototype on breadboard, then relays. Description of the four levels | Working prototype, schematics |
| **2. The stranger test** | months 10–15 | Workshops in which people with no technical training (children, elders, speakers of other languages) try to build modules from the draft genome alone: a gate, an adder, a register | Genome v0.1 corrected from real failures |
| **3. The seed** | months 16–21 | Building the dormant specimen (woven memory, no electrolytics), sealing, making the genome in ceramic with potters and in steel | First sealed specimen, first physical genome |
| **4. Deposit** | months 22–24 | Deposit in at least two places, public ceremony (the first yearly resowing), open-source publication of all files, charter of the yearly ritual | Seed v1, open documentation, fixed date of the yearly resowing |

### Concrete pilot results
- an 8-bit computer, rebuildable, documented on four technological levels;
- a sealed dormant specimen;
- genome v1 in ceramic and steel, in at least two copies;
- a set of replicable workshops ("build a computer from nothing");
- an open-source repository with all the material;
- a governance charter for future resowings.

### Indicative budget (to be checked and detailed)
| Line | Order of magnitude |
|---|---|
| Team (coordination, electronics engineer, information designer, curator) | €40–60k |
| "Stranger test" workshops (4–6 workshops) | €10–15k |
| Components, prototypes, tools | €5–10k |
| Physical genome: ceramic (potters) + laser-engraved steel | €8–15k |
| Hermetic sealing, conservation consultancy | €5–10k |
| Deposit, ceremony, photo and video documentation | €5–8k |
| **Pilot total** | **≈ €75–120k** |

---

## 9. Risks, stated plainly

- **We cannot prove 1000 years.** We do not promise the object; we promise the process and publish ageing data as we obtain it.
- **The weakest link is people, not materials.** Danny Hillis puts it clearly: objects vanish either because they become unimportant and are scrapped for parts, or because they become symbols and are destroyed. We mitigate this with several keepers, a calendar ritual, a public charter and, in the long run, a small endowment.
- **Sealing and conservation expertise** is not ours. We need a partner: a conservation laboratory or a materials physics institute.
- **The risk of kitsch** ("a time capsule with blinking lights"). Mitigated by curatorial rigour, serious documentation and the stranger test as method, not decoration.
- **The safety of the dormant specimen**: if it looks precious, it becomes a target. The working option is for it to look modest, with the value residing in the genome.

---

## 10. Open questions

1. Where do we deposit the first specimen? A salt mine is symbolically strong but requires institutional negotiation.
2. Which languages enter the genome beyond Romanian and English?
3. What goes into the first "ring of the year"? Who chooses, and by what criteria?
4. Which equinox: March (spring sowing in the northern hemisphere) or September (harvest)?
5. Who are the keepers of the five memory boards?
6. What does a silicon seed look like? We need a wordless emblem that works on wood, stone and paper.

---

*The horizon of the project, without budget limits (seven sites, the machine that writes its own tablets in clay, the thousand-year arc), is described in the companion document "Silicon Seed: the ideal version".*
