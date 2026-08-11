import api from "./api";

export const sendChatMessage = async (messageData) => {
  const response = await api.post("/messages", messageData);
  return response.data;
};

export const getRoomMessages = async (roomId) => {
  const response = await api.get(`/messages/${roomId}`);
  return response.data;
};

export const editChatMessage = async (messageId, newText) => {
  const response = await api.put(`/messages/${messageId}`, {
    message_text: newText,
  });
  return response.data;
};

export const deleteChatMessage = async (messageId) => {
  const response = await api.delete(`/messages/${messageId}`);
  return response.data;
};

export const markRoomMessagesAsSeen = async (roomId) => {
  const response = await api.put(`/messages/seen/${roomId}`);
  return response.data;
};

export const uploadAttachmentFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/upload/file", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
  return response.data;
};

export const pinChatMessage = async (messageId, isPinned) => {
  const response = await api.put(`/messages/${messageId}/pin`, { isPinned });
  return response.data;
};

export const voteInPoll = async (messageId, optionIndex) => {
  const response = await api.post(`/messages/${messageId}/vote`, { optionIndex });
  return response.data;
};

export const deleteMultipleMessages = async (messageIds, deleteForEveryone = false) => {
  const response = await api.post("/messages/delete-multiple", { messageIds, deleteForEveryone });
  return response.data;
};

export const clearChatRoomMessages = async (roomId) => {
  const response = await api.delete(`/messages/room/${roomId}/clear`);
  return response.data;
};

export const starChatMessage = async (messageId, isStarred) => {
  const response = await api.put(`/messages/${messageId}/star`, { isStarred });
  return response.data;
};

