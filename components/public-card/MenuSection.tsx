interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  photo_url: string | null;
}

function formatPrice(cents: number | null) {
  if (cents == null) return null;
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function MenuSection({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition hover:border-gray-200 hover:shadow-sm"
        >
          {item.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photo_url}
              alt={item.name}
              className="h-16 w-16 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-300">
              ◈
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{item.name}</p>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{item.description}</p>
            )}
          </div>
          {formatPrice(item.price_cents) && (
            <span className="shrink-0 text-sm font-semibold text-gray-900">
              {formatPrice(item.price_cents)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
