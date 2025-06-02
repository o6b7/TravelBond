import { db } from "../utils/firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import EventModel from "../models/EventModel";
import IdGenerator from "../utils/IdGenerator";

class EventController {
  /**
   * Fetch an event by its ID.
   * @param {string} eventId - The ID of the event.
   * @returns {Promise<EventModel>} - The event data.
   */
  static async fetchEventById(eventId) {
    try {
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found.");
      }

      return new EventModel({ id: eventDoc.id, ...eventDoc.data() });
    } catch (error) {
      console.error("Error fetching event:", error);
      throw error;
    }
  }

  /**
   * Add a comment to an event.
   * @param {string} eventId - The ID of the event.
   * @param {string} userId - The ID of the user adding the comment.
   * @param {string} comment - The comment content.
   * @returns {Promise<Object>} - The added comment.
   */
  static async addComment(eventId, userId, comment) {
    try {
      console.log("Generating comment ID..."); // Debugging
      const commentId = await IdGenerator.generateId("comment");
      console.log("Generated comment ID:", commentId); // Debugging

      const newComment = {
        commentId,
        userId,
        comment,
        createdAt: new Date().toISOString(),
        likes: [], // Initialize likes as an empty array
        replies: {}, // Initialize replies as an empty object
      };

      console.log("New comment object:", newComment); // Debugging

      const eventRef = doc(db, "events", eventId);
      console.log("Updating Firestore document..."); // Debugging
      await updateDoc(eventRef, {
        comments: arrayUnion(newComment),
      });
      console.log("Firestore document updated successfully"); // Debugging

      return newComment;
    } catch (error) {
      console.error("Error adding comment:", error); // Debugging
      throw error;
    }
  }

  /**
   * Add a reply to a comment.
   * @param {string} eventId - The ID of the event.
   * @param {string} commentId - The ID of the comment being replied to.
   * @param {string} userId - The ID of the user replying.
   * @param {string} reply - The reply content.
   * @returns {Promise<void>}
   */
  static async addReply(eventId, commentId, userId, reply) {
    try {
      console.log("Adding reply to comment:", commentId); // Debugging
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);
  
      if (!eventDoc.exists()) {
        throw new Error("Event not found.");
      }
  
      const comments = eventDoc.data().comments;
      console.log("Existing comments:", comments); // Debugging
  
      // Generate a unique replyId
      const replyId = await IdGenerator.generateId("reply");
      const newReply = {
        replyId,
        userId,
        reply, // Ensure this matches the Firestore structure
        createdAt: new Date().toISOString(),
        likes: [],
      };
  
      console.log("New reply object:", newReply); // Debugging
  
      // Update the comments array with the new reply
      const updatedComments = comments.map((comment) => {
        if (comment.commentId === commentId) {
          // Ensure replies is treated as an object
          const replies = comment.replies || {}; // Initialize as an empty object if replies is undefined
          replies[replyId] = newReply; // Add the new reply to the replies object
  
          return {
            ...comment,
            replies, // Updated replies object
          };
        }
        return comment;
      });
  
      console.log("Updated comments with new reply:", updatedComments); // Debugging
  
      // Update Firestore with the updated comments array
      await updateDoc(eventRef, {
        comments: updatedComments,
      });
  
      console.log("Firestore document updated with new reply"); // Debugging
    } catch (error) {
      console.error("Error adding reply:", error.message, error.stack); // Log full error
      throw error;
    }
  }

  /**
   * Like or unlike a comment or reply.
   * @param {string} eventId - The ID of the event.
   * @param {string} commentId - The ID of the comment.
   * @param {string} userId - The ID of the user liking/unliking.
   * @param {string} [replyId] - The ID of the reply (optional).
   * @returns {Promise<void>}
   */
  static async toggleLike(eventId, commentId, userId, replyId) {
    try {
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);
  
      if (!eventDoc.exists()) {
        throw new Error("Event not found.");
      }
  
      const comments = eventDoc.data().comments;
  
      // Update the comments array with the new like
      const updatedComments = comments.map((comment) => {
        if (comment.commentId === commentId) {
          if (replyId) {
            // Handle reply likes
            const replies = comment.replies || {};
            const updatedReplies = Object.keys(replies).reduce((acc, key) => {
              const reply = replies[key];
              if (reply.replyId === replyId) {
                const isLiked = reply.likes.includes(userId);
                acc[key] = {
                  ...reply,
                  likes: isLiked
                    ? reply.likes.filter((id) => id !== userId) // Remove like
                    : [...reply.likes, userId], // Add like
                };
              } else {
                acc[key] = reply;
              }
              return acc;
            }, {});
  
            return {
              ...comment,
              replies: updatedReplies,
            };
          } else {
            // Handle comment likes
            const isLiked = comment.likes.includes(userId);
            return {
              ...comment,
              likes: isLiked
                ? comment.likes.filter((id) => id !== userId) // Remove like
                : [...comment.likes, userId], // Add like
            };
          }
        }
        return comment;
      });
  
      // Update Firestore with the updated comments array
      await updateDoc(eventRef, {
        comments: updatedComments,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }

  /**
   * Report a comment or reply.
   * @param {string} eventId - The ID of the event.
   * @param {string} commentId - The ID of the comment.
   * @param {string} userId - The ID of the user reporting.
   * @param {string} [replyId] - The ID of the reply (optional).
   * @returns {Promise<void>}
   */
  static async reportComment(eventId, commentId, userId, replyId) {
    try {
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Event not found.");
      }

      const comments = eventDoc.data().comments;
      const comment = comments.find((c) => c.commentId === commentId);

      if (replyId) {
        const reply = comment.replies.find((r) => r.replyId === replyId);
        if (reply.userId === userId) {
          throw new Error("You cannot report your own reply.");
        }
      } else if (comment.userId === userId) {
        throw new Error("You cannot report your own comment.");
      }

      // Implement reporting logic here (e.g., send to moderation queue)
      console.log(`Comment/Reply ${replyId || commentId} reported by user ${userId}`);
    } catch (error) {
      console.error("Error reporting comment:", error);
      throw error;
    }
  }

  /**
   * Delete a comment or reply.
   * @param {string} eventId - The ID of the event.
   * @param {string} commentId - The ID of the comment.
   * @param {string} [replyId] - The ID of the reply (optional).
   * @returns {Promise<void>}
   */
  static async deleteComment(eventId, commentId, replyId) {
    try {
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);
  
      if (!eventDoc.exists()) {
        throw new Error("Event not found.");
      }
  
      const comments = eventDoc.data().comments;
      let updatedComments;
  
      if (replyId) {
        // Delete a reply
        updatedComments = comments.map((comment) => {
          if (comment.commentId === commentId) {
            const replies = comment.replies || {};
            const updatedReplies = Object.keys(replies).reduce((acc, key) => {
              if (replies[key].replyId !== replyId) {
                acc[key] = replies[key];
              }
              return acc;
            }, {});
  
            return {
              ...comment,
              replies: updatedReplies,
            };
          }
          return comment;
        });
      } else {
        // Delete a comment
        updatedComments = comments.filter((comment) => comment.commentId !== commentId);
      }
  
      // Update Firestore with the updated comments array
      await updateDoc(eventRef, {
        comments: updatedComments,
      });
    } catch (error) {
      console.error("Error deleting comment/reply:", error);
      throw error;
    }
  }

  static async deleteEvent(eventId) {
    try {
      const eventRef = doc(db, "events", eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  }

  /**
   * Fetch all events.
   * @returns {Promise<EventModel[]>} - Array of EventModel instances.
   */
  static async getEvents() {
    try {
      const eventsCollection = collection(db, "events");
      const eventSnapshot = await getDocs(eventsCollection);
      return eventSnapshot.docs.map((doc) => {
        const data = doc.data();
        return new EventModel({
          id: doc.id,
          title: data.title,
          date: data.date,
          time: data.time,
          location: data.location,
          description: data.description,
          duration: data.duration,
          organizerId: data.organizerId,
          participants: data.participants || [],
          picture: data.picture,
        });
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }
  
  static async fetchEventsByParticipant(userId) {
    try {
      const eventsCollection = collection(db, "events");
      const q = query(eventsCollection, where("participants", "array-contains", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return new EventModel({
          id: doc.id,
          ...data
        });
      });
    } catch (error) {
      console.error("Error fetching user's events:", error);
      throw error;
    }
  }

  /**
   * Create a new event.
   * @param {Object} eventData - The event data.
   * @param {string} documentId - The document ID for the event.
   * @param {Function} showAlert - Function to show alerts.
   * @returns {Promise<void>}
   */
  static async createEvent(eventData, documentId, showAlert) {
    try {
      // Validate input
      if (!eventData || !documentId) {
        throw new Error("Invalid input: eventData and documentId are required.");
      }

      // Validate required fields
      if (!eventData.title || !eventData.date || !eventData.location) {
        throw new Error("Title, date, and location are required fields.");
      }

      // Upload the picture to Firebase Storage
      const storageRef = ref(storage, `event-pictures/${eventData.picture.name}`);
      await uploadBytes(storageRef, eventData.picture);

      // Get the download URL of the uploaded picture
      const pictureUrl = await getDownloadURL(storageRef);

      // Create an instance of EventModel
      const event = new EventModel({
        id: documentId,
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        description: eventData.description,
        duration: eventData.duration,
        organizerId: eventData.organizerId,
        participants: [eventData.organizerId, ...(eventData.participants || [])], // Add organizer to participants
        picture: pictureUrl,
      });

      // Add the event data to Firestore with the generated event ID
      const eventDocRef = doc(db, "events", documentId);
      await setDoc(eventDocRef, event.toFirestore());

      // Show success alert
      showAlert("Success!", "Event created successfully!", "success", "OK");
    } catch (error) {
      console.error("Error creating event:", error);
      showAlert("Error", error.message || "Failed to create event. Please try again.", "error", "Retry");
      throw error;
    }
  }


  /**
   * Join an event.
   * @param {string} eventId - The ID of the event.
   * @param {string} userId - The ID of the user joining the event.
   * @returns {Promise<void>}
   */
  static async joinEvent(eventId, userId) {
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        participants: arrayUnion(userId),
      });
    } catch (error) {
      console.error("Error joining event:", error);
      throw error;
    }
  }

  /**
   * Leave an event.
   * @param {string} eventId - The ID of the event.
   * @param {string} userId - The ID of the user leaving the event.
   * @returns {Promise<void>}
   */
  static async leaveEvent(eventId, userId) {
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        participants: arrayRemove(userId),
      });
    } catch (error) {
      console.error("Error leaving event:", error);
      throw error;
    }
  }
}

export default EventController;