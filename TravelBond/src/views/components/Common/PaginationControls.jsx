import React from 'react';
import { Button } from 'react-bootstrap';
import './PaginationControls.css';

const PaginationControls = ({
  onShowMore,
  onShowLess,
  showMoreDisabled = false,
  showLessDisabled = false,
  remainingItems = 0,
  initialCount = 3
}) => {
  return (
    <div className="pagination-controls">
      {remainingItems > 0 && (
        <Button
          onClick={onShowMore}
          className="load-more-btn"
          disabled={showMoreDisabled}
          style={{ backgroundColor: "#39aaa4", borderColor: "#39aaa4" }}
        >
          Show More ({remainingItems} remaining)
        </Button>
      )}
      {initialCount > 3 && !showLessDisabled && ( // Only show if not disabled
        <Button
          onClick={onShowLess}
          className="load-less-btn"
          disabled={showLessDisabled}
          style={{ backgroundColor: "#39aaa4", borderColor: "#39aaa4" }}
        >
          Show Less
        </Button>
      )}
    </div>
  );
};

export default PaginationControls;