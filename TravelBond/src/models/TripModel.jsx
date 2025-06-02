class TripModel {
    constructor({
      id = null,
      createdAt = null,
      destination = "",
      endDate = null,
      pictures = [],
      review = [],
      startDate = null,
      tripPurpose = "",
      userId = "",
    }) {
      this.id = id;
      this.createdAt = createdAt ? new Date(createdAt) : null; // Convert to Date object
      this.destination = destination;
      this.endDate = endDate ? new Date(endDate) : null; // Convert to Date object
      this.pictures = pictures;
      this.review = review;
      this.startDate = startDate ? new Date(startDate) : null; // Convert to Date object
      this.tripPurpose = tripPurpose;
      this.userId = userId;
    }
  }
  
  export default TripModel;