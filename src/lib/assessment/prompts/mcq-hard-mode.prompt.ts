export const MCQ_HARD_MODE_PROMPT = `
============================================================
MCQ OPTION QUALITY ENGINE — HARD MODE
============================================================

Your job is to make the four answer options difficult, realistic,
professionally credible, and impossible to guess through superficial
patterns.

1. ALL OPTIONS MUST ANSWER THE TASK
Every option must directly respond to the actual task.
All four options should propose technically credible implementation strategies relevant to the scenario.
Each option should be something a competent professional could realistically consider.

2. ALL OPTIONS MUST BE DOMAIN-SPECIFIC
Options MUST use concepts from the selected specialization.
The option must feel like it was written specifically for the selected specialization.

3. MAKE ALL FOUR OPTIONS PROFESSIONALLY PLAUSIBLE
Do NOT create obviously stupid distractors.
Avoid options such as "Ignore the problem", "Do nothing", "Ask someone else".
Instead create sophisticated distractors based on REAL trade-offs.

4. USE COMPETING TRADE-OFFS
The strongest questions should contain options that represent competing professional priorities.
Examples: accuracy vs interpretability, speed vs reliability, cost vs performance.
Do NOT make the correct answer simply "the safest" or "the most detailed."

5. AVOID THE "LONGEST OPTION = CORRECT" PROBLEM
All four options must have approximately comparable depth.
Target approximately similar length and information density.
Do NOT artificially pad options just to reach the same word count.

6. DO NOT MAKE THE CORRECT ANSWER SOUND BETTER
Never use obviously superior language such as "best practice", "optimal", "comprehensive" only in the correct option.
The distractors should also sound professional.

7. DO NOT USE ABSOLUTE LANGUAGE AS A DISTRACTOR SIGNAL
Avoid making distractors obviously wrong through words such as "always", "never", "completely".

8. DISTRACTORS MUST HAVE A REASON WHY THEY ARE WRONG
Every incorrect option must contain a REAL professional trade-off or subtle flaw.

9. DO NOT CREATE TWO CORRECT ANSWERS
There must be ONE clearly superior answer when judged against the scenario, task, competency, and constraints.

10. CORRECT ANSWER MUST DEPEND ON THE SCENARIO
The correct option must be correct BECAUSE of the specific scenario.
The answer should depend on specific constraints, limitations, and risks.

11. DO NOT REPEAT THE TASK
Options should provide the actual decision/approach.

12. OPTIONS MUST BE MUTUALLY DISTINCT
A, B, C, and D must not be the same answer expressed differently.

13. USE HIGHER-ORDER REASONING
For difficult questions, options should require the candidate to reason through root causes, risks, and trade-offs.

14. SPECIALIZATION DIFFICULTY REQUIREMENT
The difficulty must match the selected specialization (e.g., transaction isolation for Database Systems).

15. NO GENERIC CROSS-SPECIALIZATION OPTIONS
Reject options containing generic professional statements like "Communicate with stakeholders" or "Analyze the situation".

16. OPTION STRUCTURE
For complex scenarios, each option should generally contain: ACTION + RATIONALE / APPROACH + RELEVANT TRADE-OFF.

17. DIFFICULTY LEVEL
Target: HARD / EXPERT. The four options should initially appear equally credible.

18. OPTION QUALITY SELF-TEST
Internally verify: Domain relevance, Scenario relevance, Professional plausibility, Technical correctness.
Reject the set if one option is much longer, or two options are effectively equivalent.

19. ANTI-GUESSING TEST
Can the answer be guessed because it is the longest? -> MUST PASS
Can the answer be guessed because other options are obviously bad? -> MUST PASS

FINAL RULE
The goal is NOT to make the options confusing. The goal is to make them EQUALLY CREDIBLE.
Generate professional-grade, high-difficulty MCQs suitable for a serious university/employability assessment.

====================================================
CRITICAL MCQ RULE — OPTION STRUCTURE
====================================================

The TASK determines the structure of the answer options.

If the task asks:
"Which set of questions..."
then EVERY option must be a complete SET of questions.

If the task asks:
"Which approach..."
then EVERY option must describe a complete approach.

If the task asks:
"Which strategy..."
then EVERY option must describe a complete strategy.

If the task asks:
"Which action should you take..."
then EVERY option must describe a complete action.

NEVER create a task asking for a set, strategy, plan, sequence,
framework, or approach and then provide options that are only
single sentences, isolated facts, or individual components.

The grammatical and logical structure of A, B, C and D must match
the structure requested by the TASK.

====================================================
OPTION PARALLELISM
====================================================

Before accepting an MCQ, verify:

A answers the task.
B answers the task.
C answers the task.
D answers the task.

All four must operate at the SAME LEVEL.

For example:

BAD:
Task: "Which implementation strategy is best?"

A: Use PostgreSQL.
B: Improve indexing.
C: Migrate to PostgreSQL, introduce read replicas, redesign the
   indexing strategy, establish transaction monitoring, and perform
   staged migration testing.
D: Ask the database administrator.

This is invalid because the options are different types of answers.

GOOD:
A: ...
B: ...
C: ...
D: ...

All four are complete implementation strategies.

====================================================
TASK-OPTION CONSISTENCY TEST
====================================================

Before saving an MCQ, ask the following:

1. What exactly is the task asking the student to choose?
2. What type of response does the task require?
3. Does A provide that type of response?
4. Does B provide that type of response?
5. Does C provide that type of response?
6. Does D provide that type of response?

If any answer is NO:

REJECT THE QUESTION AND REGENERATE THE OPTIONS.

====================================================
SCENARIO CONSISTENCY
====================================================

Every option must use ONLY concepts that are supported by the scenario
and task.

Do not introduce new entities, products, technologies, projects,
departments, objectives, or constraints that do not exist in the
scenario.

Example:

Scenario discusses:
CRM replacement.

INVALID option:
"budget for the automation upgrade"

because "automation upgrade" was never established.

Regenerate it.

====================================================
CORRECT ANSWER DISTRIBUTION
====================================================

Do not make the correct answer obvious because:

- it is the longest;
- it contains the most detail;
- it contains more technical terminology;
- it sounds more professional;
- it is the only complete sentence;
- it is the only option containing multiple actions.

All four options must have comparable depth and structure.

====================================================
DOMAIN REASONING
====================================================

The student must need knowledge of the selected specialization or
competency to identify the best answer.

Do not create questions where the student can simply recognize a
keyword.

For Sales Cycle:

Do not test:
"What does BANT stand for?"

Instead test:
- qualification judgment
- discovery sequencing
- buyer authority
- budget qualification
- business need
- timeline
- opportunity prioritization
- next-step selection
- objection handling
- buying signals
- stakeholder mapping

====================================================
FINAL MCQ REJECTION RULE
====================================================

REJECT and regenerate if:

- an option does not answer the task;
- options are different types of responses;
- an option introduces information absent from the scenario;
- the correct answer is obvious from length;
- the distractors are obviously bad;
- two options could reasonably be correct;
- the question tests memorization when the competency requires judgment;
- the student can answer without understanding the scenario;
- the task asks for a set/strategy/plan but options are individual actions.
`;
