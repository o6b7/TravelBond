import { db } from "../utils/firebaseConfig";
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove, writeBatch } from "firebase/firestore";
import UserModel from "../models/UserModel";
import IdGenerator from "../utils/IdGenerator"; 

class UserService {

  /**
   * Fetch user by ID from Firestore.
   * @param {string} userId - The ID of the user to fetch.
   * @returns {Promise<UserModel>}
   */
  static async fetchUserById(userId) {
    if (!userId) {
      console.error("User ID is undefined or null");
      return null;
    }
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return new UserModel(userData);
      } else {
        throw new Error("User not found in Firestore.");
      }
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }
  }

  /**
 * Check if the user is an admin.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<boolean>} - Returns true if the user is an admin.
 */
  static async isAdmin(userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role === "admin";
      } else {
        console.warn(`User with ID ${userId} not found.`);
        return false;
      }
    } catch (error) {
      console.error("Error checking if user is admin:", error);
      throw error;
    }
  }


  static async deleteUser(userId) {
    try {
      // First delete the user document
      await deleteDoc(doc(db, "users", userId));
      
      // Delete related data in other collections
      const batch = writeBatch(db);
      
      // Delete user's posts
      const postsQuery = query(collection(db, "posts"), where("userId", "==", userId));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Remove user from friends lists
      const usersWithFriendQuery = query(collection(db, "users"), where("friends", "array-contains", userId));
      const usersWithFriendSnapshot = await getDocs(usersWithFriendQuery);
      usersWithFriendSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          friends: arrayRemove(userId)
        });
      });
      
      // Remove user's references from other users
      const allUsersSnapshot = await getDocs(collection(db, "users"));
      allUsersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.references) {
          const updatedReferences = userData.references.filter(
            ref => !ref.includes(userId)
          );
          if (updatedReferences.length !== userData.references.length) {
            batch.update(userDoc.ref, {
              references: updatedReferences
            });
          }
        }
      });
      
      // Delete conversations involving the user
      const convQuery = query(collection(db, "conversations"), where("participants", "array-contains", userId));
      const convSnapshot = await getDocs(convQuery);
      convSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Delete messages sent by the user
      const messagesQuery = query(collection(db, "messages"), where("senderId", "==", userId));
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error deleting user data:", error);
      throw error;
    }
  }

  /**
   * Fetch all users from Firestore
   * @returns {Promise<UserModel[]>}
   */
  static async fetchUsers() {
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);
      
      const users = [];
      querySnapshot.forEach(doc => {
        users.push(new UserModel({ id: doc.id, ...doc.data() }));
      });
      
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  /**
   * Fetch user by email from Firestore.
   * @param {string} email - The email of the user to fetch.
   * @returns {Promise<UserModel>}
   */
  static async fetchUserByEmail(email) {
    try {
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("email", "==", email));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { ...userDoc.data() };
        userData.hostAvailability = userData.guestStatus;
        return new UserModel(userData);
      }
      return null; // Return null instead of throwing error when user not found
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw error;
    }
  }

  /**
   * Update user in Firestore.
   * @param {string} userId - User ID
   * @param {Object} userData - Updated data
   * @returns {Promise<void>}
   */
  static async updateUser(userId, userData) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, userData);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }


  /**
   * Update user in Firestore.
   * @param {string} userId - User ID
   * @param {Object} userData - Updated data
   * @returns {Promise<void>}
   */
  static async updateUser(userId, userData) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, userData);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Create a new user in Firestore.
   * @param {string} email - The email of the user.
   * @param {string} name - The user's name (optional).
   * @param {string} profilePicture - The profile picture URL.
   * @param {string} authUid - The Firebase Auth UID.
   * @returns {Promise<UserModel>}
   */
  static async createUser(email, name = "", profilePicture = "none", authUid = "") {
    try {
      const userId = await IdGenerator.generateId("user");
      const newUser = new UserModel({
        id: userId,
        email,
        name,
        profilePicture,
        role: "user",
        address: "",
        guestStatus: "Maybe Accepting Guests",
        verified: false,
        bio: "",
        hostAvailability: false,
        references: [],
        reviews: [],
      });

      const userDocRef = doc(collection(db, "users"), userId);
      await setDoc(userDocRef, { ...newUser });

      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

    /**
   * Add a group ID to the user's "group" field.
   * @param {string} userId - The ID of the user.
   * @param {string} groupId - The ID of the group to add.
   * @returns {Promise<void>}
   */

    static async addGroupToUser(userId, groupId) {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          groups: arrayUnion(groupId),
        });
      } catch (error) {
        console.error("🔥 Error adding group to user:", error.message);
        throw error;
      }
    }  
  
    /**
     * Remove a group ID from the user's "group" field.
     * @param {string} userId - The ID of the user.
     * @param {string} groupId - The ID of the group to remove.
     * @returns {Promise<void>}
     */
    static async removeGroupFromUser(userId, groupId) {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          groups: arrayRemove(groupId),
        });
      } catch (error) {
        console.error("🔥 Error removing group from user:", error.message);
        throw error;
      }
    }

    static async updateLastActive(userId) {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          lastActive: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error updating last active:", error);
        throw error;
      }
    }
  
}

export default UserService;
