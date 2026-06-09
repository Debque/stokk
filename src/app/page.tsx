import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { error } = await supabase.from("profiles").select("*");
  const connected = !error || error.code === "PGRST205";

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-lg font-medium">
        {connected
          ? "✅ Supabase connected successfully."
          : `❌ Connection failed: ${error?.message}`}
      </p>
    </main>
  );
}