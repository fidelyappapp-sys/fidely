interface GalleryPhoto {
  id: string;
  url: string;
}

export function GallerySection({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="aspect-square w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition hover:scale-[1.03] sm:w-auto"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt="" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
