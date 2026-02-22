import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

interface JoinPageProps {
    params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
    const { code } = await params;

    // Normalize code (e.g. uppercase)
    const normalizedCode = code.toUpperCase();

    const supabase = createAdminClient();

    const { data: party, error } = await supabase
        .from("parties")
        .select("id")
        .eq("invite_code", normalizedCode)
        .single();

    if (error || !party) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-4xl font-black italic uppercase text-primary mb-4">Lobby Not Found</h1>
                <p className="text-muted-foreground mb-8">The code <span className="font-mono bg-muted p-1 px-2 rounded">{normalizedCode}</span> is invalid or expired.</p>
                <a href="/" className="text-primary font-bold hover:underline">Return Home</a>
            </div>
        );
    }

    // Found it! Redirect to the actual lobby
    redirect(`/songs/karaoke/${party.id}`);
}
