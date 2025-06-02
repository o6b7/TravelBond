// ✅ Updated MyGroups.js using usePagination
import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../utils/firebaseConfig"; // Ensure Firebase is initialized
import GroupCard from "../GroupCard/GroupCard";
import { usePagination } from "../../../hooks/usePagination";
import PaginationControls from "../../components/Common/PaginationControls";
import Skeleton from "../../components/Common/Skeleton/Skeleton"; // Import Skeleton
import "./groupCard.css";

const MyGroups = () => {
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = localStorage.getItem("userId");

  const {
    visibleItems: visibleGroups,
    showMore: loadMoreGroups,
    showLess: showLessGroups,
  } = usePagination(3, 3);

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const groupIds = userData.groups || [];

          const groups = await Promise.all(
            groupIds.map(async (groupId) => {
              const groupRef = doc(db, "groups", groupId);
              const groupDoc = await getDoc(groupRef);
              if (groupDoc.exists()) {
                const groupData = groupDoc.data();
                const lastActive = groupData.last_active
                  ? groupData.last_active.toDate()
                  : null;
                return { id: groupDoc.id, ...groupData, last_active: lastActive };
              }
              return null;
            })
          );

          setMyGroups(groups.filter((group) => group !== null));
        } else {
          setError("User not found.");
        }
      } catch (error) {
        setError("User not authenticated.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyGroups();
  }, [userId]);

  if (loading) {
    // Show skeleton loading instead of the text
    return <Skeleton type="group" count={3} />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="my-groups">
      {myGroups.length > 0 ? (
        <>
          {myGroups.slice(0, visibleGroups).map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
          <PaginationControls
            onShowMore={loadMoreGroups}
            onShowLess={showLessGroups}
            remainingItems={myGroups.length - visibleGroups}
            initialCount={visibleGroups}
          />
        </>
      ) : (
        <p>You are not part of any groups yet.</p>
      )}
    </div>
  );
};

export default MyGroups;