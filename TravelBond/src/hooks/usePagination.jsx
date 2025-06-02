import { useState } from 'react';

export const usePagination = (initialVisible = 3, increment = 3) => {
  const [visibleItems, setVisibleItems] = useState(initialVisible);

  const showMore = () => setVisibleItems(prev => prev + increment);
  const showLess = () => setVisibleItems(initialVisible);
  const resetPagination = () => setVisibleItems(initialVisible);

  return {
    visibleItems,
    showMore,
    showLess,
    resetPagination
  };
};
