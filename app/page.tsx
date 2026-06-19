"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import type {
  LeadFormData,
  LeadQualificationResult,
  Priority,
  QualifyLeadResponse,
} from "@/types/lead";

const initialFormData: LeadFormData = {
  name: "",
  email: "",
  phone: "",
  serviceNeeded: "",
  budget: "",
  timeline: "",
  message: "",
};

const services = [
  "AI lead qualification",
  "Appointment booking automation",
  "CRM follow-up workflow",
  "n8n workflow buildout",
  "Google Sheets and Calendar automation",
  "Full funnel automation",
];

const budgets = [
  "Under $1,000",
  "$1,000 - $3,000",
  "$3,000 - $7,500",
  "$7,500 - $15,000",
  "$15,000+",
  "Not sure yet",
];

const timelines = [
  "ASAP",
  "This week",
  "2 - 4 weeks",
  "1 - 3 months",
  "Just researching",
];

const priorityStyles: Record<
  Priority,
  { badge: string; bar: string; text: string }
> = {
  Hot: {
    badge: "border-emerald-400/50 bg-emerald-400/15 text-emerald-200",
    bar: "bg-emerald-400",
    text: "text-emerald-200",
  },
  Warm: {
    badge: "border-amber-300/50 bg-amber-300/15 text-amber-100",
    bar: "bg-amber-300",
    text: "text-amber-100",
  },
  Cold: {
    badge: "border-slate-300/40 bg-slate-300/10 text-slate-200",
    bar: "bg-slate-300",
    text: "text-slate-200",
  },
};

export default function Home() {
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [result, setResult] = useState<LeadQualificationResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const score = useMemo(() => {
    if (!result) return 0;
    return Math.min(100, Math.max(0, Math.round(result.leadScore)));
  }, [result]);

  const currentPriorityStyle = result
    ? priorityStyles[result.priority]
    : priorityStyles.Warm;

  function updateField(field: keyof LeadFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setResult(null);

    try {
      const controller = new AbortController();
const timeoutId = window.setTimeout(() => controller.abort(), 30000);

const response = await fetch("/api/qualify-lead", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(formData),
  signal: controller.signal,
});

window.clearTimeout(timeoutId);

      const data = (await response.json()) as QualifyLeadResponse;

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Request failed.");
      }

      setResult(data.result);
    } catch (reason) {
  const message =
    reason instanceof DOMException && reason.name === "AbortError"
      ? "The request took too long. Please check your OpenAI API key, model name, billing, or server terminal logs."
      : reason instanceof Error
        ? reason.message
        : "Something went wrong while qualifying the lead.";

  setError(message);
} finally {
  setIsSubmitting(false);
}
  }

  return (
    <main className="min-h-screen bg-[#07090f] text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#07090f_0%,#0d1320_45%,#11150e_100%)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <nav className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-200">LeadOps AI</p>
              <p className="text-xs text-slate-500">
                Qualification and booking automation
              </p>
            </div>

            <a
              href="#lead-form"
              className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-white"
            >
              Try the demo
            </a>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="flex flex-col gap-8 pt-4">
              <div className="flex flex-col gap-5">
                <p className="w-fit rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-100">
                  AI-powered sales intake
                </p>

                <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
                  AI Lead Qualification & Appointment Booking Automation
                </h1>

                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Capture inbound demand, qualify intent, draft the first reply,
                  and prepare a sales rep for the next conversation.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Response", "< 60 sec"],
                  ["Score", "0 - 100"],
                  ["Priority", "Hot / Warm / Cold"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="text-xs font-medium text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-white/10 bg-black/20 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-200">
                    Pipeline preview
                  </p>
                  <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-xs font-medium text-emerald-200">
                    Live triage
                  </span>
                </div>

                <div className="grid gap-3">
                  {[
                    ["Hot", "Clinic wants booked calls this week", "92"],
                    ["Warm", "Agency exploring CRM handoff", "68"],
                    ["Cold", "Student researching AI tools", "24"],
                  ].map(([priority, title, itemScore]) => (
                    <div
                      key={title}
                      className="grid grid-cols-[72px_1fr_44px] items-center gap-3 rounded-md border border-white/10 bg-[#111827]/80 p-3"
                    >
                      <span
                        className={`rounded-md border px-2 py-1 text-center text-xs font-semibold ${
                          priorityStyles[priority as Priority].badge
                        }`}
                      >
                        {priority}
                      </span>
                      <p className="text-sm text-slate-300">{title}</p>
                      <p className="text-right text-sm font-semibold text-white">
                        {itemScore}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5" id="lead-form">
              <form
                onSubmit={handleSubmit}
                className="rounded-md border border-white/10 bg-[#0d111b]/95 p-5 shadow-2xl shadow-black/30 sm:p-6"
              >
                <div className="mb-6">
                  <p className="text-sm font-semibold text-cyan-200">
                    Lead capture
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Qualify a new inquiry
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Name"
                    name="name"
                    placeholder="Jane Carter"
                    value={formData.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    required
                  />

                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="jane@company.com"
                    value={formData.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    required
                  />

                  <TextField
                    label="Phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 555 0199"
                    value={formData.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    required
                  />

                  <SelectField
                    label="Service needed"
                    name="serviceNeeded"
                    value={formData.serviceNeeded}
                    onChange={(event) =>
                      updateField("serviceNeeded", event.target.value)
                    }
                    options={services}
                    required
                  />

                  <SelectField
                    label="Budget"
                    name="budget"
                    value={formData.budget}
                    onChange={(event) =>
                      updateField("budget", event.target.value)
                    }
                    options={budgets}
                    required
                  />

                  <SelectField
                    label="Timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={(event) =>
                      updateField("timeline", event.target.value)
                    }
                    options={timelines}
                    required
                  />
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-medium text-slate-300">
                    Message
                  </span>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={(event) =>
                      updateField("message", event.target.value)
                    }
                    rows={5}
                    required
                    placeholder="Tell us about your current lead flow, tools, and booking goals."
                    className="mt-2 w-full resize-none rounded-md border border-white/10 bg-[#07090f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20"
                  />
                </label>

                {error ? (
                  <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-900"
                >
                  {isSubmitting ? "Qualifying lead..." : "Qualify lead"}
                </button>
              </form>

              <section className="rounded-md border border-white/10 bg-[#0d111b]/95 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-400">
                      AI result
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {result ? "Qualification complete" : "Awaiting lead"}
                    </h2>
                  </div>

                  {result ? (
                    <span
                      className={`w-fit rounded-md border px-3 py-1 text-sm font-semibold ${currentPriorityStyle.badge}`}
                    >
                      {result.priority}
                    </span>
                  ) : null}
                </div>

                {result ? (
                  <div className="mt-6 grid gap-5">
                    <div>
                      <div className="mb-2 flex items-end justify-between">
                        <p className="text-sm font-medium text-slate-400">
                          Lead score
                        </p>
                        <p
                          className={`text-3xl font-semibold ${currentPriorityStyle.text}`}
                        >
                          {score}
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${currentPriorityStyle.bar}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    <ResultBlock title="Summary" content={result.summary} />
                    <ResultBlock
                      title="Recommended action"
                      content={result.recommendedAction}
                    />
                    <ResultBlock
                      title="Draft reply"
                      content={result.draftReply}
                      muted
                    />

                    <ListBlock title="Sales notes" items={result.salesNotes} />
                    <ListBlock title="Missing info" items={result.missingInfo} />
                  </div>
                ) : (
                  <div className="mt-6 rounded-md border border-dashed border-white/15 bg-black/15 p-6 text-sm leading-6 text-slate-400">
                    Submit a lead to generate the score, priority, sales notes,
                    recommended action, and draft reply.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

type TextFieldProps = {
  label: string;
  name: keyof LeadFormData;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: "email" | "tel" | "text";
  required?: boolean;
};

function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="mt-2 h-12 w-full rounded-md border border-white/10 bg-[#07090f] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  name: keyof LeadFormData;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
};

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-2 h-12 w-full rounded-md border border-white/10 bg-[#07090f] px-4 text-sm text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/20"
      >
        <option value="">Select one</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type ResultBlockProps = {
  title: string;
  content: string;
  muted?: boolean;
};

function ResultBlock({ title, content, muted = false }: ResultBlockProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-400">{title}</p>
      <p
        className={`rounded-md border border-white/10 p-4 text-sm leading-6 ${
          muted ? "bg-black/20 text-slate-300" : "bg-white/[0.04] text-slate-200"
        }`}
      >
        {content}
      </p>
    </div>
  );
}

type ListBlockProps = {
  title: string;
  items: string[];
};

function ListBlock({ title, items }: ListBlockProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-400">{title}</p>

      {items.length > 0 ? (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-200"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
          No items returned.
        </p>
      )}
    </div>
  );
}