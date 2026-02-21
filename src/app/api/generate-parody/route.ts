import { NextResponse } from "next/server";
import { generateParodyRequestSchema } from "@/lib/schemas/parody";
import { generateParody } from "@/lib/services/gemini";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = generateParodyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await generateParody(parsed.data);

    // Store parody version if we have a project context
    // TODO: link to project_id from request
    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-parody]", err);
    return NextResponse.json(
      { error: "Parody generation failed — try again" },
      { status: 500 }
    );
  }
}
