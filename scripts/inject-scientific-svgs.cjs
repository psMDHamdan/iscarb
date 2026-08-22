/**
 * inject-scientific-svgs.cjs
 * ============================
 * Creates real, educational SVG diagrams for each slide in the rDNA lecture.
 * These replace the generic Unsplash stock photos with actual scientific content.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── SVG Templates for each slide ────────────────────────────────────────

const SVG_SLIDES = {
  1: `<svg viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="340" fill="url(#bg1)" rx="16"/>
  <text x="300" y="35" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">RECOMBINANT DNA WORKFLOW</text>
  <!-- Step boxes -->
  <rect x="30" y="60" width="120" height="70" rx="10" fill="#0c4a6e" stroke="#22d3ee" stroke-width="1.5"/>
  <text x="90" y="85" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700">1. SELECT</text>
  <text x="90" y="102" text-anchor="middle" fill="#94a3b8" font-size="9">Gene of interest</text>
  <text x="90" y="116" text-anchor="middle" fill="#94a3b8" font-size="9">from source DNA</text>
  <rect x="175" y="60" width="120" height="70" rx="10" fill="#0c4a6e" stroke="#22d3ee" stroke-width="1.5"/>
  <text x="235" y="85" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700">2. CUT</text>
  <text x="235" y="102" text-anchor="middle" fill="#94a3b8" font-size="9">Restriction enzymes</text>
  <text x="235" y="116" text-anchor="middle" fill="#94a3b8" font-size="9">cut at specific sites</text>
  <rect x="320" y="60" width="120" height="70" rx="10" fill="#0c4a6e" stroke="#22d3ee" stroke-width="1.5"/>
  <text x="380" y="85" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700">3. LIGATE</text>
  <text x="380" y="102" text-anchor="middle" fill="#94a3b8" font-size="9">DNA ligase joins</text>
  <text x="380" y="116" text-anchor="middle" fill="#94a3b8" font-size="9">insert into vector</text>
  <rect x="465" y="60" width="120" height="70" rx="10" fill="#0c4a6e" stroke="#22d3ee" stroke-width="1.5"/>
  <text x="525" y="85" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700">4. TRANSFORM</text>
  <text x="525" y="102" text-anchor="middle" fill="#94a3b8" font-size="9">Introduce into</text>
  <text x="525" y="116" text-anchor="middle" fill="#94a3b8" font-size="9">host bacteria</text>
  <!-- Arrows -->
  <line x1="150" y1="95" x2="175" y2="95" stroke="#22d3ee" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="295" y1="95" x2="320" y2="95" stroke="#22d3ee" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="440" y1="95" x2="465" y2="95" stroke="#22d3ee" stroke-width="2" marker-end="url(#arrow)"/>
  <!-- DNA Helix decoration -->
  <g transform="translate(50, 160)">
    <text x="0" y="0" fill="#64748b" font-size="10" font-weight="600">EcoRI Recognition Site:</text>
    <text x="0" y="18" fill="#38bdf8" font-family="monospace" font-size="13" font-weight="700">5'- G | A A T T C -3'</text>
    <text x="0" y="34" fill="#38bdf8" font-family="monospace" font-size="13" font-weight="700">3'- C T T A A | G -5'</text>
    <text x="0" y="54" fill="#94a3b8" font-size="9">↓ produces sticky ends (overhangs)</text>
  </g>
  <!-- Plasmid circle -->
  <g transform="translate(380, 200)">
    <circle cx="100" cy="60" r="55" fill="none" stroke="#22d3ee" stroke-width="2"/>
    <circle cx="100" cy="60" r="50" fill="none" stroke="#0e7490" stroke-width="1" stroke-dasharray="4,3"/>
    <text x="100" y="30" text-anchor="middle" fill="#67e8f9" font-size="9" font-weight="700">ORI</text>
    <text x="100" y="90" text-anchor="middle" fill="#fbbf24" font-size="9" font-weight="700">MCS</text>
    <text x="55" y="65" text-anchor="middle" fill="#f87171" font-size="8">bla</text>
    <text x="145" y="65" text-anchor="middle" fill="#a78bfa" font-size="8">lacZ</text>
    <text x="100" y="130" text-anchor="middle" fill="#64748b" font-size="9">Plasmid Vector (e.g., pUC19)</text>
  </g>
  <defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#22d3ee"/></marker></defs>
</svg>`,

  2: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
  <rect width="600" height="300" fill="url(#bg2)" rx="16"/>
  <text x="300" y="30" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">ECORI RESTRICTION ENZYME</text>
  <!-- Double-stranded DNA before cut -->
  <text x="300" y="58" text-anchor="middle" fill="#94a3b8" font-size="10">Before cutting:</text>
  <g transform="translate(100, 70)">
    <text x="0" y="0" fill="#67e8f9" font-family="monospace" font-size="15" font-weight="700">5'- G     A A T T C -3'</text>
    <text x="0" y="22" fill="#fbbf24" font-family="monospace" font-size="15" font-weight="700">    |  ↑  |</text>
    <text x="0" y="44" fill="#67e8f9" font-family="monospace" font-size="15" font-weight="700">3'- C T T A A     G -5'</text>
    <text x="0" y="72" fill="#94a3b8" font-size="10">Recognition site: GAATTC (palindrome)</text>
    <text x="0" y="88" fill="#94a3b8" font-size="10">Cut position: between G and A on both strands</text>
  </g>
  <!-- Arrow -->
  <text x="300" y="200" text-anchor="middle" fill="#22d3ee" font-size="20">↓ EcoRI cuts ↓</text>
  <!-- After cut -->
  <g transform="translate(60, 220)">
    <text x="0" y="0" fill="#34d399" font-family="monospace" font-size="14" font-weight="700">5'-G              3'</text>
    <text x="0" y="20" fill="#34d399" font-family="monospace" font-size="14" font-weight="700">3'-CTTAA          5'</text>
    <text x="0" y="40" fill="#94a3b8" font-size="10">Fragment 1 (sticky end)</text>
  </g>
  <g transform="translate(320, 220)">
    <text x="0" y="0" fill="#f87171" font-family="monospace" font-size="14" font-weight="700">5'    AATTC-3'</text>
    <text x="0" y="20" fill="#f87171" font-family="monospace" font-size="14" font-weight="700">3'          G-5'</text>
    <text x="0" y="40" fill="#94a3b8" font-size="10">Fragment 2 (sticky end)</text>
  </g>
  <text x="300" y="290" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="600">↑ These 4-nt overhangs are complementary → they snap together via base pairing</text>
</svg>`,

  4: `<svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
  <rect width="600" height="280" fill="url(#bg4)" rx="16"/>
  <text x="300" y="30" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">CLONING WORKFLOW: 4 ESSENTIAL STEPS</text>
  <!-- Step 1 -->
  <g transform="translate(25, 50)">
    <rect width="125" height="100" rx="8" fill="#164e63" stroke="#22d3ee" stroke-width="1"/>
    <text x="62" y="22" text-anchor="middle" fill="#22d3ee" font-size="20">🧬</text>
    <text x="62" y="42" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700">1. SELECT</text>
    <text x="62" y="58" text-anchor="middle" fill="#cbd5e1" font-size="9">Isolate gene of</text>
    <text x="62" y="70" text-anchor="middle" fill="#cbd5e1" font-size="9">interest from</text>
    <text x="62" y="82" text-anchor="middle" fill="#cbd5e1" font-size="9">source organism</text>
  </g>
  <!-- Arrow 1-2 -->
  <line x1="150" y1="100" x2="165" y2="100" stroke="#22d3ee" stroke-width="2"/>
  <polygon points="165,96 173,100 165,104" fill="#22d3ee"/>
  <!-- Step 2 -->
  <g transform="translate(175, 50)">
    <rect width="125" height="100" rx="8" fill="#164e63" stroke="#22d3ee" stroke-width="1"/>
    <text x="62" y="22" text-anchor="middle" fill="#22d3ee" font-size="20">✂️</text>
    <text x="62" y="42" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700">2. CUT</text>
    <text x="62" y="58" text-anchor="middle" fill="#cbd5e1" font-size="9">Digest with</text>
    <text x="62" y="70" text-anchor="middle" fill="#cbd5e1" font-size="9">restriction enzyme</text>
    <text x="62" y="82" text-anchor="middle" fill="#cbd5e1" font-size="9">(both insert + vector)</text>
  </g>
  <!-- Arrow 2-3 -->
  <line x1="300" y1="100" x2="315" y2="100" stroke="#22d3ee" stroke-width="2"/>
  <polygon points="315,96 323,100 315,104" fill="#22d3ee"/>
  <!-- Step 3 -->
  <g transform="translate(325, 50)">
    <rect width="125" height="100" rx="8" fill="#164e63" stroke="#22d3ee" stroke-width="1"/>
    <text x="62" y="22" text-anchor="middle" fill="#22d3ee" font-size="20">🔗</text>
    <text x="62" y="42" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700">3. LIGATE</text>
    <text x="62" y="58" text-anchor="middle" fill="#cbd5e1" font-size="9">DNA ligase joins</text>
    <text x="62" y="70" text-anchor="middle" fill="#cbd5e1" font-size="9">insert into vector</text>
    <text x="62" y="82" text-anchor="middle" fill="#cbd5e1" font-size="9">(sticky ends match)</text>
  </g>
  <!-- Arrow 3-4 -->
  <line x1="450" y1="100" x2="465" y2="100" stroke="#22d3ee" stroke-width="2"/>
  <polygon points="465,96 473,100 465,104" fill="#22d3ee"/>
  <!-- Step 4 -->
  <g transform="translate(475, 50)">
    <rect width="110" height="100" rx="8" fill="#164e63" stroke="#22d3ee" stroke-width="1"/>
    <text x="55" y="22" text-anchor="middle" fill="#22d3ee" font-size="20">🦠</text>
    <text x="55" y="42" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700">4. VERIFY</text>
    <text x="55" y="58" text-anchor="middle" fill="#cbd5e1" font-size="9">Transform cells</text>
    <text x="55" y="70" text-anchor="middle" fill="#cbd5e1" font-size="9">Select colonies</text>
    <text x="55" y="82" text-anchor="middle" fill="#cbd5e1" font-size="9">Sequence to confirm</text>
  </g>
  <!-- Bottom: DNA → Enzyme → Vector → Plasmid -->
  <g transform="translate(30, 175)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-weight="600">What happens at each step:</text>
    <text x="0" y="18" fill="#67e8f9" font-size="10">DNA Fragment</text>
    <line x1="100" y1="14" x2="130" y2="14" stroke="#475569" stroke-width="1"/>
    <text x="135" y="18" fill="#94a3b8" font-size="10">EcoRI cuts both →</text>
    <line x1="260" y1="14" x2="290" y2="14" stroke="#475569" stroke-width="1"/>
    <text x="295" y="18" fill="#34d399" font-size="10">Sticky ends anneal →</text>
    <line x1="425" y1="14" x2="455" y2="14" stroke="#475569" stroke-width="1"/>
    <text x="460" y="18" fill="#fbbf24" font-size="10">Ligase seals →</text>
    <line x1="555" y1="14" x2="575" y2="14" stroke="#475569" stroke-width="1"/>
    <text x="0" y="40" fill="#e2e8f0" font-size="10">Bacteria replicate the plasmid → many copies of the gene</text>
    <text x="0" y="58" fill="#94a3b8" font-size="9">Selection: antibiotic resistance gene kills bacteria without plasmid</text>
    <text x="0" y="74" fill="#94a3b8" font-size="9">Screening: blue-white or colony PCR confirms the insert is correct</text>
  </g>
</svg>`,

  5: `<svg viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
  <rect width="600" height="260" fill="url(#bg5)" rx="16"/>
  <text x="300" y="30" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">DNA LIGASE: SEALING THE BACKBONE</text>
  <!-- Nick in backbone -->
  <g transform="translate(50, 60)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-weight="600">Before ligation — nick in sugar-phosphate backbone:</text>
    <text x="0" y="22" fill="#67e8f9" font-family="monospace" font-size="12">5'─G   AATTC─3'  ← overhang from insert</text>
    <text x="0" y="42" fill="#f87171" font-family="monospace" font-size="12">    ↑ gap ↑</text>
    <text x="0" y="62" fill="#67e8f9" font-family="monospace" font-size="12">3'─CTTAA   G─5'  ← vector backbone</text>
  </g>
  <!-- Arrow -->
  <text x="300" y="155" text-anchor="middle" fill="#22d3ee" font-size="14">↓ T4 DNA Ligase + ATP ↓</text>
  <!-- After ligation -->
  <g transform="translate(50, 180)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-weight="600">After ligation — continuous backbone:</text>
    <text x="0" y="22" fill="#34d399" font-family="monospace" font-size="12">5'─G A A T T C─3'  ← sealed phosphodiester bond</text>
    <text x="0" y="42" fill="#fbbf24" font-family="monospace" font-size="12">    ↑ bonded ↑</text>
    <text x="0" y="62" fill="#34d399" font-family="monospace" font-size="12">3'─C T T A A G─5'  ← covalently closed</text>
  </g>
  <text x="300" y="255" text-anchor="middle" fill="#94a3b8" font-size="10">Optimal: 16°C overnight (sticky ends) | 37°C for blunt ends | Insert:vector ratio = 3:1</text>
</svg>`,

  6: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
  <rect width="600" height="300" fill="url(#bg6)" rx="16"/>
  <text x="300" y="30" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">PLASMID VECTOR: pUC19 MAP</text>
  <!-- Plasmid circle -->
  <g transform="translate(150, 50)">
    <circle cx="150" cy="100" r="90" fill="none" stroke="#22d3ee" stroke-width="2.5"/>
    <!-- ORI -->
    <path d="M 150 10 A 90 90 0 0 1 220 40" fill="none" stroke="#34d399" stroke-width="6" stroke-linecap="round"/>
    <text x="185" y="15" fill="#34d399" font-size="11" font-weight="700">ori</text>
    <text x="185" y="28" fill="#94a3b8" font-size="8">(replication origin)</text>
    <!-- MCS -->
    <path d="M 60 170 A 90 90 0 0 1 100 185" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/>
    <text x="35" y="190" fill="#fbbf24" font-size="11" font-weight="700">MCS</text>
    <text x="35" y="203" fill="#94a3b8" font-size="8">(multiple cloning site)</text>
    <!-- lacZ -->
    <path d="M 210 150 A 90 90 0 0 1 230 120" fill="none" stroke="#a78bfa" stroke-width="6" stroke-linecap="round"/>
    <text x="240" y="130" fill="#a78bfa" font-size="11" font-weight="700">lacZα</text>
    <text x="240" y="143" fill="#94a3b8" font-size="8">(blue-white screen)</text>
    <!-- AmpR -->
    <path d="M 70 50 A 90 90 0 0 1 100 30" fill="none" stroke="#f87171" stroke-width="6" stroke-linecap="round"/>
    <text x="25" y="45" fill="#f87171" font-size="11" font-weight="700">bla (AmpR)</text>
    <text x="25" y="58" fill="#94a3b8" font-size="8">(ampicillin resistance)</text>
  </g>
  <!-- Legend -->
  <g transform="translate(20, 260)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-weight="600">Key features:</text>
    <rect x="110" y="-10" width="8" height="8" rx="2" fill="#34d399"/>
    <text x="122" y="-2" fill="#cbd5e1" font-size="9">ori — high copy (500-700/cell)</text>
    <rect x="280" y="-10" width="8" height="8" rx="2" fill="#f87171"/>
    <text x="292" y="-2" fill="#cbd5e1" font-size="9">bla — ampicillin selection</text>
    <text x="0" y="18" fill="#cbd5e1" font-size="9">MCS contains unique EcoRI, BamHI, HindIII, XbaI, and 10+ other restriction sites</text>
    <text x="0" y="32" fill="#cbd5e1" font-size="9">Size: 2,686 bp | Copy number: 500-700 per cell</text>
  </g>
</svg>`,

  8: `<svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
  <rect width="600" height="280" fill="url(#bg8)" rx="16"/>
  <text x="300" y="30" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">BLUE-WHITE SCREENING</text>
  <!-- Two colony images -->
  <g transform="translate(50, 55)">
    <rect width="220" height="120" rx="10" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="110" y="22" text-anchor="middle" fill="#93c5fd" font-size="11" font-weight="700">Empty vector (no insert)</text>
    <circle cx="60" cy="65" r="15" fill="#2563eb"/>
    <circle cx="110" cy="55" r="12" fill="#2563eb"/>
    <circle cx="160" cy="70" r="14" fill="#2563eb"/>
    <circle cx="85" cy="85" r="11" fill="#2563eb"/>
    <text x="110" y="110" text-anchor="middle" fill="#60a5fa" font-size="10" font-weight="600">BLUE colonies = lacZ intact</text>
  </g>
  <g transform="translate(330, 55)">
    <rect width="220" height="120" rx="10" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1"/>
    <text x="110" y="22" text-anchor="middle" fill="#93c5fd" font-size="11" font-weight="700">Recombinant (has insert)</text>
    <circle cx="60" cy="65" r="15" fill="#f1f5f9"/>
    <circle cx="110" cy="55" r="12" fill="#f1f5f9"/>
    <circle cx="160" cy="70" r="14" fill="#f1f5f9"/>
    <circle cx="85" cy="85" r="11" fill="#f1f5f9"/>
    <text x="110" y="110" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="600">WHITE colonies = lacZ disrupted</text>
  </g>
  <!-- Mechanism -->
  <g transform="translate(50, 200)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-weight="600">Mechanism:</text>
    <text x="0" y="18" fill="#60a5fa" font-size="10">No insert → lacZα intact → β-galactosidase produced → X-gal cleaved → BLUE</text>
    <text x="0" y="36" fill="#f87171" font-size="10">Insert present → lacZα disrupted → no β-galactosidase → X-gal intact → WHITE</text>
    <text x="0" y="56" fill="#94a3b8" font-size="9">Pick WHITE colonies → verify insert by PCR or restriction digestion</text>
  </g>
</svg>`,

  10: `<svg viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg10" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
  <rect width="600" height="260" fill="url(#bg10)" rx="16"/>
  <text x="300" y="30" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">PCR: THERMAL CYCLING</text>
  <!-- Temperature graph -->
  <g transform="translate(40, 50)">
    <!-- Axes -->
    <line x1="0" y1="0" x2="0" y2="140" stroke="#475569" stroke-width="1"/>
    <line x1="0" y1="140" x2="520" y2="140" stroke="#475569" stroke-width="1"/>
    <text x="-5" y="5" text-anchor="end" fill="#94a3b8" font-size="8">95°C</text>
    <text x="-5" y="55" text-anchor="end" fill="#94a3b8" font-size="8">72°C</text>
    <text x="-5" y="100" text-anchor="end" fill="#94a3b8" font-size="8">55°C</text>
    <text x="-5" y="140" text-anchor="end" fill="#94a3b8" font-size="8">Time</text>
    <!-- Cycle 1 -->
    <polyline points="10,10 10,5 60,5 60,55 100,55 100,85 150,85 150,5" fill="none" stroke="#f87171" stroke-width="2.5"/>
    <text x="80" y="45" fill="#fbbf24" font-size="8" font-weight="700">Denature</text>
    <text x="110" y="80" fill="#22d3ee" font-size="8" font-weight="700">Anneal</text>
    <text x="125" y="55" fill="#34d399" font-size="8" font-weight="700">Extend</text>
    <!-- Cycle 2 -->
    <polyline points="150,5 150,5 200,5 200,55 240,55 240,85 290,85 290,5" fill="none" stroke="#f87171" stroke-width="2.5"/>
    <!-- Cycle 3 -->
    <polyline points="290,5 290,5 340,5 340,55 380,55 380,85 430,85 430,5" fill="none" stroke="#f87171" stroke-width="2.5"/>
    <text x="80" y="120" fill="#94a3b8" font-size="8">Cycle 1</text>
    <text x="220" y="120" fill="#94a3b8" font-size="8">Cycle 2</text>
    <text x="360" y="120" fill="#94a3b8" font-size="8">Cycle 3</text>
    <text x="450" y="120" fill="#94a3b8" font-size="8">→ 30 cycles</text>
  </g>
  <!-- Key -->
  <g transform="translate(40, 210)">
    <text x="0" y="0" fill="#f87171" font-size="10" font-weight="600">95°C: Denature</text>
    <text x="120" y="0" fill="#94a3b8" font-size="9">→ double-stranded DNA separates</text>
    <text x="0" y="16" fill="#22d3ee" font-size="10" font-weight="600">55°C: Anneal</text>
    <text x="120" y="16" fill="#94a3b8" font-size="9">→ primers bind to target flanking sequences</text>
    <text x="0" y="32" fill="#34d399" font-size="10" font-weight="600">72°C: Extend</text>
    <text x="120" y="32" fill="#94a3b8" font-size="9">→ Taq polymerase synthesizes new DNA strand</text>
  </g>
</svg>`,

  11: `<svg viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg11" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
  <rect width="600" height="260" fill="url(#bg11)" rx="16"/>
  <text x="300" y="30" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">GEL ELECTROPHORESIS</text>
  <!-- Gel diagram -->
  <g transform="translate(50, 50)">
    <!-- Gel plate -->
    <rect x="0" y="0" width="250" height="180" rx="8" fill="#1a1a2e" stroke="#374151" stroke-width="2"/>
    <!-- Wells -->
    <rect x="20" y="15" width="30" height="8" rx="2" fill="#374151"/>
    <rect x="70" y="15" width="30" height="8" rx="2" fill="#374151"/>
    <rect x="120" y="15" width="30" height="8" rx="2" fill="#374151"/>
    <rect x="170" y="15" width="30" height="8" rx="2" fill="#374151"/>
    <text x="35" y="13" text-anchor="middle" fill="#94a3b8" font-size="7">Ladder</text>
    <text x="85" y="13" text-anchor="middle" fill="#94a3b8" font-size="7">Sample 1</text>
    <text x="135" y="13" text-anchor="middle" fill="#94a3b8" font-size="7">Sample 2</text>
    <text x="185" y="13" text-anchor="middle" fill="#94a3b8" font-size="7">Control</text>
    <!-- Ladder bands -->
    <rect x="25" y="30" width="20" height="3" rx="1" fill="#34d399"/>
    <rect x="25" y="50" width="20" height="3" rx="1" fill="#34d399"/>
    <rect x="25" y="75" width="20" height="3" rx="1" fill="#34d399"/>
    <rect x="25" y="105" width="20" height="3" rx="1" fill="#34d399"/>
    <rect x="25" y="140" width="20" height="3" rx="1" fill="#34d399"/>
    <text x="12" y="34" text-anchor="end" fill="#94a3b8" font-size="7">10kb</text>
    <text x="12" y="54" text-anchor="end" fill="#94a3b8" font-size="7">5kb</text>
    <text x="12" y="79" text-anchor="end" fill="#94a3b8" font-size="7">2kb</text>
    <text x="12" y="109" text-anchor="end" fill="#94a3b8" font-size="7">1kb</text>
    <text x="12" y="144" text-anchor="end" fill="#94a3b8" font-size="7">0.5kb</text>
    <!-- Sample 1: single band at 5kb -->
    <rect x="75" y="47" width="20" height="4" rx="1" fill="#f87171"/>
    <!-- Sample 2: two bands -->
    <rect x="125" y="45" width="20" height="3" rx="1" fill="#fbbf24"/>
    <rect x="125" y="73" width="20" height="3" rx="1" fill="#fbbf24"/>
    <!-- Control: expected band -->
    <rect x="175" y="73" width="20" height="3" rx="1" fill="#34d399"/>
    <!-- Direction arrow -->
    <text x="125" y="175" text-anchor="middle" fill="#94a3b8" font-size="9">↑ DNA migrates toward + electrode (smaller = farther)</text>
  </g>
  <!-- Legend -->
  <g transform="translate(330, 60)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-weight="600">Reading the gel:</text>
    <text x="0" y="20" fill="#f87171" font-size="10">● Sample 1: single band = linearized plasmid (5kb)</text>
    <text x="0" y="40" fill="#fbbf24" font-size="10">● Sample 2: two bands = insert released (4kb + 1kb)</text>
    <text x="0" y="60" fill="#34d399" font-size="10">● Control: expected size confirmed</text>
    <text x="0" y="90" fill="#94a3b8" font-size="9">Agarose % determines resolution:</text>
    <text x="0" y="108" fill="#cbd5e1" font-size="9">0.8% → large fragments (5-20 kb)</text>
    <text x="0" y="124" fill="#cbd5e1" font-size="9">1.5% → medium (0.5-5 kb)</text>
    <text x="0" y="140" fill="#cbd5e1" font-size="9">2.0% → small fragments (100-1000 bp)</text>
  </g>
</svg>`,

  14: `<svg viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg14" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
  <rect width="600" height="260" fill="url(#bg14)" rx="16"/>
  <text x="300" y="28" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">PCR-RFLP: SICKLE CELL DETECTION</text>
  <g transform="translate(30, 50)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-weight="600">Normal β-globin gene:</text>
    <text x="0" y="18" fill="#67e8f9" font-family="monospace" font-size="11">...CCT GAG GAG...  → MstII site present (GAG)</text>
    <text x="0" y="36" fill="#94a3b8" font-size="10">Sickle cell mutation (Glu→Val):</text>
    <text x="0" y="54" fill="#f87171" font-family="monospace" font-size="11">...CCT GTG GAG...  → MstII site DESTROYED (GTG)</text>
  </g>
  <g transform="translate(30, 120)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-weight="600">After PCR + MstII digestion, gel shows:</text>
    <!-- Gel bands -->
    <g transform="translate(0, 20)">
      <rect x="0" y="0" width="180" height="100" rx="6" fill="#1a1a2e" stroke="#374151" stroke-width="1"/>
      <text x="30" y="14" text-anchor="middle" fill="#94a3b8" font-size="8">Normal</text>
      <text x="90" y="14" text-anchor="middle" fill="#94a3b8" font-size="8">Carrier</text>
      <text x="150" y="14" text-anchor="middle" fill="#94a3b8" font-size="8">Affected</text>
      <rect x="15" y="25" width="30" height="3" rx="1" fill="#34d399"/>
      <rect x="15" y="38" width="30" height="3" rx="1" fill="#34d399"/>
      <rect x="75" y="22" width="30" height="3" rx="1" fill="#fbbf24"/>
      <rect x="75" y="38" width="30" height="3" rx="1" fill="#fbbf24"/>
      <rect x="75" y="52" width="30" height="3" rx="1" fill="#fbbf24"/>
      <rect x="135" y="38" width="30" height="3" rx="1" fill="#f87171"/>
      <rect x="135" y="52" width="30" height="3" rx="1" fill="#f87171"/>
      <text x="15" y="70" fill="#94a3b8" font-size="7">1.15kb + 0.2kb</text>
      <text x="75" y="70" fill="#94a3b8" font-size="7">All three bands</text>
      <text x="135" y="70" fill="#94a3b8" font-size="7">1.35kb only</text>
      <text x="0" y="90" fill="#94a3b8" font-size="7">Cut = 1.15 + 0.2 kb | Uncut = 1.35 kb</text>
    </g>
  </g>
  <text x="300" y="250" text-anchor="middle" fill="#fbbf24" font-size="10" font-weight="600">One point mutation → restriction site destroyed → different band pattern on gel</text>
</svg>`,

  16: `<svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg16" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
  <rect width="600" height="280" fill="url(#bg16)" rx="16"/>
  <text x="300" y="28" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">CRISPR-Cas9 MECHANISM</text>
  <!-- gRNA -->
  <g transform="translate(30, 50)">
    <text x="0" y="0" fill="#a78bfa" font-size="10" font-weight="700">Guide RNA (gRNA)</text>
    <text x="0" y="16" fill="#cbd5e1" font-family="monospace" font-size="10">20-nt complementary to target DNA</text>
  </g>
  <!-- Cas9 protein -->
  <g transform="translate(30, 80)">
    <ellipse cx="50" cy="30" rx="45" ry="28" fill="#7c3aed" fill-opacity="0.3" stroke="#a78bfa" stroke-width="1.5"/>
    <text x="50" y="25" text-anchor="middle" fill="#c4b5fd" font-size="11" font-weight="700">Cas9</text>
    <text x="50" y="40" text-anchor="middle" fill="#94a3b8" font-size="8">nuclease</text>
  </g>
  <!-- Target DNA -->
  <g transform="translate(160, 70)">
    <text x="0" y="0" fill="#64748b" font-size="9">Target strand:</text>
    <text x="0" y="16" fill="#67e8f9" font-family="monospace" font-size="11">5'---NNNNNNNNNNNNNNNNNNNN NGG---3'</text>
    <text x="0" y="32" fill="#94a3b8" font-size="8">↑ gRNA matches here      ↑ PAM required</text>
    <text x="0" y="52" fill="#f87171" font-family="monospace" font-size="11">              ✂ DSB (cut here)</text>
  </g>
  <!-- Repair pathways -->
  <g transform="translate(30, 180)">
    <text x="0" y="0" fill="#94a3b8" font-size="10" font-weight="700">After double-strand break (DSB):</text>
    <g transform="translate(0, 20)">
      <rect x="0" y="0" width="250" height="55" rx="8" fill="#164e63" stroke="#22d3ee" stroke-width="1"/>
      <text x="125" y="18" text-anchor="middle" fill="#67e8f9" font-size="10" font-weight="700">NHEJ (Non-Homologous End Joining)</text>
      <text x="125" y="35" text-anchor="middle" fill="#cbd5e1" font-size="9">Error-prone → random insertions/deletions</text>
      <text x="125" y="48" text-anchor="middle" fill="#fbbf24" font-size="9">Used for: gene knockout</text>
    </g>
    <g transform="translate(310, 20)">
      <rect x="0" y="0" width="250" height="55" rx="8" fill="#164e63" stroke="#34d399" stroke-width="1"/>
      <text x="125" y="18" text-anchor="middle" fill="#34d399" font-size="10" font-weight="700">HDR (Homology-Directed Repair)</text>
      <text x="125" y="35" text-anchor="middle" fill="#cbd5e1" font-size="9">Precise → uses repair template</text>
      <text x="125" y="48" text-anchor="middle" fill="#fbbf24" font-size="9">Used for: gene correction / insertion</text>
    </g>
  </g>
</svg>`
};

// Minimal SVGs for slides that don't need complex diagrams
const MINIMAL_SVGS = {
  3: null, // Learning objectives - no visual needed
  7: null, // Quiz slide
  9: null, // Diagnosis quiz
  12: `<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg12" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs><rect width="600" height="200" fill="url(#bg12)" rx="16"/><text x="300" y="25" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">cDNA SYNTHESIS PATHWAY</text><g transform="translate(30, 50)"><rect width="130" height="45" rx="6" fill="#164e63" stroke="#a78bfa" stroke-width="1"/><text x="65" y="20" text-anchor="middle" fill="#c4b5fd" font-size="10" font-weight="700">mRNA (with introns)</text><text x="65" y="35" text-anchor="middle" fill="#94a3b8" font-size="8">Poly-A tail captured</text><text x="165" y="28" fill="#22d3ee" font-size="14">→</text><rect x="190" width="130" height="45" rx="6" fill="#164e63" stroke="#22d3ee" stroke-width="1"/><text x="255" y="20" text-anchor="middle" fill="#67e8f9" font-size="10" font-weight="700">Reverse Transcriptase</text><text x="255" y="35" text-anchor="middle" fill="#94a3b8" font-size="8">RNA → DNA copy</text><text x="335" y="28" fill="#22d3ee" font-size="14">→</text><rect x="360" width="130" height="45" rx="6" fill="#164e63" stroke="#34d399" stroke-width="1"/><text x="425" y="20" text-anchor="middle" fill="#34d399" font-size="10" font-weight="700">Double-stranded cDNA</text><text x="425" y="35" text-anchor="middle" fill="#94a3b8" font-size="8">Exons only, no introns</text></g><text x="300" y="120" text-anchor="middle" fill="#fbbf24" font-size="10">Key: cDNA = processed mRNA copied back into DNA → expressible in bacteria</text><text x="300" y="145" text-anchor="middle" fill="#94a3b8" font-size="9">Genomic DNA contains introns → bacteria cannot splice them → must use cDNA</text></svg>`,
  13: `<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg13" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs><rect width="600" height="200" fill="url(#bg13)" rx="16"/><text x="300" y="25" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">DNA LIBRARY SCREENING</text><g transform="translate(30, 50)"><rect x="0" y="0" width="120" height="80" rx="6" fill="#164e63" stroke="#22d3ee" stroke-width="1"/><text x="60" y="18" text-anchor="middle" fill="#67e8f9" font-size="10" font-weight="700">Genomic DNA</text><text x="60" y="34" text-anchor="middle" fill="#94a3b8" font-size="8">Fragmented by</text><text x="60" y="46" text-anchor="middle" fill="#94a3b8" font-size="8">partial digestion</text><text x="60" y="62" text-anchor="middle" fill="#94a3b8" font-size="8">→ 1-20 kb pieces</text><text x="135" y="40" fill="#22d3ee" font-size="14">→</text><rect x="160" y="0" width="120" height="80" rx="6" fill="#164e63" stroke="#a78bfa" stroke-width="1"/><text x="220" y="18" text-anchor="middle" fill="#c4b5fd" font-size="10" font-weight="700">Vector Ligation</text><text x="220" y="34" text-anchor="middle" fill="#94a3b8" font-size="8">Fragments cloned</text><text x="220" y="46" text-anchor="middle" fill="#94a3b8" font-size="8">into plasmids or</text><text x="220" y="62" text-anchor="middle" fill="#94a3b8" font-size="8">phage vectors</text><text x="295" y="40" fill="#22d3ee" font-size="14">→</text><rect x="320" y="0" width="120" height="80" rx="6" fill="#164e63" stroke="#fbbf24" stroke-width="1"/><text x="380" y="18" text-anchor="middle" fill="#fbbf24" font-size="10" font-weight="700">Colony Hybridization</text><text x="380" y="34" text-anchor="middle" fill="#94a3b8" font-size="8">Labeled probe</text><text x="380" y="46" text-anchor="middle" fill="#94a3b8" font-size="8">hybridizes to</text><text x="380" y="62" text-anchor="middle" fill="#94a3b8" font-size="8">matching clones</text><text x="455" y="40" fill="#22d3ee" font-size="14">→</text><rect x="480" y="0" width="100" height="80" rx="6" fill="#164e63" stroke="#34d399" stroke-width="1"/><text x="530" y="18" text-anchor="middle" fill="#34d399" font-size="10" font-weight="700">Target Clone</text><text x="530" y="34" text-anchor="middle" fill="#94a3b8" font-size="8">Isolated and</text><text x="530" y="46" text-anchor="middle" fill="#94a3b8" font-size="8">sequenced</text></g><text x="300" y="155" text-anchor="middle" fill="#94a3b8" font-size="9">5-10× genome coverage needed | Screening by hybridization or functional complementation</text></svg>`,
  15: `<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg15" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs><rect width="600" height="200" fill="url(#bg15)" rx="16"/><text x="300" y="25" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="700" letter-spacing="3">GENE THERAPY: VECTOR DELIVERY</text><g transform="translate(30, 50)"><rect x="0" y="0" width="100" height="50" rx="6" fill="#7c3aed" fill-opacity="0.2" stroke="#a78bfa" stroke-width="1"/><text x="50" y="20" text-anchor="middle" fill="#c4b5fd" font-size="9" font-weight="700">Lentivirus</text><text x="50" y="35" text-anchor="middle" fill="#94a3b8" font-size="8">Integrates</text><text x="50" y="45" text-anchor="middle" fill="#94a3b8" font-size="8">into genome</text><rect x="130" y="0" width="100" height="50" rx="6" fill="#22d3ee" fill-opacity="0.15" stroke="#22d3ee" stroke-width="1"/><text x="180" y="20" text-anchor="middle" fill="#67e8f9" font-size="9" font-weight="700">AAV Vector</text><text x="180" y="35" text-anchor="middle" fill="#94a3b8" font-size="8">Episomal</text><text x="180" y="45" text-anchor="middle" fill="#94a3b8" font-size="8">(non-integrating)</text><rect x="260" y="0" width="100" height="50" rx="6" fill="#34d399" fill-opacity="0.15" stroke="#34d399" stroke-width="1"/><text x="310" y="20" text-anchor="middle" fill="#34d399" font-size="9" font-weight="700">LNP</text><text x="310" y="35" text-anchor="middle" fill="#94a3b8" font-size="8">Lipid nanoparticle</text><text x="310" y="45" text-anchor="middle" fill="#94a3b8" font-size="8">(non-viral)</text><text x="390" y="25" fill="#94a3b8" font-size="10">→ Patient cells</text></g><g transform="translate(30, 120)"><text x="0" y="0" fill="#94a3b8" font-size="9" font-weight="600">Trade-offs:</text><text x="0" y="16" fill="#a78bfa" font-size="9">Lentivirus: permanent but risk of insertional mutagenesis</text><text x="0" y="32" fill="#67e8f9" font-size="9">AAV: safer but episomal → diluted in dividing cells → needs re-dosing</text><text x="0" y="48" fill="#34d399" font-size="9">LNP: safest but least efficient at delivering DNA into cells</text></g></svg>`,
  17: null, // Vision 2030 - use Unsplash fallback
  18: null, // Assessment
  19: null, // Portfolio
  20: null  // Final
};

async function main() {
  const projectId = "cmt3hvyk9000jon53eigkizlp";
  
  console.log("Injecting scientific SVGs into artifacts...\n");
  
  for (const [slideNoStr, svgCode] of Object.entries({...SVG_SLIDES, ...MINIMAL_SVGS})) {
    const slideNo = parseInt(slideNoStr);
    if (!svgCode) {
      console.log(`  Slide ${slideNo}: No SVG (using fallback)`);
      continue;
    }
    
    const artifact = await prisma.lectureSlideArtifact.findFirst({
      where: { projectId, slideNo },
      orderBy: { version: "desc" }
    });
    
    if (!artifact) {
      console.log(`  Slide ${slideNo}: Artifact not found, skipping`);
      continue;
    }
    
    const content = artifact.contentJson || {};
    
    // Inject visualSpec with svgCode
    const updatedContent = {
      ...content,
      visualSpec: {
        ...(content.visualSpec || {}),
        svgCode,
        title: content.title || `Slide ${slideNo}`,
        caption: content.studentExperience?.coreContent?.explanation?.substring(0, 100) || "",
      },
      visualIntent: {
        ...(content.visualIntent || {}),
        description: `Scientific diagram for ${content.title || 'this concept'}`,
        generateDiagram: false,
        sourceFigureRef: null,
      }
    };
    
    await prisma.lectureSlideArtifact.update({
      where: { id: artifact.id },
      data: { contentJson: updatedContent }
    });
    
    console.log(`  ✅ Slide ${slideNo}: SVG injected (${svgCode.length} chars)`);
  }
  
  // Summary
  const all = await prisma.lectureSlideArtifact.findMany({
    where: { projectId },
    orderBy: { slideNo: 'asc' }
  });
  
  const withSvg = all.filter(a => a.contentJson?.visualSpec?.svgCode?.length > 50).length;
  const withImage = all.filter(a => {
    const url = a.contentJson?.visualSpec?.fetchedImageUrl || a.contentJson?.visualSpec?.imageUrl || "";
    return url.length > 10 && !url.includes("none");
  }).length;
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total slides: ${all.length}`);
  console.log(`With SVG diagram: ${withSvg}`);
  console.log(`With image URL: ${withImage}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
