import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // TODO: accept theme/tone/audience from request body
  const body = { projectId: id };

  await inngest.send({
    name: "parody/generate",
    data: body,
  });

  return NextResponse.json({ queued: true, projectId: id });
}
