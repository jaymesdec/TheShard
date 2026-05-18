---
status: ready-for-planning
date: 2026-05-18
scope: lightweight
---

# Note Zoom Modal — Requirements

## Problem

Creating and editing notes happens inline inside `apps/web/src/components/NoteList.jsx` — the "Add Note" form expands at the top of the list, and editing turns a card into an in-place edit view. The interaction feels cramped and the rest of the screen competes for attention. Want a focused, Google Keep–style modal that visually elevates the note being worked on.

## Goal

When a user clicks **Add Note** or clicks an existing note card, the note opens in a centered "zoomed-in" modal that animates from its origin (the card's grid position, or the Add Note button for new notes) while the rest of the page scales down behind a dim overlay.

## In Scope

- Modal-style note editor for both creation (Add Note button) and editing (clicking a note card).
- Background page (sidebar, to-do board, note grid, member list — everything behind the modal) scales down to ~95% while the modal is open.
- Dim overlay covers the scaled-down background.
- Modal entry animation: the clicked card animates from its grid position up to a centered, larger size. New notes animate from the Add Note button's position.
- Reverse animation on close.
- Click backdrop or press Esc to close. **Closing auto-saves** the note (empty notes are discarded silently — same as Google Keep).
- Lightbox behavior for images inside the modal continues to work.

## Out of Scope

- Applying this pattern to to-do lists, to-do items, or any other entity. Notes only.
- Drag-to-resize or drag-to-move the modal.
- Multi-note tabs / opening multiple notes side-by-side.
- Mobile-specific gestures (swipe-down to dismiss). Standard click/Esc is enough.
- New fields, new note types, new buttons inside the editor — content of the editor is identical to today's inline edit form.

## Behavior Details

- **Trigger – new note:** Click "Add Note" button → modal opens empty, animating from the button's position to center.
- **Trigger – edit note:** Click an existing note card anywhere → modal opens with that note's content, animating from the card's position to center.
- **Auto-save:** On backdrop click or Esc, the modal closes and any non-empty changes are committed via the existing add/edit handlers (`handleAddNote` / `handleEditNote`). An entirely empty new note is discarded with no toast.
- **Background scale:** Everything outside the modal scales to ~95% with a brief eased transition; restored on close. The scaled element is the main app shell, not the body — keep it scoped to avoid scrollbar weirdness.
- **Overlay:** Translucent dark backdrop (similar opacity to the existing `Lightbox` at `bg-black/80`, possibly lighter) above the scaled background, below the modal.
- **Esc:** Same effect as backdrop click — close + auto-save.
- **Delete:** Existing delete button stays inside the modal; deleting closes the modal.
- **Image upload / Lightbox:** Image upload UI continues to work inside the modal. Clicking an image still opens the existing Lightbox; the Lightbox layers above the note modal.

## Success Criteria

- Clicking Add Note opens an empty modal with a visible scale-from-button animation; rest of page scales down behind a dim overlay.
- Clicking a note card opens that note in a modal with a visible scale-from-card-position animation.
- Closing via backdrop click or Esc auto-saves non-empty changes and reverse-animates back to origin.
- Inline add/edit UI in `NoteList.jsx` is removed (or hidden — no dead UI).
- No regression to image upload, image lightbox, or note deletion.

## Open Questions

None. Save semantics, dismiss behavior, animation style, and scope are locked.

## Notes on Implementation Direction (for planning, not binding)

- `motion` (v12) is already a dependency. `layoutId` shared between the card and modal would handle the position-to-center transform with no manual math.
- The page-scale-down effect can be a wrapper around the main app shell with a class toggled by note-modal open state.
- Existing `Lightbox.jsx` is a good reference for the overlay + fixed positioning pattern.
