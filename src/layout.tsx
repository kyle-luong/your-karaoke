import { Navbar } from "@/components/shared/navbar";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <Navbar userEmail={user?.email} />
        {children}
      </body>
    </html>
  );
}