import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupController from "../../../controllers/GroupController";
import GroupCard from "../../components/GroupCard/GroupCard";
import { Button, Container, Row, Col } from "react-bootstrap";
import "./groups.css";
import "../../../global.css";
import MyGroups from "../../components/GroupCard/MyGroups";
import { usePagination } from "../../../hooks/usePagination";
import PaginationControls from "../../components/Common/PaginationControls";
import Skeleton from "../../components/Common/Skeleton/Skeleton";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const {
    visibleItems: visibleGroups,
    showMore: loadMoreGroups,
    showLess: showLessGroups,
  } = usePagination(3, 3);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await GroupController.fetchGroups();
        setGroups(data);
      } catch (error) {
        setError("Failed to fetch groups. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleCreateGroup = () => {
    navigate("/groups/new");
  };

  return (
    <Container fluid className="mt-3">
      <Row>
        <Col md={3} className="mb-3">
          <div className="section-box">
            <h5>My Groups</h5>
            <Button
              onClick={handleCreateGroup}
              className="custom-btn w-100"
              style={{ backgroundColor: "#39aaa4", borderColor: "#39aaa4" }}
            >
              Create a Group
            </Button>
          </div>
        </Col>

        <Col md={9}>
          <section className="section-box">
            <h4 className="section-title">Popular Groups</h4>
            {loading ? (
              <Skeleton type="group" count={3} />
            ) : groups.length > 0 ? (
              <>
                {groups.slice(0, visibleGroups).map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
                <PaginationControls
                  onShowMore={loadMoreGroups}
                  onShowLess={showLessGroups}
                  remainingItems={groups.length - visibleGroups}
                  initialCount={visibleGroups}
                />
              </>
            ) : (
              <p>No groups found.</p>
            )}
          </section>

          <section className="section-box">
            <h4 className="section-title">My Groups</h4>
            <MyGroups />
          </section>
        </Col>
      </Row>
    </Container>
  );
}