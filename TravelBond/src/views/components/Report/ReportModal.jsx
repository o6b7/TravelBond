import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag } from "@fortawesome/free-solid-svg-icons";
import ReportController from "../../../controllers/ReportController";
import useSweetAlert from "../../../hooks/useSweetAlert";
import "./ReportModal.css";

const ReportModal = ({ 
  show, 
  onHide, 
  reporterId, 
  reportedId,  // [groupId, discussionId, replyId]
  contentType 
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showAlert } = useSweetAlert();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showAlert("Error", "Please provide a reason for reporting", "error", "OK");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure reportedId is properly structured
      const finalReportedId = contentType === 'event' 
        ? [reportedId[0]]  // Only keep event ID for events
        : reportedId;

      const reportData = {
        reportedId: finalReportedId,
        reporterId: reporterId,
        reason: reason,
        contentType: contentType,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      await ReportController.createReport(reportData);

      showAlert(
        "Report Submitted", 
        "Thank you for your report. Our team will review it.", 
        "success", 
        "OK"
      );
      onHide();
      setReason("");
    } catch (error) {
      console.error("Error submitting report:", error);
      showAlert(
        "Error", 
        "Failed to submit report. Please try again.", 
        "error", 
        "OK"
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="report-modal-header">
        <Modal.Title className="report-modal-title">
          <FontAwesomeIcon icon={faFlag} className="me-2" />
          Report Content
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="report-modal-body">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Reason for reporting</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you're reporting this content..."
              required
            />
          </Form.Group>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              type="submit" 
              disabled={isSubmitting}
              style={{ backgroundColor: "var(--identity-color)" }}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ReportModal;