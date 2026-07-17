interface ActionButtonsProps {
  phone: string | null;
  mapsLink: string | null;
  reviewLink: string | null;
}

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path
      d="M12 21s7-6.4 7-11.5a7 7 0 1 0-14 0C5 14.6 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9 2.9-6Z" />
  </svg>
);

export function ActionButtons({ phone, mapsLink, reviewLink }: ActionButtonsProps) {
  const buttons = [
    reviewLink && {
      href: reviewLink,
      label: "Laisser un avis",
      icon: <StarIcon />,
      emphasis: true,
    },
    phone && { href: `tel:${phone}`, label: "Nous appeler", icon: <PhoneIcon /> },
    mapsLink && { href: mapsLink, label: "Itinéraire", icon: <PinIcon /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; emphasis?: boolean }[];

  if (buttons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((btn) => (
        <a
          key={btn.label}
          href={btn.href}
          target={btn.href.startsWith("http") ? "_blank" : undefined}
          rel={btn.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition hover:-translate-y-0.5 ${
            btn.emphasis
              ? "bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/30 hover:bg-amber-300"
              : "border border-gray-200 text-gray-900 hover:bg-gray-50"
          }`}
        >
          {btn.icon}
          {btn.label}
        </a>
      ))}
    </div>
  );
}
