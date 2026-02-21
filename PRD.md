# PRD — AI-powered Parody Karaoke Studio

**App Name:** TBD
**Version:** Hackathon MVP
**Document Type:** Product Requirements Document (PRD)

---

## 1. Product Overview

### Vision

AI-powered Parody Karaoke Studio is a web platform where users transform songs into creative parody versions and sing together through collaborative karaoke sessions. The platform combines AI lyric transformation, guided creativity, and realtime shared playback to create a social music experience.

The product emphasizes:

- Creativity first
- Collaborative karaoke experiences
- Fast, polished interaction
- AI-assisted transformation

Safety and content filtering exist as a background system but are not the primary brand positioning.

---

## 2. Hackathon Goals

### Primary Objective

Deliver a polished, demo-ready experience that showcases:

- AI-powered lyric transformation (Gemini)
- Karaoke playback with synchronized lyrics
- Shareable party links for group singing
- Voice narration using ElevenLabs

### Success Criteria (Definition of Done)

A judge should be able to:

1. Open the app and browse a built-in song library.
2. Select a song and generate a parody version.
3. View an AI-generated transformation report.
4. Play karaoke with highlighted lyrics.
5. Invite others via a party link.
6. Experience realtime synchronized playback.
7. Hear AI voice narration.

---

## 3. Non-Goals (Hackathon Scope Control)

Not included:

- Full AI vocal replacement
- Real-time collaborative lyric editing
- Perfect audio synchronization across devices
- Advanced parental controls
- Complex moderation workflows
- Reliable YouTube audio importing

---

## 4. Target Users (Hackathon Focus)

**Primary:**

- Teens and creators
- Friends singing together
- Hackathon judges

**Secondary:**

- Casual users exploring parody creation

---

## 5. Core Product Concept

Choose a song → AI transforms lyrics → sing together instantly.

---

## 6. Input Strategy (Important Decision)

### Library-First Approach (Primary Flow)

The application uses a curated internal song library as the main entry point.

**Reasons:**

- Reliable demo experience
- Fast interaction
- Predictable karaoke timing
- Avoids YouTube reliability/legal risk

Library songs include:

- Audio track
- Lyrics
- LRC timing data
- Pre-generated parody versions

### Secondary Inputs

Supported but not primary:

- Upload MP3/WAV files
- Paste lyrics manually

These are considered "advanced" or experimental for MVP.

### YouTube Links

Not part of MVP core flow. May be explored post-hackathon.

---

## 7. Core Features

### 7.1 Song Library

- Grid-based browsing UI
- Preloaded demo songs (see Section 16 for song list)
- Instant start experience

### 7.2 AI Parody Engine (Gemini)

**Inputs:**

- Original lyrics
- Theme selection
- Tone selection
- Audience level
- Optional short idea text

**Outputs:**

- Parody lyrics
- Explanation summary (≤300 chars, passed to ElevenLabs)
- Transformation metadata

**Requirements:**

- Deterministic JSON responses
- Structured schema validation (zod)
- See Section 17 for full API contract

### 7.3 Karaoke Player

- Audio playback (wavesurfer.js)
- Synchronized lyric highlighting
- LRC-based timing (stored as JSONB)
- Responsive UI

### 7.4 Karaoke Party Links (Realtime Collaboration)

Users can:

- Create a party session
- Share invite links
- Join synchronized playback

**Architecture:**

- Supabase Realtime channels
- Host-controlled playback state
- Clients play audio locally

**Realtime sync data:**

- `isPlaying` (boolean)
- `playbackPositionMs` (integer)
- `updatedAt` (ISO8601 timestamp)
- `hostId` (string)

**Fallback:** Polling at 2-second interval if Realtime disconnects.

### 7.5 AI Voice Layer (ElevenLabs)

Generated voice features:

- Narration of parody/transformation summary
- Optional karaoke host countdown

**Purpose:** Strong demo "wow" moment; reinforces music + AI theme.

---

## 8. User Flows

### Flow A — Create Parody

1. User selects song from library.
2. Chooses parody settings (theme, tone, audience, optional idea).
3. Gemini generates new lyrics.
4. Parody appears with explanation and transformation report.
5. User launches karaoke.

**Acceptance Criteria:**

- Song grid displays ≥6 songs on load with title, artist, and thumbnail.
- Clicking a song navigates to parody configurator within 300ms.
- "Generate Parody" button is disabled until theme, tone, and audience are all selected.
- Parody result displays both original and parody lyrics side-by-side.
- Transformation report card is visible with at least: changesCount, mainTheme, toneUsed.
- If Gemini fails, a toast appears ("Parody generation failed — try again") with a retry button. No raw error text is shown.

### Flow B — Karaoke Party

1. User clicks "Start Party".
2. Shareable link generated.
3. Friends join room.
4. Host controls playback.
5. All users see synchronized lyrics.

**Acceptance Criteria:**

- Party invite link is generated within 1 second of clicking "Start Party".
- A guest joining via invite link enters the party room without a sign-in screen.
- Guest's lyric display syncs to host within 500ms of host pressing play.
- If Realtime disconnects, a "Reconnecting..." badge appears; sync resumes automatically within 5 seconds.
- Party room shows participant count (host + guests).

### Flow C — Voice Experience

1. User opens parody result.
2. Clicks "Play AI Narration".
3. ElevenLabs reads transformation summary.

**Acceptance Criteria:**

- Narration audio begins within 2 seconds of clicking "Play AI Narration".
- If ElevenLabs is unavailable, the narration player is hidden gracefully with label "Narration unavailable". The karaoke flow is not blocked.
- Audio plays completely without interruption on a stable connection.

---

## 9. Technical Architecture

### Frontend

- Next.js (TypeScript)
- Tailwind CSS
- shadcn/ui
- wavesurfer.js

### Backend

- Next.js API routes
- Inngest background jobs

### Data & Storage

- Supabase Postgres
- Supabase Storage
- Supabase Auth (anonymous sessions)
- Supabase Realtime

### AI Services

- Gemini API (analysis + parody rewrite)
- ElevenLabs API (voice generation)

### Audio Utilities

- ffmpeg (format conversion)

---

## 10. Authentication Decision

**Decision: Anonymous auth (Supabase native). No sign-in screen required for the core demo flow.**

- Users receive an anonymous session automatically on first visit.
- Party guests join via invite link and receive a temporary anonymous session.
- No auth UI is required for any step of the demo narrative.
- Named accounts (email auth) are a post-MVP feature for project saving and history.

This decision saves ~3 hours of implementation time compared to building a full auth UI.

---

## 11. Data Model (Full Schema)

### Songs

| Column           | Type        | Notes                     |
| ---------------- | ----------- | ------------------------- |
| id               | uuid        | PK                        |
| title            | text        |                           |
| artist           | text        |                           |
| genre            | text        | nullable                  |
| duration_seconds | integer     |                           |
| audio_url        | text        | Supabase Storage URL      |
| lyrics_raw       | text        | Plain text                |
| lrc_data         | jsonb       | `[{timeMs, line}]` format |
| thumbnail_url    | text        | nullable                  |
| created_at       | timestamptz |                           |

### Projects

| Column     | Type        | Notes         |
| ---------- | ----------- | ------------- |
| id         | uuid        | PK            |
| user_id    | uuid        | FK → Profiles |
| song_id    | uuid        | FK → Songs    |
| created_at | timestamptz |               |

### Versions

| Column      | Type        | Notes                     |
| ----------- | ----------- | ------------------------- |
| id          | uuid        | PK                        |
| project_id  | uuid        | FK → Projects             |
| type        | text        | `original` or `parody`    |
| lyrics_text | text        |                           |
| lrc_data    | jsonb       | `[{timeMs, line}]` format |
| created_at  | timestamptz |                           |

### Reports

| Column                  | Type        | Notes                          |
| ----------------------- | ----------- | ------------------------------ |
| id                      | uuid        | PK                             |
| version_id              | uuid        | FK → Versions                  |
| summary_text            | text        | ≤300 chars                     |
| narration_audio_url     | text        | Supabase Storage URL, nullable |
| transformation_metadata | jsonb       | See Section 17 for schema      |
| created_at              | timestamptz |                                |

### Parties

| Column       | Type        | Notes         |
| ------------ | ----------- | ------------- |
| id           | uuid        | PK            |
| host_user_id | uuid        | FK → Profiles |
| version_id   | uuid        | FK → Versions |
| invite_code  | text        | Unique        |
| is_active    | boolean     |               |
| created_at   | timestamptz |               |

### PartyState

| Column               | Type        | Notes                |
| -------------------- | ----------- | -------------------- |
| id                   | uuid        | PK                   |
| party_id             | uuid        | FK → Parties, unique |
| is_playing           | boolean     |                      |
| playback_position_ms | integer     |                      |
| updated_at           | timestamptz |                      |

---

## 12. Screen Inventory

### Design Tokens (define before implementation)

- **Primary color:** TBD — recommend a vibrant accent (e.g., electric purple or neon coral)
- **Font:** TBD — recommend a single font pair: display font for headings, system sans for body
- **Border radius:** Consistent across components (recommend `rounded-xl` / 12px as default)

### Screens

| Screen                  | Purpose                    | Primary Action                                    | Key Components                                                                                                                               |
| ----------------------- | -------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Song Library (Home)** | Browse and select songs    | Click song card                                   | SongCard grid (≥6 cards), app header with name/tagline, optional search bar                                                                  |
| **Parody Configurator** | Set parody parameters      | "Generate Parody" button                          | Theme selector (pills), tone selector (pills), audience toggle, custom idea text input (optional, max 200 chars), selected song summary card |
| **Parody Result**       | Review AI output           | "Start Karaoke" / "Play Narration" / "Regenerate" | Side-by-side lyric diff (original vs. parody), transformation report card, narration audio player, action buttons                            |
| **Karaoke Player**      | Sing along                 | Play/pause                                        | wavesurfer waveform, scrolling lyric display with active-line highlight, progress bar, "Start Party" button                                  |
| **Party Room**          | Synchronized group singing | Host: play/pause                                  | Party code display, copy invite link button, participant count, host controls, lyric display synced to host state                            |

---

## 13. Realtime Architecture (Design Decision)

Realtime sync is **state-based**.

**Host broadcasts:**

- `isPlaying` (boolean)
- `playbackPositionMs` (integer)
- `updatedAt` (ISO8601)
- `hostId` (string)

**Clients:**

- Subscribe via Supabase Realtime channel
- Resync local playback position if drift exceeds 500ms threshold
- Show "Reconnecting..." badge on disconnect

**Fallback:** Polling at 2-second interval if Realtime is unavailable.

---

## 14. Error State Specification

| Failure Scenario             | UI Behavior                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Gemini API failure           | Toast: "Parody generation failed — try again" + retry button. Never show raw error text. |
| ElevenLabs API failure       | Hide narration player. Show "Narration unavailable" label. Do not block karaoke flow.    |
| Supabase Realtime disconnect | Show "Reconnecting..." badge on party room. Activate 2-second polling fallback.          |
| Audio file load failure      | Show song card as "unavailable" in library grid. Do not crash the page.                  |
| Invalid party invite code    | Redirect to home with "Party not found" message.                                         |

---

## 15. Risks & Mitigation

| Risk                               | Mitigation                                                           |
| ---------------------------------- | -------------------------------------------------------------------- |
| AI output inconsistency            | Strict zod JSON schema validation                                    |
| Realtime instability               | Polling fallback                                                     |
| Audio drift across clients         | Periodic resync on drift >500ms                                      |
| Scope explosion                    | Library-first approach; anonymous auth                               |
| API key not available at hackathon | Pre-provision all accounts and share credentials before event starts |
| Song assets not ready              | Pre-generate LRC and parody versions before hackathon                |

---

## 16. Song Library Specification

### Song Selection

Use 5–8 songs. Prioritize public domain tracks for demo safety:

| #   | Song                         | Artist        | Notes                              |
| --- | ---------------------------- | ------------- | ---------------------------------- |
| 1   | Happy Birthday               | Traditional   | Public domain                      |
| 2   | Twinkle Twinkle Little Star  | Traditional   | Public domain                      |
| 3   | Take Me Out to the Ball Game | Traditional   | Public domain                      |
| 4   | This Land Is Your Land       | Woody Guthrie | Public domain (pre-1928 recording) |
| 5–8 | TBD royalty-free tracks      | pixabay.com   | Select before hackathon            |

### Asset Requirements

- **Audio format:** MP3, 128kbps minimum
- **Storage:** Supabase Storage bucket named `songs`
- **LRC format:** JSONB — `[{ "timeMs": 1200, "line": "lyrics text" }]`
- **Thumbnails:** PNG/JPG, square, stored in Supabase Storage bucket `thumbnails`

### Pre-Generation Requirement

**Pre-generate at least one parody per song before demo day.** The demo narrative must not depend on Gemini being available live. Seed pre-generated parodies into the Versions table.

### Asset Ownership

- Thumbnails + song card assets → **Frontend/UX role**
- Audio upload to Supabase + DB seeding → **Backend/Data role**
- LRC timing generation → **Backend/Data role** (use a timing tool or manual annotation)

---

## 17. API Contracts

### `POST /api/generate-parody`

**Request:**

```typescript
{
 songId: string;
 originalLyrics: string;
 theme: "food" | "sports" | "school" | "office" | "custom";
 tone: "silly" | "sarcastic" | "wholesome" | "dramatic";
 audience: "kids" | "teens" | "adults";
 customIdea?: string; // max 200 chars, optional
}
```

**Response:**

```typescript
{
 parodyLyrics: string;
 summaryNarration: string;        // ≤300 chars — passed directly to ElevenLabs
 transformationReport: {
   changesCount: number;
   mainTheme: string;
   toneUsed: string;
   highlights: string[];          // 2–4 notable changed lines
 };
 generatedAt: string;             // ISO8601 timestamp
}
```

**Validation:** All fields required. Zod schema defined at `/lib/schemas/parody.ts`. AI engineer writes and owns this file; all other roles import from it.

---

### `POST /api/generate-narration`

**Request:**

```typescript
{
  text: string; // summaryNarration field from parody response, ≤300 chars
  versionId: string;
}
```

**Response:**

```typescript
{
  narrationAudioUrl: string; // Supabase Storage URL for generated MP3
}
```

**Notes:**

- Voice ID: TBD — select one voice from ElevenLabs before hackathon and document it here.
- Audio is stored in Supabase Storage bucket `narrations`, not streamed inline.
- URL is written to `Reports.narration_audio_url` after generation.

---

### Supabase Realtime Party State Payload

Shared TypeScript type defined at `/lib/types/party.ts`:

```typescript
type PartyStateUpdate = {
  isPlaying: boolean;
  playbackPositionMs: number;
  updatedAt: string; // ISO8601
  hostId: string;
};
```

---

### LRC JSONB Format

Shared TypeScript type defined at `/lib/types/lrc.ts`:

```typescript
type LrcLine = {
  timeMs: number; // milliseconds from track start
  line: string; // lyric text for this timestamp
};

type LrcData = LrcLine[];
```

---

### Supabase Storage URL Utility

Single helper defined at `/lib/utils/storage.ts` — all roles import from this:

```typescript
// Returns the public URL for a file in a given bucket
function getStorageUrl(bucket: string, path: string): string;
```

---

## 18. Environment Variables

```bash
# Client-safe (NEXT_PUBLIC_* prefix)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=

# Server-only (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

**Pre-hackathon setup (Backend/Data role):**

1. Create Supabase project → copy URL + keys.
2. Create Gemini API key via Google AI Studio.
3. Create ElevenLabs account → select voice → copy voice ID.
4. Share `.env.local` securely with all team members before the event starts.

---

## 19. Hackathon Milestones (24-hour event)

| Checkpoint | Time    | Goal                                                                                                                                                                            |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0**      | Hour 0  | Kickoff: repo created, all team members cloned locally, `.env.local` distributed, roles confirmed                                                                               |
| **1**      | Hour 4  | Environment setup complete: Supabase schema migrated, ≥3 songs with audio + LRC seeded, all 4 devs running `npm run dev` locally                                                |
| **2**      | Hour 8  | Core data flow proven in isolation: Gemini returns valid zod-validated JSON; ElevenLabs returns audio URL; Supabase read/write confirmed from API routes                        |
| **3**      | Hour 16 | Full happy path demo-able end-to-end: select song → generate parody → view result → play narration → launch karaoke player. All on real data. Party link generation functional. |
| **4**      | Hour 20 | Party sync functional: two browser tabs join the same party and stay in sync. Drift resync working.                                                                             |
| **5**      | Hour 23 | Polish pass complete. All 5 error states verified. App name and tagline finalized. Demo rehearsed at least once.                                                                |
| **6**      | Hour 24 | Demo ready. No code changes. Rest.                                                                                                                                              |

---

## 20. Demo Narrative

1. Open app → choose song from library.
2. AI generates parody with transformation report.
3. Click "Play AI Narration" → hear the summary read aloud.
4. Click "Start Karaoke" → sing along with highlighted lyrics.
5. Click "Start Party" → share invite link.
6. Second device joins → everyone sings together in sync.

---

## 21. Team Execution

Role ownership and cross-role dependency resolution are managed in a separate document: **`TEAM.md`**.

---

## 22. Future Considerations (Post-Hackathon)

- YouTube import pipeline
- Advanced creator mode with lyric editing
- Real WebSocket sync server
- Session recording and playback
- Public parody library with discovery feed
- Named user accounts + project history

---

## Final Positioning Statement

AI-powered Parody Karaoke Studio is a collaborative music playground where users instantly transform songs into AI-generated parodies and sing together in shared karaoke sessions.
