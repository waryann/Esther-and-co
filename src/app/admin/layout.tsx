export const metadata = { title: "Admin — ESTHAIR & CO.", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f6f2ec]">{children}</div>;
}
