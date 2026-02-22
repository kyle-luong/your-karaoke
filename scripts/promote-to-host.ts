
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function promote() {
    const lobbyId = "d8843655-c59c-4443-8d62-5bd8019ff5f4";
    const userId = "5497fae6-0c2e-4705-a856-914ec4771c86";

    console.log(`🚀 Promoting ${userId} to HOST of lobby ${lobbyId}...`);

    const { error } = await supabase
        .from("parties")
        .update({ host_user_id: userId })
        .eq("id", lobbyId);

    if (error) {
        console.error("❌ Failed to promote user:", error.message);
        return;
    }

    console.log("✅ DONE! Refresh your browser tab. You are now the HOST.");
}

promote();
