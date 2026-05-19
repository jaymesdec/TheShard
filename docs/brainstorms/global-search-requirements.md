---
status: ready-for-planning
date: 2026-05-18
scope: standard
---

# Global Search — Requirements

## Problem

The top-bar search input in `apps/web/src/app/page.jsx` (lines 364-373) is cosmetic — no state, no `onChange`, no logic. It implies search works, but typing into it does nothing. Either remove the false affordance or make it real. We're making it real.

## Goal

Turn the top-bar input into a working global finder that lets the user jump to any to-do item or note they have access to, across personal workspace and every group they're a member of, without first switching workspaces.

## Behavior

- **Trigger:** Typing in the top-bar input opens a dropdown anchored below the input with live filtered results.
- **Scope:** Searches across to-do items (titles) **and** notes (title + body) belonging to:
  - The user's personal workspace
  - Every group the user is a member of
- **Live filtering:** Results update on each keystroke (debounced lightly, ~150ms).
- **Empty query:** Dropdown closed; bar shows placeholder again.
- **No matches:** Dropdown shows a single "No results" row.
- **Match semantics:** Case-insensitive substring match on the title/body fields. Completed to-dos are included (they show with a strikethrough hint in the result row).
- **Result row content:**
  - Icon indicating kind: to-do item vs note
  - The matching text (title for to-dos and notes; first ~80 chars of note body if the match is in the body)
  - Workspace label on the right ("Personal" or the group name) so the user knows where the item lives
- **Result ordering:** Same workspace first (current active group), then others, alphabetically by workspace name. Within each workspace, most recent first.
- **Cap:** Show at most 20 results. If more match, append a "…and N more" row.
- **Dismiss:** Click outside, press Esc, or clear the input.

## Click-Through Behavior

Clicking a result:
1. **Switches the active workspace** to the result's workspace (sets `selectedGroupId` to the relevant group or `'personal'`).
2. **Scrolls the item into view** in the main content area once the new workspace's content has loaded.
3. **Briefly highlights the item** (e.g., 1.5s flash with a subtle blue ring) so the eye finds it.
4. **Closes the search dropdown** and clears the input.

For notes specifically, the flash applies to the note card in the grid. For to-do items, the flash applies to the row within its to-do list card. Neither auto-opens the zoom modal — the user can click to open if they want.

## In Scope

- Live global search across notes (title + body) and to-do items (title) for the signed-in user.
- Top-bar dropdown UI with up to 20 results.
- Workspace switch + scroll-into-view + highlight flash on result click.
- Backend endpoint that returns matching results across all workspaces the user has access to.

## Out of Scope

- Searching chat messages.
- Searching to-do *list* titles (only items within lists).
- Searching by tag, DRI, date, or any non-text filter.
- Keyboard navigation through result rows (arrow keys + Enter).
- Search history, recent searches, or saved searches.
- Fuzzy / typo-tolerant matching. Substring only.
- Highlighting the matched substring within result rows.
- Indexing or full-text search infrastructure. Plain SQL `ILIKE` is enough at this scale.
- Mobile-specific dropdown behavior.

## Success Criteria

- Typing in the top bar shows results across the user's personal workspace and every group they're in.
- Each result indicates its workspace, kind (note vs to-do item), and matching text.
- Clicking a result switches workspace, scrolls the matching item into view, and flashes it.
- Esc / click-outside / clearing the input closes the dropdown cleanly.
- No regression to the dashboard top bar or its other controls (logo, profile avatar, etc.).
- The Members panel + Chat panel + workspace content all reload correctly when the workspace switches as a side effect of a result click.

## Open Questions

None.

## Notes for Planning (non-binding)

- A new `GET /api/search?q=...` endpoint that runs one SQL query joining `app_notes` and `app_todos` (filtered by user's group membership) is the simplest server shape. The endpoint returns rows like `{ kind, id, title, snippet, group_id, group_name, list_id?, created_at }`.
- The top bar currently lives inside `apps/web/src/app/page.jsx`. The dropdown UI can be a new `SearchDropdown` component absolutely positioned below the input. Click-outside via `useEffect` listener on `document`.
- The "scroll + highlight" mechanic needs a way for the receiver (NoteList or TodoListCard) to know which item to flash. Simplest: lift a `flashItemRef` (or `flashTargetId`) into `page.jsx`, pass to NoteList/TodoBoard, child components scroll into view + apply a temporary CSS class when the id matches, and clear after ~1.5s.
- The workspace switch is already idempotent (setting `selectedGroupId` triggers a refetch of notes/todos/members/messages). The new wiring is just: on result click → `setSelectedGroupId(result.workspace)` + set `flashTargetId(result.id)`.
