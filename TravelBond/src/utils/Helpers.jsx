export default class Helpers {
    static formatDate(timestamp) {
      // Handle null or undefined timestamp
      if (!timestamp) {
        return "N/A"; // Return "N/A" if timestamp is null or undefined
      }
  
      // Convert Firestore Timestamp to Date if necessary
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "N/A"; // Return "N/A" if the date is invalid
      }
  
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
  
      if (diffInSeconds < 60) {
        return `${diffInSeconds}s ago`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
      } else if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks}w ago`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months}mo ago`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years}y ago`;
      }
    }
  }