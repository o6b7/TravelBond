class DiscussionModel {
    constructor({ id, title, content, createdAt, replies, userId, groupId }) {
      this.id = id;
      this.title = title;
      this.content = content;
      this.createdAt = createdAt;
      this.replies = replies || [];
      this.userId = userId;
      this.groupId = groupId;
    }
  }
  
  export default DiscussionModel;