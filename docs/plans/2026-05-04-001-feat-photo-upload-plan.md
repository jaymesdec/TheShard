---
title: "feat: Add photo upload to messages, notes, and profile pictures"
type: feat
status: active
date: 2026-05-04
origin: docs/brainstorms/photo-upload-requirements.md
---

# feat: Add photo upload to messages, notes, and profile pictures

## Overview

Add image upload to three surfaces of TheShard: group chat messages (attach/send photos), notes (image attachments rendered as thumbnails), and user profile pictures (replaces initials avatar). All surfaces share a common upload path through the existing Create.xyz upload infrastructure and a shared lightbox component.

## Problem Frame

TheShard is entirely text-based. Users cannot share screenshots, photos, or visual references in group chat, attach images to notes, or set a profile picture. Upload infrastructure exists (`src/utils/useUpload.js` client-side, `src/app/api/utils/upload.js` server-side) but is unused. The `auth_users.image` column exists in the DB but is never surfaced to the UI. (see origin: `docs/brainstorms/photo-upload-requirements.md`)

## Requirements Trace

- R1. Users can send photos in group chat via attach button, drag-and-drop, or clipboard paste
- R2. A single message can include multiple images (max 10)
- R3. Image-only messages (no text) are allowed
- R4. Users can attach images to notes, rendered as thumbnails below note text
- R5. Image-only notes (no text) are allowed
- R6. Users can upload a profile picture that replaces the initials avatar everywhere
- R7. Users can remove their profile picture to revert to initials
- R8. All surfaces support lightbox viewing of full-size images
- R9. Upload accepts JPEG, PNG, GIF, WebP; rejects other types; enforces 4MB max
- R10. Upload works on both local dev and Vercel deployment
- R11. Google OAuth must not overwrite user-uploaded profile pictures

## Scope Boundaries

- No video upload or media player
- No image editing (crop, filters, annotations) — profile picture uses CSS circular mask only, no actual crop tool
- No gallery/media library view
- No file attachments (PDFs, documents)
- No rich text / block-based note editor — images attach as a list, not inline
- No upload progress bar — spinner only (the `useUpload` hook returns boolean `loading`, not progress percentage)
- Mobile app (`apps/mobile`) parity is out of scope for this plan

## Context & Research

### Relevant Code and Patterns

- **Upload hook**: `src/utils/useUpload.js` — `[upload, { loading }]` tuple, posts to `/_create/api/upload/`, returns `{ url, mimeType }` or `{ error }`
- **Server-side upload**: `src/app/api/utils/upload.js` — posts directly to `https://api.createanything.com/v0/upload`, no auth token required
- **DB layer**: `src/app/api/utils/db.js` — dual Postgres/JSON-mock, schema via `ensureSchema()` with `ALTER TABLE ADD COLUMN IF NOT EXISTS`
- **Messages API**: `src/app/api/groups/[id]/messages/route.js` — GET/POST, validates non-empty content, calls `db.messages.create(userId, groupId, content)`
- **Notes API**: `src/app/api/notes/route.js` (GET/POST) + `src/app/api/notes/[id]/route.js` (PATCH/DELETE) — validates non-empty body, 10K char limit
- **Profile API**: `src/app/api/users/profile/route.js` — GET/PATCH, only handles `profile_color`
- **UserAvatar**: `src/components/UserAvatar.jsx` — renders initials/color circle, no `image` prop, used in ~7 call sites
- **Chat UI**: `src/app/groups/page.jsx` lines 553-596 — text input + send button, message bubbles render `msg.content` only
- **Notes UI**: `src/components/NoteList.jsx` — masonry grid, inline editing with `<textarea>`, no file input
- **Profile UI**: `src/app/account/profile/page.jsx` — color picker grid, no image upload
- **Modals**: Custom Tailwind overlays (not Chakra Modal) — see `src/app/calendar/DayView.jsx` lines 215-321
- **Toasts**: `sonner` `<Toaster>` mounted in `src/app/root.tsx` but `toast()` never called in app code
- **Mutations**: TanStack React Query v5 — use `isPending` (not `isLoading`), `gcTime` (not `cacheTime`)
- **Route registration**: `server/app.ts` — static imports + `mountApiRoute()`, static paths before parameterized
- **JWT callbacks**: Both `__create/index.ts` (lines 131-136) and `server/app.ts` (lines 115-119) sync `token.picture` to `auth_users.image`

### Institutional Learnings

- `server/app.ts` must have ALL API routes statically imported (no dynamic discovery on Vercel)
- Route order in Hono matters: static paths before parameterized
- `auth_users.id` is UUID, app tables use TEXT — JOINs need `::text` cast
- Use `neon()` HTTP driver, not Pool, for Vercel serverless
- TanStack React Query v5: `isPending` not `isLoading`, `gcTime` not `cacheTime`

## Key Technical Decisions

- **Upload proxy for Vercel**: Add a `/api/upload` proxy route in `server/app.ts` that forwards to `api.createanything.com/v0/upload`. Update `useUpload` to post to `/api/upload` instead of `/_create/api/upload/` so it works in both environments. The server-side `upload.js` already calls the Create.xyz API without auth, confirming no API key is needed. Rationale: the `/_create/api/upload/` path only exists inside the Create.xyz sandbox; Vercel deployments need a working path.

- **Upload timing**: Upload immediately on attach (not on send). Rationale: provides instant feedback, makes send fast, and orphaned CDN images from cancelled messages are acceptable — they are not tracked in the DB.

- **Image data shape in JSONB**: Store as `[{url: string}]` arrays. The `useUpload` hook also returns `mimeType`, but we don't need it for rendering. Keeping a simple object (not bare strings) leaves room for future extension without a migration. Rationale: minimal but extensible.

- **Image-only messages/notes — DB constraint**: Change `app_messages.content` to `TEXT NOT NULL DEFAULT ''` (drop NOT NULL would require null-safety everywhere; default empty string is simpler). Relax API validation: allow empty content when images are present. Same pattern for `app_notes.content`. Rationale: minimal migration, no null-handling changes needed.

- **Profile picture — Google OAuth guard**: Add `has_custom_image BOOLEAN DEFAULT false` column to `auth_users`. When true, JWT callback skips the Google image sync. Rationale: simplest guard; avoids complex merge logic. Both `__create/index.ts` and `server/app.ts` must be updated.

- **Profile picture removal**: Use PATCH with `{ image: null }` rather than a new DELETE handler. Rationale: follows existing profile PATCH pattern, avoids a new route.

- **Max images**: 10 per message, 10 per note. Enforce both client-side and server-side. Rationale: prevents UI blowup and keeps JSONB payloads reasonable.

- **Lightbox**: Build as a custom Tailwind overlay (matching the existing modal pattern in `DayView.jsx`), not Chakra Modal. Rationale: the codebase uses custom modals, not Chakra modals.

- **Broken image fallback**: `onError` handler on `<img>` tags swaps to a placeholder icon (Lucide `ImageOff`). Rationale: prevents broken image squares without a wrapper component.

- **Toast notifications**: Use `sonner` `toast()` for upload errors and profile picture changes. The `<Toaster>` is already mounted. Rationale: upload errors are transient and shouldn't persist in inline UI; toasts match the pattern the app already prepared for.

## Open Questions

### Resolved During Planning

- **Q: Does `api.createanything.com/v0/upload` require auth?** A: No — the server-side `upload.js` calls it with no auth headers and the function is working. The proxy just needs to forward the request body.
- **Q: DELETE endpoint for profile picture removal?** A: No — use PATCH with `{ image: null }` to clear. Simpler, fewer routes.
- **Q: Profile picture crop tool?** A: No — use CSS `object-fit: cover` + `border-radius: 50%` for circular display. No actual cropping library. The "crop preview" from the requirements doc becomes a circular preview of the selected image before confirming.
- **Q: Progress bar vs spinner?** A: Spinner only. `useUpload` returns boolean `loading`, not progress. Files are max 4MB — spinners are sufficient.

### Deferred to Implementation

- Exact error message text for toast notifications — choose during implementation
- Whether the upload proxy needs CORS headers — test during implementation
- Optimal thumbnail dimensions for message and note images — decide during implementation based on visual testing

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```mermaid
flowchart TD
    subgraph Client
        A[User selects/drops/pastes image] --> B[Validate type + size]
        B -->|Invalid| C[Toast error]
        B -->|Valid| D[useUpload → POST /api/upload]
        D -->|uploading| E[Show spinner]
        D -->|success| F[Store CDN URL in local state]
        D -->|error| C
        F --> G[Render thumbnail preview]
        G --> H[User clicks Send/Save]
        H --> I[POST/PATCH to API with images array]
    end

    subgraph Server - Upload Proxy
        D --> J[/api/upload proxy]
        J --> K[Forward to api.createanything.com/v0/upload]
        K --> L[Return CDN URL]
    end

    subgraph Server - Feature APIs
        I --> M[Validate images array ≤ 10]
        M --> N[Store in DB: images JSONB column]
    end
```

## Implementation Units

- [ ] **Unit 1: Upload proxy route**

**Goal:** Create a server-side proxy so client uploads work on Vercel (not just in Create.xyz sandbox). Update `useUpload` to use the new path.

**Requirements:** R10

**Dependencies:** None

**Files:**
- Create: `src/app/api/upload/route.js`
- Modify: `src/utils/useUpload.js`
- Modify: `server/app.ts`

**Approach:**
- Create a new API route at `src/app/api/upload/route.js` that accepts POST requests. **Important**: the Create.xyz upload API (`api.createanything.com/v0/upload`) only accepts `application/json` (url/base64) and `application/octet-stream` (buffer) — it does NOT accept multipart/form-data. The proxy must handle the conversion: for incoming `FormData` requests, parse the file from the form data, extract the buffer, and forward as `application/octet-stream`. For JSON and octet-stream inputs, forward directly.
- Update `useUpload.js` to post to `/api/upload` instead of `/_create/api/upload/`. This path works in both dev (auto-discovered by route-builder) and Vercel (statically imported).
- Add the static import and `mountApiRoute('/upload', ...)` to `server/app.ts`.
- The 4.5MB body limit is already enforced globally — no additional limit needed.

**Patterns to follow:**
- `src/app/api/utils/upload.js` for the Create.xyz API call pattern
- `server/app.ts` integration proxy (lines 260-285) for the forwarding pattern

**Test scenarios:**
- Happy path: POST with FormData file → proxy extracts buffer, forwards as octet-stream → returns `{ url, mimeType }` with CDN URL
- Happy path: POST with JSON `{ url: "..." }` → forwards directly → returns `{ url, mimeType }`
- Error path: POST with file exceeding 4.5MB → returns 413
- Error path: Create.xyz API returns error → proxy returns error response to client
- Integration: FormData-to-buffer conversion preserves file content (verify uploaded image is valid)

**Verification:**
- `useUpload` hook successfully uploads a file and receives a CDN URL when running both `bun run dev` and on Vercel

---

- [ ] **Unit 2: Database schema changes**

**Goal:** Add `images` JSONB columns to messages and notes tables, add `has_custom_image` to auth_users, and relax the `content` NOT NULL constraint on messages.

**Requirements:** R2, R3, R4, R5, R11

**Dependencies:** None

**Files:**
- Modify: `src/app/api/utils/db.js`

**Approach:**
- In `ensureSchema()`, add:
  - `ALTER TABLE app_messages ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'`
  - `ALTER TABLE app_messages ALTER COLUMN content SET DEFAULT ''`
  - `ALTER TABLE app_notes ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'`
  - `ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS has_custom_image BOOLEAN DEFAULT false`
- For the JSON mock path: update the mock data structures to include `images: []` defaults when creating messages and notes, and `has_custom_image: false` for users.
- Note: `content` stays NOT NULL with a DEFAULT '' — this avoids null-safety changes downstream while allowing image-only messages that send empty content.

**Patterns to follow:**
- Existing `ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS profile_color TEXT NULL` in `ensureSchema()`

**Test scenarios:**
- Happy path: `ensureSchema()` runs without error and the new columns exist
- Edge case: `ensureSchema()` runs twice (idempotent) — no duplicate column errors
- Happy path: JSON mock creates a message with `images: []` by default

**Verification:**
- App starts successfully with both `DATABASE_URL` set and unset
- New columns are visible in the database

---

- [ ] **Unit 3: Messages API — accept and return images**

**Goal:** Update the messages API to accept an `images` array on POST and return it on GET. Relax content validation for image-only messages.

**Requirements:** R1, R2, R3

**Dependencies:** Unit 2

**Files:**
- Modify: `src/app/api/groups/[id]/messages/route.js`
- Modify: `src/app/api/utils/db.js` (the `db.messages.create` and `db.messages.list` methods)

**Approach:**
- **POST handler**: Read `images` from request body. Relax validation: require either `content.trim()` is non-empty OR `images` is a non-empty array. Validate `images` is an array of `{url: string}` objects, max 10 items. Pass `images` to `db.messages.create()`.
- **`db.messages.create()`**: Add `images` parameter (default `[]`). In Postgres branch, add `images` to the INSERT. In JSON mock branch, store `images` on the message object.
- **`db.messages.list()`**: Postgres branch already uses `m.*` so `images` is automatically included. Also add `u.image` to the SELECT so chat messages carry the sender's profile picture (needed for rendering avatars next to messages). JSON mock branch returns `...m` so it will include `images` if stored.

**Patterns to follow:**
- Existing `db.messages.create(userId, groupId, content)` signature pattern
- Existing POST validation pattern in the messages route

**Test scenarios:**
- Happy path: POST with `{ content: "hello", images: [{url: "https://cdn.example.com/img.jpg"}] }` → message created with both content and images
- Happy path: POST with `{ content: "", images: [{url: "..."}] }` → image-only message created (content defaults to empty string)
- Edge case: POST with `{ content: "", images: [] }` → 400 error (neither content nor images)
- Edge case: POST with `{ content: "hello" }` → works as before, images defaults to `[]`
- Error path: POST with `{ images: [{url: "..."}, ...11 items] }` → 400 error (exceeds max 10)
- Error path: POST with `{ images: "not-an-array" }` → 400 error (invalid type)

**Verification:**
- Messages with images appear correctly in the API response
- Existing text-only messages continue to work without changes

---

- [ ] **Unit 4: Notes API — accept and return images**

**Goal:** Update the notes API to accept and store an `images` array on POST/PATCH and return it on GET. Allow image-only notes.

**Requirements:** R4, R5

**Dependencies:** Unit 2

**Files:**
- Modify: `src/app/api/notes/route.js`
- Modify: `src/app/api/notes/[id]/route.js`
- Modify: `src/app/api/utils/db.js` (the `db.notes.create`, `db.notes.update`, `db.notes.list` methods)

**Approach:**
- **POST handler** (`notes/route.js`): Read `images` from body alongside `title` and `body`. Relax validation: allow empty title AND empty body when `images` is non-empty (both `cleanTitle` and `cleanBody` checks must be conditional). Validate images array (max 10 items, each `{url: string}`). Pass to `db.notes.create()`.
- **PATCH handler** (`notes/[id]/route.js`): Read `images` from body. Relax the guard that requires title or body — also allow images-only updates. Pass to `db.notes.update()`.
- **`db.notes.create()`**: Add `images` parameter. Update both Postgres INSERT and JSON mock branches.
- **`db.notes.update()`**: Add `images` to the UPDATE SET clause. Conditionally include only if provided (same pattern as title/body).
- **`db.notes.list()`**: Postgres uses `SELECT *` so `images` is automatic. Verify JSON mock returns `images`.

**Patterns to follow:**
- Existing `db.notes.create()` and `db.notes.update()` signatures
- Messages API images validation pattern from Unit 3

**Test scenarios:**
- Happy path: POST note with `{ groupId, title: "x", body: "y", images: [{url: "..."}] }` → created with images
- Happy path: POST note with `{ groupId, title: "x", body: "", images: [{url: "..."}] }` → image-only note
- Happy path: PATCH with `{ images: [{url: "..."}] }` → updates only images, preserves title/body
- Edge case: PATCH with `{ images: [] }` → clears all images from note
- Error path: POST with `{ groupId, title: "", body: "", images: [] }` → 400 (nothing provided)

**Verification:**
- Notes with images appear correctly in the GET response
- Existing text-only notes continue to work

---

- [ ] **Unit 5: Profile API — accept image upload, add `has_custom_image` guard**

**Goal:** Expand the profile API to accept and clear profile pictures. Guard against Google OAuth overwriting custom images.

**Requirements:** R6, R7, R11

**Dependencies:** Unit 2

**Files:**
- Modify: `src/app/api/users/profile/route.js`
- Modify: `src/app/api/utils/db.js` (add `db.users.updateImage()`, update `db.users.getById()`)
- Modify: `server/app.ts` (JWT callback)
- Modify: `__create/index.ts` (JWT callback)

**Approach:**
- **Profile GET**: Return `image` and `has_custom_image` alongside existing `profile_color` and `palette`. The response shape becomes `{ image, has_custom_image, profile_color, palette }`. Source from `db.users.getById()` which already returns `image`.
- **Profile PATCH**: Accept `{ image: "<url>" }` to set a profile picture. When `image` is a URL string, set `auth_users.image = url` and `has_custom_image = true`. When `{ image: null }`, clear `auth_users.image` and set `has_custom_image = false`. **Important**: the existing PATCH handler unconditionally requires `profile_color` from `ALLOWED_COLORS` — this validation must be relaxed so that image-only PATCH requests (no `profile_color`) are allowed. A PATCH can update color, image, or both.
- **`db.users.updateImage(userId, imageUrl)`**: New method. Set `image` and `has_custom_image` in one query. Both Postgres and JSON mock branches.
- **`db.users.getById()`**: Already returns `image`. Add `has_custom_image` to the SELECT.
- **JWT callbacks** (both `__create/index.ts` AND `server/app.ts` — both must be updated in this unit): Add a check before the Google image sync — read `has_custom_image` from the DB row. If true, skip updating `image`. The existing query already reads the user row, so this just adds a conditional. Test Google login in both dev and Vercel to verify both files behave identically.

**Patterns to follow:**
- Existing `db.users.updateProfileColor()` method for the new `updateImage` method
- Existing PATCH handler for `profile_color` validation pattern

**Test scenarios:**
- Happy path: PATCH with `{ image: "https://cdn..." }` → `auth_users.image` set, `has_custom_image = true`
- Happy path: PATCH with `{ image: null }` → `auth_users.image` cleared, `has_custom_image = false`
- Happy path: PATCH with `{ profile_color: "#2563FF", image: "https://..." }` → both updated
- Integration: Google OAuth login after custom image upload → `has_custom_image = true` prevents overwrite
- Integration: Google OAuth login after image removal → `has_custom_image = false` allows Google pic to sync
- Error path: PATCH with `{ image: 123 }` → 400 (invalid type)

**Verification:**
- Profile GET returns the image URL after upload
- Google login does not overwrite a custom-uploaded profile picture
- Both dev server and Vercel server have the JWT guard

---

- [ ] **Unit 6: Shared UI — ImageUploader component and Lightbox overlay**

**Goal:** Build reusable components for image upload input (click/drag/paste) and full-size image viewing.

**Requirements:** R8, R9

**Dependencies:** Unit 1

**Files:**
- Create: `src/components/ImageUploader.jsx`
- Create: `src/components/Lightbox.jsx`

**Approach:**
- **ImageUploader**: Renders a clickable area with a hidden `<input type="file" accept="image/*">`. Handles `onDragOver`/`onDrop` for drag-and-drop. Handles `onPaste` for clipboard paste (registered on a parent container by the consumer). Validates file type (JPEG, PNG, GIF, WebP) and size (4MB) before uploading. Calls `useUpload()` internally and exposes `onImageUploaded(result)` callback. Shows spinner during upload. Shows toast on error via `sonner`.
  - Props: `onImageUploaded({ url })`, `disabled`, `children` (render prop for the trigger UI), `maxImages` (for multi-image — consumer tracks current count)
- **Lightbox**: Fixed-position overlay with `bg-black/80`, centered `<img>` with `max-w/max-h` constraints, close button (X icon). Closes on backdrop click, Escape key, or close button.
  - Props: `imageUrl`, `isOpen`, `onClose`
  - Optional: prev/next navigation when displaying images from a multi-image set — add `images` array + `currentIndex` props

**Patterns to follow:**
- Custom modal pattern from `src/app/calendar/DayView.jsx` lines 215-321
- Existing button/icon patterns using Lucide React
- `toast()` from `sonner` for error feedback

**Test scenarios:**
- Happy path: Click to browse → file picker opens → select image → `onImageUploaded` fires with URL
- Happy path: Drag image over drop zone → visual feedback → drop → upload → callback fires
- Edge case: Drop a non-image file → toast error "Only image files are allowed"
- Edge case: Drop a 5MB image → toast error "File too large (max 4MB)"
- Error path: Upload fails → toast error, `onImageUploaded` not called
- Happy path: Lightbox opens on click → shows full-size image → closes on Escape/backdrop click

**Verification:**
- ImageUploader works with click, drag-and-drop, and paste input methods
- Lightbox displays full-size images and closes correctly

---

- [ ] **Unit 7: UserAvatar — support profile images**

**Goal:** Update `UserAvatar` to render a profile picture when available, falling back to initials/color.

**Requirements:** R6

**Dependencies:** None

**Files:**
- Modify: `src/components/UserAvatar.jsx`

**Approach:**
- Add optional `image` prop. When `image` is a non-empty string, render an `<img>` element with `src={image}`, `object-fit: cover`, `border-radius: 50%`, same dimensions as the current initials circle.
- Add `onError` handler: on image load failure, hide the `<img>` and show the initials fallback. Use local state `imageError` to toggle.
- Keep the initials rendering as fallback (no image, or image load error).

**Patterns to follow:**
- Existing `UserAvatar` component structure and size system

**Test scenarios:**
- Happy path: `image` prop set → renders `<img>` with circular crop
- Happy path: `image` prop not set → renders initials as before
- Edge case: `image` URL returns 404 → falls back to initials via `onError`
- Edge case: `image` prop is empty string → renders initials (treated as no image)

**Verification:**
- Avatar shows image when available, initials when not
- Broken image URLs gracefully fall back to initials

---

- [ ] **Unit 8: Wire `image` prop through all UserAvatar call sites**

**Goal:** Pass the `image` field from user/member data through to `UserAvatar` everywhere it's used.

**Requirements:** R6

**Dependencies:** Unit 5, Unit 7

**Files:**
- Modify: `src/components/MemberList.jsx`
- Modify: `src/components/Sidebar.jsx`
- Modify: `src/components/TodoList.jsx` (DriBadge uses UserAvatar)
- Modify: `src/app/groups/page.jsx`
- Modify: `src/app/page.jsx` (dashboard)
- Modify: `src/app/account/profile/page.jsx`

**Approach:**
- `db.members.list()` already returns `image` from the `auth_users` JOIN. The data is available — it's just not being passed to `UserAvatar`.
- At each call site, add `image={member.image}` or `image={user.image}` to the `<UserAvatar>` props.
- Dashboard page (`page.jsx`): The synthetic "personal workspace" member object needs to include `image` from the user session.
- Profile page: Fetch the user's `image` from the profile GET response and pass it to `UserAvatar`.

**Patterns to follow:**
- Existing `<UserAvatar name={...} email={...} profileColor={...} />` prop pattern

**Test scenarios:**
- Happy path: Member with a profile picture → avatar shows image in sidebar, member list, chat, dashboard
- Happy path: Member without a profile picture → avatar shows initials (no regression)
- Edge case: User uploads profile picture → avatar updates across all surfaces after refetch

**Verification:**
- Profile pictures display correctly in all locations where `UserAvatar` appears

---

- [ ] **Unit 9: Chat UI — image attachment and rendering**

**Goal:** Add image attachment (click/drag/paste), preview, multi-image support, and inline image rendering to the group chat.

**Requirements:** R1, R2, R3, R8

**Dependencies:** Unit 3, Unit 6

**Files:**
- Modify: `src/app/groups/page.jsx`

**Approach:**
- **Message input area**: Add an attach button (Lucide `ImagePlus` icon) next to the send button. Clicking opens the `ImageUploader`. Add drag-and-drop zone wrapping the input area. Register paste handler on the input.
- **Pending images state**: `const [pendingImages, setPendingImages] = useState([])`. Each upload appends `{url}` to this array. Render thumbnails below the input with remove (X) buttons. Enforce max 10.
- **Send mutation**: Update to send `{ content: message, images: pendingImages, userId: user.id }`. Clear `pendingImages` on success.
- **Message rendering**: Below `msg.content`, if `msg.images?.length > 0`, render a flex-wrap row of thumbnail images (e.g., 120px wide, rounded corners). Each thumbnail is clickable → opens Lightbox.
- **Lightbox state**: `const [lightboxImage, setLightboxImage] = useState(null)`. Render `<Lightbox>` when set.
- **Image-only messages**: When `pendingImages.length > 0`, enable the send button even if `message` is empty.

**Patterns to follow:**
- Existing message input form pattern (lines 579-594 of `groups/page.jsx`)
- Existing `sendMessageMutation` pattern

**Test scenarios:**
- Happy path: Attach image → preview appears → type text → send → message renders with text + image thumbnail
- Happy path: Attach 3 images → all show as thumbnails → send → message shows all 3 inline
- Happy path: Attach image with no text → send → image-only message renders
- Happy path: Click thumbnail in message feed → lightbox opens with full-size image
- Edge case: Remove an image from preview before sending → removed image not included in message
- Edge case: Attempt to attach 11th image → toast error "Maximum 10 images per message"
- Error path: Upload fails → toast error, pending images unchanged, draft text preserved
- Edge case: Image-only message → send button enabled, sends successfully

**Verification:**
- Images upload, preview, send, render inline, and open in lightbox
- Existing text-only chat continues to work

---

- [ ] **Unit 10: Notes UI — image attachment and rendering**

**Goal:** Add image attachment to notes (create and edit modes) and render attached images as thumbnails in note cards.

**Requirements:** R4, R5, R8

**Dependencies:** Unit 4, Unit 6

**Files:**
- Modify: `src/components/NoteList.jsx`
- Modify: `src/app/page.jsx` (dashboard note creation guard)

**Approach:**
- **Note card view mode**: Below the note text content, if `note.images?.length > 0`, render a row of thumbnail images (similar to messages). Each clickable → Lightbox.
- **Add Note form**: Add an attach button (Lucide `ImagePlus`) below the textarea. Upload images and collect in `const [newNoteImages, setNewNoteImages] = useState([])`. Render thumbnails with remove buttons. Include `images: newNoteImages` in the create mutation body. Clear on success.
- **Edit mode**: Load existing `note.images` into `editingImages` state. Allow adding new images and removing existing ones. Include `images: editingImages` in the PATCH mutation body.
- **Image-only notes**: Allow adding a note with only images (no title/body required). **Important**: client-side validation blocks image-only notes in 3 places — the `isAddDisabled` check in NoteList (requires both title and body), the save button disabled check in edit mode, and the early return guard on the dashboard page (`page.jsx` line ~273). All three must be relaxed to: disabled only when there's no title AND no body AND no images.
- **Drag-and-drop / paste**: Add drop zone and paste handler to the note editor area.

**Patterns to follow:**
- Existing NoteList inline editing pattern (click to edit, save/cancel buttons)
- Existing create/update mutation patterns in NoteList

**Test scenarios:**
- Happy path: Create note with text + images → note card shows text and thumbnails
- Happy path: Create note with only images → note card shows thumbnails, no text
- Happy path: Edit note → add new image → save → new image appears in note card
- Happy path: Edit note → remove image → save → image no longer in note card
- Happy path: Click thumbnail in note card → lightbox opens
- Edge case: Note with 10 images → attach button disabled or error on 11th

**Verification:**
- Notes with images render correctly in the masonry grid
- Existing text-only notes continue to work

---

- [ ] **Unit 11: Profile page — image upload UI**

**Goal:** Add profile picture upload, circular preview, and remove functionality to the profile settings page.

**Requirements:** R6, R7

**Dependencies:** Unit 5, Unit 6, Unit 7

**Files:**
- Modify: `src/app/account/profile/page.jsx`

**Approach:**
- **Current avatar display**: Show the user's current `UserAvatar` (will now render their image if set, per Unit 7). Below it, add "Upload photo" button and (if image exists) "Remove photo" button.
- **Upload flow**: "Upload photo" triggers `ImageUploader`. On success, call profile PATCH mutation with `{ image: result.url }`. Show circular preview (the `UserAvatar` itself serves as preview since it will render the image after refetch). Show toast on success/error.
- **Remove flow**: "Remove photo" button calls profile PATCH with `{ image: null }`. Avatar reverts to initials. Show toast on success.
- **Fetch profile data**: Update the profile GET query to use the new response shape that includes `image` and `has_custom_image`.
- **Integration**: After upload/remove, invalidate the user query so all `UserAvatar` instances across the app update.

**Patterns to follow:**
- Existing profile page color picker and save mutation pattern
- Existing `queryClient.invalidateQueries()` pattern

**Test scenarios:**
- Happy path: Upload photo → avatar updates to show image → "Remove photo" button appears
- Happy path: Remove photo → avatar reverts to initials → "Remove photo" button disappears
- Happy path: Upload new photo to replace existing → avatar updates
- Error path: Upload fails → toast error, existing avatar unchanged
- Edge case: Very tall/wide image → renders as circle with `object-fit: cover` (no distortion)

**Verification:**
- Profile picture uploads, displays, and can be removed
- Avatar change is reflected in sidebar and member lists after navigation/refetch

## System-Wide Impact

- **Interaction graph**: Upload proxy (`/api/upload`) is a new route touched by all three surfaces. JWT callbacks in both `__create/index.ts` and `server/app.ts` are modified for the `has_custom_image` guard. `UserAvatar` is modified and affects ~7 call sites across 5 files.
- **Error propagation**: Upload errors surface as toast notifications on the client. API validation errors return 400 JSON responses. DB errors propagate as 500s through existing error handling.
- **State lifecycle risks**: Orphaned CDN images when a user uploads but doesn't send — acceptable, no cleanup needed. Stale avatars after profile picture change — mitigated by `queryClient.invalidateQueries()`.
- **API surface parity**: No other interfaces need the same change (mobile app is out of scope).
- **Integration coverage**: The JWT callback + `has_custom_image` guard is the highest-risk integration — a Google login after custom image upload must not overwrite the image. Test this flow explicitly.
- **Unchanged invariants**: Existing text-only messages and notes continue to work unchanged. The `UserAvatar` component remains backward-compatible (omitting `image` prop renders initials as before). Existing `profile_color` PATCH behavior is preserved.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `api.createanything.com/v0/upload` may require auth headers not visible in code | Server-side `upload.js` already calls it without auth. Test the proxy route early (Unit 1) before building UI. |
| Vercel 4.5MB body limit may reject multipart uploads with overhead | Enforce 4MB client-side limit. FormData overhead for a single file is negligible. |
| JWT callback change must be identical in two files (`__create/index.ts` + `server/app.ts`) | Implement both in the same unit. Verify by testing Google login in both dev and production. |
| Chat polling (2s interval) returns images JSONB on every poll | Image URLs are small strings. 10 images × ~100 chars = ~1KB extra per message. Negligible. |
| `content NOT NULL` migration on `app_messages` — existing rows | `ALTER COLUMN SET DEFAULT ''` only affects new rows. Existing rows already have non-null content. No data migration needed. |

## Sources & References

- **Origin document:** [docs/brainstorms/photo-upload-requirements.md](docs/brainstorms/photo-upload-requirements.md)
- Related code: `src/utils/useUpload.js`, `src/app/api/utils/upload.js`, `src/app/api/utils/db.js`
- Related code: `src/components/UserAvatar.jsx`, `src/components/NoteList.jsx`, `src/app/groups/page.jsx`
- Related code: `server/app.ts`, `__create/index.ts`
