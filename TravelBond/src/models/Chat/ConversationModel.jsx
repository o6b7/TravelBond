class ConversationModel {
  constructor(data) {
    this.id = data.id || "";
    this.participants = data.participants || [];
    this.createdAt = data.createdAt || new Date();
    this.lastMessage = data.lastMessage || "";
    this.lastMessageAt = data.lastMessageAt || new Date();
    this.unreadCount = data.unreadCount || {};
  }

  toFirestore() {
    return {
      participants: this.participants,
      createdAt: this.createdAt,
      lastMessage: this.lastMessage,
      lastMessageAt: this.lastMessageAt,
      unreadCount: this.unreadCount
    };
  }
}

export default ConversationModel;