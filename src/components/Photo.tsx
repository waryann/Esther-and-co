/* eslint-disable @next/next/no-img-element */
export function Photo({
  src,
  alt = "",
  className = "",
  priority = false,
  children,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`group/photo relative overflow-hidden bg-[#1a140f] ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[50%_28%] transition-transform duration-[900ms] ease-out group-hover/photo:scale-[1.05]"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 70% 20%, rgba(216,188,154,.28) 0%, rgba(60,42,28,.0) 55%), linear-gradient(160deg, #3a2a1d 0%, #1b130d 55%, #0b0b0b 100%)",
          }}
        />
      )}
      {children}
    </div>
  );
}
