import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { SearchIcon } from '../assets/icons';

// Create a new atom for the search query
export const searchQueryAtom = atom('');
// Create an atom for the filtered entries
export const filteredEntriesAtom = atom([]);

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search input to prevent excessive filtering
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      
      if (onSearch) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery, onSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="relative flex items-center w-64 mr-2">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>
      <input
        type="text"
        className="bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg py-1 pl-10 pr-10 w-full focus:outline-asu-gold"
        placeholder="Search entries..."
        value={searchQuery}
        onChange={handleSearchChange}
      />
      {searchQuery && (
        <button
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          onClick={handleClearSearch}
        >
          <span className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            ✕
          </span>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
