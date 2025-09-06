import React, { useState, useEffect } from "react";
import { Container, Table, Button, Badge, Form, Modal, Row, Col, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ReportController from "../../../controllers/ReportController";
import "../../../global.css";
import "./reports.css";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PostController from "../../../controllers/PostController";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentReport, setCurrentReport] = useState(null);
  const [note, setNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState(null);
  const [contentTypeFilter, setContentTypeFilter] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [filters, setFilters] = useState({
    statusFilter: null,
    contentTypeFilter: null,
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const filters = {
          status: statusFilter,
          contentType: contentTypeFilter,
          startDate: dateRange[0],
          endDate: dateRange[1]
        };
        const reportsData = await ReportController.fetchFilteredReports(filters);
        const uniqueReports = Array.from(new Set(reportsData.map(r => r.id)))
          .map(id => reportsData.find(r => r.id === id));
        setReports(uniqueReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };
  
    setLoading(true); 
    fetchReports();
  }, [statusFilter, contentTypeFilter, dateRange]);  


  useEffect(() => {
    setLoading(true);
  }, [statusFilter, contentTypeFilter, dateRange]);

  const handleStatusChange = async (report, newStatus) => {
    if (report.status === newStatus) {
      return;
    }
    
    setCurrentReport(report);
    setActionType(newStatus);
    setShowNoteModal(true);
  };

  const confirmStatusChange = async () => {
    if (!note.trim()) {
      alert("Please enter a note before confirming");
      return;
    }
  
    try {
      await ReportController.updateReportStatus(
        currentReport.id, 
        actionType,
        note
      );
      
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === currentReport.id 
            ? { ...report, status: actionType, note } 
            : report
        )
      );
      
      setShowNoteModal(false);
      setNote("");
    } catch (error) {
      console.error("Error updating report status:", error);
      alert(`Failed to update report: ${error.message}`);

      setReports(prevReports => 
        prevReports.filter(report => report.id !== currentReport.id)
      );
    }
  };

  const getContentDescription = (report) => {
    const [firstId, secondId, thirdId] = report.reportedId || [];
    
    switch (report.contentType) {
      case 'group':
        return `Group: ${firstId}`;
      case 'discussion':
        return `Discussion: ${secondId} in Group ${firstId}`;
      case 'reply':
        if (firstId?.startsWith('G')) {
          return `Reply: ${thirdId} in Discussion ${secondId} (Group ${firstId})`;
        } else if (firstId?.startsWith('E')) {
          return `Reply: ${secondId} in Event ${firstId}`;
        } else if (firstId?.startsWith('P')) {
          return `Reply: ${thirdId} in Comment ${secondId} (Post ${firstId})`;
        }
        return `Reply: ${thirdId}`;
      case 'comment':
        if (firstId?.startsWith('P')) {
          return `Comment: ${secondId} in Post ${firstId}`;
        }
        return `Comment: ${secondId}`;
      case 'event':
        return `Event: ${firstId}`;
      case 'post':
        return `Post: ${firstId}`;
      default:
        return 'Unknown content';
    }
  };

  const handleReportClick = async (report) => {
    const [firstId, secondId, thirdId] = report.reportedId || [];
  
    switch (report.contentType) {
      case 'group':
        navigate(`/groups/${firstId}`);
        break;
      case 'discussion':
        navigate(`/groups/${firstId}/discussions/${secondId}`);
        break;
      case 'reply':
        if (firstId?.startsWith('G')) {
          navigate(`/groups/${firstId}/discussions/${secondId}`, {
            state: { highlightReply: thirdId }
          });
        } else if (firstId?.startsWith('E')) {
          navigate(`/events/${firstId}`, {
            state: { highlightReply: secondId }
          });
        } else if (firstId?.startsWith('P')) {
          navigate(`/posts/${firstId}`, {
            state: { 
              showComments: true,
              highlightComment: secondId,
              highlightReply: thirdId
            }
          });
        }
        break;
      case 'comment':
        if (firstId?.startsWith('P')) {
          navigate(`/posts/${firstId}`, {
            state: { 
              showComments: true,
              highlightComment: secondId
            }
          });
        }
        break;
      case 'event':
        navigate(`/events/${firstId}`);
        break;
      case 'post':
        try {
          const post = await PostController.fetchPostById(firstId);
          if (post?.userId) {
            window.location.href = `/profile/${post.userId}?highlightPost=${firstId}`;
          } else {
            console.error("Post does not have a userId.");
            alert("Unable to find the post owner.");
          }
        } catch (error) {
          console.error("Error fetching post:", error);
          alert("Failed to fetch post owner.");
        }
        break;
      default:
        console.warn('Unknown report type:', report.contentType);
    }
  };
  

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Pending</Badge>;
      case "Resolved":
        return <Badge bg="success">Resolved</Badge>;
      case "Ignored":
        return <Badge bg="secondary">Ignored</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getRowClass = (status) => {
    switch (status) {
      case "Resolved":
        return "resolved-row";
      case "Ignored":
        return "ignored-row";
      default:
        return "";
    }
  };

  const truncateReason = (reason, length = 50) => {
    return reason.length > length 
      ? `${reason.substring(0, length)}...` 
      : reason;
  };

  if (loading) {
    return <LoadingComponent/>;
  }

  return (
    <Container className="reports-container mt-4">
      <h2 className="section-title">Reports</h2>
      
      {/* Filter Controls */}
      <div className="report-filters mb-4 p-3 bg-light rounded">
        <Row className="g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start">
                  {statusFilter || "All Statuses"}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                <Dropdown.Item onClick={() => {
                  setStatusFilter(null);
                  setLoading(true);
                }}>All Statuses</Dropdown.Item>

                <Dropdown.Item onClick={() => {
                  setStatusFilter("pending"); 
                  setLoading(true);
                }}>Pending</Dropdown.Item>

                <Dropdown.Item onClick={() => {
                  setStatusFilter("Resolved");
                  setLoading(true);
                }}>Resolved</Dropdown.Item>

                <Dropdown.Item onClick={() => {
                  setStatusFilter("Ignored");
                  setLoading(true);
                }}>Ignored</Dropdown.Item>


                </Dropdown.Menu>
              </Dropdown>
            </Form.Group>
          </Col>
          
          <Col md={3}>
            <Form.Group>
              <Form.Label>Content Type</Form.Label>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start">
                  {contentTypeFilter || "All Types"}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                  <Dropdown.Item onClick={() => {
                    setContentTypeFilter(null);
                    setLoading(true);
                  }}>All Types</Dropdown.Item>
                  
                  <Dropdown.Item onClick={() => {
                    setContentTypeFilter("event");
                    setLoading(true);
                  }}>Event</Dropdown.Item>
                  
                  <Dropdown.Item onClick={() => {
                    setContentTypeFilter("group");
                    setLoading(true);
                  }}>group</Dropdown.Item>
                  
                  <Dropdown.Item onClick={() => {
                    setContentTypeFilter("discussion");
                    setLoading(true);
                  }}>discussion</Dropdown.Item>

                  <Dropdown.Item onClick={() => {
                    setContentTypeFilter("post");
                    setLoading(true);
                  }}>Post</Dropdown.Item>
                  
                  <Dropdown.Item onClick={() => {
                    setContentTypeFilter("comment");
                    setLoading(true);
                  }}>comment</Dropdown.Item>

                  <Dropdown.Item onClick={() => {
                    setContentTypeFilter("reply");
                    setLoading(true);
                  }}>Reply</Dropdown.Item>

                </Dropdown.Menu>
              </Dropdown>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group>
              <Form.Label>Date Range</Form.Label>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  setDateRange(update);
                  setLoading(true); 
                }}
                isClearable={true}
                placeholderText="Select date range"
                className="form-control"
              />
            </Form.Group>
          </Col>
        </Row>
      </div>

      <Table striped bordered hover responsive className="reports-table">
        <thead>
          <tr>
            <th>Date</th>
            <th className="reason-column">Reason</th>
            <th>Reported Content</th>
            <th>Reporter ID</th>
            <th>Status</th>
            <th style={{width: "250px"}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <React.Fragment key={report.id}>
              <tr className={getRowClass(report.status)}>
                <td>{new Date(report.createdAt).toLocaleString()}</td>
                <td className="reason-cell" title={report.reason}>
                  {truncateReason(report.reason)}
                </td>
                <td>{getContentDescription(report)}</td>
                <td>{report.reporterId}</td>
                <td>{getStatusBadge(report.status)}</td>
                <td className="actions-cell">
                  <div className="d-flex gap-2 flex-wrap">
                    <Button 
                      variant={report.status === "Resolved" ? "outline-success" : "success"} 
                      size="sm" 
                      onClick={() => handleStatusChange(report, "Resolved")}
                      className="action-btn"
                    >
                      {report.status === "Resolved" ? "✓ Resolved" : "Resolve"}
                    </Button>
                    <Button 
                      variant={report.status === "Ignored" ? "outline-secondary" : "secondary"} 
                      size="sm" 
                      onClick={() => handleStatusChange(report, "Ignored")}
                      className="action-btn"
                    >
                      {report.status === "Ignored" ? "✗ Ignored" : "Ignore"}
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleReportClick(report)}
                      className="action-btn view-btn"
                    >
                      View
                    </Button>
                  </div>
                </td>
              </tr>
              {report.note && (
                <tr>
                  <td colSpan="6" className="note-cell">
                    <strong>Admin Note:</strong> {report.note}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>

      <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Note for {actionType}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Note (required)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter your note about this report..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmStatusChange}
            disabled={!note.trim()}
            className="confirm-btn"
          >
            Confirm {actionType}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}