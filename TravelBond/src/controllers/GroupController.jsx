import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayRemove, 
  arrayUnion, 
  deleteDoc,
  writeBatch, 
  collection, 
  getDocs 
} from "firebase/firestore";
import { db } from "../utils/firebaseConfig"; // Import db from your Firebase config
import GroupService from "../services/GroupService";
import GroupModel from "../models/GroupModel"; // Import GroupModel if not already imported
import UserService from "../services/UserService";


class GroupController {
  /**
   * Fetch all groups.
   * @returns {Promise<GroupModel[]>}
   */
  static async fetchGroups() {
    try {
      const groups = await GroupService.fetchGroups();
      return groups;
    } catch (error) {
      console.error("Error fetching groups:", error);
      throw error;
    }
  }


  /**
   * Fetch a group by ID.
   * @param {string} groupId - The ID of the group to fetch.
   * @returns {Promise<GroupModel>}
   */
  static async fetchGroupById(groupId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);
      if (groupDoc.exists()) {
        const data = groupDoc.data();
        return new GroupModel({
          id: groupDoc.id,
          title: data.title,
          description: data.description,
          discussions: data.discussions || 0,
          last_active: data.last_active,
          main_moderator: data.main_moderator,
          members: data.members || 0,
          picture: data.picture || "/default-group.png",
          sub_moderators: data.sub_moderators || [],
          participants: data.participants || [], // Ensure participants are fetched
        });
      } else {
        throw new Error("Group not found");
      }
    } catch (error) {
      console.error("Error fetching group by ID:", error.message);
      throw error;
    }
  }
  
  /**
   * Join a group.
   * @param {string} groupId - The ID of the group to join.
   * @param {string} userId - The ID of the user joining the group.
   * @returns {Promise<void>}
   */
  static async joinGroup(groupId, userId) {
    try {
      await GroupService.joinGroup(groupId, userId);
    } catch (error) {
      console.error("Error joining group:", error);
      throw error;
    }
  }

  /**
   * Leave a group.
   * @param {string} groupId - The ID of the group to leave.
   * @param {string} userId - The ID of the user leaving the group.
   * @returns {Promise<void>}
   */
  static async leaveGroup(groupId, userId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        participants: arrayRemove(userId),
        sub_moderators: arrayRemove(userId), // Remove sub-moderator status if applicable
      });
      await UserService.removeGroupFromUser(userId, groupId);
    } catch (error) {
      console.error("Error leaving group:", error);
      throw error;
    }
  }

  /**
   * Create a new group.
   * @param {Object} groupData - The group data to create.
   * @param {Function} showAlert - Function to show alerts.
   * @returns {Promise<void>}
   */
  static async createGroup(groupData, showAlert) {
    try {
      const groupId = await GroupService.createGroup(groupData);
      showAlert("Success!", "Group created successfully!", "success", "OK");
      return groupId;
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  }

  /**
   * Join a group.
   * @param {string} groupId - The ID of the group to join.
   * @param {string} userId - The ID of the user joining the group.
   * @returns {Promise<void>}
   */
  static async joinGroup(groupId, userId) {
    try {
      await GroupService.joinGroup(groupId, userId);
    } catch (error) {
      console.error("Error joining group:", error);
      throw error;
    }
  }

  static async addSubModerator(groupId, userId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        sub_moderators: arrayUnion(userId),
        participants: arrayUnion(userId), // Ensure the user is also a participant
      });
    } catch (error) {
      console.error("Error adding sub-moderator:", error);
      throw error;
    }
  }
  
  
  static async removeSubModerator(groupId, userId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        sub_moderators: arrayRemove(userId),
      });
    } catch (error) {
      console.error("Error removing sub-moderator:", error);
      throw error;
    }
  }

  /**
   * Delete a group and its associated image from storage.
   * @param {string} groupId
   * @param {string} [pictureUrl] - Optional picture URL to delete
   */
  static async deleteGroup(groupId, pictureUrl) {
    try {
      const batch = writeBatch(db);
  
      // 1. Delete group's document
      batch.delete(doc(db, "groups", groupId));
  
      // 2. Remove group from users' groups array
      const usersSnapshot = await getDocs(collection(db, "users"));
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if ((userData.groups || []).includes(groupId)) {
          batch.update(userDoc.ref, {
            groups: arrayRemove(groupId)
          });
        }
      });
  
      // 3. Remove groupId from participants in events
      const eventsSnapshot = await getDocs(collection(db, "events"));
      eventsSnapshot.forEach((eventDoc) => {
        const eventData = eventDoc.data();
        if (eventData.participants?.includes(groupId)) {
          batch.update(eventDoc.ref, {
            participants: arrayRemove(groupId)
          });
        }
      });
  
      // 4. Delete picture if not default
      if (pictureUrl && !pictureUrl.includes('/default-group.png')) {
        try {
          const imageRef = ref(storage, pictureUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn("Group image deletion failed:", error);
        }
      }
  
      // 🚀 Commit batch
      await batch.commit();
    } catch (error) {
      console.error("Error deleting group:", error);
      throw error;
    }
  }
  
  
}

export default GroupController;