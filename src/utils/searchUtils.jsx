export const filterEntriesBySearch = (entries, query) => {
    // If no query, return all entries
    if (!query || query.trim() === '') {
      return entries;
    }
  
    // Split the query by + to handle multiple search terms
    const searchTerms = query.toLowerCase().split('+').map(term => term.trim()).filter(term => term);
    
    if (searchTerms.length === 0) {
      return entries;
    }
  
    return entries.filter(entry => {
      // Check if entry matches ANY search term (logical OR)
      return searchTerms.some(term => {
        // Search in entry_data
        if (entry.entry_data) {
          // Check if any field in entry_data contains the search term
          return Object.values(entry.entry_data).some(value => {
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(term);
          });
        }
        return false;
      });
    });
  };
  
  /**
   * Highlight search terms in text
   * @param {string} text - The text to highlight
   * @param {string} query - The search query
   * @returns {JSX.Element|string} - Text with highlighted search terms
   */
  export const highlightSearchTerms = (text, query) => {
    if (!query || query.trim() === '' || !text) {
      return text;
    }
  
    const searchTerms = query.toLowerCase().split('+').map(term => term.trim()).filter(term => term);
    
    if (searchTerms.length === 0) {
      return text;
    }
  
    // Convert text to string if it's not already
    const textStr = String(text);
    
    // Create a regex pattern that matches any of the search terms
    const pattern = searchTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    // Split the text by the regex matches
    const parts = textStr.split(regex);
    
    // Map over the parts and wrap matches in highlight span
    return parts.map((part, i) => {
      // Check if this part matches any of the search terms
      const isMatch = searchTerms.some(term => part.toLowerCase() === term);
      return isMatch ? 
        <span key={i} className="bg-yellow-200 dark:bg-yellow-700">{part}</span> : 
        part;
    });
  };
