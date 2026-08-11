"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "../../components/SplashScreen";
import ChatSidebar from "../../components/ChatSidebar";
import BlankScreen from "../../components/BlankScreen";
import { useTranslation } from "../../components/i18n";
import {
  getMyProfile,
  updateMyProfile,
  updateProfileImage,
  deleteMyAccount
} from "../../services/auth";
import { X, Users, Check, Search, UserPlus, Plus } from "lucide-react";
import {
  getMyChats,
  createPersonalChat,
  createGroupChat,
  deleteChatRoom,
  getAllUsersDirectory,
  searchUsersInDirectory,
  getSavedContacts,
  saveContact,
  addMemberToGroup
} from "../../services/chat";
import {
  getRoomMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  markRoomMessagesAsSeen,
  uploadAttachmentFile,
  deleteMultipleMessages
} from "../../services/message";
import {
  getMyNotifications,
  markNotificationAsRead,
  clearAllMyNotifications,
  deleteNotificationsBatch
} from "../../services/notification";
import {
  initiateSocketConnection,
  disconnectSocket,
  joinChatRoomSocket,
  leaveChatRoomSocket,
  sendTypingStatusSocket
} from "../../services/socket";

const showDesktopNotification = (title, body) => {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  }
};

export default function ChatPage({ initialTab = "chats", initialSettingsView = "menu" }) {
  const router = useRouter();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [chatFilter, setChatFilter] = useState("all");
  const [activeRoom, setActiveRoom] = useState(null);
  const [mobileActiveView, setMobileActiveView] = useState("sidebar"); // "sidebar" or "chatpane"

  useEffect(() => {
    if (!activeRoom) {
      setMobileActiveView("sidebar");
    }
  }, [activeRoom]);

  const [currentUser, setCurrentUser] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [chatWallpaper, setChatWallpaper] = useState("");
  const [chatThemeColor, setChatThemeColor] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setChatWallpaper(localStorage.getItem("chatWallpaper") || "");
      setChatThemeColor(localStorage.getItem("chatThemeColor") || "#6c5ce7");

      const handleThemeChange = () => {
        setChatThemeColor(localStorage.getItem("chatThemeColor") || "#6c5ce7");
        setChatWallpaper(localStorage.getItem("chatWallpaper") || "");
      };

      window.addEventListener("chatThemeColorChanged", handleThemeChange);
      window.addEventListener("storage", handleThemeChange);
      return () => {
        window.removeEventListener("chatThemeColorChanged", handleThemeChange);
        window.removeEventListener("storage", handleThemeChange);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handlePopState = () => {
        const path = window.location.pathname;
        if (path === "/chat") {
          setActiveTab("chats");
        } else if (path === "/contacts") {
          setActiveTab("contacts");
        } else if (path === "/status") {
          setActiveTab("status");
        } else if (path === "/community") {
          setActiveTab("community");
        } else if (path === "/profile") {
          setActiveTab("settings");
        } else if (path === "/settings") {
          setActiveTab("settings");
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, []);

  const [messageText, setMessageText] = useState("");
  const [typingTimer, setTypingTimer] = useState(null);
  const [isTypingPartner, setIsTypingPartner] = useState(false);
  const [typingPartnerName, setTypingPartnerName] = useState("");

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  useEffect(() => {
    if (profileSuccessMsg) {
      const timer = setTimeout(() => setProfileSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccessMsg]);

  useEffect(() => {
    if (profileErrorMsg) {
      const timer = setTimeout(() => setProfileErrorMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileErrorMsg]);

  const [statusTip, setStatusTip] = useState("");

  useEffect(() => {
    if (statusTip) {
      const timer = setTimeout(() => setStatusTip(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusTip]);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  const [isMessageDeleteMode, setIsMessageDeleteMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  const [disappearingDuration, setDisappearingDuration] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pref_disappearing_duration") || "off";
    }
    return "off";
  });

  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pref_fontSize") || "medium";
    }
    return "medium";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("font-size-small", "font-size-medium", "font-size-large");
      root.classList.add(`font-size-${fontSize}`);
    }
  }, [fontSize]);

  const [loading, setLoading] = useState(true);
  const [roomLoading, setRoomLoading] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);

  const socketRef = useRef(null);

  const [statusRefreshTrigger, setStatusRefreshTrigger] = useState(0);

  const activeRoomRef = useRef(activeRoom);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    if (isGroupModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isGroupModalOpen]);

  useEffect(() => {
    currentUserRef.current = currentUser;
    if (currentUser) {
      setEditFirstName(currentUser.first_name || "");
      setEditLastName(currentUser.last_name || "");
      setEditMobile(currentUser.mobile || "");
      setEditAddress(currentUser.address || "");
      setEditAbout(currentUser.about || "Hey there! I am using MYCHATBOX.");
    }
  }, [currentUser]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileImageInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const loadInitialData = async () => {
      try {
        const profileData = await getMyProfile();
        if (profileData.success) {
          setCurrentUser(profileData.user);
          setEditFirstName(profileData.user.first_name || "");
          setEditLastName(profileData.user.last_name || "");
          setEditMobile(profileData.user.mobile || "");
          setEditAddress(profileData.user.address || "");
          setEditAbout(profileData.user.about || "Hey there! I am using MYCHATBOX.");
        }

        const chatsData = await getMyChats();
        if (chatsData.success) {
          setChatList(chatsData.chats);
        }

        const directoryData = await getAllUsersDirectory();
        if (directoryData.success) {
          setDirectoryUsers(directoryData.users);
        }

        const contactsData = await getSavedContacts();
        if (contactsData.success) {
          setContacts(contactsData.contacts);
        }

        const notificationsData = await getMyNotifications();
        if (notificationsData.success) {
          setNotifications(notificationsData.notifications);
        }

        const socketInstance = initiateSocketConnection();
        socketRef.current = socketInstance;
        socketInstance.emit("join_user", profileData.user.id);

        socketInstance.off("receive_message");
        socketInstance.off("messages_seen");
        socketInstance.off("receive_typing");
        socketInstance.off("message_edited");
        socketInstance.off("message_deleted");
        socketInstance.off("group_renamed");
        socketInstance.off("group_deleted");
        socketInstance.off("new_notification");
        socketInstance.off("status_created");

        socketInstance.on("new_notification", (data) => {
          const isGlobalMute = localStorage.getItem("pref_muteAllNotifications") === "true";
          const mutedRoomsStr = localStorage.getItem("pref_mutedRoomIds");
          const mutedRooms = mutedRoomsStr ? JSON.parse(mutedRoomsStr) : [];
          if (isGlobalMute || (data && mutedRooms.includes(Number(data.room_id)))) {
            refreshChatList();
            return;
          }
          refreshNotifications();
          refreshChatList();
        });

        socketInstance.on("status_created", () => {
          setStatusRefreshTrigger((prev) => prev + 1);
        });
        socketInstance.on("receive_message", (incomingMsg) => {
          const freshActiveRoom = activeRoomRef.current;
          const freshUser = currentUserRef.current;

          if (freshUser && incomingMsg.sender_id && Number(incomingMsg.sender_id) !== Number(freshUser.id)) {
            // Disabled desktop notification as requested by user
            // const senderName = incomingMsg.sender?.first_name || "New Message";
            // showDesktopNotification(senderName, incomingMsg.message_text || "Sent a message");
          }

          const isPermissionChange = incomingMsg.message_text && (
            incomingMsg.message_text.includes("only be sent by admins") ||
            incomingMsg.message_text.includes("All participants can now send messages") ||
            incomingMsg.message_text.includes("Group setting updated")
          );

          if (isPermissionChange) {
            const isOnlyAdmin = incomingMsg.message_text.includes("only be sent by admins") ||
              incomingMsg.message_text.includes("Only admins can send messages");
            localStorage.setItem(`only_admin_send_${incomingMsg.room_id}`, isOnlyAdmin ? "true" : "false");
            if (freshActiveRoom && Number(freshActiveRoom.id) === Number(incomingMsg.room_id)) {
              setActiveRoom((prev) => (prev ? { ...prev, only_admins_send: isOnlyAdmin } : prev));
            }
            if (typeof window !== "undefined") window.dispatchEvent(new Event("storage"));
          }

          const keepArchived = localStorage.getItem("pref_keepChatsArchived") === "true";
          if (!keepArchived) {
            const savedArchived = localStorage.getItem("pref_archivedRoomIds");
            let archivedIds = savedArchived ? JSON.parse(savedArchived) : [];
            const msgRoomId = Number(incomingMsg.room_id);
            if (archivedIds.includes(msgRoomId)) {
              archivedIds = archivedIds.filter(id => id !== msgRoomId);
              localStorage.setItem("pref_archivedRoomIds", JSON.stringify(archivedIds));
              window.dispatchEvent(new Event("storage_archived_rooms"));
            }
          }

          if (freshActiveRoom && Number(incomingMsg.room_id) === Number(freshActiveRoom.id)) {
            setMessages((prev) => {
              const existingIdx = prev.findIndex(
                (m) => m.id === incomingMsg.id || (m.id && m.id.toString().startsWith("temp_") && m.message_text === incomingMsg.message_text)
              );
              if (existingIdx !== -1) {
                const updated = [...prev];
                updated[existingIdx] = incomingMsg;
                return updated;
              }
              return [...prev, incomingMsg];
            });
            markRoomMessagesAsSeen(freshActiveRoom.id);
            scrollToBottom();
          }
          refreshChatList();
          refreshNotifications();
        });

        socketInstance.on("messages_seen", (data) => {
          const freshActiveRoom = activeRoomRef.current;
          if (freshActiveRoom && Number(freshActiveRoom.id) === Number(data.roomId)) {
            setMessages((prev) =>
              prev.map((msg) => {
                if (Number(msg.sender_id) !== Number(data.userId)) {
                  return { ...msg, is_seen: true };
                }
                return msg;
              })
            );
          }
        });

        socketInstance.on("receive_typing", (data) => {
          const freshActiveRoom = activeRoomRef.current;
          if (freshActiveRoom && Number(data.roomId) === Number(freshActiveRoom.id)) {
            if (data.isTyping) {
              setTypingPartnerName(data.firstName || "Someone");
              setIsTypingPartner(true);
              if (window._typingReceiveTimer) clearTimeout(window._typingReceiveTimer);
              window._typingReceiveTimer = setTimeout(() => {
                setIsTypingPartner(false);
              }, 4000);
            } else {
              if (window._typingReceiveTimer) clearTimeout(window._typingReceiveTimer);
              setIsTypingPartner(false);
            }
          }
        });

        socketInstance.on("message_edited", (updatedMsg) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMsg.id ? { ...msg, message_text: updatedMsg.message_text, updated_at: updatedMsg.updated_at } : msg))
          );
        });

        socketInstance.on("message_deleted", (deletedData) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedData.id));
        });

        socketInstance.on("messages_deleted_batch", (deletedData) => {
          const freshActiveRoom = activeRoomRef.current;
          if (freshActiveRoom && Number(freshActiveRoom.id) === Number(deletedData.roomId)) {
            setMessages((prev) => prev.filter((msg) => !deletedData.ids.includes(msg.id)));
          }
        });

        socketInstance.on("messages_deleted_everyone", (deletedData) => {
          const freshActiveRoom = activeRoomRef.current;
          if (freshActiveRoom && Number(freshActiveRoom.id) === Number(deletedData.roomId)) {
            setMessages((prev) =>
              prev.map((msg) =>
                deletedData.ids.includes(msg.id)
                  ? { ...msg, message_text: "\u200Bdeleted\u200B", attachment_url: null, attachment_type: null, is_pinned: false }
                  : msg
              )
            );
          }
        });

        socketInstance.on("poll_vote_updated", (data) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === Number(data.messageId)
                ? {
                  ...msg,
                  poll_votes: data.poll_votes,
                  raw_votes: data.raw_votes,
                  my_vote: data.raw_votes && data.raw_votes[currentUser?.id] !== undefined
                    ? Number(data.raw_votes[currentUser?.id])
                    : null
                }
                : msg
            )
          );
        });

        socketInstance.on("message_starred", (data) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === Number(data.messageId)
                ? { ...msg, poll_votes: data.poll_votes }
                : msg
            )
          );
        });

        socketInstance.on("chat_cleared", (data) => {
          const freshActiveRoom = activeRoomRef.current;
          if (freshActiveRoom && Number(freshActiveRoom.id) === Number(data.roomId)) {
            setMessages([]);
          }
        });

        socketInstance.on("group_renamed", (updatedGroup) => {
          const freshActiveRoom = activeRoomRef.current;
          if (freshActiveRoom && freshActiveRoom.id === updatedGroup.id) {
            setActiveRoom((prev) => ({ ...prev, name: updatedGroup.name }));
          }
          refreshChatList();
        });

        socketInstance.on("group_deleted", (data) => {
          const freshActiveRoom = activeRoomRef.current;
          if (freshActiveRoom && freshActiveRoom.id === data.roomId) {
            setActiveRoom(null);
            setMessages([]);
            setMobileActiveView("sidebar");
          }
          refreshChatList();
        });

        socketInstance.on("group_image_updated", (updatedGroup) => {
          const freshActiveRoom = activeRoomRef.current;
          if (freshActiveRoom && freshActiveRoom.id === updatedGroup.id) {
            setActiveRoom((prev) => ({ ...prev, group_image: updatedGroup.group_image }));
          }
          refreshChatList();
        });

        setLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      }
    };

    const handlePollNotifEvent = (e) => {
      if (e.detail) {
        setNotifications((prev) => [
          {
            id: `poll_rem_${Date.now()}`,
            room_id: e.detail.room_id,
            created_at: new Date().toISOString(),
            is_read: false,
            chat_messages: {
              attachment_type: "poll",
              message_text: e.detail.message_text
            }
          },
          ...prev
        ]);
      }
    };

    window.addEventListener("add_poll_notification", handlePollNotifEvent);

    loadInitialData();

    return () => {
      window.removeEventListener("add_poll_notification", handlePollNotifEvent);
      if (socketRef.current) {
        socketRef.current.off("receive_message");
        socketRef.current.off("messages_seen");
        socketRef.current.off("receive_typing");
        socketRef.current.off("message_edited");
        socketRef.current.off("message_deleted");
        socketRef.current.off("messages_deleted_batch");
        socketRef.current.off("chat_cleared");
        socketRef.current.off("group_renamed");
        socketRef.current.off("group_deleted");
        socketRef.current.off("group_image_updated");
        socketRef.current.off("new_notification");
        socketRef.current.off("status_created");
        socketRef.current.off("messages_deleted_everyone");
        socketRef.current.off("poll_vote_updated");
        socketRef.current.off("message_starred");
      }
      disconnectSocket();
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const refreshChatList = async () => {
    try {
      const chatsData = await getMyChats();
      if (chatsData.success) {
        setChatList(chatsData.chats);
        (chatsData.chats || []).forEach((room) => {
          if (room && room.id) joinChatRoomSocket(room.id);
        });
      }
    } catch (err) {
      console.error("Failed to refresh chats:", err);
    }
  };

  const refreshNotifications = async () => {
    try {
      const notificationsData = await getMyNotifications();
      if (notificationsData.success) {
        const isGlobalMute = localStorage.getItem("pref_muteAllNotifications") === "true";
        const mutedRoomsStr = localStorage.getItem("pref_mutedRoomIds");
        const mutedRooms = mutedRoomsStr ? JSON.parse(mutedRoomsStr) : [];
        let filteredNotifs = notificationsData.notifications;
        if (isGlobalMute) {
          filteredNotifs = [];
        } else if (mutedRooms.length > 0) {
          filteredNotifs = filteredNotifs.filter(n => !mutedRooms.includes(Number(n.room_id)));
        }
        setNotifications(filteredNotifs);
      }
    } catch (err) {
      console.error("Failed to refresh notifications:", err);
    }
  };

  const refreshContacts = async () => {
    try {
      const contactsData = await getSavedContacts();
      if (contactsData.success) {
        setContacts(contactsData.contacts);
      }
    } catch (err) {
      console.error("Failed to refresh contacts:", err);
    }
  };

  const handleDirectorySearch = async (val) => {
    setDirectorySearch(val);
    if (!val.trim()) {
      const directoryData = await getAllUsersDirectory();
      if (directoryData.success) {
        setDirectoryUsers(directoryData.users);
      }
      return;
    }
    try {
      const searchData = await searchUsersInDirectory(val);
      if (searchData.success) {
        setDirectoryUsers(searchData.users);
      }
    } catch (err) {
      console.error("Directory search failed:", err);
    }
  };

  const refreshMessages = async () => {
    if (!activeRoomRef.current) return;
    try {
      const msgsData = await getRoomMessages(activeRoomRef.current.id);
      if (msgsData.success) {
        setMessages(msgsData.messages);
      }
    } catch (err) {
      console.error("Failed to refresh messages:", err);
    }
  };

  const handleSelectRoom = async (room) => {
    setRoomLoading(true);
    setMobileActiveView("chatpane");
    setIsTypingPartner(false);
    setMessageText("");

    if (activeRoom) {
      leaveChatRoomSocket(activeRoom.id);
    }

    try {
      setActiveRoom(room);
      joinChatRoomSocket(room.id);

      const msgsData = await getRoomMessages(room.id);
      if (msgsData.success) {
        setMessages(msgsData.messages);
      }

      await markRoomMessagesAsSeen(room.id);
      refreshChatList();
      refreshNotifications();
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load room data:", err);
    } finally {
      setRoomLoading(false);
    }
  };

  const handleStartPersonalChat = async (user) => {
    try {
      const response = await createPersonalChat(user.id);
      if (response.success) {
        const chatsData = await getMyChats();
        if (chatsData.success) {
          setChatList(chatsData.chats);
          const matchedRoom = chatsData.chats.find((r) => r.id === response.room.id);
          if (matchedRoom) {
            handleSelectRoom(matchedRoom);
          } else {
            handleSelectRoom(response.room);
          }
        }
        setActiveTab("chats");
      }
    } catch (err) {
      console.error("Failed to start personal chat:", err);
    }
  };

  const handleSendMessage = async (e, textOverride) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    const txt = textOverride !== undefined ? textOverride : messageText;
    if (!txt.trim() || !activeRoom || !currentUser) return;

    if (typingTimer) {
      clearTimeout(typingTimer);
      sendTypingStatusSocket(activeRoom.id, currentUser.id, false);
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const localMsg = {
      id: tempId,
      room_id: activeRoom.id,
      sender_id: currentUser.id,
      sender: currentUser,
      message_text: txt.trim(),
      created_at: new Date().toISOString(),
      is_starred: false
    };

    setMessageText("");
    setMessages((prev) => [...prev, localMsg]);
    scrollToBottom();

    const payload = {
      room_id: activeRoom.id,
      message_text: txt.trim()
    };

    try {
      const response = await sendChatMessage(payload);
      if (response && response.success && response.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? response.data : m))
        );
        refreshChatList();
      }
    } catch (err) {
      console.warn("API send failed (e.g. 403), preserving message locally:", err);
      if (socketRef.current) {
        socketRef.current.emit("send_message", {
          room_id: activeRoom.id,
          sender_id: currentUser.id,
          message_text: txt.trim(),
          id: tempId,
          created_at: new Date().toISOString()
        });
      }
    }
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (!activeRoom || !currentUser) return;

    sendTypingStatusSocket(activeRoom.id, currentUser.id, true, currentUser.first_name);

    if (typingTimer) clearTimeout(typingTimer);

    const timer = setTimeout(() => {
      sendTypingStatusSocket(activeRoom.id, currentUser.id, false, currentUser.first_name);
    }, 3000);

    setTypingTimer(timer);
  };

  const handleFileUpload = async (e, directPayload, options = {}) => {
    if (!activeRoom || !currentUser) return;

    if (directPayload) {
      const tempId = `temp_att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setAttachmentLoading(true);
      try {
        const localMsg = {
          id: tempId,
          room_id: activeRoom.id,
          sender_id: currentUser.id,
          sender: currentUser,
          message_text: directPayload.name,
          attachment_url: directPayload.url,
          attachment_type: directPayload.type,
          created_at: new Date().toISOString(),
          is_starred: false
        };
        setMessages((prev) => [...prev, localMsg]);
        scrollToBottom();

        const payload = {
          room_id: activeRoom.id,
          message_text: directPayload.name,
          attachment_url: directPayload.url,
          attachment_type: directPayload.type
        };
        const response = await sendChatMessage(payload);
        if (response && response.success && response.data) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? response.data : m)));
          refreshChatList();
        }
      } catch (err) {
        console.warn("API send failed:", err);
      } finally {
        setAttachmentLoading(false);
      }
      return;
    }

    const fileList = Array.from(e?.target?.files || []);
    if (fileList.length === 0) return;

    setAttachmentLoading(true);

    try {
      if (fileList.length > 1 && options.isMedia) {
        const tempId = `temp_att_multi_${Date.now()}`;
        const uploadedUrls = [];

        for (const file of fileList) {
          const res = await uploadAttachmentFile(file);
          if (res.success && res.url) {
            uploadedUrls.push(res.url);
          }
        }

        if (uploadedUrls.length > 0) {
          const jsonUrls = JSON.stringify(uploadedUrls);
          const localMsg = {
            id: tempId,
            room_id: activeRoom.id,
            sender_id: currentUser.id,
            sender: currentUser,
            message_text: `${uploadedUrls.length} Photos`,
            attachment_url: jsonUrls,
            attachment_type: "media_images",
            created_at: new Date().toISOString(),
            is_starred: false
          };
          setMessages((prev) => [...prev, localMsg]);
          scrollToBottom();

          const payload = {
            room_id: activeRoom.id,
            message_text: `${uploadedUrls.length} Photos`,
            attachment_url: jsonUrls,
            attachment_type: "media_images"
          };

          const response = await sendChatMessage(payload);
          if (response && response.success && response.data) {
            setMessages((prev) => prev.map((m) => (m.id === tempId ? response.data : m)));
            refreshChatList();
          }
        }
      } else {
        for (const file of fileList) {
          const tempId = `temp_att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const uploadRes = await uploadAttachmentFile(file);
          if (uploadRes.success) {
            let attachmentType = "document";
            const ext = file.name.split(".").pop().toLowerCase();
            if (options.isDocument) {
              attachmentType = "document";
            } else if (options.isMedia || file.type.startsWith("image/")) {
              attachmentType = "image";
            } else {
              attachmentType = ext;
            }

            const fileSizeFormatted = file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : "";
            const localMsg = {
              id: tempId,
              room_id: activeRoom.id,
              sender_id: currentUser.id,
              sender: currentUser,
              message_text: file.name,
              attachment_url: uploadRes.url,
              attachment_type: attachmentType,
              file_size: file.size,
              size_text: fileSizeFormatted,
              created_at: new Date().toISOString(),
              is_starred: false
            };
            setMessages((prev) => [...prev, localMsg]);
            scrollToBottom();

            const payload = {
              room_id: activeRoom.id,
              message_text: file.name,
              attachment_url: uploadRes.url,
              attachment_type: attachmentType,
              file_size: file.size
            };

            const response = await sendChatMessage(payload);
            if (response && response.success && response.data) {
              setMessages((prev) => prev.map((m) => (m.id === tempId ? response.data : m)));
              refreshChatList();
            }
          }
        }
      }
    } catch (err) {
      console.warn("Upload/Send API failed, message preserved:", err);
    } finally {
      setAttachmentLoading(false);
      if (e?.target) e.target.value = "";
    }
  };

  const handleSaveMessageEdit = async (messageId, textOverride) => {
    const textToSave = textOverride !== undefined ? textOverride : editingMessageText;
    if (!textToSave.trim()) return;
    try {
      const response = await editChatMessage(messageId, textToSave);
      if (response.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, message_text: response.data?.message_text || (textToSave + "\u200B") } : msg))
        );
        setEditingMessageId(null);
        setEditingMessageText("");
        setMessageText("");
      }
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm(t("confirm_delete_message"))) return;
    try {
      const response = await deleteChatMessage(messageId);
      if (response.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleDeleteMultipleMessages = async (messageIds) => {
    try {
      const response = await deleteMultipleMessages(messageIds);
      if (response.success) {
        setMessages((prev) => prev.filter((msg) => !messageIds.includes(msg.id)));
        setIsMessageDeleteMode(false);
        setSelectedMessageIds([]);
      }
    } catch (err) {
      console.error("Failed to delete multiple messages:", err);
    }
  };

  const toggleGroupMemberSelection = (userId) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupMembers.length === 0) {
      return false;
    }

    try {
      const response = await createGroupChat(groupName.trim(), selectedGroupMembers);
      const createdGroup = response?.room || response?.group;
      if (response.success && createdGroup) {
        setGroupName("");
        setSelectedGroupMembers([]);
        setIsGroupModalOpen(false);
        setActiveTab("chats");
        setMobileActiveView("chatpane");
        setActiveRoom(createdGroup);
        setMessages([]);
        setStatusTip(t("group_created_success", "Group created successfully!"));

        const chatsData = await getMyChats();
        let targetRoom = createdGroup;
        if (chatsData.success) {
          setChatList(chatsData.chats);
          const matched = chatsData.chats.find((r) => Number(r.id) === Number(createdGroup.id));
          if (matched) targetRoom = matched;
        }

        await handleSelectRoom(targetRoom);
        return true;
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    }
    return false;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    if (editMobile && !/^[0-9]{10}$/.test(editMobile.trim())) {
      setProfileErrorMsg(t("mobile_number_validation"));
      return;
    }

    try {
      const profileResponse = await updateMyProfile({
        first_name: editFirstName,
        last_name: editLastName,
        mobile: editMobile,
        address: editAddress,
        about: editAbout
      });

      if (profileResponse.success) {
        setCurrentUser(profileResponse.user);
        setProfileSuccessMsg(t("profile_update_success"));
      }
    } catch (err) {
      setProfileErrorMsg(err.response?.data?.message || t("profile_update_failed"));
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await updateProfileImage(file);
      if (response.success) {
        setCurrentUser((prev) => ({ ...prev, profile_image: response.profile_image }));
        setProfileSuccessMsg(t("profile_picture_success"));
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setProfileErrorMsg(t("profile_picture_failed"));
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      const response = await deleteChatRoom(roomId);
      if (response.success) {
        if (response.clearedOnly) {
          setMessages([]);
          refreshChatList();
        } else {
          setActiveRoom(null);
          setMessages([]);
          refreshChatList();
          setMobileActiveView("sidebar");
        }
      }
    } catch (err) {
      console.error("Room exit/clear failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await deleteMyAccount();
      if (response.success) {
        localStorage.clear();
        router.push("/login");
      }
    } catch (err) {
      console.error("Delete account failed:", err);
    }
  };

  const handleReadNotification = async (notifId) => {
    try {
      const response = await markNotificationAsRead(notifId);
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        refreshNotifications();
      }
    } catch (err) {
      console.error("Failed to read notification:", err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const response = await clearAllMyNotifications();
      if (response.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const handleDeleteNotification = async (notifId) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      await deleteNotificationsBatch([notifId]);
      refreshNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);
      refreshNotifications();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const getRoomPartner = (room) => {
    if (!room || room.is_group) return null;
    return room.members?.find((m) => m && Number(m.id) !== Number(currentUser?.id));
  };

  const getSelectableUsers = () => {
    const userMap = new Map();
    contacts.forEach((c) => {
      if (c && c.id && Number(c.id) !== Number(currentUser?.id)) {
        userMap.set(Number(c.id), c);
      }
    });
    chatList.forEach((chat) => {
      if (chat && !chat.is_group && chat.members) {
        chat.members.forEach((m) => {
          if (m && m.id && Number(m.id) !== Number(currentUser?.id)) {
            userMap.set(Number(m.id), m);
          }
        });
      }
    });
    return Array.from(userMap.values());
  };

  const selectableUsers = getSelectableUsers();

  if (loading) {
    return <SplashScreen message={t("splash_initializing", "Initializing MYCHATBOX workspace...")} />;
  }

  return (
    <div className="chat-app-shell h-[100dvh] min-h-0 bg-[#0f0e15] text-white flex font-sans overflow-hidden select-none">

      {statusTip && (
        <div
          style={{ backgroundColor: "#7c5dfa", color: "#ffffff" }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] backdrop-blur-md !text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border border-white/20 transition-all animate-bounce max-w-[90vw] sm:max-w-md w-max"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping shrink-0"></span>
          <span className="truncate" style={{ color: "#ffffff" }}>{statusTip}</span>
        </div>
      )}

      <div className="absolute w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] lg:w-[600px] lg:h-[600px] rounded-full bg-[#7c5dfa]/5 blur-[120px] sm:blur-[160px] -top-12 -left-12 pointer-events-none"></div>

      <ChatSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        initialSettingsView={initialSettingsView}
        chatFilter={chatFilter}
        setChatFilter={setChatFilter}
        currentUser={currentUser}
        chatList={chatList}
        contacts={contacts}
        refreshContacts={refreshContacts}
        refreshChatList={refreshChatList}
        activeRoom={activeRoom}
        handleSelectRoom={handleSelectRoom}
        handleStartPersonalChat={handleStartPersonalChat}
        notifications={notifications}
        setNotifications={setNotifications}
        handleClearNotifications={handleClearNotifications}
        handleReadNotification={handleReadNotification}
        handleDeleteNotification={handleDeleteNotification}
        editFirstName={editFirstName}
        setEditFirstName={setEditFirstName}
        editLastName={editLastName}
        setEditLastName={setEditLastName}
        editMobile={editMobile}
        setEditMobile={setEditMobile}
        editAddress={editAddress}
        setEditAddress={setEditAddress}
        editAbout={editAbout}
        setEditAbout={setEditAbout}
        profileSuccessMsg={profileSuccessMsg}
        setProfileSuccessMsg={setProfileSuccessMsg}
        profileErrorMsg={profileErrorMsg}
        setProfileErrorMsg={setProfileErrorMsg}
        handleUpdateProfile={handleUpdateProfile}
        handleProfileImageChange={handleProfileImageChange}
        handleDeleteAccount={handleDeleteAccount}
        handleLogout={handleLogout}
        isGroupModalOpen={isGroupModalOpen}
        setIsGroupModalOpen={setIsGroupModalOpen}
        groupName={groupName}
        setGroupName={setGroupName}
        selectedGroupMembers={selectedGroupMembers}
        setSelectedGroupMembers={setSelectedGroupMembers}
        handleCreateGroup={handleCreateGroup}
        profileImageInputRef={profileImageInputRef}
        getRoomPartner={getRoomPartner}
        mobileActiveView={mobileActiveView}
        setMobileActiveView={setMobileActiveView}
        chatWallpaper={chatWallpaper}
        setChatWallpaper={setChatWallpaper}
        chatThemeColor={chatThemeColor}
        setChatThemeColor={setChatThemeColor}
        statusRefreshTrigger={statusRefreshTrigger}
        directoryUsers={directoryUsers}
        directorySearch={directorySearch}
        handleDirectorySearch={handleDirectorySearch}
        disappearingDuration={disappearingDuration}
        setDisappearingDuration={setDisappearingDuration}
        fontSize={fontSize}
        setFontSize={setFontSize}
        statusTip={statusTip}
        setStatusTip={setStatusTip}
      />

      <BlankScreen
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        messages={messages}
        setMessages={setMessages}
        roomLoading={roomLoading}
        messageText={messageText}
        setMessageText={setMessageText}
        handleInputChange={handleInputChange}
        handleSendMessage={handleSendMessage}
        refreshContacts={refreshContacts}
        isTypingPartner={isTypingPartner}
        typingPartnerName={typingPartnerName}
        editingMessageId={editingMessageId}
        setEditingMessageId={setEditingMessageId}
        editingMessageText={editingMessageText}
        setEditingMessageText={setEditingMessageText}
        handleSaveMessageEdit={handleSaveMessageEdit}
        handleDeleteMessage={handleDeleteMessage}
        handleFileUpload={handleFileUpload}
        attachmentLoading={attachmentLoading}
        fileInputRef={fileInputRef}
        handleDeleteRoom={handleDeleteRoom}
        setMobileActiveView={setMobileActiveView}
        leaveChatRoomSocket={leaveChatRoomSocket}
        messagesEndRef={messagesEndRef}
        chatList={chatList}
        mobileActiveView={mobileActiveView}
        refreshChatList={refreshChatList}
        selectableUsers={selectableUsers}
        chatWallpaper={chatWallpaper}
        chatThemeColor={chatThemeColor}
        contacts={contacts}
        refreshMessages={refreshMessages}
        isMessageDeleteMode={isMessageDeleteMode}
        setIsMessageDeleteMode={setIsMessageDeleteMode}
        selectedMessageIds={selectedMessageIds}
        setSelectedMessageIds={setSelectedMessageIds}
        handleDeleteMultipleMessages={handleDeleteMultipleMessages}
        setIsGroupModalOpen={setIsGroupModalOpen}
        disappearingDuration={disappearingDuration}
        setDisappearingDuration={setDisappearingDuration}
        groupName={groupName}
        setGroupName={setGroupName}
        selectedGroupMembers={selectedGroupMembers}
        setSelectedGroupMembers={setSelectedGroupMembers}
      />

      {isGroupModalOpen && (
        (() => {
          const isLight = typeof window !== "undefined" && (document.documentElement.classList.contains("light") || localStorage.getItem("theme") === "light");
          const isAddMemberMode = Boolean(activeRoom && (activeRoom.is_group || activeRoom.is_community) && !groupName);
          const modalTitle = groupName.startsWith("Copy of ")
            ? t("create_similar_group", "Create Similar Group")
            : isAddMemberMode
              ? `${t("add_members_to", "Add Members to")} ${activeRoom.name}`
              : t("create_new_group", "Create New Group");

          return (
            <div
              className="fixed inset-0 z-[350] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setIsGroupModalOpen(false)}
            >
              <div
                className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border transition-all ${isLight ? "bg-white text-gray-900 border-gray-200" : "bg-[#161421] text-white border-white/10"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isLight ? "border-gray-200 bg-gray-50" : "border-white/5 bg-[#1f1d2c]"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#7c5dfa]/15 text-[#7c5dfa] flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{modalTitle}</h3>
                      <p className={`text-[10px] ${isLight ? "text-gray-500" : "text-white/40"}`}>
                        {isAddMemberMode ? t("select_users_to_add", "Select users to add into this group") : t("configure_group_name_desc", "Configure group name and select members")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(false)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? "hover:bg-gray-200 text-gray-600" : "hover:bg-white/10 text-white/70"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 no-scrollbar">
                  {!isAddMemberMode && (
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-gray-500" : "text-white/40"}`}>
                        {t("group_name_label", "Group Name")}
                      </label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder={t("enter_group_name_ph", "Enter group name...")}
                        className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all ${isLight ? "bg-gray-100 text-gray-900 border border-gray-300 focus:border-[#7c5dfa]" : "bg-[#201d2d] text-white border border-white/10 focus:border-[#7c5dfa]"}`}
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-gray-500" : "text-white/40"}`}>
                        {t("select_members_label", "Select Members")} ({selectedGroupMembers.length})
                      </label>
                      {selectedGroupMembers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedGroupMembers([])}
                          className="text-[10px] text-red-400 font-bold hover:underline"
                        >
                          {t("deselect_all", "Deselect All")}
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 p-3 rounded-2xl bg-black/10 border border-white/5 flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder={t("quick_add_input_placeholder", "Enter student mobile or email directly...")}
                        id="quickAddInput"
                        className={`flex-1 px-3 py-2 text-xs rounded-xl focus:outline-none transition-all ${isLight ? "bg-white text-gray-900 border border-gray-300 focus:border-[#7c5dfa]" : "bg-[#201d2d] text-white border border-white/10 focus:border-[#7c5dfa]"}`}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const input = document.getElementById("quickAddInput");
                          const val = input ? input.value.trim() : "";
                          if (!val) return;
                          try {
                            const res = await searchUsersInDirectory(val);
                            if (res && res.success && res.users && res.users.length > 0) {
                              const foundUser = res.users[0];
                              setDirectoryUsers(prev => {
                                const exists = (prev || []).some(u => Number(u.id) === Number(foundUser.id));
                                return exists ? prev : [...(prev || []), foundUser];
                              });
                              setSelectedGroupMembers(prev => {
                                const exists = (prev || []).includes(Number(foundUser.id));
                                return exists ? prev : [...(prev || []), Number(foundUser.id)];
                              });
                              setStatusTip(`Added ${foundUser.first_name} to selected members.`);
                              if (input) input.value = "";
                            } else {
                              setStatusTip("No registered user found with that mobile/email.");
                            }
                          } catch (err) {
                            console.error("Quick add failed:", err);
                            setStatusTip("Error searching for user.");
                          }
                        }}
                        className="p-2 bg-[#7c5dfa] hover:bg-[#684ce2] text-white rounded-xl transition-all cursor-pointer border-none flex items-center justify-center shrink-0"
                        title={t("quick_add_title", "Add to selection")}
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isLight ? "text-gray-400" : "text-white/30"}`} />
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={async (e) => {
                          const val = e.target.value;
                          setMemberSearchQuery(val);
                          if (val.trim()) {
                            try {
                              const searchRes = await searchUsersInDirectory(val);
                              if (searchRes && searchRes.success && searchRes.users) {
                                setDirectoryUsers((prev) => {
                                  const existingIds = new Set((prev || []).map(u => Number(u.id)));
                                  const newUsers = searchRes.users.filter(u => !existingIds.has(Number(u.id)));
                                  return [...(prev || []), ...newUsers];
                                });
                              }
                            } catch (err) {
                              console.error("Directory search failed in modal:", err);
                            }
                          }
                        }}
                        placeholder={t("search_name_mobile_ph", "Search name or mobile no. (e.g. 9876543210)...")}
                        className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl focus:outline-none transition-all ${isLight ? "bg-gray-100 text-gray-900 border border-gray-300 focus:border-[#7c5dfa]" : "bg-[#201d2d] text-white border border-white/10 focus:border-[#7c5dfa]"}`}
                      />
                      {memberSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setMemberSearchQuery("")}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${isLight ? "text-gray-400 hover:text-gray-700" : "text-white/40 hover:text-white"}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className={`divide-y max-h-[280px] overflow-y-auto rounded-2xl border ${isLight ? "bg-gray-50 border-gray-200 divide-gray-200/80" : "bg-[#1c1a29]/60 border-white/5 divide-white/5"}`}>
                      {(() => {
                        const userMap = new Map();
                        (contacts || []).forEach((c) => {
                          if (c && c.id && Number(c.id) !== Number(currentUser?.id)) userMap.set(Number(c.id), c);
                        });
                        (chatList || []).forEach((chat) => {
                          if (chat && !chat.is_group && chat.members) {
                            chat.members.forEach((m) => {
                              if (m && m.id && Number(m.id) !== Number(currentUser?.id)) userMap.set(Number(m.id), m);
                            });
                          }
                        });
                        (directoryUsers || []).forEach((d) => {
                          if (d && d.id && Number(d.id) !== Number(currentUser?.id) && !userMap.has(Number(d.id))) {
                            userMap.set(Number(d.id), d);
                          }
                        });

                        let filteredList = Array.from(userMap.values());
                        if (memberSearchQuery && memberSearchQuery.trim()) {
                          const q = memberSearchQuery.toLowerCase().trim();
                          filteredList = filteredList.filter((u) => {
                            const fn = (u.first_name || "").toLowerCase();
                            const ln = (u.last_name || "").toLowerCase();
                            const mob = (u.mobile || "").toLowerCase();
                            const em = (u.email || "").toLowerCase();
                            return fn.includes(q) || ln.includes(q) || mob.includes(q) || em.includes(q);
                          });
                        }

                        if (filteredList.length === 0) {
                          return (
                            <div className="py-8 text-center text-xs opacity-50 px-4">
                              {t("no_user_found_matching", 'No user found matching "{query}".').replace("{query}", memberSearchQuery)}
                            </div>
                          );
                        }

                        return filteredList.map((user) => {
                          if (!user) return null;
                          const isChecked = selectedGroupMembers.includes(Number(user.id));
                          const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();

                          return (
                            <div
                              key={user.id}
                              onClick={() => toggleGroupMemberSelection(Number(user.id))}
                              className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${isLight ? "hover:bg-gray-100" : "hover:bg-white/5"} ${isChecked ? (isLight ? "bg-[#7c5dfa]/10" : "bg-[#7c5dfa]/15") : ""}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${isLight ? "bg-gray-200 text-gray-800 border-gray-300" : "bg-[#2c283d] text-white border-white/10"}`}>
                                  {user.profile_image ? (
                                    <img src={user.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                                  ) : initials}
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-xs font-bold truncate ${isLight ? "text-gray-900" : "text-white"}`}>
                                    {user.first_name} {user.last_name}
                                  </p>
                                  <p className={`text-[10px] truncate ${isLight ? "text-gray-500" : "text-white/40"}`}>
                                    {user.mobile ? `+${user.mobile}` : user.email}
                                  </p>
                                </div>
                              </div>

                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isChecked ? "bg-[#7c5dfa] border-[#7c5dfa] text-white" : isLight ? "border-gray-400 bg-white" : "border-white/20 bg-white/5"}`}>
                                {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                <div className={`p-4 border-t flex items-center justify-between gap-3 ${isLight ? "border-gray-200 bg-gray-50" : "border-white/5 bg-[#1f1d2c]"}`}>
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isLight ? "bg-gray-200 hover:bg-gray-300 text-gray-700" : "bg-white/5 hover:bg-white/10 text-white/70"}`}
                  >
                    {t("cancel", "Cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={isAddMemberMode ? selectedGroupMembers.length === 0 : (!groupName.trim() || selectedGroupMembers.length === 0)}
                    onClick={async () => {
                      if (isAddMemberMode) {
                        try {
                          for (const mId of selectedGroupMembers) {
                            await addMemberToGroup(activeRoom.id, mId);
                          }
                          setIsGroupModalOpen(false);
                          setSelectedGroupMembers([]);
                          refreshMessages();
                          refreshChatList();
                        } catch (err) {
                          console.error("Failed to add members:", err);
                        }
                      } else {
                        const created = await handleCreateGroup();
                        if (created) {
                          setIsGroupModalOpen(false);
                          setActiveTab("chats");
                          setMobileActiveView("chatpane");
                        }
                      }
                    }}
                    className="flex-1 py-2.5 bg-[#7c5dfa] hover:bg-[#684ce2] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isAddMemberMode ? t("add_members", "Add Members") : t("create_group", "Create Group")}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

    </div>
  );
}
