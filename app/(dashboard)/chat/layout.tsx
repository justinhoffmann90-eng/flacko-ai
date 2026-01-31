// Chat page layout - just passes through children
// The parent dashboard layout handles BottomNav
// Chat page itself handles its own scroll/fixed positioning
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
