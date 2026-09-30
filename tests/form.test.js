import test from "node:test";
import assert from "node:assert/strict";
import { initServiceRequestForm, validateServiceRequest } from "../src/form.js";

const valid = { name: "Alex", email: "alex@example.com", phone: "512-555-0100", message: "AC is not cooling." };

// A small DOM-shaped harness lets the production submit handler run without a
// browser dependency. A real browser smoke check supplements these tests.
function fixture(values = valid) {
  const fields = {};
  const errors = [];
  const node = () => ({
    attrs: {}, dataset: {}, textContent: "", hidden: false,
    setAttribute(key, value) { this.attrs[key] = value; },
    getAttribute(key) { return this.attrs[key] ?? null; },
    removeAttribute(key) { delete this.attrs[key]; },
    remove() { this.removed = true; },
  });
  for (const name of Object.keys(valid)) {
    fields[name] = { ...node(), value: values[name] ?? "", focus() { form.focused = name; },
      insertAdjacentElement(_position, error) { errors.push(error); } };
  }
  const button = { disabled: false };
  const status = node();
  const form = {
    noValidate: false, focused: null,
    ownerDocument: { createElement: node },
    querySelector(selector) {
      if (selector === '[type="submit"]') return button;
      if (selector === "[data-form-status]") return status;
      return fields[selector.match(/name="(.*?)"/)[1]];
    },
    addEventListener(_event, listener) { this.listener = listener; },
    removeEventListener(_event, listener) { assert.equal(this.listener, listener); this.listener = null; },
    async submit() { let prevented = false; await this.listener({ preventDefault() { prevented = true; } }); assert.ok(prevented); },
  };
  return { form, fields, button, status, errors };
}

test("validates contact and request fields; phone is optional", () => {
  assert.deepEqual(validateServiceRequest(valid), {});
  assert.deepEqual(validateServiceRequest({ ...valid, phone: "" }), {});
  assert.deepEqual(Object.keys(validateServiceRequest({ name: " ", email: "not-email", phone: "123", message: " " })), ["name", "email", "phone", "message"]);
  assert.ok(validateServiceRequest({ ...valid, phone: "call me" }).phone);
});

test("missing destination disables delivery, including synthetic submissions", async () => {
  const f = fixture();
  let calls = 0;
  initServiceRequestForm(f.form, { fetch: () => { calls++; } });
  assert.ok(f.button.disabled);
  assert.equal(f.status.dataset.state, "unavailable");
  assert.match(f.status.textContent, /unavailable/);
  await f.form.submit();
  assert.equal(calls, 0);
});

test("invalid input produces accessible errors, focuses the field, and preserves values", async () => {
  const f = fixture({ ...valid, email: "bad" });
  let calls = 0;
  initServiceRequestForm(f.form, { destination: "/requests", fetch: () => { calls++; } });
  await f.form.submit();
  assert.equal(calls, 0);
  assert.equal(f.form.focused, "email");
  assert.equal(f.fields.email.value, "bad");
  assert.equal(f.fields.email.getAttribute("aria-invalid"), "true");
  assert.equal(f.errors[1].hidden, false);
  assert.match(f.fields.email.getAttribute("aria-describedby"), /email-error/);
  assert.equal(f.status.getAttribute("aria-live"), "polite");
});

test("configured endpoint receives validated JSON and prevents duplicate submissions", async () => {
  const f = fixture();
  let finish;
  const calls = [];
  initServiceRequestForm(f.form, { destination: "/requests", fetch: (url, options) => {
    calls.push({ url, options });
    return new Promise(resolve => { finish = resolve; });
  } });
  const pending = f.form.submit();
  assert.ok(f.button.disabled);
  await f.form.submit();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/requests");
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), valid);
  finish({ ok: true });
  await pending;
  assert.equal(f.status.dataset.state, "accepted");
  assert.ok(f.button.disabled);
  await f.form.submit();
  assert.equal(calls.length, 1);
  assert.equal(f.fields.message.value, valid.message);
});

test("server rejection does not claim success and keeps entries", async () => {
  const f = fixture();
  initServiceRequestForm(f.form, { destination: "/requests", fetch: async () => ({ ok: false }) });
  await f.form.submit();
  assert.equal(f.status.dataset.state, "ready");
  assert.match(f.status.textContent, /did not confirm/);
  assert.equal(f.fields.name.value, valid.name);
});

test("lost response is unknown and blocks blind resubmission", async () => {
  const f = fixture();
  let calls = 0;
  initServiceRequestForm(f.form, { destination: "/requests", fetch: async () => { calls++; throw new Error("network lost"); } });
  await f.form.submit();
  assert.equal(f.status.dataset.state, "unknown");
  assert.match(f.status.textContent, /couldn’t confirm/);
  assert.ok(f.button.disabled);
  await f.form.submit();
  assert.equal(calls, 1);
});

test("cleanup removes the listener and restores existing field descriptions", () => {
  const f = fixture();
  f.fields.email.setAttribute("aria-describedby", "email-hint");
  const destroy = initServiceRequestForm(f.form);
  destroy();
  assert.equal(f.form.listener, null);
  assert.equal(f.fields.email.getAttribute("aria-describedby"), "email-hint");
  assert.equal(f.fields.name.getAttribute("aria-describedby"), null);
  assert.equal(f.form.noValidate, false);
  assert.equal(f.button.disabled, false);
  assert.ok(f.errors.every(error => error.removed));
});
