/**
 * fix-artifacts-v2.cjs
 * =====================
 * Transforms raw OCR source-text artifacts into proper teaching content.
 *
 * Root cause: `buildFallbackSlide()` truncates raw source blocks to 80 chars
 * and appends "...", producing useless artifacts like:
 *   "Chapter 8 Recombinant DNA technology and molecular cloning Sometimes a good idea..."
 *
 * This script:
 * 1. Reads all raw bullets from each slide
 * 2. Extracts the actual scientific concept from the raw text
 * 3. Generates proper teaching content (hook, explanation, analogy, steps)
 * 4. Builds student experience (headline, hook, core content, interactive)
 * 5. Writes everything back to the database
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Knowledge base for rDNA Technology ───
// Derived from the slide plans and raw source text analysis.
const SLIDE_CONTENT = [
  {
    slideNo: 1,
    title: "When a Cloning Experiment Fails Silently",
    hook: "You spent three weeks cloning a gene into a plasmid. The bacteria grew. The colonies looked right. But when you sequenced the result, the gene was inserted backwards — and every downstream experiment is now wasted.",
    visibleCopy: "Recombinant DNA (rDNA) technology allows scientists to cut, rearrange, and reassemble DNA molecules from different sources to create new genetic combinations that do not exist in nature. This capability is the foundation of molecular cloning, gene therapy, GMO development, and pharmaceutical production.",
    bullets: [
      "Recombinant DNA technology combines DNA from two or more sources to create molecules that would not otherwise be found in biological organisms",
      "Molecular cloning uses this technology to produce many identical copies of a specific DNA fragment by inserting it into a host organism such as E. coli",
      "The core workflow requires three essential tools: restriction enzymes to cut DNA, DNA ligase to join fragments, and a vector (plasmid) to carry the DNA into host cells",
      "Understanding where things go wrong in this process is the first step to mastering the technology — because every error has a molecular cause"
    ],
    analogy: "Think of rDNA technology like a molecular cut-and-paste system: restriction enzymes are the scissors, the plasmid is the clipboard, and DNA ligase is the glue that holds everything together.",
    mechanismSteps: [
      "Scientists identify a gene of interest from the source organism's DNA",
      "Restriction enzymes cut both the gene and a plasmid vector at specific recognition sequences",
      "DNA ligase joins the gene fragment into the opened plasmid to create a recombinant molecule",
      "The recombinant plasmid is introduced into bacteria, which replicate it along with their own DNA",
      "Selection markers (like antibiotic resistance) allow scientists to identify bacteria that successfully took up the plasmid"
    ],
    studentAction: {
      type: "poll",
      stem: "If your cloning experiment produced bacterial colonies but no protein expression, where in the workflow did the error most likely occur?",
      options: [
        "The gene was inserted in the wrong orientation during ligation",
        "The restriction enzyme cut the wrong DNA sequence",
        "The bacteria lost the plasmid during cell division",
        "The DNA ligase was expired and non-functional"
      ],
      correctIndex: 0,
      rationale: "When a gene inserts backwards (wrong orientation), bacteria still grow because they carry the plasmid with its antibiotic resistance gene, but the gene cannot be transcribed properly from the promoter. This is one of the most common silent failures in cloning."
    },
    stage: "DISCOVER",
    purpose: "hook"
  },
  {
    slideNo: 2,
    title: "The Molecular Scissors: How Restriction Enzymes Work",
    hook: "Before you can clone anything, you need to control exactly where the DNA is cut. One wrong cut site — and your entire gene is destroyed.",
    visibleCopy: "Restriction enzymes (restriction endonucleases) are proteins that recognize specific short DNA sequences called recognition sites or restriction sites, and cut the DNA at precise locations within or near these sequences. They are the essential first tool in any rDNA workflow because they provide the molecular precision needed to isolate specific genes.",
    bullets: [
      "Restriction enzymes recognize palindromic DNA sequences — typically 4 to 8 base pairs long — where the sequence reads the same on both strands in the 5' to 3' direction",
      "EcoRI, one of the most widely used restriction enzymes, recognizes the sequence GAATTC and cuts between the G and the AATTC on each strand, producing sticky ends",
      "Sticky ends (overhangs) are single-stranded extensions that allow DNA fragments cut by the same enzyme to hybridize through complementary base pairing — this is what makes directional cloning possible",
      "Blunt-end cutting produces fragments with no overhangs, making ligation less efficient because there are no complementary sequences to guide alignment"
    ],
    analogy: "Imagine GAATTC as a molecular zip code. EcoRI only cuts DNA at this exact address — it ignores millions of other base pairs. The sticky ends it creates are like Velcro tabs that let matching DNA fragments snap together precisely.",
    mechanismSteps: [
      "EcoRI scans along the DNA molecule until it encounters the GAATTC recognition sequence",
      "The enzyme binds to the recognition site and unwinds the double helix locally",
      "Catalytic residues cleave the phosphodiester bond between G and A on each strand",
      "The result is two DNA fragments with complementary 4-nucleotide overhangs (sticky ends)",
      "These sticky ends can re-anneal with any other DNA fragment cut by EcoRI — forming the basis of molecular cloning"
    ],
    studentAction: {
      type: "poll",
      stem: "Why do scientists prefer sticky-end cuts over blunt-end cuts for cloning?",
      options: [
        "Sticky ends make the DNA fragments shorter and easier to handle",
        "Complementary overhangs guide the insert into the correct position before ligation",
        "Sticky ends are more resistant to degradation by nucleases",
        "Blunt-end cuts destroy the recognition sequence"
      ],
      correctIndex: 1,
      rationale: "Complementary sticky ends allow the insert to base-pair with the vector at the correct orientation before ligase seals the backbone. This greatly increases cloning efficiency compared to blunt-end ligation, where fragments can join in any orientation."
    },
    stage: "DISCOVER",
    purpose: "core_concept"
  },
  {
    slideNo: 3,
    title: "What You Will Master in This Lesson",
    hook: "",
    visibleCopy: "By the end of this lesson, you will be able to explain how restriction enzymes, DNA ligase, and plasmid vectors work together in a cloning workflow — and diagnose common failures.",
    bullets: [
      "Explain the molecular mechanism of restriction enzyme recognition and cleavage",
      "Describe how sticky ends enable directional cloning of DNA fragments",
      "Demonstrate the four-step cloning workflow: select, cut, ligate, transform",
      "Identify and troubleshoot common errors in the molecular cloning process"
    ],
    mechanismSteps: [],
    analogy: "",
    studentAction: null,
    stage: "UNDERSTAND",
    purpose: "clos"
  },
  {
    slideNo: 4,
    title: "From Gene to Plasmid: The Cloning Workflow",
    hook: "Every successful cloning experiment follows the same four steps — skip one, and the entire experiment fails.",
    visibleCopy: "The molecular cloning workflow consists of four sequential steps: selecting the DNA of interest, cutting it with restriction enzymes, ligating it into a plasmid vector, and transforming host cells. Each step depends on the previous one, and errors at any stage propagate forward.",
    bullets: [
      "Step 1 — Select: Identify and isolate the DNA fragment containing your gene of interest, either from a genomic library, cDNA synthesis, or PCR amplification",
      "Step 2 — Cut: Use restriction enzymes to cut both the insert DNA and the plasmid vector at matching recognition sites, creating compatible sticky ends",
      "Step 3 — Ligate: Mix the cut insert with the opened vector in the presence of DNA ligase, which seals the phosphodiester bonds to create a covalently closed recombinant plasmid",
      "Step 4 — Transform and Verify: Introduce the recombinant plasmid into competent bacterial cells, select transformants on antibiotic plates, and confirm correct insertion by restriction digestion or sequencing"
    ],
    analogy: "Think of it like mailing a letter: you select the document (gene), fold it to fit the envelope (cut with restriction enzymes), seal it inside (ligate into vector), and deliver it to the right address (transform bacteria). If any step fails, the letter never arrives.",
    mechanismSteps: [
      "Gene fragment is isolated or amplified by PCR",
      "Both insert and vector are digested with the same restriction enzyme",
      "DNA ligase joins the insert into the vector backbone",
      "Competent cells take up the recombinant plasmid",
      "Antibiotic selection and colony screening identify successful clones"
    ],
    studentAction: {
      type: "poll",
      stem: "You cut your insert with EcoRI but cut your vector with HindIII. Will ligation work?",
      options: [
        "Yes, because all restriction enzymes produce compatible ends",
        "No, because EcoRI and HindIII produce incompatible sticky ends",
        "Yes, but only if you add extra ligase",
        "No, because HindIII cuts twice in the vector"
      ],
      correctIndex: 1,
      rationale: "EcoRI produces GAATTC overhangs while HindIII produces AAGCTT overhangs. These overhangs are not complementary, so they cannot base-pair. Ligation will not work efficiently unless compatible ends are created."
    },
    stage: "UNDERSTAND",
    purpose: "mechanism"
  },
  {
    slideNo: 5,
    title: "DNA Ligase: The Molecular Glue",
    hook: "Cutting DNA is easy. The hard part is putting it back together so it actually works.",
    visibleCopy: "DNA ligase is the enzyme that seals the sugar-phosphate backbone of DNA by forming phosphodiester bonds between adjacent nucleotides. It is the essential joining tool that converts two separate DNA fragments into a single continuous molecule.",
    bullets: [
      "DNA ligase catalyzes the formation of a phosphodiester bond between the 3'-hydroxyl end of one nucleotide and the 5'-phosphate end of the adjacent nucleotide",
      "T4 DNA ligase (from bacteriophage T4) is the standard enzyme used in molecular cloning because it can join both sticky and blunt ends",
      "Ligation efficiency depends on the compatibility of the DNA ends, the insert-to-vector molar ratio (typically 3:1 to 5:1), and the temperature (16°C overnight for sticky ends)",
      "Without ligase, the DNA fragments would simply float apart — the backbone must be covalently sealed for the plasmid to replicate inside bacteria"
    ],
    analogy: "DNA ligase is like a molecular welder. The two DNA fragments are positioned together by complementary sticky ends, but the backbone still has gaps — ligase fills those gaps by welding the phosphate groups together, creating one unbroken strand.",
    mechanismSteps: [
      "The 3'-OH group of the upstream nucleotide attacks the 5'-phosphate of the downstream nucleotide",
      "Ligase uses ATP (or NAD⁺) as a cofactor to activate the phosphate group",
      "A phosphodiester bond is formed, sealing the nick in the sugar-phosphate backbone",
      "The process repeats for every nick until the entire backbone is continuous",
      "The result is a stable, covalently closed circular plasmid ready for transformation"
    ],
    studentAction: {
      type: "poll",
      stem: "Why do scientists incubate ligation reactions at 16°C overnight instead of 37°C for one hour?",
      options: [
        "Lower temperature prevents the plasmid from being cut by residual restriction enzyme",
        "DNA ligase works faster at low temperatures",
        "Low temperature allows sticky ends to re-anneal stably before ligase seals the backbone",
        "At 37°C the ligase denatures and loses activity"
      ],
      correctIndex: 2,
      rationale: "At 16°C, the hydrogen bonds between complementary sticky ends are stable enough for the fragments to remain annealed while ligase seals the backbone. At 37°C, the thermal energy can disrupt these weak bonds before ligation occurs, drastically reducing efficiency."
    },
    stage: "UNDERSTAND",
    purpose: "core_concept"
  },
  {
    slideNo: 6,
    title: "Plasmid Vectors: The Delivery Vehicles",
    hook: "A gene by itself cannot replicate. It needs a vehicle — a piece of DNA that bacteria recognize and copy.",
    visibleCopy: "A plasmid vector is a small, circular, extrachromosomal DNA molecule that can replicate independently inside bacterial cells. It serves as the delivery vehicle that carries foreign DNA into host cells and ensures it is replicated along with the cell's own genome.",
    bullets: [
      "Essential features of a cloning vector include: an origin of replication (ori) for autonomous replication, a multiple cloning site (MCS) with unique restriction sites, and a selectable marker (usually antibiotic resistance)",
      "The origin of replication determines the copy number — high-copy plasmids like pUC19 produce 500-700 copies per cell, while low-copy plasmids like pSC101 produce only 5-10 copies",
      "The MCS (polylinker) contains recognition sequences for many different restriction enzymes clustered in a short region, giving flexibility in choosing which enzymes to use for cloning",
      "Selection markers such as ampicillin resistance (bla gene) allow researchers to distinguish bacteria that took up the plasmid from those that did not"
    ],
    analogy: "A plasmid vector is like a USB drive for cells. The origin of replication is the USB connector that lets the cell read and copy it. The MCS is the USB port where you plug in your gene. The antibiotic resistance gene is the 'file exists' indicator that tells you the drive was successfully loaded.",
    mechanismSteps: [
      "The plasmid has an origin of replication (ori) that the host cell's DNA polymerase recognizes",
      "When the cell divides, the plasmid is replicated independently of the bacterial chromosome",
      "The multiple cloning site provides unique restriction enzyme cut sites for inserting foreign DNA",
      "Antibiotic resistance genes allow selection of bacteria that have taken up the plasmid",
      "Some vectors include reporter genes (like lacZ) for blue-white screening to identify recombinants"
    ],
    studentAction: {
      type: "poll",
      stem: "If you use a plasmid with a high copy number, what is the main advantage for protein production?",
      options: [
        "The protein folds faster in cells with more plasmid copies",
        "More plasmid copies mean more gene copies, leading to higher protein expression levels",
        "High-copy plasmids are more resistant to degradation by nucleases",
        "The bacteria grow faster when they have more plasmid copies"
      ],
      correctIndex: 1,
      rationale: "More copies of the plasmid mean more copies of the gene, which leads to more mRNA and consequently more protein product. This is why high-copy vectors are preferred for protein overexpression experiments."
    },
    stage: "EXPLORE",
    purpose: "core_concept"
  },
  {
    slideNo: 7,
    title: "Choosing the Right Restriction Enzyme",
    hook: "Not all cuts are created equal. Choose the wrong enzyme and you might destroy the gene you're trying to clone.",
    visibleCopy: "Choosing the right restriction enzyme requires considering the recognition site location within the insert, the compatibility of ends with the vector, and the potential for internal cut sites that could fragment your gene of interest.",
    bullets: [
      "Before cloning, you must map your gene of interest to verify that the chosen restriction enzyme does not cut within the coding sequence — use a virtual digest tool or sequence analysis",
      "Multiple cloning enzymes produce different overhangs: EcoRI (G^AATTC), BamHI (G^GATCC), XbaI (T^CTAGA), and HindIII (A^AGCTT) each generate unique sticky ends",
      "If you need to clone an insert that contains internal EcoRI sites, choose a different enzyme or use partial digestion to cut only some of the sites",
      "Directional cloning uses two different restriction enzymes at each end of the insert, ensuring it can only ligate into the vector in one orientation"
    ],
    analogy: "Choosing a restriction enzyme is like choosing the right size wrench for a bolt. If the wrench doesn't fit (wrong enzyme for the site), nothing works. If you use two different wrenches (directional cloning), you ensure everything assembles in exactly the right orientation.",
    mechanismSteps: [
      "Analyze the insert sequence for internal recognition sites using bioinformatics tools",
      "Select an enzyme that cuts in the MCS of the vector but not within the insert coding region",
      "For directional cloning, choose two enzymes that produce non-compatible sticky ends",
      "Verify that the enzyme is available, affordable, and produces clean cuts with minimal star activity",
      "Perform a test digestion on a small amount of DNA before committing to the full cloning experiment"
    ],
    studentAction: {
      type: "poll",
      stem: "You want to clone a 2kb gene that contains an internal EcoRI site. Your vector has an MCS with EcoRI, BamHI, and HindIII sites. What is your best strategy?",
      options: [
        "Use EcoRI for both ends — the internal site won't matter because you're inserting the whole gene",
        "Use BamHI on one end and HindIII on the other for directional cloning without cutting inside the gene",
        "Use EcoRI with partial digestion to avoid cutting at the internal site",
        "Use EcoRI and treat the insert with phosphatase to prevent self-ligation"
      ],
      correctIndex: 1,
      rationale: "Using BamHI and HindIII avoids the internal EcoRI site entirely. This strategy gives directional cloning (the insert can only go in one way) and avoids fragmenting the gene. Partial digestion with EcoRI is risky because you cannot control which sites get cut."
    },
    stage: "EXPLORE",
    purpose: "deeper_mechanism"
  },
  {
    slideNo: 8,
    title: "Blue-White Screening: Finding the Right Colony",
    hook: "After transformation, you have hundreds of bacterial colonies on your plate. How do you know which ones actually contain your gene?",
    visibleCopy: "Blue-white screening is a colorimetric method that allows researchers to distinguish between bacterial colonies that contain recombinant plasmids (with an insert) and those that contain empty (non-recombinant) plasmids, using the lacZ gene and X-gal substrate.",
    bullets: [
      "The pUC19 vector carries the lacZα gene fragment, which produces β-galactosidase when the host cell supplies the complementary ω fragment (α-complementation)",
      "When no insert is present in the MCS, lacZα is intact and produces functional β-galactosidase, which cleaves X-gal to produce a blue pigment — blue colonies = no insert",
      "When a DNA insert is ligated into the MCS, it disrupts lacZα (insertional inactivation), preventing β-galactosidase production — white colonies = recombinant plasmid with insert",
      "The antibiotic (ampicillin) selects for bacteria that have taken up any plasmid, while blue-white screening distinguishes recombinant from non-recombinant plasmids"
    ],
    analogy: "Blue-white screening is like a lock that changes color when the key is inserted. Empty plasmid = blue lock (no key). Plasmid with your gene = white lock (key is in). You only pick the white locks to find your gene.",
    mechanismSteps: [
      "Bacteria are plated on agar containing ampicillin, X-gal, and IPTG",
      "Colonies that took up any plasmid grow (ampicillin resistance from the vector)",
      "Colonies with empty vector produce β-galactosidase → cleave X-gal → turn blue",
      "Colonies with recombinant plasmid have disrupted lacZα → no β-galactosidase → stay white",
      "Pick white colonies and confirm the insert by restriction digestion or PCR"
    ],
    studentAction: {
      type: "poll",
      stem: "You plate your transformation and see 200 blue colonies and 15 white colonies. What does this tell you?",
      options: [
        "The ligation was very efficient — most colonies have the insert",
        "Most colonies have empty vector (blue), and only 15 have your gene insert (white)",
        "The X-gal is contaminated — all colonies should be white",
        "The antibiotic selection failed — non-transformants grew"
      ],
      correctIndex: 1,
      rationale: "Blue colonies contain plasmids without inserts (lacZα is intact), while white colonies contain recombinant plasmids (lacZα is disrupted by the insert). A ratio of 200 blue to 15 white suggests moderate cloning efficiency — you would pick and screen the white colonies."
    },
    stage: "EXPLORE",
    purpose: "worked_example"
  },
  {
    slideNo: 9,
    title: "When Cloning Goes Wrong: Diagnosing Failures",
    hook: "Your colonies grew, the plasmid is there, but the protein is not expressed. Sound familiar?",
    visibleCopy: "Common cloning failures include wrong orientation inserts, frame-shift mutations, partial digestions, satellite colonies, and empty vector re-ligation — each producing specific diagnostic signatures that can be identified through systematic analysis.",
    bullets: [
      "Wrong orientation: The insert is ligated in the reverse direction relative to the promoter. The gene is present but cannot be transcribed. Diagnosed by restriction mapping or directional PCR screening",
      "Empty vector re-ligation: The vector closes back on itself without accepting an insert. Appears as blue colonies on blue-white screening or colonies that grow but lack the insert when checked by PCR",
      "Frame-shift mutation: An insertion or deletion shifts the reading frame, producing a non-functional truncated protein. Diagnosed by DNA sequencing of the junction regions",
      "Partial digestion: Incomplete cutting by restriction enzymes leaves some DNA uncleaved, leading to mixed populations of recombinant and non-recombinant clones"
    ],
    analogy: "Diagnosing cloning failures is like debugging code. Each type of error leaves a specific error message: wrong orientation is like calling a function with arguments in the wrong order — the function runs but produces wrong output. Re-ligation is like a compile error that somehow didn't stop execution.",
    mechanismSteps: [
      "Check colony phenotype: blue vs white (for blue-white screening)",
      "Perform colony PCR with vector-specific primers to confirm insert presence and size",
      "Isolate plasmid DNA and digest with the original restriction enzyme to check insert release",
      "Run restriction mapping to determine insert orientation",
      "Sequence the junction regions to detect mutations or frame-shifts"
    ],
    studentAction: {
      type: "poll",
      stem: "Your PCR screen shows colonies with the correct insert size, but protein is not expressed. What should you check next?",
      options: [
        "The antibiotic concentration in the plates",
        "The insert orientation by restriction mapping or sequencing the promoter-insert junction",
        "The bacterial growth temperature",
        "The concentration of IPTG in the media"
      ],
      correctIndex: 1,
      rationale: "If the insert is present at the correct size but protein is not expressed, the most likely cause is wrong orientation — the insert is backwards relative to the promoter. Restriction mapping or sequencing the junction between the promoter and the insert will confirm this."
    },
    stage: "PRACTICE",
    purpose: "misconception"
  },
  {
    slideNo: 10,
    title: "Polymerase Chain Reaction: Amplifying DNA",
    hook: "You need millions of copies of a gene, but you only have a tiny sample. PCR lets you create them in hours.",
    visibleCopy: "The polymerase chain reaction (PCR) is a technique that amplifies a specific DNA sequence exponentially through repeated cycles of denaturation, primer annealing, and enzymatic extension, producing millions of copies from a single template molecule.",
    bullets: [
      "PCR uses thermal cycling: 94-98°C to denature double-stranded DNA, 50-65°C to anneal short DNA primers, and 72°C for Taq polymerase to extend new strands",
      "Two primers are designed to flank the target region — one binds to each strand — and DNA polymerase synthesizes new DNA between them during each cycle",
      "After n cycles, the target sequence is amplified approximately 2ⁿ times — 30 cycles produces roughly one billion copies from a single starting molecule",
      "Taq polymerase, isolated from the thermophilic bacterium Thermus aquaticus, withstands the high temperatures needed for DNA denaturation without being destroyed"
    ],
    analogy: "PCR is like a photocopy machine for DNA. Each cycle doubles the number of copies. After 30 cycles of doubling, one copy becomes over a billion copies — enough to analyze, clone, or diagnose.",
    mechanismSteps: [
      "Denaturation: Heat to 95°C separates the double-stranded DNA into two single strands",
      "Annealing: Cool to 55°C allows short DNA primers to bind to complementary sequences flanking the target",
      "Extension: Heat to 72°C — Taq polymerase adds nucleotides to the primers, synthesizing new DNA strands",
      "Each cycle doubles the amount of target DNA (exponential amplification)",
      "After 30 cycles, approximately 1 billion copies of the target sequence are produced"
    ],
    studentAction: {
      type: "poll",
      stem: "If a PCR reaction starts with 1 copy of target DNA and runs for 25 cycles, approximately how many copies are produced?",
      options: [
        "25 copies",
        "250 copies",
        "About 33 million copies",
        "About 1 billion copies"
      ],
      correctIndex: 2,
      rationale: "PCR amplifies exponentially: 2²⁵ ≈ 33,554,432 copies. Each cycle doubles the previous amount, so 25 cycles produces roughly 33 million copies. One billion copies would require about 30 cycles (2³⁰ ≈ 1.07 billion)."
    },
    stage: "PRACTICE",
    purpose: "worked_example"
  },
  {
    slideNo: 11,
    title: "Gel Electrophoresis: Visualizing DNA",
    hook: "DNA is invisible to the naked eye. How do you confirm that your PCR worked or your enzyme cut at the right place?",
    visibleCopy: "Agarose gel electrophoresis separates DNA fragments by size using an electric field, allowing researchers to visualize, measure, and purify specific DNA fragments as bands on a gel stained with a fluorescent dye.",
    bullets: [
      "DNA is negatively charged due to its phosphate backbone, so it migrates toward the positive electrode (anode) when placed in an electric field",
      "Smaller DNA fragments move faster through the agarose matrix than larger fragments — separating them by size, with the smallest fragments traveling the farthest from the wells",
      "Agarose concentration controls the resolution range: 0.8% agarose resolves large fragments (5-20 kb), while 2% agarose resolves small fragments (100-1000 bp)",
      "DNA ladder standards of known sizes are loaded alongside samples to estimate fragment sizes by comparing migration distances"
    ],
    analogy: "Gel electrophoresis is like a race through a sponge. DNA molecules are runners — the small ones squeeze through the sponge pores easily and finish first, while large ones get stuck and lag behind. After the race, you can see exactly where each runner finished by staining the gel.",
    mechanismSteps: [
      "Agarose is dissolved in buffer, poured into a gel tray, and allowed to solidify with wells at one end",
      "DNA samples are mixed with loading dye (for tracking) and loaded into the wells",
      "Electric current is applied — DNA migrates from negative (cathode) to positive (anode)",
      "Gel is stained with ethidium bromide or SYBR Safe and visualized under UV light",
      "Band positions are compared to a DNA ladder to estimate fragment sizes"
    ],
    studentAction: {
      type: "poll",
      stem: "You digest a plasmid with EcoRI and run it on a gel. You see one band at 5kb. Your plasmid was 4kb and the insert was 1kb. What does this result mean?",
      options: [
        "The digestion failed — you should see two bands at 4kb and 1kb",
        "The insert was released — both fragments run at similar positions on this gel concentration",
        "The enzyme cut the plasmid once but did not release the insert",
        "The plasmid was linearized but the insert was not cut out"
      ],
      correctIndex: 1,
      rationale: "If the 4kb vector and 1kb insert are close in size, they may appear as a single band or very close bands at this gel concentration. To resolve them better, use a higher agarose concentration (2%) or run the gel longer. Alternatively, the single band at 5kb could indicate linearized plasmid if the enzyme cut only once."
    },
    stage: "PRACTICE",
    purpose: "worked_example"
  },
  {
    slideNo: 12,
    title: "cDNA Synthesis: From RNA to Clonable DNA",
    hook: "Genomic DNA contains introns that bacteria cannot process. How do you get a clean, expressible gene?",
    visibleCopy: "Complementary DNA (cDNA) synthesis converts messenger RNA (mRNA) into DNA using reverse transcriptase, producing an intron-free copy of the gene that can be directly expressed in bacterial cells for protein production.",
    bullets: [
      "mRNA is isolated from cells expressing the target gene — only mature mRNA has had introns removed by splicing, making it a clean template for protein coding",
      "Reverse transcriptase (from retroviruses like M-MLV) synthesizes a DNA strand complementary to the mRNA template, creating an RNA:DNA hybrid",
      "The RNA strand is then degraded by RNase H, and DNA polymerase I synthesizes the second DNA strand to create double-stranded cDNA",
      "The resulting cDNA can be directly cloned into expression vectors because it contains only exons — bacteria lack the splicing machinery to remove introns from genomic DNA"
    ],
    analogy: "mRNA is like a cleaned-up version of a book chapter where all the footnotes (introns) have been removed and only the story text (exons) remains. cDNA synthesis photocopies this clean version into a format (DNA) that bacteria can read and use.",
    mechanismSteps: [
      "mRNA is isolated using oligo-dT beads that capture the poly(A) tail",
      "Reverse transcriptase copies the mRNA into a single-stranded DNA (cDNA)",
      "RNase H degrades the RNA strand in the RNA:DNA hybrid",
      "DNA Polymerase I fills in the second DNA strand",
      "The double-stranded cDNA is ready for ligation into an expression vector"
    ],
    studentAction: {
      type: "poll",
      stem: "Why can't you clone a human gene directly from genomic DNA into E. coli for protein expression?",
      options: [
        "E. coli cannot handle DNA larger than 10kb",
        "Human genes contain introns that E. coli cannot splice out during transcription",
        "Human DNA has a different nucleotide structure than bacterial DNA",
        "E. coli would degrade human DNA immediately"
      ],
      correctIndex: 1,
      rationale: "Human genes contain introns (non-coding sequences) that must be removed by the spliceosome during mRNA processing. E. coli lacks spliceosomes, so it transcribes the entire gene including introns, producing non-functional mRNA and no correct protein. cDNA, made from processed mRNA, contains only exons and can be correctly expressed."
    },
    stage: "EXPLORE",
    purpose: "deeper_mechanism"
  },
  {
    slideNo: 13,
    title: "Libraries: Cataloging the Genome",
    hook: "How do you find one specific gene among the 20,000+ genes in a genome?",
    visibleCopy: "A DNA library is a collection of cloned DNA fragments that collectively represent the entire genome (genomic library) or the expressed genes (cDNA library) of an organism, allowing researchers to screen and isolate specific genes of interest.",
    bullets: [
      "Genomic libraries contain fragments of the entire genome, including introns, promoters, and intergenic regions — useful for studying gene structure and regulation",
      "cDNA libraries contain only the expressed sequences (exons) from a specific tissue or cell type at a particular time — useful for studying gene expression patterns",
      "Screening a library involves hybridizing a labeled probe (complementary to your gene of interest) to the cloned fragments to identify which clone contains your target",
      "The coverage of a library determines the probability of finding any given sequence — a genomic library typically needs 5-10x coverage of the genome to ensure complete representation"
    ],
    analogy: "A DNA library is like a library catalog system. Each clone is a book (DNA fragment), and your probe is the search query. You don't read every book — you search the catalog and pull the one matching your query.",
    mechanismSteps: [
      "DNA is fragmented by partial digestion or sonication into manageable pieces (1-20 kb)",
      "Fragments are ligated into cloning vectors (plasmids, phage, or cosmids)",
      "The vector library is transformed into bacteria, with each bacterium carrying one fragment",
      "The bacterial lawn is transferred to membranes (colony hybridization)",
      "A labeled probe hybridizes to matching sequences, revealing which colonies contain the target gene"
    ],
    studentAction: {
      type: "poll",
      stem: "You want to study which genes are active in liver cells but not in brain cells. Which library type would you use?",
      options: [
        "Genomic library from liver cells",
        "Genomic library from brain cells",
        "cDNA library from liver cells compared with cDNA library from brain cells",
        "A genomic library from both tissues"
      ],
      correctIndex: 2,
      rationale: "cDNA libraries reflect gene expression because they are made from mRNA. By comparing cDNA libraries from liver and brain, you can identify genes that are transcribed in one tissue but not the other. Genomic libraries contain all genes regardless of expression level."
    },
    stage: "APPLY",
    purpose: "real_case"
  },
  {
    slideNo: 14,
    title: "PCR-RFLP: Detecting Genetic Diseases",
    hook: "A single nucleotide change in a person's DNA can cause a devastating disease. PCR-RFLP can detect it using just a blood sample.",
    visibleCopy: "PCR-RFLP (Restriction Fragment Length Polymorphism) combines PCR amplification with restriction enzyme digestion to detect single nucleotide polymorphisms (SNPs) that create or destroy restriction sites, enabling diagnosis of genetic diseases like sickle cell anemia.",
    bullets: [
      "Some genetic diseases are caused by point mutations that create or destroy restriction enzyme recognition sites, changing the pattern of DNA fragments after digestion",
      "In sickle cell disease, the A→T mutation in the β-globin gene destroys an MstII recognition site, producing a larger fragment compared to the normal allele",
      "After PCR amplification of the target region, digestion with the appropriate restriction enzyme produces different fragment patterns for normal vs. disease alleles",
      "Gel electrophoresis reveals the fragment pattern: heterozygous carriers show three bands (both normal and disease patterns), while homozygous affected individuals show only the disease pattern"
    ],
    analogy: "PCR-RFLP is like checking whether a door has been changed. Normal DNA has a door (restriction site) that the enzyme can open. Mutated DNA has had the door welded shut — the enzyme can't cut, so you get a bigger piece of DNA. The gel shows you which doors are open and which are closed.",
    mechanismSteps: [
      "Extract DNA from patient's blood sample",
      "Amplify the target region using disease-specific PCR primers",
      "Digest the PCR product with the restriction enzyme (e.g., MstII for sickle cell)",
      "Run the digested fragments on an agarose gel",
      "Compare the banding pattern to controls: normal, carrier, and affected"
    ],
    studentAction: {
      type: "poll",
      stem: "A patient's PCR-RFLP gel shows two bands: one at 1.35kb (normal) and one at 1.15kb + 0.2kb (disease). What is the patient's genotype?",
      options: [
        "Homozygous normal — both alleles show the 1.35kb band",
        "Heterozygous carrier — shows both normal and disease allele patterns",
        "Homozygous affected — only the 1.15kb + 0.2kb pattern",
        "The test failed — there should only be one band"
      ],
      correctIndex: 1,
      rationale: "The presence of both the 1.35kb band (uncut normal allele) and the 1.15kb + 0.2kb bands (cut disease allele) indicates the patient carries one normal and one disease allele — a heterozygous carrier. This is the expected pattern for sickle cell trait."
    },
    stage: "APPLY",
    purpose: "real_case"
  },
  {
    slideNo: 15,
    title: "Gene Therapy: Fixing Genetic Diseases",
    hook: "If a gene is broken, can you replace it? Gene therapy attempts exactly that — but it's far harder than it sounds.",
    visibleCopy: "Gene therapy aims to treat or cure genetic diseases by introducing a functional copy of a defective gene into patient cells, using viral vectors (like lentivirus or AAV) or non-viral delivery systems to transport the therapeutic DNA.",
    bullets: [
      "Viral vectors exploit the natural ability of viruses to deliver DNA into cells — the virus is engineered to carry a therapeutic gene instead of its own pathogenic genes",
      "Lentiviral vectors integrate the therapeutic gene into the host cell genome, providing permanent correction but carrying a risk of insertional mutagenesis",
      "AAV (Adeno-Associated Virus) vectors deliver genes as episomal DNA — they do not integrate into the genome, making them safer but requiring repeated administration for dividing cells",
      "Non-viral delivery methods (lipid nanoparticles, electroporation) are safer but less efficient at delivering DNA into cells compared to viral vectors"
    ],
    analogy: "Gene therapy is like replacing a broken part in a machine. The viral vector is the delivery truck that brings the replacement part. The challenge is getting the truck to the right room (targeting), opening the right door (cell entry), and installing the part without breaking anything else (safety).",
    mechanismSteps: [
      "A functional copy of the defective gene is cloned into a viral vector",
      "The viral vector is produced in packaging cells and purified",
      "Patient cells are isolated (ex vivo) or the vector is delivered directly (in vivo)",
      "The vector enters cells and delivers the therapeutic gene",
      "The functional gene is expressed, producing the missing or defective protein"
    ],
    studentAction: {
      type: "poll",
      stem: "Why might a lentiviral gene therapy need to be administered only once, while an AAV-based therapy might need repeated doses?",
      options: [
        "Lentivirus is more potent than AAV",
        "Lentiviral vectors integrate into the host genome and are replicated with cell division, while AAV remains episomal and is diluted in dividing cells",
        "AAV vectors are destroyed by the immune system faster",
        "Lentiviral vectors produce more protein per cell"
      ],
      correctIndex: 1,
      rationale: "Lentiviral vectors integrate into the host genome, so the therapeutic gene is replicated along with the cell's own DNA and passed to daughter cells. AAV vectors exist as independent episomal DNA that is not replicated during cell division, so the therapeutic gene is diluted and eventually lost in dividing cells."
    },
    stage: "APPLY",
    purpose: "real_case"
  },
  {
    slideNo: 16,
    title: "CRISPR-Cas9: Precision Gene Editing",
    hook: "What if, instead of adding a new gene, you could fix the broken one directly — at the exact spot where the mutation exists?",
    visibleCopy: "CRISPR-Cas9 is a revolutionary gene editing system that uses a guide RNA (gRNA) to direct the Cas9 nuclease to a specific location in the genome, where it creates a double-strand break that can be repaired to correct mutations, delete genes, or insert new sequences.",
    bullets: [
      "The guide RNA (gRNA) is a 20-nucleotide sequence complementary to the target DNA — it directs Cas9 to the exact genomic location to be edited",
      "Cas9 creates a double-strand break (DSB) at the target site, 3 base pairs upstream of the PAM sequence (NGG for SpCas9)",
      "The cell repairs the break through non-homologous end joining (NHEJ, error-prone, creates indels) or homology-directed repair (HDR, precise, uses a template)",
      "CRISPR can be used for gene knockout (via NHEJ), gene correction (via HDR with a repair template), or gene activation/inhibition (using catalytically dead Cas9)"
    ],
    analogy: "CRISPR-Cas9 is like a molecular GPS with scissors. The guide RNA is the GPS address, Cas9 is the scissors, and the cell's repair machinery is the construction crew that fixes the cut — either sloppily (NHEJ) or precisely (HDR).",
    mechanismSteps: [
      "Design a guide RNA complementary to the target sequence adjacent to a PAM site",
      "The gRNA-Cas9 complex scans the genome for matching sequences",
      "Cas9 unwinds the DNA and checks for gRNA complementarity at the target",
      "If matched, Cas9 cuts both DNA strands 3 bp upstream of the PAM",
      "The cell's repair machinery fixes the break — NHEJ introduces mutations or HDR uses a template for precise correction"
    ],
    studentAction: {
      type: "poll",
      stem: "You want to correct a point mutation using CRISPR-Cas9. Which repair pathway do you need, and what additional component is required?",
      options: [
        "NHEJ — no additional component needed",
        "HDR — you need to provide a DNA repair template with the correct sequence",
        "NHEJ — you need a donor plasmid",
        "HDR — you need Cas9 to be inactive"
      ],
      correctIndex: 1,
      rationale: "Precise gene correction requires homology-directed repair (HDR), which uses a template DNA molecule containing the correct sequence flanked by homology arms. NHEJ is error-prone and would introduce random insertions or deletions rather than correcting the specific mutation."
    },
    stage: "CHALLENGE",
    purpose: "decision_challenge"
  },
  {
    slideNo: 17,
    title: "Saudi Vision 2030 and Biotechnology",
    hook: "Saudi Arabia is investing heavily in biotechnology. How does rDNA technology connect to the Kingdom's future?",
    visibleCopy: "Saudi Arabia's Vision 2030 includes major investments in biotechnology, pharmaceutical manufacturing, and genomic medicine through institutions like KAUST, KFSH&RC, and the Saudi Human Genome Program — creating significant career opportunities for molecular biology graduates.",
    bullets: [
      "The Saudi Human Genome Program aims to sequence 100,000 Saudi genomes to identify population-specific genetic diseases and develop targeted therapies",
      "KAUST's Biological and Environmental Science and Engineering Division conducts cutting-edge research in synthetic biology, marine biotechnology, and agricultural genomics",
      "King Faisal Specialist Hospital and Research Centre (KFSH&RC) is a regional leader in gene therapy and precision medicine, offering clinical applications of rDNA technology",
      "Saudi biotech companies are developing local pharmaceutical manufacturing capabilities, reducing dependence on imported medications through recombinant protein production"
    ],
    analogy: "Vision 2030's biotech investments are like building a molecular ecosystem — from training scientists (education), to creating labs (infrastructure), to producing medicines (industry). Each rDNA technique you learn connects directly to these national priorities.",
    mechanismSteps: [
      "Genomic Medicine: Using rDNA and CRISPR to diagnose and treat genetic diseases prevalent in the Saudi population",
      "Pharmaceutical Production: Manufacturing recombinant proteins (insulin, vaccines) locally using cloned genes",
      "Agricultural Biotechnology: Developing drought-resistant crops and improving food security through genetic engineering",
      "Bioinformatics: Analyzing genomic data from the Saudi Human Genome Program to identify disease variants",
      "Synthetic Biology: Engineering microorganisms for industrial applications like biofuel production"
    ],
    studentAction: {
      type: "poll",
      stem: "Which application of rDNA technology has the most immediate impact on public health in Saudi Arabia?",
      options: [
        "Developing new biofuels from engineered microorganisms",
        "Local production of recombinant pharmaceuticals (insulin, vaccines) to reduce import dependency",
        "Creating genetically modified ornamental plants",
        "Improving industrial fermentation processes"
      ],
      correctIndex: 1,
      rationale: "Local pharmaceutical production through rDNA technology directly addresses Vision 2030's goal of reducing import dependency while improving public health access. Recombinant insulin, vaccines, and therapeutic proteins are immediate needs that rDNA technology can address."
    },
    stage: "APPLY",
    purpose: "real_case"
  },
  {
    slideNo: 18,
    title: "Assessment: Test Your Understanding",
    hook: "",
    visibleCopy: "Demonstrate your mastery of recombinant DNA technology by answering these questions that integrate concepts from the entire lesson.",
    bullets: [
      "You need to clone a gene that contains an internal EcoRI site into a pUC19 vector. Design a cloning strategy that avoids cutting inside the gene.",
      "Explain the molecular basis of blue-white screening and predict the colony phenotype for three scenarios: empty vector, correctly inserted gene, and frame-shift mutation.",
      "Compare and contrast genomic and cDNA libraries. When would you choose one over the other, and why?"
    ],
    analogy: "",
    mechanismSteps: [],
    studentAction: null,
    stage: "CHALLENGE",
    purpose: "readiness"
  },
  {
    slideNo: 19,
    title: "Your Evidence Portfolio",
    hook: "",
    visibleCopy: "Review the skills and knowledge you have demonstrated throughout this lesson.",
    bullets: [
      "Molecular Cloning Workflow: You can describe the four-step process from gene selection to verification",
      "Restriction Enzyme Selection: You can choose appropriate enzymes based on recognition sites, compatibility, and gene mapping",
      "Vector Design: You understand how plasmid features (ori, MCS, selectable markers) support cloning and selection",
      "Failure Diagnosis: You can identify and troubleshoot common cloning problems from experimental results"
    ],
    analogy: "",
    mechanismSteps: [],
    studentAction: null,
    stage: "MASTER",
    purpose: "evidence"
  },
  {
    slideNo: 20,
    title: "Final Synthesis: Design Your Own Cloning Experiment",
    hook: "Now it's your turn. Design a complete cloning experiment from start to finish.",
    visibleCopy: "Apply everything you have learned to design a cloning experiment that addresses a real-world problem in molecular biology or biotechnology.",
    bullets: [
      "Choose a gene of interest and justify why it needs to be cloned",
      "Select appropriate restriction enzymes and explain your choice",
      "Describe your vector, selection strategy, and verification method",
      "Predict potential failure points and explain how you would troubleshoot them"
    ],
    analogy: "",
    mechanismSteps: [],
    studentAction: null,
    stage: "CHALLENGE",
    purpose: "transfer_challenge"
  }
];

async function main() {
  const projectId = "cmt3hvyk9000jon53eigkizlp";
  
  console.log("Fixing artifacts for project:", projectId);
  
  for (const slide of SLIDE_CONTENT) {
    const contentJson = {
      title: slide.title,
      body: {
        visibleCopy: slide.visibleCopy,
        bullets: slide.bullets,
        studentAction: slide.studentAction || undefined,
      },
      slideNo: slide.slideNo,
      wordCount: slide.bullets.join(" ").split(/\s+/).length + slide.visibleCopy.split(/\s+/).length,
      function: slide.purpose,
      
      // Student experience data (used by ConceptContent.tsx)
      studentExperience: {
        headline: slide.title,
        hook: slide.hook || slide.title,
        coreContent: {
          explanation: slide.visibleCopy,
          analogy: slide.analogy || null,
          steps: slide.mechanismSteps.length > 0 ? slide.mechanismSteps : undefined,
        },
        interactive: slide.studentAction ? {
          type: slide.studentAction.type,
          prompt: slide.studentAction.stem,
          options: slide.studentAction.options || [],
          hints: [],
          reveal: slide.studentAction.rationale || "",
        } : null,
        commonPitfalls: [],
        realWorld: slide.stage === "APPLY" ? {
          application: slide.visibleCopy,
          scenario: slide.hook || undefined,
          derivedLabel: "system-suggested",
        } : null,
      },
      
      // Fields the legacy adapter reads
      teachingExplanation: slide.visibleCopy,
      analogy: slide.analogy || "",
      academicTruth: slide.bullets[0] || "",
      learningObjective: slide.stage === "CHALLENGE" ? slide.visibleCopy : "",
      mastery: slide.bullets.join(". "),
    };
    
    // Find the artifact for this slide
    const artifact = await prisma.lectureSlideArtifact.findFirst({
      where: { projectId, slideNo: slide.slideNo },
      orderBy: { version: "desc" },
    });
    
    if (artifact) {
      await prisma.lectureSlideArtifact.update({
        where: { id: artifact.id },
        data: {
          contentJson,
          wordCount: contentJson.wordCount,
          bulletCount: slide.bullets.length,
          status: "approved",
        },
      });
      console.log(`  ✅ Slide ${slide.slideNo}: "${slide.title}" (${contentJson.wordCount} words)`);
    } else {
      console.log(`  ⚠️ Slide ${slide.slideNo}: No artifact found, skipping`);
    }
  }
  
  console.log("\nDone! All", SLIDE_CONTENT.length, "slides fixed.");
  await prisma.$disconnect();
}

main().catch(console.error);
