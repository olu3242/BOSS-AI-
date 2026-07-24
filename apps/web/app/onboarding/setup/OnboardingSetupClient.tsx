"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { apiClient, ApiClientError } from "../../../src/lib/apiClient";
import { useWorkflowSession } from "../../../src/hooks/useWorkflowSession";
import {
  WizardStep1Schema,
  WizardStep2Schema,
  WizardStep3Schema,
  WizardStep6Schema,
  allErrors,
} from "../../../src/lib/validation";
import "./onboarding.css";

const INDUSTRIES = [
  { key: "home_services", icon: "🏠", name: "Home Services", desc: "Plumbing, HVAC, landscaping, cleaning" },
  { key: "restaurant", icon: "🍽️", name: "Restaurant", desc: "Dining, takeout, catering, food service" },
  { key: "retail", icon: "🛍️", name: "Retail", desc: "Brick & mortar, boutique, e-commerce" },
  { key: "healthcare", icon: "⚕️", name: "Healthcare", desc: "Medical practice, clinic, wellness" },
  { key: "beauty_wellness", icon: "💅", name: "Beauty & Wellness", desc: "Salon, spa, fitness, personal care" },
  { key: "professional_services", icon: "💼", name: "Professional", desc: "Law, accounting, consulting, finance" },
  { key: "dental", icon: "🦷", name: "Dental", desc: "Dental practice, orthodontics, oral care" },
  { key: "education", icon: "📚", name: "Education", desc: "Tutoring, childcare, training, coaching" },
  { key: "general_smb", icon: "⚡", name: "Other / General", desc: "Any small business not listed above" },
];

const BUSINESS_TYPES = [
  { value: "LLC", label: "LLC" },
  { value: "Sole Proprietor", label: "Sole Proprietor" },
  { value: "Corporation", label: "Corporation" },
  { value: "S-Corp", label: "S-Corp" },
  { value: "Partnership", label: "Partnership" },
  { value: "Nonprofit", label: "Nonprofit" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COMMON_TOOLS = [
  "QuickBooks", "Square", "Stripe", "Shopify", "Salesforce", "HubSpot",
  "Mailchimp", "Google Workspace", "Microsoft 365", "Slack", "Yelp",
  "Google Business", "Instagram", "Facebook Ads", "Toast POS", "Mindbody",
  "OpenTable", "Calendly", "Acuity Scheduling", "Zendesk",
];

const AI_AGENTS = [
  { key: "revenue_analyst", icon: "📈", name: "Revenue Analyst", desc: "Monitors sales, spots growth opportunities, alerts on dips" },
  { key: "customer_success", icon: "⭐", name: "Customer Success", desc: "Tracks reviews, manages reputation, handles retention" },
  { key: "ops_manager", icon: "⚙️", name: "Operations Manager", desc: "Optimizes workflows, reduces waste, improves efficiency" },
  { key: "marketing_ai", icon: "📣", name: "Marketing AI", desc: "Generates campaigns, manages social, drives leads" },
  { key: "financial_controller", icon: "💰", name: "Financial Controller", desc: "Forecasts cash flow, tracks expenses, billing health" },
  { key: "hr_coordinator", icon: "👥", name: "HR Coordinator", desc: "Handles scheduling, onboarding, team communications" },
];

interface WizardData {
  businessName: string;
  industry: string;
  businessType: string;
  employeeCount: string;
  annualRevenue: string;
  yearsOperating: string;
  locationCount: string;
  openDays: string[];
  openTime: string;
  closeTime: string;
  services: string;
  existingTools: string[];
  aiAgents: string[];
}

const INITIAL: WizardData = {
  businessName: "",
  industry: "",
  businessType: "LLC",
  employeeCount: "1",
  annualRevenue: "0",
  yearsOperating: "0",
  locationCount: "1",
  openDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  openTime: "09:00",
  closeTime: "17:00",
  services: "",
  existingTools: [],
  aiAgents: ["revenue_analyst", "customer_success", "ops_manager"],
};

const TOTAL_STEPS = 7;
const STEP_LABELS = ["Business", "Profile", "Hours", "Services", "Tools", "AI Setup", "Launch"];

function validateStep(step: number, data: WizardData): Record<string, string> {
  if (step === 1) return allErrors(WizardStep1Schema, data);
  if (step === 2) return allErrors(WizardStep2Schema, data);
  if (step === 3) return allErrors(WizardStep3Schema, data);
  if (step === 6) return allErrors(WizardStep6Schema, data);
  return {};
}

export function OnboardingSetupClient({ orgId, userId }: { orgId: string; userId: string }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const { saveStatus, resumedSession, save, complete } = useWorkflowSession({
    workflowType: "onboarding",
    userId,
    totalSteps: TOTAL_STEPS,
    onResumed: () => setShowResumePrompt(true),
  });

  // Auto-save whenever step or data changes (debounced inside save())
  useEffect(() => {
    if (step === TOTAL_STEPS) return; // don't save the completion step
    save({
      currentStep: step,
      completedSteps: Array.from({ length: step - 1 }, (_, i) => i + 1),
      formData: data as unknown as Record<string, unknown>,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, data]);

  const update = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSet = useCallback((key: "openDays" | "existingTools" | "aiAgents", value: string) => {
    setData((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }, []);

  async function handleFinish() {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      const businessHours = `${data.openDays.join(",")} ${data.openTime}-${data.closeTime}`;
      const { business } = await apiClient.createBusiness(orgId, {
        name: data.businessName,
        industry: data.industry || "general_smb",
        businessType: data.businessType,
        employeeCount: Number(data.employeeCount) || 1,
        annualRevenue: Number(data.annualRevenue) || 0,
        yearsOperating: Number(data.yearsOperating) || 0,
        locationCount: Number(data.locationCount) || 1,
        businessHours,
        services: data.services,
        existingTools: data.existingTools,
        aiAgents: data.aiAgents,
      });
      setBusinessId(business.id);
      await complete();
      setStep(TOTAL_STEPS);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.body.message ?? "Business creation failed. Please try again.");
      } else {
        setError("Unable to create your business. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setError(null);
    if (step === TOTAL_STEPS - 1) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  }

  function goBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  const progress = (step / TOTAL_STEPS) * 100;
  const isLastDataStep = step === TOTAL_STEPS - 1;

  return (
    <div className="boss-onboarding">
      <header className="ob-header">
        <Link href="/" className="ob-brand">BOSS</Link>
        <span className="ob-step-label">Step {step} of {TOTAL_STEPS}</span>
      </header>

      <div className="ob-progress">
        <div className="ob-progress-bar">
          <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="ob-progress-steps">
          {STEP_LABELS.map((label, idx) => (
            <span
              key={label}
              className={`ob-progress-step ${idx + 1 < step ? "done" : idx + 1 === step ? "active" : ""}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {showResumePrompt && resumedSession && (
        <div className="ob-resume-banner" role="status">
          <span>You have unsaved progress from a previous session. </span>
          <button
            className="ob-resume-yes"
            onClick={() => {
              const saved = resumedSession.formData as unknown as Partial<WizardData>;
              setData((prev) => ({ ...prev, ...saved }));
              setStep(resumedSession.currentStep);
              setShowResumePrompt(false);
            }}
          >
            Continue where you left off
          </button>
          <button className="ob-resume-no" onClick={() => setShowResumePrompt(false)}>
            Start fresh
          </button>
        </div>
      )}

      <div className="ob-panel">
        {step === 1 && <Step1 data={data} update={update} errors={fieldErrors} />}
        {step === 2 && <Step2 data={data} update={update} errors={fieldErrors} />}
        {step === 3 && <Step3 data={data} update={update} toggleSet={toggleSet} errors={fieldErrors} />}
        {step === 4 && <Step4 data={data} update={update} />}
        {step === 5 && <Step5 data={data} toggleSet={toggleSet} />}
        {step === 6 && <Step6 data={data} toggleSet={toggleSet} errors={fieldErrors} />}
        {step === 7 && <Step7 businessId={businessId} data={data} />}

        {error && <div className="ob-error" role="alert">{error}</div>}

        {step < TOTAL_STEPS && (
          <div className="ob-nav">
            {step > 1
              ? <button className="ob-back" onClick={goBack}>← Back</button>
              : <span />
            }
            <span className="ob-save-status" aria-live="polite">
              {saveStatus === "saving" && "Saving…"}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "error" && "Save failed — will retry"}
            </span>
            <button
              className="ob-next"
              onClick={goNext}
              disabled={submitting}
            >
              {submitting
                ? "Setting up…"
                : isLastDataStep
                ? "Launch my business →"
                : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="ob-field-error" role="alert">{msg}</p>;
}

function Step1({ data, update, errors }: { data: WizardData; update: (k: keyof WizardData, v: string) => void; errors: Record<string, string> }) {
  return (
    <>
      <p className="ob-eyebrow">Step 1 — Your business</p>
      <h1 className="ob-title">What&apos;s your business called?</h1>
      <p className="ob-subtitle">Start with your business name, then pick your industry so BOSS can tailor everything for you.</p>
      <input
        className={`ob-name-input${errors.businessName ? " ob-input-error" : ""}`}
        placeholder="e.g. Downtown Auto Repair"
        value={data.businessName}
        onChange={(e) => update("businessName", e.target.value)}
        autoFocus
        maxLength={100}
        aria-describedby={errors.businessName ? "err-businessName" : undefined}
      />
      <FieldError msg={errors.businessName} />
      <p className="ob-eyebrow" style={{ marginBottom: "0.75rem" }}>Select your industry</p>
      <div className="ob-industry-grid">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.key}
            type="button"
            className={`ob-industry-card ${data.industry === ind.key ? "selected" : ""}`}
            onClick={() => update("industry", ind.key)}
          >
            <span className="ob-industry-icon">{ind.icon}</span>
            <span className="ob-industry-name">{ind.name}</span>
            <span className="ob-industry-desc">{ind.desc}</span>
          </button>
        ))}
      </div>
      <FieldError msg={errors.industry} />
    </>
  );
}

function Step2({ data, update, errors }: { data: WizardData; update: (k: keyof WizardData, v: string) => void; errors: Record<string, string> }) {
  return (
    <>
      <p className="ob-eyebrow">Step 2 — Business profile</p>
      <h1 className="ob-title">Tell us about your business</h1>
      <p className="ob-subtitle">This helps BOSS benchmark you against peers and generate relevant insights.</p>
      <div className="ob-field">
        <label>Business structure</label>
        <select value={data.businessType} onChange={(e) => update("businessType", e.target.value)}>
          {BUSINESS_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="ob-field-row">
        <div className="ob-field">
          <label>Number of employees</label>
          <input type="number" min="1" value={data.employeeCount} onChange={(e) => update("employeeCount", e.target.value)} />
          <FieldError msg={errors.employeeCount} />
        </div>
        <div className="ob-field">
          <label>Number of locations</label>
          <input type="number" min="1" value={data.locationCount} onChange={(e) => update("locationCount", e.target.value)} />
          <FieldError msg={errors.locationCount} />
        </div>
      </div>
      <div className="ob-field-row">
        <div className="ob-field">
          <label>Annual revenue ($)</label>
          <input type="number" min="0" placeholder="0" value={data.annualRevenue} onChange={(e) => update("annualRevenue", e.target.value)} />
          <FieldError msg={errors.annualRevenue} />
        </div>
        <div className="ob-field">
          <label>Years in business</label>
          <input type="number" min="0" placeholder="0" value={data.yearsOperating} onChange={(e) => update("yearsOperating", e.target.value)} />
          <FieldError msg={errors.yearsOperating} />
        </div>
      </div>
    </>
  );
}

function Step3({
  data, update, toggleSet, errors,
}: {
  data: WizardData;
  update: (k: keyof WizardData, v: string) => void;
  toggleSet: (k: "openDays" | "existingTools" | "aiAgents", v: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <>
      <p className="ob-eyebrow">Step 3 — Working hours</p>
      <h1 className="ob-title">When are you open?</h1>
      <p className="ob-subtitle">BOSS schedules tasks, reminders, and AI actions around your actual hours.</p>
      <p style={{ fontSize: "0.8125rem", color: "#a0a0aa", marginBottom: "0.75rem" }}>Days open</p>
      <div className="ob-hours-grid">
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            className={`ob-day-toggle ${data.openDays.includes(day) ? "active" : ""}`}
            onClick={() => toggleSet("openDays", day)}
          >
            {day}
          </button>
        ))}
      </div>
      <FieldError msg={errors.openDays} />
      <div className="ob-field-row" style={{ marginTop: "1rem" }}>
        <div className="ob-field">
          <label>Opening time</label>
          <input type="time" value={data.openTime} onChange={(e) => update("openTime", e.target.value)} />
        </div>
        <div className="ob-field">
          <label>Closing time</label>
          <input type="time" value={data.closeTime} onChange={(e) => update("closeTime", e.target.value)} />
        </div>
      </div>
    </>
  );
}

function Step4({ data, update }: { data: WizardData; update: (k: keyof WizardData, v: string) => void }) {
  return (
    <>
      <p className="ob-eyebrow">Step 4 — Your services</p>
      <h1 className="ob-title">What do you offer?</h1>
      <p className="ob-subtitle">List the products or services you sell.</p>
      <div className="ob-field">
        <label>Services / products (one per line or comma-separated)</label>
        <textarea
          rows={6}
          placeholder={`e.g.\nOil change\nBrake inspection`}
          value={data.services}
          onChange={(e) => update("services", e.target.value)}
          style={{ resize: "vertical" }}
        />
      </div>
    </>
  );
}

function Step5({ data, toggleSet }: { data: WizardData; toggleSet: (k: "openDays" | "existingTools" | "aiAgents", v: string) => void }) {
  return (
    <>
      <p className="ob-eyebrow">Step 5 — Your tool stack</p>
      <h1 className="ob-title">What tools are you using?</h1>
      <p className="ob-subtitle">Select the tools you currently use.</p>
      <div className="ob-chip-grid">
        {COMMON_TOOLS.map((tool) => (
          <button
            key={tool}
            type="button"
            className={`ob-chip ${data.existingTools.includes(tool) ? "selected" : ""}`}
            onClick={() => toggleSet("existingTools", tool)}
          >
            {tool}
          </button>
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: "#6b6b76" }}>
        {data.existingTools.length === 0 ? "Select any that apply — skip if you're starting fresh" : `${data.existingTools.length} selected`}
      </p>
    </>
  );
}

function Step6({ data, toggleSet, errors }: { data: WizardData; toggleSet: (k: "openDays" | "existingTools" | "aiAgents", v: string) => void; errors: Record<string, string> }) {
  return (
    <>
      <p className="ob-eyebrow">Step 6 — Your AI workforce</p>
      <h1 className="ob-title">Activate your AI team</h1>
      <p className="ob-subtitle">Choose which AI employees to deploy first.</p>
      <div className="ob-agent-grid">
        {AI_AGENTS.map((agent) => (
          <button
            key={agent.key}
            type="button"
            className={`ob-agent-card ${data.aiAgents.includes(agent.key) ? "selected" : ""}`}
            onClick={() => toggleSet("aiAgents", agent.key)}
          >
            <div className="ob-agent-header">
              <div className="ob-agent-icon">{agent.icon}</div>
              <span className="ob-agent-name">{agent.name}</span>
            </div>
            <p className="ob-agent-desc">{agent.desc}</p>
          </button>
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: "#6b6b76" }}>
        {data.aiAgents.length === 0 ? "Select at least one AI employee to activate" : `${data.aiAgents.length} AI employee${data.aiAgents.length === 1 ? "" : "s"} selected`}
      </p>
      <FieldError msg={errors.aiAgents} />
    </>
  );
}

function Step7({ businessId, data }: { businessId: string | null; data: WizardData }) {
  const agentCount = data.aiAgents.length;
  const toolCount = data.existingTools.length;
  const industry = INDUSTRIES.find((i) => i.key === data.industry);

  return (
    <div className="ob-ready">
      <div className="ob-ready-icon">🚀</div>
      <h1 className="ob-ready-title">You&apos;re live, {data.businessName.split(" ")[0]}!</h1>
      <p className="ob-ready-subtitle">
        Your business operating system is active. {agentCount} AI employee{agentCount !== 1 ? "s" : ""} are monitoring your business and ready to act.
      </p>
      <div className="ob-ready-stats">
        <div className="ob-ready-stat">
          <span className="ob-ready-stat-value">{agentCount}</span>
          <span className="ob-ready-stat-label">AI Employees</span>
        </div>
        <div className="ob-ready-stat">
          <span className="ob-ready-stat-value">{toolCount > 0 ? toolCount : "—"}</span>
          <span className="ob-ready-stat-label">Tools Connected</span>
        </div>
        <div className="ob-ready-stat">
          <span className="ob-ready-stat-value">{industry?.icon ?? "⚡"}</span>
          <span className="ob-ready-stat-label">{industry?.name ?? "Business"}</span>
        </div>
      </div>
      {businessId ? (
        <Link href={`/business/${businessId}/workspace`} className="ob-ready-cta">
          Open Command Center →
        </Link>
      ) : (
        <Link href="/dashboard" className="ob-ready-cta">
          Go to Dashboard →
        </Link>
      )}
      <p style={{ fontSize: "0.75rem", color: "#6b6b76", marginTop: "-0.5rem" }}>
        Your first Business MRI is running in the background — results in ~2 minutes
      </p>
    </div>
  );
}
