const test = require("node:test");
const assert = require("node:assert/strict");
const { validateTaskPayload, parseTaskQuery } = require("../src/validators");

test("validateTaskPayload create rejects empty title", () => {
  const result = validateTaskPayload({ title: "" }, true);
  assert.equal(result.ok, false);
});

test("validateTaskPayload create accepts valid task", () => {
  const result = validateTaskPayload(
    { title: "Course work", description: "API", status: "new" },
    true
  );
  assert.equal(result.ok, true);
  assert.equal(result.payload.title, "Course work");
});

test("validateTaskPayload create accepts daily reminder", () => {
  const result = validateTaskPayload(
    { title: "Зарядка", repeat_type: "daily", reminder_time: "07:30" },
    true
  );
  assert.equal(result.ok, true);
  assert.equal(result.payload.repeat_type, "daily");
  assert.equal(result.payload.reminder_time, "07:30:00");
});

test("validateTaskPayload create rejects daily reminder without time", () => {
  const result = validateTaskPayload(
    { title: "Прогулянка", repeat_type: "daily" },
    true
  );
  assert.equal(result.ok, false);
});

test("validateTaskPayload accepts deadline format", () => {
  const result = validateTaskPayload(
    { title: "Фінал курсової", due_at: "2026-04-30T23:00" },
    true
  );
  assert.equal(result.ok, true);
  assert.equal(result.payload.due_at, "2026-04-30 23:00:00");
});

test("parseTaskQuery applies defaults", () => {
  const result = parseTaskQuery({});
  assert.equal(result.ok, true);
  assert.equal(result.data.page, 1);
  assert.equal(result.data.limit, 10);
});

test("parseTaskQuery rejects invalid status", () => {
  const result = parseTaskQuery({ status: "bad" });
  assert.equal(result.ok, false);
});
