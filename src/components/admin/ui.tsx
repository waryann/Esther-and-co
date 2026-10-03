import Link from "next/link";

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-[30px] leading-tight">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-taupe">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Flash({ msg, error }: { msg?: string; error?: string }) {
  if (!msg && !error) return null;
  return (
    <div className={`mb-5 border px-4 py-3 text-[13.5px] ${error ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`} role="status">
      {error || msg}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-line bg-white p-5 ${className}`}>
      {title && <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-taupe">{title}</h2>}
      {children}
    </section>
  );
}

const inputCls = "w-full border border-line bg-white px-3 py-2.5 text-[14px] focus:border-ink focus:outline-none";

export function Field({
  label, name, defaultValue, type = "text", required, placeholder, hint, step, min, max, className = "",
}: {
  label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean;
  placeholder?: string; hint?: string; step?: number | string; min?: number | string; max?: number | string; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[12px] font-medium text-[#444]">{label}{required && " *"}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder} step={step} min={min} max={max} className={inputCls} />
      {hint && <span className="mt-1 block text-[11.5px] text-[#888]">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, name, defaultValue, rows = 4, hint, className = "" }: { label: string; name: string; defaultValue?: string | null; rows?: number; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[12px] font-medium text-[#444]">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} className={inputCls} />
      {hint && <span className="mt-1 block text-[11.5px] text-[#888]">{hint}</span>}
    </label>
  );
}

export function Select({ label, name, defaultValue, children, className = "" }: { label: string; name: string; defaultValue?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[12px] font-medium text-[#444]">{label}</span>
      <select name={name} defaultValue={defaultValue} className={inputCls}>{children}</select>
    </label>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-[13.5px]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-ink" /> {label}
    </label>
  );
}

export function ImageField({ label, name = "image", current }: { label: string; name?: string; current?: string | null }) {
  return (
    <div>
      <span className="mb-1 block text-[12px] font-medium text-[#444]">{label}</span>
      <div className="flex items-center gap-3">
        {current ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={current} alt="" className="h-16 w-16 border border-line object-cover" /> : <div className="flex h-16 w-16 items-center justify-center border border-dashed border-line text-[10px] text-[#aaa]">Aucune</div>}
        <input type="file" name={name} accept="image/jpeg,image/png,image/webp" className="text-[12.5px]" />
      </div>
      <span className="mt-1 block text-[11.5px] text-[#888]">JPG, PNG ou WEBP — 6 Mo max, optimisée automatiquement.</span>
    </div>
  );
}

export function Submit({ children = "Enregistrer", danger, className = "" }: { children?: React.ReactNode; danger?: boolean; className?: string }) {
  return (
    <button className={`px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white ${danger ? "bg-red-700 hover:bg-red-800" : "bg-ink hover:bg-[#222]"} ${className}`}>
      {children}
    </button>
  );
}

export function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-block bg-ink px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white hover:bg-[#222]">
      {children}
    </Link>
  );
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800",
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-sky-100 text-sky-800",
  CANCELLED: "bg-neutral-200 text-neutral-700",
  NO_SHOW: "bg-red-100 text-red-800",
  EXPIRED: "bg-neutral-100 text-neutral-500",
  CONFLICT: "bg-red-200 text-red-900",
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-neutral-200 text-neutral-700",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-neutral-200 text-neutral-700",
  PUBLISHED: "bg-green-100 text-green-800",
  DRAFT: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-neutral-200 text-neutral-700",
};
export const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmé", PENDING_PAYMENT: "Paiement en attente", COMPLETED: "Terminé", CANCELLED: "Annulé",
  NO_SHOW: "No-show", EXPIRED: "Expiré", CONFLICT: "Conflit (à traiter)", PAID: "Payé", PENDING: "En attente",
  FAILED: "Échoué", REFUNDED: "Remboursé", APPROVED: "Approuvé", REJECTED: "Refusé", PUBLISHED: "Publié",
  DRAFT: "Brouillon", ARCHIVED: "Archivé",
};

export function Badge({ status }: { status: string }) {
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[status] ?? "bg-neutral-100"}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: string }) {
  return (
    <div className="overflow-x-auto border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-[13.5px]">
        <thead className="bg-sand/50 text-[11px] uppercase tracking-[0.1em] text-taupe">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <p className="px-4 py-6 text-center text-[13px] text-[#888]">{empty}</p>}
    </div>
  );
}
