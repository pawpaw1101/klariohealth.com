"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useKlarioApi } from "@/components/klario-api-provider";
import { Card, IconBadge, RootPageHeader, SectionHeader as KlarioSectionHeader, StatusPill } from "@/components/klario-ui";
import { accountApi, authApi } from "@/lib/api/klario-api";
import { protectedQueryKey, queryFreshness } from "@/lib/query-cache";
import type { NotificationPreferencesUpdateRequest, UnitGlucose, UnitHeight, UnitTemperature, UnitWeight } from "@/lib/api/types";
import { ApiStatusBanner, EmptyState, formatDate, prettyStatus, statusClass } from "@/components/workspaces/shared";

const heightOptions: UnitHeight[] = ["cm", "ft_in"];
const weightOptions: UnitWeight[] = ["kg", "lb"];
const temperatureOptions: UnitTemperature[] = ["celsius", "fahrenheit"];
const glucoseOptions: UnitGlucose[] = ["mmol_l", "mg_dl"];

export function AccountWorkspace() {
  return <SettingsWorkspace />;
}

export function SettingsWorkspace() {
  const api = useKlarioApi();
  const [activeSection, setActiveSection] = useState<"account" | "family" | "preferences" | "privacy" | "help">("account");
  const [message, setMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [deletePassword, setDeletePassword] = useState("");
  const accountQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "account", "summary"),
    queryFn: accountApi.get,
    enabled: api.status === "live" && Boolean(api.user?.id),
    ...queryFreshness.account
  });
  const sessionsQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "account", "sessions"),
    queryFn: accountApi.sessions,
    enabled: api.status === "live" && Boolean(api.user?.id),
    ...queryFreshness.account
  });
  const securityEventsQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "account", "security-events"),
    queryFn: () => accountApi.securityEvents({ limit: 5 }),
    enabled: api.status === "live" && Boolean(api.user?.id),
    ...queryFreshness.account
  });
  const unitPrefsQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "account", "unit-preferences"),
    queryFn: accountApi.unitPreferences,
    enabled: api.status === "live" && Boolean(api.user?.id),
    ...queryFreshness.account
  });
  const deletionPreviewQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "account", "deletion-preview"),
    queryFn: accountApi.deletionPreview,
    enabled: api.status === "live" && Boolean(api.user?.id),
    ...queryFreshness.account
  });
  const notificationPreferencesQuery = useQuery({
    queryKey: protectedQueryKey(api.user?.id, "account", "notification-preferences"),
    queryFn: accountApi.notificationPreferences,
    enabled: api.status === "live" && Boolean(api.user?.id),
    ...queryFreshness.account
  });

  const unitMutation = useMutation({
    mutationFn: accountApi.updateUnitPreferences,
    onSuccess: async () => {
      setMessage("Unit preferences saved.");
      await unitPrefsQuery.refetch();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Unit preferences could not be saved.")
  });
  const notificationMutation = useMutation({
    mutationFn: accountApi.updateNotificationPreferences,
    onSuccess: async () => {
      setMessage("Notification preferences saved.");
      await notificationPreferencesQuery.refetch();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Notification preferences could not be saved.")
  });
  // Switching family reloads members/roles in the provider and persists the choice, so every
  // workspace query keyed on the family id has to be dropped afterwards.
  const familySwitchMutation = useMutation({
    mutationFn: async (familyId: string) => {
      await api.setActiveFamilyId(familyId);
      await api.invalidateWorkspaceData();
    },
    onSuccess: (_result, familyId) => {
      const name = api.families.find((family) => family.id === familyId)?.name;
      setMessage(name ? `Switched to ${name}.` : "Active family switched.");
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Family could not be switched.")
  });
  const revokeSessionMutation = useMutation({
    mutationFn: accountApi.revokeSession,
    onSuccess: async () => {
      setMessage("Session revoked.");
      await sessionsQuery.refetch();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Session could not be revoked.")
  });
  const revokeOtherSessionsMutation = useMutation({
    mutationFn: accountApi.revokeOtherSessions,
    onSuccess: async () => {
      setMessage("Other sessions revoked.");
      await sessionsQuery.refetch();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Other sessions could not be revoked.")
  });
  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setMessage("Password changed.");
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Password could not be changed.")
  });
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const proof = await accountApi.reauthenticate({ password });
      return accountApi.requestDeletion({
        confirmation: "DELETE",
        reauthentication_token: proof.reauthentication_token,
        idempotency_key: crypto.randomUUID()
      });
    },
    onSuccess: () => {
      setDeletePassword("");
      setMessage("Account deleted.");
      api.logout();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Account could not be deleted.")
  });

  const account = accountQuery.data;
  const unitPrefs = unitPrefsQuery.data;
  const deletionPreview = deletionPreviewQuery.data;
  const canSubmitPassword = Boolean(passwordForm.current_password && passwordForm.new_password.length >= 8 && passwordForm.new_password === passwordForm.confirm_password);
  const notifications = notificationPreferencesQuery.data;
  const navItems = [
    ["account", "Account"], ["family", "Family & Access"], ["preferences", "Preferences"],
    ["privacy", "Privacy & Data"], ["help", "Help & Support"]
  ] as const;

  return (
    <div className="settings-workspace">
      <RootPageHeader
        title="Settings"
        subtitle="Manage your account, privacy, family access and preferences."
      />
      <ApiStatusBanner />

      <div className="settings-desktop-layout">
        <aside className="settings-sidebar" aria-label="Settings sections">
          {navItems.map(([key, label]) => <button className={activeSection === key ? "is-active" : ""} type="button" key={key} onClick={() => setActiveSection(key)}>{label}</button>)}
          <button className="settings-sign-out" type="button" onClick={() => void api.backendLogout()}>Sign out</button>
        </aside>
      <section className="settings-grid">
        <Card className={`settings-section-card settings-account-card${activeSection === "account" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader title="Profile" subtitle={account?.email ?? api.user?.email ?? "Not signed in"} />
          <div className="settings-summary-row">
            <IconBadge icon="icon_parser_confidence" tone="brand" size={42} />
            <div>
              <h3>{account?.full_name || "Signed-in user"}</h3>
              <p>{account?.member_since ? `Member since ${formatDate(account.member_since)}` : "Account details load from Klario."}</p>
            </div>
            {account ? <StatusPill tone={account.email_verified ? "green" : "yellow"}>{account.email_verified ? "Verified" : "Unverified"}</StatusPill> : null}
          </div>
          {account?.linked_personal_profile ? (
            <Link className="inline-action" href={`/app/family/${account.linked_personal_profile.family_member_id}`}>Open personal profile</Link>
          ) : null}
        </Card>

        <Card className={`settings-section-card${activeSection === "family" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader
            title="Family Members"
            subtitle={api.families.length > 1 ? "Choose which family workspace this device uses." : "The family workspace this device uses."}
            action={api.currentRole ? <StatusPill tone="brand">{prettyStatus(api.currentRole)}</StatusPill> : null}
          />
          {api.families.length ? (
            <>
              <label className="select-field">
                <span className="control-label">Active family</span>
                <select
                  value={api.activeFamily?.id ?? ""}
                  disabled={api.status !== "live" || familySwitchMutation.isPending}
                  onChange={(event) => familySwitchMutation.mutate(event.target.value)}
                >
                  {api.families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
                </select>
              </label>
              <p className="note">
                {familySwitchMutation.isPending
                  ? "Switching family…"
                  : `${api.members.length} ${api.members.length === 1 ? "profile" : "profiles"} in this family. Dashboard, trends, and reports follow this choice.`}
              </p>
              <Link className="inline-action" href="/app/family">Manage family profiles</Link>
            </>
          ) : (
            <EmptyState title="No family yet" body="Create a family to start adding profiles and reports." />
          )}
        </Card>

        <Card className={`settings-section-card settings-support-card${activeSection === "help" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader title="Contact support" subtitle="Get help with your Klario account." />
          <p>Send us your question and include the account email shown above so we can help faster.</p>
          <div className="button-row compact">
            <a className="button button-primary" href="mailto:support@klariohealth.com">Email support</a>
          </div>
        </Card>

        <Card className={`settings-section-card settings-account-security-card${activeSection === "account" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader title="Account & Security" subtitle="Password and account security." />
          <form className="form-grid" onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmitPassword) {
              setMessage("New passwords must match and use at least 8 characters.");
              return;
            }
            changePasswordMutation.mutate({
              current_password: passwordForm.current_password,
              new_password: passwordForm.new_password
            });
          }}>
            <input type="password" autoComplete="current-password" placeholder="Current password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} />
            <input type="password" autoComplete="new-password" placeholder="New password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} />
            <input type="password" autoComplete="new-password" placeholder="Confirm new password" value={passwordForm.confirm_password} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))} />
            <button className="button button-primary" type="submit" disabled={!canSubmitPassword || changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? "Changing" : "Change password"}
            </button>
          </form>
        </Card>

        <Card className={`settings-section-card${activeSection === "preferences" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader title="Units" subtitle="Preferred measurements for health profile fields." />
          {unitPrefs ? (
            <div className="settings-unit-grid">
              <label className="select-field">
                <span className="control-label">Height</span>
                <select value={unitPrefs.height_unit} disabled={unitMutation.isPending} onChange={(event) => unitMutation.mutate({ height_unit: event.target.value as UnitHeight })}>
                  {heightOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
                </select>
              </label>
              <label className="select-field">
                <span className="control-label">Weight</span>
                <select value={unitPrefs.weight_unit} disabled={unitMutation.isPending} onChange={(event) => unitMutation.mutate({ weight_unit: event.target.value as UnitWeight })}>
                  {weightOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
                </select>
              </label>
              <label className="select-field">
                <span className="control-label">Temperature</span>
                <select value={unitPrefs.temperature_unit} disabled={unitMutation.isPending} onChange={(event) => unitMutation.mutate({ temperature_unit: event.target.value as UnitTemperature })}>
                  {temperatureOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
                </select>
              </label>
              <label className="select-field">
                <span className="control-label">Glucose</span>
                <select value={unitPrefs.glucose_unit} disabled={unitMutation.isPending} onChange={(event) => unitMutation.mutate({ glucose_unit: event.target.value as UnitGlucose })}>
                  {glucoseOptions.map((option) => <option key={option} value={option}>{prettyStatus(option)}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <EmptyState title="Unit preferences unavailable" body="Sign in to load unit settings." />
          )}
        </Card>

        <Card className={`settings-section-card${activeSection === "preferences" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader title="Notifications & Reminders" subtitle="Choose which Klario updates are delivered to you." />
          {notifications ? (
            <div className="settings-toggle-list">
              {([
                ["Report processing completed", "report_processing_completed"],
                ["Family invitation received", "family_invitation_received"],
                ["Invitation accepted", "family_invitation_accepted"],
                ["Shared report available", "shared_report_available"],
                ["Reminder delivery", "reminders_enabled"]
              ] as Array<[string, keyof NotificationPreferencesUpdateRequest]>).map(([label, key]) => (
                <label className="settings-toggle-row" key={key}>
                  <span>{label}</span>
                  <input type="checkbox" checked={Boolean(notifications[key])} disabled={notificationMutation.isPending} onChange={(event) => notificationMutation.mutate({ [key]: event.target.checked })} />
                </label>
              ))}
              <label className="settings-toggle-row">
                <span>Email notifications</span>
                <input type="checkbox" checked={notifications.delivery.email} disabled={notificationMutation.isPending || !notifications.capabilities.email_delivery_available} onChange={(event) => notificationMutation.mutate({ delivery: { email: event.target.checked } })} />
              </label>
              <p className="note">{notifications.capabilities.event_notifications_wired ? "Changes apply to supported Klario notifications." : "Preference saved · delivery for some events is not available yet."}</p>
            </div>
          ) : <EmptyState title="Notifications unavailable" body="Sign in to load notification preferences." />}
        </Card>

        <Card className={`settings-section-card settings-wide-card settings-sessions-card${activeSection === "account" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader
            title="Active Sessions"
            subtitle={`${sessionsQuery.data?.sessions.length ?? 0} signed-in sessions.`}
            action={
              <button className="button button-ghost" type="button" disabled={revokeOtherSessionsMutation.isPending} onClick={() => revokeOtherSessionsMutation.mutate()}>
                Revoke others
              </button>
            }
          />
          <div className="record-list compact settings-sessions-grid">
            {sessionsQuery.data?.sessions.length ? (
              sessionsQuery.data.sessions.map((session) => (
                <article className="record" key={session.id}>
                  <div className="record-meta">
                    <span>{session.device_name ?? session.device_type ?? "Klario session"}</span>
                    <span>{session.is_current ? "Current" : `Last active ${session.last_active_at ? formatDate(session.last_active_at) : "unknown"}`}</span>
                  </div>
                  <p>Expires {formatDate(session.expires_at)}.</p>
                  <button
                    className="button button-ghost"
                    type="button"
                    disabled={session.is_current || revokeSessionMutation.isPending}
                    onClick={() => revokeSessionMutation.mutate(session.id)}
                  >
                    Revoke
                  </button>
                </article>
              ))
            ) : (
              <EmptyState title="No sessions" body="Signed-in sessions will appear here." />
            )}
          </div>
        </Card>

        <Card className={`settings-section-card settings-security-events-card${activeSection === "account" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader title="Security Center" subtitle="Recent account activity and security events." />
          <div className="record-list compact">
            {securityEventsQuery.data?.events.length ? (
              securityEventsQuery.data.events.map((event) => (
                <article className="record" key={event.id}>
                  <div className="record-meta">
                    <span>{prettyStatus(event.event_type)}</span>
                    <span className={statusClass("completed")}>{formatDate(event.created_at)}</span>
                  </div>
                  <p>{Object.keys(event.metadata_json).length ? `${Object.keys(event.metadata_json).length} metadata fields` : "Account event"}</p>
                </article>
              ))
            ) : (
              <EmptyState title="No security events" body="Recent account events will appear here." />
            )}
          </div>
        </Card>

        <Card className={`settings-section-card settings-privacy-info-card${activeSection === "privacy" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader title="Privacy & Data" subtitle="How Klario stores and protects your data." />
          <p>Account details, family profiles, reports, parsed health values, dashboard summaries, and trends are uploaded to and stored by the Klario service.</p>
          <p>Klario may retain user-scoped response caches and protected temporary upload files for network resilience. Signing out clears account caches.</p>
          <p>Klario Health organizes information extracted from uploaded health reports. It does not provide a medical diagnosis or replace professional medical advice.</p>
        </Card>

        <Card className={`settings-section-card settings-wide-card settings-danger-zone${activeSection === "privacy" ? "" : " is-hidden"}`}>
          <KlarioSectionHeader title="Delete account" subtitle={deletionPreview?.can_delete ? "Permanently remove your account." : "Deletion may require resolving family ownership first."} />
          {deletionPreview ? (
            <>
              <p>
                {deletionPreview.can_delete
                  ? `This removes account-owned data categories: ${deletionPreview.data_categories.join(", ")}.`
                  : deletionPreview.blocking_reason ?? "This account cannot be deleted yet."}
              </p>
              <form className="form-grid" onSubmit={(event) => {
                event.preventDefault();
                if (!deletionPreview.can_delete || !deletePassword) return;
                if (window.confirm("Delete this Klario account permanently?")) {
                  deleteAccountMutation.mutate(deletePassword);
                }
              }}>
                <input type="password" autoComplete="current-password" placeholder="Confirm with password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} disabled={!deletionPreview.can_delete} />
                <button className="button button-ghost danger-action" type="submit" disabled={!deletionPreview.can_delete || !deletePassword || deleteAccountMutation.isPending}>
                  {deleteAccountMutation.isPending ? "Deleting" : "Delete account"}
                </button>
              </form>
            </>
          ) : (
            <EmptyState title="Deletion preview unavailable" body="Sign in to load account deletion details." />
          )}
        </Card>
      </section>
      </div>
      {message ? <p className="note">{message}</p> : null}
    </div>
  );
}
