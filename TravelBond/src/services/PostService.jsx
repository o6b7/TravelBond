import { db } from "../utils/firebaseConfig"; // Import Firestore
import { storage } from "../utils/firebaseConfig"; // Import Storage
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore"; // Firestore functions
import { ref, deleteObject } from "firebase/storage"; // Storage functions
import PostModel from "../models/PostModel";

class PostService {
  static async fetchPosts(userId) {
    try {
      const postsCollection = collection(db, "posts");
      const querySnapshot = await getDocs(postsCollection);
      const posts = [];

      querySnapshot.forEach((doc) => {
        const postData = doc.data();
        if (postData.userId === userId) {
          posts.push(new PostModel({ postId: doc.id, ...postData }));
        }
      });

      return posts;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }
  

  static async createPost(postId, userId, content, photos = []) {
    try {
      const postData = {
        userId,
        content,
        photos,
        postedAt: new Date().toISOString(),
        likedBy: [],
        comments: [],
      };

      // Create the post with the given postId as the document ID
      const postRef = doc(db, "posts", postId);
      await setDoc(postRef, postData);
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  static async toggleLike(postId, userId) {
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }

      const postData = postDoc.data();
      const isLiked = postData.likedBy?.includes(userId) || false;

      // Update the post's likedBy array
      await updateDoc(postRef, {
        likedBy: isLiked 
          ? arrayRemove(userId) 
          : arrayUnion(userId)
      });

      // Return the updated post
      const updatedPostDoc = await getDoc(postRef);
      return new PostModel({
        postId: updatedPostDoc.id,
        ...updatedPostDoc.data()
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }



  static async updatePost(postId, content) {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { content });
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  }

  static async deletePost(postId, photos = []) {
    try {
      // Step 1: Delete photos from Firebase Storage
      if (photos.length > 0) {
        const deletePhotoPromises = photos.map(async (photoUrl) => {
          try {
            // Extract the file path from the photo URL
            const decodedUrl = decodeURIComponent(photoUrl);
            const filePath = decodedUrl.split("post-media%2F")[1].split("?")[0];
            const photoRef = ref(storage, `post-media/${filePath}`);
            await deleteObject(photoRef);
          } catch (error) {
            console.error("Error deleting photo:", error);
            // Continue even if one photo fails to delete
          }
        });

        // Wait for all photo deletions to complete
        await Promise.all(deletePhotoPromises);
      }

      // Step 2: Delete the post from Firestore
      const postRef = doc(db, "posts", postId);
      await deleteDoc(postRef);
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  static async deleteComment(postId, commentIndex) {
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) throw new Error("Post not found");

      const comments = postDoc.data().comments;
      comments.splice(commentIndex, 1); // Remove the comment

      await updateDoc(postRef, { comments }); // Update Firestore
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }
}

export default PostService;