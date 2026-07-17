export function PhoneFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-[420px] w-[220px] flex-col overflow-hidden rounded-[38px] border-[6px] border-gray-950 bg-gray-950 shadow-2xl ${className}`}
    >
      <div className="absolute top-0 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-gray-950" />
      <div className="flex-1 overflow-hidden rounded-[30px] bg-gray-50">{children}</div>
    </div>
  );
}
