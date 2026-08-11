import api from "./api";

export const getMyNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/read/${notificationId}`);
  return response.data;
};

export const clearAllMyNotifications = async () => {
  const response = await api.delete("/notifications/clear");
  return response.data;
};

export const deleteNotificationsBatch = async (ids) => {
  const response = await api.post("/notifications/delete", { ids });
  return response.data;
};
