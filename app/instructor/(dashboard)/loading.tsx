export default function InstructorLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-9 w-64 rounded-lg bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg border border-pink-100 bg-white" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-lg border border-pink-100 bg-white" />
          <div className="h-40 rounded-lg border border-pink-100 bg-white" />
        </div>
      </div>
    </div>
  );
}
