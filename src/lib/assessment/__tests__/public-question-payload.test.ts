/**
 * Unit tests for candidate-facing question/option sanitizer.
 */
import { describe, it, expect } from "vitest";
import {
  publicQuestions,
  sanitizeChoiceStrings,
  sanitizeOptionsForClient,
  sanitizeOptionsJson,
  sanitizeExamModuleForClient,
  sanitizeGeneratedQuestionsForClient,
  sanitizeRubricForClient,
  choiceShuffleSeed,
  CORRECTNESS_FIELD_KEYS,
} from "../public-question-payload";
import { getChoicesForModule } from "../default-choices";

describe("public-question-payload", () => {
  it("strips isCorrect and shuffles optionsJson in publicQuestions", () => {
    const questions = [
      {
        id: "q1",
        order: 1,
        type: "multiple-choice",
        prompt: "Pick one",
        pointsPossible: 10,
        optionsJson: JSON.stringify([
          { id: "a", text: "Correct", isCorrect: true },
          { id: "b", text: "Wrong 1", isCorrect: false },
          { id: "c", text: "Wrong 2", isCorrect: false },
          { id: "d", text: "Wrong 3", isCorrect: false },
        ]),
        correctAnswer: "a",
      },
    ];

    const out = publicQuestions(questions, "student-1");
    expect(out).toHaveLength(1);
    expect(out[0]).not.toHaveProperty("correctAnswer");
    const opts = JSON.parse(out[0].optionsJson!);
    expect(opts).toHaveLength(4);
    for (const o of opts) {
      expect(o).not.toHaveProperty("isCorrect");
      expect(o.id).toBeTruthy();
      expect(o.text).toBeTruthy();
    }
    // Same seed → same order; content preserved
    const again = JSON.parse(publicQuestions(questions, "student-1")[0].optionsJson!);
    expect(again.map((o: { id: string }) => o.id)).toEqual(
      opts.map((o: { id: string }) => o.id),
    );
    expect(new Set(opts.map((o: { id: string }) => o.id))).toEqual(
      new Set(["a", "b", "c", "d"]),
    );
  });

  it("sanitizeChoiceStrings removes position encoding via shuffle", () => {
    const original = ["BEST", "bad1", "bad2", "bad3"];
    const seed = choiceShuffleSeed("stu", "M01");
    const a = sanitizeChoiceStrings(original, seed);
    const b = sanitizeChoiceStrings(original, seed);
    expect(a).toEqual(b); // stable
    expect(a).toHaveLength(4);
    expect(new Set(a)).toEqual(new Set(original));
    // With this seed, order should not stay identical forever across modules —
    // at least verify content preserved and no extra fields.
    expect(a.every((c) => typeof c === "string")).toBe(true);
  });

  it("sanitizeOptionsForClient strips all known correctness keys", () => {
    const dirty = [
      {
        id: "1",
        text: "A",
        isCorrect: true,
        correctAnswer: "x",
        correctIndex: 0,
        pointsEarned: 5,
      },
      { id: "2", text: "B", isCorrect: false },
    ];
    const clean = sanitizeOptionsForClient(dirty, "seed");
    for (const o of clean as Array<Record<string, unknown>>) {
      for (const key of CORRECTNESS_FIELD_KEYS) {
        expect(o).not.toHaveProperty(key);
      }
    }
  });

  it("sanitizeExamModuleForClient omits descriptors and fewShot, shuffles choices", () => {
    const mod = sanitizeExamModuleForClient(
      {
        code: "M01",
        title: "Test",
        scenario: "S",
        instructions: "I",
        choices: ["correct-first", "w2", "w3", "w4"],
        rubric: [
          { criterion: "c1", weight: 50, descriptor: "SECRET strong answer cues" },
          { criterion: "c2", weight: 50, descriptor: "more secret" },
        ],
        fewShot: [{ response: "anchor", score: 90 }],
        questionType: "mcq" as const,
      },
      { studentId: "s1" },
    );

    expect(mod.choices).toHaveLength(4);
    expect(new Set(mod.choices)).toEqual(new Set(["correct-first", "w2", "w3", "w4"]));
    expect(mod.rubric.every((r) => !("descriptor" in r))).toBe(true);
    expect(mod).not.toHaveProperty("fewShot");
  });

  it("sanitizeGeneratedQuestionsForClient strips correctAnswer and answer", () => {
    const qs = sanitizeGeneratedQuestionsForClient(
      [
        {
          question: "Q?",
          options: ["A", "B", "C", "D"],
          correctAnswer: "A",
          answer: "A",
          explanation: "because A",
        },
      ],
      "stu",
    ) as Array<Record<string, unknown>>;

    expect(qs[0]).not.toHaveProperty("correctAnswer");
    expect(qs[0]).not.toHaveProperty("answer");
    expect(qs[0]).not.toHaveProperty("explanation");
    expect(qs[0].options).toHaveLength(4);
  });

  it("sanitizeRubricForClient keeps only criterion", () => {
    const r = sanitizeRubricForClient([
      { criterion: "x", weight: 40, descriptor: "leak", gate: true },
    ]);
    expect(r).toEqual([{ criterion: "x" }]);
  });

  it("sanitizeOptionsJson round-trips without correctness fields", () => {
    const raw = JSON.stringify([
      { id: "a", label: "Yes", isCorrect: true, correct_answer: "a" },
      { id: "b", label: "No", isCorrect: false },
    ]);
    const out = JSON.parse(sanitizeOptionsJson(raw, "x")!);
    expect(out.every((o: Record<string, unknown>) => !("isCorrect" in o))).toBe(true);
    expect(out.every((o: Record<string, unknown>) => !("correct_answer" in o))).toBe(true);
  });

  it("evidence: dumps real sanitized payloads and confirms shuffle variance", () => {
    const studentId = "evidence-student-001";
    const raw = getChoicesForModule({
      code: "M01",
      title: "Briefing",
      scenario: "s",
      instructions: "i",
    });
    const mod = sanitizeExamModuleForClient(
      {
        code: "M01",
        title: "Briefing",
        scenario: "Scenario text",
        instructions: "Pick the best action",
        choices: raw,
        rubric: [
          { criterion: "clarity", weight: 50, descriptor: "SECRET descriptor" },
        ],
        fewShot: [{ response: "anchor", score: 90 }],
        questionType: "mcq" as const,
      },
      { studentId },
    );

    expect(JSON.stringify(mod)).not.toMatch(/isCorrect|correctAnswer|correct_answer|fewShot|SECRET/);
    expect(mod.choices).toHaveLength(4);
    expect(mod.rubric[0]).toEqual({ criterion: "clarity" });

    const pq = publicQuestions(
      [
        {
          id: "q-demo",
          order: 1,
          type: "multiple-choice",
          prompt: "Demo",
          pointsPossible: 5,
          optionsJson: JSON.stringify([
            { id: "a", text: raw[0], isCorrect: true },
            { id: "b", text: raw[1], isCorrect: false },
            { id: "c", text: raw[2], isCorrect: false },
            { id: "d", text: raw[3], isCorrect: false },
          ]),
        },
      ],
      studentId,
    );
    const opts = JSON.parse(pq[0].optionsJson!);
    expect(opts.every((o: Record<string, unknown>) => !("isCorrect" in o))).toBe(true);
    expect(opts).toHaveLength(4);

    const positions = ["M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08"].map((code) => {
      const ch = getChoicesForModule({ code, title: code, scenario: "s", instructions: "i" });
      const out = sanitizeExamModuleForClient(
        {
          code,
          title: code,
          scenario: "s",
          instructions: "i",
          choices: ch,
          rubric: [],
          questionType: "mcq" as const,
        },
        { studentId },
      );
      return out.choices.indexOf(ch[0]);
    });
    expect(new Set(positions).size).toBeGreaterThan(1);

    // eslint-disable-next-line no-console
    console.log("\n[EVIDENCE modules payload]\n" + JSON.stringify(mod, null, 2));
    // eslint-disable-next-line no-console
    console.log("[EVIDENCE publicQuestions options]\n" + JSON.stringify(opts, null, 2));
    // eslint-disable-next-line no-console
    console.log("[EVIDENCE curated-first indexes M01-M08]", positions);
  });
});
