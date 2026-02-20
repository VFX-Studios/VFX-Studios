## Laser Projector Product Report Template (FDA 21 CFR 1040.10/.11, Laser Notice 57)

### 1. Manufacturer / Submitter
- Company name:
- Address:
- Contact:
- Phone / Email:

### 2. Product Identification
- Model name/number:
- Version/firmware:
- Intended use: stage/entertainment, not for audience scanning (unless variance allows).
- Class: Class 3B or Class 4 (specify; audience zones restricted).

### 3. Emissions
- Wavelengths (nm): R 638, G 520, B 445
- Max output per color (W):
- Total combined max (W):
- Beam divergence (mrad), at aperture:
- Aperture size (mm):
- Scanning: galvos XX–YY kpps @ 8° (state used set, e.g., PT-30/PT-40)
- Modulation: analog, 0–5 V, >20 kHz

### 4. Power
- Mains input: 100–240 V AC, 50/60 Hz, IEC C14
- Internal rails: ±24 V (galvos), 24 V (diodes), 5 V logic
- Fuse rating:
- Interlocks: key switch, emission delay, remote interlock loop

### 5. Safety Features
- Key switch
- Keyed cover interlock (if service panel opens)
- Remote interlock connector (E-stop)
- Emission indicator (LED)
- Mechanical shutter / beam block
- Scan-fail safeguard (spec board)
- Emission delay on power-up (≥5 seconds)
- Aperture label, certification label, class label per 1040.10(g)
- Warning labels: wavelength/power, Class 3B/4, no audience scanning unless variance

### 6. Compliance References
- 21 CFR 1040.10, 1040.11
- IEC 60825-1 (edition/year)
- Laser Notice 57 (LIP guidance) if applicable

### 7. Drawings / Schematics
- Block diagram (power, control, interlocks)
- Optical path diagram (diodes → combiners → galvos → aperture)
- PCB interlock/shutter wiring
- Label placement diagram (top/side/aperture)

### 8. Software / Control
- Control inputs: ILDA (DB-25), DMX-512, Ethernet (Art-Net/sACN/ILDA-over-IP if present)
- Default state on power-up: shutter closed until key + interlock + signal valid
- Timecode sync (if present)

### 9. Variability / Components
- List critical components (diodes, galvos, shutter, interlock switch, PSU models)
- State acceptable substitutions (same or better specs)

### 10. Quality Tests
- Output power verification per wavelength
- Divergence measurement
- Scan-fail test (stuck mirror, over-speed, blanking fail)
- Interlock/shutter functional checks
- Emission delay verification

### 11. User Information
- User manual with safety, audience-exclusion zones, no audience scanning unless variance, E-stop instructions, maintenance.

### 12. Records / Serial
- Serial number format
- Production test record retention plan

---

## Variance (FDA Form 3147) Checklist
- Describe show types and environments (no audience scanning unless explicitly requested and justified).
- List projector models covered by the variance.
- Describe operator training and E-stop locations.
- Include sample site diagrams with exclusion zones.

---

## Annual Report (Required)
- Number of units manufactured/sold
- Any incidents or modifications
- Firmware updates impacting safety

---

## Label Text Examples
- Certification: “Complies with 21 CFR 1040.10 and 1040.11 except for deviations pursuant to Laser Notice No. 57, dated May 8, 2014.”
- Aperture label: “LASER APERTURE”
- Class label: “CLASS 4 LASER PRODUCT” (or Class 3B) with wavelength/power range.

---

## Bill of Materials (reference)
- RGB module (e.g., 6 W analog, 638/520/445 nm)
- Galvo set 30–40 kpps with drivers
- Scan-fail board
- Mechanical shutter
- Interlock switch + key switch + E-stop loop connector
- PSUs (±24 V, 24 V, 5 V) + fuse
- ILDA I/O, DMX I/O, optional Ethernet
- Enclosure with mounts + fan/filters

---

## Supplier Targets (Shenzhen)
- Galvos: PT-30/PT-40 class (e.g., PT series)
- RGB module 5–6 W analog (638/520/445)
- Scan-fail board (ILDA compatible)
- Housing machining: black anodized, aperture plate included

