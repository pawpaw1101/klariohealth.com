# iOS Settings: Exact Active Menu and Submenu Audit

Source audited directly from `BioLens-ios/Projects/App/BioLensApp/Sources/SettingsView.swift` and its declared destinations. “Active” means rendered by the current `SettingsView.body`; commented-out rows and uncalled helper sections are listed separately and are not treated as active settings.

## Active root menu

```text
Settings
├─ ACCOUNT
│  ├─ Profile
│  │  └─ Family Profile Detail
│  ├─ Account & Security
│  │  ├─ Account
│  │  │  ├─ Email Address (verified status when true)
│  │  │  └─ Reset Password → password recovery flow
│  │  ├─ Security
│  │  │  ├─ Active Sessions
│  │  │  │  ├─ Current Device
│  │  │  │  └─ Other Devices → revoke individual session
│  │  │  ├─ Login Activity
│  │  │  └─ Security Alerts
│  │  │     ├─ Notify Me About: New Device Login, Password Changed,
│  │  │     │  Session Revoked, Family Role Changed, Family Access Removed
│  │  │     └─ Delivery: Email; Push only when capability is available
│  │  ├─ Account Management
│  │  │  └─ Sign Out All Other Devices → destructive confirmation
│  │  ├─ Two-Step Verification (only when feature flag and capability allow)
│  │  └─ Danger Zone (only when feature flag and capability allow)
│  │     └─ Delete Account → biometric entry → deletion preview → password
│  │        reauthentication → type DELETE → submit
│  └─ Security Center
│     ├─ Account Activity: Active Sessions, Login Activity
│     ├─ Recent Events
│     └─ Local Protection: Face ID/Touch ID and App Lock (iOS-only)
├─ FAMILY & ACCESS
│  ├─ Family Members → Family tab
│  ├─ Switch family (only when more than one family exists)
│  ├─ My Invitations (only when FamilyAccessFeature is enabled)
│  │  └─ inbound invite: Accept / Decline
│  └─ Archived Profiles → restore profile
├─ PREFERENCES
│  ├─ Notifications & Reminders
│  │  ├─ This Device: Allow notifications / Open iOS Settings / status
│  │  ├─ Delivery Capabilities: Email; Push when capability is available
│  │  ├─ Automatic Notifications: report processing, invitation received,
│  │  │  invitation accepted, shared report available
│  │  ├─ Reminders (when capability is available): My Reminders, delivery toggle
│  │  └─ Quiet Hours (when capability is available): enable, start, end, timezone
│  └─ Units: Height, Weight, Temperature, Blood glucose
├─ PRIVACY & DATA
│  ├─ Privacy & Data → storage/cache explanation
│  ├─ Recently Deleted → report recovery/deletion screen
│  └─ Clear Local Cache → confirmation → success alert (iOS device cache only)
├─ HELP & SUPPORT
│  ├─ Help Centre → in-app FAQ
│  ├─ Contact Support → mail composer / fallback alert
│  ├─ Terms & Privacy → segmented terms/privacy document
│  └─ App Version → version and build
└─ Sign Out → destructive confirmation
```

## Non-active or conditional source items

| Item | Source state | Treatment |
|---|---|---|
| Connected Services / Apple Health | Helper exists but `connectedServicesSection` is not invoked by `body` | Not in active web root navigation |
| Connected Apps | Route exists, root row commented out; endpoint unavailable | Not shown |
| Export My Data | Route exists but no active root row; screen says unavailable | Not shown |
| Klario Sync | Route exists, root row commented out | Not shown |
| Appearance | Route exists, root row commented out; device-local | Not shown |
| Trends Preferences | Route exists, root row commented out; device-local | Not shown |
| Two-Step Verification | Capability/feature gated | Do not claim as available without both gates |
| Delete Account | Capability/feature gated and biometric-gated | Use existing backend capability before rendering action |

## Exact iOS confirmation semantics

| Action | iOS behavior |
|---|---|
| Sign Out | Destructive confirmation; downloaded information removed from device, server data remains |
| Sign Out All Other Devices | Destructive confirmation; current device stays signed in |
| Clear Local Cache | Confirmation, then success alert; only user-scoped downloaded cache is removed |
| Delete Account | Biometric gate, deletion preview, fresh password check, literal `DELETE` final confirmation |
| Revoke invite | Destructive action in invitation management |

## Web alignment rule

The web sidebar uses only the five active iOS root categories: Account, Family & Access, Preferences, Privacy & Data, Help & Support—followed by Sign out. The content adapts these same destinations to desktop cards without promoting dormant, commented, or iOS-only items into new web root settings.
