export default class Helpers {
    static formatDate(timestamp) {
      if (!timestamp) {
        return "N/A"; 
      }
  
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
      if (isNaN(date.getTime())) {
        return "N/A"; 
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