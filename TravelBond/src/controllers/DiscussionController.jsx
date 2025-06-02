import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import DiscussionService from "../services/DiscussionService";
import GroupService from "../services/GroupService";
import UserController from "./UserController";

export default class DiscussionController {
  // Create a new discussion
  static async createDiscussion(groupId, userId, title, content) {
    try {
      const newDiscussion = await DiscussionService.createDiscussion(groupId, userId, title, content);
      return newDiscussion;
    } catch (error) {
      console.error("Error creating discussion:", error);
      throw error;
    }
  }

  // Fetch all discussions for a specific group
  static async fetchDiscussionsByGroupId(groupId) {
    try {
      const discussions = await DiscussionService.fetchDiscussionsByGroupId(groupId);
      return discussions;
    } catch (error) {
      console.error("Error fetching discussions:", error);
      throw error;
    }
  }

  // Fetch a discussion by ID
  static async fetchDiscussionById(discussionId) {
    try {
      const discussion = await DiscussionService.fetchDiscussionById(discussionId);

      // Fetch the user details for the discussion creator
      if (discussion.userId) {
        const user = await UserController.fetchUserById(discussion.userId);
        discussion.user = user;
      }

      // Fetch user details for each reply
      if (discussion.replies && Array.isArray(discussion.replies)) {
        discussion.replies = await Promise.all(
          discussion.replies.map(async (reply) => {
            if (reply.userId) {
              const user = await UserController.fetchUserById(reply.userId);
              return { ...reply, user };
            }
            return reply;
          })
        );
      }

      return discussion;
    } catch (error) {
      console.error("Error fetching discussion:", error);
      throw error;
    }
  }

  
  // Fetch participants of a discussion
  static async fetchParticipants(groupId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        return groupData.participants || []; // Return the group's participants
      } else {
        throw new Error("Group not found");
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
      throw error;
    }
  }

  // Add a reply to a discussion
  static async addReply(discussionId, userId, replyContent) {
    try {
      const reply = await DiscussionService.addReply(discussionId, userId, replyContent);
      return reply;
    } catch (error) {
      console.error("Error adding reply:", error);
      throw error;
    }
  }

  static async deleteDiscussion(discussionId, groupId) {
    try {
      const discussionRef = doc(db, "discussions", discussionId);
      await deleteDoc(discussionRef);
      await GroupService.decrementGroupDiscussions(groupId);
      console.log(`Discussion ${discussionId} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting discussion:", error);
      throw error;
    }
  }

  static async deleteReply(discussionId, replyId) {
    try {
      const discussionRef = doc(db, "discussions", discussionId);
      const discussionDoc = await getDoc(discussionRef);

      if (!discussionDoc.exists()) {
        throw new Error("Discussion not found");
      }

      const discussionData = discussionDoc.data();
      const updatedReplies = discussionData.replies.filter(reply => reply.id !== replyId); // Filter out the reply with the matching ID

      await updateDoc(discussionRef, { replies: updatedReplies });

      console.log(`Reply ${replyId} deleted successfully from discussion ${discussionId}`);
      return updatedReplies; // Return updated replies for UI refresh
    } catch (error) {
      console.error("Error deleting reply:", error);
      throw error;
    }
  }

  
}