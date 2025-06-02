import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faTrash } from "@fortawesome/free-solid-svg-icons";
import Helpers from "../../../../utils/helpers";
import "./references.css";

const ReferencesCard = ({ reference, onDelete }) => {
  const currentUser = JSON.parse(localStorage.getItem("userData")) || {};
  const isAdmin = currentUser.role?.toLowerCase() === "admin";
  const isReferenceOwner = reference.userId === currentUser.id;
  const canDelete = (isAdmin || isReferenceOwner);

  return (
    <div className="reference-card position-relative">
      {canDelete && (
        <FontAwesomeIcon 
          icon={faTrash}
          className="reference-delete-icon"
          onClick={onDelete}
        />
      )}

      <div className="reference-header">
        <span className={`reference-type reference-type-${reference.type}`}>
          {reference.type}
        </span>
        <div className="reference-stars">
          {Array.from({ length: 5 }, (_, i) => (
            <FontAwesomeIcon
              key={i}
              icon={faStar}
              className={i < reference.rating ? "star-filled" : "star-empty"}
            />
          ))}
        </div>
      </div>
      <p className="reference-comment">{reference.content}</p>
      <div className="reference-footer">
        <p className="reference-by">By: {reference.userName}</p>
        <p className="reference-date">{Helpers.formatDate(reference.date)}</p>
      </div>
    </div>
  );
};

export default ReferencesCard;
