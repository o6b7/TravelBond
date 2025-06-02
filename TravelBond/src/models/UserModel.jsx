// === src/models/UserModel.js ===
class UserModel {
  constructor(data) {
    this.id = data.id || "";
    this.name = data.name || "";
    this.email = data.email || "";
    this.profilePicture = data.profilePicture || "none";
    this.address = data.address || "";
    this.guestStatus = data.guestStatus || "Maybe Accepting Guests";
    this.verified = data.verified || false;
    this.bio = data.bio || "";
    this.hostAvailability = data.hostAvailability || "Maybe Accepting Guests";
    this.references = data.references || [];
    this.reviews = data.reviews || [];
    this.DOB = data.DOB || null;
    this.education = data.education || [];
    this.languages = data.languages || [];
    this.hometown = data.hometown || "";
    this.accommodationType = data.accommodationType || "";
    this.myHomePhotos = data.myHomePhotos || [];
    this.myHomeDescription = data.myHomeDescription || "";
    this.occupation = data.occupation || "";
    this.travelPreferences = data.travelPreferences || [];
    this.responseRate = data.responseRate || 0;
    this.lastActive = data.lastActive || new Date().toISOString();
    this.friends = data.friends || [];
    this.groups = data.groups || [];
    this.role = data.role || "user";
    this.phoneNumber = data.phoneNumber || ["", false];
  }

  toFirestore() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      profilePicture: this.profilePicture,
      address: this.address,
      guestStatus: this.guestStatus,
      verified: this.verified,
      bio: this.bio,
      hostAvailability: this.hostAvailability,
      references: this.references,
      reviews: this.reviews,
      DOB: this.DOB,
      education: this.education,
      languages: this.languages,
      hometown: this.hometown,
      accommodationType: this.accommodationType,
      myHomePhotos: this.myHomePhotos,
      myHomeDescription: this.myHomeDescription,
      occupation: this.occupation,
      travelPreferences: this.travelPreferences,
      responseRate: this.responseRate,
      lastActive: this.lastActive,
      friends: this.friends,
      groups: this.groups,
      role: this.role,
      phoneNumber: this.phoneNumber,
    };
  }
}

export default UserModel;
