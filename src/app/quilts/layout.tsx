// Note: dynamic and revalidate configs removed as they're incompatible with cacheComponents
// Caching is now handled via 'use cache' directive in data fetching functions

export default function QuiltsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
