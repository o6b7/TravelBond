import ReportService from "../services/ReportService";

class ReportController {
    
  static async createReport(reportData) {
        try {
          return await ReportService.createReport(reportData);
        } catch (error) {
          console.error("Error creating report:", error);
          throw error;
        }
  }
    
  static async fetchAllReports() {
    try {
      return await ReportService.fetchAllReports();
    } catch (error) {
      console.error("Error fetching reports:", error);
      throw error;
    }
  }

  static async fetchFilteredReports(filters) {
    try {
      return await ReportService.fetchFilteredReports(filters);
    } catch (error) {
      console.error("Error fetching filtered reports:", error);
      throw error;
    }
  }

  static async updateReportStatus(reportId, status, note) {
    try {
      await ReportService.updateReportStatus(reportId, status, note);
    } catch (error) {
      console.error("Error updating report status:", error);
      throw error;
    }
  }
}

export default ReportController;