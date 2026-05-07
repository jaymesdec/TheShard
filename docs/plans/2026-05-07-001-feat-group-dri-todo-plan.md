---
title: "feat: Add DRI assignment to group space to-do lists"
type: feat
status: active
date: 2026-05-07
---

# feat: Add DRI assignment to group space to-do lists

## Overview

Add Directly Responsible Individual (DRI) assignment to the to-do list section within group spaces. The `dri` column already exists in the database and a working `DriBadge` component exists in the legacy `TodoList.jsx`, but the active todo system (`TodoBoard`/`TodoListCard`) has zero DRI awareness. This plan wires DRI through the board component chain, only in group context — personal workspaces remain DRI-free.

## Problem Frame

The app has a two-tier ownership model on todos: `assigned_to JSONB[]` for multiple assignees and `dri TEXT` for a single responsible individual. The database, API, and a UI component (`DriBadge`) all support DRI — but the active todo board view never renders or sets it. Group members have no visibility into who owns what, leading to diffused accountability.

## Requirements Trace

- R1. DRI badge visible on each todo item in group space board view
- R2. Group members can assign/reassign DRI via dropdown on any todo item
- R3. New items added to a group todo list default DRI to the creator
- R4. DRI UI does not appear in personal workspace
- R5. MemberList sidebar shows per-member DRI task count in group context
- R6. Existing DRI data in the database is surfaced without migration

## Scope Boundaries

- DRI only on todos within group spaces — not on notes, messages, or personal todos
- No DRI notifications, rotation, or handoff protocols in this pass
- No changes to the groups management page (`/groups`) — DRI lives on the dashboard's board view
- No audit trail or DRI history logging
- No changes to the legacy `TodoList.jsx` component (it stays as-is)

## Context & Research

### Relevant Code and Patterns

- `apps/web/src/components/TodoList.jsx:6-68` — `DriBadge` component (local function, not exported). Fully working dropdown with `UserAvatar`, member selection, click-outside dismiss. Expects `{ todo, members, onUpdateDri }` props.
- `apps/web/src/components/TodoBoard.jsx` — passes 6 handler props to `TodoListCard`, no `members` or DRI props
- `apps/web/src/components/TodoListCard.jsx` — renders items as checkbox + title + delete. No DRI awareness.
- `apps/web/src/components/MemberList.jsx` — 46 lines, renders name/email/avatar only. Takes `members` prop.
- `apps/web/src/app/page.jsx` — dashboard page. Already fetches `members` (line 62-74) and `todoLists`, but never connects them. Has `activeGroupId` state with `'personal'` guard pattern.
- `apps/web/src/app/api/utils/db.js:833-866` — `db.todoLists.addItem()` creates todos with `dri: null`. Does not accept a `dri` parameter.
- `apps/web/src/app/api/todo-lists/[id]/items/route.js` — POST handler destructures only `{ title }` from body.
- `apps/web/src/app/api/todos/[id]/route.js:14,31` — PATCH handler already accepts `dri` in the body and passes it to `db.todos.update()`.
- `apps/web/src/app/api/utils/db.js:628-656` — `db.todos.update()` already handles `dri` updates via COALESCE.

### Institutional Learnings

No `docs/solutions/` directory exists. Key implicit conventions discovered:

- **Prop drilling is the convention** — no context providers. State and mutations live in page components, passed down as props.
- **React Query invalidation pattern** — all mutations use `onSuccess` with `queryClient.invalidateQueries({ queryKey: ["entityType"] })`. No optimistic updates.
- **Tailwind only** — despite CLAUDE.md mentioning Chakra UI, zero Chakra imports exist. All styling is Tailwind utility classes.
- **Conditional rendering for group features** — `activeGroupId !== 'personal'` guard is the established pattern (used for NoteList).

## Key Technical Decisions

- **Extract DriBadge to its own file** rather than duplicating: The component is self-contained (62 lines) and will be needed in `TodoListCard`. Extracting to `components/DriBadge.jsx` is cleaner than copy-pasting. The original in `TodoList.jsx` will import from the new file to avoid duplication.
- **Guard DRI rendering with `activeGroupId !== 'personal'`**: Matches the established pattern for group-only features. `members` and `onUpdateDri` are simply not passed to `TodoBoard` when in personal context, so `DriBadge` receives no props and renders nothing.
- **Default DRI to creator on addItem**: Mirrors the existing behavior in the legacy `POST /api/todos` route (`dri: dri || userId`). New board items in group context auto-assign the creator as DRI.
- **DRI counts in MemberList derived client-side**: The dashboard already has both `todoLists` (with all items including `dri` fields) and `members` in memory. Computing counts client-side avoids a new API endpoint and follows the existing data flow.

## Implementation Units

- [x] **Unit 1: Extract DriBadge to shared component**

  **Goal:** Move `DriBadge` from a local function in `TodoList.jsx` to an importable shared component.

  **Requirements:** R1, R2

  **Dependencies:** None

  **Files:**
  - Create: `apps/web/src/components/DriBadge.jsx`
  - Modify: `apps/web/src/components/TodoList.jsx`

  **Approach:**
  - Copy the `DriBadge` function (lines 6-68 of `TodoList.jsx`) into a new file with its own imports (`useState` from react, `ChevronDown` from lucide-react, `UserAvatar`)
  - Export it as the default export
  - Replace the local `DriBadge` definition in `TodoList.jsx` with an import from the new file
  - No behavioral changes — the component's props and rendering stay identical

  **Patterns to follow:**
  - `apps/web/src/components/UserAvatar.jsx` — existing shared component pattern

  **Test scenarios:**
  - Happy path: DriBadge renders assigned member avatar and name when `todo.dri` matches a member
  - Happy path: DriBadge renders "?" placeholder and "Assign" text when `todo.dri` is null
  - Happy path: clicking DriBadge opens member dropdown, selecting a member calls `onUpdateDri(todoId, memberId)`
  - Edge case: DriBadge renders nothing when `onUpdateDri` is null and no DRI is assigned (existing behavior preserved)

  **Verification:**
  - `DriBadge` imports cleanly from `@/components/DriBadge`
  - Any existing usage of `TodoList` with DRI still works identically

- [x] **Unit 2: Thread DRI through TodoBoard and TodoListCard**

  **Goal:** Wire `members`, `onUpdateDri`, and `isGroupContext` through the board component chain so each todo item can display and update its DRI.

  **Requirements:** R1, R2, R4

  **Dependencies:** Unit 1

  **Files:**
  - Modify: `apps/web/src/components/TodoBoard.jsx`
  - Modify: `apps/web/src/components/TodoListCard.jsx`

  **Approach:**
  - Add three new props to `TodoBoard`: `members`, `onUpdateDri`, `isGroupContext`
  - Pass them through to each `TodoListCard` instance
  - In `TodoListCard`, import `DriBadge` from the new shared component
  - Render `DriBadge` next to each incomplete todo item when `isGroupContext` is true and `members.length > 0`
  - Position the badge inline after the item title, before the delete button — matching the compact card layout
  - For completed items, show DRI as a static label (no dropdown) to reduce visual noise

  **Patterns to follow:**
  - Existing prop drilling in `TodoBoard` → `TodoListCard` (6 handlers already threaded this way)
  - The `group/item` hover pattern in `TodoListCard` for revealing action buttons

  **Test scenarios:**
  - Happy path: In group context, each incomplete todo item shows its DriBadge with the assigned member
  - Happy path: In group context, clicking a DriBadge opens the member dropdown and allows reassignment
  - Happy path: In personal context (`isGroupContext=false`), no DriBadge renders on any item
  - Edge case: Items with `dri: null` show the "?" assign badge in group context
  - Edge case: Completed items show DRI as read-only (no dropdown)

  **Verification:**
  - Board view in group space shows DRI badges on every todo item
  - Board view in personal space shows no DRI badges
  - DRI dropdown opens/closes correctly within the card layout without clipping

- [x] **Unit 3: Update addItem API and db layer to accept DRI**

  **Goal:** Allow the add-item flow to set a DRI when creating a new todo in a group list.

  **Requirements:** R3

  **Dependencies:** None (can be done in parallel with Units 1-2)

  **Files:**
  - Modify: `apps/web/src/app/api/todo-lists/[id]/items/route.js`
  - Modify: `apps/web/src/app/api/utils/db.js`

  **Approach:**
  - In the API route, destructure `dri` alongside `title` from the request body
  - Pass `dri` into `db.todoLists.addItem()` as part of the data object
  - In `db.todoLists.addItem()`, accept `dri` in the destructured data parameter
  - For the Postgres path: add `dri` to the INSERT statement (`dri` column already exists)
  - For the JSON fallback path: set `dri` in the new todo object (replace the hardcoded `null`)
  - Default: the API route passes `dri: dri || userId` so the creator becomes DRI when none is specified

  **Patterns to follow:**
  - `apps/web/src/app/api/todos/route.js:42,67` — existing DRI handling in the legacy POST route (`dri: dri || userId`)

  **Test scenarios:**
  - Happy path: POST to `/api/todo-lists/:id/items` with `{ title, dri: "user123" }` creates item with that DRI
  - Happy path: POST without `dri` field defaults DRI to the authenticated user's ID
  - Edge case: POST with `dri: null` still defaults to the authenticated user
  - Error path: POST without `title` still returns 400 (existing validation unchanged)

  **Verification:**
  - New items created via the board in group context have a non-null `dri` value
  - Existing item creation behavior (title-only) still works

- [x] **Unit 4: Wire DRI mutation and props in dashboard page**

  **Goal:** Connect the dashboard page to the DRI update API and pass DRI-related props to TodoBoard, conditioned on group context.

  **Requirements:** R1, R2, R3, R4

  **Dependencies:** Units 1, 2, 3

  **Files:**
  - Modify: `apps/web/src/app/page.jsx`

  **Approach:**
  - Add an `updateDriMutation` using `useMutation` that PATCHes `/api/todos/${todoId}` with `{ dri: memberId }`. On success, invalidate `["todoLists"]`.
  - Add a `handleUpdateDri(todoId, memberId)` handler that calls the mutation
  - Update the `handleAddItem` handler to pass `dri: user.id` when `activeGroupId !== 'personal'` (so new items in groups auto-assign creator as DRI)
  - Update the `addItemMutation` to include `dri` in the POST body when provided
  - Pass three new props to `TodoBoard`: `members={members}`, `onUpdateDri={handleUpdateDri}`, `isGroupContext={activeGroupId !== 'personal'}` — but only pass `onUpdateDri` and `members` when in group context (pass `null`/`[]` for personal)

  **Patterns to follow:**
  - Existing mutation pattern in `page.jsx` (e.g., `toggleTodoMutation`, `editTodoMutation`) — same structure with `useMutation`, `onSuccess` invalidation
  - The `activeGroupId !== 'personal'` conditional pattern used for NoteList rendering

  **Test scenarios:**
  - Happy path: Clicking a DriBadge in group board view and selecting a member updates the DRI via PATCH and re-fetches the list
  - Happy path: Adding a new item in group context auto-assigns the current user as DRI
  - Happy path: Adding a new item in personal context does not set a DRI
  - Happy path: Switching from a group to personal workspace hides all DRI badges
  - Integration: DRI update mutation invalidates `["todoLists"]` query, causing the board to re-render with updated DRI

  **Verification:**
  - DRI assignment round-trips: assign via badge → data persists → page refresh shows same assignment
  - Personal workspace has no DRI UI or behavior

- [x] **Unit 5: Add DRI workload counts to MemberList**

  **Goal:** Show a per-member count of open DRI tasks next to each member in the MemberList sidebar, only in group context.

  **Requirements:** R5

  **Dependencies:** Unit 4 (needs DRI data flowing through the system)

  **Files:**
  - Modify: `apps/web/src/components/MemberList.jsx`
  - Modify: `apps/web/src/app/page.jsx`

  **Approach:**
  - In `page.jsx`, compute a `driCounts` map from the `todoLists` data: `todoLists.flatMap(l => l.items).filter(i => !i.completed && i.dri).reduce(...)` producing `{ [userId]: count }`. Only compute when in group context.
  - Pass `driCounts` as a new prop to `MemberList`
  - In `MemberList`, render a small badge (e.g., `"3 tasks"`) next to each member's name when their count > 0
  - Style the badge to match the existing compact aesthetic — small text, subtle color

  **Patterns to follow:**
  - `MemberList.jsx` existing member row layout (avatar + name/email column)
  - The `text-[11px] text-[#9B9B9B]` style used for secondary info throughout the app

  **Test scenarios:**
  - Happy path: Member with 3 open DRI tasks shows "3 tasks" badge
  - Happy path: Member with 0 DRI tasks shows no badge
  - Happy path: In personal workspace, no DRI counts appear (driCounts prop is not passed or is empty)
  - Edge case: Completed items are excluded from the count
  - Edge case: Items with null DRI are not counted for anyone

  **Verification:**
  - DRI counts update reactively when a DRI is assigned/reassigned or a task is completed
  - MemberList in personal context looks unchanged

## System-Wide Impact

- **Interaction graph:** The DRI update flows through: `DriBadge` click → `onUpdateDri` callback → `page.jsx` mutation → `PATCH /api/todos/:id` → `db.todos.update()` → React Query invalidation → board re-render. All existing endpoints are reused; no new API routes.
- **Error propagation:** DRI update failures surface via the existing mutation error handling (console.error in the API route, thrown errors in the mutation). No new error paths.
- **State lifecycle risks:** None — DRI is a simple text field update with no compound state. The invalidation-based refetch pattern avoids stale state.
- **API surface parity:** The `PATCH /api/todos/:id` route already handles `dri`. The only API change is adding `dri` to the `POST /api/todo-lists/:id/items` body.
- **Unchanged invariants:** Personal workspace behavior is unchanged. The legacy `TodoList.jsx` component continues to work (it imports from the extracted `DriBadge`). The `assigned_to` JSONB field is not touched.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| DriBadge dropdown could clip inside the masonry card layout | Use `fixed` positioning for the dropdown (already the pattern in the existing DriBadge — `fixed inset-0` overlay) |
| DRI counts could be stale if another user reassigns DRI | Acceptable — the app has no real-time sync (only polling on chat). DRI counts update on page focus/refetch. |
| Extracting DriBadge could break the legacy TodoList if imports are wrong | Unit 1 explicitly replaces the local function with an import — verified by checking TodoList still renders. |

## Sources & References

- Existing DriBadge implementation: `apps/web/src/components/TodoList.jsx:6-68`
- Todo PATCH API with DRI support: `apps/web/src/app/api/todos/[id]/route.js:14,31`
- Database DRI column: `apps/web/src/app/api/utils/db.js:36` (schema), `:639` (update), `:858` (addItem null default)
- Dashboard prop drilling pattern: `apps/web/src/app/page.jsx:379-388`
