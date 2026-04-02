/**
 * HighlightText Component
 *
 * Highlights search terms within text
 */

import type { ReactNode } from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
  className?: string;
}

export function HighlightText({ text, searchTerm, className = '' }: HighlightTextProps) {
  if (!searchTerm.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create regex for case-insensitive matching
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');

  // Split text by search term
  const parts = text.split(regex);
  const renderedParts = parts.reduce<{
    nodes: ReactNode[];
    offset: number;
  }>(
    (state, part) => {
      const key = `${state.offset}-${part}`;
      const node =
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={key} className="bg-yellow-200 text-gray-900 font-medium px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={key}>{part}</span>
        );

      return {
        nodes: [...state.nodes, node],
        offset: state.offset + part.length,
      };
    },
    { nodes: [], offset: 0 }
  ).nodes;

  return <span className={className}>{renderedParts}</span>;
}
