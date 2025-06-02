import React from "react";
import { Card, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faFlag } from "@fortawesome/free-solid-svg-icons";

const GroupInfoCard = ({ group, onReport }) => {
  return (
    <Card className="mb-3">
      <Card.Body className="text-center">
        <div className="mb-3">
          <FontAwesomeIcon icon={faUserCircle} size="3x" />
        </div>
        <div className="d-flex justify-content-center align-items-center gap-3">
          <h2>{group.title}</h2>
          <Button 
            variant="link" 
            onClick={() => onReport('group', group.id)}
            style={{ color: "var(--danger-color)" }}
          >
            <FontAwesomeIcon icon={faFlag} />
          </Button>
        </div>
        <p>{group.description}</p>
      </Card.Body>
    </Card>
  );
};

export default GroupInfoCard;