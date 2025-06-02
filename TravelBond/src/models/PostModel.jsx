export default class PostModel {
  constructor({
    postId,
    userId,
    content,
    photos = [],
    postedAt,
    likedBy = [],
    comments = [],
  }) {
    this.postId = postId;
    this.userId = userId;
    this.content = content;
    this.photos = photos;
    this.postedAt = postedAt;
    this.likedBy = likedBy;
    this.comments = comments.map(comment => ({
      commentId: comment.commentId,
      userId: comment.userId,
      comment: comment.comment,
      createdAt: comment.createdAt,
      likes: comment.likes || [],
      replies: comment.replies || {},
      user: comment.user
    }));
  }
}