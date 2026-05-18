---
status: ready-for-planning
date: 2026-05-18
scope: standard
---

# Group Chat Relocation — Requirements

## Problem

Group chat currently lives buried inside `apps/web/src/app/groups/page.jsx` (the "Manage Groups" admin page), only visible after the user navigates away from their main workspace and selects a group there. This makes chat feel like an admin afterthought rather than a first-class part of being inside a group space. Users working on a group's to-dos and notes in the main dashboard at `/` can't chat without leaving.

## Goal

Move group chat into the **right-hand rail** of the main dashboard so it's always visible when the user is inside a group space. The chat shows messages for whichever group is currently active. The "Manage Groups" page returns to being purely for administration (create, invite, members, leave).

## Layout

The right-hand rail (currently `apps/web/src/components/MemberList.jsx`, fixed at 300px wide) splits vertically:

- **Top section: Members list (compact)** — keeps showing members and DRI counts, but compacted so it doesn't dominate the column.
- **Bottom section: Chat panel** — fills the remaining vertical space. Scrollable message list, compose input at the bottom.

```
┌──────────┐┌─────────────────────┐┌─────────┐
│ Sidebar  ││  TodoBoard / Notes  ││ Members │
│  (nav)   ││                     ││  · Anya │
│          ││                     ││  · Ben  │
│          ││                     │├─────────┤
│          ││                     ││ Chat    │
│          ││                     ││ [msg]   │
│          ││                     ││ [msg]   │
│          ││                     ││ [ ✉ ]   │
└──────────┘└─────────────────────┘└─────────┘
```

## In Scope

- New Chat panel in the right rail of the main dashboard (`apps/web/src/app/page.jsx`).
- Members list compacts to share the rail with chat.
- Chat is **only visible when the active workspace is a group** — not in Personal Workspace.
- Chat shows messages, lets the user send text + image attachments, polls for new messages (same behavior as today's `/groups` chat).
- Chat is removed from `apps/web/src/app/groups/page.jsx`. That page keeps only group admin (create group, invitations, member search, member list, leave group).
- Sidebar layout (left rail) is untouched.

## Out of Scope

- Sidebar chat (the user briefly considered then redirected to right rail).
- Widening the right rail. Stay at 300px and design compact.
- Tabs / toggles between Members and Chat (decided against — both visible simultaneously).
- Slide-in / drawer chat panel.
- Per-user unread counts, mentions, threading, reactions, message edit/delete.
- Push notifications, sounds, or any out-of-app alerting.
- Mobile-specific layout — current dashboard is desktop-focused; chat inherits that constraint.

## Behavior Details

- **Active workspace = group** → Members (compact) on top, Chat panel below, both in the 300px right rail.
- **Active workspace = personal** → Right rail shows Members only (just the current user, as today). No chat panel, no empty state, no placeholder.
- **Switching groups** → Chat re-fetches messages for the newly active group. Members compact list updates too.
- **Members compact treatment** — keep the existing member rows but cap visible height (e.g., scroll past ~3-4 members) so chat always gets a meaningful share of the rail. DRI counts continue to render.
- **Polling** — preserve the existing 2-second refetch interval used in `/groups`. Stop polling when the user is not in a group space.
- **Send message** — Enter to send. Empty messages with no attachments are no-ops.
- **Image attachments** — image upload + lightbox-on-click behavior matches today's `/groups` chat exactly.
- **Empty state** — "No messages yet. Say hello!" (same copy as today).
- **Self vs others** — own messages right-aligned in brand blue; others left-aligned with sender name above the bubble. Same as today.

## Success Criteria

- A logged-in user can switch to any group via the sidebar, see chat immediately in the right rail, send a message, and see it appear without leaving `/`.
- The `/groups` admin page no longer contains a chat UI. All other admin functions on that page still work.
- Members list still shows up in the same right-rail position and still reflects DRI counts, just sharing space with chat.
- Personal Workspace right rail is unchanged from today's behavior aside from chat not appearing.
- No regression in message polling, image attachments, or lightbox behavior.

## Open Questions

None.

## Notes for Planning (non-binding)

- The chat JSX, mutations, and queries already exist in `apps/web/src/app/groups/page.jsx` and the supporting API at `apps/web/src/app/api/groups/[id]/messages/`. The work is to extract that into a `ChatPanel` component and mount it inside (or alongside) `MemberList` for group contexts, then delete it from the groups admin page.
- `apps/web/src/app/page.jsx` already has `members`, `messages`, image upload, and lightbox state wiring patterns to follow — but currently does not fetch messages. The messages query, send mutation, image-upload state, and lightbox state will need to move out of `/groups` and into either `page.jsx` or a self-contained `ChatPanel` that owns its own data fetching.
- Existing helpers worth reusing: `ImageUploader`, `Lightbox`, `UserAvatar`, `formatTime` (defined in `groups/page.jsx` — may need to be lifted into a util).
