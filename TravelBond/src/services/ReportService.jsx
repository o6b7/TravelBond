import { db } from "../utils/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  getDoc,
  updateDoc, 
  writeBatch
} from "firebase/firestore";
import ReportModel from "../models/ReportModel";
import IdGenerator from "../utils/IdGenerator";

class ReportService {
  static async createReport(reportData) {
    try {
      // Generate report ID
      const reportId = await IdGenerator.generateId('report');
      
      // Create a document reference with the generated ID
      const reportRef = doc(db, "reports", reportId);
      
      // Create the report model with the generated ID
      const report = new ReportModel({
        ...reportData,
        id: reportId
      });
      
      // Set the document with the generated ID
      await setDoc(reportRef, report.toFirestore());
      
      return { id: reportId, ...report.toFirestore() };
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  }

  static async fetchAllReports() {
    try {
      const reportsCollection = collection(db, "reports");
      const reportSnapshot = await getDocs(reportsCollection);
      
      const reports = [];
      const batch = writeBatch(db);
      
      for (const doc of reportSnapshot.docs) {
        const report = new ReportModel({ id: doc.id, ...doc.data() });
        
        // Check if reported content still exists
        const contentExists = await this.checkReportedContentExists(report);
        
        if (contentExists) {
          reports.push(report);
        } else {
          // Delete report if content doesn't exist
          batch.delete(doc.ref);
        }
      }
      
      // Commit any deletions if needed
      if (batch._mutations.length > 0) {
        await batch.commit();
      }
      
      return reports;
    } catch (error) {
      console.error("Error fetching reports:", error);
      throw error;
    }
  }


  static async fetchFilteredReports({ status, contentType, startDate, endDate }) {
    try {
      const reportsRef = collection(db, "reports");
      let q = reportsRef;
      const conditions = [];

      if (status) {
        conditions.push(where("status", "==", status));
      }
      if (contentType) {
        conditions.push(where("contentType", "==", contentType));
      }

      if (conditions.length > 0) {
        q = query(reportsRef, ...conditions);
      }

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let validReports = [];

      for (const doc of snapshot.docs) {
        const report = new ReportModel({ id: doc.id, ...doc.data() });
        
        // Check if reported content still exists
        const contentExists = await this.checkReportedContentExists(report);
        
        if (contentExists) {
          // Apply date filtering if needed
          const reportDate = new Date(report.createdAt);
          const dateValid = (!startDate || !endDate) || 
                           (reportDate >= startDate && reportDate <= endDate);
          
          if (dateValid) {
            validReports.push(report);
          }
        } else {
          // Delete report if content doesn't exist
          batch.delete(doc.ref);
        }
      }

      // Commit any deletions if needed
      if (batch._mutations.length > 0) {
        await batch.commit();
      }

      return validReports;
    } catch (error) {
      console.error("Error fetching filtered reports:", error);
      throw error;
    }
  }

  static async checkReportedContentExists(report) {
    try {
      const { contentType, reportedId } = report;
      
      if (!reportedId || reportedId.length === 0) {
        return false;
      }

      // For simple content types (events, groups, posts)
      if (['event', 'group', 'post'].includes(contentType)) {
        const collectionPath = contentType === 'event' ? 'events' : 
                            contentType === 'group' ? 'groups' : 'posts';
        const docRef = doc(db, collectionPath, reportedId[0]);
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
      }

      // For more complex content types
      switch (contentType) {
        case 'comment':
          return this.checkPostCommentExists(reportedId[0], reportedId[1]);
        case 'reply':
          // Determine if it's a reply to a post comment or discussion reply
          if (reportedId[0].startsWith('P')) {
            return this.checkPostCommentReplyExists(reportedId[0], reportedId[1], reportedId[2]);
          } else if (reportedId[0].startsWith('G')) {
            return this.checkDiscussionReplyExists(reportedId[0], reportedId[1], reportedId[2]);
          }
          return false;
        case 'discussion':
          return this.checkGroupDiscussionExists(reportedId[0], reportedId[1]);
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking reported content:", error);
      return false;
    }
  }

  static async checkPostCommentExists(postId, commentId) {
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) return false;
      
      const postData = postSnap.data();
      return postData.comments?.some(c => c.commentId === commentId) || false;
    } catch (error) {
      console.error("Error checking post comment:", error);
      return false;
    }
  }


  static async checkPostCommentReplyExists(postId, commentId, replyId) {
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) return false;
      
      const postData = postSnap.data();
      
      const comment = postData.comments?.find(c => c.commentId === commentId);
      if (!comment) return false;
      
      return comment.replies && comment.replies[replyId] !== undefined;
    } catch (error) {
      console.error("Error checking post comment reply:", error);
      return false;
    }
  }


  static async checkGroupDiscussionExists(groupId, discussionId) {
    try {
      const discussionRef = doc(db, 'discussions', discussionId);
      const discussionSnap = await getDoc(discussionRef);
      
      if (!discussionSnap.exists()) return false;
      
      const discussionData = discussionSnap.data();
      return discussionData.groupId === groupId;
    } catch (error) {
      console.error("Error checking group discussion:", error);
      return false;
    }
  }


  static async checkDiscussionReplyExists(groupId, discussionId, replyId) {
    try {
      const discussionExists = await this.checkGroupDiscussionExists(groupId, discussionId);
      if (!discussionExists) return false;
      
      const discussionRef = doc(db, 'discussions', discussionId);
      const discussionSnap = await getDoc(discussionRef);
      
      if (!discussionSnap.exists()) return false;
      
      const discussionData = discussionSnap.data();
      return discussionData.replies?.some(r => r.id === replyId) || false;
    } catch (error) {
      console.error("Error checking discussion reply:", error);
      return false;
    }
  }

  
  static async updateReportStatus(reportId, status, note) {
    try {
      let reportRef = doc(db, "reports", reportId);
      let reportSnap = await getDoc(reportRef);
      
      if (!reportSnap.exists()) {
        const altFormats = [
          reportId.padStart(7, '0'),
          reportId.replace('REP', 'REP-'),
          reportId.replace(/^REP/, 'REP-'),
          reportId.replace(/^REP-/, 'REP')
        ];
        
        // Try each alternative format
        for (const altId of altFormats) {
          if (altId === reportId) continue;
          
          reportRef = doc(db, "reports", altId);
          reportSnap = await getDoc(reportRef);
          
          if (reportSnap.exists()) {
            break;
          }
        }
        
        if (!reportSnap.exists()) {
          throw new Error(`Report ${reportId} not found (tried multiple formats)`);
        }
      }
      
      await updateDoc(reportRef, { 
        status, 
        note,
        updatedAt: new Date().toISOString() 
      });
      
      return { id: reportSnap.id, ...reportSnap.data() };
    } catch (error) {
      console.error(`Error updating report ${reportId}:`, error);
      throw error;
    }
  }
}

export default ReportService;