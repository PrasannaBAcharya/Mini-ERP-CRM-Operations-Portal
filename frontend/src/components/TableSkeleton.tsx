import React from 'react';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

/** Shimmer skeleton rows that match the table layout */
const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => {
  // Rough column widths — vary them so it looks realistic
  const widths = ['30%', '20%', '15%', '15%', '12%', '8%', '10%', '18%'];

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx}>
              <div
                className="skeleton"
                style={{
                  height: 13,
                  width: widths[colIdx % widths.length],
                  minWidth: 40,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TableSkeleton;
