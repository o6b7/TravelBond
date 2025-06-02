import { db } from "../utils/firebaseConfig";
import { collection, doc, getDoc, query, where, getDocs, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import IdGenerator from "../utils/IdGenerator";
import GroupService from "./GroupService"; // Import GroupService

export default class DiscussionService {
  // Create a new discussion
  static async createDiscussion(groupId, userId, title, content) {
    try {
      const discussionId = await IdGenerator.generateId("discussion");
      const discussionData = {
        groupId,
        userId,
        title,
        content,
        createdAt: new Date(),
        replies: [],
      };

      const discussionRef = doc(db, "discussions", discussionId);
      await setDoc(discussionRef, discussionData);

      // Update the group's discussions count and last_active field
      await GroupService.incrementGroupDiscussions(groupId);
      await GroupService.updateGroupLastActive(groupId);

      return { id: discussionId, ...discussionData };
    } catch (error) {
      console.error("Error creating discussion:", error);
      throw error;
    }
  }

  // Fetch all discussions for a specific group
  static async fetchDiscussionsByGroupId(groupId) {
    try {
      const q = query(collection(db, "discussions"), where("groupId", "==", groupId));
      const querySnapshot = await getDocs(q);

      const discussions = [];
      querySnapshot.forEach((doc) => {
        const discussionData = doc.data();
        discussions.push({ id: doc.id, ...discussionData });
      });

      return discussions;
    } catch (error) {
      console.error("Error fetching discussions:", error);
      throw error;
    }
  }

  // Fetch a discussion by ID
  static async fetchDiscussionById(discussionId) {
    try {
      const discussionRef = doc(db, "discussions", discussionId);
      const discussionDoc = await getDoc(discussionRef);
      if (discussionDoc.exists()) {
        const discussionData = discussionDoc.data();

        // Ensure replies is an array
        if (!Array.isArray(discussionData.replies)) {
          discussionData.replies = [];
        }

        return discussionData;
      } else {
        throw new Error("Discussion not found");
      }
    } catch (error) {
      console.error("Error fetching discussion:", error);
      throw error;
    }
  }

  // Add a reply to a discussion
  static async addReply(discussionId, userId, replyContent) {
    try {
      // Generate a unique reply ID
      const replyId = await IdGenerator.generateId("reply");

      const reply = {
        id: replyId, // Ensure the reply has a unique ID
        userId,
        content: replyContent,
        createdAt: new Date(),
      };

      const discussionRef = doc(db, "discussions", discussionId);
      await updateDoc(discussionRef, {
        replies: arrayUnion(reply), // Add the reply to the replies array
      });

      return reply;
    } catch (error) {
      console.error("Error adding reply:", error);
      throw error;
    }
  }



}