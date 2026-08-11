import api from "./api";

export const getMyChats = async () => {
  const response = await api.get("/chat");
  return response.data;
};

export const createPersonalChat = async (receiverId) => {
  const response = await api.post("/chat", {
    is_group: false,
    receiverId,
  });
  return response.data;
};

export const createGroupChat = async (name, memberIds) => {
  const response = await api.post("/chat", {
    is_group: true,
    name,
    memberIds,
  });
  return response.data;
};

export const getChatRoomDetails = async (roomId) => {
  const response = await api.get(`/chat/${roomId}`);
  return response.data;
};

export const deleteChatRoom = async (roomId) => {
  const response = await api.delete(`/chat/${roomId}`);
  return response.data;
};

export const getAllUsersDirectory = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const searchUsersInDirectory = async (query) => {
  const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const saveContact = async (emailOrMobile, customFirstName, customLastName) => {
  const response = await api.post("/contacts", { emailOrMobile, customFirstName, customLastName });
  return response.data;
};

export const getSavedContacts = async () => {
  const response = await api.get("/contacts");
  return response.data;
};

export const createCommunityChat = async (name, memberIds, groupIds) => {
  const response = await api.post("/community", {
    name,
    memberIds,
    groupIds,
  });
  return response.data;
};

export const renameGroup = async (groupId, name) => {
  const response = await api.put(`/groups/${groupId}`, { name });
  return response.data;
};

export const uploadGroupImage = async (groupId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.put(`/groups/${groupId}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const addMemberToGroup = async (roomId, userId) => {
  const response = await api.post("/groups/add-member", { roomId, userId });
  return response.data;
};

export const getGroupMembers = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/members`);
  return response.data;
};

export const deleteMultipleChats = async (roomIds) => {
  const response = await api.post("/chat/delete-multiple", { roomIds });
  return response.data;
};

export const pinChatRoom = async (roomId, isPinned) => {
  const response = await api.put(`/chat/${roomId}/pin`, { isPinned });
  return response.data;
};

export const deleteContact = async (contactId) => {
  const response = await api.delete(`/contacts/${contactId}`);
  return response.data;
};

export const blockUser = async (blockedUserId) => {
  const response = await api.post("/contacts/block", { blockedUserId });
  return response.data;
};

export const unblockUser = async (blockedUserId) => {
  const response = await api.post("/contacts/unblock", { blockedUserId });
  return response.data;
};

export const getBlockedUsers = async () => {
  const response = await api.get("/contacts/blocked");
  return response.data;
};

// Edit contact custom name
export const editContact = async (contactId, customFirstName, customLastName) => {
  const response = await api.put(`/contacts/${contactId}`, { customFirstName, customLastName });
  return response.data;
};

// Custom Lists APIs
export const getUserLists = async () => {
  const response = await api.get("/lists");
  return response.data;
};

export const createUserList = async (name, items) => {
  const response = await api.post("/lists", { name, items });
  return response.data;
};

export const updateUserList = async (listId, name, items) => {
  const response = await api.put(`/lists/${listId}`, { name, items });
  return response.data;
};

export const deleteUserList = async (listId) => {
  const response = await api.delete(`/lists/${listId}`);
  return response.data;
};

export const inviteCommunityMember = async (communityId, userId) => {
  const response = await api.post(`/community/${communityId}/invite`, { userId });
  return response.data;
};

export const acceptCommunityInvite = async (communityId) => {
  const response = await api.post(`/community/${communityId}/accept`);
  return response.data;
};

export const declineCommunityInvite = async (communityId) => {
  const response = await api.post(`/community/${communityId}/decline`);
  return response.data;
};

export const removeMemberFromGroup = async (roomId, userId) => {
  const response = await api.post("/groups/remove-member", { roomId, userId });
  return response.data;
};

export const removeMemberFromCommunity = async (communityId, userId) => {
  const response = await api.delete(`/community/${communityId}/members/${userId}`);
  return response.data;
};

export const updateGroupPermissions = async (groupId, onlyAdminsSend) => {
  const response = await api.put(`/groups/${groupId}/permissions`, { only_admins_send: onlyAdminsSend });
  return response.data;
};

export const reportChatRoom = async (roomId, reason) => {
  const response = await api.post("/chat/report", { roomId, reason });
  return response.data;
};

export const getCommunityGroups = async (communityId) => {
  const response = await api.get(`/community/${communityId}/groups`);
  return response.data;
};

export const createGroupInCommunity = async (communityId, name, memberIds, onlyAdminsSend) => {
  const response = await api.post(`/community/${communityId}/groups`, { name, memberIds, only_admins_send: onlyAdminsSend });
  return response.data;
};

export const linkGroupToCommunity = async (communityId, groupId) => {
  const response = await api.put(`/community/${communityId}/groups/${groupId}`);
  return response.data;
};

export const unlinkGroupFromCommunity = async (communityId, groupId) => {
  const response = await api.delete(`/community/${communityId}/groups/${groupId}`);
  return response.data;
};

export const discoverCommunities = async () => {
  const response = await api.get("/community/discover");
  return response.data;
};

export const requestToJoinCommunity = async (communityId) => {
  const response = await api.post(`/community/${communityId}/request`);
  return response.data;
};

export const getPendingRequests = async (communityId) => {
  const response = await api.get(`/community/${communityId}/requests`);
  return response.data;
};

export const handleJoinRequest = async (communityId, requestId, status) => {
  const response = await api.put(`/community/${communityId}/requests/${requestId}`, { status });
  return response.data;
};

export const updateMemberRole = async (groupId, targetUserId, role) => {
  const response = await api.put(`/groups/${groupId}/role`, { targetUserId, role });
  return response.data;
};


