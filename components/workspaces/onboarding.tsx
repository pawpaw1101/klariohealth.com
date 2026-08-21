"use client";

import { FormEvent, useMemo, useState, useRef} from "react";
import { useRouter } from "next/navigation";
import { useKlarioApi } from "@/components/klario-api-provider";
import { Card, RootPageHeader, SectionHeader as KlarioSectionHeader, StatusPill } from "@/components/klario-ui";
import { onboardingApi } from "@/lib/api/klario-api";
import type { BloodGroup, FamilyRelationship, ProfileGender } from "@/lib/api/types";
import { ApiStatusBanner, EmptyState, prettyStatus } from "@/components/workspaces/shared";

const genderOptions: ProfileGender[] = ["female", "male", "other", "prefer_not_to_say"];
const bloodGroupOptions: Array<BloodGroup | ""> = [
  "",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "unknown"
];
const relationshipOptions: Exclude<FamilyRelationship, "self">[] = [
  "spouse",
  "mother",
  "father",
  "son",
  "daughter",
  "child",
  "sibling",
  "grandparent",
  "relative",
  "other"
];

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function OnboardingWorkspace() {
  const api = useKlarioApi();
  const router = useRouter();
  const onboarding = api.onboarding;
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState({
    full_name: onboarding?.full_name ?? api.user?.full_name ?? "",
    date_of_birth: onboarding?.date_of_birth ?? "",
    gender: onboarding?.gender ?? "prefer_not_to_say" as ProfileGender,
    phone_number: onboarding?.phone_number ?? "",
    blood_group: onboarding?.blood_group ?? "" as BloodGroup | "",
    height_cm: onboarding?.height_cm ? String(onboarding.height_cm) : "",
    weight_kg: onboarding?.weight_kg ? String(onboarding.weight_kg) : ""
  });
  const [familyName, setFamilyName] = useState(onboarding?.full_name ? `${onboarding.full_name.split(" ")[0]}'s family` : "My family");
  const [dependent, setDependent] = useState({
    full_name: "",
    relationship: "child" as Exclude<FamilyRelationship, "self">,
    relationship_other_label: "",
    date_of_birth: "",
    gender: "" as ProfileGender | "",
    contact_email: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  // `isSaving` gates the buttons, but setState is asynchronous: a second click landing before
  // the re-render still passes the disabled check. A ref flips synchronously, so the request
  // can only be in flight once. Observed as two POSTs to /onboarding/complete from one run.
  const inFlight = useRef(false);

  const steps = useMemo(() => [
    { label: "Email", done: Boolean(onboarding?.email_verified) },
    { label: "Profile", done: Boolean(onboarding?.profile_completed) },
    { label: "Family", done: Boolean(onboarding?.family_setup_completed) },
    { label: "Done", done: Boolean(onboarding?.onboarding_completed) }
  ], [onboarding]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      await onboardingApi.updateProfile({
        full_name: profile.full_name.trim(),
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        phone_number: optionalText(profile.phone_number),
        blood_group: profile.blood_group || null,
        height_cm: optionalNumber(profile.height_cm),
        weight_kg: optionalNumber(profile.weight_kg)
      });
      const status = await api.refreshOnboarding();
      // Settings -> Account and the self family member both display what was just written.
      await api.invalidateWorkspaceData();
      if (!status?.profile_completed) {
        setMessage("Profile saved, but setup is not complete yet. Check the fields above.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be saved.");
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  };

  const createFamily = async (event: FormEvent<HTMLFormElement>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      await onboardingApi.createFamily({ name: familyName.trim() });
      await api.refreshOnboarding();
      await api.invalidateWorkspaceData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Family could not be created.");
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  };

  const addDependent = async (event: FormEvent<HTMLFormElement>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      await onboardingApi.createDependent({
        full_name: dependent.full_name,
        relationship: dependent.relationship,
        relationship_other_label: dependent.relationship === "other" ? optionalText(dependent.relationship_other_label) : null,
        date_of_birth: optionalText(dependent.date_of_birth),
        gender: dependent.gender || null,
        contact_email: optionalText(dependent.contact_email)
      });
      setDependent({ full_name: "", relationship: "child", relationship_other_label: "", date_of_birth: "", gender: "", contact_email: "" });
      setMessage("Profile added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be added.");
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  };

  const complete = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsSaving(true);
    setMessage("");
    try {
      await onboardingApi.complete();
      await api.refreshOnboarding();
      await api.refresh();
      router.replace("/app/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Onboarding could not be completed.");
    } finally {
      inFlight.current = false;
      setIsSaving(false);
    }
  };

  // The backend owns progress, so a refresh or a return visit resumes at the real step
  // rather than wherever local state happened to be.
  const activeStep: "profile" | "family" | "done" = !onboarding?.profile_completed
    ? "profile"
    : !onboarding?.family_setup_completed
      ? "family"
      : "done";

  if (!onboarding) {
    return (
      <div className="settings-workspace">
        <RootPageHeader title="Set up Klario" subtitle="Preparing your workspace." />
        <ApiStatusBanner />
        <EmptyState title="Loading onboarding" body="Your account setup will appear here." />
      </div>
    );
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <header className="onboarding-head">
          <h1>{activeStep === "profile" ? "Set up your profile" : activeStep === "family" ? "Create your family workspace" : "You're all set"}</h1>
          <p>
            {activeStep === "profile"
              ? "A few details to get Klario ready. You can change these later."
              : activeStep === "family"
                ? "Reports and trends are grouped by family. You can add other people now or later."
                : "Your workspace is ready to open."}
          </p>
        </header>

        <ol className="onboarding-steps" aria-label="Setup progress">
          {steps.filter((step) => step.label !== "Email").map((step) => (
            <li
              key={step.label}
              className={`onboarding-step${step.done ? " is-done" : ""}${step.label.toLowerCase() === activeStep ? " is-active" : ""}`}
              aria-current={step.label.toLowerCase() === activeStep ? "step" : undefined}
            >
              <span className="onboarding-step-dot" aria-hidden="true" />
              {step.label}
            </li>
          ))}
        </ol>

        <ApiStatusBanner />

        {activeStep === "profile" ? (
          <form className="onboarding-form" onSubmit={saveProfile} noValidate>
            <label className="onboarding-field is-wide">
              <span className="control-label">Full name</span>
              <input
                value={profile.full_name}
                autoComplete="name"
                onChange={(event) => setProfile((current) => ({ ...current, full_name: event.target.value }))}
                required
              />
            </label>
            <label className="onboarding-field">
              <span className="control-label">Date of birth</span>
              {/* A future birth date is never valid; the browser enforces it before submit. */}
              <input
                type="date"
                value={profile.date_of_birth}
                max={new Date().toISOString().slice(0, 10)}
                autoComplete="bday"
                onChange={(event) => setProfile((current) => ({ ...current, date_of_birth: event.target.value }))}
                required
              />
            </label>
            <label className="onboarding-field">
              <span className="control-label">Gender</span>
              <select value={profile.gender} onChange={(event) => setProfile((current) => ({ ...current, gender: event.target.value as ProfileGender }))}>
                {genderOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
              </select>
            </label>
            <label className="onboarding-field">
              <span className="control-label">Phone <span className="onboarding-optional">optional</span></span>
              <input value={profile.phone_number} autoComplete="tel" onChange={(event) => setProfile((current) => ({ ...current, phone_number: event.target.value }))} />
            </label>
            <label className="onboarding-field">
              <span className="control-label">Blood group <span className="onboarding-optional">optional</span></span>
              <select value={profile.blood_group} onChange={(event) => setProfile((current) => ({ ...current, blood_group: event.target.value as BloodGroup | "" }))}>
                {bloodGroupOptions.map((option) => <option key={option || "none"} value={option}>{option ? prettyStatus(option) : "Not set"}</option>)}
              </select>
            </label>
            <label className="onboarding-field">
              <span className="control-label">Height cm <span className="onboarding-optional">optional</span></span>
              <input inputMode="decimal" value={profile.height_cm} onChange={(event) => setProfile((current) => ({ ...current, height_cm: event.target.value }))} />
            </label>
            <label className="onboarding-field">
              <span className="control-label">Weight kg <span className="onboarding-optional">optional</span></span>
              <input inputMode="decimal" value={profile.weight_kg} onChange={(event) => setProfile((current) => ({ ...current, weight_kg: event.target.value }))} />
            </label>
            {message ? <p className="form-alert onboarding-message" role="alert">{message}</p> : null}
            <div className="onboarding-actions">
              <button className="button button-primary" type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Continue"}
              </button>
            </div>
          </form>
        ) : null}

        {activeStep === "family" ? (
          <>
            <form className="onboarding-form" onSubmit={createFamily} noValidate>
              <label className="onboarding-field is-wide">
                <span className="control-label">Family name</span>
                <input value={familyName} onChange={(event) => setFamilyName(event.target.value)} required />
              </label>
              {message ? <p className="form-alert onboarding-message" role="alert">{message}</p> : null}
              <div className="onboarding-actions">
                <button className="button button-primary" type="submit" disabled={isSaving || !familyName.trim()}>
                  {isSaving ? "Creating…" : "Continue"}
                </button>
              </div>
            </form>
            <p className="onboarding-hint">You can add other people to this family at any time from the Family page.</p>
          </>
        ) : null}

        {activeStep === "done" ? (
          <>
            <form className="onboarding-form" onSubmit={addDependent} noValidate>
              <p className="onboarding-hint onboarding-hint-lead">Add another person now, or skip and go straight to your dashboard.</p>
              <label className="onboarding-field is-wide">
                <span className="control-label">Full name <span className="onboarding-optional">optional</span></span>
                <input value={dependent.full_name} onChange={(event) => setDependent((current) => ({ ...current, full_name: event.target.value }))} />
              </label>
              <label className="onboarding-field">
                <span className="control-label">Relationship</span>
                <select value={dependent.relationship} onChange={(event) => setDependent((current) => ({ ...current, relationship: event.target.value as Exclude<FamilyRelationship, "self"> }))}>
                  {relationshipOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
                </select>
              </label>
              {dependent.relationship === "other" ? (
                <label className="onboarding-field">
                  <span className="control-label">Relationship label</span>
                  <input value={dependent.relationship_other_label} onChange={(event) => setDependent((current) => ({ ...current, relationship_other_label: event.target.value }))} />
                </label>
              ) : null}
              <label className="onboarding-field">
                <span className="control-label">Date of birth <span className="onboarding-optional">optional</span></span>
                <input type="date" max={new Date().toISOString().slice(0, 10)} value={dependent.date_of_birth} onChange={(event) => setDependent((current) => ({ ...current, date_of_birth: event.target.value }))} />
              </label>
              <div className="onboarding-actions is-secondary">
                <button className="button button-ghost" type="submit" disabled={!dependent.full_name.trim() || isSaving}>
                  {isSaving ? "Adding…" : "Add person"}
                </button>
              </div>
            </form>
            {message ? <p className="form-alert onboarding-message" role="alert">{message}</p> : null}
            <div className="onboarding-actions">
              <button className="button button-primary" type="button" disabled={isSaving} onClick={() => void complete()}>
                {isSaving ? "Opening…" : "Go to dashboard"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
