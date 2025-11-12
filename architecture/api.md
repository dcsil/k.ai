## k.ai REST API Specification

This document defines the REST APIs for the k.ai MVP based on the Prisma schema and requirements. All endpoints are versioned implicitly via the base path `/api`. Responses are JSON unless specified otherwise.

### Conventions

- Authentication: Bearer access tokens in `Authorization: Bearer <token>`. Refresh token stored in an HTTP-only, Secure cookie `refresh_token`.
- Time: All timestamps are ISO 8601 in UTC (Z). Clients should adjust to user `timezone` for display.
- IDs: All IDs are strings (cuid).
- Pagination: Cursor-based. Use `?limit=20&cursor=<opaque>`; response includes `nextCursor` when more data exists.
- Sorting: Use `?sort=field&order=asc|desc` where supported.
- Errors: Standard shape
  - 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 423 Locked, 429 Too Many Requests, 500 Internal Server Error
  - Error body:
    ```json
    {
      "error": {
        "code": "string",        
        "message": "human readable",
        "details": { "field": "..." }
      }
    }
    ```
- Rate limiting: Auth endpoints and posting are rate-limited. Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Auth & Accounts

### POST /api/auth/signup
- Auth: None
- Description: Create an account with email/password (bcrypt/argon2 hashed server-side). Sends verification email if enabled.
- Request:
  ```json
  { "email": "user@example.com", "password": "StrongP@ssw0rd", "displayName": "Name", "timezone": "America/Toronto" }
  ```
- Response 201:
  ```json
  {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "displayName": "Name",
      "publicArtistName": null,
      "avatarUrl": null,
      "bio": null,
      "timezone": "America/Toronto",
      "emailVerified": null
    },
    "accessToken": "jwt",
    "accessTokenExpiresIn": 900
  }
  ```
- Sets: `refresh_token` cookie
- Errors: 409 (email exists), 422 (weak password/invalid timezone), 429 (rate limit)

### POST /api/auth/login
- Auth: None
- Description: Email/password login. Increments lockout counters on failure.
- Request:
  ```json
  { "email": "user@example.com", "password": "..." }
  ```
- Response 200:
  ```json
  { "accessToken": "jwt", "accessTokenExpiresIn": 900 }
  ```
- Sets: `refresh_token` cookie
- Errors: 401 (invalid creds), 423 (account locked), 429 (rate limit)

### POST /api/auth/refresh
- Auth: Refresh cookie
- Description: Issue a new access token using valid, unrevoked refresh token.
- Request: none (cookie only)
- Response 200:
  ```json
  { "accessToken": "jwt", "accessTokenExpiresIn": 900 }
  ```
- Errors: 401 (missing/invalid cookie), 409 (refresh token rotated/revoked)

### POST /api/auth/logout
- Auth: Access token or refresh cookie
- Description: Revoke current refresh token and clear cookie.
- Response 204

### POST /api/auth/password/request-reset
- Auth: None
- Description: Send reset email if account exists (idempotent).
- Request:
  ```json
  { "email": "user@example.com" }
  ```
- Response 202 (always)

### POST /api/auth/password/reset
- Auth: None
- Description: Reset password with token from email.
- Request:
  ```json
  { "token": "one-time-token", "newPassword": "StrongP@ssw0rd" }
  ```
- Response 204
- Errors: 400 (expired/used), 422 (weak password)

### POST /api/auth/verify-email/request
- Auth: Access token
- Description: Send verification email to current user.
- Response 202

### POST /api/auth/verify-email/confirm
- Auth: None
- Request:
  ```json
  { "token": "one-time-token" }
  ```
- Response 204
- Errors: 400 (invalid/expired)

Note: Social login (Google/Apple) is planned for a later phase. Endpoints will be added when implemented.

---

## Me, Profile, Preferences

### GET /api/me
- Auth: Access token
- Response 200:
  ```json
  {
    "id":"...","email":"...","displayName":null,"publicArtistName":null,
    "avatarUrl":null,"bio":null,"timezone":"America/Toronto","emailVerified":null,
    "role":"USER"
  }
  ```

### PATCH /api/me
- Auth: Access token
- Description: Update profile fields.
- Request (any subset):
  ```json
  {
    "displayName":"...",
    "publicArtistName":"...",
    "avatarUrl":"https://...",
    "bio":"...",
    "timezone":"America/Toronto"
  }
  ```
- Response 200: updated user
- Errors: 422 (invalid timezone/URL length)

### GET /api/me/preferences
- Auth: Access token
- Response 200:
  ```json
  {
    "theme":"SYSTEM",
    "emailReleaseReminders":true,
    "emailPostPublished":true,
    "emailBillingNotices":true,
    "inAppReleaseReminders":true,
    "inAppPostPublished":true,
    "inAppBillingNotices":true
  }
  ```

### PATCH /api/me/preferences
- Auth: Access token
- Request:
  ```json
  { "theme":"LIGHT", "emailReleaseReminders":false }
  ```
- Response 200: updated preferences

---

## Notifications

### GET /api/notifications?limit=&cursor=&status=&type=
- Auth: Access token
- Response 200:
  ```json
  { "items": [ {"id":"...","type":"RELEASE_REMINDER","channel":"EMAIL","status":"SENT","subject":"...","sentAt":"...","readAt":null}], "nextCursor": null }
  ```

### PATCH /api/notifications/{id}/read
- Auth: Access token
- Response 204

---

## Release Strategies

### GET /api/releases?limit=&cursor=&archived=&sort=name|createdAt&order=asc|desc
- Auth: Access token
- Response 200:
  ```json
  { "items": [ {"id":"...","name":"Album A","isArchived":false,"createdAt":"...","updatedAt":"..."} ], "nextCursor": null }
  ```

### POST /api/releases
- Auth: Access token
- Description: Create a release strategy; optionally bootstrap default tasks.
- Request:
  ```json
  { "name":"My Release", "createDefaultTasks": true }
  ```
- Response 201: release object
- Errors: 409 (duplicate name per user), 403/409 (plan limit exceeded: `maxReleases`)

### GET /api/releases/{id}
- Auth: Access token (owner)
- Response 200: release object with optional summary

### PATCH /api/releases/{id}
- Auth: Access token (owner)
- Request:
  ```json
  { "name":"New Name", "isArchived": true }
  ```
- Response 200: updated release

### DELETE /api/releases/{id}
- Auth: Access token (owner)
- Response 204 (cascade deletes tasks)

### POST /api/releases/{id}/progress
- Auth: Access token (owner)
- Description: Returns computed progress for UI
- Response 200:
  ```json
  { "totalTasks": 25, "completedTasks": 10, "percent": 40 }
  ```

---

## Tasks

### GET /api/releases/{id}/tasks?limit=&cursor=&status=&dueFrom=&dueTo=&priority=&sort=position|dueAt|status|priority&order=asc|desc
- Auth: Access token (owner)
- Response 200:
  ```json
  {
    "items": [
      { "id":"...","title":"Upload to Distro","notes":null,"dueAt":null,"status":"NOT_STARTED","priority":"MEDIUM","position":0,"completedAt":null }
    ],
    "nextCursor": null
  }
  ```

### POST /api/releases/{id}/tasks
- Auth: Access token (owner)
- Request:
  ```json
  { "title":"Design cover", "notes":"...", "dueAt":"2025-10-10T17:00:00Z", "status":"NOT_STARTED", "priority":"HIGH" }
  ```
- Response 201: task object
- Errors: 409 (task cap 500 reached per release), 422 (invalid date)

### PATCH /api/tasks/{taskId}
- Auth: Access token (owner)
- Request (any subset):
  ```json
  { "title":"...", "notes":"...", "dueAt":"...", "status":"IN_PROGRESS", "priority":"LOW" }
  ```
- Response 200: updated task

### DELETE /api/tasks/{taskId}
- Auth: Access token (owner)
- Response 204

### POST /api/tasks/{taskId}/complete
- Auth: Access token (owner)
- Response 200: task with `status":"COMPLETED"` and `completedAt` set

### POST /api/tasks/{taskId}/uncomplete
- Auth: Access token (owner)
- Response 200: task with `status` set to `IN_PROGRESS` or `NOT_STARTED` (uses prior state if available)

### POST /api/tasks/reorder
- Auth: Access token (owner)
- Description: Drag-and-drop reorder with stable positions.
- Request:
  ```json
  { "releaseId": "...", "positions": [ { "taskId": "t1", "position": 0 }, { "taskId": "t2", "position": 1 } ] }
  ```
- Response 204
- Errors: 400 (duplicate positions), 404 (task not in release)

---

## Media

### POST /api/media/upload
- Auth: Access token
- Description: Upload a media file (multipart). Validates type and size (<= 50 MB).
- Request: `multipart/form-data` with `file`
- Response 201:
  ```json
  { "id":"...","url":"/uploads/...","mimeType":"image/png","sizeBytes":12345,"width":1024,"height":1024 }
  ```
- Errors: 413 (too large), 415 (unsupported type)

### GET /api/media?limit=&cursor=&mimeType=
- Auth: Access token
- Response 200:
  ```json
  { "items": [ {"id":"...","url":"...","mimeType":"image/png","sizeBytes":12345} ], "nextCursor": null }
  ```

### DELETE /api/media/{id}
- Auth: Access token (owner)
- Response 204
- Errors: 409 (in use by a post)

---

## Social Accounts (Platform Connections)

### GET /api/social/accounts
- Auth: Access token
- Response 200:
  ```json
  { "items": [ {"id":"...","platform":"INSTAGRAM","accountUsername":"myhandle","connectionStatus":"CONNECTED","tokenExpiresAt":"2025-11-01T00:00:00Z"} ] }
  ```

### POST /api/social/accounts/{platform}/connect
- Auth: Access token
- Description: Initiate OAuth flow; returns a redirect URL for consent.
- Response 200:
  ```json
  { "authorizationUrl": "https://auth.platform/..." }
  ```

### POST /api/social/accounts/{platform}/callback
- Auth: None (platform redirects here)
- Description: Finalize OAuth, persist encrypted tokens, link account.
- Request: Query params provided by platform (code/state)
- Response 200: minimal HTML page or JSON `{ "success": true }`

### DELETE /api/social/accounts/{id}
- Auth: Access token (owner)
- Response 204

### POST /api/social/accounts/{id}/refresh
- Auth: Access token (owner)
- Description: Force token refresh if supported.
- Response 200: updated account

---

## Social Posts & Scheduling

### GET /api/posts?limit=&cursor=&status=&platform=&scheduledFrom=&scheduledTo=&releaseId=
- Auth: Access token
- Response 200:
  ```json
  {
    "items": [
      {
        "id":"...",
        "contentText":"New single out now!",
        "status":"SCHEDULED",
        "scheduledAt":"2025-10-10T15:00:00Z",
        "publishedAt":null,
        "platforms":["X","INSTAGRAM"],
        "targets":[{"platform":"X","status":"SCHEDULED","publishedAt":null}],
        "media":[{"id":"...","position":0,"url":"..."}],
        "releaseStrategyId": "..."
      }
    ],
    "nextCursor": null
  }
  ```

### POST /api/posts
- Auth: Access token
- Description: Create a draft post with target platforms and optional media references.
- Request:
  ```json
  {
    "contentText":"...",
    "platforms":["X","INSTAGRAM"],
    "media": [ {"mediaId":"m1","position":0}, {"mediaId":"m2","position":1} ],
    "releaseStrategyId": "optional"
  }
  ```
- Response 201: post object
- Errors: 422 (empty content; length over platform hint), 403/409 (plan limits exceeded)

### GET /api/posts/{id}
- Auth: Access token (owner)
- Response 200: post with targets and media

### PATCH /api/posts/{id}
- Auth: Access token (owner)
- Description: Update draft/scheduled post fields (content, platforms, media ordering). Publishing fields are controlled by schedule/publish endpoints.
- Request:
  ```json
  { "contentText":"...", "platforms":["X","INSTAGRAM"], "media": [ {"postMediaId":"pm1","position":0} ] }
  ```
- Response 200: updated post
- Errors: 409 (cannot modify a PUBLISHED post), 400 (invalid platform list)

### DELETE /api/posts/{id}
- Auth: Access token (owner)
- Response 204
- Errors: 409 (already published and locked from delete if policy requires)

### POST /api/posts/{id}/schedule
- Auth: Access token (owner)
- Description: Schedule for future publishing across targets.
- Request:
  ```json
  { "scheduledAt": "2025-10-10T15:00:00Z" }
  ```
- Response 200: post with status `SCHEDULED`
- Errors: 400 (time in past), 403/409 (monthly scheduled post limit)

### POST /api/posts/{id}/cancel
- Auth: Access token (owner)
- Description: Cancel scheduled publishing.
- Response 200: post with status `CANCELLED`
- Errors: 409 (not in SCHEDULED state)

### POST /api/posts/{id}/publish-now
- Auth: Access token (owner)
- Description: Attempt immediate publish. Returns quickly; actual per-target status tracked asynchronously.
- Response 202: post snapshot (targets set to in-flight states)
- Errors: 400 (missing connected accounts), 429 (platform rate limits)

### POST /api/posts/{id}/media
- Auth: Access token (owner)
- Description: Attach an uploaded media to the post at a given position.
- Request:
  ```json
  { "mediaId": "m1", "position": 0 }
  ```
- Response 201: `{ "postMediaId": "pm1", "position": 0 }`
- Errors: 404 (media not owned), 409 (duplicate media)

### DELETE /api/posts/{id}/media/{postMediaId}
- Auth: Access token (owner)
- Response 204

---

## Billing & Subscription (MVP: mock or Stripe sandbox)

### GET /api/billing/plans
- Auth: Access token
- Response 200:
  ```json
  { "items": [ {"id":"free","name":"Free","priceCents":0,"interval":"month","maxScheduledPostsPerMonth":10,"maxReleases":3,"maxTasksPerRelease":500} ] }
  ```

### GET /api/billing/subscription
- Auth: Access token
- Response 200:
  ```json
  { "plan": {"id":"free","name":"Free"}, "status":"ACTIVE", "currentPeriodEnd":"2025-11-01T00:00:00Z" }
  ```

### POST /api/billing/subscribe
- Auth: Access token
- Description: Start a subscription to a plan. In Stripe mode, returns Checkout URL.
- Request:
  ```json
  { "planId": "pro-monthly" }
  ```
- Response 200 (mock): `{ "success": true }`
- Response 200 (stripe): `{ "checkoutUrl": "https://checkout.stripe.com/..." }`

### POST /api/billing/change-plan
- Auth: Access token
- Request:
  ```json
  { "planId": "free" }
  ```
- Response 200: updated subscription

### POST /api/billing/cancel
- Auth: Access token
- Description: Set `cancelAtPeriodEnd = true`.
- Response 200: updated subscription

### POST /api/webhooks/stripe
- Auth: None (Stripe signed webhooks)
- Description: Handle events to update subscription status.
- Response 200

---

## Health

### GET /api/health
- Auth: None
- Response 200:
  ```json
  { "status":"ok", "time": "2025-10-08T05:00:00Z" }
  ```

---

## Edge Cases & Notes

- Account Lockout: After repeated failed logins, respond 423 with backoff; include `Retry-After` header.
- Duplicate Release Names: Return 409; suggest existing name.
- Task Cap: On creating the 501st task in a release, return 409 with `{ code: "TASK_LIMIT" }`.
- Reordering Tasks: Validate unique, contiguous positions; atomic update transaction.
- Timezone: Store raw timezone string; server operates UTC. Validate IANA TZ.
- Media Upload: Validate MIME and size; compute checksum to dedupe; image/video metadata optional.
- Media Deletion: If used by any post, block with 409 unless `force=true` is supported.
- Social Accounts: Store tokens encrypted; if `connectionStatus != CONNECTED`, block publishing for that platform with detailed error in `SocialPostTarget.error`.
- Scheduling: Reject past times; scheduler tries within 60s; if API rate limits, retry with backoff and set target to `FAILED` after max retries.
- Publishing: If any platform fails, overall post may be `FAILED` but targets indicate per-platform status. Notify user via Notification records.
- Quotas: Enforce `Plan` limits in handlers; include `X-Plan-Limit` and `X-Plan-Usage` headers when applicable.
- Authorization: All entity access is scoped to `userId`. Return 404 for non-owned IDs to avoid information leaks.
- Validation: Use 422 with field-level errors in `details` map.
- Idempotency: For cancel/publish-now, accept replays (return current state).
- Concurrency: Optionally accept `If-Match` with an `etag` derived from `updatedAt` to prevent lost updates.

---

## Data Shapes (Summaries)

### User
```json
{ "id":"...","email":"...","displayName":null,"publicArtistName":null,"avatarUrl":null,"bio":null,"timezone":"America/Toronto","emailVerified":null,"role":"USER","createdAt":"...","updatedAt":"..." }
```

### ReleaseStrategy
```json
{ "id":"...","name":"...","isArchived":false,"createdAt":"...","updatedAt":"..." }
```

### Task
```json
{ "id":"...","title":"...","notes":null,"dueAt":null,"status":"NOT_STARTED","priority":"MEDIUM","position":0,"completedAt":null,"createdAt":"...","updatedAt":"..." }
```

### Media
```json
{ "id":"...","url":"...","fileName":"...","mimeType":"image/png","sizeBytes":12345,"width":1024,"height":1024 }
```

### SocialPost (summary)
```json
{ "id":"...","contentText":"...","status":"DRAFT","scheduledAt":null,"publishedAt":null,"platforms":["X"],"releaseStrategyId":null }
```

### Subscription
```json
{ "plan": {"id":"free","name":"Free"}, "status":"ACTIVE", "currentPeriodStart":"...","currentPeriodEnd":"...","cancelAtPeriodEnd":false }
```
