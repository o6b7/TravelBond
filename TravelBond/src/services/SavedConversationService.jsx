import { db } from "../utils/firebaseConfig";
import { 
  collection, doc, setDoc, getDoc, getDocs, 
  query, where, orderBy, deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import ChatbotController from "../controllers/ChatbotController";
import IdGenerator from "../utils/IdGenerator";

class SavedConversationService {
  /**
   * Save a chatbot conversation
   * @param {string} userId 
   * @param {Array} messages 
   * @returns {Promise<string>} conversationId
   */
  static async saveConversation(userId, messages) {
    try {
      // Use "conversation" instead of "conv" as the type
      const conversationId = await IdGenerator.generateId("conversation");
      const conversationRef = doc(db, "savedChatbotConversations", conversationId);
      
      // Rest of your code remains the same...
      const title = await ChatbotController.generateConversationTitle(messages);
      const lastMessage = messages[messages.length - 1].content;
      
      await setDoc(conversationRef, {
        participants: [userId, "BOT"],
        createdAt: serverTimestamp(),
        lastMessage: lastMessage.length > 30 ? lastMessage.substring(0, 30) + "..." : lastMessage,
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [userId]: 0
        },
        title: title
      });
      
      // Save all messages
      const messagesRef = collection(db, "savedChatbotConversations", conversationId, "messages");
      
      for (const msg of messages) {
        const messageId = await IdGenerator.generateId("message");  // Changed from "msg" to "message"
        const messageRef = doc(messagesRef, messageId);
        
        await setDoc(messageRef, {
          id: messageId,
          content: msg.content,
          senderId: msg.sender === 'bot' ? 'BOT' : userId,
          read: true,
          timestamp: serverTimestamp()
        });
      }
      
      return conversationId;
    } catch (error) {
      console.error("Error saving conversation:", error);
      throw error;
    }
  }

  static getUserConversationsRef(userId) {
    if (!userId) throw new Error("User ID is required");
  
    return query(
      collection(db, "savedChatbotConversations"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageAt", "desc")
    );
  }
  


  /**
   * Get all saved conversations for a user
   * @param {string} userId 
   * @returns {Promise<Array>}
   */
  static async getSavedConversations(userId) {
    try {
      const q = query(
        collection(db, "savedChatbotConversations"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to Date
        createdAt: doc.data().createdAt?.toDate(),
        lastMessageAt: doc.data().lastMessageAt?.toDate()
      }));
    } catch (error) {
      console.error("Error getting saved conversations:", error);
      throw error;
    }
  }

  /**
   * Get messages for a saved conversation
   * @param {string} conversationId 
   * @returns {Promise<Array>}
   */
  static async getConversationMessages(conversationId) {
    try {
      const q = query(
        collection(db, "savedChatbotConversations", conversationId, "messages"),
        orderBy("timestamp", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sender: doc.data().senderId === 'BOT' ? 'bot' : 'user',
        // Convert Firestore timestamp to Date
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      throw error;
    }
  }

  /**
   * Get a specific conversation
   * @param {string} conversationId 
   * @returns {Promise<Object|null>}
   */
  static async getConversation(conversationId) {
    try {
      const conversationRef = doc(db, "savedChatbotConversations", conversationId);
      const docSnap = await getDoc(conversationRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        lastMessageAt: docSnap.data().lastMessageAt?.toDate()
      };
    } catch (error) {
      console.error("Error getting conversation:", error);
      throw error;
    }
  }

  /**
   * Delete a saved conversation
   * @param {string} conversationId 
   * @returns {Promise<void>}
   */
  static async deleteSavedConversation(conversationId) {
    try {
      await deleteDoc(doc(db, "savedChatbotConversations", conversationId));
    } catch (error) {
      console.error("Error deleting saved conversation:", error);
      throw error;
    }
  }
}

export default SavedConversationService;