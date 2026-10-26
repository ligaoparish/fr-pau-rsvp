/*
  Configure RSVP_FUNCTION_URL with your deployed Supabase Edge Function URL.
  Example: https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-rsvp
*/
const SUPABASE_URL = "https://ohltaamhyutgyojedcyr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8o2mbU2eTWNAzPLKMipeLg_bpKYKx\_-";
const RSVP_FUNCTION_URL = "https://ohltaamhyutgyojedcyr.supabase.co/functions/v1/submit-rsvp";

const form = document.getElementById("rsvp-form");
const attendance = document.getElementById("attendance");
const guestFields = document.getElementById("guest-fields");
const seats = document.getElementById("seats");
const fullNameInput = form.querySelector('[name="full_name"]');
const attendeeNameInputs = document.getElementById("attendee-name-inputs");
const submitButton = document.getElementById("submit-button");
const message = document.getElementById("form-message");

function renderAttendeeNameInputs() {
  if (!attendeeNameInputs || !seats || !fullNameInput) return;
  const count = Math.max(1, Math.min(10, Number.parseInt(seats.value, 10) || 1));
  const previous = [...attendeeNameInputs.querySelectorAll("input")].map(input => input.value);
  attendeeNameInputs.replaceChildren();

  for (let i = 0; i < count; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "attendee-name-item";
    const label = document.createElement("label");
    const inputId = `attendee-name-${i + 1}`;
    label.htmlFor = inputId;
    label.className = "attendee-name-label";
    label.textContent = i === 0 ? "Person 1 — Reservation holder" : `Person ${i + 1} — Guest name`;

    const input = document.createElement("input");
    input.type = "text";
    input.id = inputId;
    input.name = `attendee_name_${i + 1}`;
    input.maxLength = 120;
    input.required = true;
    input.autocomplete = "name";
    input.setAttribute("aria-label", label.textContent);
    input.placeholder = i === 0 ? "Enter reservation holder's full name" : `Enter person ${i + 1}'s full name`;
    input.value = previous[i] || (i === 0 ? fullNameInput.value.trim() : "");
    input.addEventListener("input", () => {
      if (i === 0 && fullNameInput.value !== input.value) fullNameInput.value = input.value;
    });

    wrapper.append(label, input);
    attendeeNameInputs.appendChild(wrapper);
  }
}

function updateAttendanceFields() {
  const isAttending = attendance.value === "attending";
  guestFields.hidden = !isAttending;
  seats.required = isAttending;
  if (isAttending) renderAttendeeNameInputs();
  else attendeeNameInputs.replaceChildren();
}

seats.addEventListener("change", renderAttendeeNameInputs);
fullNameInput.addEventListener("input", () => {
  const first = attendeeNameInputs.querySelector("input");
  if (first) first.value = fullNameInput.value;
});
attendance.addEventListener("change", updateAttendanceFields);
updateAttendanceFields();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.className = "form-message";
  message.textContent = "";

  if (!form.reportValidity()) return;
  if (RSVP_FUNCTION_URL.includes("PASTE_YOUR")) {
    showMessage("error", "The RSVP website has not been connected to its database yet. Please contact the event organizer.");
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.consent) {
    showMessage("error", "Please confirm the information-use notice before submitting.");
    return;
  }

  const names = [...attendeeNameInputs.querySelectorAll("input")].map(input => input.value.trim());
  const payload = {
    full_name: String(data.full_name || "").trim(),
    phone: String(data.phone || "").trim(),
    email: String(data.email || "").trim() || null,
    affiliation: String(data.affiliation || "").trim() || null,
    attendance: data.attendance,
    seats: data.attendance === "attending" ? Number(data.seats || 1) : 0,
    guest_names: data.attendance === "attending" ? names.join("\n") : "",
    message: String(data.message || "").trim() || null
  };

  if (!payload.full_name || !payload.phone || !["attending", "declined"].includes(payload.attendance)) {
    showMessage("error", "Please complete all required fields.");
    return;
  }
  if (payload.attendance === "attending") {
    if (names.length !== payload.seats || names.some(name => name.length < 2 || name.length > 120)) {
      showMessage("error", "Please enter the full name of every person. The number of names must match the seats reserved.");
      return;
    }
    if (names[0].toLowerCase() !== payload.full_name.toLowerCase()) {
      showMessage("error", "Person 1's name must match the reservation holder's full name.");
      return;
    }
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";
  try {
    const response = await fetch(RSVP_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "We couldn't submit your RSVP. Please try again.");

    form.reset();
    updateAttendanceFields();
    showMessage("success", payload.attendance === "attending"
      ? `Thank you, ${payload.full_name}! Your RSVP for ${payload.seats} seat(s) is confirmed. Registered attendees: ${names.join(", ")}.`
      : `Thank you, ${payload.full_name}. Your response has been recorded. We are sorry you cannot join us.`);
    message.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    showMessage("error", error.message || "Something went wrong. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Confirm my RSVP <span aria-hidden="true">→</span>';
  }
});

function showMessage(type, text) {
  message.className = `form-message ${type}`;
  message.textContent = text;
}
