# iOS Family: Active Flow Audit

Source: `FamilyFeature/Sources/FamilyView.swift`, `FamilyProfileDetailView.swift`, `AddToFamilyView.swift`, and `AuthenticationViews.swift` invitation management.

```text
Family
├─ Header actions
│  ├─ Family Updates → pending sent invitations; edit access/message, resend, revoke
│  ├─ Your Access → role-derived permission summary
│  └─ About Family → explanation alert
├─ Active family name
├─ Health Profiles
│  ├─ Add → segmented Add to Family: Health Profile | Invite by Email
│  ├─ Profile row → Family Profile Detail
│  └─ Profile context menu → Use for reports
├─ Family Profile Detail
│  ├─ identity, personal/contact/health fields, photo
│  ├─ archive/restore according to profile status and capability
│  └─ account linking/access actions when allowed
└─ Family invitation management
   ├─ Invite by Email: email, access role, optional message
   ├─ My Invitations: accept / decline inbound invites
   └─ Sent Invitations: resend / revoke pending invites
```

## Web alignment

- The root web Family workspace now uses iOS names: `Health Profiles` and `Family Updates`.
- Pending sent invitations are visible as the desktop adaptation of iOS Family Updates, with server role gating and the same resend/revoke actions.
- Active profiles remain the primary content, and profile detail continues to own profile editing, archive/restore, and account linking behavior.
- Archived profiles are intentionally removed from the root Family workspace because iOS exposes them through Settings → Family & Access → Archived Profiles.

## Remaining gap

The current web API/client exposes sent invitations but not the iOS `My Invitations` inbox (accept/decline) nor the full role-permission summary. Those remain backend/client work; no fake control is rendered.
