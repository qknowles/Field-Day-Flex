import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { searchQueryAtom } from '../utils/jotai';
import { IoSearchOutline } from 'react-icons/io5';
import { IoMdClose } from 'react-icons/io';

/**
 * SearchBar component for filtering table data
 * Allows users to search by multiple terms using + as a separator
 */
const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [inputValue, setInputValue] = useState('');

  // Initialize input value when component mounts or when searchQuery changes externally
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSearch = () => {
    setSearchQuery(inputValue.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSearchQuery('');
  };

  return (
    <div className="relative w-64 mx-2">
      <div className="flex items-center bg-white dark:bg-neutral-800 rounded-md border border-neutral-300 dark:border-neutral-600">
        <input
          type="text"
          className="w-full py-1 px-3 bg-transparent border-none focus:ring-0 focus:outline-none"
          placeholder="Search... (Use + for multiple terms)"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center pr-2">
          {inputValue && (
            <button 
              onClick={clearSearch}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white mr-1"
            >
              <IoMdClose size={16} />
            </button>
          )}
          <button 
            onClick={handleSearch}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
          >
            <IoSearchOutline size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
