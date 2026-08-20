/**
 * Universal Academic Visuals — Keyword-to-Image Matching System
 * ==============================================================================
 * Maps specific academic topic keywords to curated, high-quality Unsplash images.
 * Priority: most specific keyword match wins over generic discipline fallback.
 */

export type AcademicDiscipline =
  | "cs_ai"
  | "physics"
  | "mathematics"
  | "engineering"
  | "life_sciences_medicine"
  | "chemistry"
  | "business_economics"
  | "vision_2030"
  | "general";

export interface AcademicVisual {
  id: string;
  discipline: AcademicDiscipline;
  topic: string;
  title: string;
  caption: string;
  imageUrl: string;
  tags: string[];
  visualType: string;
}

export const DISCIPLINE_METADATA: Record<AcademicDiscipline, { labelEn: string; labelAr: string; icon: string }> = {
  cs_ai: { labelEn: "Computer Science & AI", labelAr: "علوم الحاسب والذكاء الاصطناعي", icon: "💻" },
  physics: { labelEn: "Physics & Space", labelAr: "الفيزياء وعلوم الفضاء", icon: "⚛️" },
  mathematics: { labelEn: "Mathematics & Statistics", labelAr: "الرياضيات والإحصاء", icon: "📐" },
  engineering: { labelEn: "Engineering & Tech", labelAr: "الهندسة والتقنية", icon: "⚙️" },
  life_sciences_medicine: { labelEn: "Medicine & Life Sciences", labelAr: "الطب والعلوم الحيوية", icon: "🧬" },
  chemistry: { labelEn: "Chemistry", labelAr: "الكيمياء", icon: "⚗️" },
  business_economics: { labelEn: "Business & Economics", labelAr: "إدارة الأعمال والاقتصاد", icon: "📈" },
  vision_2030: { labelEn: "Saudi Vision 2030", labelAr: "رؤية السعودية 2030", icon: "🇸🇦" },
  general: { labelEn: "General Academic", labelAr: "أكاديمي عام", icon: "🎓" },
};

interface TopicImage {
  keywords: string[];
  imageUrl: string;
  title: string;
  caption: string;
  visualType: string;
  discipline: AcademicDiscipline;
  /** Pedagogical-function entries match slide *roles* ("Worked Example",
   *  "Prior Knowledge Check", "Misconception"…) rather than a subject topic.
   *  They only win on a TITLE match, and never beat a specific topic hit. */
  pedagogical?: boolean;
}

/**
 * TOPIC_IMAGE_MAP — priority-ordered: most specific entries first.
 * The resolver picks the FIRST entry whose keywords appear in the slide text.
 */
export const TOPIC_IMAGE_MAP: TopicImage[] = [

  // BIOMOLECULES & BIOCHEMISTRY
  {
    keywords: ["enzyme kinetics", "michaelis", "km", "vmax", "active site", "inhibitor", "catalysis"],
    imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80",
    title: "Enzyme Kinetics & Catalysis", caption: "Enzyme-substrate binding at the active site reduces activation energy, accelerating biochemical reactions.",
    visualType: "Kinetics Graph", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["drug delivery", "nanoparticle", "liposome", "lipid nanoparticle", "lnp", "encapsulation", "mrna vaccine"],
    imageUrl: "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80",
    title: "Nanoparticle Drug Delivery", caption: "Lipid nanoparticles encapsulate therapeutic molecules enabling targeted delivery with controlled release.",
    visualType: "Biomedical Diagram", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["dna", "rna", "nucleic acid", "double helix", "base pair", "genome", "replication", "transcription", "translation"],
    imageUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80",
    title: "DNA Double Helix & Nucleic Acids", caption: "DNA encodes genetic information through complementary base pairing (A-T, G-C) in its double helical structure.",
    visualType: "Molecular Diagram", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["protein", "folding", "amino acid", "polypeptide", "quaternary structure", "tertiary structure", "secondary structure"],
    imageUrl: "https://images.unsplash.com/photo-1579165466741-7f35e4755660?auto=format&fit=crop&w=1200&q=80",
    title: "Protein Folding & Structure", caption: "Protein sequence folds into complex 3D conformations through hydrophobic collapse and hydrogen bonding.",
    visualType: "3D Molecular Model", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["lipid", "phospholipid", "membrane", "bilayer", "hydrophobic", "hydrophilic", "fatty acid", "cell membrane", "amphipathic"],
    imageUrl: "https://images.unsplash.com/photo-1576671081837-49000212a370?auto=format&fit=crop&w=1200&q=80",
    title: "Lipid Bilayer & Cell Membrane", caption: "Phospholipid bilayers form selectively permeable barriers controlling molecular transport into and out of cells.",
    visualType: "Cellular Diagram", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["carbohydrate", "glucose", "sugar", "polysaccharide", "starch", "cellulose", "glycolysis", "monosaccharide"],
    imageUrl: "https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&w=1200&q=80",
    title: "Carbohydrate Structure & Function", caption: "Monosaccharides polymerize into polysaccharides for energy storage and structural support in biological systems.",
    visualType: "Chemical Structure", discipline: "chemistry"
  },

  {
    keywords: ["biomolecule", "biomolecules", "macromolecule", "biochemistry", "four biomolecules", "biological molecule"],
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80",
    title: "Biomolecular Structures", caption: "Proteins, lipids, carbohydrates, and nucleic acids — the four macromolecular classes — underpin all biological processes.",
    visualType: "Molecular Structure", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["water treatment", "purification", "filtration", "bioreactor", "wastewater", "desalination", "membrane filtration"],
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    title: "Water Treatment & Purification", caption: "Multi-stage treatment integrates biological, physical, and chemical processes to produce safe, clean water.",
    visualType: "Process Flow", discipline: "engineering"
  },

  {
    keywords: ["crispr", "cas9", "gene editing", "genetic engineering", "knockout", "guide rna", "grna", "sgrna", "pam", "cleavage", "endonuclease", "double strand break", "nhej", "hdr", "genome editing", "off target", "transfection"],
    imageUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80",
    title: "CRISPR-Cas9 Genome Editing Mechanism", caption: "CRISPR-Cas9 ribonucleoprotein complex binds target DNA complementary to gRNA adjacent to PAM sequence, introducing targeted double-strand breaks.",
    visualType: "Molecular Mechanism", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["gene therapy", "viral vector", "adeno associated", "aav", "lentivirus", "in vivo", "ex vivo", "transgene"],
    imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80",
    title: "Gene Therapy & Vector Delivery", caption: "Engineered viral vectors transport functional genes or CRISPR effectors to specific patient tissue types.",
    visualType: "Therapeutic Architecture", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["metabolism", "metabolic", "atp", "krebs cycle", "citric acid", "oxidative phosphorylation", "cellular respiration"],
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    title: "Metabolic Pathways & Energy", caption: "Cellular respiration converts glucose to ATP via glycolysis, Krebs cycle, and oxidative phosphorylation.",
    visualType: "Biochemical Pathway", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["cell", "organelle", "mitochondria", "nucleus", "eukaryote", "prokaryote", "cytoplasm", "endoplasmic reticulum"],
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80",
    title: "Cell Structure & Organelles", caption: "Eukaryotic cells contain specialized membrane-bound organelles performing distinct metabolic functions.",
    visualType: "Cell Diagram", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["antibody", "immune", "antigen", "t cell", "b cell", "immunology", "lymphocyte", "adaptive immunity"],
    imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=1200&q=80",
    title: "Immunology & Antibody Biology", caption: "Y-shaped antibodies bind antigens with high specificity through hypervariable complementarity-determining regions.",
    visualType: "Immunological Diagram", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["cancer", "tumor", "oncology", "chemotherapy", "immunotherapy", "metastasis", "carcinogenesis"],
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80",
    title: "Cancer Biology & Treatment", caption: "Cancer therapies target hallmark processes: uncontrolled proliferation, angiogenesis, and immune evasion.",
    visualType: "Biomedical Model", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["pharmacology", "drug receptor", "pharmacokinetics", "bioavailability", "dose response", "side effect"],
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
    title: "Pharmacology & Drug Mechanisms", caption: "Drug-receptor kinetics and ADME pharmacokinetics determine therapeutic efficacy and toxicity profiles.",
    visualType: "Pharmacological Diagram", discipline: "life_sciences_medicine"
  },

  // CHEMISTRY
  {
    keywords: ["organic chemistry", "reaction mechanism", "functional group", "alkane", "alkene", "aromatic", "ester", "ketone"],
    imageUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80",
    title: "Organic Chemistry Reactions", caption: "Organic reaction mechanisms trace electron flow through functional groups, determining reactivity and stereochemistry.",
    visualType: "Reaction Mechanism", discipline: "chemistry"
  },

  {
    keywords: ["spectroscopy", "nmr", "infrared", "ir spectroscopy", "mass spectrometry", "uv-vis", "absorption spectrum"],
    imageUrl: "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?auto=format&fit=crop&w=1200&q=80",
    title: "Spectroscopic Analysis", caption: "Spectroscopy identifies molecular structure by measuring how matter absorbs and emits electromagnetic radiation.",
    visualType: "Spectral Analysis", discipline: "chemistry"
  },

  {
    keywords: ["polymer", "polymerization", "monomer", "plastic", "condensation polymer", "addition polymer"],
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
    title: "Polymer Chemistry", caption: "Polymer chains assemble from monomers via addition or condensation reactions into macromolecules with tunable properties.",
    visualType: "Chemical Structure", discipline: "chemistry"
  },

  {
    keywords: ["periodic table", "element", "electron configuration", "orbital", "valence electron", "atomic number", "electronegativity"],
    imageUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
    title: "Periodic Table & Atomic Structure", caption: "The periodic table reveals systematic trends in electron configuration, atomic radius, and chemical reactivity.",
    visualType: "Chemical Table", discipline: "chemistry"
  },

  {
    keywords: ["acid base", "ph", "buffer", "neutralization", "titration", "equilibrium constant", "stoichiometry", "mole"],
    imageUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80",
    title: "Acid-Base Chemistry & Titration", caption: "Acid-base equilibria and buffer systems regulate pH — critical for biological and industrial chemical processes.",
    visualType: "Laboratory Chemistry", discipline: "chemistry"
  },

  {
    keywords: ["enthalpy", "entropy", "gibbs free energy", "exothermic", "endothermic", "spontaneous", "chemical thermodynamics"],
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    title: "Chemical Thermodynamics", caption: "Gibbs free energy predicts reaction spontaneity by combining enthalpy and entropy changes at constant T and P.",
    visualType: "Energy Diagram", discipline: "chemistry"
  },

  // PHYSICS
  {
    keywords: ["black hole", "event horizon", "singularity", "accretion disk", "m87", "hawking radiation"],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg/1280px-Black_hole_-_Messier_87_crop_max_res.jpg",
    title: "Black Hole Event Horizon", caption: "EHT radio image of M87* shows the photon ring and relativistic shadow of a 6.5-billion solar-mass black hole.",
    visualType: "Telescope Observation", discipline: "physics"
  },

  {
    keywords: ["quantum mechanics", "wave function", "superposition", "entanglement", "schrodinger", "qubit", "heisenberg"],
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
    title: "Quantum Mechanics", caption: "Quantum superposition allows particles to exist in multiple states simultaneously until observation collapses the wave function.",
    visualType: "Quantum Model", discipline: "physics"
  },

  {
    keywords: ["general relativity", "special relativity", "spacetime", "einstein", "geodesic", "gravitational wave", "curvature"],
    imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
    title: "General Relativity & Spacetime", caption: "Einstein's field equations describe gravity as spacetime curvature proportional to the energy-momentum tensor.",
    visualType: "Relativistic Diagram", discipline: "physics"
  },

  {
    keywords: ["optics", "lens", "refraction", "diffraction", "interference", "laser", "wavelength", "refractive index"],
    imageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80",
    title: "Optics & Light Physics", caption: "Light undergoes refraction, diffraction, and interference following Maxwell's electromagnetic wave equations.",
    visualType: "Optical Phenomenon", discipline: "physics"
  },

  {
    keywords: ["electromagnetism", "maxwell equations", "electric field", "magnetic field", "electromagnetic wave", "faraday", "induction"],
    imageUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
    title: "Electromagnetism", caption: "Maxwell's four equations unify electricity and magnetism, predicting electromagnetic wave propagation at speed c.",
    visualType: "Field Diagram", discipline: "physics"
  },

  {
    keywords: ["nuclear physics", "fission", "fusion", "radioactive", "isotope", "nuclear decay", "half-life"],
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80",
    title: "Nuclear Physics", caption: "Nuclear reactions release the binding energy holding nucleons together — the basis of both fission reactors and stellar fusion.",
    visualType: "Nuclear Diagram", discipline: "physics"
  },

  {
    keywords: ["thermodynamics", "carnot", "entropy", "heat engine", "pressure volume", "ideal gas", "second law"],
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    title: "Thermodynamics & Heat Engines", caption: "The Carnot cycle establishes maximum efficiency limits for heat engines operating between temperature reservoirs.",
    visualType: "Thermodynamic Diagram", discipline: "physics"
  },

  // MATHEMATICS
  {
    keywords: ["calculus", "derivative", "integral", "differentiation", "limit", "gradient", "vector calculus"],
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
    title: "Calculus & Mathematical Analysis", caption: "Calculus provides tools for analyzing continuous change through derivatives (rates) and integrals (accumulation).",
    visualType: "Mathematical Surface", discipline: "mathematics"
  },

  {
    keywords: ["force", "newton", "mechanics", "kinematics", "velocity", "acceleration", "momentum", "inertia", "free body"],
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
    title: "Classical Mechanics & Forces", caption: "Newton's laws govern the relationship between force, mass, and acceleration — the foundation of classical mechanics.",
    visualType: "Force Diagram", discipline: "physics"
  },

  {
    keywords: ["wave", "oscillation", "frequency", "amplitude", "resonance", "harmonic", "sine wave", "electromagnetic spectrum"],
    imageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80",
    title: "Waves & Oscillations", caption: "Waves transfer energy through periodic oscillations characterized by frequency, amplitude, wavelength, and phase.",
    visualType: "Wave Diagram", discipline: "physics"
  },

  {
    keywords: ["electrostatic", "coulomb", "electric potential", "capacitor", "charge", "electric field line", "gauss law"],
    imageUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
    title: "Electrostatics & Electric Fields", caption: "Coulomb's law quantifies the force between point charges; electric field lines map the spatial distribution of force.",
    visualType: "Field Diagram", discipline: "physics"
  },

  {
    keywords: ["kinetic energy", "potential energy", "conservation", "work-energy", "power", "mechanical advantage"],
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    title: "Energy & Conservation Laws", caption: "Energy conservation requires that total energy in a closed system remains constant, converting between kinetic and potential forms.",
    visualType: "Energy Diagram", discipline: "physics"
  },

  {
    keywords: ["molecular geometry", "vsepr", "lewis structure", "bonding", "covalent", "ionic", "hybridization", "polar"],
    imageUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80",
    title: "Molecular Geometry & Bonding", caption: "VSEPR theory predicts 3D molecular geometry from electron-pair repulsion, determining polarity and reactivity.",
    visualType: "Molecular Model", discipline: "chemistry"
  },

  {
    keywords: ["reaction rate", "kinetics", "collision theory", "activation energy", "catalyst", "rate law", "arrhenius"],
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    title: "Reaction Kinetics & Rate Laws", caption: "Reaction rate depends on concentration, temperature, and activation energy as described by the Arrhenius equation.",
    visualType: "Kinetics Graph", discipline: "chemistry"
  },

  {
    keywords: ["equilibrium", "le chatelier", "dynamic equilibrium", "equilibrium constant", "kc", "kp", "shift"],
    imageUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80",
    title: "Chemical Equilibrium", caption: "Dynamic equilibrium is reached when forward and reverse reaction rates are equal; Le Chatelier's principle predicts system response to disturbance.",
    visualType: "Equilibrium Diagram", discipline: "chemistry"
  },

  {
    keywords: ["photosynthesis", "chloroplast", "light reaction", "calvin cycle", "carbon fixation", "chlorophyll", "thylakoid"],
    imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80",
    title: "Photosynthesis Pathways", caption: "Photosynthesis converts light energy to chemical energy through light-dependent reactions in thylakoids and the Calvin cycle in the stroma.",
    visualType: "Biochemical Pathway", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["natural selection", "evolution", "darwinian", "adaptation", "speciation", "fitness", "allele frequency"],
    imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80",
    title: "Evolution & Natural Selection", caption: "Natural selection drives adaptation by favoring heritable traits that increase reproductive fitness in a given environment.",
    visualType: "Evolutionary Diagram", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["nervous system", "neuron", "synapse", "action potential", "neurotransmitter", "axon", "dendrite", "reflex"],
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80",
    title: "Neural Signaling & Synaptic Transmission", caption: "Action potentials propagate along axons; neurotransmitters cross the synaptic cleft to relay signals between neurons.",
    visualType: "Neural Diagram", discipline: "life_sciences_medicine"
  },

  {
    keywords: ["ohm law", "kirchhoff", "voltage", "current", "resistance", "circuit analysis", "series parallel", "mesh"],
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    title: "Circuit Analysis & Ohm's Law", caption: "Ohm's law (V=IR) and Kirchhoff's laws govern voltage-current relationships in series and parallel circuits.",
    visualType: "Circuit Diagram", discipline: "engineering"
  },

  {
    keywords: ["torque", "rotational", "angular momentum", "moment of inertia", "centripetal", "gyroscope"],
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    title: "Rotational Dynamics", caption: "Torque produces angular acceleration; moment of inertia quantifies resistance to rotational change.",
    visualType: "Rotational Diagram", discipline: "physics"
  },

  {
    keywords: ["boolean logic", "gate", "and gate", "or gate", "xor", "combinational", "sequential", "flip flop"],
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    title: "Digital Logic & Boolean Algebra", caption: "Logic gates implement Boolean functions; combinational and sequential circuits form the foundation of digital computing.",
    visualType: "Logic Diagram", discipline: "cs_ai"
  },

  {
    keywords: ["sampling distribution", "central limit theorem", "confidence interval", "standard error", "bootstrapping"],
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    title: "Sampling Distributions & CLT", caption: "The Central Limit Theorem ensures sample means approximate normality regardless of population distribution shape.",
    visualType: "Statistical Plot", discipline: "mathematics"
  },

  {
    keywords: ["matrix", "linear algebra", "eigenvector", "eigenvalue", "determinant", "vector space", "linear transformation"],
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    title: "Linear Algebra & Matrices", caption: "Linear transformations represented as matrices map vectors between spaces; eigendecomposition reveals geometric structure.",
    visualType: "Matrix Diagram", discipline: "mathematics"
  },

  {
    keywords: ["probability", "statistics", "normal distribution", "gaussian", "random variable", "hypothesis test", "p-value"],
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    title: "Probability & Statistics", caption: "Statistical inference uses sampling distributions and hypothesis testing to draw conclusions from observed data.",
    visualType: "Statistical Plot", discipline: "mathematics"
  },

  {
    keywords: ["differential equation", "ode", "pde", "dynamical system", "fourier series", "laplace transform"],
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
    title: "Differential Equations", caption: "ODEs and PDEs model dynamic systems from pendulum oscillations to heat diffusion and wave propagation.",
    visualType: "Phase Diagram", discipline: "mathematics"
  },

  // COMPUTER SCIENCE & AI
  {
    keywords: ["neural network", "deep learning", "machine learning", "artificial intelligence", "transformer", "llm", "backpropagation"],
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    title: "Neural Networks & Deep Learning", caption: "Deep networks learn hierarchical representations via layers of weighted connections trained by gradient descent.",
    visualType: "Architecture Diagram", discipline: "cs_ai"
  },

  {
    keywords: ["algorithm", "data structure", "sorting", "searching", "complexity", "big-o", "binary tree", "dynamic programming"],
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    title: "Algorithms & Data Structures", caption: "Algorithmic efficiency is characterized by time and space complexity, guiding optimal data structure selection.",
    visualType: "Algorithm Diagram", discipline: "cs_ai"
  },

  {
    keywords: ["cybersecurity", "encryption", "cryptography", "network security", "firewall", "zero trust", "vulnerability"],
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    title: "Cybersecurity & Cryptography", caption: "Public-key cryptography enables secure communication through asymmetric key pairs — no shared secret required.",
    visualType: "Security Architecture", discipline: "cs_ai"
  },

  {
    keywords: ["cloud computing", "distributed system", "kubernetes", "microservice", "containerization", "devops", "serverless"],
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    title: "Cloud Computing & Distributed Systems", caption: "Cloud orchestration enables elastic scaling, fault tolerance, and globally distributed processing at scale.",
    visualType: "System Architecture", discipline: "cs_ai"
  },

  {
    keywords: ["database", "sql", "nosql", "query", "indexing", "relational database", "schema", "transaction", "acid"],
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a2e2?auto=format&fit=crop&w=1200&q=80",
    title: "Database Systems", caption: "Relational databases ensure ACID properties; query optimization and indexing enable fast retrieval from large datasets.",
    visualType: "Data Schema", discipline: "cs_ai"
  },

  // ENGINEERING
  {
    keywords: ["robotics", "robot", "kinematics", "automation", "mechatronics", "actuator", "pid control"],
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    title: "Robotics & Automation", caption: "Industrial robots use inverse kinematics and feedback control for precise, repeatable manufacturing operations.",
    visualType: "Robotics Diagram", discipline: "engineering"
  },

  {
    keywords: ["solar energy", "renewable", "photovoltaic", "wind power", "battery storage", "smart grid", "clean energy"],
    imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    title: "Renewable Energy Systems", caption: "Photovoltaic cells harness solar irradiance through semiconductor junction photoelectric conversion for clean electricity.",
    visualType: "Energy Diagram", discipline: "engineering"
  },

  {
    keywords: ["circuit", "electronics", "transistor", "semiconductor", "capacitor", "resistor", "signal processing", "op-amp"],
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    title: "Electronic Circuits", caption: "Transistors switch and amplify signals forming the fundamental building blocks of all digital and analog circuits.",
    visualType: "Circuit Diagram", discipline: "engineering"
  },

  {
    keywords: ["structural mechanics", "stress", "strain", "fea", "finite element", "load bearing", "bridge", "beam"],
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    title: "Structural Mechanics & FEA", caption: "Finite element analysis discretizes complex structures to simulate Von Mises stress distribution and failure modes.",
    visualType: "FEA Model", discipline: "engineering"
  },

  {
    keywords: ["fluid dynamics", "flow", "aerodynamics", "bernoulli", "turbulence", "laminar flow", "viscosity", "cfd"],
    imageUrl: "https://images.unsplash.com/photo-1494961104209-3c223057bd26?auto=format&fit=crop&w=1200&q=80",
    title: "Fluid Dynamics & CFD", caption: "Navier-Stokes equations describe viscous fluid flow, predicting turbulence, lift, drag, and pressure fields.",
    visualType: "Flow Simulation", discipline: "engineering"
  },

  // SAUDI VISION 2030
  {
    keywords: ["neom", "smart city", "the line", "zero carbon city", "urban planning sustainable"],
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    title: "NEOM & Smart Cities", caption: "NEOM's THE LINE reimagines urban living with 100% renewable energy and AI-driven connected infrastructure.",
    visualType: "Urban Architecture", discipline: "vision_2030"
  },

  {
    keywords: ["saudi", "vision 2030", "ksa", "riyadh", "kingdom of saudi arabia", "national transformation"],
    imageUrl: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=1200&q=80",
    title: "Saudi Vision 2030", caption: "Vision 2030 transforms Saudi Arabia's economy through innovation, tourism, and knowledge-based industry development.",
    visualType: "National Strategy", discipline: "vision_2030"
  },

  {
    keywords: ["biotech", "biotechnology", "kaimrc", "pharmaceutical", "research institute", "bioinformatics"],
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    title: "Saudi Biotechnology Hub", caption: "Saudi Arabia's expanding biotech ecosystem drives precision medicine and biopharmaceutical manufacturing capacity.",
    visualType: "Research Facility", discipline: "vision_2030"
  },

  // BUSINESS & ECONOMICS
  {
    keywords: ["supply demand", "market equilibrium", "elasticity", "economics", "inflation", "gdp", "microeconomics"],
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    title: "Supply & Demand Economics", caption: "Market equilibrium price forms where quantity supplied equals quantity demanded under competitive market conditions.",
    visualType: "Economic Model", discipline: "business_economics"
  },

  {
    keywords: ["finance", "investment", "portfolio", "stock market", "capital markets", "risk return", "asset allocation"],
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    title: "Finance & Investment", caption: "Modern portfolio theory optimizes the risk-return tradeoff through diversification across uncorrelated asset classes.",
    visualType: "Financial Chart", discipline: "business_economics"
  },

  {
    keywords: ["management", "strategy", "leadership", "business model", "swot analysis", "competitive advantage"],
    imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
    title: "Business Strategy", caption: "Strategic management aligns organizational capabilities with external market opportunities for sustainable competitive advantage.",
    visualType: "Strategy Framework", discipline: "business_economics"
  },

  // GENERAL ACADEMIC
  {
    keywords: ["assessment", "rubric", "mastery", "readiness", "performance standard", "competency", "bloom", "final assessment", "readiness check"],
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
    title: "Assessment & Mastery", caption: "Competency-based assessment measures observable student outcomes against defined performance standards.",
    visualType: "Assessment Framework", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["problem solving", "critical thinking", "decision making", "evaluate", "challenge", "analysis", "diagnose", "decision challenge", "evaluating strategies"],
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    title: "Critical Thinking & Problem Solving", caption: "Structured problem-solving frameworks decompose complex challenges into evidence-based analytical components.",
    visualType: "Conceptual Diagram", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["transfer", "cross-domain", "apply knowledge", "real world", "industry application", "case study", "practical", "transfer challenge", "across domains", "across disciplines"],
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    title: "Applied Learning & Transfer", caption: "Knowledge transfer applies theoretical understanding to novel contexts through adaptive, iterative practice.",
    visualType: "Applied Learning", discipline: "general"
  },

  {
    keywords: ["research", "experiment", "laboratory", "hypothesis", "scientific method", "data collection", "research question", "empirical"],
    imageUrl: "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?auto=format&fit=crop&w=1200&q=80",
    title: "Scientific Research", caption: "The scientific method advances knowledge through systematic observation, hypothesis testing, and empirical verification.",
    visualType: "Research Environment", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["learning outcome", "clo", "objective", "observable", "bloom taxonomy", "core learning outcomes", "course learning outcomes"],
    imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    title: "Learning Outcomes & CLOs", caption: "Course learning outcomes define measurable competencies students achieve at each Bloom's taxonomy cognitive level.",
    visualType: "Educational Framework", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["prior knowledge", "prerequisite", "recall", "activate", "schema", "prior learning", "prior knowledge check", "foundation"],
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    title: "Prior Knowledge Activation", caption: "Activating prior knowledge bridges existing schemas with new concepts, accelerating meaningful learning and retention.",
    visualType: "Pedagogical Diagram", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["evidence", "mastery", "portfolio", "clo alignment", "demonstrate", "performance", "final", "evidence of mastery", "performance rubric"],
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
    title: "Evidence of Mastery", caption: "Portfolio evidence demonstrates CLO achievement through authentic tasks at progressively higher Bloom's levels.",
    visualType: "Assessment Portfolio", discipline: "general"
  },

  // PEDAGOGICAL FUNCTIONS (specific slide roles → distinct visuals). These
  // only win on a TITLE match and never beat a specific topic phrase.
  {
    pedagogical: true, keywords: ["mental model", "concept map", "conceptual model", "mental mapping", "mapping biomolecules"],
    imageUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80",
    title: "Building a Mental Model", caption: "A mental model organizes relationships between concepts so new knowledge connects to what is already known.",
    visualType: "Concept Map", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["misconception", "common misconceptions", "misunderstanding", "false belief", "mistaken idea"],
    imageUrl: "https://images.unsplash.com/photo-1558478551-1a378f63328e?auto=format&fit=crop&w=1200&q=80",
    title: "Confronting Misconceptions", caption: "Surfacing a plausible misconception and showing why it fails builds a correct, durable mental model.",
    visualType: "Conceptual Diagram", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["worked example", "step-by-step", "worked example step", "guided example"],
    imageUrl: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80",
    title: "Worked Example", caption: "A worked example exposes each step of the reasoning so students can imitate the method on their own.",
    visualType: "Process Flow", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["guided practice", "independent practice", "practice problem", "practice problems", "problem solving in", "guided application"],
    imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
    title: "Guided & Independent Practice", caption: "Progressive practice moves students from scaffolded guidance toward independent, fluent performance.",
    visualType: "Practice Framework", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["trade-off", "trade off", "tradeoffs", "trade-offs in", "stability", "trade-off in"],
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
    title: "Trade-offs & Design Decisions", caption: "Engineering and scientific design balance competing constraints — performance, cost, stability, and risk.",
    visualType: "Decision Matrix", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["mechanism", "how it works", "molecular mechanism", "mechanism how", "interact & function", "deep dive"],
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    title: "Mechanism in Action", caption: "Mechanistic explanations trace cause and effect step by step, showing how a system actually behaves.",
    visualType: "Mechanism Diagram", discipline: "general"
  },

  {
    pedagogical: true, keywords: ["hook", "problem context", "challenge problem", "engage", "opening scenario", "problem statement"],
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    title: "The Problem", caption: "A compelling problem frames why this concept matters and gives students a reason to engage deeply.",
    visualType: "Problem Framing", discipline: "general"
  },
];

// DISCIPLINE FALLBACKS
const DISCIPLINE_FALLBACKS: Record<AcademicDiscipline, { imageUrl: string; title: string; caption: string }> = {
  life_sciences_medicine: {
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80",
    title: "Life Sciences & Medicine",
    caption: "Biological systems operate through precisely regulated molecular interactions at the cellular and organismal levels.",
  },
  chemistry: {
    imageUrl: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80",
    title: "Chemistry & Molecular Science",
    caption: "Chemical reactions involve breaking and forming bonds between atoms, governed by thermodynamic and kinetic principles.",
  },
  physics: {
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
    title: "Physics & Natural Science",
    caption: "Physics describes fundamental laws governing matter, energy, space, and time across all scales of the universe.",
  },
  mathematics: {
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
    title: "Mathematics & Logic",
    caption: "Mathematics provides universal language for describing patterns, quantities, and logical relationships with precision.",
  },
  cs_ai: {
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    title: "Computer Science & AI",
    caption: "Computational systems process information through algorithms operating on digital representations of real-world problems.",
  },
  engineering: {
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    title: "Engineering & Technology",
    caption: "Engineering applies scientific principles to design and build systems solving real-world problems with optimal efficiency.",
  },
  business_economics: {
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    title: "Business & Economics",
    caption: "Economic systems allocate scarce resources through market mechanisms guided by incentives and institutional frameworks.",
  },
  vision_2030: {
    imageUrl: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=1200&q=80",
    title: "Saudi Vision 2030",
    caption: "Vision 2030 drives Saudi Arabia's economic diversification through innovation, technology, and human capital development.",
  },
  general: {
    imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    title: "Conceptual Overview",
    caption: "Slide visual — see your lecture notes for the detailed diagram corresponding to this concept.",
  },
};

export function detectAcademicDiscipline(text: string): AcademicDiscipline {
  const lower = text.toLowerCase();
  if (/\b(crispr|cas9|gene|genetics|genome|grna|cleavage|transfection|biomolecule|biochemistry|protein|enzyme|lipid|dna|rna|amino acid|carbohydrate|glucose|nucleic|nucleotide|metabolism|atp|cell biology)\b/i.test(lower)) return "life_sciences_medicine";
  if (/\b(organic chemistry|functional group|alkane|alkene|polymer|titration|periodic table|spectroscopy|acid base|stoichiometry|enthalpy|gibbs)\b/i.test(lower)) return "chemistry";
  if (/\b(black hole|quantum|relativity|spacetime|astrophysics|electromagnetic|thermodynamics|entropy|optics|nuclear|fission|fusion|gravity|wave function)\b/i.test(lower)) return "physics";
  if (/\b(calculus|derivative|integral|matrix|linear algebra|eigenvalue|probability|statistics|normal distribution|differential equation|vector field)\b/i.test(lower)) return "mathematics";
  if (/\b(neural network|machine learning|deep learning|algorithm|data structure|database|cloud computing|cybersecurity|software|compiler|distributed)\b/i.test(lower)) return "cs_ai";
  if (/\b(robot|kinematics|circuit|semiconductor|renewable energy|structural|fluid dynamics|aerodynamics|fea|manufacturing|automation)\b/i.test(lower)) return "engineering";
  if (/\b(saudi|vision 2030|neom|kaimrc|riyadh|ksa|kingdom)\b/i.test(lower)) return "vision_2030";
  if (/\b(economics|market|supply demand|finance|investment|portfolio|gdp|inflation|business|management|strategy)\b/i.test(lower)) return "business_economics";
  return "general";
}

function visualFromEntry(entry: TopicImage): AcademicVisual {
  return {
    id: `match-${entry.keywords[0].replace(/\s+/g, "-")}`,
    discipline: entry.discipline,
    topic: entry.title,
    title: entry.title,
    caption: entry.caption,
    imageUrl: entry.imageUrl,
    tags: entry.keywords,
    visualType: entry.visualType,
  };
}

export function getAcademicVisualForSlide(
  slideNo: number,
  slideTitle?: string,
  slideContent?: string
): AcademicVisual {
  const titleLower = (slideTitle || "").toLowerCase();
  const combinedText = `${slideTitle || ""} ${slideContent || ""}`.toLowerCase();

  // Unified length-weighted scoring:
  //   - A specific multi-word TOPIC phrase in the TITLE is the strongest
  //     signal (e.g. "Guided Practice: Enzyme Kinetics" → enzyme visual).
  //   - A specific multi-word topic phrase in the BODY outranks a generic
  //     function label ("Real Case Study" + "double helix" → DNA visual).
  //   - A specific pedagogical function phrase in the TITLE ("Worked
  //     Example", "Prior Knowledge Check", "Misconceptions", "Decision
  //     Challenge"…) beats generic topic words like "biomolecule" scattered
  //     through the body — but a *generic* function phrase like "case study"
  //     stays weak so a strong topic in the body wins.
  //   - Single-word hits add their length.
  // Most points win; ties go to the earlier (more specific) entry.
  const TOPIC_TITLE_WEIGHT = 1000; // multi-word topic phrase in title
  const TOPIC_BODY_WEIGHT = 100;   // multi-word topic phrase in body
  const STRONG_FUNCTION_WEIGHT = 1000; // specific (≥12 char) function phrase in title
  const WEAK_FUNCTION_WEIGHT = 50;     // generic function phrase in title

  let best: TopicImage | null = null;
  let bestScore = 0;
  for (const entry of TOPIC_IMAGE_MAP) {
    let score = 0;
    for (const kw of entry.keywords) {
      const k = kw.toLowerCase();
      const multiWord = k.includes(" ");
      const inTitle = titleLower.includes(k);
      const inBody = combinedText.includes(k);
      if (entry.pedagogical) {
        if (inTitle && multiWord) {
          score += k.length * (k.length >= 12 ? STRONG_FUNCTION_WEIGHT : WEAK_FUNCTION_WEIGHT);
        } else if (inTitle || inBody) {
          score += k.length;
        }
      } else {
        if (inTitle && multiWord) score += k.length * TOPIC_TITLE_WEIGHT;
        else if (inBody && multiWord) score += k.length * TOPIC_BODY_WEIGHT;
        else if (inTitle || inBody) score += k.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (best && bestScore > 0) {
    return visualFromEntry(best);
  }

  const discipline = detectAcademicDiscipline(combinedText);
  const fallback = DISCIPLINE_FALLBACKS[discipline];
  return {
    id: `discipline-${discipline}-${slideNo}`,
    discipline,
    topic: fallback.title,
    title: fallback.title,
    caption: fallback.caption,
    imageUrl: fallback.imageUrl,
    tags: [discipline],
    visualType: "Academic Visual",
  };
}

// Legacy compatibility
export const UNIVERSAL_ACADEMIC_VISUALS: AcademicVisual[] = TOPIC_IMAGE_MAP.map((e, i) => ({
  id: `topic-${i}`,
  discipline: e.discipline,
  topic: e.title,
  title: e.title,
  caption: e.caption,
  imageUrl: e.imageUrl,
  tags: e.keywords,
  visualType: e.visualType,
}));
