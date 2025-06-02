class ReportModel {
    constructor(data) {
      this.id = data.id || "";
      this.createdAt = data.createdAt || new Date().toISOString();
      this.reason = data.reason || "";
      this.reportedId = this.normalizeReportedId(data.reportedId || [], data.contentType);
      this.reporterId = data.reporterId || "";
      this.status = data.status || "pending";
      this.note = data.note || "";
      this.contentType = data.contentType || this.determineContentType(data);
    }
  
    normalizeReportedId(reportedId, contentType) {
      // For events, we only want the event ID as the first element
      if (contentType === 'event') {
        return reportedId.length > 0 ? [reportedId[0]] : [];
      }
      return reportedId;
    }
  
    determineContentType(data) {
      if (data.contentType) return data.contentType;
      
      const [firstId, secondId, thirdId] = data.reportedId || [];
      
      if (firstId?.startsWith('G')) {
        if (secondId?.startsWith('D')) {
          return thirdId?.startsWith('RE') ? 'reply' : 'discussion';
        }
        return 'group';
      } else if (firstId?.startsWith('E')) {
        // Event reports should only have event ID
        return 'event';
      } else if (firstId?.startsWith('P')) {
        if (secondId?.startsWith('C')) {
          return thirdId?.startsWith('RE') ? 'reply' : 'comment';
        }
        return 'post';
      }
      return 'unknown';
    }
  
    toFirestore() {
      return {
        id: this.id,
        createdAt: this.createdAt,
        reason: this.reason,
        reportedId: this.reportedId,
        reporterId: this.reporterId,
        status: this.status,
        note: this.note,
        contentType: this.contentType
      };
    }
  }
  
  export default ReportModel;