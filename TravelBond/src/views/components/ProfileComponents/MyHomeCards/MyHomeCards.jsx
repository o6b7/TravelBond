import React, { useState, useEffect } from "react";
import MyHomeDescCard from "./MyHomeDescCard";
import MyHomePhotosCard from "./MyHomePhotosCard";

const MyHomeCards = ({ userData, onUpdate, readOnly }) => {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [myHomeDescription, setMyHomeDescription] = useState(userData.myHomeDescription || "");
  const [myHomePhotos, setMyHomePhotos] = useState(userData.myHomePhotos || []);
  const [photosMarkedForDeletion, setPhotosMarkedForDeletion] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleEditDescClick = () => {
    if (!readOnly) setIsEditingDesc(true);
  };

  const handleEditPhotosClick = () => {
    if (!readOnly) setIsEditingPhotos(true);
  };

  const handleDescriptionChange = (e) => {
    setMyHomeDescription(e.target.value);
  };

  const handlePhotosChange = (e) => {
    if (readOnly) return;
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => URL.createObjectURL(file));
    setMyHomePhotos([...myHomePhotos, ...newPhotos]);
  };

  const handleRemovePhoto = (updatedPhotos) => {
    if (readOnly) return;
    setMyHomePhotos(updatedPhotos);
  };

  const handleSaveDesc = async () => {
    try {
      if (!userId || readOnly) return;

      const updatedData = {
        ...userData,
        myHomeDescription,
      };
      await onUpdate(updatedData);
      setIsEditingDesc(false);
    } catch (error) {
      console.error("Error updating My Home description:", error);
    }
  };

  const handleSavePhotos = async (updatedPhotos) => {
    try {
      if (!userId || readOnly) return;

      const updatedData = {
        ...userData,
        myHomePhotos: updatedPhotos || myHomePhotos,
      };
      await onUpdate(updatedData);
      setMyHomePhotos(updatedPhotos);
      setPhotosMarkedForDeletion([]);
      setIsEditingPhotos(false);
    } catch (error) {
      console.error("Error updating My Home photos:", error);
    }
  };

  return (
    <>
      <MyHomeDescCard
        description={myHomeDescription}
        isEditing={isEditingDesc}
        onEditClick={handleEditDescClick}
        onDescriptionChange={handleDescriptionChange}
        onSave={handleSaveDesc}
        onCancel={() => setIsEditingDesc(false)}
        readOnly={readOnly}
      />

      {userId && (
        <MyHomePhotosCard
          userId={userId}
          photos={myHomePhotos}
          isEditing={isEditingPhotos}
          onEditClick={handleEditPhotosClick}
          onPhotosChange={handlePhotosChange}
          onRemovePhoto={handleRemovePhoto}
          onSave={handleSavePhotos}
          onCancel={() => setIsEditingPhotos(false)}
          setMyHomePhotos={setMyHomePhotos}
          photosMarkedForDeletion={photosMarkedForDeletion}
          setPhotosMarkedForDeletion={setPhotosMarkedForDeletion}
          readOnly={readOnly}
        />
      )}
    </>
  );
};

export default MyHomeCards;