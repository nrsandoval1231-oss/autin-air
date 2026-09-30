const fieldNames = ["name", "email", "phone", "message"];
let formSequence = 0;

export function validateServiceRequest(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.phone.trim() && !/^\+?[\d\s().-]+$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number, or leave it blank.";
  } else if (values.phone.trim() && values.phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Enter a complete phone number, or leave it blank.";
  }
  if (!values.message.trim()) errors.message = "Tell us what service you need.";
  return errors;
}

/**
 * Initialize a form containing name, email, phone (optional), and message fields.
 * Pass an agreed delivery endpoint as destination. Without it, submission stays
 * unavailable. The endpoint must accept JSON and return a successful HTTP status
 * only after accepting the request. Returns a listener cleanup function.
 */
export function initServiceRequestForm(form, { destination = "", fetch: send = globalThis.fetch } = {}) {
  const fields = Object.fromEntries(fieldNames.map(name => [name, form.querySelector(`[name="${name}"]`)]));
  const button = form.querySelector('[type="submit"]');
  if (!button || fieldNames.some(name => !fields[name])) {
    throw new Error("The service-request form needs name, email, phone, message, and a submit button.");
  }
  const endpoint = typeof destination === "string" ? destination.trim() : "";
  const prefix = `service-request-${++formSequence}`;
  const created = [];
  const originalDescriptions = {};
  const errors = {};
  for (const name of fieldNames) {
    const error = form.ownerDocument.createElement("span");
    error.id = `${prefix}-${name}-error`;
    error.className = "form-error";
    error.hidden = true;
    fields[name].insertAdjacentElement("afterend", error);
    originalDescriptions[name] = fields[name].getAttribute("aria-describedby");
    fields[name].setAttribute("aria-describedby", [originalDescriptions[name], error.id].filter(Boolean).join(" "));
    errors[name] = error;
    created.push(error);
  }
  let status = form.querySelector("[data-form-status]");
  if (!status) {
    status = form.ownerDocument.createElement("p");
    form.append(status);
    created.push(status);
  }
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const originalDisabled = button.disabled;
  const originalNoValidate = form.noValidate;
  form.noValidate = true;
  let phase = endpoint ? "ready" : "unavailable";
  let disposed = false;
  const update = (next, text) => {
    phase = next;
    status.textContent = text;
    status.dataset.state = next;
    button.disabled = next !== "ready";
  };
  update(phase, endpoint ? "" : "Online service requests are unavailable until a delivery destination is configured. Please call us for service.");

  async function onSubmit(event) {
    event.preventDefault();
    if (disposed || phase !== "ready") return;
    const values = Object.fromEntries(fieldNames.map(name => [name, fields[name].value.trim()]));
    const invalid = validateServiceRequest(values);
    for (const name of fieldNames) {
      errors[name].textContent = invalid[name] || "";
      errors[name].hidden = !invalid[name];
      fields[name].setAttribute("aria-invalid", invalid[name] ? "true" : "false");
    }
    const firstInvalid = fieldNames.find(name => invalid[name]);
    if (firstInvalid) {
      update("ready", "Please check the highlighted fields. Your entries have been kept.");
      fields[firstInvalid].focus();
      return;
    }
    update("sending", "Sending your service request…");
    try {
      const response = await send(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        redirect: "error",
      });
      if (disposed) return;
      if (response.ok) {
        update("accepted", "The service endpoint accepted your request. Your entries have been kept for reference.");
      } else {
        update("ready", "The service endpoint did not confirm acceptance. Please call us for service. Your entries have been kept.");
      }
    } catch {
      if (!disposed) {
        // A lost response can follow an accepted request. Never automatically retry.
        update("unknown", "We couldn’t confirm whether your request was received. Please call before submitting again to avoid a duplicate request. Your entries have been kept.");
      }
    }
  }
  form.addEventListener("submit", onSubmit);
  return () => {
    disposed = true;
    form.removeEventListener("submit", onSubmit);
    form.noValidate = originalNoValidate;
    button.disabled = originalDisabled;
    for (const name of fieldNames) {
      if (originalDescriptions[name] === null) fields[name].removeAttribute("aria-describedby");
      else fields[name].setAttribute("aria-describedby", originalDescriptions[name]);
      fields[name].removeAttribute("aria-invalid");
    }
    created.forEach(element => element.remove());
  };
}
