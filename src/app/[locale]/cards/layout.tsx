import { ReactNode } from 'react';

interface CardsLayoutProps {
  children: ReactNode;
}

export default function CardsLayout({ children }: CardsLayoutProps) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
