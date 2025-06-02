import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../utils/firebaseConfig";
import EventCard from "../EventCard/EventCard";
import { useNavigate } from "react-router-dom";
import { usePagination } from "../../../hooks/usePagination";
import PaginationControls from "../Common/PaginationControls";
import UserController from "../../../controllers/UserController";
import "./eventCard.css";

const MyEvents = () => {
  const [myEvents, setMyEvents] = useState([]);
  const [sortedEvents, setSortedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = localStorage.getItem("userId");
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const {
    visibleItems,
    showMore,
    showLess
  } = usePagination(3, 3);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("userData"));
        if (!storedUser?.email) return;
        const user = await UserController.fetchUserByEmail(storedUser.email);
        setUserData(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        if (!userId) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        const q = query(collection(db, "events"), where("participants", "array-contains", userId));
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dateObj: new Date(doc.data().date)
        }));
        setMyEvents(events);
      } catch (err) {
        setError("Failed to fetch your events.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [userId]);

  useEffect(() => {
    if (myEvents.length > 0 && userData) {
      const userCountry = userData.address?.split(",")[1]?.trim() || "";

      const sorted = [...myEvents].sort((a, b) => {
        const aCountry = a.location?.split(",")[1]?.trim() || "";
        const bCountry = b.location?.split(",")[1]?.trim() || "";
        const aMatch = aCountry === userCountry;
        const bMatch = bCountry === userCountry;
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return new Date(a.dateObj) - new Date(b.dateObj);
      });

      setSortedEvents(sorted);
    } else {
      setSortedEvents(myEvents); // fallback
    }
  }, [myEvents, userData]);

  if (loading) {
    return (
      <div className="my-events-container">
        <div className="events-grid">
          {[...Array(3)].map((_, index) => (
            <EventCard key={`skeleton-${index}`} loading />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-events-container">
      <div className="events-grid">
        {sortedEvents.length > 0 ? (
          <>
            {sortedEvents.slice(0, visibleItems).map(event => (
              <EventCard
                key={event.id}
                event={event}
                onViewEvent={(eventId) => navigate(`/events/${eventId}`)}
              />
            ))}
            <PaginationControls
              onShowMore={showMore}
              onShowLess={showLess}
              remainingItems={sortedEvents.length - visibleItems}
              initialCount={visibleItems}
            />
          </>
        ) : (
          <p>You are not attending any events yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyEvents;