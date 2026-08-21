"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BioIcon } from "@/components/bio-icon";
import { useKlarioApi } from "@/components/klario-api-provider";
import { Card, RootPageHeader, SectionHeader as KlarioSectionHeader, StatusPill } from "@/components/klario-ui";
import {
  canManageInvites,
  canManageMembers,
  invitesApi,
  inviteRoleOptions,
  profilesApi
} from "@/lib/api/klario-api";
import type { BloodGroup, FamilyInvite, FamilyProfileDetail, FamilyProfileUpdate, FamilyRelationship, FamilyRoleType, ProfileGender } from "@/lib/api/types";
import { protectedQueryKey, queryFreshness } from "@/lib/query-cache";
import { ApiError, resolveExternalOrRelativeUrl } from "@/lib/api/client";
import { ApiStatusBanner, EmptyState, formatDate, prettyStatus, statusClass } from "@/components/workspaces/shared";

const avatarGradients = [
  ["#0f766e", "#38bdf8"],
  ["#7c3aed", "#f97316"],
  ["#2563eb", "#22c55e"],
  ["#be123c", "#f59e0b"],
  ["#0891b2", "#a855f7"]
];

const genderOptions: Array<ProfileGender | ""> = ["", "female", "male", "other", "prefer_not_to_say"];
const relationshipOptions: FamilyRelationship[] = [
  "self",
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

function avatarStyle(seed: string): CSSProperties {
  const index = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarGradients.length;
  const [from, to] = avatarGradients[index];
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}

function profileInitials(profile: FamilyProfileDetail) {
  const parts = profile.full_name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "K") + (parts[1]?.[0] ?? "");
}

function profileMeta(profile: FamilyProfileDetail) {
  const relationship = profile.relationship === "other"
    ? profile.relationship_other_label ?? prettyStatus(profile.relationship)
    : prettyStatus(profile.relationship);
  return [
    relationship,
    profile.gender ? prettyStatus(profile.gender) : "",
    profile.date_of_birth ? `Born ${formatDate(profile.date_of_birth)}` : "",
    profile.age !== null ? `${profile.age} years` : ""
  ].filter(Boolean).join(" - ");
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

const profilePhotoTypes = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);
const maxProfilePhotoBytes = 8 * 1024 * 1024;

async function sha256File(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function uploadProfilePhoto(familyId: string, profileId: string, file: File) {
  if (!profilePhotoTypes.has(file.type)) {
    throw new Error("Choose a JPEG, PNG, HEIC, or HEIF profile photo.");
  }
  if (file.size > maxProfilePhotoBytes) {
    throw new Error("Profile photos must be 8 MB or smaller.");
  }

  const checksum = await sha256File(file);
  const intent = await profilesApi.createPhotoUploadIntent(familyId, profileId, {
    content_type: file.type,
    file_size: file.size,
    checksum_sha256: checksum
  });
  const headers = new Headers(intent.required_headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", file.type);
  const response = await fetch(resolveExternalOrRelativeUrl(intent.upload_url), {
    method: "PUT",
    body: file,
    headers
  });
  if (!response.ok) throw new Error("Profile photo upload could not be verified.");
  await profilesApi.completePhotoUpload(familyId, profileId, { checksum_sha256: checksum });
}

function ProfileCard({
  profile
}: {
  profile: FamilyProfileDetail;
}) {
  return (
    <Card className="family-profile-card">
      <span className="family-avatar" style={avatarStyle(profile.id)} aria-hidden="true">
        {profile.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.profile_photo_url} alt="" />
        ) : (
          profileInitials(profile)
        )}
      </span>
      <div>
        <div className="family-profile-card-head">
          <h3>{profile.full_name}</h3>
          <StatusPill tone={profile.status === "active" ? "green" : "gray"}>{prettyStatus(profile.status)}</StatusPill>
        </div>
        <p>{profileMeta(profile) || "Profile details pending"}</p>
        {profile.linked_account ? <span className="tag">{profile.linked_account.email}</span> : null}
      </div>
      <div className="family-profile-card-actions">
        <Link className="button button-ghost" href={`/app/family/${profile.id}`}>Details</Link>
      </div>
    </Card>
  );
}

export function FamilyWorkspace() {
  const api = useKlarioApi();
  const [memberName, setMemberName] = useState("");
  const [relationship, setRelationship] = useState<FamilyRelationship | "">("");
  const [relationshipOtherLabel, setRelationshipOtherLabel] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<ProfileGender | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [email, setEmail] = useState("");
  const roleOptions = inviteRoleOptions(api.currentRole);
  const [role, setRole] = useState<Exclude<FamilyRoleType, "owner">>("viewer");
  const [message, setMessage] = useState("");
  const [activeDialog, setActiveDialog] = useState<"add-profile" | "invitations" | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const familyId = api.activeFamily?.id;
  const memberCreateAllowed = canManageMembers(api.currentRole);
  const invitesAllowed = canManageInvites(api.currentRole);

  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  useEffect(() => {
    if (roleOptions.length && !roleOptions.includes(role)) {
      setRole(roleOptions[0]);
    }
  }, [role, roleOptions]);

  const activeProfilesQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "profiles", "active", familyId),
    queryFn: () => profilesApi.list(familyId!, "active"),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId),
    ...queryFreshness.workspace
  });
  const invitesQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "invites", familyId),
    queryFn: () => invitesApi.list(familyId!),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId) && invitesAllowed,
    ...queryFreshness.processing
  });

  const activeProfiles = activeProfilesQuery.data ?? [];
  const pendingInvites = (invitesQuery.data ?? []).filter((invite) => invite.status === "pending");

  const refetchFamilyWorkspace = async () => {
    await api.invalidateWorkspaceData();
    await Promise.all([activeProfilesQuery.refetch(), invitesQuery.refetch()]);
  };

  const createMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!familyId) return;
    setMessage("");
    const fullName = memberName.trim();
    const otherLabel = relationshipOtherLabel.trim();
    const phoneDigits = phoneNumber.replace(/\D/g, "");
    const height = numberOrNull(heightCm);
    const weight = numberOrNull(weightKg);
    if (!fullName) return setMessage("Enter a full name.");
    if (!relationship) return setMessage("Select a relationship.");
    if (relationship === "other" && !otherLabel) return setMessage("Add a relationship label.");
    if (!dateOfBirth) return setMessage("Add a date of birth.");
    if (new Date(`${dateOfBirth}T00:00:00`).getTime() > Date.now()) return setMessage("Date of birth cannot be in the future.");
    if (phoneNumber.trim() && (phoneDigits.length < 7 || phoneDigits.length > 15)) return setMessage("Enter a valid phone number.");
    if (contactEmail.trim() && !/^\S+@\S+\.\S+$/.test(contactEmail.trim())) return setMessage("Enter a valid contact email.");
    if (heightCm.trim() && (height === null || height < 30 || height > 300)) return setMessage("Height must be between 30 and 300 cm.");
    if (weightKg.trim() && (weight === null || weight < 1 || weight > 500)) return setMessage("Weight must be between 1 and 500 kg.");

    setIsCreatingProfile(true);
    try {
      const member = await api.createMember(familyId, {
        display_name: fullName,
        relationship,
        date_of_birth: dateOfBirth,
        sex: gender || null
      });
      await profilesApi.update(familyId, member.id, {
        relationship,
        relationship_other_label: relationship === "other" ? otherLabel : null,
        date_of_birth: dateOfBirth,
        gender: gender || null,
        phone_number: phoneNumber.trim() || null,
        contact_email: contactEmail.trim().toLowerCase() || null,
        blood_group: bloodGroup || null,
        height_cm: height,
        weight_kg: weight,
        expected_updated_at: member.updated_at
      });

      let successMessage = "Family profile added.";
      if (profilePhoto) {
        try {
          await uploadProfilePhoto(familyId, member.id, profilePhoto);
        } catch {
          successMessage = "Family profile added, but the photo could not be uploaded. You can add it from the profile.";
        }
      }
      setMemberName("");
      setRelationship("");
      setRelationshipOtherLabel("");
      setDateOfBirth("");
      setGender("");
      setPhoneNumber("");
      setContactEmail("");
      setBloodGroup("");
      setHeightCm("");
      setWeightKg("");
      setProfilePhoto(null);
      setMessage(successMessage);
      setActiveDialog(null);
      await refetchFamilyWorkspace();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be created.");
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const createInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!familyId) return;
    setMessage("");
    try {
      await invitesApi.create(familyId, { email, role, expires_in_days: 7 });
      setEmail("");
      setMessage("Invite created.");
      await refetchFamilyWorkspace();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invite could not be created.");
    }
  };

  const actOnInvite = async (invite: FamilyInvite, action: "resend" | "revoke") => {
    setMessage("");
    try {
      if (action === "resend") {
        await invitesApi.resend(invite.id);
        setMessage("Invite resent.");
      } else {
        await invitesApi.revoke(invite.id);
        setMessage("Invite revoked.");
      }
      await refetchFamilyWorkspace();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invite action failed.");
    }
  };

  return (
    <div className="family-workspace">
      <RootPageHeader
        title="Family"
        subtitle={api.activeFamily ? `${api.activeFamily.name} · every health profile keeps its own reports and results.` : "Every health profile keeps its own reports and results."}
      />
      <ApiStatusBanner />

      <section className="family-layout-grid">
        <Card className="family-section-card family-profiles-card">
          <KlarioSectionHeader
            title="Health Profiles"
            subtitle="Select a profile to manage its health information."
            action={(
              <div className="family-header-actions">
                <button
                  className="button button-primary"
                  type="button"
                  disabled={!familyId || !memberCreateAllowed}
                  onClick={() => setActiveDialog("add-profile")}
                >
                  <BioIcon name="icon_family_add" size={16} />
                  Add
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={!familyId || !invitesAllowed}
                  onClick={() => setActiveDialog("invitations")}
                >
                  <BioIcon name="icon_family_header" size={16} />
                  Family Updates
                  {pendingInvites.length ? <span className="button-count">{pendingInvites.length}</span> : null}
                </button>
              </div>
            )}
          />
          <div className="family-profile-list">
            {activeProfilesQuery.isLoading ? (
              <EmptyState title="Loading profiles" body="Profiles from this family will appear here." />
            ) : activeProfiles.length ? (
              activeProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                />
              ))
            ) : (
              <EmptyState title="No profiles" body="Add a profile before uploading reports." />
            )}
          </div>
        </Card>

        <Card className="family-section-card family-updates-card">
          <KlarioSectionHeader
            title="Family Updates"
            subtitle={invitesAllowed ? "Pending invitations and access updates." : "Family access updates available to owners and admins."}
            action={api.currentRole ? <StatusPill tone="brand">{prettyStatus(api.currentRole)}</StatusPill> : null}
          />
          {invitesAllowed ? (
            pendingInvites.length ? (
              <div className="family-updates-list">
                {pendingInvites.map((invite) => (
                  <article className="family-update-row" key={invite.id}>
                    <span className="family-update-icon"><BioIcon name="icon_family_header" size={17} /></span>
                    <div>
                      <strong>{invite.invited_email}</strong>
                      <p>{prettyStatus(invite.role)} · Pending</p>
                    </div>
                    <div className="button-row compact">
                      <button className="button button-ghost" type="button" onClick={() => void actOnInvite(invite, "resend")}>Resend</button>
                      <button className="button button-ghost danger-action" type="button" onClick={() => void actOnInvite(invite, "revoke")}>Revoke</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <EmptyState title="No family updates" body="Pending invitations will show here." />
          ) : (
            <EmptyState title="Your access" body="Your role can view health information. Klario verifies every action against the family permissions on the server." />
          )}
          <button className="inline-action family-archived-link" type="button" onClick={() => setActiveDialog("invitations")} disabled={!invitesAllowed}>Manage invitations</button>
        </Card>
      </section>

      {message ? <p className="note">{message}</p> : null}
      {activeDialog === "add-profile" && portalHost ? createPortal(
        <div className="klario-modal-overlay" role="presentation">
          <div className="klario-modal family-action-modal" role="dialog" aria-modal="true" aria-labelledby="family-add-profile-title">
            <div className="klario-modal-head">
              <div>
                <h2 id="family-add-profile-title">Add health profile</h2>
                <p>A health profile holds records for someone in your family. It does not create a sign-in account.</p>
              </div>
              <button className="button button-ghost icon-button" type="button" aria-label="Close add profile" onClick={() => setActiveDialog(null)}>
                <BioIcon name="icon_action_reject" size={18} />
              </button>
            </div>
            <form className="family-modal-form" onSubmit={createMember}>
              <div className="family-add-profile-grid">
                <label className="family-add-profile-field is-wide">
                  <span className="control-label">Full name</span>
                  <input value={memberName} onChange={(event) => setMemberName(event.target.value)} autoComplete="name" required />
                </label>
                <label className="family-add-profile-field">
                  <span className="control-label">Relationship</span>
                  <select value={relationship} onChange={(event) => setRelationship(event.target.value as FamilyRelationship | "")} required>
                    <option value="" disabled>Select relationship</option>
                    {relationshipOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
                  </select>
                </label>
                {relationship === "other" ? (
                  <label className="family-add-profile-field">
                    <span className="control-label">Relationship label</span>
                    <input value={relationshipOtherLabel} onChange={(event) => setRelationshipOtherLabel(event.target.value)} required />
                  </label>
                ) : null}
                <label className="family-add-profile-field">
                  <span className="control-label">Date of birth</span>
                  <input type="date" value={dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDateOfBirth(event.target.value)} required />
                </label>
                <label className="family-add-profile-field">
                  <span className="control-label">Gender</span>
                  <select value={gender} onChange={(event) => setGender(event.target.value as ProfileGender | "")}>
                    {genderOptions.map((option) => <option key={option || "none"} value={option}>{option ? prettyStatus(option) : "Not set"}</option>)}
                  </select>
                </label>
              </div>

              <fieldset className="family-add-profile-section">
                <legend>Contact details</legend>
                <div className="family-add-profile-grid">
                  <label className="family-add-profile-field">
                    <span className="control-label">Phone number</span>
                    <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} inputMode="tel" autoComplete="tel" />
                  </label>
                  <label className="family-add-profile-field">
                    <span className="control-label">Contact email</span>
                    <input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} type="email" autoComplete="email" />
                  </label>
                </div>
                <p>This email is for contact only and will not create an account.</p>
              </fieldset>

              <fieldset className="family-add-profile-section">
                <legend>Basic health details</legend>
                <div className="family-add-profile-grid">
                  <label className="family-add-profile-field">
                    <span className="control-label">Blood group</span>
                    <select value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value as BloodGroup | "")}>
                      {bloodGroupOptions.map((option) => <option key={option || "none"} value={option}>{option ? prettyStatus(option) : "Not set"}</option>)}
                    </select>
                  </label>
                  <label className="family-add-profile-field">
                    <span className="control-label">Height (cm)</span>
                    <input value={heightCm} onChange={(event) => setHeightCm(event.target.value)} inputMode="decimal" />
                  </label>
                  <label className="family-add-profile-field">
                    <span className="control-label">Weight (kg)</span>
                    <input value={weightKg} onChange={(event) => setWeightKg(event.target.value)} inputMode="decimal" />
                  </label>
                  <label className="family-add-profile-field">
                    <span className="control-label">Profile photo</span>
                    <input type="file" accept="image/jpeg,image/png,image/heic,image/heif" onChange={(event) => setProfilePhoto(event.target.files?.[0] ?? null)} />
                  </label>
                </div>
                {profilePhoto ? <p>Selected photo: {profilePhoto.name}</p> : null}
              </fieldset>
              <div className="family-modal-actions">
                <button className="button button-ghost" type="button" disabled={isCreatingProfile} onClick={() => setActiveDialog(null)}>Cancel</button>
                <button className="button button-primary" type="submit" disabled={!familyId || !memberCreateAllowed || isCreatingProfile}>{isCreatingProfile ? "Adding..." : "Add member"}</button>
              </div>
            </form>
          </div>
        </div>,
        portalHost
      ) : null}
      {activeDialog === "invitations" && portalHost ? createPortal(
        <div className="klario-modal-overlay" role="presentation">
          <div className="klario-modal family-action-modal family-invites-modal" role="dialog" aria-modal="true" aria-labelledby="family-invites-title">
            <div className="klario-modal-head">
              <div>
                <h2 id="family-invites-title">Pending invitations</h2>
                <p>Invite someone to view or manage this family.</p>
              </div>
              <button className="button button-ghost icon-button" type="button" aria-label="Close pending invitations" onClick={() => setActiveDialog(null)}>
                <BioIcon name="icon_action_reject" size={18} />
              </button>
            </div>
            <form className="family-invite-modal-form" onSubmit={createInvite}>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@example.com" required />
              <select value={role} onChange={(event) => setRole(event.target.value as Exclude<FamilyRoleType, "owner">)}>
                {(roleOptions.length ? roleOptions : ["viewer"]).map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
              </select>
              <button className="button button-primary" type="submit" disabled={!invitesAllowed || !familyId}>Send invite</button>
            </form>
            <div className="family-modal-list">
              {pendingInvites.length ? (
                pendingInvites.map((invite) => (
                  <article className="record" key={invite.id}>
                    <div className="record-meta">
                      <span>{invite.invited_email}</span>
                      <span className={statusClass(invite.status)}>{prettyStatus(invite.status)}</span>
                    </div>
                    <p>Expires {formatDate(invite.expires_at)}.</p>
                    <div className="button-row compact">
                      <button className="button button-secondary" type="button" onClick={() => void actOnInvite(invite, "resend")}>Resend</button>
                      <button className="button button-ghost" type="button" onClick={() => void actOnInvite(invite, "revoke")}>Revoke</button>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState title="No invites" body="Pending family invites will appear here." />
              )}
            </div>
          </div>
        </div>,
        portalHost
      ) : null}
    </div>
  );
}

export function FamilyProfileDetailWorkspace({ memberId }: { memberId: string }) {
  const api = useKlarioApi();
  const router = useRouter();
  const familyId = api.activeFamily?.id;
  const [message, setMessage] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const profileQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "profiles", "detail", familyId, memberId),
    queryFn: () => profilesApi.get(familyId!, memberId),
    enabled: api.status === "live" && Boolean(api.user?.id && familyId && memberId),
    ...queryFreshness.workspace
  });
  const profile = profileQuery.data;
  const [form, setForm] = useState({
    full_name: "",
    relationship: "" as FamilyRelationship | "",
    relationship_other_label: "",
    date_of_birth: "",
    gender: "" as ProfileGender | "",
    contact_email: "",
    phone_number: "",
    blood_group: "" as BloodGroup | "",
    height_cm: "",
    weight_kg: ""
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      relationship: (profile.relationship ?? "") as FamilyRelationship | "",
      relationship_other_label: profile.relationship_other_label ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      gender: profile.gender ?? "",
      contact_email: profile.contact_email ?? "",
      phone_number: profile.phone_number ?? "",
      blood_group: profile.blood_group ?? "",
      height_cm: profile.height_cm === null ? "" : String(profile.height_cm),
      weight_kg: profile.weight_kg === null ? "" : String(profile.weight_kg)
    });
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (body: FamilyProfileUpdate) => {
      try {
        return await profilesApi.update(familyId!, memberId, body);
      } catch (error) {
        // A profile can be updated from iOS or another browser while this form is open.
        // Refresh the concurrency token and retry the user's intended edit once.
        if (error instanceof ApiError && error.code === "profile_conflict") {
          const current = await profilesApi.get(familyId!, memberId);
          return profilesApi.update(familyId!, memberId, { ...body, expected_updated_at: current.updated_at });
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await api.refresh();
      router.replace("/app/family");
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Profile could not be updated.")
  });
  const archiveMutation = useMutation({
    mutationFn: () => profilesApi.archive(familyId!, memberId),
    onSuccess: async () => {
      setIsDeleteDialogOpen(false);
      await api.refresh();
      router.replace("/app/family");
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Profile could not be archived.")
  });
  const restoreMutation = useMutation({
    mutationFn: () => profilesApi.restore(familyId!, memberId),
    onSuccess: async () => {
      setMessage("Profile restored.");
      await api.invalidateWorkspaceData();
      await profileQuery.refetch();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Profile could not be restored.")
  });

  const payload = useMemo<FamilyProfileUpdate>(() => ({
    full_name: emptyToNull(form.full_name),
    relationship: form.relationship || null,
    relationship_other_label: form.relationship === "other" ? emptyToNull(form.relationship_other_label) : null,
    date_of_birth: emptyToNull(form.date_of_birth),
    gender: form.gender || null,
    contact_email: emptyToNull(form.contact_email),
    phone_number: emptyToNull(form.phone_number),
    blood_group: form.blood_group || null,
    height_cm: numberOrNull(form.height_cm),
    weight_kg: numberOrNull(form.weight_kg),
    expected_updated_at: profile?.updated_at ?? null
  }), [form, profile?.updated_at]);

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    updateMutation.mutate(payload);
  };

  return (
    <div className="family-workspace family-detail-workspace">
      <RootPageHeader
        title={profile?.full_name ?? "Family profile"}
        subtitle="Update personal, contact, and measurement details."
      />
      <ApiStatusBanner />

      <Card className="family-section-card family-profile-editor-card">
        <div className="family-detail-summary">
          <div className="family-detail-identity">
            <span className="family-avatar family-detail-avatar" style={avatarStyle(memberId)} aria-hidden="true">
              {profile?.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.profile_photo_url} alt="" />
              ) : profile ? (
                profileInitials(profile)
              ) : (
                <BioIcon name="icon_tab_family" size={24} />
              )}
            </span>
            <div>
              <span className="control-label">Profile</span>
              <h2>{profile?.full_name ?? "Waiting for backend"}</h2>
              <div className="family-detail-chips">
                {profile ? <StatusPill tone={profile.status === "active" ? "green" : "gray"}>{prettyStatus(profile.status)}</StatusPill> : null}
                {profile?.relationship ? <span className="tag">{profile.relationship === "other" ? profile.relationship_other_label ?? prettyStatus(profile.relationship) : prettyStatus(profile.relationship)}</span> : null}
                {profile?.age !== null && profile?.age !== undefined ? <span className="tag">{profile.age} years</span> : null}
              </div>
            </div>
          </div>
        </div>
          <KlarioSectionHeader title="Edit profile" subtitle="Keep this profile's details current." />
          <form className="family-detail-form" onSubmit={saveProfile}>
          <div className="family-detail-group">
            <span className="family-detail-group-title">Identity</span>
            <label className="family-detail-field is-wide">
              <span className="control-label">Full name</span>
              <input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} required />
            </label>
            <label className="family-detail-field">
              <span className="control-label">Relationship</span>
              <select value={form.relationship} onChange={(event) => setForm((current) => ({ ...current, relationship: event.target.value as FamilyRelationship | "", relationship_other_label: event.target.value === "other" ? current.relationship_other_label : "" }))} required>
                <option value="" disabled>Select relationship</option>
                {relationshipOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
              </select>
            </label>
            {form.relationship === "other" ? (
              <label className="family-detail-field">
                <span className="control-label">Relationship label</span>
                <input value={form.relationship_other_label} onChange={(event) => setForm((current) => ({ ...current, relationship_other_label: event.target.value }))} required />
              </label>
            ) : null}
            <label className="family-detail-field">
              <span className="control-label">Date of birth</span>
              <input type="date" value={form.date_of_birth} onChange={(event) => setForm((current) => ({ ...current, date_of_birth: event.target.value }))} />
            </label>
            <label className="family-detail-field">
              <span className="control-label">Gender</span>
              <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as ProfileGender | "" }))}>
                {genderOptions.map((option) => <option key={option || "none"} value={option}>{option ? prettyStatus(option) : "Not set"}</option>)}
              </select>
            </label>
          </div>
          <div className="family-detail-group">
            <span className="family-detail-group-title">Contact</span>
            <label className="family-detail-field">
              <span className="control-label">Email</span>
              <input type="email" value={form.contact_email} onChange={(event) => setForm((current) => ({ ...current, contact_email: event.target.value }))} />
            </label>
            <label className="family-detail-field">
              <span className="control-label">Phone</span>
              <input value={form.phone_number} onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))} />
            </label>
          </div>
          <div className="family-detail-group">
            <span className="family-detail-group-title">Measurements</span>
            <label className="family-detail-field">
              <span className="control-label">Blood group</span>
              <select value={form.blood_group} onChange={(event) => setForm((current) => ({ ...current, blood_group: event.target.value as BloodGroup | "" }))}>
                {bloodGroupOptions.map((option) => <option key={option || "none"} value={option}>{option ? prettyStatus(option) : "Not set"}</option>)}
              </select>
            </label>
            <label className="family-detail-field">
              <span className="control-label">Height cm</span>
              <input inputMode="decimal" value={form.height_cm} onChange={(event) => setForm((current) => ({ ...current, height_cm: event.target.value }))} />
            </label>
            <label className="family-detail-field">
              <span className="control-label">Weight kg</span>
              <input inputMode="decimal" value={form.weight_kg} onChange={(event) => setForm((current) => ({ ...current, weight_kg: event.target.value }))} />
            </label>
          </div>
          <div className="family-detail-form-actions">
            {profile?.status === "active" ? (
              <button
                className="button button-ghost danger-action"
                type="button"
                disabled={!profile.capabilities.can_archive_profile || archiveMutation.isPending}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete profile
              </button>
            ) : profile ? (
              <button
                className="button button-secondary"
                type="button"
                disabled={!profile.capabilities.can_restore_profile || restoreMutation.isPending}
                onClick={() => restoreMutation.mutate()}
              >
                {restoreMutation.isPending ? "Restoring" : "Restore profile"}
              </button>
            ) : null}
            <button className="button button-primary" type="submit" disabled={!profile?.capabilities.can_edit_profile || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving" : "Save changes"}
            </button>
          </div>
        </form>
      </Card>

      {message ? <p className="note">{message}</p> : null}
      {isDeleteDialogOpen && profile ? (
        <div className="klario-modal-overlay" role="presentation">
          <section className="klario-modal family-delete-profile-modal" role="dialog" aria-modal="true" aria-labelledby="delete-profile-title">
            <div className="klario-modal-head">
              <div>
                <h2 id="delete-profile-title">Delete {profile.full_name}&rsquo;s profile?</h2>
                <p>This removes the profile from the active family. Existing records are preserved and the profile can be restored from Archived Profiles.</p>
              </div>
              <button className="button button-ghost icon-button" type="button" aria-label="Close delete profile" disabled={archiveMutation.isPending} onClick={() => setIsDeleteDialogOpen(false)}><BioIcon name="icon_action_reject" size={18} /></button>
            </div>
            {archiveMutation.error ? <p className="form-error family-delete-profile-error">{archiveMutation.error instanceof Error ? archiveMutation.error.message : "Profile could not be deleted."}</p> : null}
            <div className="family-delete-profile-actions">
              <button className="button button-ghost" type="button" disabled={archiveMutation.isPending} onClick={() => setIsDeleteDialogOpen(false)}>Cancel</button>
              <button className="button button-danger" type="button" disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate()}>{archiveMutation.isPending ? "Deleting" : "Delete profile"}</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function InvitesWorkspace() {
  return <FamilyWorkspace />;
}
