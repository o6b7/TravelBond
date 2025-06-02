import React from "react";
import { Card, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCheckCircle, 
  faUserFriends, 
  faComment,
  faMapMarkerAlt,
  faClock,
  faUserCircle
} from "@fortawesome/free-solid-svg-icons";
import "./UserCard.css";
import Helpers from "../../../utils/helpers";

const UserCard = ({ user, onViewUser, loading = false }) => {
  const handleClick = () => {
    if (!loading && onViewUser && typeof onViewUser === "function") {
      onViewUser(user?.id);
    }
  };

  if (loading) {
    return (
      <Card className="profile-user-card mb-3 skeleton" role="button">
        <Card.Body className="p-3">
          <div className="d-flex align-items-center">
            <div className="position-relative me-3">
              <div className="skeleton-image rounded-circle"></div>
            </div>

            <div className="user-details flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="skeleton-title mb-2"></div>
                  <div className="skeleton-meta-item mb-1"></div>
                  <div className="skeleton-meta-item mb-1" style={{ width: '80%' }}></div>
                  <div className="skeleton-meta-item" style={{ width: '70%' }}></div>
                </div>
                <div className="skeleton-badge"></div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="profile-user-card mb-3" onClick={handleClick} role="button">
      <Card.Body className="p-3">
        <div className="d-flex align-items-center">
          <div className="position-relative me-3">
            <div className="profile-image-container">
              {user.profilePicture && user.profilePicture !== "none" ? (
                <img
                  src={user.profilePicture}
                  alt="User Profile"
                  className="profile-img"
                />
              ) : (
                <FontAwesomeIcon icon={faUserCircle} className="profile-icon text-muted" />
              )}
            </div>
            {user.verified && (
              <div className="verified-badge-container">
                <Badge pill bg="primary" className="verified-badge">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </Badge>
              </div>
            )}
          </div>

          <div className="user-details flex-grow-1">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h5 className="mb-0">{user.name || "Unknown User"}</h5>

                <div className="text-muted small mt-1">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                  <span>{user.address || "Location Unknown"}</span>
                </div>

                <div className="text-muted small mt-1">
                  <FontAwesomeIcon icon={faComment} className="me-1" />
                  <span>{user.references?.length || 0} references</span>
                  <span className="mx-1">▲</span>
                  <FontAwesomeIcon icon={faUserFriends} className="me-1" />
                  <span>{user.friends?.length || 0} friends</span>
                </div>

                {user.lastActive && (
                  <div className="text-muted small mt-1">
                    <FontAwesomeIcon icon={faClock} className="me-1" />
                    <span>Active {Helpers.formatDate(user.lastActive)}</span>
                  </div>
                )}
              </div>

              <Badge pill bg="secondary" className="guest-status-badge">
                {user.hostAvailability || "MAYBE ACCEPTING GUESTS"}
              </Badge>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default UserCard;