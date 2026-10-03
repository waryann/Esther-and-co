/** Re-monté à chaque navigation : donne une transition douce entre les pages. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
