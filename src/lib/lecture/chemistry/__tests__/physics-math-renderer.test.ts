/**
 * Physics + Math Renderer — End-to-End Test
 * Verifies that free body diagrams, wave functions, circuits, graphs,
 * vectors, and formula derivations all produce valid SVG output.
 *
 * All functions return PhysicsVisual { svg, title, caption, type }.
 */
import { describe, it, expect } from "vitest";
import {
  renderFreeBodyDiagram,
  renderGraph,
  renderWave,
  renderCircuit,
  renderVectorDiagram,
  renderFormulaDerivation,
  renderEnergyDiagram,
  renderNumberLine,
  renderDistribution,
} from "../physics-math-renderer";

// Helper: check that output is valid SVG
function isValidSvg(svg: string): boolean {
  return svg.startsWith("<svg") && svg.includes("</svg>");
}

describe("Free Body Diagram Renderer", () => {
  it("renders a basic FBD with gravity, normal, applied force, and friction", () => {
    const result = renderFreeBodyDiagram(
      [
        { label: "F (applied)", magnitude: 0.6, angle: 0, color: "#2563eb" },
        { label: "mg (gravity)", magnitude: 1.0, angle: 270, color: "#dc2626" },
        { label: "N (normal)", magnitude: 1.0, angle: 90, color: "#16a34a" },
        { label: "f (friction)", magnitude: 0.25, angle: 180, color: "#9333ea" },
      ],
      { title: "Forces on a Block on a Rough Surface" }
    );
    expect(result.type).toBe("freebody");
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("F (applied)");
    expect(result.svg).toContain("mg (gravity)");
    expect(result.svg).toContain("N (normal)");
  });

  it("renders forces with custom colors", () => {
    const result = renderFreeBodyDiagram(
      [
        { label: "T", magnitude: 0.5, angle: 90, color: "#ff6600" },
        { label: "mg", magnitude: 0.8, angle: 270 },
      ],
      { title: "Tension vs Weight" }
    );
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("ff6600");
  });
});

describe("Graph / Coordinate Plane Renderer", () => {
  it("renders a parabola from point data", () => {
    const points = Array.from({ length: 41 }, (_, i) => {
      const x = -5 + i * 0.25;
      return { x, y: x * x };
    });
    const result = renderGraph(
      [{ points, color: "#2563eb", label: "f(x) = x²" }],
      { xRange: [-5, 5], yRange: [-5, 30], title: "Parabola" }
    );
    expect(result.type).toBe("graph");
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("x²");
  });

  it("renders axes with labels", () => {
    const result = renderGraph([], { title: "Empty Coordinate Plane" });
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("Coordinate Plane");
  });
});

describe("Wave Function Renderer", () => {
  it("renders a sine wave with labeled parameters", () => {
    const result = renderWave(
      [{ amplitude: 3, frequency: 2, phase: 0, color: "#2563eb", label: "Wave" }],
      { title: "Transverse Wave" }
    );
    expect(result.type).toBe("wave");
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("Wave");
  });

  it("renders multiple overlapping waves", () => {
    const result = renderWave(
      [
        { amplitude: 1, frequency: 1, color: "#e74c3c", label: "Wave 1" },
        { amplitude: 0.5, frequency: 3, phase: Math.PI / 4, color: "#3498db", label: "Wave 2" },
      ],
      { title: "Two Overlapping Waves" }
    );
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("Wave 1");
    expect(result.svg).toContain("Wave 2");
  });
});

describe("Circuit Diagram Renderer", () => {
  it("renders a series circuit with battery and resistors", () => {
    const result = renderCircuit(
      [
        { type: "battery", label: "12V", value: "12V" },
        { type: "resistor", label: "R₁", value: "4Ω" },
        { type: "resistor", label: "R₂", value: "6Ω" },
      ],
      { title: "Series Circuit: V = IR" }
    );
    expect(result.type).toBe("circuit");
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("12V");
    expect(result.svg).toContain("4Ω");
    expect(result.svg).toContain("6Ω");
  });

  it("renders a parallel circuit", () => {
    const result = renderCircuit(
      [
        { type: "battery", label: "9V", value: "9V" },
        { type: "resistor", label: "R₁", value: "100Ω" },
        { type: "resistor", label: "R₂", value: "200Ω" },
      ],
      { title: "Parallel Circuit", parallel: true }
    );
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("100Ω");
  });
});

describe("Vector Diagram Renderer", () => {
  it("renders tip-to-tail vectors with resultant", () => {
    const result = renderVectorDiagram(
      [
        { label: "A", dx: 5, dy: 0, color: "#2563eb" },
        { label: "B", dx: 3, dy: 4, color: "#dc2626" },
      ],
      { title: "Vector Addition: A + B = R", showResultant: true }
    );
    expect(result.type).toBe("vector");
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("A");
    expect(result.svg).toContain("B");
  });
});

describe("Formula Derivation Renderer", () => {
  it("renders a step-by-step derivation", () => {
    const result = renderFormulaDerivation(
      [
        { label: "Start", formula: "W = F · d", explanation: "Work definition" },
        { label: "Newton", formula: "F = ma", explanation: "Second law" },
        { label: "Substitute", formula: "W = ma · d", explanation: "Combine" },
        { label: "Kinematics", formula: "v² = v₀² + 2ad", explanation: "Solve for ad" },
        { label: "Result", formula: "KE = ½mv²", explanation: "Kinetic energy" },
      ],
      { title: "Deriving Kinetic Energy" }
    );
    expect(result.type).toBe("formula");
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("W = F");
    expect(result.svg).toContain("KE");
    expect(result.svg).toContain("½mv²");
  });
});

describe("Energy Diagram Renderer", () => {
  it("renders a potential energy well", () => {
    const result = renderEnergyDiagram(
      [{ x: 2, depth: 3, label: "Well", color: "#2563eb" }],
      { title: "Potential Energy Well" }
    );
    expect(result.type).toBe("energy");
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("Energy");
  });
});

describe("Number Line Renderer", () => {
  it("renders intervals", () => {
    const result = renderNumberLine(
      [{ start: 2, end: 5, color: "#2563eb", label: "(2,5]", open: false }],
      { min: 0, max: 8, title: "Interval (2, 5]" }
    );
    expect(result.type).toBe("numberline");
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.title).toBe("Interval (2, 5]");
    expect(result.svg).toContain("(2,5]");
  });
});

describe("Distribution Renderer", () => {
  it("renders a normal distribution", () => {
    const result = renderDistribution("normal", { mu: 0, sigma: 1 }, {
      title: "Standard Normal N(0, 1)",
      color: "#2563eb",
    });
    expect(result.type).toBe("probability");
    expect(isValidSvg(result.svg)).toBe(true);
    expect(result.svg).toContain("N(0");
  });

  it("renders a uniform distribution", () => {
    const result = renderDistribution("uniform", { min: 0, max: 10 }, {
      title: "Uniform U(0, 10)",
      color: "#16a34a",
    });
    expect(isValidSvg(result.svg)).toBe(true);
  });

  it("renders an exponential distribution", () => {
    const result = renderDistribution("exponential", { lambda: 0.5 }, {
      title: "Exponential Distribution",
    });
    expect(isValidSvg(result.svg)).toBe(true);
  });
});
