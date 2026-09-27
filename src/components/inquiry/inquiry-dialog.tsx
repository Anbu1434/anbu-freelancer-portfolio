"use client";

import { ArrowLeft, Check, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import {
  emptyInquiry,
  inquiryFields,
  validateInquiryField,
  type InquiryErrors,
  type InquiryField,
  type InquiryValues,
} from "@/lib/inquiry";
import { submitInquiry } from "@/lib/inquiry-action";

const steps: Record<InquiryField, { label: string; heading: string; hint: string }> = {
  name: { label: "Name", heading: "What should we call you?", hint: "First name is plenty." },
  phone: { label: "Phone", heading: "How can we reach you?", hint: "Drop your WhatsApp or phone number." },
  services: { label: "Service", heading: "What do you need?", hint: "Pick the services that fit your project." },
  businessDetails: {
    label: "Business details",
    heading: "Tell us about your business",
    hint: "Give us a quick idea of what you're building.",
  },
};

type Status = "editing" | "sending" | "success" | "error";

/** Four-step project inquiry in a native modal dialog (Escape, focus trap and backdrop come built in). */
export function InquiryDialog({ open, onClose, services, contactEmail }: { open: boolean; onClose: () => void; services: string[]; contactEmail: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef(0);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [values, setValues] = useState<InquiryValues>(emptyInquiry);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState<Status>("editing");

  const field = inquiryFields[step];
  const copy = steps[field];
  const isLast = step === inquiryFields.length - 1;
  const done = status === "success";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
      startedAtRef.current ||= Date.now();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Move focus to the current step's control (or the success button) whenever the view changes.
  useEffect(() => {
    if (open) dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [open, step, done]);

  function handleClosed() {
    document.documentElement.style.overflow = "";
    onClose();
    // Entered data survives a close; a finished request starts fresh next time.
    if (done) {
      setValues(emptyInquiry);
      setStep(0);
      setStatus("editing");
      startedAtRef.current = 0;
    }
  }

  function close() {
    dialogRef.current?.close();
  }

  // A click that lands on the <dialog> itself (not its content) is a click on the backdrop.
  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) close();
  }

  function goTo(index: number) {
    setDirection(index < step ? "back" : "next");
    setStep(index);
    if (status === "error") setStatus("editing");
  }

  function update<K extends keyof InquiryValues>(key: K, value: InquiryValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function toggleService(service: string) {
    update("services", values.services.includes(service) ? values.services.filter((item) => item !== service) : [...values.services, service]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const error = validateInquiryField(field, values);
    if (error) {
      setErrors((current) => ({ ...current, [field]: error }));
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      return;
    }
    if (!isLast) return goTo(step + 1);

    setStatus("sending");
    try {
      const result = await submitInquiry({
        ...values,
        website: honeypotRef.current?.value ?? "",
        startedAt: startedAtRef.current,
      });
      if (result.status === "invalid") {
        const first = inquiryFields.findIndex((name) => result.errors[name]);
        setErrors(result.errors);
        setStatus("editing");
        if (first >= 0) goTo(first);
        return;
      }
      setStatus(result.status);
    } catch {
      setStatus("error");
    }
  }

  const describedBy = cn("inquiry-hint", errors[field] && "inquiry-error");
  const control = {
    "aria-labelledby": "inquiry-title",
    "aria-describedby": describedBy,
    "aria-invalid": errors[field] ? true : undefined,
    "data-autofocus": "",
  };

  return (
    <dialog ref={dialogRef} className="inquiry" aria-labelledby="inquiry-title" onClose={handleClosed} onClick={onDialogClick}>
      <div className="inquiry-card">
        <button type="button" className="inquiry-close" onClick={close} aria-label="Close">
          <X aria-hidden="true" />
        </button>

        {done ? (
          <div className="inquiry-step" data-dir="next" role="status">
            <span aria-hidden="true" className="inquiry-badge">
              <Check />
            </span>
            <h2 id="inquiry-title" className="inquiry-heading title">
              Project request received!
            </h2>
            <p className="inquiry-sub">Thanks! We&apos;ll review your requirements and get back to you shortly.</p>
            <div className="inquiry-actions">
              <button type="button" className="btn btn-accent inquiry-cta" onClick={close} data-autofocus>
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <form key={step} className="inquiry-step" data-dir={direction} onSubmit={handleSubmit} noValidate>
              <p className="inquiry-kicker meta">
                Step {step + 1} of {inquiryFields.length}
              </p>
              <h2 id="inquiry-title" className="inquiry-heading title">
                {copy.heading}
              </h2>
              <p id="inquiry-hint" className="inquiry-sub">
                {copy.hint}
              </p>

              <div className="inquiry-body">
                {field === "name" && (
                  <input
                    {...control}
                    type="text"
                    name="name"
                    autoComplete="given-name"
                    placeholder="Your name"
                    maxLength={100}
                    value={values.name}
                    onChange={(event) => update("name", event.target.value)}
                    className="field inquiry-field"
                  />
                )}

                {field === "phone" && (
                  <input
                    {...control}
                    type="tel"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Phone number"
                    maxLength={24}
                    value={values.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    className="field inquiry-field"
                  />
                )}

                {field === "services" && (
                  <fieldset className="inquiry-options" aria-labelledby="inquiry-title" aria-describedby={describedBy}>
                    {services.map((service, index) => (
                      <label key={service} className="inquiry-option">
                        <input
                          type="checkbox"
                          name="services"
                          value={service}
                          checked={values.services.includes(service)}
                          onChange={() => toggleService(service)}
                          aria-invalid={errors.services ? true : undefined}
                          {...(index === 0 && { "data-autofocus": "" })}
                        />
                        <span>
                          <span aria-hidden="true" className="inquiry-check">
                            <Check />
                          </span>
                          {service}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )}

                {field === "businessDetails" && (
                  <>
                    <textarea
                      {...control}
                      name="businessDetails"
                      rows={4}
                      maxLength={5000}
                      placeholder="Tell us about your business, project, or what you need..."
                      value={values.businessDetails}
                      onChange={(event) => update("businessDetails", event.target.value)}
                      className="field inquiry-field"
                    />
                    {/* Spam protection: an off-screen honeypot plus a timestamp checked on the server. */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                      <label htmlFor="inquiry-website">Website</label>
                      <input ref={honeypotRef} id="inquiry-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                    </div>
                  </>
                )}

                {errors[field] && (
                  <p id="inquiry-error" className="field-error" role="alert">
                    {errors[field]}
                  </p>
                )}
              </div>

              {status === "error" && (
                <div role="alert" className="inquiry-alert">
                  <p className="font-bold">Couldn&apos;t send your request.</p>
                  <p>
                    Please try again, or email{" "}
                    <a href={`mailto:${contactEmail}`} className="link-underline font-semibold">
                      {contactEmail}
                    </a>
                  </p>
                </div>
              )}

              <div className="inquiry-actions">
                {step > 0 && (
                  <button type="button" className="btn btn-secondary inquiry-back" onClick={() => goTo(step - 1)} aria-label="Previous step">
                    <ArrowLeft aria-hidden="true" />
                  </button>
                )}
                <button type="submit" className="btn btn-accent inquiry-cta" disabled={status === "sending"}>
                  {isLast ? (status === "sending" ? "Sending…" : "Start project") : "Next"}
                </button>
              </div>
            </form>

            <ol className="inquiry-progress" aria-label="Progress">
              {inquiryFields.map((name, index) => {
                const state = index < step ? "complete" : index === step ? "current" : "upcoming";
                const label = `Step ${index + 1}: ${steps[name].label}${state === "complete" ? " (completed)" : ""}`;
                return (
                  <li key={name} data-state={state} aria-current={state === "current" ? "step" : undefined}>
                    {state === "complete" ? (
                      <button type="button" onClick={() => goTo(index)} aria-label={`Back to ${label}`} />
                    ) : (
                      <span className="sr-only">{label}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </dialog>
  );
}
