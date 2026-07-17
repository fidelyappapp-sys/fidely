"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  addGalleryPhoto,
  deleteGalleryPhoto,
  type PageContentActionState,
} from "@/lib/actions/pageContent";

interface GalleryPhoto {
  id: string;
  url: string;
}

const initialState: PageContentActionState = {};

export function GalleryManager({ photos }: { photos: GalleryPhoto[] }) {
  const router = useRouter();
  const [addState, addAction, addPending] = useActionState(addGalleryPhoto, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [addState.success, router]);

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" className="h-full w-full object-cover" />
            <form
              action={async (formData) => {
                await deleteGalleryPhoto(initialState, formData);
                router.refresh();
              }}
              className="absolute top-1.5 right-1.5"
            >
              <input type="hidden" name="id" value={photo.id} />
              <button
                type="submit"
                className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"
              >
                Retirer
              </button>
            </form>
          </div>
        ))}
      </div>

      <form ref={formRef} action={addAction} className="mt-4 flex items-start gap-3">
        <input
          name="url"
          type="url"
          required
          placeholder="URL d'une photo (ex: https://...)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={addPending}
          className="shrink-0 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {addPending ? "Ajout..." : "Ajouter"}
        </button>
      </form>
      {addState.error && <p className="mt-2 text-sm text-red-600">{addState.error}</p>}
    </div>
  );
}
