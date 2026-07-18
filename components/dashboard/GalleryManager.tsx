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
  const photoNameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (addState.success) {
      formRef.current?.reset();
      if (photoNameRef.current) photoNameRef.current.textContent = "Ajouter une photo";
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
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900">
          📷 <span ref={photoNameRef}>Ajouter une photo</span>
          <input
            name="photo"
            type="file"
            accept="image/*"
            required
            onChange={(e) => {
              if (photoNameRef.current) {
                photoNameRef.current.textContent = e.target.files?.[0]?.name ?? "Ajouter une photo";
              }
            }}
            className="hidden"
          />
        </label>
        <button
          type="submit"
          disabled={addPending}
          className="shrink-0 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {addPending ? "Envoi..." : "Ajouter"}
        </button>
      </form>
      {addState.error && <p className="mt-2 text-sm text-red-600">{addState.error}</p>}
    </div>
  );
}
