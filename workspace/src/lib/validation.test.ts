import { describe, expect, it } from "vitest";
import { formToObject, schemas } from "./validation";

describe("formToObject", () => {
  it("collects repeated *Ids keys into arrays", () => {
    const fd = new FormData();
    fd.append("featureId", "f1");
    fd.append("assumptionIds", "a1");
    fd.append("assumptionIds", "a2");
    expect(formToObject(fd)).toEqual({ featureId: "f1", assumptionIds: ["a1", "a2"] });
  });
});

describe("measure schema", () => {
  it("keeps blank baseline and target blank instead of inventing values", () => {
    const m = schemas.measure.parse({ featureId: "f", kind: "success", metric: "Repeat orders" });
    expect(m.baseline).toBe("");
    expect(m.target).toBe("");
  });
  it("keeps entered values exactly as typed", () => {
    const m = schemas.measure.parse({ featureId: "f", kind: "guardrail", metric: "Refunds", baseline: " 2.1% (Sep) " });
    expect(m.baseline).toBe("2.1% (Sep)");
  });
});

describe("decision schema", () => {
  it("requires a reason and who decided", () => {
    const r = schemas.decision.safeParse({ featureId: "f", what: "Ship option B", reason: "", decidedBy: "" });
    expect(r.success).toBe(false);
  });
});
