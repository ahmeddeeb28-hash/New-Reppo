import { describe, expect, it } from "vitest";
import { deriveStatus, progress, sectionHasContent, sectionStatuses, stepStatus, STEPS, SECTION_KEYS, type FeatureContent } from "./domain";

const blank: FeatureContent = {
  problem: "", constraints: "", audience: "", currentBehaviour: "", outcome: "",
  sources: [], assumptions: [], questions: [], scopeItems: [], alternatives: [],
  criteria: [], measures: [], decisions: [],
};

describe("deriveStatus", () => {
  it("is empty without content, even if stored as agreed", () => {
    expect(deriveStatus(false, "agreed")).toBe("empty");
  });
  it("is proposed with content and no stored status", () => {
    expect(deriveStatus(true, undefined)).toBe("proposed");
  });
  it("is agreed only when stored as agreed and content exists", () => {
    expect(deriveStatus(true, "agreed")).toBe("agreed");
  });
});

describe("sectionHasContent", () => {
  it("treats whitespace as empty", () => {
    expect(sectionHasContent({ ...blank, problem: "   " }, "problem")).toBe(false);
  });
  it("counts constraints toward the problem section", () => {
    expect(sectionHasContent({ ...blank, constraints: "Ship before Q2" }, "problem")).toBe(true);
  });
  it("uses linked records for list sections", () => {
    expect(sectionHasContent({ ...blank, measures: [{}] }, "measures")).toBe(true);
    expect(sectionHasContent(blank, "measures")).toBe(false);
  });
});

describe("sectionStatuses", () => {
  it("covers every section and ignores unknown stored values", () => {
    const s = sectionStatuses({ ...blank, outcome: "More repeat orders" }, [
      { section: "outcome", status: "bogus" },
      { section: "problem", status: "agreed" },
    ]);
    expect(Object.keys(s).sort()).toEqual([...SECTION_KEYS].sort());
    expect(s.outcome).toBe("proposed");
    expect(s.problem).toBe("empty");
  });
});

describe("progress and steps", () => {
  it("counts statuses", () => {
    const s = sectionStatuses({ ...blank, outcome: "x", problem: "y" }, [{ section: "problem", status: "agreed" }]);
    expect(progress(s)).toEqual({ total: SECTION_KEYS.length, agreed: 1, proposed: 1, empty: SECTION_KEYS.length - 2 });
  });
  it("derives step status from its sections", () => {
    expect(stepStatus(["empty", "empty"])).toBe("empty");
    expect(stepStatus(["agreed", "agreed"])).toBe("agreed");
    expect(stepStatus(["agreed", "empty"])).toBe("proposed");
  });
  it("maps every section to exactly one step", () => {
    const mapped = STEPS.flatMap((s) => s.sections as readonly string[]);
    expect([...mapped].sort()).toEqual([...SECTION_KEYS].sort());
  });
});
