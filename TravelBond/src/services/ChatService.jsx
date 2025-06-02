import { db } from "../utils/firebaseConfig";
import { 
  collection, doc, setDoc, getDoc, getDocs, 
  addDoc, updateDoc, query, where, orderBy, 
  onSnapshot, serverTimestamp, arrayUnion 
} from "firebase/firestore";
import ConversationModel from "../models/chat/ConversationModel";
import MessageModel from "../models/chat/MessageModel";
import IdGenerator from "../utils/IdGenerator";

class ChatService {
  /**
   * Get or create a conversation between two users
   * @param {string} userId1 
   * @param {string} userId2 
   * @returns {Promise<ConversationModel>}
   */
  static async getOrCreateConversation(userId1, userId2) {
    try {
      // Check if conversation already exists
      const conversationsRef = collection(db, "conversations");
      const q = query(
        conversationsRef,
        where("participants", "array-contains", userId1)
      );
      
      const querySnapshot = await getDocs(q);
      let existingConversation = null;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(userId2)) {
          existingConversation = new ConversationModel({ id: doc.id, ...data });
        }
      });
      
      if (existingConversation) return existingConversation;
      
      // Create new conversation
      const conversationId = await IdGenerator.generateId("conv");
      const newConversation = new ConversationModel({
        id: conversationId,
        participants: [userId1, userId2],
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        },
        createdAt: serverTimestamp()
      });
      
      await setDoc(doc(db, "conversations", conversationId), newConversation.toFirestore());
      return newConversation;
      
    } catch (error) {
      console.error("Error in getOrCreateConversation:", error);
      throw new Error("Failed to create conversation. Please check your permissions.");
    }
  }

  /**
   * Send a message in a conversation
   * @param {string} conversationId 
   * @param {string} senderId 
   * @param {string} content 
   * @returns {Promise<MessageModel>}
   */
  static async sendMessage(conversationId, senderId, content) {
    try {
      // Add message to messages subcollection
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      const newMessage = new MessageModel({
        senderId,
        content,
        read: false
      });
      
      const messageRef = await addDoc(messagesRef, newMessage.toFirestore());
      
      // Update conversation last message and timestamp
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        lastMessage: content.length > 30 ? content.substring(0, 30) + "..." : content,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${senderId}`]: 0 // Reset sender's unread count
      });
      
      // Increment unread count for other participants
      const conversationDoc = await getDoc(conversationRef);
      const conversationData = conversationDoc.data();
      
      const otherParticipants = conversationData.participants.filter(id => id !== senderId);
      for (const participantId of otherParticipants) {
        await updateDoc(conversationRef, {
          [`unreadCount.${participantId}`]: (conversationData.unreadCount[participantId] || 0) + 1
        });
      }
      
      return new MessageModel({ id: messageRef.id, ...newMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   * @param {string} userId 
   * @returns {Promise<ConversationModel[]>}
   */
  static async getUserConversations(userId) {
    try {
      const conversationsRef = collection(db, "conversations");
      const q = query(
        conversationsRef,
        where("participants", "array-contains", userId),
        orderBy("lastMessageAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = [];
      
      querySnapshot.forEach(doc => {
        conversations.push(new ConversationModel({ id: doc.id, ...doc.data() }));
      });
      
      return conversations;
    } catch (error) {
      console.error("Error getting user conversations:", error);
      throw error;
    }
  }

  /**
   * Get messages in a conversation
   * @param {string} conversationId 
   * @param {number} limit 
   * @returns {Promise<MessageModel[]>}
   */
  static async getMessages(conversationId, limit = 50) {
    try {
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      const q = query(
        messagesRef,
        orderBy("timestamp", "desc"),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach(doc => {
        messages.push(new MessageModel({ id: doc.id, ...doc.data() }));
      });
      
      // Return in chronological order
      return messages.reverse();
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * @param {string} conversationId 
   * @param {string} userId 
   */
  static async markMessagesAsRead(conversationId, userId) {
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  /**
   * Subscribe to conversation updates
   * @param {string} userId 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  static subscribeToConversations(userId, callback) {
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId),
      orderBy("lastMessageAt", "desc")
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const conversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to Date
        lastMessageAt: doc.data().lastMessageAt?.toDate()
      }));
      callback(conversations);
    });
  }

  /**
   * Subscribe to message updates in a conversation
   * @param {string} conversationId 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  static subscribeToMessages(conversationId, callback) {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach(doc => {
        messages.push(new MessageModel({ id: doc.id, ...doc.data() }));
      });
      callback(messages);
    });
    
    return unsubscribe;
  }
}

export default ChatService;