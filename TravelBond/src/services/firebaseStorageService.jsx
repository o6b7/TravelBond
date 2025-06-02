import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const storage = getStorage();

/**
 * Uploads a file to Firebase Storage.
 * @param {File} file - The file to upload.
 * @param {string} path - The storage path (e.g., 'home-pictures/').
 * @returns {Promise<string>} - The download URL of the uploaded file.
 */
export const uploadFileToStorage = async (file, path) => {
  const storageRef = ref(storage, `${path}${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

/**
 * Uploads multiple files to Firebase Storage.
 * @param {File[]} files - Array of files to upload.
 * @param {string} path - The storage path (e.g., 'home-pictures/').
 * @returns {Promise<string[]>} - Array of download URLs.
 */
export const uploadFilesToStorage = async (files, path) => {
  const uploadPromises = files.map((file) => uploadFileToStorage(file, path));
  return Promise.all(uploadPromises);
};

/**
 * Deletes a file from Firebase Storage.
 * @param {string} url - The download URL of the file to delete.
 */
export const deleteFileFromStorage = async (url) => {
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
};