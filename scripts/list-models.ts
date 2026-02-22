import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No GEMINI_API_KEY");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });
    try {
        const result = await ai.models.list();
        console.log("Models result:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Failed to list models:", err);
    }
}

main();
