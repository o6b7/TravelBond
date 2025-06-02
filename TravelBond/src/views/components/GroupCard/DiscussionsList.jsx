import React, { useState } from "react";
import { Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faTrash, faFlag } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Helpers from "../../../utils/helpers";
import useSweetAlert from "../../../hooks/useSweetAlert";

const DiscussionsList = ({ 
  discussionsData, 
  groupId, 
  onDeleteDiscussion, 
  subModerators,
  onReport 
}) => {
  const navigate = useNavigate();
  const { showConfirmation } = useSweetAlert();
  const userId = localStorage.getItem("userId");
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentReportData, setCurrentReportData] = useState({
    reportedId: [],
    contentType: ''
  });

  const handleReport = (contentType, reportedId) => {
    setCurrentReportData({
      reportedId: reportedId,
      contentType: contentType
    });
    setShowReportModal(true);
  };

  const canDeleteDiscussion = (discussion) => {
    const isCreator = discussion.userId === userId;
    const isSubModerator = subModerators.includes(userId);
    return isCreator || isSubModerator;
  };

  const handleDeleteDiscussion = async (discussionId) => {
    const confirmation = await showConfirmation(
      "Are you sure?",
      "Do you want to delete this discussion?",
      "warning",
      "Yes",
      "Cancel"
    );

    if (confirmation.isConfirmed) {
      onDeleteDiscussion(discussionId);
    }
  };

  return (
    <Card>
      <Card.Body>
        <h3 className="section-title">Discussions</h3>
        {discussionsData.length > 0 ? (
          discussionsData.map((discussion) => (
            <div
              key={discussion.id}
              className="discussion d-flex align-items-start mb-3 p-3 border-bottom"
              onClick={() => navigate(`/groups/${groupId}/discussions/${discussion.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="me-3">
                {discussion.user.profilePicture !== "none" ? (
                  <img
                    src={discussion.user.profilePicture}
                    alt="Profile"
                    className="rounded-circle"
                    style={{ width: "60px", height: "60px" }}
                  />
                ) : (
                  <FontAwesomeIcon icon={faUserCircle} size="4x" />
                )}
              </div>
              <div className="flex-grow-1">
                <h4 className="mb-1">{discussion.title}</h4>
                <p className="text-muted mb-0">{discussion.replies.length} replies</p>
              </div>
              <div>
                <p className="text-muted mb-2">{Helpers.formatDate(discussion.createdAt)}</p>
                {canDeleteDiscussion(discussion) ? (
                  <FontAwesomeIcon
                    icon={faTrash}
                    className="text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDiscussion(discussion.id);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faFlag}
                    className="text-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReport('discussion', groupId, discussion.id);
                    }}
                    style={{ 
                      cursor: "pointer", 
                      color: "var(--danger-color)",
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No discussions yet. Join the group to start a new discussion.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default DiscussionsList;