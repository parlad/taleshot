import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MasonryGridProps {
  children: React.ReactNode[];
  columnCount?: number;
  gap?: number;
}

export function MasonryGrid({ children, columnCount = 3, gap = 16 }: MasonryGridProps) {
  const [columns, setColumns] = useState<React.ReactNode[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.offsetWidth;
      let cols = columnCount;

      if (width < 640) cols = 1;
      else if (width < 1024) cols = 2;
      else if (width < 1536) cols = 3;
      else cols = 4;

      const newColumns: React.ReactNode[][] = Array.from({ length: cols }, () => []);

      children.forEach((child, index) => {
        const columnIndex = index % cols;
        newColumns[columnIndex].push(child);
      });

      setColumns(newColumns);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [children, columnCount]);

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex" style={{ gap: `${gap}px` }}>
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="flex-1"
            style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}
          >
            {column.map((item, itemIndex) => (
              <motion.div
                key={`${columnIndex}-${itemIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: itemIndex * 0.05 }}
              >
                {item}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
