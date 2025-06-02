import { db, storage } from "../utils/firebaseConfig";
import { collection, doc, setDoc, getDocs, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import GroupModel from "../models/GroupModel";
import IdGenerator from "../utils/IdGenerator";
import UserService from "./UserService"; // Import UserService

class GroupService {
  static async fetchGroups() {
    try {
      const groupsCollection = collection(db, "groups");
      const groupSnapshot = await getDocs(groupsCollection);
      return groupSnapshot.docs.map((doc) => {
        const data = doc.data();
        return new GroupModel({
          id: doc.id,
          title: data.title,
          description: data.description,
          discussions: data.discussions,
          last_active: data.last_active,
          main_moderator: data.main_moderator,
          members: data.members,
          picture: data.picture,
          sub_moderators: data.sub_moderators,
          participants: data.participants,
        });
      });
    } catch (error) {
      console.error("Error fetching groups:", error.message);
      throw error;
    }
  }

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
          participants: data.participants || [],
        });
      } else {
        throw new Error("Group not found");
      }
    } catch (error) {
      console.error("Error fetching group by ID:", error.message);
      throw error;
    }
  }

  static async joinGroup(groupId, userId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        participants: arrayUnion(userId),
      });
      await UserService.addGroupToUser(userId, groupId);
    } catch (error) {
      console.error("Error joining group:", error.message);
      throw error;
    }
  }

  static async leaveGroup(groupId, userId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        participants: arrayRemove(userId),
      });
      await UserService.removeGroupFromUser(userId, groupId);
    } catch (error) {
      console.error("Error leaving group:", error.message);
      throw error;
    }
  }

  static async createGroup(groupData) {
    try {
      const groupId = await IdGenerator.generateId("group");
      let pictureUrl = "/default-group.png";

      if (groupData.picture) {
        try {
          const cleanFileName = groupData.picture.name.replace(/[^\w.-]/g, '_');
          const storageRef = ref(storage, `group-pictures/${groupId}-${cleanFileName}`);
          await uploadBytes(storageRef, groupData.picture);
          pictureUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error("Error uploading group picture:", uploadError);
        }
      }

      const group = new GroupModel({
        id: groupId,
        title: groupData.title,
        description: groupData.description,
        discussions: 0,
        last_active: new Date(),
        main_moderator: groupData.main_moderator,
        members: 1,
        picture: pictureUrl,
        sub_moderators: [],
        participants: [groupData.main_moderator], // Add creator as participant
      });

      const groupRef = doc(db, "groups", groupId);
      await setDoc(groupRef, group.toFirestore());

      // Add group to user's groups
      await UserService.addGroupToUser(groupData.main_moderator, groupId);

      return groupId;
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  }

  static async incrementGroupDiscussions(groupId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        discussions: increment(1), // Increment the discussions field by 1
      });
    } catch (error) {
      console.error("Error incrementing group discussions:", error);
      throw error;
    }
  }

  static async decrementGroupDiscussions(groupId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        discussions: increment(-1), // Decrement the discussions field by 1
      });
    } catch (error) {
      console.error("Error decrementing group discussions:", error);
      throw error;
    }
  }

  // Update the last_active field for a group
  static async updateGroupLastActive(groupId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        last_active: new Date(), // Set last_active to the current date and time
      });
    } catch (error) {
      console.error("Error updating group last_active:", error);
      throw error;
    }
  }

}

export default GroupService;