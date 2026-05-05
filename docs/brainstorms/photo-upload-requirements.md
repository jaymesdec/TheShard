# Photo Upload — Requirements

**Date:** 2026-05-04
**Status:** Draft
**Scope:** Standard

## Problem

TheShard is a collaborative group app where users share todos, notes, and messages — but everything is text-only. Users can't share visual context (screenshots, photos, references) in chat, can't add images to notes, and profiles show generic initials/color avatars. Upload infrastructure exists (`src/app/api/utils/upload.js`, `src/utils/useUpload.js`) but isn't wired up anywhere.

## Goals

- Users can send photos in group chat messages
- Users can attach images to notes
- Users can upload a profile picture that replaces the initials avatar everywhere

## Non-Goals

- Video upload or media player
- Image editing (filters, annotations, drawing)
- Gallery/media library view across all uploads
- File attachments (PDFs, documents)
- Rich text / block-based note editor (images attach to notes, not inline between paragraphs)

## Known Constraints

- **Upload endpoint**: `useUpload` hook calls `/_create/api/upload/` which is injected by the Create.xyz sandbox. On Vercel, this does not exist. The server-side `upload.js` calls `api.createanything.com` directly. Must verify whether this works on Vercel or if an alternative storage path (e.g., proxy route, presigned URLs) is needed. **Resolve before implementation.**
- **4.5MB body limit**: Both the Hono dev server and Vercel enforce a 4.5MB POST body limit. Max upload size must be 4MB (with margin), not 10MB. For larger files, client-side compression before upload is recommended.
- **Google OAuth overwrites `auth_users.image`**: The JWT callback in `__create/index.ts` and `server/app.ts` syncs Google's profile picture to `auth_users.image` on every login. User-uploaded profile pictures will be silently overwritten. Fix: add a `custom_image` column or a boolean `has_custom_image` flag, and skip the Google sync when it's set.
- **Messages API requires non-empty `content`**: The POST handler rejects empty content. Must relax validation to allow image-only messages (content empty when images present).
- **Notes `MAX_BODY_LENGTH = 10,000`**: The notes API enforces a 10K character limit on content. This should still be sufficient since images are stored as a separate JSONB column (not inline in content), but verify.
- **Local JSON mock DB**: Every `db` method has both a Postgres and a JSON-file branch. New `images` columns and methods must be implemented in both paths.

## Requirements

### Shared Infrastructure

- **Upload hook**: Use the existing `useUpload` hook (`src/utils/useUpload.js`). If the `/_create/api/upload/` endpoint is unavailable on Vercel, add a proxy route in `server/app.ts` that forwards to `api.createanything.com`.
- **Image input methods**: All three surfaces support click-to-browse, drag-and-drop, and clipboard paste (Ctrl/Cmd+V)
- **Loading states**: Show spinner/progress indicator during upload
- **Lightbox**: Clicking any uploaded image opens a full-size overlay with close button. Build with Chakra UI's `Modal` — no external library needed.
- **Upload validation**: Accept JPEG, PNG, GIF, WebP. Reject non-image files. Enforce 4MB max file size. Show error toast on rejection.

### Messages (Group Chat)

- **Attach button** in the message input area to trigger image selection
- **Drag-and-drop** images onto the chat input area
- **Clipboard paste** to attach a copied/screenshot image
- **Multi-image support** — a single message can include multiple images
- **Image preview before sending** — show thumbnails of attached images with a remove button
- **Inline rendering** — images display as thumbnails in the message feed, below message text
- **Lightbox** — click a message image to view full-size
- **DB change** — add `images JSONB DEFAULT '[]'` column to `app_messages` table
- **API changes**:
  - Update `db.messages.create()` to accept and store `images` array
  - Update `db.messages.list()` to return `images`
  - Relax POST validation: allow empty `content` when `images` is non-empty
  - Update both Postgres and JSON mock branches

### Notes (Image Attachments)

- **Image attachment model** — images attach to notes as a list, displayed below or above the note text. The note `content` remains plain text (no block editor).
- **Attach button** on the note card (edit mode) to add images
- **Drag-and-drop** images onto the note editor
- **Clipboard paste** to attach an image
- **Image list rendering** — attached images render as a row of thumbnails below the note text in both view and edit modes
- **Remove button** on each image in edit mode
- **Lightbox** — click a note image to view full-size
- **DB change** — add `images JSONB DEFAULT '[]'` column to `app_notes` table
- **API changes**:
  - Update `db.notes.create()` and `db.notes.update()` to accept and store `images` array
  - Update `db.notes.list()` to return `images`
  - Allow notes with only images (no text required)
  - Update both Postgres and JSON mock branches

### Profile Pictures

- **Upload button** on the profile settings page (`/account/profile`)
- **Circular crop preview** — show the uploaded image in a circle before confirming
- **Replace avatar everywhere** — add `image` prop to `UserAvatar` component. When set, render the image instead of initials/color. Fall back to initials/color when no image.
- **DB**: Use existing `auth_users.image` column. Add `has_custom_image BOOLEAN DEFAULT false` to prevent Google OAuth from overwriting user uploads.
- **API changes**:
  - Add `db.users.updateImage(userId, imageUrl)` method
  - Expand PATCH handler at `src/app/api/users/profile/route.js` to accept `image` field
  - Add DELETE support to clear custom image (revert to initials)
  - Update JWT callback: skip Google image sync when `has_custom_image` is true
- **`UserAvatar` call sites** to update (pass `image` prop): `MemberList.jsx`, `groups/page.jsx` (2 locations), `account/profile/page.jsx`, `Sidebar.jsx`, and any other consumers
- **Change/remove** — user can upload a new picture or remove to revert to initials

## Edge Cases

- **Upload failure** — show error toast, keep message/note draft intact
- **Large images** — enforce 4MB max, compress on client before upload if feasible
- **Empty messages** — allow image-only messages (no text required)
- **Notes with only images** — allow notes with zero text content
- **Profile picture aspect ratio** — crop to square/circle on client; store the cropped version
- **Slow connections** — show upload progress, disable send/save until upload completes
- **Broken image URLs** — render a placeholder icon rather than a broken `<img>`
- **Google OAuth image conflict** — `has_custom_image` flag prevents overwrite

## Success Criteria

- A user can send photos in group chat via attach button, drag-and-drop, or paste
- A user can attach images to a note and see them rendered as thumbnails
- A user can upload a profile picture that displays in their avatar across the app
- All surfaces support lightbox viewing of full-size images
- Upload works on both local dev and Vercel deployment
