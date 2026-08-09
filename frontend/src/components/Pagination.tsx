import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);

    if (start === 1) {
      end = Math.min(totalPages, 5);
    }
    if (end === totalPages) {
      start = Math.max(1, totalPages - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination">
      <button 
        onClick={() => onPageChange(page - 1)} 
        disabled={page === 1}
      >
        Prev
      </button>
      
      {getPages().map(p => (
        <button 
          key={p}
          className={p === page ? 'active' : ''}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      <button 
        onClick={() => onPageChange(page + 1)} 
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
