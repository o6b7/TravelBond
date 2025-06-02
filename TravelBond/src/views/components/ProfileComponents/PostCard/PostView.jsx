import React from "react";
import { useParams, useLocation } from "react-router-dom";
import PostCard from "./PostCard";
import PostController from "../../../../controllers/PostController";
import { useState, useEffect } from "react";

const PostView = () => {
  const { postId } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await PostController.fetchPostById(postId);
        setPost(postData);
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };
    fetchPost();
  }, [postId]);

  if (!post) return <div>Loading post...</div>;

  return (
    <div className="container mt-4">
      <PostCard 
        post={post}
        currentUserId={localStorage.getItem("userId")}
        currentUserRole={localStorage.getItem("userRole")}
        location={location} 
      />
    </div>
  );
};

export default PostView;