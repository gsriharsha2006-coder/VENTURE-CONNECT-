# Venture Connect UI/UX refinement plan

Date: 2026-07-31

Branch: `feat/venture-connect-production-foundation`

Starting commit: `2c1b99a47c7edbf84840dbcb2e280cae5746173d`

## Product direction

Venture Connect should read as operational software for emerging founders and the institutions that review them. The central message is: **From an early idea to an opportunity-ready startup.** The supporting product promise is limited to helping founders structure ideas, validate assumptions, prepare stronger applications, and discover relevant programmes. Funding, acceptance, mentorship, and investor access are never guaranteed.

## Audit findings

### Public experience

- The landing page explains too many product areas at equal weight. Its strongest workflow is present, but the hero copy does not use the agreed product message and the validation pricing preview implies immediately bookable supply.
- Public navigation has no validator directory route. Validation discovery points into a protected dashboard, which is confusing before registration.
- Pricing presents paid checkout actions even when payment and backend configuration are unavailable. Plan capacity can remain visible, but purchase actions need an honest unavailable state.
- Product metadata still uses funding-oriented claims and a local placeholder domain.
- Some copy contains broken currency and separator encoding.

### Authentication

- Sign-in and registration expose prototype bypass links into protected routes.
- Registration reports synthetic success when authentication is unavailable. This looks like an account was created when nothing was persisted.
- Password recovery is hidden inside the sign-in form rather than having a clear, focused route.
- Password fields lack visibility controls and field-associated feedback.
- Seven roles are presented as peers. Founder, validator, and institution use cases are not clear at first glance.
- Missing backend configuration is described using implementation terminology and, in places, suggests that prototype authentication is active.

### Navigation and protected access

- The platform route group has no server-side authentication gate.
- Navigation is inferred from the URL rather than the authenticated profile role.
- A notification dot is always displayed even when there are no notification records.
- Duplicate aliases exist for Idea Workspace, Opportunities, Messaging, Services, VC Readiness, and investor surfaces. The dashboard-prefixed founder routes are the intended navigation path, but aliases increase maintenance and visual drift.
- The mobile drawer does not move focus into the dialog or restore focus when it closes.

### Founder dashboard and Idea Workspace

- The dashboard always renders fixture metrics, applications, workspaces, opportunity recommendations, and messages. This creates unsupported traction and activity when demo mode is disabled.
- Zero-data scenarios should lead with one useful next action, not four empty analytics cards.
- Idea Workspace is a very long client component with document list, editor, export, versioning, reporting, validation, and destructive actions in one surface.
- Section navigation and completion are useful, but action density is high on narrow screens and save state is not consistently announced.
- Missing backend configuration currently allows local-only create/update behavior without clearly describing persistence limits.

### Opportunities and applications

- Opportunity fixtures include invented organisations, verification states, applicant counts, funding language, and official-source claims.
- Data functions silently return those fixtures when Supabase is unavailable, and write functions return mock success objects.
- Opportunity filters are capable but visually dense. Verification, application method, deadline, and source should have higher priority than decorative category treatment.
- The application screen mixes founder tracking with reviewer decision controls. Local buttons can mark an application interested, shortlisted, or rejected without backend authority.
- External registration tracking needs a clear founder-entered status label and must not imply organiser confirmation.

### VC Readiness and AI

- The report client constructs a prototype identity and plan when no authenticated backend is available.
- Report generation has development fallback behavior that can look persisted or entitled.
- AI output needs a persistent assistance disclaimer and should never be presented as human verification.

### Validation Hub and validator surfaces

- Demo validator data is correctly disabled by default and trust presentation suppresses unsupported ratings and affiliations.
- The protected directory still shows four zero-value trust metric cards when no records exist; these add noise rather than confidence.
- Missing-data copy exposes an environment-variable name to ordinary users.
- A public profile route exists, but there is no public listing/empty-state route.
- Booking, workspace, report, and validator dashboards contain prototype-local actions. They must remain inaccessible without authentication and configuration.
- Validator dashboard metrics and earnings must only appear from real records or explicit demo mode.

### Messaging

- Server authorization is interest-gated, but the UI includes fixture conversations and local send behavior.
- Message surfaces need explicit context, delivery state, failure state, attachment limits, and an honest empty state.
- Realtime messaging must not be implied until Supabase is configured and verified.

### Institution, organiser, admin, and service-provider surfaces

- Investor and organiser routes share one broad interface while the shell labels them from the URL rather than account role.
- Admin and provider pages contain local-state approve, reject, suspend, and verification actions that resemble real administrative changes.
- Operational metrics are fixture-based. Empty states should explain that records become available only after backend setup and authenticated access.
- Several primary actions have no handler or persist only in component state.

### Visual system and responsive behavior

- Core primitives use a consistent navy, white, neutral, and blue palette, but legacy utilities still support broad glass, gradient, grid, and dark-mode treatments that can cause visual drift.
- Some pages place cards inside card-like sections and repeat the same bordered panel treatment for every paragraph.
- Dense tables rely on horizontal scrolling rather than converting important rows into mobile summaries.
- Long action groups can wrap unpredictably around 360-390 px widths.
- Global form sizing appropriately prevents iOS zoom, and reduced-motion handling already exists.

### Accessibility

- Focus styles are present globally, but mobile-dialog focus management is incomplete.
- Password visibility controls and focused recovery flow are missing.
- Several status changes are local text without consistent `role=status` or `role=alert` behavior.
- Tabs do not consistently reference tab panels, and some icon controls rely on visual context rather than complete accessible names.
- Disabled actions do not always explain why they are unavailable.

## Implementation priorities

1. Add a real protected-route gate and derive navigation from authenticated profile role.
2. Remove authentication bypasses, synthetic registration success, fake notification state, and silent mock write success.
3. Gate all production-looking fixtures behind explicit demo configuration and provide useful empty/configuration states.
4. Refocus the landing page, public validation directory, authentication, and pricing around direct product language and honest availability.
5. Improve the active founder dashboard, opportunity, application, validation, and messaging states without changing authorization or database contracts.
6. Add reusable password, backend-availability, and operational empty-state components.
7. Add regression tests for public rendering, missing configuration, navigation, demo gating, and authentication boundaries.

## Screens requiring focused redesign

- Landing page and public header/footer
- Sign-in, registration/role selection, password recovery, password update
- Public validator directory and validator empty profile
- Founder dashboard zero-data experience
- Opportunities and applications empty/configuration states
- Validation Hub empty/configuration state
- Messaging empty and unavailable states
- Shared AppShell navigation and mobile drawer

## Deferred until Supabase staging exists

- Live account creation and role routing
- Authenticated dashboard visual verification
- Live opportunity, application, validation, and messaging records
- RLS and cross-account checks
- Storage upload/download behavior
- Realtime message delivery
- Payment and subscription activation
- Administrative verification workflows
