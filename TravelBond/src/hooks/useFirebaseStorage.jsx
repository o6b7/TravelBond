import { useState } from "react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../utils/firebaseConfig"; // Import Firebase Storage
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebaseConfig"; // Import Firestore

export const useFirebaseStorage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Uploads a single file to Firebase Storage.
   * @param {File} file - The file to upload.
   * @param {string} path - The storage path (e.g., 'home-pictures/').
   * @returns {Promise<string>} - The download URL of the uploaded file.
   */
  const uploadFile = async (file, path) => {
    setIsLoading(true);
    setError(null);
    try {
      const filePath = `${path}${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setIsLoading(false);
      return downloadURL;
    } catch (err) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Uploads multiple files to Firebase Storage.
   * @param {File[]} files - Array of files to upload.
   * @param {string} path - The storage path (e.g., 'home-pictures/').
   * @returns {Promise<string[]>} - Array of download URLs.
   */
  const uploadMultipleFiles = async (files, path) => {
    setIsLoading(true);
    setError(null);
    try {
      const downloadURLs = await Promise.all(
        files.map(async (file) => {
          const storageRef = ref(storage, `${path}/${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );
      setIsLoading(false);
      return downloadURLs;
    } catch (err) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Deletes a file from Firebase Storage.
   * @param {string} url - The download URL of the file to delete.
   */
  const deleteFile = async (url) => {
    setIsLoading(true);
    setError(null);
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
      setIsLoading(false);
    } catch (err) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  /**
   * Updates the user's home photos in Firestore.
   * @param {string} userId - The user ID.
   * @param {string[]} updatedPhotos - Array of new photo URLs.
   */
  const updateUserPhotos = async (userId, updatedPhotos) => {
    setIsLoading(true);
    setError(null);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { myHomePhotos: updatedPhotos });
      setIsLoading(false);
    } catch (err) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    updateUserPhotos, // ✅ Now available in MyHomePhotosCard.jsx
    isLoading,
    error,
  };
};
