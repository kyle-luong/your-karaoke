# Team Execution Document

**Project:** AI-powered Parody Karaoke Studio
**Hackathon Date:** TBD
**Duration:** 24 hours

---

## Team Members and Roles

| Person | Role                                 | Slack/Contact |
| ------ | ------------------------------------ | ------------- |
| TBD    | Frontend/UX + Karaoke Player         |               |
| TBD    | Backend/Data + Infrastructure        |               |
| TBD    | AI Integration (Gemini + ElevenLabs) |               |
| TBD    | Realtime + Party Experience          |               |

---

## Role Responsibilities

### Role 1: Frontend/UX + Karaoke Player

**Owns the user-facing experience and the audio player.**

Primary responsibilities:

- All screen layouts and component structure
- shadcn/ui theming (design tokens: primary color, font, border-radius)
- Song Library screen (SongCard grid)
- Parody Configurator screen (theme/tone/audience pickers)
- Parody Result screen (lyric diff view, transformation report card, narration player UI)
- Karaoke Player (wavesurfer.js integration, LRC sync, active-line lyric highlighting)
- Song card thumbnails

Does NOT own:

- API route implementations
- Database schema
- Supabase Realtime channel subscription logic (receives state; channel setup is Backend's)

---

### Role 2: Backend/Data + Infrastructure

**Owns the data layer, API scaffolding, and environment.**

Primary responsibilities:

- Supabase project setup (schema design, migrations)
- Database seeding (songs, LRC data, pre-generated parodies)
- All Next.js API route scaffolding and shared middleware
- Supabase Storage setup (buckets: `songs`, `thumbnails`, `narrations`)
- Supabase Realtime **channel setup** — the host broadcast logic
- Auth configuration (anonymous sessions)
- Environment variable management — `.env.local` creation and distribution
- Inngest job setup (if used for async generation)
- Audio file upload (MP3s to Supabase Storage)
- LRC timing generation for library songs

Does NOT own:

- UI components
- wavesurfer.js
- AI prompt engineering

**Pre-hackathon actions (complete before event starts):**

- [ ] Create Supabase project
- [ ] Create Gemini API key (Google AI Studio)
- [ ] Create ElevenLabs account, select voice, copy voice ID
- [ ] Distribute `.env.local` securely to all team members
- [ ] Confirm all 4 devs can run the app locally before hour 0

---

### Role 3: AI Integration (Gemini + ElevenLabs)

**Owns both AI service integrations.**

Primary responsibilities:

- `POST /api/generate-parody` route
- Gemini prompt design and iteration
- Zod schema validation (`/lib/schemas/parody.ts`) — **write this first**
- Transformation report structure
- `POST /api/generate-narration` route
- ElevenLabs API call (voice ID selection documented in PRD §17)
- Narration audio storage to Supabase Storage (`narrations` bucket)
- Inngest async job for generation (if needed for UX)

Note: ElevenLabs is assigned here (not to Role 4) because both are AI service API integrations with similar implementation patterns. This keeps all external AI calls in one role and balances workload throughout the event.

Does NOT own:

- UI components
- Database schema
- Party sync logic

**First action:** Write `/lib/schemas/parody.ts` (zod schema for Gemini response). This unblocks both the AI role and the Frontend role simultaneously.

---

### Role 4: Realtime + Party Experience

**Owns client-side sync and the party room UX.**

Primary responsibilities:

- Supabase Realtime **client-side subscription** (channel setup is Role 2's)
- Host and guest state management in the party room
- Party invite link generation and join flow
- Playback drift detection and resync logic (threshold: 500ms)
- Party room UI (invite code display, participant count, synchronized lyric display)
- "Reconnecting..." indicator and polling fallback

This role is a **systems integration role**: it consumes the Realtime channel set up by Backend (Role 2) and integrates it with the karaoke player built by Frontend (Role 1).

Does NOT own:

- Database schema
- Realtime channel setup (that's Role 2)
- wavesurfer.js core player

---

## File / Directory Ownership Map

| Path                           | Owner Role                           |
| ------------------------------ | ------------------------------------ |
| `/app/` (pages, layouts)       | Frontend/UX (Role 1)                 |
| `/components/`                 | Frontend/UX (Role 1)                 |
| `/app/api/generate-parody/`    | AI Integration (Role 3)              |
| `/app/api/generate-narration/` | AI Integration (Role 3)              |
| `/app/api/` (other routes)     | Backend/Data (Role 2)                |
| `/lib/schemas/parody.ts`       | AI Integration (Role 3)              |
| `/lib/types/party.ts`          | Backend/Data (Role 2)                |
| `/lib/types/lrc.ts`            | Backend/Data (Role 2)                |
| `/lib/utils/storage.ts`        | Backend/Data (Role 2)                |
| `/supabase/migrations/`        | Backend/Data (Role 2)                |
| `/supabase/seed.sql`           | Backend/Data (Role 2)                |
| `/hooks/usePartySync.ts`       | Realtime (Role 4)                    |
| `/hooks/useKaraokePlayer.ts`   | Frontend/UX (Role 1)                 |
| `TEAM.md`                      | All (shared)                         |
| `PRD.md`                       | All (shared, read-only during event) |

---

## Cross-Role Contracts

These shared interfaces must be agreed upon and committed to code **before parallel work begins**. Each contract has an assigned owner who writes the file first; all other roles import from it.

| Contract                        | File                     | Owner                                 | Unblocks          |
| ------------------------------- | ------------------------ | ------------------------------------- | ----------------- |
| Gemini response schema (zod)    | `/lib/schemas/parody.ts` | Role 3 (AI)                           | Role 1 (Frontend) |
| LRC JSONB type                  | `/lib/types/lrc.ts`      | Role 2 (Backend)                      | Role 1 (Frontend) |
| Party state broadcast payload   | `/lib/types/party.ts`    | Role 2 (Backend)                      | Role 4 (Realtime) |
| Supabase Storage URL helper     | `/lib/utils/storage.ts`  | Role 2 (Backend)                      | Role 1, 3, 4      |
| Narration audio delivery method | Documented in PRD §17    | Role 3 (AI) + Role 1 (Frontend) agree | Role 1 (Frontend) |

**Day 1 action:** All four roles meet for 30 minutes. Role 2 writes the type files. Role 3 writes the zod schema. Everyone confirms they can import and use them before splitting off to work independently.

---

## Dependency Resolution Log

Record here when each cross-role interface is agreed and committed. This prevents integration failures from verbal-only agreements.

| Dependency               | Agreed At | Committed By | Commit / PR Link |
| ------------------------ | --------- | ------------ | ---------------- |
| Gemini response schema   |           |              |                  |
| LRC data format          |           |              |                  |
| Party state payload      |           |              |                  |
| Storage URL construction |           |              |                  |
| Narration audio delivery |           |              |                  |

---

## Milestone Checklist

Linked to PRD Section 19. Check off as you go.

### Hour 0 — Kickoff

- [ ] Repo created and all 4 team members cloned locally
- [ ] `.env.local` distributed and confirmed working
- [ ] Roles confirmed, TEAM.md names filled in
- [ ] Supabase project URL in env

### Hour 4 — Environment Ready

- [ ] Supabase schema migration runs cleanly (`001_initial_schema.sql`)
- [ ] ≥3 songs seeded with audio, LRC, and thumbnail
- [ ] All 4 devs running `npm run dev` locally without errors
- [ ] Cross-role contract files committed (`parody.ts`, `party.ts`, `lrc.ts`, `storage.ts`)

### Hour 8 — Core Data Flow Proven

- [ ] Gemini endpoint returns zod-validated JSON from a test input
- [ ] ElevenLabs endpoint returns a narration audio URL
- [ ] Supabase reads and writes confirmed from API routes
- [ ] Song library loads ≥3 songs from Supabase in the UI

### Hour 16 — Full Happy Path Demo-able

- [ ] Select song → navigate to configurator
- [ ] Generate parody → view result with lyric diff and transformation report
- [ ] Play AI narration audio
- [ ] Launch karaoke player → lyrics sync to audio
- [ ] Party invite link generates successfully

### Hour 20 — Party Sync Working

- [ ] Two browser tabs join the same party room
- [ ] Host play/pause controls both tabs in sync
- [ ] Drift detection triggers resync if tabs fall out of sync
- [ ] "Reconnecting..." badge appears on simulated disconnect

### Hour 23 — Polish Complete

- [ ] All 5 error states verified manually (see PRD §14)
- [ ] App name and tagline finalized and applied to UI
- [ ] Full demo narrative rehearsed (≥1 run-through)
- [ ] No console errors during demo flow

### Hour 24 — Done

- [ ] Deployment live (Vercel or equivalent)
- [ ] Demo URL shared with judges

---

## Escalation Protocol

> **Anyone blocked for more than 30 minutes calls it out to the full team immediately.**

- Do not silently spin on a blocker. 30 minutes is the threshold.
- Call it out in the team chat or verbally.
- The most likely blockers and their owners:
- Environment / Supabase issues → Role 2 (Backend)
- AI API issues → Role 3 (AI)
- Integration mismatch (schema/type mismatch) → the two roles involved, resolved together
- Realtime not syncing → Role 2 (channel setup) + Role 4 (client) together

---

## Notes / Decisions Log

Record any in-event decisions here so everyone stays aligned.

| Time | Decision                 | Made By |
| ---- | ------------------------ | ------- |
|      | ElevenLabs voice ID: TBD | Role 3  |
|      | App name: TBD            | Team    |
|      | Primary color: TBD       | Role 1  |
|      |                          |         |
