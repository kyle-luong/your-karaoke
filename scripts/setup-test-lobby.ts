
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
    console.log("🔍 Fetching a real song from the database...");

    // 1. Get a real song
    const { data: songs, error: songError } = await supabase
        .from("songs")
        .select("*")
        .limit(1);

    if (songError || !songs || songs.length === 0) {
        console.error("❌ No songs found in the database. Please make sure you have added songs.");
        return;
    }

    const song = songs[0];
    console.log(`✅ Found song: "${song.title}" by ${song.artist} (${song.id})`);

    // 2. Create/Get a test Project
    const projectId = "77777777-7777-7777-7777-777777777777";
    const { error: projectError } = await supabase
        .from("projects")
        .upsert({
            id: projectId,
            user_id: "00000000-0000-0000-0000-000000000000",
            song_id: song.id,
        });

    if (projectError) {
        console.error("❌ Failed to create project:", projectError.message);
        return;
    }
    console.log("✅ Project initialized");

    // 3. Create/Get a test Version
    const versionId = "88888888-8888-8888-8888-888888888888";
    const { error: versionError } = await supabase
        .from("versions")
        .upsert({
            id: versionId,
            project_id: projectId,
            type: "original",
            lyrics_text: song.lyrics_raw,
        });

    if (versionError) {
        console.error("❌ Failed to create version:", versionError.message);
        return;
    }
    console.log("✅ Version initialized");

    // 4. Create the Lobby (Party)
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let inviteCode = '';
    for (let i = 0; i < 6; i++) {
        inviteCode += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        if (i === 2) inviteCode += '-';
    }

    const { data: party, error: partyError } = await supabase
        .from("parties")
        .insert({
            version_id: versionId,
            host_user_id: "00000000-0000-0000-0000-000000000000",
            invite_code: inviteCode,
            is_active: true,
        })
        .select()
        .single();

    if (partyError) {
        console.error("❌ Failed to create party:", partyError.message);
        return;
    }
    console.log(`✅ Lobby created with code: ${inviteCode}`);

    // 5. Create initial State
    const { error: stateError } = await supabase
        .from("party_state")
        .insert({
            party_id: party.id,
            is_playing: false,
            playback_position_ms: 0,
        });

    if (stateError) {
        console.error("❌ Failed to create party state:", stateError.message);
        return;
    }

    console.log("\n🚀 SETUP COMPLETE!");
    console.log(`🔗 Lobby URL: http://localhost:3000/songs/karaoke/${party.id}`);
}

setup();
