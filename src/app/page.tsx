import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center gap-4">
      <Button>Primary Button</Button>
      <Button variant="outline">Outline Button</Button>
    </main>
  );
}