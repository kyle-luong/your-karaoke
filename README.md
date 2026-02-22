# Parody Karaoke Studio

AI-powered parody karaoke — transform songs and sing together.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in your keys
cp .env.example .env.local

# 3. Set up Supabase
#    - Create a Supabase project
#    - Run supabase/schema.sql in the SQL editor
#    - Run supabase/seed.sql to add demo songs
#    - Create storage buckets: songs, thumbnails, narrations

# 4. Run dev server
npm run dev

# 5. (Optional) Run Inngest dev server for background jobs
npx inngest-cli dev
```

## Environment Variables

See [.env.example](.env.example) for all required variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `GEMINI_API_KEY` | No* | Google Gemini API key |
| `ELEVENLABS_API_KEY` | No* | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | No* | ElevenLabs voice ID |

*Mock responses are returned when AI keys are missing.

## Tech Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Storage, Realtime)
- Inngest (background jobs)
- Gemini API (parody generation)
- ElevenLabs (voice narration)
- wavesurfer.js (karaoke player)
