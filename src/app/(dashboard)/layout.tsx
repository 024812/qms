/**
 * Dashboard Layout
 * 
 * This layout is for pages in the (dashboard) route group.
 * The actual sidebar/header is provided by ConditionalLayout in root layout.
 * This is kept as a pass-through to maintain the route group structure.
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
