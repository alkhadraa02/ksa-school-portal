import Link from "next/link";

export function ChildTabs({
  children: kids,
  active,
  base,
}: {
  children: { id: string; name: string }[];
  active: string;
  base: string;
}) {
  if (kids.length < 2) return null;
  return (
    <nav aria-label="اختيار الابن" className="mb-5 flex flex-wrap gap-2">
      {kids.map((k) => (
        <Link
          key={k.id}
          href={`${base}?child=${k.id}`}
          aria-current={k.id === active ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm ${
            k.id === active ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-ink hover:bg-brand-soft"
          }`}
        >
          {k.name.split(" ")[0]}
        </Link>
      ))}
    </nav>
  );
}
