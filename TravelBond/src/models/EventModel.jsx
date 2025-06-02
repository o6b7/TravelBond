import { Timestamp } from "firebase/firestore";

class EventModel {
  constructor({
    id,
    title,
    date,
    time,
    location,
    description,
    duration,
    organizerId,
    participants = [],
    picture = "/default-event.png",
    comments = [],
  }) {
    this.id = id;
    this.title = title;
    this.date = date instanceof Timestamp ? date.toDate() : new Date(date);
    this.time = time;
    this.location = location;
    this.description = description;
    this.duration = duration;
    this.organizerId = organizerId;
    this.participants = participants;
    this.picture = picture;
    this.comments = comments;
  }

  // Convert to Firestore-compatible object
  toFirestore() {
    return {
      title: this.title,
      date: Timestamp.fromDate(new Date(this.date)),
      time: this.time,
      location: this.location,
      description: this.description,
      duration: this.duration,
      organizerId: this.organizerId,
      participants: this.participants,
      picture: this.picture,
      comments: this.comments,
    };
  }
}

export default EventModel;