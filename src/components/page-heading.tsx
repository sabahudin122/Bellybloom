export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-black uppercase tracking-[.16em] text-[#dd6d4b]">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-black tracking-[-.045em] text-[#26354c] sm:text-4xl dark:text-white">{title}</h1>
        {description && <p className="mt-2 max-w-2xl leading-7 text-[#718096] dark:text-slate-300">{description}</p>}
      </div>
      {action}
    </div>
  );
}
