import React from "react";
import "./skeleton.css";

const Skeleton = ({ type = "event", count = 1 }) => {
  const skeletons = Array(count).fill(0);
  
  return (
    <>
      {skeletons.map((_, index) => (
        <div key={index} className={`skeleton-card skeleton-${type}`}>
          {/* Content varies by type */}
          {type === "user" && (
            <>
              <div className="skeleton-user-header">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-user-info">
                  <div className="skeleton-name"></div>
                  <div className="skeleton-location"></div>
                  <div className="skeleton-stats"></div>
                  <div className="skeleton-activity"></div>
                </div>
              </div>
              <div className="skeleton-badge"></div>
            </>
          )}
          
          {type === "event" && (
            <>
              <div className="skeleton-event-header">
                <div className="skeleton-title"></div>
              </div>
              <div className="skeleton-event-details">
                <div className="skeleton-detail-item"></div>
                <div className="skeleton-detail-item"></div>
                <div className="skeleton-detail-item"></div>
                <div className="skeleton-detail-item"></div>
              </div>
              <div className="skeleton-button"></div>
            </>
          )}
          
          {type === "group" && (
            <>
              <div className="skeleton-group-header">
                <div className="skeleton-title"></div>
                <div className="skeleton-description"></div>
              </div>
              <div className="skeleton-group-stats">
                <div className="skeleton-stat-item"></div>
                <div className="skeleton-stat-item"></div>
              </div>
              <div className="skeleton-activity"></div>
              <div className="skeleton-button"></div>
            </>
          )}

          {type === "chat" && (
            <div className="skeleton-chat">
              {Array(count).fill(0).map((_, index) => (
                <div key={index} className="skeleton-message"></div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default Skeleton;