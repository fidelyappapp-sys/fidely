"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  addMenuItem,
  deleteMenuItem,
  type PageContentActionState,
} from "@/lib/actions/pageContent";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  photo_url: string | null;
}

const initialState: PageContentActionState = {};

function formatPrice(cents: number | null) {
  if (cents == null) return null;
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function MenuManager({ items }: { items: MenuItem[] }) {
  const router = useRouter();
  const [addState, addAction, addPending] = useActionState(addMenuItem, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [addState.success, router]);

  return (
    <div className="max-w-2xl">
      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {items.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-500">
            Aucun article pour le moment.
          </li>
        )}
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            {item.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.photo_url}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-100" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
              {item.description && (
                <p className="truncate text-xs text-gray-500">{item.description}</p>
              )}
            </div>
            {formatPrice(item.price_cents) && (
              <span className="shrink-0 text-sm font-medium text-gray-900">
                {formatPrice(item.price_cents)}
              </span>
            )}
            <form
              action={async (formData) => {
                await deleteMenuItem(initialState, formData);
                router.refresh();
              }}
            >
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
              >
                Retirer
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form ref={formRef} action={addAction} className="mt-4 space-y-3 rounded-xl border border-dashed border-gray-300 p-4">
        <p className="text-sm font-medium text-gray-900">Ajouter un article</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="name"
            placeholder="Nom (ex: Croque-monsieur)"
            required
            className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            name="priceCents"
            type="number"
            step="1"
            min={0}
            placeholder="Prix en centimes (ex: 850)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            name="photoUrl"
            type="url"
            placeholder="URL photo (optionnel)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <input
            name="description"
            placeholder="Description (optionnel)"
            className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
        {addState.error && <p className="text-sm text-red-600">{addState.error}</p>}
        <button
          type="submit"
          disabled={addPending}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {addPending ? "Ajout..." : "Ajouter"}
        </button>
      </form>
    </div>
  );
}
