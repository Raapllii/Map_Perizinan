import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDebounce } from './useDebounce';

export function useBusinessSearch(debounceDelay: number = 400, minLength: number = 2) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  
  const debouncedQuery = useDebounce(searchQuery, debounceDelay);

  useEffect(() => {
    if (debouncedQuery.length >= minLength) {
      setIsSearching(true);
      setSearchError("");
      
      const source = axios.CancelToken.source();
      
      axios.get(`/api/businesses/search?q=${encodeURIComponent(debouncedQuery)}`, {
        cancelToken: source.token
      })
        .then(res => {
          setSearchResults(res.data);
        })
        .catch(err => {
          if (!axios.isCancel(err)) {
            console.error(err);
            setSearchError("Gagal mencari data. Silakan coba lagi.");
          }
        })
        .finally(() => {
          setIsSearching(false);
        });
        
      return () => {
        source.cancel("Operation canceled by new search request.");
      };
    } else {
      setSearchResults([]);
      setSearchError("");
    }
  }, [debouncedQuery, minLength]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    searchError
  };
}
