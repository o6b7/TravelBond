import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faComments } from "@fortawesome/free-solid-svg-icons";
import { Button, Placeholder } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./groupCard.css";
import Helpers from "../../../utils/helpers";

const GroupCard = ({ group, loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="group-card">
        <Placeholder as="div" animation="glow">
          <Placeholder className="group-image-placeholder" />
        </Placeholder>
        <div className="group-details">
          <Placeholder as="h4" animation="glow">
            <Placeholder xs={6} />
          </Placeholder>
          <div className="group-stats">
            <Placeholder as="span" animation="glow">
              <Placeholder xs={4} />
            </Placeholder>
            <Placeholder as="span" animation="glow">
              <Placeholder xs={4} />
            </Placeholder>
          </div>
          <Placeholder as="p" animation="glow">
            <Placeholder xs={4} />
          </Placeholder>
        </div>
        <Placeholder.Button variant="primary" xs={4} />
      </div>
    );
  }

  const lastActive = group.last_active
    ? Helpers.formatDate(group.last_active)
    : "N/A";

  const handleViewGroup = () => {
    localStorage.setItem("currentGroupId", group.id);
    navigate(`/groups/${group.id}`);
  };

  // Get the number of participants
  const memberCount = group.participants ? group.participants.length : 0;

  return (
    <div className="group-card">
      <img
        src={group.picture}
        alt={group.title}
        className="group-image"
        onError={(e) => {
          if (e.target.src !== window.location.origin + "/default-group.png") {
            e.target.src = "/default-group.png";
          }
        }}
      />
      <div className="group-details">
        <h4 className="group-title">{group.title}</h4>
        <div className="group-stats">
          <span>
            <FontAwesomeIcon icon={faUsers} className="me-2" />
            {memberCount} {memberCount === 1 ? "Member" : "Members"}
          </span>
          <span>
            <FontAwesomeIcon icon={faComments} className="me-2" />
            {group.discussions} Discussions
          </span>
        </div>
        <p className="group-last-active">Last Activity: {lastActive}</p>
      </div>
      <Button className="custom-btn" onClick={handleViewGroup}>
        View Group
      </Button>
    </div>
  );
};

export default GroupCard;