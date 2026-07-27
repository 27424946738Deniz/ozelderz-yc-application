import Header from "@/components/Header";

export default function LessonDetailLoading() {
  return (
    <div className="min-h-screen page-shell">
      <Header activeNav="Dersler" />
      <div className="border-b border-stone-200/60 bg-white">
        <div className="mx-auto max-w-6xl animate-pulse px-4 py-4 sm:px-6">
          <div className="h-3 w-24 rounded bg-stone-100" />
          <div className="mt-2 h-6 w-64 rounded bg-stone-200" />
          <div className="mt-2 h-4 w-40 rounded bg-stone-100" />
        </div>
      </div>
      <main className="mx-auto max-w-6xl animate-pulse px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="aspect-video rounded-xl bg-stone-200" />
            <div className="h-10 rounded-lg bg-stone-100" />
            <div className="h-48 rounded-xl bg-stone-100" />
          </div>
          <div className="h-64 rounded-xl bg-stone-100 lg:sticky lg:top-16" />
        </div>
      </main>
    </div>
  );
}
