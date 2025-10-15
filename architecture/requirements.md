**Note: This is the original version, see the technical specifications google docs for the most up-to-date one.**

# Detailed Requirements

These are small, detailed reqs from ChatGPT. **This is used to design database and APIs**

For MVP, James thinks the important thing is showing how our platform works (vs having a fully functional platform)

## **Accounts & Authentication**

* As a user, I would like to sign up with email & password so I can create an account.

* As a user, I would like to log in and log out with JWT-based sessions so I stay authenticated across requests.

* As a user, I would like to reset my password via email so I can regain access if I forget it.

* As a user, I would like to optionally sign in using OAuth (Google/Apple) so I can sign up faster. *(MVP: email \+ password; add OAuth next phase.)*

* As a user, I would like to update my profile (display name, profile picture/avatar, bio, public artist name, timezone) so my profile is accurate across devices.

  * Implementation notes: store `timezone` (e.g., "America/Toronto") for scheduling and display.

* As a user, I would like to enable/disable email notifications (release reminders, post published confirmations, billing notices).

Security & Implementation notes:

* Use JWT access token \+ refresh token. Access tokens short lived (e.g., 15m), refresh tokens stored in HTTP-only secure cookies.

* Passwords hashed with bcrypt/argon2.

* Rate-limit auth endpoints and implement account lockout after repeated failed logins.

* For dev, SQLite with Prisma; production: strongly recommended PostgreSQL.

---

## **Release strategies & timeline (JTBD 1 — tasks & progress)**

* As a user, I would like to create a release strategy (single default in MVP) so I can group tasks for a release.

* As a user, I would like to see a progress bar that reflects the completion of my release strategy so I know how close I am to release.

  * Progress calculation (MVP): percent \= completedTasks / totalTasks. (Later you can weight tasks.)

* As a user, I would like to add tasks to my release strategy with title, deadline (date/time), status, and notes so I can plan work.

* As a user, I would like to edit task title, deadline, status (Not Started, In Progress, Completed), and notes **inline** in the task list so I can update quickly.

* As a user, I would like to delete tasks with a confirmation modal to avoid accidental removals.

* As a user, I would like the default task list for a new release to include **pre-release, release-day, and post-release tasks** so I get guided steps (MVP).

* As a user, I would like to reorder tasks (drag & drop) to reflect priority or workflow changes.

* As a user, I would like to **filter and sort tasks by due date, status, and priority** so I can focus on what matters.

* As a user, I would like instant UI feedback (optimistic updates) when I change a task so changes feel instantaneous.

  * Non-functional: UI should reflect updates within 100ms of user action (per your UX req).

* As a user, I would like an error to be shown when I try to create more than the maximum allowed tasks (MVP cap \= 500\) so I know when to archive or start a new release plan.

* As a user, I would like to **archive completed releases** so I can keep the dashboard uncluttered.  
* (There are likely more requirements to add)

**bold** \= good stuff that we didn’t previously mention specifically

Data model notes:

* ReleaseStrategy (id, userId, name, createdAt, updatedAt)  
  * Will we have more than one strategy? Do we need a model if we only have one?  
  * I think we can have more than one. Victoria also suggested multiple.

* Task (id, releaseStrategyId, title, description/notes, dueAt, statusEnum, orderIndex, createdAt, updatedAt)  
  * note to self: Check the items above

---

## **Task UX specifics (CUJ 1–3)**

* As a user, I would like to check/uncheck a task’s completion checkbox to mark it complete/incomplete and update the progress bar immediately.

* As a user, I would like to click a task to expand a detail panel that shows title, status selector, notes editor, deadline picker, and delete button.

* As a user, I would like a status toggle (Not Started ↔ In Progress) and a checkbox for Completed so the progress calculation only includes started/completed tasks as required.

* As a user, I would like keyboard shortcuts for adding tasks and marking tasks complete to speed workflow (optional UX enhancement).

* As a user, I would like desktop and mobile-friendly interactions (tap-friendly controls, accessible date picker).

Performance and constraints:

* Support up to 500 tasks per release in MVP, UI should paginate or lazy-load if a release has many tasks.

* Backend endpoints should return list payloads with pagination and sorting options.

---

## **Social media posts & scheduling (JTBD 2 & CUJ 4\)**

* As a user, I would like to create a social media post with text and attached media (images/videos) so I can promote releases.

* As a user, I would like to choose multiple target platforms when creating a post so I can publish simultaneously across platforms.

* As a user, I would like to schedule a post for a future date/time so I can plan campaigns.

* As a user, I would like to edit or cancel a scheduled post before it is published.

* As a user, I would like to save posts as drafts so I can return later and finalize them.

* As a user, I would like to see platform-specific metadata and warnings (character limits, aspect ratio hints) while composing posts so I meet each platform’s rules.

* As a user, I would like a confirmation message when a post publishes successfully or an error message if it fails.

Integration & implementation notes (MVP vs long-term):

* MVP: support at least 2–3 platforms (recommendation: X, Instagram (Meta), TikTok or Facebook) — implement OAuth connectors & token storage for connected accounts. Use platform APIs for posting and handle any rate-limits and different media flows.

* Store OAuth tokens (encrypted) and `lastRefreshAt` & `connectionStatus`.

* Use a background job/worker (e.g., cron \+ job queue like BullMQ or serverless scheduled function) to handle scheduled publishing reliably (MVP can use a server-side scheduler that runs every minute).

* When publishing, implement retries and escalation (webhook/notification to user) on failure.

Post data model:

* SocialPost (id, userId, contentText, mediaRefs\[\], targetPlatformIds\[\], statusEnum {Draft,Scheduled,Published,Failed,Cancelled}, scheduledAt, publishedAt, platformMetadata JSON, createdAt, updatedAt)

* SocialAccount (id, userId, platformEnum, accountUsername, oauthTokenEncrypted, tokenExpiresAt, connectionStatus, lastRefreshAt)

Media & upload constraints:

* Support media up to 50 MB (MVP must support at least 25–50 MB if possible).

* Show upload progress for files \> 5 MB.

* Store media via cloud storage in production (S3/GCS). Dev: local filesystem or SQLite-backed reference with file on disk.

* Provide client-side validation of file types and sizes before upload.

Performance/NFR:

* Immediate posts should complete within 10s. Scheduled posts should publish within 60s of scheduled time (account for queueing & API delays).

* Provide user-visible progress & success/failure UI.

---

## **Profiles, preferences & settings (JTBD 3\)**

* As a user, I would like to edit my artist profile (display name, bio, links to streaming platforms) so my public presence is accurate.

* As a user, I would like to set notification preferences (email, in-app) for release reminders and post status updates.

* As a user, I would like to set my default timezone for scheduling so times appear correctly.

---

## **Billing & subscription (JTBD 3 & CUJ 6\)**

* As a user, I would like to view available pricing tiers and select a plan so I can access paid features.

* As a user, I would like to securely save a payment method for recurring billing (long-term).

* As a user, I would like to upgrade/downgrade or cancel my subscription from my account settings.

* As a user, I would like a simple free tier during MVP with limits (e.g., number of scheduled posts per month, number of releases/tasks).

Implementation notes:

* MVP: mock payment flow or integrate Stripe sandbox.

* Long term: PCI compliant flows via Stripe Checkout \+ subscription API.

* Ensure webhooks handle subscription events (billing success/failure) and update user entitlement.

---

## **App shell, navigation & UI**

* As a user, I would like a single-page app feel so navigation between dashboard, social media, and settings is instant.

* As a user, I would like a responsive UI that renders well on desktop, tablet, and mobile so I can manage from any device.

* As a user, I would like the ability to toggle between light and dark themes so I can choose a comfortable reading mode.

* As a user, I would like keyboard accessible controls and ARIA attributes for accessibility.

Implementation notes:

* Next.js \+ client-side routing (app router or pages router) to produce SPA UX.

* Persist theme choice in user preferences.