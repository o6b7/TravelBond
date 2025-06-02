import { db, storage } from "../utils/firebaseConfig";
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import EventModel from "../models/EventModel";
import IdGenerator from "../utils/IdGenerator"; // Import IdGenerator

class EventService {
  static async fetchEvents() {
    try {
      const eventsCollection = collection(db, "events");
      const eventSnapshot = await getDocs(eventsCollection);
      return eventSnapshot.docs.map((doc) => {
        const data = doc.data();
        return new EventModel({
          id: doc.id,
          title: data.title,
          date: data.date,
          time: data.time,
          location: data.location,
          description: data.description,
          duration: data.duration,
          organizerId: data.organizerId,
          participants: data.participants || [],
          picture: data.picture,
        });
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }

  static async createEvent(eventData) {
    try {
      // Generate a new event ID using IdGenerator
      const eventId = await IdGenerator.generateId("event");

      // Upload the picture to Firebase Storage
      const storageRef = ref(storage, `event-pictures/${eventData.picture.name}`);
      await uploadBytes(storageRef, eventData.picture);

      // Get the download URL of the uploaded picture
      const pictureUrl = await getDownloadURL(storageRef);

      // Create an instance of EventModel
      const event = new EventModel({
        id: eventId,
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        description: eventData.description,
        duration: eventData.duration,
        organizerId: eventData.organizerId,
        participants: [eventData.organizerId, ...(eventData.participants || [])], // Add organizer to participants
        picture: pictureUrl,
      });

      // Add the event data to Firestore with the generated event ID
      const eventDocRef = doc(db, "events", eventId);
      await setDoc(eventDocRef, event.toFirestore());

      return eventId;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }
}

export default EventService;