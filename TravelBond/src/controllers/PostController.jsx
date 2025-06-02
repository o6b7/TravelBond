import { db, storage } from "../utils/firebaseConfig";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs,
  arrayUnion,
  arrayRemove,
  query,
  where
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import PostModel from "../models/PostModel";
import IdGenerator from "../utils/IdGenerator";

class PostController {
  /**
   * Fetch all posts from Firestore
   * @returns {Promise<PostModel[]>} Array of PostModel instances
   */
  static async fetchAllPosts() {
    try {
      const postsCollection = collection(db, "posts");
      const snapshot = await getDocs(postsCollection);
      return snapshot.docs.map(doc => new PostModel({ postId: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }

  /**
   * Fetch posts by a specific user
   * @param {string} userId - The user ID to filter posts by
   * @returns {Promise<PostModel[]>} Array of PostModel instances
   */
  static async fetchPostsByUser(userId) {
    try {
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => new PostModel({ postId: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching user posts:", error);
      throw error;
    }
  }

  /**
   * Create a new post
   * @param {string} userId - The ID of the user creating the post
   * @param {string} content - The post content/text
   * @param {string[]} photoURLs - Array of photo URLs
   * @returns {Promise<string>} The ID of the created post
   */
  static async createPost(userId, content, photoURLs = []) {
    try {
      const postId = await IdGenerator.generateId("post");
      const postData = {
        userId,
        content,
        photos: photoURLs,
        postedAt: new Date().toISOString(),
        likedBy: [],
        comments: []
      };

      await setDoc(doc(db, "posts", postId), postData);
      return postId;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  /**
   * Update an existing post
   * @param {string} postId - The ID of the post to update
   * @param {string} content - New content for the post
   * @returns {Promise<void>}
   */
  static async updatePost(postId, content) {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, { content });
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  }

  /**
   * Delete a post and its associated photos
   * @param {string} postId - The ID of the post to delete
   * @param {string[]} photoURLs - Array of photo URLs to delete from storage
   * @returns {Promise<void>}
   */
  static async deletePost(postId, photoURLs = []) {
    try {
      // Delete photos from storage if they exist
      if (photoURLs.length > 0) {
        const deletePromises = photoURLs.map(url => {
          if (url && url.startsWith("http")) {
            try {
              // Extract path from URL (this may need adjustment based on your storage structure)
              const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
              const storageRef = ref(storage, path);
              return deleteObject(storageRef);
            } catch (error) {
              console.error("Error deleting photo:", error);
              return Promise.resolve();
            }
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
      }

      // Delete the post document
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  /**
   * Add a comment to a post
   * @param {string} postId - The ID of the post
   * @param {string} userId - The ID of the user adding the comment
   * @param {string} commentText - The comment content
   * @returns {Promise<Object>} The created comment object
   */
  static async addComment(postId, userId, commentText) {
    try {
      const commentId = await IdGenerator.generateId("comment");
      const newComment = {
        commentId,
        userId,
        comment: commentText,
        createdAt: new Date().toISOString(),
        likes: [],
        replies: {}
      };

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      return newComment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  /**
   * Add a reply to a comment
   * @param {string} postId - The ID of the post
   * @param {string} commentId - The ID of the comment being replied to
   * @param {string} userId - The ID of the user adding the reply
   * @param {string} replyText - The reply content
   * @returns {Promise<void>}
   */
  static async addReply(postId, commentId, userId, replyText) {
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }

      const replyId = await IdGenerator.generateId("reply");
      const newReply = {
        replyId,
        userId,
        reply: replyText,
        createdAt: new Date().toISOString(),
        likes: []
      };

      // Get current comments
      const comments = postDoc.data().comments || [];
      
      // Find the comment and add the reply
      const updatedComments = comments.map(comment => {
        if (comment.commentId === commentId) {
          const replies = { ...comment.replies };
          replies[replyId] = newReply;
          return { ...comment, replies };
        }
        return comment;
      });

      await updateDoc(postRef, { comments: updatedComments });
    } catch (error) {
      console.error("Error adding reply:", error);
      throw error;
    }
  }

  /**
   * Toggle a like on a post, comment, or reply
   * @param {string} postId - The ID of the post
   * @param {string} userId - The ID of the user liking/unliking
   * @param {string} [commentId] - Optional comment ID if liking a comment
   * @param {string} [replyId] - Optional reply ID if liking a reply
   * @returns {Promise<void>}
   */
  static async toggleLike(postId, userId, commentId = null, replyId = null) {
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }

      if (!commentId && !replyId) {
        // Toggle post like
        const postData = postDoc.data();
        const isLiked = postData.likedBy.includes(userId);
        
        await updateDoc(postRef, {
          likedBy: isLiked 
            ? arrayRemove(userId) 
            : arrayUnion(userId)
        });
      } else if (commentId && !replyId) {
        // Toggle comment like
        const comments = postDoc.data().comments || [];
        const updatedComments = comments.map(comment => {
          if (comment.commentId === commentId) {
            const isLiked = comment.likes.includes(userId);
            return {
              ...comment,
              likes: isLiked
                ? comment.likes.filter(id => id !== userId)
                : [...comment.likes, userId]
            };
          }
          return comment;
        });

        await updateDoc(postRef, { comments: updatedComments });
      } else if (commentId && replyId) {
        // Toggle reply like
        const comments = postDoc.data().comments || [];
        const updatedComments = comments.map(comment => {
          if (comment.commentId === commentId) {
            const replies = { ...comment.replies };
            if (replies[replyId]) {
              const isLiked = replies[replyId].likes.includes(userId);
              replies[replyId] = {
                ...replies[replyId],
                likes: isLiked
                  ? replies[replyId].likes.filter(id => id !== userId)
                  : [...replies[replyId].likes, userId]
              };
            }
            return { ...comment, replies };
          }
          return comment;
        });

        await updateDoc(postRef, { comments: updatedComments });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }

  /**
   * Report a post, comment, or reply
   * @param {string} postId - The ID of the post
   * @param {string} reporterId - The ID of the user reporting
   * @param {string} [commentId] - Optional comment ID if reporting a comment
   * @param {string} [replyId] - Optional reply ID if reporting a reply
   * @returns {Promise<void>}
   */
  static async reportContent(postId, reporterId, commentId = null, replyId = null) {
    try {
      const reportData = {
        postId,
        reporterId,
        commentId,
        replyId,
        reportedAt: new Date().toISOString(),
        status: "pending"
      };

      const reportId = await IdGenerator.generateId("report");
      await setDoc(doc(db, "reports", reportId), reportData);
    } catch (error) {
      console.error("Error reporting content:", error);
      throw error;
    }
  }

  /**
   * Delete a comment or reply
   * @param {string} postId - The ID of the post
   * @param {string} commentId - The ID of the comment
   * @param {string} [replyId] - Optional reply ID if deleting a reply
   * @returns {Promise<void>}
   */
  static async deleteComment(postId, commentId, replyId = null) {
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }

      const comments = postDoc.data().comments || [];
      let updatedComments;

      if (replyId) {
        // Delete a reply
        updatedComments = comments.map(comment => {
          if (comment.commentId === commentId) {
            const replies = { ...comment.replies };
            delete replies[replyId];
            return { ...comment, replies };
          }
          return comment;
        });
      } else {
        // Delete a comment
        updatedComments = comments.filter(comment => comment.commentId !== commentId);
      }

      await updateDoc(postRef, { comments: updatedComments });
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }

  /**
   * Fetch a single post by ID
   * @param {string} postId - The ID of the post to fetch
   * @returns {Promise<PostModel>} The post data
   */
  static async fetchPostById(postId) {
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }

      return new PostModel({ postId: postDoc.id, ...postDoc.data() });
    } catch (error) {
      console.error("Error fetching post:", error);
      throw error;
    }
  }
}

export default PostController;