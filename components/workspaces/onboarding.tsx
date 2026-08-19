"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useKlarioApi } from "@/components/klario-api-provider";
import { Card, RootPageHeader, SectionHeader as KlarioSectionHeader, StatusPill } from "@/components/klario-ui";
import { onboardingApi } from "@/lib/api/klario-api";
import type { BloodGroup, FamilyRelationship, ProfileGender } from "@/lib/api/types";
import { ApiStatusBanner, EmptyState, prettyStatus } from "@/components/workspaces/shared";

const genderOptions: ProfileGender[] = ["female", "male", "other", "prefer_not_to_say"];
const bloodGroupOptions: Array<BloodGroup | ""> = [
  "",
  "a_positive",
  "a_negative",
  "b_positive",
  "b_negative",
  "ab_positive",
  "ab_negative",
  "o_positive",
  "o_negative"
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

  const steps = useMemo(() => [
    { label: "Email", done: Boolean(onboarding?.email_verified) },
    { label: "Profile", done: Boolean(onboarding?.profile_completed) },
    { label: "Family", done: Boolean(onboarding?.family_setup_completed) },
    { label: "Done", done: Boolean(onboarding?.onboarding_completed) }
  ], [onboarding]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      await onboardingApi.updateProfile({
        full_name: profile.full_name,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        phone_number: optionalText(profile.phone_number),
        blood_group: profile.blood_group || null,
        height_cm: optionalNumber(profile.height_cm),
        weight_kg: optionalNumber(profile.weight_kg)
      });
      await api.refreshOnboarding();
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const createFamily = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      await onboardingApi.createFamily({ name: familyName });
      await api.refreshOnboarding();
      setMessage("Family workspace created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Family could not be created.");
    } finally {
      setIsSaving(false);
    }
  };

  const addDependent = async (event: FormEvent<HTMLFormElement>) => {
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
      setIsSaving(false);
    }
  };

  const complete = async () => {
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
      setIsSaving(false);
    }
  };

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
    <div className="settings-workspace">
      <RootPageHeader title="Set up Klario" subtitle="Complete the web workspace setup for this account." />
      <ApiStatusBanner />
      <div className="tag-row">
        {steps.map((step) => <StatusPill key={step.label} tone={step.done ? "green" : "gray"}>{step.label}</StatusPill>)}
      </div>

      <section className="settings-grid">
        <Card className="settings-section-card settings-wide-card">
          <KlarioSectionHeader title="Your profile" subtitle="Used as your personal family profile." />
          <form className="family-detail-form" onSubmit={saveProfile}>
            <label className="family-detail-field is-wide">
              <span className="control-label">Full name</span>
              <input value={profile.full_name} onChange={(event) => setProfile((current) => ({ ...current, full_name: event.target.value }))} required />
            </label>
            <label className="family-detail-field">
              <span className="control-label">Date of birth</span>
              <input type="date" value={profile.date_of_birth} onChange={(event) => setProfile((current) => ({ ...current, date_of_birth: event.target.value }))} required />
            </label>
            <label className="family-detail-field">
              <span className="control-label">Gender</span>
              <select value={profile.gender} onChange={(event) => setProfile((current) => ({ ...current, gender: event.target.value as ProfileGender }))}>
                {genderOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
              </select>
            </label>
            <label className="family-detail-field">
              <span className="control-label">Phone</span>
              <input value={profile.phone_number} onChange={(event) => setProfile((current) => ({ ...current, phone_number: event.target.value }))} />
            </label>
            <label className="family-detail-field">
              <span className="control-label">Blood group</span>
              <select value={profile.blood_group} onChange={(event) => setProfile((current) => ({ ...current, blood_group: event.target.value as BloodGroup | "" }))}>
                {bloodGroupOptions.map((option) => <option key={option || "none"} value={option}>{option ? prettyStatus(option) : "Not set"}</option>)}
              </select>
            </label>
            <label className="family-detail-field">
              <span className="control-label">Height cm</span>
              <input inputMode="decimal" value={profile.height_cm} onChange={(event) => setProfile((current) => ({ ...current, height_cm: event.target.value }))} />
            </label>
            <label className="family-detail-field">
              <span className="control-label">Weight kg</span>
              <input inputMode="decimal" value={profile.weight_kg} onChange={(event) => setProfile((current) => ({ ...current, weight_kg: event.target.value }))} />
            </label>
            <div className="family-detail-form-actions">
              <button className="button button-primary" type="submit" disabled={isSaving}>{onboarding.profile_completed ? "Update profile" : "Save profile"}</button>
            </div>
          </form>
        </Card>

        <Card className="settings-section-card">
          <KlarioSectionHeader title="Family workspace" subtitle="Reports and trends are scoped to a family." />
          <form className="form-grid" onSubmit={createFamily}>
            <label>
              <span className="control-label">Family name</span>
              <input value={familyName} onChange={(event) => setFamilyName(event.target.value)} required />
            </label>
            <button className="button button-primary" type="submit" disabled={!onboarding.profile_completed || onboarding.family_setup_completed || isSaving}>
              {onboarding.family_setup_completed ? "Family created" : "Create family"}
            </button>
          </form>
        </Card>

        <Card className="settings-section-card">
          <KlarioSectionHeader title="Add another profile" subtitle="Optional; you can also do this later." />
          <form className="form-grid" onSubmit={addDependent}>
            <input value={dependent.full_name} onChange={(event) => setDependent((current) => ({ ...current, full_name: event.target.value }))} placeholder="Full name" />
            <select value={dependent.relationship} onChange={(event) => setDependent((current) => ({ ...current, relationship: event.target.value as Exclude<FamilyRelationship, "self"> }))}>
              {relationshipOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
            </select>
            {dependent.relationship === "other" ? (
              <input value={dependent.relationship_other_label} onChange={(event) => setDependent((current) => ({ ...current, relationship_other_label: event.target.value }))} placeholder="Relationship" />
            ) : null}
            <input type="date" value={dependent.date_of_birth} onChange={(event) => setDependent((current) => ({ ...current, date_of_birth: event.target.value }))} />
            <select value={dependent.gender} onChange={(event) => setDependent((current) => ({ ...current, gender: event.target.value as ProfileGender | "" }))}>
              <option value="">Gender not set</option>
              {genderOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
            </select>
            <input type="email" value={dependent.contact_email} onChange={(event) => setDependent((current) => ({ ...current, contact_email: event.target.value }))} placeholder="Contact email" />
            <button className="button button-secondary" type="submit" disabled={!onboarding.family_setup_completed || !dependent.full_name.trim() || isSaving}>Add profile</button>
          </form>
        </Card>

        <Card className="settings-section-card">
          <KlarioSectionHeader title="Finish" subtitle="Open the live dashboard once setup is complete." />
          <button className="button button-primary" type="button" disabled={!onboarding.profile_completed || !onboarding.family_setup_completed || isSaving} onClick={() => void complete()}>
            Continue to dashboard
          </button>
          {message ? <p className="note">{message}</p> : null}
        </Card>
      </section>
    </div>
  );
}
