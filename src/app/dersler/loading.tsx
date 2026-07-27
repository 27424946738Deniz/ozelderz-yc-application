import Header from "@/components/Header";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-stone-100 bg-white p-4">
      <div className="flex gap-3">
        <div className="h-5 flex-1 rounded bg-stone-100" />
        <div className="h-6 w-12 rounded-full bg-stone-100" />
      </div>
      <div className="mt-2 h-4 w-2/3 rounded bg-stone-100" />
      <div className="mt-3 h-3 w-full rounded bg-stone-50" />
    </div>
  );
}

export default function LessonsLoading() {
  return (
    <div className="min-h-screen page-shell">
      <Header activeNav="Dersler" />
      <main className="mx-auto max-w-3xl animate-pulse px-4 py-6 sm:px-6">
        <div className="mb-6">
          <div className="h-6 w-48 rounded bg-stone-200" />
          <div className="mt-2 h-4 w-32 rounded bg-stone-100" />
        </div>
        <div className="space-y-8">
          {[0, 1].map((section) => (
            <section key={section}>
              <div className="mb-3 flex items-center gap-4 rounded-xl border border-stone-100 bg-white p-4">
                <div className="h-12 w-12 rounded-xl bg-stone-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-stone-200" />
                  <div className="h-3 w-56 rounded bg-stone-100" />
                </div>
              </div>
              <div className="space-y-3 pl-1 sm:pl-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
