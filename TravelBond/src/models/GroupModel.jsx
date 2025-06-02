import { Timestamp } from "firebase/firestore";

class GroupModel {
  constructor({ id, title, description, discussions, last_active, main_moderator, members, picture, sub_moderators, participants }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.discussions = discussions || 0;
    this.last_active = last_active instanceof Timestamp ? last_active.toDate() : new Date(last_active); // Ensure conversion
    this.main_moderator = main_moderator;
    this.members = members || 0;
    this.picture = picture || "/default-group.png";
    this.sub_moderators = sub_moderators || [];
    this.participants = participants || [];
  }

  // Convert instance to a plain object for Firestore
  toFirestore() {
    return {
      title: this.title,
      description: this.description,
      discussions: this.discussions,
      last_active: Timestamp.fromDate(this.last_active),
      main_moderator: this.main_moderator,
      members: this.members,
      picture: this.picture,
      sub_moderators: this.sub_moderators,
      participants: this.participants,
    };
  }
}

export default GroupModel;