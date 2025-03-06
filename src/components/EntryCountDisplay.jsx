import React from 'react';

const EntryCountDisplay = ({ 
  currentPageCount, 
  totalFilteredCount, 
  totalCount,
  isFiltered = false
}) => {
  return (
    <div className="text-sm text-neutral-500 dark:text-neutral-400">
      Showing {currentPageCount} of {totalFilteredCount} entries
      {isFiltered && totalCount > totalFilteredCount && 
        ` (filtered from ${totalCount} total)`
      }
    </div>
  );
};

export default EntryCountDisplay;