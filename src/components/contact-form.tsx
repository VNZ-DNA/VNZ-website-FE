"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  BUDGETS,
  FIELDS,
  LIMITS,
  SOURCES,
  TIMELINES,
  TOPICS,
  isVietnamPhone,
} from "@/lib/contact-form";
import { CONTACT_FORM_UI, ERRORS, FORM, RESULTS } from "@/lib/dictionary";
import { t, type Locale } from "@/lib/i18n";

/**
 * The `/lien-he` enquiry form — the left column of the contact page.
 *
 * This is a client component because TDD-023 requires the browser to call the
 * public backend directly. That preserves the visitor IP for the backend's
 * per-IP rate limiter instead of making every request appear to come from the
 * Next.js server.
 *
 * FIELD NAMES COME FROM `FIELDS`, never typed as string literals: the markup,
 * validation and the outgoing payload have to agree, and a field renamed on one
 * side only arrives empty on the other — a failure nobody notices until a real
 * enquiry is lost.
 *
 * ERRORS ARE ANNOUNCED, NOT JUST COLOURED. The summary banner is a live region
 * and takes focus on each new result, and every failing control gets
 * `aria-invalid` plus `aria-describedby` pointing at its own message. A red
 * border alone is invisible to a screen reader and to anyone who can't
 * distinguish it.
 *
 * `fallbackEmail` is `CONTACT.email` when one exists. It is passed in rather
 * than imported so this component never has to reason about whether the address
 * is real — the page decides, this renders it only if given.
 */

/** Shared label styling — pixel face, small caps, ink. */
const LABEL = "block font-pixel text-sm uppercase tracking-[0.18em] text-ink-soft";

/** Marks a field the public API will reject when empty. */
function Required() {
  return (
    <span aria-hidden className="ml-1 text-ember">
      *
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 font-viet text-xs font-light text-lantern">
      {message}
    </p>
  );
}

type ContactState = {
  status: "idle" | "ok" | "error" | "unconfigured";
  message?: string;
  errors?: Partial<Record<string, string>>;
  attempt: number;
};

type ContactApiResponse = {
  isSuccess: boolean;
  message: string;
  data: { id: string; createdAt: string } | null;
  errors: { code: string; fields: string[] } | null;
};

const INITIAL_STATE: ContactState = { status: "idle", attempt: 0 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Submit({ locale, pending }: { locale: Locale; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-pixel font-pixel inline-flex items-center gap-2 px-8 py-3.5 text-lg uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-70"
    >
      {t(pending ? FORM.sending : CONTACT_FORM_UI.submit, locale)}
      <span aria-hidden>▸</span>
    </button>
  );
}

export function ContactForm({
  locale,
  fallbackEmail,
  endpoint,
}: {
  locale: Locale;
  fallbackEmail?: string;
  endpoint?: string;
}) {
  const [state, setState] = useState<ContactState>(INITIAL_STATE);
  const [pending, setPending] = useState(false);

  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const errId = (name: string) => `${uid}-${name}-error`;

  const form = useRef<HTMLFormElement>(null);
  const banner = useRef<HTMLDivElement>(null);

  // Reset the fields once a submission actually went out — but ONLY then. A
  // reset on failure would throw away everything the visitor typed and hand them
  // an empty form plus an error, which is how a long enquiry gets abandoned.
  useEffect(() => {
    if (state.status === "ok") form.current?.reset();
  }, [state.status, state.attempt]);

  // Move focus to the result banner on every new result. Keyed on `attempt`
  // rather than `status`, so two identical failures in a row still announce —
  // `status` alone would not change and the effect would not re-run.
  useEffect(() => {
    if (state.status !== "idle") banner.current?.focus();
  }, [state.status, state.attempt]);

  const err = state.errors ?? {};
  const describedBy = (name: string) => (err[name] ? errId(name) : undefined);
  const invalid = (name: string) => (err[name] ? true : undefined);

  const apiFieldMessage = (field: string) => {
    if (field === FIELDS.topic) return t(ERRORS.topicRequired, locale);
    if (field === FIELDS.name) return t(ERRORS.nameRequired, locale);
    if (field === FIELDS.email) return t(ERRORS.emailInvalid, locale);
    if (field === FIELDS.phone) return t(ERRORS.phoneInvalid, locale);
    if (field === FIELDS.company) return t(ERRORS.companyTooLong, locale);
    if (field === FIELDS.message) return t(ERRORS.messageRequired, locale);
    if (field === FIELDS.consent) return t(ERRORS.consentRequired, locale);
    return t(ERRORS.fieldInvalid, locale);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentForm = event.currentTarget;
    const attempt = state.attempt + 1;

    if (!currentForm.reportValidity()) return;

    const data = new FormData(currentForm);
    const value = (key: string) => {
      const raw = data.get(key);
      return typeof raw === "string" ? raw.trim() : "";
    };

    // Honeypot: keep the old silent-success behavior without forwarding anything.
    if (value(FIELDS.honeypot)) {
      setState({ status: "ok", message: t(RESULTS.contactOk, locale), attempt });
      return;
    }

    const topic = value(FIELDS.topic);
    const fullName = value(FIELDS.name);
    const email = value(FIELDS.email);
    const phone = value(FIELDS.phone);
    const companyName = value(FIELDS.company);
    const budgetRange = value(FIELDS.budget);
    const expectedStart = value(FIELDS.timeline);
    const message = value(FIELDS.message);
    const source = value(FIELDS.source);
    const consentToDataProcessing = data.get(FIELDS.consent) !== null;

    const errors: Record<string, string> = {};
    const containsNul = (input: string) => input.includes("\0");

    if (!TOPICS.some((option) => option.value === topic))
      errors[FIELDS.topic] = t(ERRORS.topicRequired, locale);

    if (!fullName) errors[FIELDS.name] = t(ERRORS.nameRequired, locale);
    else if (fullName.length > LIMITS.name || containsNul(fullName))
      errors[FIELDS.name] = t(ERRORS.nameTooLong, locale);

    if (!email) errors[FIELDS.email] = t(ERRORS.emailRequired, locale);
    else if (email.length > LIMITS.email || !EMAIL.test(email) || containsNul(email))
      errors[FIELDS.email] = t(ERRORS.emailInvalid, locale);

    if (phone.length > LIMITS.phone || !isVietnamPhone(phone) || containsNul(phone))
      errors[FIELDS.phone] = t(ERRORS.phoneInvalid, locale);

    if (companyName.length > LIMITS.company || containsNul(companyName))
      errors[FIELDS.company] = t(ERRORS.companyTooLong, locale);

    if (budgetRange && !BUDGETS.some((option) => option.value === budgetRange))
      errors[FIELDS.budget] = t(ERRORS.fieldInvalid, locale);
    if (expectedStart && !TIMELINES.some((option) => option.value === expectedStart))
      errors[FIELDS.timeline] = t(ERRORS.fieldInvalid, locale);
    if (source && !SOURCES.some((option) => option.value === source))
      errors[FIELDS.source] = t(ERRORS.fieldInvalid, locale);

    if (!message || containsNul(message))
      errors[FIELDS.message] = t(ERRORS.messageRequired, locale);

    if (!consentToDataProcessing)
      errors[FIELDS.consent] = t(ERRORS.consentRequired, locale);

    if (Object.keys(errors).length) {
      setState({
        status: "error",
        message: t(RESULTS.checkFields, locale),
        errors,
        attempt,
      });
      return;
    }

    if (!endpoint) {
      setState({
        status: "unconfigured",
        message: t(RESULTS.contactUnconfigured, locale),
        attempt,
      });
      return;
    }

    setPending(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "omit",
        cache: "no-store",
        body: JSON.stringify({
          inquiryTopic: topic,
          fullName,
          email,
          phone: phone || null,
          companyName: companyName || null,
          budgetRange: budgetRange || null,
          expectedStart: expectedStart || null,
          message,
          source: source || null,
          consentToDataProcessing,
        }),
      });

      let payload: ContactApiResponse | null = null;
      try {
        payload = (await response.json()) as ContactApiResponse;
      } catch {
        // A proxy-level 413 may not return the application's JSON envelope.
      }

      if (response.ok && payload?.isSuccess) {
        setState({ status: "ok", message: t(RESULTS.contactOk, locale), attempt });
        return;
      }

      const code = payload?.errors?.code;
      if (response.status === 400 && code === "CONTACT_CREATE_VALIDATION_FAILED") {
        const fieldErrors = Object.fromEntries(
          (payload?.errors?.fields ?? []).map((field) => [field, apiFieldMessage(field)]),
        );
        setState({
          status: "error",
          message: t(RESULTS.checkFields, locale),
          errors: fieldErrors,
          attempt,
        });
        return;
      }

      if (response.status === 429 || code === "CONTACT_RATE_LIMITED") {
        const retryAfter = Number.parseInt(response.headers.get("Retry-After") ?? "", 10);
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 600;
        setState({
          status: "error",
          message: `${t(RESULTS.contactRateLimited, locale)} ${wait} ${locale === "vi" ? "giây" : "seconds"}.`,
          attempt,
        });
        return;
      }

      if (response.status === 413 || code === "CONTACT_REQUEST_TOO_LARGE") {
        setState({
          status: "error",
          message: t(RESULTS.contactTooLarge, locale),
          attempt,
        });
        return;
      }

      if (response.status === 415 || code === "CONTACT_CONTENT_TYPE_UNSUPPORTED") {
        setState({
          status: "error",
          message: t(RESULTS.contactUnsupported, locale),
          attempt,
        });
        return;
      }

      setState({
        status: "error",
        message: t(RESULTS.contactFailed, locale),
        attempt,
      });
    } catch (error) {
      console.error("[lien-he] public contact request failed", error);
      setState({
        status: "error",
        message: t(RESULTS.contactFailed, locale),
        attempt,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={form} onSubmit={handleSubmit} noValidate={false} className="w-full">
      {/* ── Result banner ──
          `tabIndex={-1}` so the effect above can focus it; `role="status"` +
          `aria-live` so it is announced even when focus lands elsewhere. It is
          rendered (not hidden) only when there is something to say. */}
      {state.status !== "idle" && state.message ? (
        <div
          ref={banner}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className={`mb-8 border-l-[3px] p-4 font-viet text-sm font-light leading-relaxed outline-none sm:text-base ${
            state.status === "ok"
              ? "border-jade bg-jade/10 text-ink"
              : "border-lantern bg-lantern/10 text-ink"
          }`}
        >
          <p className="font-pixel text-base uppercase tracking-[0.15em]">
            {t(state.status === "ok" ? FORM.sent : FORM.notSent, locale)}
          </p>
          <p className="mt-1.5">{state.message}</p>
          {/* On a failure — including "channel not connected" — offer the direct
              address if one exists. Without it there is nothing honest to add,
              so nothing is added. */}
          {state.status !== "ok" && fallbackEmail ? (
            <p className="mt-1.5">
              {t(FORM.orEmail, locale)}{" "}
              <a
                href={`mailto:${fallbackEmail}`}
                className="underline underline-offset-2 transition-colors hover:text-ember"
              >
                {fallbackEmail}
              </a>
              .
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Honeypot ── hidden from sight AND from assistive tech, never
          autofilled, never tabbable. See the note in `contact-form.ts`. */}
      <div aria-hidden className="hidden">
        <label htmlFor={id(FIELDS.honeypot)}>Website</label>
        <input
          id={id(FIELDS.honeypot)}
          type="text"
          name={FIELDS.honeypot}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Topic — full width, and FIRST. It frames everything under it: someone
            here to apply for a job should not have to read past a budget field
            to work out the form is not for them. */}
        <div className="sm:col-span-2">
          <label htmlFor={id(FIELDS.topic)} className={LABEL}>
            {t(CONTACT_FORM_UI.topic, locale)}
            <Required />
          </label>
          <select
            id={id(FIELDS.topic)}
            name={FIELDS.topic}
            required
            defaultValue=""
            aria-invalid={invalid(FIELDS.topic)}
            aria-describedby={describedBy(FIELDS.topic)}
            className="pixel-input mt-2"
          >
            <option value="" disabled>
              {t(CONTACT_FORM_UI.topicPlaceholder, locale)}
            </option>
            {TOPICS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.label, locale)}
              </option>
            ))}
          </select>
          <FieldError id={errId(FIELDS.topic)} message={err[FIELDS.topic]} />
        </div>

        <div>
          <label htmlFor={id(FIELDS.name)} className={LABEL}>
            {t(CONTACT_FORM_UI.name, locale)}
            <Required />
          </label>
          <input
            id={id(FIELDS.name)}
            name={FIELDS.name}
            type="text"
            required
            maxLength={LIMITS.name}
            autoComplete="name"
            placeholder={t(CONTACT_FORM_UI.namePlaceholder, locale)}
            aria-invalid={invalid(FIELDS.name)}
            aria-describedby={describedBy(FIELDS.name)}
            className="pixel-input mt-2"
          />
          <FieldError id={errId(FIELDS.name)} message={err[FIELDS.name]} />
        </div>

        <div>
          <label htmlFor={id(FIELDS.email)} className={LABEL}>
            {t(CONTACT_FORM_UI.email, locale)}
            <Required />
          </label>
          <input
            id={id(FIELDS.email)}
            name={FIELDS.email}
            type="email"
            required
            maxLength={LIMITS.email}
            autoComplete="email"
            placeholder={t(CONTACT_FORM_UI.emailPlaceholder, locale)}
            aria-invalid={invalid(FIELDS.email)}
            aria-describedby={describedBy(FIELDS.email)}
            className="pixel-input mt-2"
          />
          <FieldError id={errId(FIELDS.email)} message={err[FIELDS.email]} />
        </div>

        <div>
          {/* Phone is OPTIONAL. Requiring one on a first contact costs more
              enquiries than it gains calls — anyone who wants to be phoned will
              fill it in. */}
          <label htmlFor={id(FIELDS.phone)} className={LABEL}>
            {t(CONTACT_FORM_UI.phone, locale)}
          </label>
          <input
            id={id(FIELDS.phone)}
            name={FIELDS.phone}
            type="tel"
            maxLength={LIMITS.phone}
            autoComplete="tel"
            inputMode="tel"
            placeholder={t(CONTACT_FORM_UI.phonePlaceholder, locale)}
            aria-invalid={invalid(FIELDS.phone)}
            aria-describedby={describedBy(FIELDS.phone)}
            className="pixel-input mt-2"
          />
          <FieldError id={errId(FIELDS.phone)} message={err[FIELDS.phone]} />
        </div>

        <div>
          <label htmlFor={id(FIELDS.company)} className={LABEL}>
            {t(CONTACT_FORM_UI.company, locale)}
          </label>
          <input
            id={id(FIELDS.company)}
            name={FIELDS.company}
            type="text"
            maxLength={LIMITS.company}
            autoComplete="organization"
            placeholder={t(CONTACT_FORM_UI.companyPlaceholder, locale)}
            aria-invalid={invalid(FIELDS.company)}
            aria-describedby={describedBy(FIELDS.company)}
            className="pixel-input mt-2"
          />
          <FieldError id={errId(FIELDS.company)} message={err[FIELDS.company]} />
        </div>

        <div>
          <label htmlFor={id(FIELDS.budget)} className={LABEL}>
            {t(CONTACT_FORM_UI.budget, locale)}
          </label>
          <select
            id={id(FIELDS.budget)}
            name={FIELDS.budget}
            defaultValue=""
            aria-invalid={invalid(FIELDS.budget)}
            aria-describedby={describedBy(FIELDS.budget)}
            className="pixel-input mt-2"
          >
            <option value="">{t(FORM.optional, locale)}</option>
            {BUDGETS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.label, locale)}
              </option>
            ))}
          </select>
          <FieldError id={errId(FIELDS.budget)} message={err[FIELDS.budget]} />
        </div>

        <div>
          <label htmlFor={id(FIELDS.timeline)} className={LABEL}>
            {t(CONTACT_FORM_UI.timeline, locale)}
          </label>
          <select
            id={id(FIELDS.timeline)}
            name={FIELDS.timeline}
            defaultValue=""
            aria-invalid={invalid(FIELDS.timeline)}
            aria-describedby={describedBy(FIELDS.timeline)}
            className="pixel-input mt-2"
          >
            <option value="">{t(FORM.optional, locale)}</option>
            {TIMELINES.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.label, locale)}
              </option>
            ))}
          </select>
          <FieldError id={errId(FIELDS.timeline)} message={err[FIELDS.timeline]} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={id(FIELDS.message)} className={LABEL}>
            {t(CONTACT_FORM_UI.message, locale)}
            <Required />
          </label>
          <textarea
            id={id(FIELDS.message)}
            name={FIELDS.message}
            required
            rows={7}
            placeholder={t(CONTACT_FORM_UI.messagePlaceholder, locale)}
            aria-invalid={invalid(FIELDS.message)}
            aria-describedby={describedBy(FIELDS.message)}
            className="pixel-input mt-2"
          />
          <FieldError id={errId(FIELDS.message)} message={err[FIELDS.message]} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={id(FIELDS.source)} className={LABEL}>
            {t(CONTACT_FORM_UI.source, locale)}
          </label>
          <select
            id={id(FIELDS.source)}
            name={FIELDS.source}
            defaultValue=""
            aria-invalid={invalid(FIELDS.source)}
            aria-describedby={describedBy(FIELDS.source)}
            className="pixel-input mt-2"
          >
            <option value="">{t(FORM.optional, locale)}</option>
            {SOURCES.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.label, locale)}
              </option>
            ))}
          </select>
          <FieldError id={errId(FIELDS.source)} message={err[FIELDS.source]} />
        </div>
      </div>

      {/* ── Consent ──
          Unticked by default and required, which is the only version of this
          that means anything. The scope is narrow on purpose: permission to
          REPLY, not a marketing opt-in — there is no mailing list to join, and
          asking for one here would be collecting a permission nothing uses. */}
      <div className="mt-7">
        <div className="flex items-start gap-3">
          <input
            id={id(FIELDS.consent)}
            name={FIELDS.consent}
            type="checkbox"
            value="yes"
            required
            aria-invalid={invalid(FIELDS.consent)}
            aria-describedby={describedBy(FIELDS.consent)}
            className="mt-1 size-4 shrink-0 rounded-none border border-ink/30 accent-[var(--color-ember)]"
          />
          <label
            htmlFor={id(FIELDS.consent)}
            className="font-viet text-sm font-light leading-relaxed text-ink-soft"
          >
            {t(CONTACT_FORM_UI.consent, locale)}
            <Required />
          </label>
        </div>
        <FieldError id={errId(FIELDS.consent)} message={err[FIELDS.consent]} />
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Submit locale={locale} pending={pending} />
        <p className="font-viet text-xs font-light leading-relaxed text-ink-soft">
          {t(FORM.requiredNoteLead, locale)}{" "}
          <span className="text-ember">*</span> {t(FORM.requiredNote, locale)}
        </p>
      </div>
    </form>
  );
}
