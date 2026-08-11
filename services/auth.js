import api from "./api";

// 1. User Signup
export const signupUser = async (userData) => {
  const response = await api.post("/auth/signup", userData);
  return response.data;
};

// 2. User Login
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

// 3. Forgot Password Request (Sends OTP)
export const forgotPasswordRequest = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

// 4. Verify OTP and Reset Password
export const verifyOtpRequest = async (email, otp, newPassword) => {
  const response = await api.post("/auth/verify-otp", {
    email,
    otp,
    new_password: newPassword,
  });
  return response.data;
};

// 5. Get Logged In User Profile
export const getMyProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};

// 6. Update Profile Info
export const updateMyProfile = async (profileData) => {
  const response = await api.put("/profile", profileData);
  return response.data;
};

// 7. Update Profile Image
export const updateProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.put("/profile/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// 8. Delete Account
export const deleteMyAccount = async () => {
  const response = await api.delete("/profile");
  return response.data;
};

// 9. Create Backup
export const createBackup = async () => {
  const response = await api.post("/profile/backup");
  return response.data;
};

// 10. Get Latest Backup
export const getLatestBackup = async () => {
  const response = await api.get("/profile/backup");
  return response.data;
};

// 11. Get Privacy Settings
export const getPrivacySettings = async () => {
  const response = await api.get("/profile/privacy");
  return response.data;
};

// 12. Update Privacy Settings
export const updatePrivacySettings = async (privacyData) => {
  const response = await api.put("/profile/privacy", privacyData);
  return response.data;
};

// 13. Request Account Info
export const requestAccountInfo = async () => {
  const response = await api.post("/profile/request-account-info");
  return response.data;
};

// 14. Send Feedback
export const sendFeedback = async (feedbackData) => {
  const response = await api.post("/profile/feedback", feedbackData);
  return response.data;
};

// Send Star Feedback
export const sendStarFeedback = async (rating, comment, feedbackType = "star_rating") => {
  const response = await api.post("/profile/strfeedback", { rating, comment, feedback_type: feedbackType });
  return response.data;
};

// 15. Toggle Lock Chat Room
export const toggleLockChat = async (roomId, isLocked) => {
  const response = await api.put(`/chat/${roomId}/lock`, { isLocked });
  return response.data;
};

// 16. Set Chat Lock PIN
export const setChatLockPin = async (pin) => {
  const response = await api.post("/profile/chat-lock-pin", { pin });
  return response.data;
};

// 17. Verify Chat Lock PIN
export const verifyChatLockPin = async (pin) => {
  const response = await api.post("/profile/verify-chat-lock-pin", { pin });
  return response.data;

};
// 18. Send Account Email Verification Mail
export const sendVerificationEmailService = async () => {
  const response = await api.post("/auth/send-verification");
  return response.data;
}

