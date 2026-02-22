import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center">
      <h1 className="text-2xl font-bold uppercase italic tracking-tighter">Login Failed</h1>
      <p className="text-muted-foreground max-w-sm">
        We couldn't verify your Google login.
      </p>
      <Button asChild variant="default">
        <Link href="/">Try Again</Link>
      </Button>
    </div>
  );
}