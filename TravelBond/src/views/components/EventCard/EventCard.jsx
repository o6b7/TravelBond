import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faCalendarAlt, faClock, faUserFriends } from "@fortawesome/free-solid-svg-icons";
import { Button } from "react-bootstrap";
import "./EventCard.css";

const EventCard = ({ event, onViewEvent, loading = false }) => {
  if (loading) {
    return (
      <div className="event-card skeleton">
        <div className="event-image skeleton-image"></div>
        <div className="event-details">
          <div className="event-title skeleton-title"></div>
          <div className="event-meta">
            <div className="skeleton-meta-item"></div>
            <div className="skeleton-meta-item"></div>
            <div className="skeleton-meta-item"></div>
            <div className="skeleton-meta-item"></div>
          </div>
        </div>
        <div className="skeleton-button"></div>
      </div>
    );
  }

  const eventDate = event.date instanceof Date ? event.date : new Date(event.date);

  return (
    <div className="event-card">
      <img
        src={event.picture || "/default-event.png"}
        alt={event.title}
        className="event-image"
        onError={(e) => {
          if (e.target.src !== window.location.origin + "/default-event.png") {
            e.target.src = "/default-event.png";
          }
        }}
      />

      <div className="event-details">
        <h4 className="event-title">{event.title}</h4>

        <div className="event-meta">
          <p>
            <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-secondary" />
            <strong>Location:</strong> {event.location || "Unknown"}
          </p>
          <p>
            <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-secondary" />
            <strong>Date:</strong> {eventDate.toLocaleDateString()}
          </p>
          <p>
            <FontAwesomeIcon icon={faClock} className="me-2 text-secondary" />
            <strong>Time:</strong> {event.time || "TBA"}
          </p>
          <p>
            <FontAwesomeIcon icon={faUserFriends} className="me-2 text-secondary" />
            <strong>Attending:</strong> {event.participants?.length || 0} people
          </p>
        </div>
      </div>

      <Button
        className="custom-btn"
        onClick={() => onViewEvent?.(event.id)}
      >
        View Event
      </Button>
      </div>
  );
};

export default EventCard; 