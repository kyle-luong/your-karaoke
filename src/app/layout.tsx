import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/shared/navbar";
import { createServerSupabase } from "@/lib/supabase/server";
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lyric Lab",
  description: "AI-powered safe parody karaoke",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar 
          userEmail={user?.email} 
          userImage={user?.user_metadata?.avatar_url} 
        />
        <main>
          {children}
        </main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}