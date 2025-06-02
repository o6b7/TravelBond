class MessageModel {
  constructor(data) {
    this.id = data.id || "";
    this.senderId = data.senderId || "";
    this.content = data.content || "";
    this.timestamp = data.timestamp || new Date();
    this.read = data.read || false;
  }

  toFirestore() {
    return {
      senderId: this.senderId,
      content: this.content,
      timestamp: this.timestamp,
      read: this.read
    };
  }
}

export default MessageModel;