import { db } from "../utils/firebaseConfig";
import { 
  doc, deleteDoc, getDoc, collection, updateDoc, getDocs, 
  query, where, arrayUnion, arrayRemove, writeBatch 
} from "firebase/firestore";
import UserService from "../services/UserService";
import UserModel from "../models/UserModel";
import { auth, RecaptchaVerifier } from "../utils/firebaseConfig";
import { signInWithPhoneNumber, signInWithCredential, PhoneAuthProvider } from "firebase/auth";


class UserController {
  /**
   * Fetch user by email.
   * @param {string} email - The email of the user to fetch.
   * @returns {Promise<UserModel>}
   */
  static async fetchUserByEmail(email) {
    try {
      const user = await UserService.fetchUserByEmail(email);
      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw error;
    }
  }

  static async updateLastActive(userId) {
    try {
      await UserService.updateLastActive(userId);
    } catch (error) {
      console.error("Error updating last active:", error);
      throw error;
    }
  }
  
  /**
   * Start phone number verification process
   * @param {string} phoneNumber - The phone number to verify
   * @param {string} recaptchaContainerId - ID of recaptcha container
   * @returns {Promise<string>} verificationId
   */
  static async startPhoneVerification(phoneNumber, recaptchaContainerId) {
    try {
      console.log("Starting phone verification for:", phoneNumber);
      
      // Clear any existing recaptcha verifier
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
  
      // Create new invisible recaptcha verifier
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        recaptchaContainerId,
        {
          size: 'invisible',  // Make it invisible
          callback: (response) => {
            console.log("reCAPTCHA solved automatically:", response);
          }
        }
      );
  
      const verifier = window.recaptchaVerifier;
      
      // Format phone number (ensure it starts with +)
      const formattedPhoneNumber = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+${phoneNumber}`;
  
      console.log("Sending verification to:", formattedPhoneNumber);
      
      // Send verification code (this will automatically handle the invisible recaptcha)
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        verifier
      );
  
      console.log("Verification sent successfully");
      return confirmationResult.verificationId;
    } catch (error) {
      console.error("Error in startPhoneVerification:", error);
      throw error;
    }
  }

  static async deleteUser(userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        throw new Error("Firestore user document not found");
      }

      // First batch - updates
      const updateBatch = writeBatch(db);
      
      // 1. Remove user from other users' friends
      const usersQuery = query(collection(db, "users"), where("friends", "array-contains", userId));
      const usersSnapshot = await getDocs(usersQuery);
      usersSnapshot.forEach((docSnap) => {
        updateBatch.update(docSnap.ref, {
          friends: arrayRemove(userId)
        });
      });

      // 2. Remove user from groups
      const groupsQuery = query(collection(db, "groups"), where("participants", "array-contains", userId));
      const groupsSnapshot = await getDocs(groupsQuery);
      groupsSnapshot.forEach((groupDoc) => {
        updateBatch.update(groupDoc.ref, {
          participants: arrayRemove(userId),
          sub_moderators: arrayRemove(userId),
          members: (groupDoc.data().members || 1) - 1
        });
      });

      // 3. Remove user from events (non-organizer)
      const eventsQuery = query(collection(db, "events"), where("participants", "array-contains", userId));
      const eventsSnapshot = await getDocs(eventsQuery);
      eventsSnapshot.forEach((eventDoc) => {
        const eventData = eventDoc.data();
        if (eventData.organizerId !== userId) {
          updateBatch.update(eventDoc.ref, {
            participants: arrayRemove(userId)
          });
        }
      });

      // Commit update batch first
      await updateBatch.commit();

      // Second batch - deletions
      const deleteBatch = writeBatch(db);

      // 1. Delete user document
      deleteBatch.delete(doc(db, "users", userId));

      // 2. Delete user's posts
      const postsQuery = query(collection(db, "posts"), where("userId", "==", userId));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((postDoc) => {
        deleteBatch.delete(postDoc.ref);
      });

      // 3. Delete organizer events
      const organizerEventsQuery = query(collection(db, "events"), where("organizerId", "==", userId));
      const organizerEventsSnapshot = await getDocs(organizerEventsQuery);
      organizerEventsSnapshot.forEach((eventDoc) => {
        deleteBatch.delete(eventDoc.ref);
      });

      // 4. Delete conversations
      const convQuery = query(collection(db, "conversations"), where("participants", "array-contains", userId));
      const convSnapshot = await getDocs(convQuery);
      convSnapshot.forEach((convDoc) => {
        deleteBatch.delete(convDoc.ref);
      });

      // 5. Delete messages
      const messagesQuery = query(collection(db, "messages"), where("senderId", "==", userId));
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach((msgDoc) => {
        deleteBatch.delete(msgDoc.ref);
      });

      // 6. Delete reports
      const reportsQuery = query(collection(db, "reports"), where("reporterId", "==", userId));
      const reportsSnapshot = await getDocs(reportsQuery);
      reportsSnapshot.forEach((reportDoc) => {
        deleteBatch.delete(reportDoc.ref);
      });

      // Commit delete batch
      await deleteBatch.commit();

      return true;
    } catch (error) {
      console.error("Error in deleteUser:", error);
      throw error;
    }
  }
  
  
  
  /**
   * Complete phone verification with OTP
   * @param {string} verificationId 
   * @param {string} otp 
   * @returns {Promise<boolean>} true if verification successful
   */
  static async completePhoneVerification(verificationId, otp) {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      return !!userCredential.user;
    } catch (error) {
      console.error("Error in completePhoneVerification:", error);
      throw error;
    }
  }

  /**
   * Update user's phone number (only if verified)
   * @param {string} userId 
   * @param {string} phoneNumber 
   * @param {boolean} verified 
   * @returns {Promise<void>}
   */
  static async updatePhoneNumber(userId, phoneNumber, verified = false) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        phoneNumber: [phoneNumber, verified],
        verified: verified // Also update the top-level verified field
      });
    } catch (error) {
      console.error("Error updating phone number:", error);
      throw error;
    }
  }
  
  static async removeReference(userId, reference) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        references: arrayRemove(reference)
      });
    } catch (error) {
      console.error("Error removing reference:", error);
      throw error;
    }
  }  
  
  /**
   * Fetch user by ID.
   * @param {string} userId - The ID of the user to fetch.
   * @returns {Promise<UserModel>}
   */
  static async fetchUserById(userId) {
    try {
      if (!userId || typeof userId !== 'string') {
        return {
          id: 'unknown-user',
          name: "Unknown User",
          email: "unknown@example.com",
          profilePicture: "none",
          address: "",
          verified: false,
          references: [],
          friends: [],
          DOB: null,
          education: [],
          languages: [],
          hometown: "",
          accommodationType: "",
          occupation: "",
          guestStatus: "Maybe Accepting Guests",
          bio: "",
          myHomePhotos: [],
          myHomeDescription: "",
          role: "user", // Default role for unknown users
          hostAvailability: "Maybe Accepting Guests",
          lastActive: null,
          groups: [],
          travelPreferences: [],
          responseRate: 0
        };
      }

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return {
          id: userId,
          name: "Unknown User",
          email: "unknown@example.com",
          profilePicture: "none",
          address: "",
          verified: false,
          references: [],
          friends: [],
          DOB: null,
          education: [],
          languages: [],
          hometown: "",
          accommodationType: "",
          occupation: "",
          guestStatus: "Maybe Accepting Guests",
          bio: "",
          myHomePhotos: [],
          myHomeDescription: "",
          role: "user", // Default role for non-existent users
          hostAvailability: "Maybe Accepting Guests",
          lastActive: null,
          groups: [],
          travelPreferences: [],
          responseRate: 0
        };
      }

      const data = userDoc.data();
      return {
        id: userDoc.id,
        name: data.name || "Unknown User",
        email: data.email || "unknown@example.com",
        profilePicture: data.profilePicture || "none",
        address: data.address || "",
        verified: data.verified || false,
        references: data.references || [],
        friends: data.friends || [],
        DOB: data.DOB || null,
        education: data.education || [],
        languages: data.languages || [],
        hometown: data.hometown || "",
        accommodationType: data.accommodationType || "",
        occupation: data.occupation || "",
        guestStatus: data.guestStatus || "Maybe Accepting Guests",
        bio: data.bio || "",
        hostAvailability: data.hostAvailability || data.guestStatus || "Maybe Accepting Guests",
        myHomePhotos: data.myHomePhotos || [],
        myHomeDescription: data.myHomeDescription || "",
        role: data.role || "user", // Proper role handling with default
        lastActive: data.lastActive || null,
        groups: data.groups || [],
        travelPreferences: data.travelPreferences || [],
        responseRate: data.responseRate || 0
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      return {
        id: userId || 'unknown-user',
        name: "Unknown User",
        email: "unknown@example.com",
        profilePicture: "none",
        address: "",
        verified: false,
        references: [],
        friends: [],
        DOB: null,
        education: [],
        languages: [],
        hometown: "",
        accommodationType: "",
        occupation: "",
        guestStatus: "Maybe Accepting Guests",
        bio: "",
        myHomePhotos: [],
        myHomeDescription: "",
        role: "user", // Default role on error
        hostAvailability: "Maybe Accepting Guests",
        lastActive: null,
        groups: [],
        travelPreferences: [],
        responseRate: 0
      };
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
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.name || "Unknown User",
          email: data.email || "unknown@example.com",
          profilePicture: data.profilePicture || "none",
          address: data.address || "Location Unknown",
          verified: data.verified || false,
          references: data.references || [],
          friends: data.friends || [],
          lastActive: data.lastActive || null,
          languages: data.languages || [],
          hostAvailability: data.hostAvailability || "MAYBE ACCEPTING GUESTS"
        });
      });
      
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }
  

  static async fetchUserByIdOrEmail(identifier) {
    try {
      // Fetch user by ID
      const userById = await UserController.fetchUserById(identifier);
      if (userById) return userById;
  
      // Fetch user by email
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(query(usersCollection, where("email", "==", identifier)));
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data(),
        };
      }
  
      return null;
    } catch (error) {
      console.error("Error fetching user by ID or email:", error);
      throw error;
    }
  }

  /**
   * Create a new user.
   * @param {string} email - The email of the user.
   * @param {string} name - The user's name (optional).
   * @param {string} profileImage - The profile picture URL (optional).
   * @param {string} authUid - The Firebase Auth UID (optional).
   * @returns {Promise<UserModel>}
   */
  static async createUser(email, name = "", profileImage = "none", authUid = "") {
    try {
      const user = await UserService.createUser(email, name, profileImage);
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update user data.
   * @param {string} userId - The ID of the user to update.
   * @param {Object} userData - The updated user data.
   * @returns {Promise<void>}
   */
  static async updateUser(userId, updateData) {
    try {
      await updateDoc(doc(db, "users", userId), updateData);
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Handle user login.
   * @param {string} email - The email of the user.
   * @param {string} password - The password of the user.
   * @param {Function} navigate - Function to navigate to another route.
   * @param {Function} showAlert - Function to show alerts.
   * @returns {Promise<void>}
   */
  static async handleLogin(email, password, navigate, showAlert) {
    try {
      const userCredential = await UserService.login(email, password);
      const user = userCredential.user;

      const userData = await this.fetchUserByEmail(user.email);

      if (userData) {
        localStorage.setItem("userId", userData.id);
        localStorage.setItem("userData", JSON.stringify(userData));

        showAlert("Success!", "Logged in successfully!", "success", "OK");
        navigate("/dashboard");
      } else {
        throw new Error("User data could not be retrieved.");
      }
    } catch (error) {
      showAlert("Login Failed", error.message || "Invalid email or password. Please try again.", "error", "Retry");
    }
  }

  /**
   * Handle user registration.
   * @param {string} email - The email of the user.
   * @param {string} password - The password of the user.
   * @param {Function} navigate - Function to navigate to another route.
   * @param {Function} showAlert - Function to show alerts.
   * @returns {Promise<void>}
   */
  static async handleRegister(email, password, navigate, showAlert) {
    try {
      const userCredential = await UserService.register(email, password);
      const user = userCredential.user;

      // Step 1: Create the user in Firestore using IdGenerator
      const userData = await this.createUser(user.email, user.displayName || "", user.photoURL);

      if (userData) {
        // Step 2: Set userId and userData in localStorage
        localStorage.setItem("userId", userData.id);
        localStorage.setItem("userData", JSON.stringify(userData));

        // Step 3: Show success message
        showAlert("Success!", "Account created successfully!", "success", "OK");
        navigate("/dashboard");
      } else {
        throw new Error("User data could not be retrieved.");
      }
    } catch (error) {
      showAlert("Registration Failed", error.message || "Could not create an account. Please try again.", "error", "Retry");
    }
  }

  /**
   * Update friend requests for a user
   * @param {string} userId - The ID of the user to update
   * @param {string} requesterId - The ID of the user sending the request
   * @param {boolean} isAdding - Whether to add or remove the request
   * @returns {Promise<void>}
   */
  static async updateUserFriends(userId, friendId, isAdding) {
    try {
      const userRef = doc(db, "users", userId);
      
      if (isAdding) {
        await updateDoc(userRef, {
          friends: arrayUnion(friendId)
        });
      } else {
        await updateDoc(userRef, {
          friends: arrayRemove(friendId)
        });
      }
    } catch (error) {
      console.error("Error updating user friends:", error);
      throw error;
    }
  }  

  static async addReference(userId, reference) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        references: arrayUnion(reference)
      });
    } catch (error) {
      console.error("Error adding reference:", error);
      throw error;
    }
  }
  
}

export default UserController;