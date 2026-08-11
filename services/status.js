import api from "./api";

export const createStatusUpdate = async (statusData) => {
  const response = await api.post("/status", statusData);
  return response.data;
};

export const getStatusUpdates = async () => {
  const response = await api.get("/status");
  return response.data;
};

export const deleteStatusUpdate = async (statusId) => {
  const response = await api.delete(`/status/${statusId}`);
  return response.data;
};

export const viewStatusUpdate = async (statusId) => {
  const response = await api.post(`/status/${statusId}/view`);
  return response.data;
};

export const getStatusViewersList = async (statusId) => {
  const response = await api.get(`/status/${statusId}/viewers`);
  return response.data;
};

export const likeStatusUpdate = async (statusId, isLiked) => {
  const response = await api.post(`/status/${statusId}/like`, { isLiked });
  return response.data;
};
