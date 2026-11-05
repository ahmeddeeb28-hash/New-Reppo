// Milestone 1 acceptance: a feature can be created, every section edited and saved,
// and section status shows empty / proposed / agreed.
// Run with the app on http://localhost:3000:  node e2e/m1.mjs [screenshotDir]
import { createRequire } from "node:module";
// Uses the globally installed Playwright; add it as a dev dependency if running elsewhere.
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const shots = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
let failures = 0;
const check = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) failures++; };
const chip = (section) => p.locator(`#${section} h2 + span`).first().innerText();
// The page re-renders shortly after a save, so poll instead of reading once.
const chipIs = async (section, want) => {
  for (let i = 0; i < 50; i++) { if ((await chip(section)) === want) return true; await p.waitForTimeout(100); }
  return false;
};
const visible = async (locator) => {
  try { await locator.first().waitFor({ state: "visible", timeout: 5000 }); return true; } catch { return false; }
};
const open = async (section, label) => {
  const summary = p.locator(`#${section} summary`, { hasText: label });
  const isOpen = await summary.evaluate((el) => el.parentElement.open);
  if (!isOpen) await summary.click();
};
const submit = async (scope, label) => {
  await Promise.all([p.waitForResponse((r) => r.request().method() === "POST"), scope.getByRole("button", { name: label }).click()]);
  await p.waitForLoadState("networkidle");
};

// Create
await p.goto(BASE);
await p.fill("#title", "Saved carts");
await p.fill("#request", "Let customers save a cart and come back to it later.");
await Promise.all([p.waitForURL(/\/context$/), p.getByRole("button", { name: "Create feature" }).click()]);
check(await visible(p.getByRole("heading", { level: 1, name: "Saved carts" })), "feature is created and opens on step 1");
const featureBase = p.url().replace(/\/context$/, "");
check(await chipIs("evidence", "PROPOSED"), "original request is stored as the first source");

// Source
await open("evidence", "Add a source");
await p.fill("#src-title", "Interview notes");
await p.fill("#src-content", "Three of five customers rebuild carts from memory.");
await submit(p.locator("#evidence"), "Add source");
check(await visible(p.getByText("Interview notes")), "source saved");

// Clarify: empty → proposed → agreed → reopened by edit
await p.goto(p.url().replace("/context", "/clarify"));
check(await chipIs("problem", "EMPTY"), "problem starts empty");
check((await p.locator("#problem").getByRole("button", { name: "Mark agreed" }).count()) === 0, "empty section cannot be agreed");
await p.fill("#field-problem", "Customers lose carts between sessions.");
await submit(p.locator("section#problem"), "Save problem");
check(await chipIs("problem", "PROPOSED"), "saved problem is proposed");
await submit(p.locator("section#problem"), "Mark agreed");
check(await chipIs("problem", "AGREED"), "problem can be agreed");
await p.fill("#field-problem", "Customers lose carts between sessions and devices.");
await submit(p.locator("section#problem"), "Save problem");
check(await chipIs("problem", "PROPOSED"), "editing an agreed section reopens it");
check((await p.inputValue("#field-problem")).includes("devices"), "edited text persists after save");
await p.fill("#field-audience", "Returning shoppers");
await submit(p.locator("section#audience"), "Save audience");
await p.fill("#field-outcome", "More returning shoppers complete a saved cart.");
await submit(p.locator("section#outcome"), "Save outcome");
check(await chipIs("audience", "PROPOSED") && await chipIs("outcome", "PROPOSED"), "audience and outcome saved");

// Evidence step
await p.goto(p.url().replace("/clarify", "/evidence"));
await open("assumptions", "Register an assumption");
await p.fill("#new-a-statement", "Shoppers want to return to the same cart.");
await p.fill("#new-a-owner", "Dana");
await p.locator("label", { hasText: "Interview notes" }).first().click();
await submit(p.locator("#assumptions"), "Register assumption");
check(await visible(p.getByText("Shoppers want to return to the same cart.")), "assumption registered");
check(await visible(p.getByText("Needs test.")), "assumption without a test is flagged");
await open("open_questions", "Add an open question");
await p.fill("#q-text", "How long should a saved cart last?");
await p.selectOption("#q-role", "design");
await submit(p.locator("#open_questions"), "Add question");
check(await visible(p.getByText("How long should a saved cart last?")), "question assigned to a role");

// Scope step
await p.goto(p.url().replace("/evidence", "/scope"));
await open("scope", "Add a scope item");
await p.fill("#scope-text", "Save one cart per account");
await submit(p.locator("#scope"), "Add item");
await open("scope", "Add a scope item");
await p.fill("#scope-text", "Share carts with others");
await p.check("#scope-out");
await submit(p.locator("#scope"), "Add item");
check(await visible(p.getByText("In this release · 1")) && await visible(p.getByText("Out of this release · 1")), "in and out of scope items saved");
await open("alternatives", "Add an alternative");
await p.fill("#alt-desc", "Multiple named carts");
await p.fill("#alt-why", "More design work than the problem needs");
await submit(p.locator("#alternatives"), "Add alternative");
await open("acceptance_criteria", "Add a criterion");
await p.fill("#crit-text", "A saved cart is restored on another device after sign-in");
await submit(p.locator("#acceptance_criteria"), "Add criterion");
check(await chipIs("alternatives", "PROPOSED") && await chipIs("acceptance_criteria", "PROPOSED"), "alternatives and criteria saved");

// Learning step: blank values stay unknown
await p.goto(p.url().replace("/scope", "/learning"));
await open("measures", "Add a measure");
await p.fill("#new-m-metric", "Saved carts completed");
await submit(p.locator("#measures"), "Add measure");
await visible(p.locator("#measures dd"));
check((await p.locator("#measures dd", { hasText: "Unknown" }).count()) === 4, "blank baseline, target, cohort and window show as Unknown");

// Review step
await p.goto(p.url().replace("/learning", "/review"));
await open("decisions", "Record a decision");
await p.fill("#d-what", "Start with one saved cart per account");
await p.fill("#d-reason", "Smallest option that tests the assumption");
await p.fill("#d-by", "Dana (PM), Lee (Eng)");
await p.locator("#decisions label", { hasText: "Shoppers want to return" }).click();
await submit(p.locator("#decisions"), "Record decision");
check(await visible(p.getByText("Rests on assumptions:")), "decision saved with the assumption it rests on");

// Share step
await p.goto(p.url().replace("/review", "/share"));
check(await visible(p.getByText("0 of 11 sections are agreed")), "share step summarises statuses");
check(await visible(p.getByText("reopened", { exact: false }).first()), "history records the reopen");
check(await visible(p.getByText("added to scope")), "history lists scope changes");
if (shots) {
  await p.screenshot({ path: `${shots}/share.png`, fullPage: true });
  await p.goto(p.url().replace("/share", "/evidence"));
  await p.screenshot({ path: `${shots}/evidence.png`, fullPage: true });
  await p.goto(BASE);
  await p.screenshot({ path: `${shots}/home.png`, fullPage: true });
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  await m.goto(`${featureBase}/learning`);
  await m.screenshot({ path: `${shots}/mobile-dark.png`, fullPage: true });
  check(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "no horizontal scroll on phone width");
}
check(errors.length === 0, `no page errors ${errors.join("; ")}`);
await b.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
