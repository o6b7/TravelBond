import { db } from "../utils/firebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import TripModel from "../models/TripModel";

class TripService {
  /**
   * Fetch all trips from Firestore.
   * @returns {Promise<TripModel[]>} - Array of TripModel instances.
   */
  static async fetchTrips() {
    try {
      const tripsCollection = collection(db, "trips");
      const tripSnapshot = await getDocs(tripsCollection);
      return tripSnapshot.docs.map((doc) => {
        const data = doc.data();
        return new TripModel({
          id: doc.id,
          ...data,
        });
      });
    } catch (error) {
      console.error("Error fetching trips:", error);
      throw error;
    }
  }

  // Other methods (createTrip, updateTrip, deleteTrip, etc.) can be added here
}

export default TripService; // Ensure this export is present