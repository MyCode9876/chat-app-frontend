"use client";

import { useTranslation } from "./i18n";
import defaultWallpaper from "../public/wllapers.png";
import { useState, useEffect, useRef } from "react";
// const defaultWallpaper = { src: "/wllapers.png" };
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });
import { Send, Paperclip, Smile, MoreVertical, ArrowLeft, ChevronRight, CheckCheck, Trash2, Edit, FileText, MessageSquare, Mic, Laptop, Smartphone, Check, Lock, QrCode, X, Plus, UserPlus, Settings, Camera, Users, Pin, BarChart2, Bell, User, Globe, Mail, Calendar, Phone, MapPin, Shield, AlertTriangle, Download, Star, Reply, Forward, Menu, Search, SmileIcon, Edit2, Clock, Clock1, List, Heart, LogOut, ThumbsDown, Edit3, Crown } from "lucide-react";

import {
  renameGroup,
  uploadGroupImage,
  addMemberToGroup,
  getGroupMembers,
  saveContact,
  pinChatRoom,
  blockUser,
  deleteChatRoom,
  inviteCommunityMember,
  removeMemberFromGroup,
  removeMemberFromCommunity,
  reportChatRoom,
  updateGroupPermissions,
  updateMemberRole,
  createGroupInCommunity,
  linkGroupToCommunity,
  unlinkGroupFromCommunity,
  getPendingRequests,
  handleJoinRequest,
  searchUsersInDirectory
} from "../services/chat";
import { pinChatMessage, voteInPoll, sendChatMessage, clearChatRoomMessages, deleteMultipleMessages, starChatMessage, uploadAttachmentFile } from "../services/message";
import { sendStarFeedback } from "../services/auth";

const isOnlyEmojis = (str) => {
  if (!str) return false;
  const cleanStr = str.replace(/\s+/g, "");
  if (!cleanStr) return false;
  const emojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|[\u2194-\u2199\u21a9-\u21aa\u25b6\u25c0\u2600-\u26ff\u3030\u303d\u3297\u3299]|\u200d)+$/;
  return emojiRegex.test(cleanStr);
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const getDateSeparatorText = (date, t) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(messageDate, today)) {
    return t ? t("today") : "Today";
  } else if (isSameDay(messageDate, yesterday)) {
    return t ? t("yesterday") : "Yesterday";
  } else {
    return messageDate.toLocaleDateString([], {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
};

const getPollHighlightColor = (hexColor) => {
  if (!hexColor) return "#c4b5fd";
  const c = hexColor.toLowerCase();
  if (c.includes("ec4899") || c.includes("db2777") || c.includes("f43f5e") || c.includes("pink") || c.includes("rose")) {
    return "#fabadeff"; // Light Pink
  }
  if (c.includes("3b82f6") || c.includes("0ea5e9") || c.includes("0284c7") || c.includes("06b6d4") || c.includes("14b8a6") || c.includes("blue") || c.includes("sky") || c.includes("azure") || c.includes("cyan") || c.includes("teal")) {
    return "#7deaf1ff"; // Light Sky / Cyan / Azure Blue
  }
  if (c.includes("059669") || c.includes("10b981") || c.includes("22c55e") || c.includes("emerald") || c.includes("green")) {
    return "#86efac"; // Light Mint Green
  }
  if (c.includes("f97316") || c.includes("eab308") || c.includes("orange") || c.includes("gold") || c.includes("amber")) {
    return "#fde047"; // Light Yellow/Gold
  }
  if (c.includes("indigo") || c.includes("4f46e5")) {
    return "#a5b4fc"; // Light Indigo
  }
  return "#c4b5fd"; // Default Light Lavender
};

const SENDER_PALETTE = [
  "#f87171", // Vibrant Pink-Red
  "#fb923c", // Sunset Orange
  "#fbbf24", // Warm Amber
  "#34d399", // Emerald Green
  "#2dd4bf", // Teal Blue
  "#60a5fa", // Sky Blue
  "#818cf8", // Indigo Blue
  "#c084fc", // Orchid Purple
  "#f472b6", // Pastel Pink
  "#22c55e", // Kelly Green
  "#06b6d4", // Cyan
  "#f43f5e"  // Crimson Pink
];

const getSenderNameColor = (senderId, name) => {
  const idNum = Number(senderId) || 0;
  let hash = idNum;
  if (!hash && name) {
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
  }
  const idx = Math.abs(hash) % SENDER_PALETTE.length;
  return SENDER_PALETTE[idx];
};

export default function BlankScreen({ activeRoom, setActiveRoom, setActiveTab, currentUser, messages, setMessages, roomLoading, messageText, setMessageText, handleInputChange, handleSendMessage, isTypingPartner, typingPartnerName, editingMessageId, setEditingMessageId, editingMessageText, setEditingMessageText, handleSaveMessageEdit, handleDeleteMessage, handleFileUpload, attachmentLoading, fileInputRef, handleDeleteRoom, setMobileActiveView, leaveChatRoomSocket,
  messagesEndRef, chatList, mobileActiveView, refreshChatList, selectableUsers, chatWallpaper, chatThemeColor, setSettingsView, contacts,
  isMessageDeleteMode, setIsMessageDeleteMode, selectedMessageIds, setSelectedMessageIds, handleDeleteMultipleMessages, setIsGroupModalOpen, disappearingDuration, setDisappearingDuration, groupName, setGroupName, selectedGroupMembers, setSelectedGroupMembers
}) {
  const { t } = useTranslation();
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);
  const [isFeedbackPanelOpen, setIsFeedbackPanelOpen] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [starHover, setStarHover] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    const handleOpenFeedback = () => {
      setIsFeedbackPanelOpen(true);
      setFeedbackSuccess(false);
    };
    window.addEventListener("openStarFeedbackModal", handleOpenFeedback);
    if (typeof window !== "undefined") {
      const showDirectly = localStorage.getItem("show_feedback_directly");
      if (showDirectly === "true") {
        localStorage.removeItem("show_feedback_directly");
        setIsFeedbackPanelOpen(true);
        setFeedbackSuccess(false);
      }
    }

    return () => {
      window.removeEventListener("openStarFeedbackModal", handleOpenFeedback);
    };
  }, []);

  const [isLight, setIsLight] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("light") || localStorage.getItem("theme") === "light";
    }
    return false;
  });

  useEffect(() => {
    const checkTheme = () => {
      const light = document.documentElement.classList.contains("light") || localStorage.getItem("theme") === "light";
      setIsLight(light);
    };
    checkTheme();
    window.addEventListener("themeChanged", checkTheme);
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.removeEventListener("themeChanged", checkTheme);
      observer.disconnect();
    };
  }, []);

  const clearedAtStr = typeof window !== "undefined" ? localStorage.getItem(`cleared_at_${currentUser?.id}_${activeRoom?.id}`) : null;
  const clearedTime = clearedAtStr ? new Date(clearedAtStr).getTime() : 0;

  const [deletedForMeIds, setDeletedForMeIds] = useState([]);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardSearch, setForwardSearch] = useState("");
  const [selectedForwardRoomIds, setSelectedForwardRoomIds] = useState([]);
  const [isSearchMessagesOpen, setIsSearchMessagesOpen] = useState(false);
  const [searchMessageQuery, setSearchMessageQuery] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDeleted = localStorage.getItem("deleted_for_me_messages");
      if (storedDeleted) {
        try { setDeletedForMeIds(JSON.parse(storedDeleted)); } catch (e) { }
      }
    }
  }, [activeRoom?.id]);

  let disappearingTimeLimit = 0;
  if (disappearingDuration && disappearingDuration !== "off" && disappearingDuration !== "Off") {
    const now = Date.now();
    let ms = 0;
    const dur = String(disappearingDuration).toLowerCase();
    if (dur.includes("24h") || dur.includes("24 hour")) ms = 24 * 60 * 60 * 1000;
    else if (dur.includes("7d") || dur.includes("7 day")) ms = 7 * 24 * 60 * 60 * 1000;
    else if (dur.includes("90d") || dur.includes("90 day")) ms = 90 * 24 * 60 * 60 * 1000;
    else if (!isNaN(Number(disappearingDuration)) && Number(disappearingDuration) > 0) ms = Number(disappearingDuration) * 1000;
    if (ms > 0) disappearingTimeLimit = now - ms;
  }

  const visibleMessages = (messages || []).filter(m => {
    const msgTime = new Date(m.created_at).getTime();
    if (msgTime <= clearedTime) return false;
    if (disappearingTimeLimit > 0 && msgTime < disappearingTimeLimit) return false;
    if (deletedForMeIds.includes(m.id)) return false;
    if (searchMessageQuery && searchMessageQuery.trim() !== "") {
      const q = searchMessageQuery.toLowerCase();
      const text = (m.message_text || "").toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const [showContactInfo, setShowContactInfo] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({}); // { [msgId]: progressPercent }
  const [isLargeAvatarOpen, setIsLargeAvatarOpen] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  const [isEditingTitleInline, setIsEditingTitleInline] = useState(false);
  const [inlineTitleText, setInlineTitleText] = useState("");
  const [isEditingAboutInline, setIsEditingAboutInline] = useState(false);
  const [inlineAboutText, setInlineAboutText] = useState("");
  const [disappearingMode, setDisappearingMode] = useState("Off");
  const [isDisappearingDropdownOpen, setIsDisappearingDropdownOpen] = useState(false);
  const [isGroupSendDropdownOpen, setIsGroupSendDropdownOpen] = useState(false);
  const [isMemberChangesModalOpen, setIsMemberChangesModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalTab, setMediaModalTab] = useState("all");


  const [adminOnlySendState, setAdminOnlySendState] = useState(false);

  const [isCommunityGroupManagerOpen, setIsCommunityGroupManagerOpen] = useState(false);
  const [newSubGroupName, setNewSubGroupName] = useState("");
  const [newSubGroupOnlyAdminsSend, setNewSubGroupOnlyAdminsSend] = useState(false);
  const [selectedSubGroupMembers, setSelectedSubGroupMembers] = useState([]);
  const [subGroupManagerTab, setSubGroupManagerTab] = useState("list");
  const [subGroupMemberQuery, setSubGroupMemberQuery] = useState("");
  const [subGroupSearchResults, setSubGroupSearchResults] = useState([]);

  const [communityRequests, setCommunityRequests] = useState([]);

  const isUserCreatorTop = activeRoom && Number(activeRoom.created_by) === Number(currentUser?.id);
  const isUserSecondaryAdminTop = activeRoom && currentUser && (activeRoom.admins || []).map(Number).includes(Number(currentUser.id));
  const isUserAnyAdminTop = isUserCreatorTop || isUserSecondaryAdminTop;

  const fetchCommunityRequests = async () => {
    if (!activeRoom?.is_community) return;
    try {
      const res = await getPendingRequests(activeRoom.id);
      if (res && res.success) {
        setCommunityRequests(res.requests || []);
      }
    } catch (err) {
      console.error("Failed to load community join requests:", err);
    }
  };

  useEffect(() => {
    if (activeRoom?.is_community && isUserAnyAdminTop) {
      fetchCommunityRequests();
    } else {
      setCommunityRequests([]);
    }
  }, [activeRoom, isUserAnyAdminTop]);

  useEffect(() => {
    setShowContactInfo(false);
    setIsEditingTitleInline(false);
    setIsEditingAboutInline(false);
    if (activeRoom) {
      const savedMode = localStorage.getItem(`disappearing_${activeRoom.id}`) || disappearingDuration || "Off";
      setDisappearingMode(savedMode);
      const savedAdminOnly = localStorage.getItem(`only_admin_send_${activeRoom.id}`);
      if (savedAdminOnly === "true") {
        setAdminOnlySendState(true);
      } else if (savedAdminOnly === "false") {
        setAdminOnlySendState(false);
      } else {
        setAdminOnlySendState(activeRoom.only_admins_send === true);
      }
    }
  }, [activeRoom?.id, activeRoom?.only_admins_send, disappearingDuration]);

  useEffect(() => {
    const handleStorageSync = () => {
      if (activeRoom) {
        const savedAdminOnly = localStorage.getItem(`only_admin_send_${activeRoom.id}`);
        if (savedAdminOnly === "true") {
          setAdminOnlySendState(true);
        } else if (savedAdminOnly === "false") {
          setAdminOnlySendState(false);
        } else {
          setAdminOnlySendState(activeRoom.only_admins_send === true);
        }
      }
    };
    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, [activeRoom?.id]);

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: null,
  });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState("");
  const videoRef = useRef(null);

  const [isContactSharingOpen, setIsContactSharingOpen] = useState(false);
  const [selectedContactToShare, setSelectedContactToShare] = useState(null);
  const [isPollCreationOpen, setIsPollCreationOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollView, setPollView] = useState("create"); // "create" or "settings"
  const [anonymousVoting, setAnonymousVoting] = useState(false);
  const [allowMultipleOptions, setAllowMultipleOptions] = useState(false);
  const [participantsAddOptions, setParticipantsAddOptions] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [pollDuration, setPollDuration] = useState("30 min");
  const [reminderActive, setReminderActive] = useState(false);

  const [selectedRecipientRoomIds, setSelectedRecipientRoomIds] = useState([]);
  const [isEventCreationOpen, setIsEventCreationOpen] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [activeEmojiField, setActiveEmojiField] = useState(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    if (isPollCreationOpen || isEventCreationOpen) {
      if (activeRoom) {
        setSelectedRecipientRoomIds([activeRoom.id]);
      } else {
        setSelectedRecipientRoomIds([]);
      }
    }
  }, [isPollCreationOpen, isEventCreationOpen, activeRoom]);


  const fetchGroupMembers = async (roomId = activeRoom?.id) => {
    if (!roomId) return;
    try {
      const res = await getGroupMembers(roomId);
      if (res) {
        if (Array.isArray(res)) {
          setGroupMembers(res);
        } else if (res.members && Array.isArray(res.members)) {
          setGroupMembers(res.members);
        } else if (res.data && Array.isArray(res.data)) {
          setGroupMembers(res.data);
        }
      }
    } catch (err) {
      console.error("Failed to load group members:", err);
    }
  };

  useEffect(() => {
    if (activeRoom && (activeRoom.is_group || activeRoom.is_community)) {
      fetchGroupMembers(activeRoom.id);
    } else {
      setGroupMembers([]);
    }

    const handleRefreshMembers = () => {
      if (activeRoom && (activeRoom.is_group || activeRoom.is_community)) {
        fetchGroupMembers(activeRoom.id);
      }
    };

    window.addEventListener("refreshGroupMembers", handleRefreshMembers);
    return () => {
      window.removeEventListener("refreshGroupMembers", handleRefreshMembers);
    };
  }, [activeRoom?.id, activeRoom?.members]);

  useEffect(() => {
    if (!activeRoom || !messages || messages.length === 0) return;

    const unvotedPolls = messages.filter(
      (m) => m.attachment_type === "poll" && (m.my_vote === null || m.my_vote === undefined)
    );

    if (unvotedPolls.length === 0) return;

    const interval = setInterval(() => {
      setStatusTip(t("poll_reminder_please_vote") || "Reminder: Please select an option and vote in the active poll!");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("add_poll_notification", {
          detail: {
            room_id: activeRoom.id,
            message_text: unvotedPolls[0]?.message_text || "Please select an option and vote in active poll!"
          }
        }));
      }
    }, 1800000);

    return () => clearInterval(interval);
  }, [messages, activeRoom?.id]);


  const [archivedRoomIds, setArchivedRoomIds] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pref_archivedRoomIds");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const isArchived = activeRoom && archivedRoomIds.includes(Number(activeRoom.id));

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem("pref_archivedRoomIds");
      setArchivedRoomIds(saved ? JSON.parse(saved) : []);
    };
    window.addEventListener("storage_archived_rooms", handleSync);
    return () => window.removeEventListener("storage_archived_rooms", handleSync);
  }, []);

  const handleToggleArchiveActiveRoom = () => {
    if (!activeRoom) return;
    const roomId = Number(activeRoom.id);
    let newArchived = [...archivedRoomIds];
    if (newArchived.includes(roomId)) {
      newArchived = newArchived.filter(id => id !== roomId);
      setStatusTip(t("chat_unarchived_desc") || "Chat unarchived");
    } else {
      newArchived.push(roomId);
      setStatusTip(t("chat_archived_desc") || "Chat archived");
    }
    setArchivedRoomIds(newArchived);
    localStorage.setItem("pref_archivedRoomIds", JSON.stringify(newArchived));
    window.dispatchEvent(new Event("storage_archived_rooms"));
    setIsHeaderMenuOpen(false);
    if (newArchived.includes(roomId)) {
      setActiveRoom(null);
    }
  };

  const [activeMsgMenuId, setActiveMsgMenuId] = useState(null);
  const [preEditingText, setPreEditingText] = useState("");

  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isReminderMenuOpen, setIsReminderMenuOpen] = useState(false);
  const reminderMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (reminderMenuRef.current && !reminderMenuRef.current.contains(e.target)) {
        setIsReminderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupSettingsTab, setGroupSettingsTab] = useState("info"); // "info" or "members"
  const [editGroupName, setEditGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [editGroupAbout, setEditGroupAbout] = useState("");
  const [editGroupTheme, setEditGroupTheme] = useState(null);
  const [currentGroupAdmins, setCurrentGroupAdmins] = useState([]);

  useEffect(() => {
    if (activeRoom) {
      if (activeRoom.is_group || activeRoom.is_community) {
        setEditGroupAbout(localStorage.getItem(`group_about_${activeRoom.id}`) || "Welcome to our group!");
        setEditGroupTheme(localStorage.getItem(`group_theme_${activeRoom.id}`) || localStorage.getItem(`room_theme_${activeRoom.id}`) || null);
        setEditGroupName(activeRoom.name || "");
        const secondaryAdminsList = JSON.parse(localStorage.getItem(`group_admins_${activeRoom.id}`) || "[]");
        setCurrentGroupAdmins(secondaryAdminsList.map(Number));
      } else {
        setEditGroupTheme(localStorage.getItem(`room_theme_${activeRoom.id}`) || null);
        setCurrentGroupAdmins([]);
      }
    }
  }, [activeRoom?.id]);

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [emojiPanelTab, setEmojiPanelTab] = useState("emoji");
  const [statusTip, setStatusTip] = useState("");

  const [mutedRoomIds, setMutedRoomIds] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pref_mutedRoomIds");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const isMuted = activeRoom && mutedRoomIds.includes(Number(activeRoom.id));

  const handleToggleMuteActiveRoom = () => {
    if (!activeRoom) return;
    const roomId = Number(activeRoom.id);
    let newMuted = [...mutedRoomIds];
    if (newMuted.includes(roomId)) {
      newMuted = newMuted.filter(id => id !== roomId);
      setStatusTip(t("unmute_notifications") || "Notification unmuted");
    } else {
      newMuted.push(roomId);
      setStatusTip(t("mute_notifications") || "Notification muted");
    }
    setMutedRoomIds(newMuted);
    localStorage.setItem("pref_mutedRoomIds", JSON.stringify(newMuted));
    setIsHeaderMenuOpen(false);
  };

  const headerMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const groupImageInputRef = useRef(null);
  const docFileInputRef = useRef(null);
  const mediaFileInputRef = useRef(null);

  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (isLightboxOpen) {
      document.documentElement.classList.add("lightbox-active");
    } else {
      document.documentElement.classList.remove("lightbox-active");
    }
    return () => {
      document.documentElement.classList.remove("lightbox-active");
    };
  }, [isLightboxOpen]);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    if (pendingAttachments.length + fileArray.length > 15) {
      setStatusTip(t("max_files_limit", "You can only select up to 15 files."));
      return;
    }
    const newPending = fileArray.map(file => {
      return {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null
      };
    });
    setPendingAttachments(prev => [...prev, ...newPending]);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadAndSendDirectly(e.dataTransfer.files);
    }
  };
  const handleUploadAndSendDirectly = async (files) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    if (fileArray.length > 15) {
      setStatusTip(t("max_files_limit", "You can only select up to 15 files."));
      return;
    }

    setStatusTip(t("uploading_attachment", "Uploading attachment..."));
    try {
      if (fileArray.length > 1) {
        const urls = [];
        for (const file of fileArray) {
          const res = await uploadAttachmentFile(file);
          if (res.success && res.url) {
            urls.push(res.url);
          }
        }

        if (urls.length > 0) {
          const isAllImages = fileArray.every(f => f.type.startsWith("image/"));
          const payload = {
            room_id: activeRoom.id,
            message_text: `${urls.length} Photos`,
            attachment_url: JSON.stringify(urls),
            attachment_type: isAllImages ? "media_images" : "document"
          };
          await sendChatMessage(payload);
        }
      } else {
        const file = fileArray[0];
        const res = await uploadAttachmentFile(file);
        if (res.success) {
          const isImg = file.type.startsWith("image/");
          const payload = {
            room_id: activeRoom.id,
            message_text: file.name,
            attachment_url: res.url,
            attachment_type: isImg ? "image" : "document",
            file_size: file.size
          };
          await sendChatMessage(payload);
        }
      }
      if (refreshMessages) await refreshMessages();
      if (refreshChatList) await refreshChatList();
    } catch (err) {
      console.error("Failed to upload and send attachments directly:", err);
      setStatusTip(t("upload_failed", "Failed to upload file."));
    }
  };

  const handleUploadAndSend = async (e) => {
    if (e) e.preventDefault();
    if (pendingAttachments.length === 0) return;

    setStatusTip(t("uploading_attachment", "Uploading attachment..."));
    const hasAnyHd = pendingAttachments.some(x => x.isHd);
    const filesToUpload = pendingAttachments.map(x => x.file);
    const typedText = messageText.trim();
    setMessageText("");
    setPendingAttachments([]);
    try {
      if (filesToUpload.length > 1) {
        const urls = [];
        for (const file of filesToUpload) {
          const res = await uploadAttachmentFile(file);
          if (res.success && res.url) {
            urls.push(res.url);
          }
        }

        if (urls.length > 0) {
          const isAllImages = filesToUpload.every(f => f.type.startsWith("image/"));
          let finalMsgText = typedText || `${urls.length} Photos`;
          if (hasAnyHd) {
            finalMsgText += " \u200Bhd\u200B";
          }
          const payload = {
            room_id: activeRoom.id,
            message_text: finalMsgText,
            attachment_url: JSON.stringify(urls),
            attachment_type: isAllImages ? "media_images" : "document"
          };
          await sendChatMessage(payload);
        }
      } else {
        const file = filesToUpload[0];
        const res = await uploadAttachmentFile(file);
        if (res.success) {
          const isImg = file.type.startsWith("image/");
          let finalMsgText = typedText || file.name;
          if (hasAnyHd) {
            finalMsgText += " \u200Bhd\u200B";
          }
          const payload = {
            room_id: activeRoom.id,
            message_text: finalMsgText,
            attachment_url: res.url,
            attachment_type: isImg ? "image" : "document",
            file_size: file.size
          };
          await sendChatMessage(payload);
        }
      }
      if (refreshMessages) await refreshMessages();
      if (refreshChatList) await refreshChatList();
    } catch (err) {
      console.error("Failed to upload and send attachments:", err);
      setStatusTip(t("upload_failed", "Failed to upload file."));
    }
  };

  const openLightbox = (images, index = 0) => {
    setLightboxImages(Array.isArray(images) ? images : [images]);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadFile = (msgId, url, fileName) => {
    if (downloadProgress[msgId] !== undefined) return;

    let current = 0;
    setDownloadProgress(prev => ({ ...prev, [msgId]: 0 }));

    const interval = setInterval(() => {
      current += 10;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        downloadAttachmentBlob(url, fileName);

        setTimeout(() => {
          setDownloadProgress(prev => {
            const copy = { ...prev };
            delete copy[msgId];
            return copy;
          });
        }, 800);
      }
      setDownloadProgress(prev => ({ ...prev, [msgId]: current }));
    }, 120);
  };

  const downloadAttachmentBlob = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || url.split("/").pop() || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Failed to download blob direct:", e);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderDocumentCard = (msg, isOwn, isLight) => {
    const url = msg.attachment_url || "";
    const fileName = (msg.message_text && !msg.message_text.startsWith("http") && !msg.message_text.startsWith("{"))
      ? msg.message_text
      : (url.split("/").pop() || "document");

    let ext = "DOC";
    if (url && url.includes(".")) {
      const parts = url.split(".");
      ext = parts[parts.length - 1].split("?")[0].toLowerCase();
    } else if (msg.attachment_type) {
      ext = msg.attachment_type.toLowerCase();
    }
    if (ext.length > 5) ext = "DOC";

    const sizeText = msg.file_size ? formatFileSize(msg.file_size) : (msg.size_text || "");
    const subText = sizeText ? `${sizeText} · ${ext.toUpperCase()}` : ext.toUpperCase();

    let badgeBg = "bg-[#607d8b]";
    if (ext === "zip" || ext === "rar" || ext === "7z") badgeBg = "bg-[#54656f]";
    else if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "svg" || ext === "webp") badgeBg = "bg-[#607d8b]";
    else if (ext === "pdf") badgeBg = "bg-[#e53935]";
    else if (ext === "doc" || ext === "docx") badgeBg = "bg-[#1e88e5]";

    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDownloadFile(msg.id, url, fileName);
        }}
        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all select-none border my-1 max-w-xs sm:max-w-sm ${isLight
          ? "bg-black/[0.03] hover:bg-black/[0.06] border-black/10 text-gray-900 shadow-xs backdrop-blur-md"
          : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white backdrop-blur-md"
          }`}
      >
        <div className={`w-11 h-12 ${badgeBg} rounded-lg flex flex-col items-center justify-center text-white shrink-0 relative shadow-sm overflow-hidden`}>
          <div className="absolute top-0 right-0 w-3 h-3 bg-black/25 rounded-bl-xs pointer-events-none" />
          <span className="text-[10px] font-black tracking-tight uppercase font-sans px-1 text-center truncate w-full">
            {ext.toUpperCase()}
          </span>
        </div>

        <div className="min-w-0 flex-1 text-left">
          <h4 className={`text-xs font-semibold truncate leading-snug ${isOwn ? "text-white" : isLight ? "text-gray-900" : "text-white"}`}>
            {fileName}
          </h4>
          <p className={`text-[10px] font-medium mt-0.5 ${isOwn ? "text-white/70" : isLight ? "text-gray-500" : "text-white/50"}`}>
            {subText}
          </p>
        </div>

        {downloadProgress[msg.id] !== undefined ? (
          <div className="relative w-7 h-7 flex items-center justify-center shrink-0 select-none">
            <svg className="absolute w-7 h-7 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)"} strokeWidth="3" />
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 12}
                strokeDashoffset={2 * Math.PI * 12 * (1 - downloadProgress[msg.id] / 100)}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>
            <span className="text-[7px] font-extrabold text-[#22c55e]">{downloadProgress[msg.id]}%</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDownloadFile(msg.id, url, fileName);
            }}
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${isOwn ? "hover:bg-white/20 text-white/80" : isLight ? "hover:bg-gray-200 text-gray-600" : "hover:bg-white/10 text-white/70"
              }`}
            title={t("download_tooltip")}
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  const renderImageGrid = (imagesList, onImageClick) => {
    const count = imagesList.length;
    if (count === 0) return null;

    const hasClick = typeof onImageClick === "function";

    if (count === 1) {
      return (
        <div className={`rounded-2xl overflow-hidden my-1 shadow-sm border border-white/5 max-w-sm ${hasClick ? "cursor-pointer" : ""}`}>
          <img
            src={imagesList[0]}
            alt="photo"
            className={`max-h-72 w-full object-cover transition-opacity ${hasClick ? "hover:opacity-95" : ""}`}
            onClick={() => hasClick && onImageClick(0)}
          />
        </div>
      );
    }
    if (count === 2) {
      return (
        <div className={`grid grid-cols-2 rounded-2xl overflow-hidden my-1 max-w-sm shadow-sm border border-white/5 ${hasClick ? "cursor-pointer" : ""}`}>
          {imagesList.map((imgUrl, idx) => (
            <div key={idx} className="h-44 overflow-hidden relative" onClick={() => hasClick && onImageClick(idx)}>
              <img src={imgUrl} alt={`photo-${idx}`} className={`w-full h-full object-cover transition-transform duration-300 ${hasClick ? "hover:scale-105" : ""}`} />
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className={`grid grid-cols-2 rounded-2xl overflow-hidden my-1 max-w-sm shadow-sm border border-white/5 ${hasClick ? "cursor-pointer" : ""}`}>
          <div className="h-52 overflow-hidden relative col-span-1" onClick={() => hasClick && onImageClick(0)}>
            <img src={imagesList[0]} alt="photo-0" className={`w-full h-full object-cover transition-transform duration-300 ${hasClick ? "hover:scale-105" : ""}`} />
          </div>
          <div className="grid grid-rows-2 gap-1 h-52 col-span-1">
            {imagesList.slice(1, 3).map((imgUrl, idx) => (
              <div key={idx} className="overflow-hidden relative" onClick={() => hasClick && onImageClick(idx + 1)}>
                <img src={imgUrl} alt={`photo-${idx + 1}`} className={`w-full h-full object-cover transition-transform duration-300 ${hasClick ? "hover:scale-105" : ""}`} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    const visiblePhotos = imagesList.slice(0, 4);
    const remainingCount = count - 4;

    return (
      <div className={`grid grid-cols-2 rounded-2xl overflow-hidden my-1 max-w-sm shadow-sm border border-white/5 ${hasClick ? "cursor-pointer" : ""}`}>
        {visiblePhotos.map((imgUrl, idx) => {
          const isFourth = idx === 3 && remainingCount > 0;
          return (
            <div
              key={idx}
              className="h-32 overflow-hidden relative group"
              onClick={() => hasClick && onImageClick(idx)}
            >
              <img src={imgUrl} alt={`photo-${idx}`} className={`w-full h-full object-cover transition-transform duration-300 ${hasClick ? "group-hover:scale-105" : ""}`} />
              {isFourth && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-extrabold text-2xl tracking-wide font-sans select-none">
                  +{remainingCount + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const isModalActive = isConfirmDeleteOpen || confirmModal.isOpen || isCameraActive || isContactSharingOpen || isPollCreationOpen || isMediaModalOpen || isForwardModalOpen || isStarredModalOpen || isMemberChangesModalOpen;
    if (isModalActive) {
      document.body.style.overflow = "hidden";
      document.body.setAttribute("data-modal-open", "true");
    } else {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-modal-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-modal-open");
    };
  }, [isConfirmDeleteOpen, confirmModal.isOpen, isCameraActive, isContactSharingOpen, isPollCreationOpen, isMediaModalOpen, isForwardModalOpen, isStarredModalOpen, isMemberChangesModalOpen]);

  const startCamera = async () => {
    setIsCameraActive(true);
    setCapturedPhotoUrl("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setConfirmModal({
        isOpen: true,
        isAlert: true,
        title: "Camera Access Error",
        description: "Could not access camera. Please make sure camera permissions are granted.",
        icon: "alert"
      });
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedPhotoUrl(dataUrl);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const sendCapturedPhoto = async () => {
    if (!capturedPhotoUrl) return;
    try {
      const res = await fetch(capturedPhotoUrl);
      const blob = await res.blob();
      const file = new File([blob], `camera_snapshot_${Date.now()}.jpg`, { type: "image/jpeg" });
      await handleFileUpload(file);
      setIsCameraActive(false);
      setCapturedPhotoUrl("");
    } catch (err) {
      console.error("Failed to send camera snapshot:", err);
    }
  };

  const handleShareContact = async (contact) => {
    if (!contact) return;
    const formattedText = `👤 Contact Card:\nName: ${contact.first_name} ${contact.last_name}\nEmail: ${contact.email || "N/A"}\nPhone: ${contact.mobile || "N/A"}`;
    await handleSendMessage(null, formattedText);
    setIsContactSharingOpen(false);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
  };
  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) return;
    const filteredOptions = pollOptions.filter((opt) => opt.trim() !== "");
    if (filteredOptions.length < 2) {
      setConfirmModal({
        isOpen: true,
        isAlert: true,
        title: "Validation Error",
        description: "Please provide at least 2 options.",
        icon: "alert"
      });
      return;
    }
    const targetRoomIds = selectedRecipientRoomIds.length > 0 ? selectedRecipientRoomIds : (activeRoom ? [activeRoom.id] : []);
    if (targetRoomIds.length === 0) {
      setConfirmModal({
        isOpen: true,
        isAlert: true,
        title: "Validation Error",
        description: "No recipient chat selected.",
        icon: "alert"
      });
      return;
    }

    const durationMs = pollDuration === "1 hour" ? 3600000 : pollDuration === "24 hours" ? 86400000 : 1800000;
    const expiresAt = Date.now() + durationMs;
    const pollPayload = {
      options: filteredOptions,
      duration: pollDuration,
      expires_at: expiresAt,
      allow_multiple: allowMultipleOptions,
      anonymous: anonymousVoting,
      quiz_mode: quizMode,
      reminder: reminderActive
    };

    try {
      for (const targetId of targetRoomIds) {
        let validRoomId = targetId;
        const existingRoom = (chatList || []).find(c => Number(c.id) === Number(targetId));
        if (!existingRoom) {
          try {
            const roomRes = await api.post("/chat", { receiverId: targetId, is_group: false });
            if (roomRes.data?.room?.id) validRoomId = roomRes.data.room.id;
          } catch (rErr) {
            console.error("Failed to resolve chat room for contact:", targetId, rErr);
          }
        }

        await sendChatMessage({
          room_id: validRoomId,
          message_text: pollQuestion.trim(),
          poll_options: pollPayload,
        });
      }
      setIsPollCreationOpen(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setSelectedRecipientRoomIds([]);
      if (refreshMessages) await refreshMessages();
      if (refreshChatList) await refreshChatList();
    } catch (err) {
      console.error("Failed to create poll:", err);
    }
  };

  const [eventName, setEventName] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLoc, setEventLoc] = useState("");

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) return;
    if (selectedRecipientRoomIds.length === 0) {
      setConfirmModal({
        isOpen: true,
        isAlert: true,
        title: "Validation Error",
        description: "Please select at least one recipient chat.",
        icon: "alert"
      });
      return;
    }
    const eventDetails = {
      title: eventName.trim(),
      description: eventDesc.trim(),
      dateTime: eventDate,
      location: eventLoc.trim()
    };
    try {
      for (const targetId of selectedRecipientRoomIds) {
        let validRoomId = targetId;
        const existingRoom = (chatList || []).find(c => Number(c.id) === Number(targetId));
        if (!existingRoom) {
          try {
            const roomRes = await api.post("/chat", { receiverId: targetId, is_group: false });
            if (roomRes.data?.room?.id) validRoomId = roomRes.data.room.id;
          } catch (rErr) {
            console.error("Failed to resolve chat room for contact:", targetId, rErr);
          }
        }

        await sendChatMessage({
          room_id: validRoomId,
          message_text: eventName.trim(),
          event_details: eventDetails
        });
      }
      setIsEventCreationOpen(false);
      setEventName("");
      setEventDesc("");
      setEventDate("");
      setEventLoc("");
      setSelectedRecipientRoomIds([]);
      if (refreshMessages) await refreshMessages();
      if (refreshChatList) await refreshChatList();
    } catch (err) {
      console.error("Failed to create event:", err);
    }
  };

  const handleTogglePinMessage = async (messageId, currentPinned) => {
    try {
      const res = await pinChatMessage(messageId, !currentPinned);
      if (res.success) {
        if (refreshMessages) await refreshMessages();
      }
    } catch (err) {
      console.error("Failed to pin message:", err);
    }
  };

  const handleVoteInPoll = async (messageId, optionIdx) => {
    try {
      const targetMsg = visibleMessages.find((m) => m.id === messageId);
      if (targetMsg) {
        let rawData = null;
        try { rawData = typeof targetMsg.attachment_url === "string" ? JSON.parse(targetMsg.attachment_url) : targetMsg.attachment_url; } catch (e) { }
        if (rawData && rawData.expires_at && Date.now() > Number(rawData.expires_at)) {
          setStatusTip(t("poll_closed_expired") || "Poll closed. Voting duration has expired.");
          return;
        }
      }
      const res = await voteInPoll(messageId, optionIdx);
      if (res.success) {
        if (refreshMessages) await refreshMessages();
      }
    } catch (err) {
      console.error("Failed to vote in poll:", err);
    }
  };

  const onSubmitForm = (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!canSend || !messageText.trim()) return;
    setShowEmojiPicker(false);
    if (editingMessageId) {
      handleSaveMessageEdit(editingMessageId, messageText);
    } else {
      if (replyingToMessage) {
        const finalMsgText = `\u200Breply:${replyingToMessage.id}\u200B${messageText}`;
        handleSendMessage(null, finalMsgText);
        setReplyingToMessage(null);
      } else {
        handleSendMessage(null);
      }
    }
    if (setMessageText) setMessageText("");
  };

  const handleEmojiClickForField = (emojiData) => {
    if (activeEmojiField === 'question') {
      setPollQuestion((prev) => prev + emojiData.emoji);
    } else if (activeEmojiField && activeEmojiField.startsWith('option-')) {
      const idx = parseInt(activeEmojiField.split('-')[1]);
      const newOpts = [...pollOptions];
      newOpts[idx] = (newOpts[idx] || "") + emojiData.emoji;
      setPollOptions(newOpts);
    }
  };

  const handleLocalDeleteMessages = async (deleteForEveryone) => {
    try {
      if (deleteForEveryone) {
        const res = await deleteMultipleMessages(selectedMessageIds, true);
        if (res.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              selectedMessageIds.includes(msg.id)
                ? { ...msg, message_text: "\u200Bdeleted\u200B", attachment_url: null, attachment_type: null, is_pinned: false }
                : msg
            )
          );
        }
      } else {
        const storedDeleted = localStorage.getItem("deleted_for_me_messages");
        let deletedList = [];
        if (storedDeleted) {
          try { deletedList = JSON.parse(storedDeleted); } catch (e) { }
        }
        const newDeletedList = Array.from(new Set([...deletedList, ...selectedMessageIds]));
        localStorage.setItem("deleted_for_me_messages", JSON.stringify(newDeletedList));
        setDeletedForMeIds(newDeletedList);
      }
      setIsMessageDeleteMode(false);
      setSelectedMessageIds([]);
    } catch (err) {
      console.error("Failed to delete messages:", err);
    }
  };
  const handleToggleStarMessages = async () => {
    try {
      for (const messageId of selectedMessageIds) {
        const msg = visibleMessages.find(m => m.id === messageId);
        const isCurrentlyStarred = !!(msg && msg.poll_votes && msg.poll_votes.starred);
        const res = await starChatMessage(messageId, !isCurrentlyStarred);
        if (res.success) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, poll_votes: { ...(m.poll_votes || {}), starred: !isCurrentlyStarred } }
                : m
            )
          );
        }
      }
      setIsMessageDeleteMode(false);
      setSelectedMessageIds([]);
      setStatusTip(t("starred_status_updated") || "Star status updated!");
    } catch (err) {
      console.error("Failed to toggle star on messages:", err);
    }
  };

  const handleForwardMessages = async () => {
    if (selectedForwardRoomIds.length === 0 || selectedMessageIds.length === 0) return;
    const messagesToForward = visibleMessages.filter(m => selectedMessageIds.includes(m.id));
    const FORWARDED_MARKER = "\u200Bforwarded\u200B";

    try {
      for (const roomId of selectedForwardRoomIds) {
        for (const msg of messagesToForward) {
          let forwardText = FORWARDED_MARKER + (msg.message_text ? msg.message_text.replace(/\u200Bforwarded\u200B/g, "") : "");
          const payload = {
            room_id: Number(roomId),
            message_text: forwardText,
            attachment_url: msg.attachment_url || null,
            attachment_type: msg.attachment_type || null
          };
          await sendChatMessage(payload);
        }
      }
      setStatusTip(t("success_messages_forwarded") || "Messages forwarded successfully!");
      setIsForwardModalOpen(false);
      setSelectedForwardRoomIds([]);
      setIsMessageDeleteMode(false);
      setSelectedMessageIds([]);
      if (refreshChatList) refreshChatList();
      if (refreshMessages) refreshMessages();
    } catch (err) {
      console.error("Failed to forward messages:", err);
      setStatusTip(t("failed_forward") || "Failed to forward messages.");
    }
  };

  const attachmentMenuRef = useRef(null);

  useEffect(() => {
    if (statusTip) {
      const timer = setTimeout(() => setStatusTip(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusTip]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setIsHeaderMenuOpen(false);
        setIsMoreMenuOpen(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const getRoomPartner = (room) => {
    if (!room || room.is_group) return null;
    return room.members?.find((m) => m && Number(m.id) !== Number(currentUser?.id));
  };

  const currentPartner = getRoomPartner(activeRoom);

  const secondaryAdminsList = currentGroupAdmins || [];
  const isUserCreator = activeRoom && Number(activeRoom.created_by) === Number(currentUser?.id);
  const isUserSecondaryAdmin = currentUser && (
    secondaryAdminsList.map(Number).includes(Number(currentUser.id)) ||
    (groupMembers && groupMembers.some(m => Number(m.id) === Number(currentUser.id) && m.role === "admin"))
  );
  const isUserAnyAdmin = isUserCreator || isUserSecondaryAdmin;

  const canSend = true;

  const getSenderColor = (name) => {
    const colors = [
      "text-[#60a5fa]", // Blue
      "text-[#34d399]", // Emerald
      "text-[#f472b6]", // Pink
      "text-[#fb923c]", // Orange
      "text-[#2dd4bf]", // Teal
      "text-[#fbbf24]", // Amber
      "text-[#c084fc]", // Purple
      "text-[#f87171]", // Red
      "text-[#818cf8]"  // Indigo
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getSentBubbleColor = (wallpaper) => {
    if (!wallpaper) return "bg-[#7c5dfa]";
    const lower = wallpaper.toLowerCase();
    if (lower === "#231f38") return "bg-[#7c5dfa]"; // Royal Purple theme bubble
    if (lower === "#142217") return "bg-[#15803d]"; // Forest Moss theme bubble
    if (lower === "#16202c") return "bg-[#0284c7]"; // Muted Ocean theme bubble
    if (lower === "#301a16") return "bg-[#ea580c]"; // Coral Sunset theme bubble
    return "bg-[#7c5dfa]";
  };

  const isGroupAdmin = activeRoom?.is_group && Number(activeRoom?.created_by) === Number(currentUser?.id);

  const openGroupSettings = async (initialTab = "info") => {
    setEditGroupName(activeRoom.name || "");
    setGroupSettingsTab(initialTab);
    await fetchGroupMembers(activeRoom.id);
    setShowGroupSettings(true);
  };

  const handleRenameGroup = async () => {
    if (!editGroupName.trim()) return;
    try {
      const res = await renameGroup(activeRoom.id, editGroupName.trim());
      if (res.success) {
        setActiveRoom((prev) => ({ ...prev, name: editGroupName.trim() }));
        if (refreshChatList) refreshChatList();
        if (handleSendMessage) {
          handleSendMessage(null, `${currentUser?.first_name || 'Admin'} changed group name to "${editGroupName.trim()}".`);
        }
      }
    } catch (err) {
      console.error("Failed to rename group:", err);
    }
  };

  const handleGroupImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadGroupImage(activeRoom.id, file);
      if (res.success) {
        setActiveRoom((prev) => ({ ...prev, group_image: res.group.group_image }));
        if (refreshChatList) refreshChatList();
        if (handleSendMessage) {
          handleSendMessage(null, `${currentUser?.first_name || 'Admin'} updated the group profile photo.`);
        }
      }
    } catch (err) {
      console.error("Failed to upload group image:", err);
    }
  };

  const handleAddMemberToGroup = async (userId) => {
    try {
      const res = await addMemberToGroup(activeRoom.id, userId);
      await fetchGroupMembers(activeRoom.id);
      if (refreshChatList) await refreshChatList();
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  const handleTogglePinActiveRoom = async () => {
    try {
      const roomInList = (chatList || []).find((c) => c.id === activeRoom.id);
      const isPinned = roomInList ? roomInList.is_pinned : false;
      const res = await pinChatRoom(activeRoom.id, !isPinned);
      if (res.success) {
        setStatusTip(isPinned ? t("chat_unpinned") : t("chat_pinned"));
        if (refreshChatList) await refreshChatList();
      }
    } catch (err) {
      console.error("Failed to pin room:", err);
      setStatusTip("Failed to pin chat.");
    }
  };

  const handleAddActivePartnerToContacts = async () => {
    if (!activeRoom.is_group) {
      const partner = currentPartner;
      if (partner) {
        const identifier = partner.mobile ? partner.mobile.trim() : null;
        if (identifier) {
          try {
            const res = await saveContact(identifier);
            setStatusTip(res.message || t("contact_saved_success"));
            if (refreshContacts) await refreshContacts();
            if (refreshChatList) await refreshChatList();
          } catch (err) {
            console.error("Failed to add partner:", err);
            setStatusTip(t("failed_to_save_contact"));
          }
        } else {
          setStatusTip(t("partner_mobile_not_found"));
        }
      } else {
        setStatusTip(t("partner_details_not_found"));
      }
    } else {
      setStatusTip(t("cannot_add_group_to_contacts"));

    }
  };

  const handleBlockActivePartner = async () => {
    if (!activeRoom.is_group) {
      const partner = currentPartner;
      if (partner) {
        try {
          const res = await blockUser(partner.id);
          if (res.success) {
            setStatusTip(t("user_blocked_success"))
            if (refreshChatList) await refreshChatList();
            if (refreshContacts) await refreshContacts();
            setActiveRoom(null);
          }
        } catch (err) {
          console.error("Failed to block partner:", err);
          setStatusTip("Failed to block user.");
        }
      }
    } else {
      setStatusTip(t("cannot_block_groups"));
    }
  };

  const isAnyModalOpen =
    confirmModal.isOpen ||
    isConfirmDeleteOpen ||
    isEventCreationOpen ||
    isPollCreationOpen ||
    isContactSharingOpen ||
    isCameraActive ||
    isQrScannerOpen ||
    isForwardModalOpen;

  const roomSpecificTheme = activeRoom
    ? (editGroupTheme || localStorage.getItem(`room_theme_${activeRoom.id}`) || localStorage.getItem(`group_theme_${activeRoom.id}`))
    : null;
  const currentRoomTheme = roomSpecificTheme || chatThemeColor || "#7c5dfa";

  const roomSpecificWallpaper = activeRoom
    ? (localStorage.getItem(`room_wallpaper_${activeRoom.id}`) || localStorage.getItem(`group_wallpaper_${activeRoom.id}`))
    : null;
  const currentWallpaper = (roomSpecificWallpaper !== null && roomSpecificWallpaper !== undefined && roomSpecificWallpaper !== "")
    ? roomSpecificWallpaper
    : chatWallpaper;

  return (
    <div className={`chat-panel-root flex-1 flex-col h-full min-w-0 min-h-0 ${isAnyModalOpen ? 'z-[200]' : 'z-10'} bg-[#0f0e15]/95 select-none ${mobileActiveView === "chatpane" ? "flex" : "hidden lg:flex"}`}>
      {activeRoom ? (
        <div className="flex-1 flex flex-row overflow-hidden relative">

          <div
            onDragOver={handleDragOver}
            className={`flex-1 flex flex-col h-full overflow-hidden relative min-w-0 ${showContactInfo ? "hidden lg:flex" : "flex"}`}
          >


            {isDragging && (
              <div
                className="absolute inset-0 z-[100] bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-dashed border-[#7c5dfa]/60 m-2 rounded-2xl animate-fade-in text-white pointer-events-auto"
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-[#7c5dfa]/15 border border-[#7c5dfa]/30 rounded-full flex items-center justify-center text-[#9f85ff] animate-bounce mb-3">
                  <Paperclip className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold">{t("drag_drop_title", "Drop files here to share")}</p>
                <p className="text-[11px] text-white/50 mt-1">{t("drag_drop_desc", "Support up to 15 files at once")}</p>
              </div>
            )}

            {isMessageDeleteMode ? (() => {
              const isLight = typeof window !== "undefined" && localStorage.getItem("theme") === "light";
              return (
                <header className={`h-15 border-b flex items-center justify-between pt-4 pb-2 px-4 sm:px-6 backdrop-blur-md shrink-0 animate-fade-in relative z-50 transition-all duration-300 ${isLight ? "bg-[#eae6f3] border-gray-200 text-gray-800" : "bg-[#231f38] border-white/5 text-white"
                  }`}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMessageDeleteMode(false);
                        setSelectedMessageIds([]);
                        setIsHeaderMenuOpen(false);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight ? "hover:bg-black/5 text-gray-600 hover:text-black" : "hover:bg-white/5 text-white/50 hover:text-white"
                        }`}
                      title={t("cancel_selection")}
                    >
                      <ArrowLeft className="w-4.5 h-4.5" />
                    </button>
                    <span className={`text-xs font-bold tracking-wide ${isLight ? "text-gray-900" : "text-white"}`}>
                      {selectedMessageIds.length} {t("messages_selected")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 relative" ref={headerMenuRef}>
                    {selectedMessageIds.length === 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const msg = visibleMessages.find(m => m.id === selectedMessageIds[0]);
                          if (msg) {
                            setReplyingToMessage(msg);
                            setIsMessageDeleteMode(false);
                            setSelectedMessageIds([]);
                          }
                        }}
                        title={t("reply_label")}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${isLight ? "hover:bg-black/5 text-gray-600 hover:text-black" : "hover:bg-white/5 text-white/50 hover:text-white"
                          }`}
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                    )}
                    {selectedMessageIds.length === 1 && (() => {
                      const msg = visibleMessages.find(m => m.id === selectedMessageIds[0]);
                      if (msg && msg.message_text && msg.message_text !== "​​deleted​​") {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.message_text);
                              setStatusTip(t("message_copied") || "Message copied to clipboard!");
                              setIsMessageDeleteMode(false);
                              setSelectedMessageIds([]);
                            }}
                            title={t("copy_message") || "Copy Message"}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${isLight ? "hover:bg-black/5 text-gray-600 hover:text-black" : "hover:bg-white/5 text-white/50 hover:text-white"
                              }`}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <button
                      type="button"
                      onClick={handleToggleStarMessages}
                      title={t("star_message")}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${isLight ? "hover:bg-black/5 text-gray-600 hover:text-black" : "hover:bg-white/5 text-white/50 hover:text-white"
                        }`}
                    >
                      <Star className={`w-4 h-4 ${selectedMessageIds.every(id => { const m = visibleMessages.find(x => x.id === id); return m && m.poll_votes && m.poll_votes.starred === true; }) ? 'text-[#fbbf24] fill-[#fbbf24]' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      title={t("chat_delete_message")}
                      className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsForwardModalOpen(true)}
                      title={t("forward_to_title")}
                      className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <Forward className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(!isHeaderMenuOpen);
                        setIsMoreMenuOpen(false);
                      }}
                      title={t("chat_options")}
                      className="p-1.5 text-white/40 hover:text-[#9f85ff] rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isHeaderMenuOpen && (
                      <div className="absolute right-0 top-11 w-48 bg-[#1f1d2c] border border-white/5 rounded-xl shadow-2xl py-1.5 z-[100] animate-fade-in text-xs text-white">
                        <button
                          type="button"
                          disabled={selectedMessageIds.length !== 1 || !(() => {
                            const msg = visibleMessages.find(m => m.id === selectedMessageIds[0]);
                            if (!msg || Number(msg.sender_id) !== Number(currentUser?.id)) return false;
                            const sentTime = new Date(msg.created_at).getTime();
                            return (Date.now() - sentTime) <= 15 * 60 * 1000;
                          })()}
                          onClick={() => {
                            const msg = visibleMessages.find(m => m.id === selectedMessageIds[0]);
                            if (msg) {
                              setPreEditingText(messageText);
                              setEditingMessageId(msg.id);
                              const cleanText = msg.message_text ? msg.message_text.replace(/\u200B/g, "") : "";
                              setEditingMessageText(cleanText);
                              handleInputChange({ target: { value: cleanText } });
                            }
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-white/5 disabled:opacity-35 disabled:hover:bg-transparent transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                        >
                          {t("chat_edit_message")}
                        </button>
                        <button
                          type="button"
                          disabled={selectedMessageIds.length === 0}
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              icon: "trash",
                              title: t("chat_delete_message"),
                              description: selectedMessageIds.length === 1 ? t("delete_message_confirm_single") : t("delete_message_confirm_multiple"),
                              onConfirm: () => {
                                handleDeleteMultipleMessages(selectedMessageIds);
                                setIsMessageDeleteMode(false);
                                setSelectedMessageIds([]);
                              }
                            });
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-950/20 disabled:opacity-35 disabled:hover:bg-transparent text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
                        >
                          {t("chat_delete_message")}
                        </button>
                        <button
                          type="button"
                          disabled={selectedMessageIds.length !== 1}
                          onClick={() => {
                            const msg = visibleMessages.find(m => m.id === selectedMessageIds[0]);
                            if (msg) {
                              handleTogglePinMessage(msg.id, msg.is_pinned);
                            }
                            setIsMessageDeleteMode(false);
                            setSelectedMessageIds([]);
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-white/5 disabled:opacity-35 disabled:hover:bg-transparent transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                        >
                          {(() => {
                            const msg = visibleMessages.find(m => m.id === selectedMessageIds[0]);
                            return msg && msg.is_pinned ? t("chat_unpin_message") : t("chat_pin_message");
                          })()}
                        </button>
                        <button
                          type="button"
                          disabled={selectedMessageIds.length !== 1 || !(() => {
                            const msg = visibleMessages.find(m => m.id === selectedMessageIds[0]);
                            return msg && msg.sender && Number(msg.sender_id) !== Number(currentUser?.id);
                          })()}
                          onClick={async () => {
                            const msg = visibleMessages.find(m => m.id === selectedMessageIds[0]);
                            if (msg && msg.sender) {
                              try {
                                const res = await saveContact(msg.sender.email);
                                setStatusTip(res.message || t("success_contact_saved"));
                              } catch (err) {
                                setStatusTip(t("failed_save_contact"));
                              }
                            }
                            setIsMessageDeleteMode(false);
                            setSelectedMessageIds([]);
                            setIsHeaderMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-white/5 disabled:opacity-35 disabled:hover:bg-transparent transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                        >
                          {t("chat_add_chat")}
                        </button>

                        {(() => {
                          const getSelectedImagesList = () => {
                            const list = [];
                            selectedMessageIds.forEach(id => {
                              const msg = visibleMessages.find(m => m.id === id);
                              if (!msg || !msg.attachment_url) return;
                              const isImg = msg.attachment_type === "image" || msg.attachment_type === "media_images" || msg.attachment_type === "gif" || msg.attachment_type === "sticker";
                              if (!isImg) return;

                              if (msg.attachment_type === "media_images") {
                                try {
                                  const parsed = JSON.parse(msg.attachment_url);
                                  if (Array.isArray(parsed)) {
                                    list.push(...parsed);
                                  } else {
                                    list.push(msg.attachment_url);
                                  }
                                } catch (e) {
                                  list.push(msg.attachment_url);
                                }
                              } else {
                                list.push(msg.attachment_url);
                              }
                            });
                            return list;
                          };

                          const selectedImages = getSelectedImagesList();
                          if (selectedImages.length === 0) return null;

                          if (selectedImages.length === 1) {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  downloadAttachmentBlob(selectedImages[0], "image-" + Date.now() + ".jpg");
                                  setIsHeaderMenuOpen(false);
                                  setIsMessageDeleteMode(false);
                                  setSelectedMessageIds([]);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#7c5dfa]/20 text-[#9f85ff] hover:text-white transition-colors font-semibold cursor-pointer flex items-center gap-2 border-t border-white/5 mt-1 pt-2"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>{t("save_image", "Save Image")}</span>
                              </button>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                selectedImages.forEach((imgUrl, iIdx) => {
                                  setTimeout(() => {
                                    downloadAttachmentBlob(imgUrl, `image-${Date.now()}-${iIdx}.jpg`);
                                  }, iIdx * 300);
                                });
                                setIsHeaderMenuOpen(false);
                                setIsMessageDeleteMode(false);
                                setSelectedMessageIds([]);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-[#7c5dfa]/20 text-[#9f85ff] hover:text-white transition-colors font-semibold cursor-pointer flex items-center gap-2 border-t border-white/5 mt-1 pt-2"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              <span>{t("save_all_images", "Save All Images")} ({selectedImages.length})</span>
                            </button>
                          );
                        })()}

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white flex items-center justify-between cursor-pointer"
                          >
                            <span>{t("chat_more")}</span>
                            <span className="text-[10px] text-white/30">›</span>
                          </button>

                          {isMoreMenuOpen && (
                            <div className="absolute right-[194px] top-0 w-44 bg-[#1f1d2c] border border-white/5 rounded-xl shadow-2xl py-1.5 z-[101] animate-fade-in text-xs text-white">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsMessageDeleteMode(false);
                                  setSelectedMessageIds([]);
                                  setIsHeaderMenuOpen(false);
                                  setIsMoreMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                              >
                                {t("chat_clear_selection")}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </header>
              );
            })() : (
              <header className="h-15 border-b border-white/5 flex items-center justify-between pt-4 pb-2 px-4 sm:px-6 bg-[#161421]/60 backdrop-blur-md shrink-0 relative z-50">
                {isSearchMessagesOpen ? (
                  <div className="w-full flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/5 rounded-xl px-3 py-1.5">
                      <Search className="w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={searchMessageQuery}
                        onChange={(e) => setSearchMessageQuery(e.target.value)}
                        placeholder={t("search_messages", "Search Messages") + "..."}
                        className="bg-transparent border-none outline-none text-white text-xs w-full focus:ring-0 p-0"
                        autoFocus
                      />
                      {searchMessageQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchMessageQuery("")}
                          className="text-white/40 hover:text-white bg-transparent border-none cursor-pointer p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchMessagesOpen(false);
                        setSearchMessageQuery("");
                      }}
                      className="text-xs font-bold text-[#b69eff] hover:text-[#9f85ff] bg-transparent border-none cursor-pointer shrink-0 transition-colors"
                    >
                      {t("cancel") || "Cancel"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => {
                          if (activeRoom) leaveChatRoomSocket(activeRoom.id);
                          setMobileActiveView("sidebar");
                        }}
                        className="p-1 text-white/40 hover:text-white rounded-lg hover:bg-white/5 lg:hidden transition-colors mr-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div
                        onClick={() => {
                          setShowContactInfo(!showContactInfo);
                        }}
                        className={`w-9 h-9 rounded-full bg-[#27243c] flex items-center justify-center font-bold text-xs shrink-0 select-none border border-white/5 cursor-pointer hover:ring-2 hover:ring-[#7c5dfa]/30 transition-all`}
                      >
                        {activeRoom.is_group ? (
                          activeRoom.group_image ? (
                            <img
                              src={activeRoom.group_image}
                              alt="group"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-purple-300" />
                          )
                        ) : (!currentPartner ? currentUser?.profile_image : currentPartner?.profile_image) ? (
                          <img
                            src={!currentPartner ? currentUser.profile_image : currentPartner.profile_image}
                            alt="avatar"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span>
                            {activeRoom.is_group
                              ? activeRoom.name?.substring(0, 2).toUpperCase()
                              : t("you_caps", "YOU")}
                          </span>
                        )}
                      </div>

                      <div
                        onClick={() => {
                          setShowContactInfo(!showContactInfo);
                        }}
                        className="truncate cursor-pointer hover:opacity-85 transition-opacity"
                      >
                        <h3 className="text-xs font-bold text-white truncate hover:underline">
                          {activeRoom.is_group
                            ? activeRoom.name
                            : !currentPartner
                              ? `${currentUser?.first_name || ""} ${currentUser?.last_name || ""} (${t("contacts_you_badge", "You")})`
                              : (contacts && contacts.some(c => Number(c.id) === Number(currentPartner.id))
                                ? `${currentPartner.first_name} ${currentPartner.last_name}`
                                : (currentPartner.mobile ? `+${currentPartner.mobile}` : t("unknown_contact", "Unknown Contact")))
                          }
                        </h3>
                        <p className="text-[10px] text-white/40 truncate">
                          {isTypingPartner ? (
                            <span className="text-[#9f85ff] font-semibold animate-pulse">{typingPartnerName} {t("blank_typing_indicator")}</span>
                          ) : activeRoom.is_group ? (
                            ((groupMembers && groupMembers.length > 0) ? groupMembers : (activeRoom.members || []))
                              ?.map((m) => m ? m.first_name : "").filter(Boolean).join(", ") + t("blank_group_members_list")
                          ) : !currentPartner ? (
                            t("blank_message_yourself")
                          ) : (
                            t("blank_online")
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 relative" ref={headerMenuRef}>
                      {/* <button
                        onClick={() => {
                          setIsFeedbackPanelOpen(true);
                          setFeedbackSuccess(false);
                        }}
                        title={t("send_feedback", "Send Feedback")}
                        className="p-2 text-white/45 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-all cursor-pointer mr-1"
                      >
                        <Star className="w-4 h-4 fill-current text-amber-400" />
                      </button> */}

                      <button
                        onClick={() => {
                          setIsHeaderMenuOpen(!isHeaderMenuOpen);
                          setIsMoreMenuOpen(false);
                        }}
                        title="Chat options"
                        className="p-2 text-white/40 hover:text-[#9f85ff] rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isHeaderMenuOpen && (
                        <div className="absolute right-0 top-11 w-48 bg-[#1f1d2c] border border-white/5 rounded-xl shadow-2xl py-1.5 z-30 animate-fade-in text-xs text-white">

                          {!activeRoom?.is_group && currentPartner && contacts && !contacts.some(c => Number(c.id) === Number(currentPartner.id)) && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsHeaderMenuOpen(false);
                                const phone = currentPartner.mobile || "";
                                const email = currentPartner.email || "";
                                if (setMobileActiveView) setMobileActiveView("sidebar");
                                window.dispatchEvent(new CustomEvent("triggerAddContact", {
                                  detail: { phone, email }
                                }));
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-[#7c5dfa]/20 text-[#b69eff] hover:text-white transition-colors font-bold cursor-pointer bg-transparent border-none"
                            >
                              {t("save_contact", "Save Contact")}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setActiveTab("chats");
                              setIsGroupModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer bg-transparent border-none"
                          >
                            {t("blank_new_group", "New Group")}
                          </button>
                          <button
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setActiveTab("contacts");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                          >
                            {t("blank_view_contacts", "View Contacts")}
                          </button>
                          <button
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setActiveTab("settings");
                              window.dispatchEvent(new CustomEvent("openSettingsView", { detail: "chat-theme" }));
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer flex items-center gap-2"
                          >
                            <span>{t("chatTheme", "Chat theme")}</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setIsMessageDeleteMode(true);
                              setSelectedMessageIds([]);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                          >
                            {t("blank_select_chat", "Select Chat")}
                          </button>
                          <button
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              handleTogglePinActiveRoom();
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                          >
                            {activeRoom?.is_pinned ? t("chat_unpin_chat") : t("chat_pin_chat")}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsSearchMessagesOpen(true);
                              setIsHeaderMenuOpen(false);
                              setSearchMessageQuery("");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                          >
                            {t("search_messages") || "Search Messages"}
                          </button>
                          <button
                            type="button"
                            onClick={handleToggleMuteActiveRoom}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                          >
                            {isMuted ? t("unmute_notifications") || "Unmute Notification" : t("mute_notifications") || "Mute Notification"}
                          </button>
                          <button
                            type="button"
                            onClick={handleToggleArchiveActiveRoom}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                          >
                            {isArchived ? (t("unarchive_chat") || "Unarchive Chat") : (t("archive_chat") || "Archive Chat")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setConfirmModal({
                                isOpen: true,
                                icon: "trash",
                                title: t("clear_chat") || "Clear Chat",
                                description: t("clear_chat_confirm") || "Clear all messages in this chat for yourself?",
                                onConfirm: () => {
                                  const clearTime = new Date().toISOString();
                                  localStorage.setItem(`cleared_at_${currentUser?.id}_${activeRoom?.id}`, clearTime);
                                  if (refreshMessages) refreshMessages();
                                }
                              });
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-red-950/20 text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
                          >
                            {t("clear_chat") || "Clear Chat"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              setActiveRoom(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                          >
                            {t("blank_close_chat", "Close Chat")}
                          </button>


                          <div className="relative">
                            <button
                              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                              className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white flex items-center justify-between cursor-pointer"
                            >
                              <span>{t("chat_more")}</span>
                              <span className="text-[10px] text-white/30">›</span>
                            </button>

                            {isMoreMenuOpen && (
                              <div className="absolute right-[194px] top-0 w-44 bg-[#1f1d2c] border border-white/5 rounded-xl shadow-2xl py-1.5 z-40 animate-fade-in text-xs text-white">

                                <button
                                  onClick={() => {
                                    try {
                                      const exportText = visibleMessages.map(m => {
                                        const name = m.sender ? `${m.sender.first_name} ${m.sender.last_name}` : "User";
                                        return `[${new Date(m.created_at).toLocaleString()}] ${name}: ${m.message_text || "[Attachment]"}`;
                                      }).join("\n");
                                      const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
                                      const url = URL.createObjectURL(blob);
                                      const link = document.createElement("a");
                                      link.href = url;
                                      link.download = `chat_history_${activeRoom.name || "chat"}.txt`;
                                      link.click();
                                      URL.revokeObjectURL(url);
                                      setStatusTip(t("success_chat_exported"));
                                    } catch (err) {
                                      setStatusTip(t("failed_export_chat"));
                                    }
                                    setIsHeaderMenuOpen(false);
                                    setIsMoreMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                                >
                                  {t("chat_export_chat")}
                                </button>
                                <button
                                  onClick={() => {
                                    handleBlockActivePartner();
                                    setIsHeaderMenuOpen(false);
                                    setIsMoreMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-red-950/20 text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
                                >
                                  {t("chat_block_user")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </header>)}

            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-300">
              {currentWallpaper ? (
                (currentWallpaper.startsWith("http") || currentWallpaper.startsWith("data:") || currentWallpaper.startsWith("blob:")) ? (
                  <div
                    className="w-full h-full transition-all duration-300"
                    style={{
                      backgroundImage: `url(${currentWallpaper})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "overlay",
                      backgroundColor: isLight ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.6)"
                    }}
                  />
                ) : (
                  <div className="w-full h-full transition-all duration-300" style={{ backgroundColor: currentWallpaper }} />
                )
              ) : isLight ? (
                <div
                  className="w-full h-full transition-all duration-300"
                  style={{
                    backgroundColor: "#efeae2",
                    backgroundImage: `url(${defaultWallpaper.src})`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "412px",
                    backgroundPosition: "center",
                    opacity: 0.8
                  }}
                />
              ) : (
                <div
                  className="w-full h-full transition-all duration-300 relative"
                  style={{
                    backgroundColor: "#000000"
                  }}
                >
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      backgroundImage: `url(${defaultWallpaper.src})`,
                      backgroundRepeat: "repeat",
                      backgroundSize: "412px",
                      backgroundPosition: "center",
                      filter: "invert(1) sepia(1) saturate(600%) hue-rotate(235deg) brightness(0.95) opacity(0.35)",
                    }}
                  />
                </div>
              )}
              <div
                className="absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none z-10"
                style={{
                  opacity: isLight ? 0.05 : 0.45
                }}
              />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-3 sm:px-6 md:px-12 lg:px-20 xl:px-28 py-4 sm:py-6 space-y-4 relative z-10">
              {(() => {
                const activeModeVal = (disappearingMode && disappearingMode !== "Off" && disappearingMode !== "off")
                  ? disappearingMode
                  : (activeRoom ? localStorage.getItem(`disappearing_${activeRoom.id}`) : null) || disappearingDuration;

                if (!activeModeVal || activeModeVal === "Off" || activeModeVal === "off") return null;

                return (
                  <div className="flex justify-center mb-4 select-none shrink-0 animate-fade-in">
                    <div className="bg-[#1c1a29]/90 border border-[#7c5dfa]/20 rounded-2xl px-4 py-2.5 text-[10px] text-white/50 leading-relaxed text-center max-w-xs sm:max-w-sm shadow-xl flex items-center justify-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#9f85ff] shrink-0" />
                      <span>
                        {t("chat_disappearing_desc", "Your chat is disappearing. Messages will automatically disappear after")} <strong className="text-[#9f85ff] font-bold">{activeModeVal}</strong>.
                      </span>
                    </div>
                  </div>
                );
              })()}
              {roomLoading ? (
                <div className="flex items-center justify-center h-full text-white/30 text-xs">
                  <span className="w-5 h-5 border-2 border-[#7c5dfa] border-t-transparent rounded-full animate-spin mr-2"></span>
                  {t("blank_loading")}
                </div>
              ) : visibleMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs select-none">
                  {t("blank_no_messages")}
                </div>
              ) : (
                visibleMessages.map((msg, index) => {
                  const isOwn = Number(msg.sender_id) === Number(currentUser?.id);
                  const isMsgSenderSaved = msg.sender && (contacts || []).some(c => Number(c.id) === Number(msg.sender.id));
                  const senderName = msg.sender
                    ? (isMsgSenderSaved
                      ? `${msg.sender.first_name} ${msg.sender.last_name}`
                      : (msg.sender.mobile ? `+${msg.sender.mobile}` : `${msg.sender.first_name} ${msg.sender.last_name}`))
                    : "User";

                  const rawPollData = msg.poll_options || (msg.attachment_type === "poll" && msg.attachment_url ? (() => {
                    try { return JSON.parse(msg.attachment_url); } catch (e) { return []; }
                  })() : []);
                  const pollOptions = Array.isArray(rawPollData) ? rawPollData : (rawPollData?.options || []);
                  const pollExpiresAt = rawPollData?.expires_at || null;
                  const isPollExpired = pollExpiresAt ? Date.now() > Number(pollExpiresAt) : false;

                  const showDateSeparator =
                    index === 0 ||
                    !isSameDay(
                      new Date(visibleMessages[index - 1].created_at),
                      new Date(msg.created_at)
                    );

                  const rawMsgText = (msg.message_text || "").trim();
                  const lowerMsgText = rawMsgText.toLowerCase();

                  const isSystemNotice = Boolean(msg.is_system) || Boolean(
                    rawMsgText.startsWith("🔒") ||
                    rawMsgText.startsWith("✏️") ||
                    rawMsgText.startsWith("📷") ||
                    rawMsgText.startsWith("👑") ||
                    rawMsgText.startsWith("🚪") ||
                    rawMsgText.startsWith("📝") ||
                    rawMsgText.startsWith("🔓") ||
                    rawMsgText.includes("Your chat is disappearing") ||
                    rawMsgText.includes("Group setting updated") ||
                    lowerMsgText.includes("changed group name") ||
                    lowerMsgText.includes("group name changed") ||
                    lowerMsgText.includes("updated the group profile photo") ||
                    lowerMsgText.includes("updated group image") ||
                    lowerMsgText.includes("changed group image") ||
                    lowerMsgText.includes("group picture") ||
                    lowerMsgText.includes("updated group description") ||
                    lowerMsgText.includes("is now an admin") ||
                    lowerMsgText.includes("group admin") ||
                    lowerMsgText.includes("promoted") ||
                    lowerMsgText.includes("dismissed") ||
                    lowerMsgText.includes("removed") ||
                    lowerMsgText.includes("joined") ||
                    lowerMsgText.includes("left the group")
                  );

                  if (isSystemNotice) {
                    const cleanText = rawMsgText
                      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{200B}]/gu, "")
                      .replace(/\s+/g, " ")
                      .trim();
                    let durationText = "";

                    if (lowerMsgText.includes("disappearing")) {
                      if (lowerMsgText.includes("24 hours") || lowerMsgText.includes("24h")) durationText = "24 hours";
                      else if (lowerMsgText.includes("7 days")) durationText = "7 days";
                      else if (lowerMsgText.includes("90 days")) durationText = "90 days";
                      else if (lowerMsgText.includes("off")) durationText = "Off";
                    }

                    let NoticeIcon = Lock;
                    if (lowerMsgText.includes("group name") || lowerMsgText.includes("renamed") || rawMsgText.startsWith("✏️")) NoticeIcon = Edit3;
                    else if (lowerMsgText.includes("image") || lowerMsgText.includes("photo") || lowerMsgText.includes("picture") || rawMsgText.startsWith("📷")) NoticeIcon = Camera;
                    else if (lowerMsgText.includes("admin") || lowerMsgText.includes("promoted") || lowerMsgText.includes("dismissed") || rawMsgText.startsWith("👑")) NoticeIcon = Crown;
                    else if (lowerMsgText.includes("removed") || lowerMsgText.includes("left") || lowerMsgText.includes("joined") || lowerMsgText.includes("added") || rawMsgText.startsWith("🚪")) NoticeIcon = LogOut;
                    else if (lowerMsgText.includes("description") || lowerMsgText.includes("about") || rawMsgText.startsWith("📝")) NoticeIcon = FileText;
                    else if (lowerMsgText.includes("setting") || lowerMsgText.includes("restricted") || lowerMsgText.includes("public") || rawMsgText.startsWith("🔒") || rawMsgText.startsWith("🔓")) NoticeIcon = Shield;

                    return (
                      <div key={msg.id || index} className="w-full flex flex-col items-center">
                        {showDateSeparator && (
                          <div className="flex justify-center my-3 select-none">
                            <span className="bg-[#1f1d2c] border border-white/5 text-[10px] text-white/50 px-3 py-1 rounded-lg uppercase tracking-wider font-semibold shadow-sm">
                              {getDateSeparatorText(msg.created_at, t)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-center my-2 select-none shrink-0 animate-fade-in w-full">
                          <div className={`bg-[#1c1a29]/90 border border-[#7c5dfa]/20 rounded-2xl px-4 py-2.5 text-[10px] text-white/50 leading-relaxed text-center max-w-xs sm:max-w-sm shadow-xl flex items-center justify-center gap-2 ${isLight ? "bg-white/90 backdrop-blur-md border-purple-200 text-gray-600 shadow-md" : "bg-[#1c1a29]/90 backdrop-blur-md border-[#7c5dfa]/20 text-white/50 shadow-xl"}`}>
                            <NoticeIcon className="w-3.5 h-3.5 text-[#9f85ff] shrink-0" />
                            <span>
                              {durationText ? (
                                <>
                                  {t("chat_disappearing_desc", "Your chat is disappearing. Messages will automatically disappear after")} <strong className="text-[#9f85ff] font-bold">{durationText}</strong>.
                                </>
                              ) : (
                                cleanText
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="w-full flex flex-col">
                      {showDateSeparator && (
                        <div className="flex justify-center my-3 select-none">
                          <span className="bg-[#1f1d2c] border border-white/5 text-[10px] text-white/50 px-3 py-1 rounded-lg uppercase tracking-wider font-semibold shadow-sm">
                            {getDateSeparatorText(msg.created_at, t)}
                          </span>
                        </div>
                      )}
                      <div
                        className="flex items-center gap-6 w-full relative py-1 my-0.5 cursor-pointer"
                        onClick={() => {
                          if (isMessageDeleteMode) {
                            setSelectedMessageIds((prev) =>
                              prev.includes(msg.id)
                                ? prev.filter((id) => id !== msg.id)
                                : [...prev, msg.id]
                            );
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setIsMessageDeleteMode(true);
                          setSelectedMessageIds((prev) =>
                            prev.includes(msg.id)
                              ? prev.filter((id) => id !== msg.id)
                              : [...prev, msg.id]
                          );
                        }}
                      >
                        {isMessageDeleteMode && (
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${selectedMessageIds.includes(msg.id)
                              ? "bg-[#7c5dfa] border-transparent shadow-md"
                              : "border-white/20 hover:border-[#7c5dfa]/60 bg-white/[0.02]"
                              }`}
                          >
                            {selectedMessageIds.includes(msg.id) && (
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            )}
                          </div>
                        )}

                        <div className={`flex-1 flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          {(() => {
                            const hasImageAttachment = msg.attachment_url && (msg.attachment_type === "image" || msg.attachment_type === "media_images" || msg.attachment_type === "gif" || msg.attachment_type === "sticker");
                            const fileNamePlaceholder = (() => {
                              if (!msg.attachment_url) return "";
                              let base = "";
                              try {
                                if (msg.attachment_url.startsWith("[")) {
                                  const parsed = JSON.parse(msg.attachment_url);
                                  base = Array.isArray(parsed) && parsed[0] ? parsed[0].split("/").pop() : "";
                                } else {
                                  base = typeof msg.attachment_url === "string" ? msg.attachment_url.split("/").pop() : "";
                                }
                              } catch (e) {
                                base = typeof msg.attachment_url === "string" ? msg.attachment_url.split("/").pop() : "";
                              }
                              return base ? base.replace(/^\d+-/, "") : "";
                            })();

                            const cleanTextForCheck = msg.message_text
                              ? msg.message_text.replace(/\u200Bhd\u200B/g, "").replace(/\u200B/g, "").trim()
                              : "";
                            const hasExtension = msg.message_text && /\.(jpg|jpeg|png|webp|gif|sticker|zip|rar|7z|pdf|doc|docx|xls|xlsx|txt|mp4|mp3)$/i.test(cleanTextForCheck);

                            const isTextPlaceholder = !msg.message_text ||
                              cleanTextForCheck === "" ||
                              cleanTextForCheck.startsWith("http") ||
                              cleanTextForCheck === "Photos" ||
                              cleanTextForCheck === "document" ||
                              cleanTextForCheck === "gif" ||
                              cleanTextForCheck === "sticker" ||
                              hasExtension ||
                              cleanTextForCheck === fileNamePlaceholder.replace(/\u200B/g, "").trim() ||
                              decodeURIComponent(cleanTextForCheck) === decodeURIComponent(fileNamePlaceholder.replace(/\u200B/g, "").trim()) ||
                              (msg.attachment_url && typeof msg.attachment_url === "string" && cleanTextForCheck === msg.attachment_url.split("/").pop());

                            const isContactCard = msg.message_text && msg.message_text.replace(/^\u200B(reply:[^\u200B]+|status_reply:[^:]+:[^\u200B]+)\u200B/g, "").replace(/\u200Bforwarded\u200B/g, "").startsWith("👤 Contact Card:");
                            const isAttachmentOnly = (msg.attachment_url && isTextPlaceholder) || isContactCard;

                            return (
                              <div
                                id={`msg-${msg.id}`}
                                className={`rounded-2xl max-w-[85%] sm:max-w-md shadow-md relative group ${isAttachmentOnly
                                  ? "p-0 bg-transparent border-transparent shadow-none"
                                  : `${isOwn
                                    ? "sent-message-bubble text-white/95 rounded-br-none px-3.5 py-1.5"
                                    : (isLight ? "bg-white text-gray-900 rounded-bl-none border border-gray-200/80 shadow-md px-3.5 py-1.5" : "bg-[#201d2d] text-white/95 rounded-bl-none border border-white/5 px-3.5 py-1.5")
                                  }`
                                  } ${msg.poll_votes && (!pollOptions || pollOptions.length === 0) && Object.values(msg.poll_votes).some(c => Number(c) > 0) ? "mb-2.5" : ""}`}
                                style={isOwn && !isAttachmentOnly ? { backgroundColor: currentRoomTheme || "#7c5dfa", color: "#ffffff" } : {}}
                              >
                                {msg.message_text && msg.message_text.includes("\u200Bforwarded\u200B") && (
                                  <div className="flex items-center gap-1 text-[9px] text-white/40 italic mb-1 select-none">
                                    <Forward className="w-2.5 h-2.5" />
                                    <span>{t("forwarded_label")}</span>
                                  </div>
                                )}
                                {(() => {
                                  const statusReplyMatch = msg.message_text && msg.message_text.match(/^\u200Bstatus_reply:([^:]+):([^\u200B]+)\u200B/);
                                  if (statusReplyMatch) {
                                    const statusType = statusReplyMatch[1];
                                    const statusContent = decodeURIComponent(statusReplyMatch[2]);
                                    return (
                                      <div
                                        className="bg-black/10 dark:bg-black/20 rounded-lg p-2 border-l-4 mb-2 text-left flex items-center justify-between gap-2 select-none"
                                        style={{ borderLeftColor: currentRoomTheme || '#7c5dfa' }}
                                      >
                                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                          <p className="text-[10px] font-bold uppercase truncate" style={{ color: isOwn ? 'rgba(255, 255, 255, 0.95)' : (currentRoomTheme || '#7c5dfa') }}>
                                            Status
                                          </p>
                                          <p className="text-[10.5px] text-black/65 dark:text-white/60 truncate line-clamp-1 italic">
                                            {statusType === "text" ? statusContent : `${statusType.charAt(0).toUpperCase() + statusType.slice(1)} status`}
                                          </p>
                                        </div>
                                        {statusType !== "text" && (
                                          <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-white/10 bg-black/20 flex items-center justify-center">
                                            {statusType === "video" ? (
                                              <video src={statusContent} className="w-full h-full object-cover" />
                                            ) : (
                                              <img src={statusContent} alt="" className="w-full h-full object-cover" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }

                                  const replyMatch = msg.message_text && msg.message_text.match(/^\u200Breply:([^\u200B]+)\u200B/);
                                  if (replyMatch) {
                                    const quotedId = replyMatch[1];
                                    const quotedMsg = visibleMessages.find(m => String(m.id) === String(quotedId));
                                    let quotedSenderName = "User";
                                    if (quotedMsg && quotedMsg.sender) {
                                      const isQuotedSenderSaved = (contacts || []).some(c => Number(c.id) === Number(quotedMsg.sender.id));
                                      quotedSenderName = isQuotedSenderSaved
                                        ? `${quotedMsg.sender.first_name} ${quotedMsg.sender.last_name}`
                                        : (quotedMsg.sender.mobile ? `+${quotedMsg.sender.mobile}` : `${quotedMsg.sender.first_name} ${quotedMsg.sender.last_name}`);
                                    }
                                    let cleanQuotedText = quotedMsg ? (quotedMsg.message_text ? quotedMsg.message_text.replace(/\u200Breply:([^\u200B]+)\u200B/g, "").replace(/\u200Bforwarded\u200B/g, "").replace(/\u200B/g, "") : "Attachment") : t("message_not_found") || "Message not found";
                                    if (cleanQuotedText.startsWith("👤 Contact Card:")) {
                                      cleanQuotedText = "👤 Contact Card";
                                    }

                                    return (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const element = document.getElementById(`msg-${quotedId}`);
                                          if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            element.classList.add('highlight-flash');
                                            setTimeout(() => {
                                              element.classList.remove('highlight-flash');
                                            }, 1600);
                                          }
                                        }}
                                        className="bg-black/10 dark:bg-black/20 rounded-lg p-2 border-l-4 mb-2 cursor-pointer hover:bg-black/15 dark:hover:bg-black/30 transition-all text-left flex flex-col gap-0.5 select-none"
                                        style={{ borderLeftColor: currentRoomTheme || '#7c5dfa' }}
                                      >
                                        <p className="text-[10px] font-bold uppercase truncate" style={{ color: isOwn ? 'rgba(255, 255, 255, 0.95)' : (currentRoomTheme || '#7c5dfa') }}>
                                          {quotedSenderName}
                                        </p>
                                        <p className="text-[10.5px] text-black/65 dark:text-white/60 truncate line-clamp-1">
                                          {cleanQuotedText}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                <AnimatePresence>
                                  {selectedMessageIds.length === 1 && selectedMessageIds[0] === msg.id && isMessageDeleteMode && !isHeaderMenuOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                                      className={`absolute -top-12 z-30 flex items-center gap-1.5 px-3 py-1.5 emoji-reaction-bar pointer-events-auto ${isOwn ? "right-2" : "left-2"}`}
                                    >
                                      {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji, eIdx) => {
                                        const emojiVal = eIdx + 1;
                                        const isMyReact = Number(msg.my_vote) === emojiVal;
                                        return (
                                          <motion.button
                                            key={eIdx}
                                            type="button"
                                            whileHover={{ scale: 1.3, y: -4 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleVoteInPoll(msg.id, emojiVal);
                                              setIsMessageDeleteMode(false);
                                              setSelectedMessageIds([]);
                                            }}
                                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all duration-200 cursor-pointer ${isMyReact ? "bg-[#7c5dfa]/20 scale-110" : "hover:bg-white/10"}`}
                                          >
                                            {emoji}
                                          </motion.button>
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                {!isOwn && (activeRoom?.is_group || activeRoom?.is_community) && (
                                  <span
                                    className="text-[11px] font-extrabold block mb-1 tracking-wide"
                                    style={{ color: getSenderNameColor(msg.sender_id || msg.sender?.id, senderName) }}
                                  >
                                    {senderName}
                                  </span>
                                )}

                                {msg.is_pinned && (
                                  <div className="absolute top-2 right-2 text-white/35 select-none pointer-events-none z-20">
                                    <Pin className="w-[12px] h-[12px] -rotate-45" fill="currentColor" />
                                  </div>
                                )}

                                <div className="relative pt-0.5 pb-0.5 pr-4 min-w-[80px]">
                                  {msg.attachment_url && msg.attachment_type !== "poll" && msg.attachment_type !== "event" && (() => {
                                    const isMediaVisible = typeof window !== "undefined" ?
                                      localStorage.getItem("pref_mediaVisibility") !== "false"
                                      : true;
                                    if (!isMediaVisible) {
                                      return (
                                        <div className="mb-2 p-2.5 rounded-xl bg-black/20 border border-white/5 text-white/40 text-[10px] italic flex items-center gap-2 select-none">
                                          <svg className="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                          </svg>
                                          <span>{t("media_hidden_by_settings", "Media hidden by settings")}</span>
                                        </div>
                                      );
                                    }

                                    const isDoc = msg.attachment_type === "document" ||
                                      (msg.attachment_type && msg.attachment_type !== "image" && msg.attachment_type !== "media_images" && msg.attachment_type !== "gif" && msg.attachment_type !== "sticker") ||
                                      (msg.attachment_url && (msg.attachment_url.toLowerCase().endsWith(".zip") || msg.attachment_url.toLowerCase().endsWith(".rar") || msg.attachment_url.toLowerCase().endsWith(".pdf") || msg.attachment_url.toLowerCase().endsWith(".doc") || msg.attachment_url.toLowerCase().endsWith(".docx")));

                                    if (isDoc) {
                                      return renderDocumentCard(msg, isOwn, isLight);
                                    }

                                    let imageList = [];
                                    if (msg.attachment_type === "media_images" && msg.attachment_url) {
                                      try {
                                        imageList = JSON.parse(msg.attachment_url);
                                      } catch (e) {
                                        imageList = [msg.attachment_url];
                                      }
                                    } else if (msg.attachment_url) {
                                      imageList = [msg.attachment_url];
                                    }
                                    const isHdImage = msg.message_text && msg.message_text.includes("\u200Bhd\u200B");
                                    return (
                                      <div className="relative group/hd inline-block max-w-full">
                                        {renderImageGrid(imageList, null)}
                                        {isHdImage && (
                                          <div className="absolute bottom-2.5 left-2.5 px-1 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[8px] font-black tracking-wider select-none z-20 shadow-sm pointer-events-none flex items-center justify-center leading-none" style={{ color: "#ffffff" }}>
                                            HD
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  {(() => {
                                    let evDetails = msg.event_details;
                                    if (!evDetails && msg.attachment_type === "event" && msg.attachment_url) {
                                      try { evDetails = typeof msg.attachment_url === "string" ? JSON.parse(msg.attachment_url) : msg.attachment_url; } catch (e) { }
                                    }
                                    if (!evDetails && msg.attachment_url && typeof msg.attachment_url === "string" && msg.attachment_url.startsWith("{") && msg.attachment_url.includes("dateTime")) {
                                      try { evDetails = JSON.parse(msg.attachment_url); } catch (e) { }
                                    }

                                    if (evDetails) {
                                      const isOwner = Number(msg.sender_id) === Number(currentUser?.id);
                                      const goingCount = msg.poll_votes ? (Number(msg.poll_votes[0]) || Number(msg.poll_votes["0"]) || 0) : 0;
                                      const isMyGoing = msg.my_vote !== null && msg.my_vote !== undefined && Number(msg.my_vote) === 0;

                                      return (
                                        <div className="bg-black/15 border border-white/5 rounded-xl p-3 flex flex-col gap-2.5 min-w-[220px] max-w-[280px] shadow-inner mt-1 text-left select-none">
                                          <div className="flex items-center gap-2.5">
                                            <div
                                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-white/10"
                                              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#ffffff" }}
                                            >
                                              <Calendar className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1 flex-col text-left">
                                              <h4 className="text-xs font-black text-white truncate">
                                                {evDetails.title}
                                              </h4>
                                              <p className="text-[10px] text-white/70 font-semibold mt-0.5">
                                                {new Date(evDetails.dateTime).toLocaleString([], {
                                                  weekday: "short",
                                                  day: "numeric",
                                                  month: "short",
                                                  hour: "2-digit",
                                                  minute: "2-digit"
                                                })}
                                              </p>
                                            </div>
                                          </div>

                                          {evDetails.location && (
                                            <div className="text-[10px] text-white/60 font-medium pl-1 truncate">
                                              📍 {evDetails.location}
                                            </div>
                                          )}

                                          <div className="flex items-center gap-1.5 text-[10px] text-white/80 font-bold pl-1">
                                            <span>👥 {goingCount} {t("going_label", "going")}</span>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (isOwner) {
                                                setEventName(evDetails.title || "");
                                                setEventDesc(evDetails.description || "");
                                                setEventDate(evDetails.dateTime || "");
                                                setEventLoc(evDetails.location || "");
                                                setIsEventCreationOpen(true);
                                              } else {
                                                handleVoteInPoll(msg.id, 0);
                                              }
                                            }}
                                            className="w-full py-1.5 text-[10px] font-bold rounded-lg transition-colors text-center cursor-pointer shadow-md border-none mt-1 hover:opacity-90"
                                            style={{ backgroundColor: getPollHighlightColor(currentRoomTheme), color: "#0f0e15" }}
                                          >
                                            {isOwner ? (t("edit_event") || "Edit event") : (isMyGoing ? `✓ ${t("event_going") || "Going"}` : (t("event_going") || "Going"))}
                                          </button>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })() || (() => {
                                    const cleanTextForCard = msg.message_text ? msg.message_text.replace(/^\u200B(reply:[^\u200B]+|status_reply:[^:]+:[^\u200B]+)\u200B/g, "").replace(/\u200Bforwarded\u200B/g, "") : "";

                                    if (cleanTextForCard.startsWith("👤 Contact Card:")) {
                                      return (
                                        <div className={`border rounded-xl p-3 flex flex-col gap-2.5 min-w-[180px] shadow-inner mt-1 text-left backdrop-blur-md ${isLight ? "bg-black/[0.03] border-black/10" : "bg-white/[0.04] border-white/10"}`}>
                                          <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${isLight ? "bg-black/5 border-black/10 text-gray-800" : "bg-white/15 border-white/10 text-white"}`}>
                                              👤
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className={`text-xs font-black truncate ${isLight ? "text-gray-900" : "text-white"}`}>
                                                {cleanTextForCard.split("\n")[1]?.replace("Name: ", "") || "Shared Contact"}
                                              </p>
                                              <p className={`text-[10px] truncate ${isLight ? "text-gray-500" : "text-white/40"}`}>
                                                {cleanTextForCard.split("\n")[2]?.replace("Email: ", "") || ""}
                                              </p>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              const emailLine = cleanTextForCard.split("\n")[2]?.replace("Email: ", "");
                                              if (emailLine && emailLine !== "N/A") {
                                                try {
                                                  const res = await saveContact(emailLine);
                                                  setConfirmModal({
                                                    isOpen: true,
                                                    isAlert: true,
                                                    title: "Save Contact",
                                                    description: res.message || "Contact saved successfully!",
                                                    icon: "info"
                                                  });
                                                  if (refreshChatList) await refreshChatList();
                                                  if (refreshContacts) await refreshContacts();
                                                } catch (err) {
                                                  console.error("Failed to auto-save shared contact:", err);
                                                }
                                              } else {
                                                setConfirmModal({
                                                  isOpen: true,
                                                  isAlert: true,
                                                  title: "Save Contact Error",
                                                  description: "Email not available on contact card.",
                                                  icon: "alert"
                                                });
                                              }
                                            }}
                                            className="w-full py-1.5 text-[9px] font-bold rounded-lg transition-colors text-center cursor-pointer shadow-md"
                                            style={{ backgroundColor: getPollHighlightColor(currentRoomTheme), color: "#0f0e15" }}
                                          >
                                            {t("blank_save_contact")}
                                          </button>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })() || (
                                      msg.message_text === "\u200Bdeleted\u200B" ? (
                                        <p className="text-[12px] leading-relaxed text-left pb-2 text-white/30 italic flex items-center gap-1.5 select-none">
                                          <svg className="w-3.5 h-3.5 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                          </svg>
                                          {t("deleted_message_placeholder")}
                                        </p>
                                      ) : (
                                        pollOptions && pollOptions.length > 0 ? (
                                          <div className="text-left pb-1">
                                            <p className={`text-[14px] font-bold leading-snug whitespace-pre-wrap ${isOwn ? "text-white" : (isLight ? "text-[#111827]" : "text-white")}`}>
                                              {(() => {
                                                if (!msg.message_text) return "";
                                                let clean = msg.message_text.replace(/^\u200B(reply:[^\u200B]+|status_reply:[^:]+:[^\u200B]+)\u200B/g, "").replace(/\u200Bforwarded\u200B/g, "");
                                                clean = clean.endsWith("\u200B") ? clean.replace(/\u200B/g, "") : clean;
                                                if (clean.startsWith(":")) {
                                                  clean = clean.substring(1).trim();
                                                }
                                                const parts = clean.split(/(@[a-zA-Z0-9_]+)/g);
                                                return parts.map((part, pIdx) => {
                                                  if (part.startsWith("@") && part.length > 1) {
                                                    return (
                                                      <span
                                                        key={pIdx}
                                                        className={`font-bold mr-1 ${isOwn ? "text-white underline" : "text-[#7c5dfa]"}`}
                                                        style={!isOwn ? { color: "#7c5dfa" } : {}}
                                                      >
                                                        {part}
                                                      </span>
                                                    );
                                                  }
                                                  return part;
                                                });
                                              })()}
                                            </p>
                                            <div className={`flex items-center justify-between text-[10px] mt-1 select-none ${isOwn ? "text-white/40" : (isLight ? "text-gray-500" : "text-white/40")}`}>
                                              <div className="flex items-center gap-1.5">
                                                <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                  <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span>{t("poll_select_one_or_more") || "Select one or more"}</span>
                                              </div>
                                              {isPollExpired && (
                                                <span className="px-2 py-0.5 bg-red-500/20 text-red-300 font-bold rounded-md text-[9px] uppercase border border-red-500/30">
                                                  {t("poll_closed") || "Poll Closed"}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          !isAttachmentOnly && (
                                            <p className={(msg.message_text.includes("\u200Bstatus_reply:") && isOnlyEmojis(msg.message_text.replace(/^\u200B(reply:[^\u200B]+|status_reply:[^:]+:[^\u200B]+)\u200B/g, "").replace(/\u200Bforwarded\u200B/g, ""))) ? "text-left pb-2 text-3xl animate-emoji-zoom select-none select-text" : `text-[13px] leading-relaxed whitespace-pre-wrap text-left pb-2 ${isOwn ? "text-white" : (isLight ? "text-[#111827]" : "text-white")}`}>
                                              {(() => {
                                                if (!msg.message_text) return "";
                                                let clean = msg.message_text.replace(/^\u200B(reply:[^\u200B]+|status_reply:[^:]+:[^\u200B]+)\u200B/g, "").replace(/\u200Bforwarded\u200B/g, "");
                                                clean = clean.endsWith("\u200B") ? clean.replace(/\u200B/g, "") : clean;
                                                if (clean.startsWith(":")) {
                                                  clean = clean.substring(1).trim();
                                                }
                                                const isEmojiOnly = msg.message_text.includes("\u200Bstatus_reply:") && isOnlyEmojis(clean);
                                                if (isEmojiOnly) {
                                                  return <span className="inline-block animate-emoji-zoom">{clean}</span>;
                                                }
                                                const parts = clean.split(/(@[a-zA-Z0-9_]+)/g);
                                                return parts.map((part, pIdx) => {
                                                  if (part.startsWith("@") && part.length > 1) {
                                                    return (
                                                      <span
                                                        key={pIdx}
                                                        className={`font-bold mr-1 ${isOwn ? "text-white underline" : "text-[#7c5dfa]"}`}
                                                        style={!isOwn ? { color: "#7c5dfa" } : {}}
                                                      >
                                                        {part}
                                                      </span>
                                                    );
                                                  }
                                                  return part;
                                                });
                                              })()}
                                            </p>
                                          )
                                        )
                                      )
                                    )}

                                  {pollOptions && pollOptions.length > 0 && (() => {
                                    const totalVotes = msg.poll_votes ? Object.values(msg.poll_votes).reduce((a, b) => Number(a) + Number(b), 0) : 0;
                                    const themeAccentColor = currentRoomTheme || "#7c5dfa";

                                    const textClass = isOwn
                                      ? "text-white"
                                      : (isLight ? "text-gray-900" : "text-white/90");
                                    const subTextClass = isOwn
                                      ? "text-white/70"
                                      : (isLight ? "text-gray-500" : "text-white/60");
                                    const trackClass = isOwn
                                      ? "bg-white/20"
                                      : (isLight ? "bg-gray-100" : "bg-white/10");
                                    const progressColor = isOwn
                                      ? "#ffffff"
                                      : themeAccentColor;
                                    const checkedBoxClass = isOwn
                                      ? "bg-white border-white"
                                      : `bg-[${themeAccentColor}] border-[${themeAccentColor}] text-white`;
                                    const uncheckedBoxClass = isOwn
                                      ? "border-white/40 bg-transparent"
                                      : (isLight ? "border-gray-300 bg-transparent" : "border-white/20 bg-transparent");

                                    return (
                                      <div className="mt-3.5 space-y-3 min-w-[240px]">
                                        {pollOptions.map((opt, optIdx) => {
                                          const votes = msg.poll_votes ? (msg.poll_votes[optIdx] || 0) : 0;
                                          const percent = totalVotes > 0 ? Math.min((votes / totalVotes) * 100, 100) : 0;
                                          const isMyVote = Number(msg.my_vote) === Number(optIdx);
                                          const cleanOpt = typeof opt === "string" ? opt.replace(/✅/g, "").trim() : opt;
                                          return (
                                            <button
                                              key={optIdx}
                                              type="button"
                                              disabled={isPollExpired}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isPollExpired) handleVoteInPoll(msg.id, optIdx);
                                              }}
                                              className={`w-full text-left py-2 px-1 flex flex-col gap-1.5 transition-all select-none group/opt ${isPollExpired ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                              <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3 truncate">
                                                  <div
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all shadow-sm ${isMyVote ? checkedBoxClass : uncheckedBoxClass}`}
                                                    style={isMyVote && !isOwn ? { backgroundColor: themeAccentColor, borderColor: themeAccentColor } : {}}
                                                  >
                                                    {isMyVote && (
                                                      <Check
                                                        className="w-3.5 h-3.5"
                                                        strokeWidth={4.5}
                                                        stroke={isOwn ? themeAccentColor : "#ffffff"}
                                                      />
                                                    )}
                                                  </div>
                                                  <span className={`text-xs font-semibold truncate ${textClass}`}>{cleanOpt}</span>
                                                </div>
                                                <span className={`text-xs font-semibold ${subTextClass}`}>{votes}</span>
                                              </div>

                                              <div className={`w-full h-1.5 rounded-full overflow-hidden relative ${trackClass}`}>
                                                <div
                                                  className="h-full rounded-full transition-all duration-500"
                                                  style={{ width: `${percent}%`, backgroundColor: progressColor }}
                                                />
                                              </div>
                                            </button>
                                          );
                                        })}

                                        <div className={`w-full border-t mt-3 pt-2.5 flex items-center justify-center ${isOwn ? "border-white/10" : (isLight ? "border-gray-200" : "border-white/5")}`}>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setStatusTip(`${t("poll_total_votes_desc") || "Total votes"}: ${totalVotes}`);
                                            }}
                                            className={`text-xs font-bold hover:underline cursor-pointer bg-transparent border-none py-0.5 ${isOwn ? "text-white/80 hover:text-white" : (isLight ? "text-gray-600 hover:text-gray-800" : "text-white/60 hover:text-white")}`}
                                          >
                                            {t("poll_view_votes") || "View votes"}
                                          </button>
                                        </div>
                                      </div>

                                    );
                                  })()}


                                  <div className="absolute bottom-[-2px] right-0 flex items-center gap-1.5 text-[9px] text-white/40 select-none">
                                    {msg.poll_votes && msg.poll_votes.starred === true && (
                                      <Star className="w-[10px] h-[10px] text-[#fbbf24] fill-[#fbbf24] starred-star shrink-0" />
                                    )}
                                    <span className="pt-0">
                                      {new Date(msg.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                      {(() => {
                                        if (!msg.message_text || msg.message_text === "\u200Bdeleted\u200B") return null;
                                        const cleanForEditCheck = msg.message_text.replace(/\u200Bhd\u200B/g, "").trim();
                                        if (cleanForEditCheck.endsWith("\u200B")) {
                                          return <span className="text-[8px] text-white/35 ml-1 italic">({t("edited_label")})</span>;
                                        }
                                        return null;
                                      })()}
                                    </span>
                                    {isOwn && (() => {
                                      const isReadReceiptsOn = typeof window !== "undefined" ?
                                        localStorage.getItem("pref_readReceipts") !== "false"
                                        : true;
                                      if (isReadReceiptsOn && msg.is_seen) {
                                        return <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] seen-tick" title="Seen" />;
                                      }
                                      return <Check className="w-3.5 h-3.5 text-white/30" title="Sent" />;
                                    })()}
                                  </div>
                                </div>

                                {
                                  msg.poll_votes && (!pollOptions || pollOptions.length === 0) && (() => {
                                    const activeReactions = Object.entries(msg.poll_votes)
                                      .filter(([optIdx, count]) => [1, 2, 3, 4, 5, 6].includes(Number(optIdx)) && count > 0)
                                      .map(([optIdx, count]) => ({
                                        idx: Number(optIdx),
                                        emoji: ["", "👍", "❤️", "😂", "😮", "😢", "🙏"][Number(optIdx)],
                                        count: Number(count)
                                      }));

                                    if (activeReactions.length === 0) return null;

                                    const isMyReaction = (reactionIdx) => Number(msg.my_vote) === reactionIdx;

                                    const getReactionTooltip = (reactIdx, baseCount) => {
                                      if (!msg.raw_votes) return `${baseCount} user(s) reacted`;
                                      const userIds = Object.entries(msg.raw_votes)
                                        .filter(([uid, idx]) => Number(idx) === Number(reactIdx))
                                        .map(([uid]) => Number(uid));

                                      if (userIds.length === 0) return `${baseCount} user(s) reacted`;

                                      const names = userIds.map(uid => {
                                        if (Number(uid) === Number(currentUser?.id)) {
                                          return "You";
                                        }
                                        const member = (groupMembers || []).find(m => Number(m.id) === Number(uid));
                                        if (member) {
                                          const contact = (contacts || []).find(c => Number(c.id) === Number(uid));
                                          return contact
                                            ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
                                            : (member.mobile || `${member.first_name || ""} ${member.last_name || ""}`.trim());
                                        }
                                        const contact = (contacts || []).find(c => Number(c.id) === Number(uid));
                                        if (contact) {
                                          return `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
                                        }
                                        return `User #${uid}`;
                                      });

                                      return `Reacted by: ${names.join(", ")}`;
                                    };

                                    return (
                                      <div className="reaction-pills-container select-none">
                                        {activeReactions.map((react, rIdx) => (
                                          <button
                                            key={rIdx}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleVoteInPoll(msg.id, react.idx);
                                            }}
                                            className={`reaction-pill ${isMyReaction(react.idx) ? "my-reaction" : ""}`}
                                            title={getReactionTooltip(react.idx, react.count)}
                                          >
                                            <span>{react.emoji}</span>
                                            {react.count > 1 && <span className="font-semibold text-[8px] ml-0.5">{react.count}</span>}
                                          </button>
                                        ))}
                                      </div>
                                    );
                                  })()
                                }
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {
              attachmentLoading && (
                <div className={`absolute bottom-16 left-6 right-6 px-4 py-2.5 rounded-xl flex items-center justify-between z-10 shadow-lg border ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "bg-white text-gray-800 border-gray-200 shadow-md" : "bg-[#211f31] text-white/60 border-white/5 shadow-lg"}`}>
                  <span className="text-xs">{t("blank_uploading_file")}</span>
                  <div className="w-4 h-4 border-2 border-[#7c5dfa] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )
            }
            {
              isTypingPartner && (
                <div className="px-5 py-1.5 bg-[#161421]/30 border-t border-white/[0.02] text-[#9f85ff] text-[10px] font-medium animate-pulse shrink-0 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-[#9f85ff] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-[#9f85ff] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-[#9f85ff] rounded-full animate-bounce"></span>
                  </div>
                  <span>{typingPartnerName} {t("blank_typing_indicator")}</span>
                </div>
              )
            }

            {
              replyingToMessage && (() => {
                const isMsgSenderSaved = replyingToMessage.sender && (contacts || []).some(c => Number(c.id) === Number(replyingToMessage.sender.id));
                const quotedSenderName = replyingToMessage.sender
                  ? (isMsgSenderSaved
                    ? `${replyingToMessage.sender.first_name} ${replyingToMessage.sender.last_name}`
                    : (replyingToMessage.sender.mobile ? `+${replyingToMessage.sender.mobile}` : `${replyingToMessage.sender.first_name} ${replyingToMessage.sender.last_name}`))
                  : "User";

                let cleanPreviewText = replyingToMessage.message_text ? replyingToMessage.message_text.replace(/\u200Breply:([^\u200B]+)\u200B/g, "").replace(/\u200Bforwarded\u200B/g, "").replace(/\u200B/g, "") : "Attachment";
                if (cleanPreviewText.startsWith("👤 Contact Card:")) {
                  cleanPreviewText = "👤 Contact Card";
                }

                return (
                  <div className={`px-5 py-2.5 bg-[#161421] border-t border-white/5 flex items-center justify-between gap-4 shrink-0 animate-fade-in relative ${showAttachmentMenu ? "z-[100]" : "z-30"}`}>
                    <div className="flex-1 min-w-0 border-l-4 pl-3 text-left" style={{ borderLeftColor: currentRoomTheme || '#7c5dfa' }}>
                      <p className="text-[10px] font-black tracking-wide uppercase" style={{ color: currentRoomTheme || '#7c5dfa' }}>
                        {t("replying_to") || "Replying to"} {quotedSenderName}
                      </p>
                      <p className="text-[11px] text-white/50 truncate mt-0.5 whitespace-nowrap">
                        {cleanPreviewText}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingToMessage(null)}
                      className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer shrink-0 animate-none"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()
            }

            {
              (() => {
                const mentionMatch = messageText ? messageText.match(/@([a-zA-Z0-9_\s]*)$/) : null;
                if (!mentionMatch) return null;
                const q = mentionMatch[1].toLowerCase();

                const membersList = (groupMembers && groupMembers.length > 0)
                  ? groupMembers
                  : (activeRoom?.members && activeRoom.members.length > 0)
                    ? activeRoom.members
                    : (activeRoom?.user ? [activeRoom.user] : (chatList || []).map(c => c.user || c).filter(Boolean));

                const filtered = (membersList || []).filter(m => {
                  if (!m) return false;
                  const fn = (m.first_name || m.name || "").toLowerCase();
                  const ln = (m.last_name || "").toLowerCase();
                  const em = (m.email || m.mobile || "").toLowerCase();
                  return fn.includes(q) || ln.includes(q) || em.includes(q);
                });

                const showEveryoneOption = 'everyone'.includes(q) || 'all'.includes(q);
                if (filtered.length === 0 && !showEveryoneOption) return null;

                return (
                  <div className="absolute bottom-16 left-12 z-[600] w-64 max-h-56 bg-[#1f1d2c] border border-white/10 rounded-xl shadow-2xl p-1.5 overflow-y-auto no-scrollbar animate-fade-in text-xs text-white">
                    <div className="text-[10px] font-bold text-white/40 px-2 py-1 uppercase tracking-wider">
                      {t("mention_member", "Mention Member (@)")}
                    </div>
                    {showEveryoneOption && (
                      <button
                        type="button"
                        onClick={() => {
                          const newText = messageText.replace(/@([a-zA-Z0-9_\s]*)$/, "@everyone ");
                          setMessageText(newText);
                          if (messageInputRef && messageInputRef.current) messageInputRef.current.focus();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border border-white/10 shrink-0"
                          style={{ backgroundColor: `${currentRoomTheme || '#7c5dfa'}30`, color: "#ffffff" }}
                        >
                          @
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs">@everyone</p>
                          <p className="text-[10px] text-white/50 truncate">{t("notify_everyone_desc", "Notify everyone in this chat")}</p>
                        </div>
                      </button>
                    )}
                    {filtered.map((m, mIdx) => {
                      const name = `${m.first_name || m.name || ""} ${m.last_name || ""}`.trim() || "User";
                      const cleanName = m.first_name || name;
                      return (
                        <button
                          key={m.id || mIdx}
                          type="button"
                          onClick={() => {
                            const newText = messageText.replace(/@([a-zA-Z0-9_\s]*)$/, `@${cleanName} `);
                            setMessageText(newText);
                            if (messageInputRef && messageInputRef.current) messageInputRef.current.focus();
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          {m.profile_image ? (
                            <img src={m.profile_image} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" />
                          ) : (
                            <div
                              className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center font-bold text-xs shrink-0"
                              style={{ backgroundColor: `${currentRoomTheme || '#7c5dfa'}30`, color: "#ffffff" }}
                            >
                              {cleanName[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-xs truncate">{name}</p>
                            <p className="text-[10px] text-white/50 truncate">{m.email || m.mobile || ""}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()
            }

            {
              (() => {
                const savedAdmins = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(`group_admins_${activeRoom?.id}`) || "[]") : [];
                const rawAdmins = activeRoom?.admins || savedAdmins || [];
                const secondaryAdminsList = (Array.isArray(rawAdmins) ? rawAdmins : []).map(Number);

                const isUserCreator = Number(activeRoom?.created_by) === Number(currentUser?.id);
                const isUserSecondaryAdmin = currentUser && (
                  secondaryAdminsList.includes(Number(currentUser?.id)) ||
                  (groupMembers && groupMembers.some(m => Number(m.id) === Number(currentUser.id) && m.role === "admin"))
                );
                const isUserAnyAdmin = isUserCreator || isUserSecondaryAdmin;

                const isOnlyAdminSendEnabled = activeRoom?.only_admins_send === true ||
                  (typeof window !== "undefined" && localStorage.getItem(`only_admin_send_${activeRoom?.id}`) === "true");
                const canSend = !isOnlyAdminSendEnabled || isUserAnyAdmin;
                const isLight = typeof window !== "undefined" && localStorage.getItem("theme") === "light";

                const onSubmitForm = (e) => {
                  if (e) e.preventDefault();
                  if (!canSend) return;
                  if (pendingAttachments.length > 0) {
                    handleUploadAndSend(e);
                    if (setReplyingToMessage) {
                      setReplyingToMessage(null);
                    }
                    return;
                  }
                  if (editingMessageId) {
                    if (handleSaveMessageEdit && messageText.trim()) {
                      handleSaveMessageEdit(editingMessageId, messageText);
                    }
                  } else if (handleSendMessage && messageText.trim()) {
                    if (replyingToMessage) {
                      const finalMsgText = `\u200Breply:${replyingToMessage.id}\u200B${messageText}`;
                      handleSendMessage(null, finalMsgText);
                      if (setReplyingToMessage) {
                        setReplyingToMessage(null);
                      }
                    } else {
                      handleSendMessage(e);
                    }
                  }
                };

                return (
                  <>
                    {!canSend && (
                      <div className={`flex items-center justify-center gap-2 py-2 px-4 shrink-0 text-xs font-semibold tracking-wide ${isLight ? "bg-amber-50 border-t border-amber-200 text-amber-700" : "bg-[#2a2210]/80 border-t border-amber-500/20 text-amber-400"}`}>
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        {t("only_admins_can_send", "Only admins can send messages in this group")}
                      </div>
                    )}
                    {pendingAttachments.length > 0 && (
                      <div className={`p-3 border-t flex gap-3 overflow-x-auto no-scrollbar items-center animate-fade-in shrink-0 relative z-30 ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#1c1a29]/95 border-white/5"
                        }`}>
                        {pendingAttachments.map((att, idx) => (
                          <div key={idx} className="relative w-16 h-16 shrink-0 mr-1.5 mt-1.5">
                            <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 bg-black/10 flex flex-col items-center justify-center">
                              {att.previewUrl ? (
                                <img src={att.previewUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center justify-center p-2 text-center w-full">
                                  <FileText className="w-5 h-5 text-[#9f85ff] mb-0.5" />
                                  <span className={`text-[7px] truncate w-12 font-medium ${isLight ? "text-gray-800" : "text-white/60"}`}>{att.name}</span>
                                </div>
                              )}
                            </div>
                            {att.type && att.type.startsWith("image/") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingAttachments(prev => prev.map((item, i) => i === idx ? { ...item, isHd: !item.isHd } : item));
                                }}
                                className={`absolute -bottom-1 -left-1 px-1 py-0.5 rounded text-[7px] font-black tracking-wide transition-all z-40 border cursor-pointer ${att.isHd
                                  ? "bg-[#7c5dfa] border-transparent text-white shadow-[0_2px_6px_rgba(124,93,250,0.4)]"
                                  : "bg-black/60 border-white/10 text-white/50 hover:bg-black/80"
                                  }`}
                              >
                                HD
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
                                setPendingAttachments(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer shadow-md flex items-center justify-center z-40 border border-white/10"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <form
                      onSubmit={onSubmitForm}
                      className={`h-16 border-t px-3 sm:px-4 flex items-center gap-2 sm:gap-3.5 backdrop-blur-md shrink-0 relative pb-[max(0.5rem,env(safe-area-inset-bottom))] ${isLight ? "bg-white/80 border-gray-200" : "bg-[#161421]/60 border-white/5"} ${showAttachmentMenu || showEmojiPicker ? "z-[500]" : "z-30"}`}
                    >

                      <div className="flex items-center gap-1.5">
                        <div className={`relative flex items-center ${showAttachmentMenu ? "z-[510]" : ""}`} ref={attachmentMenuRef}>
                          <button
                            type="button"
                            disabled={!canSend}
                            onClick={() => {
                              if (canSend) setShowAttachmentMenu(!showAttachmentMenu);
                            }}
                            className={`p-2 rounded-xl transition-all ${!canSend ? "opacity-20 cursor-not-allowed text-white/20" : "text-white/40 hover:text-[#b69eff] hover:bg-white/5 cursor-pointer"} ${showAttachmentMenu ? "text-[#9f85ff] bg-[#7c5dfa]/15" : ""}`}
                          >
                            <Plus className="w-5.5 h-5.5" />
                          </button>

                          {showAttachmentMenu && (
                            <div className="absolute bottom-14 left-0 z-[600] w-52 bg-[#1f1d2c]/95 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl p-2.5 space-y-1 animate-fade-in text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachmentMenu(false);
                                  if (docFileInputRef.current) docFileInputRef.current.click();
                                  else if (fileInputRef.current) fileInputRef.current.click();
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
                              >
                                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-left">{t("attachment_document")}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachmentMenu(false);
                                  if (mediaFileInputRef.current) mediaFileInputRef.current.click();
                                  else if (fileInputRef.current) fileInputRef.current.click();
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
                              >
                                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                </div>
                                <span className="font-medium text-left">{t("attachment_photos")}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachmentMenu(false);
                                  setIsContactSharingOpen(true);
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
                              >
                                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                                  <Users className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-left">{t("attachment_contact")}</span>
                              </button>

                              {activeRoom && (activeRoom.is_group || activeRoom.is_community) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAttachmentMenu(false);
                                    setIsPollCreationOpen(true);
                                  }}
                                  className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M12 20h9M3 20v-8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8M13 20v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8" />
                                    </svg>
                                  </div>
                                  <span className="font-medium text-left">{t("attachment_poll")}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachmentMenu(false);
                                  setIsEventCreationOpen(true);
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white"
                              >
                                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                  </svg>
                                </div>
                                <span className="font-medium text-left">{t("attachment_event")}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachmentMenu(false);
                                  setShowEmojiPicker(true);
                                  setEmojiPanelTab("sticker");
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-white/80 hover:text-white"
                              >
                                <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                  <Smile className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-left">{t("attachment_sticker")}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="relative flex items-center" ref={emojiPickerRef}>
                          <button
                            type="button"
                            disabled={!canSend}
                            onClick={() => {
                              if (canSend) setShowEmojiPicker(!showEmojiPicker);
                            }}
                            className={`p-2 rounded-xl transition-all ${!canSend ? "opacity-20 cursor-not-allowed text-white/20" : "text-white/40 hover:text-[#b69eff] hover:bg-white/5 cursor-pointer"} ${showEmojiPicker ? "text-[#9f85ff] bg-[#7c5dfa]/15" : ""}`}
                          >
                            <Smile className="w-5.5 h-5.5" />
                          </button>

                          {showEmojiPicker && (
                            <div className="fixed bottom-[72px] left-4 right-4 sm:absolute sm:bottom-14 sm:left-0 sm:right-auto z-50 mx-auto sm:mx-0 w-[calc(100vw-2rem)] max-w-sm sm:w-80 md:w-96 bg-[#1f1d2c] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in text-white">
                              <div className="flex border-b border-white/5 bg-[#161421]/60 text-xs shrink-0 select-none">
                                <button
                                  type="button"
                                  onClick={() => setEmojiPanelTab("emoji")}
                                  className={`flex-1 py-3 text-center font-bold tracking-wide transition-colors ${emojiPanelTab === "emoji"
                                    ? "text-[#9f85ff] border-b-2 border-[#7c5dfa]"
                                    : "text-white/40 hover:text-white/80"
                                    }`}
                                >
                                  {t("emoji_tab_emoji")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEmojiPanelTab("gif")}
                                  className={`flex-1 py-3 text-center font-bold tracking-wide transition-colors ${emojiPanelTab === "gif"
                                    ? "text-[#9f85ff] border-b-2 border-[#7c5dfa]"
                                    : "text-white/40 hover:text-white/80"
                                    }`}
                                >
                                  {t("emoji_tab_gif")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEmojiPanelTab("sticker")}
                                  className={`flex-1 py-3 text-center font-bold tracking-wide transition-colors ${emojiPanelTab === "sticker"
                                    ? "text-[#9f85ff] border-b-2 border-[#7c5dfa]"
                                    : "text-white/40 hover:text-white/80"
                                    }`}
                                >
                                  {t("emoji_tab_stickers")}
                                </button>
                              </div>

                              <div className="p-3 h-80 sm:h-96 overflow-y-auto no-scrollbar bg-[#1a1826]">
                                {emojiPanelTab === "emoji" && (
                                  <EmojiPicker
                                    theme={typeof window !== "undefined" && localStorage.getItem("theme") === "light" ? "light" : "dark"}
                                    width="100%"
                                    height="100%"
                                    onEmojiClick={(emojiData) => {
                                      const newText = messageText + emojiData.emoji;
                                      handleInputChange({ target: { value: newText } });
                                    }}
                                  />
                                )}

                                {emojiPanelTab === "gif" && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      { name: "Hilarious Laugh", url: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif" },
                                      { name: "Dance Party", url: "https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif" },
                                      { name: "Happy Dance", url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif" },
                                      { name: "Wow", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
                                      { name: "High Five", url: "https://media.giphy.com/media/l2JehQ2GitHGdVG9y/giphy.gif" },
                                      { name: "Happy Birthday", url: "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif" },
                                      { name: "Thank You", url: "https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif" },
                                      { name: "Good Job", url: "https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif" },
                                      { name: "Celebration", url: "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif" },
                                      { name: "Cute Puppy", url: "https://media.giphy.com/media/26BRQTezZrKak4BeE/giphy.gif" },
                                      { name: "Happy Cat", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" },
                                      { name: "Love You", url: "https://media.giphy.com/media/3oriO6qJiXajN0TyDu/giphy.gif" },
                                    ].map((gif, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        onClick={async () => {
                                          setShowEmojiPicker(false);
                                          await handleFileUpload(null, {
                                            url: gif.url,
                                            type: "gif",
                                            name: `${gif.name}.gif`
                                          });
                                        }}
                                        className="h-24 bg-black/20 rounded-xl overflow-hidden border border-white/5 hover:border-[#7c5dfa]/60 transition-all cursor-pointer relative group"
                                      >
                                        <img src={gif.url} alt={gif.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[9px] font-bold text-center py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                          {gif.name}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {emojiPanelTab === "sticker" && (
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { name: "Good Job", url: "/good-job.png" },
                                      { name: "Good Morning (1)", url: "/good-morning (1).png" },
                                      { name: "Good Morning", url: "/good-morning.png" },
                                      { name: "Good Night", url: "/good-night.png" },
                                      { name: "Happy", url: "/happy.png" },
                                      { name: "Hello", url: "/hello.png" },
                                      { name: "Monkey", url: "/monkey.png" },
                                      { name: "Thank You (1)", url: "/thank-you (1).png" },
                                      { name: "Thank You", url: "/thank-you.png" },
                                      { name: "Wow", url: "/wow.png" },
                                    ].map((sticker, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        onClick={async () => {
                                          setShowEmojiPicker(false);
                                          await handleFileUpload(null, {
                                            url: sticker.url,
                                            type: "sticker",
                                            name: `${sticker.name}.png`
                                          });
                                        }}
                                        className="h-20 bg-black/10 hover:bg-white/5 rounded-xl p-1 overflow-hidden border border-white/5 hover:border-[#7c5dfa]/60 transition-all cursor-pointer flex items-center justify-center relative group"
                                      >
                                        <img src={sticker.url} alt={sticker.name} className="max-h-full max-w-full object-contain" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={docFileInputRef}
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                      <input
                        type="file"
                        ref={mediaFileInputRef}
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />

                      <textarea
                        ref={messageInputRef}
                        disabled={!canSend}
                        value={messageText}
                        onChange={handleInputChange}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Escape" && editingMessageId) {
                            setEditingMessageId(null);
                            setEditingMessageText("");
                            setMessageText("");
                          }
                          if (e.key === "Enter" && !e.shiftKey) {
                            const isEnterSendEnabled = typeof window !== "undefined" ?
                              (localStorage.getItem("pref_enterIsSend") !== "false" && localStorage.getItem("pref_enterToSend") !== "false")
                              : true;
                            if (isEnterSendEnabled) {
                              e.preventDefault();
                              if (messageText.trim() || pendingAttachments.length > 0) {
                                onSubmitForm(e);
                              }
                            }
                          }
                        }}
                        placeholder={canSend ? t("blank_type_a_message") : (activeRoom?.is_community ? "🔒 Only admins can send messages" : "🔒 Only admins can send messages")}
                        className={`flex-1 rounded-xl px-3 sm:px-4 py-2.5 text-xs focus:outline-none transition-all resize-none max-h-24 ${!canSend
                          ? (isLight ? "bg-gray-100 border border-gray-200 cursor-not-allowed opacity-60 text-gray-400 placeholder:text-gray-400" : "bg-[#191724] border-transparent cursor-not-allowed opacity-60 text-white/40 placeholder:text-white/30")
                          : (isLight ? "bg-gray-100 border border-gray-200 focus:border-[#7c5dfa]/40 text-gray-900 placeholder:text-gray-400" : "bg-[#201e2e] border border-transparent focus:border-[#7c5dfa]/20 text-white placeholder:text-white/20")
                          }`}
                      />

                      {canSend ? (
                        <button
                          type="submit"
                          disabled={!messageText.trim() && pendingAttachments.length === 0}
                          className={`p-2.5 rounded-xl transition-all shadow-md ${(messageText.trim() || pendingAttachments.length > 0)
                            ? "bg-[#7c5dfa] hover:bg-[#684ce2] text-white cursor-pointer"
                            : "bg-white/5 text-white/20 cursor-not-allowed"

                            }`}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="p-2.5 text-white/20 rounded-xl cursor-not-allowed opacity-20"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                    </form>
                  </>
                );
              })()
            }
          </div>

          {showContactInfo && (
            <div className={`w-full lg:w-[380px] xl:w-[420px] h-full flex flex-col shrink-0 z-40 overflow-hidden animate-fade-in max-lg:fixed max-lg:inset-0 max-lg:z-[60] ${typeof window !== "undefined" && localStorage.getItem("theme") === "light" ? "bg-white text-gray-900" : "bg-[#161421] text-white"}`}>
              {activeRoom.is_group ? (
                (() => {
                  const isLight = typeof window !== "undefined" && localStorage.getItem("theme") === "light";
                  const savedAdmins = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(`group_admins_${activeRoom.id}`) || "[]") : [];
                  const secondaryAdminsList = activeRoom.admins || savedAdmins || [];
                  const isUserCreator = Number(activeRoom.created_by) === Number(currentUser?.id);
                  const isUserSecondaryAdmin = currentUser && (
                    secondaryAdminsList.map(Number).includes(Number(currentUser.id)) ||
                    (groupMembers && groupMembers.some(m => Number(m.id) === Number(currentUser.id) && m.role === "admin"))
                  );
                  const isUserAnyAdmin = isUserCreator || isUserSecondaryAdmin;

                  const sharedMediaMessages = (visibleMessages || []).filter(
                    (m) => m.attachment_url || m.attachment_type || m.message_text?.startsWith("http")
                  );
                  const starredMessagesList = (visibleMessages || []).filter((m) => m.is_starred || m.starred);

                  const isMemberChangesEnabled = localStorage.getItem(`member_changes_${activeRoom.id}`) === "true";
                  const isOnlyAdminSendEnabled = adminOnlySendState === true;
                  const isMuted = localStorage.getItem(`mute_${activeRoom.id}`) === "true";

                  return (
                    <div className={`flex-1 flex flex-col overflow-hidden animate-fade-in relative z-50 ${isLight ? "bg-[#f4f5f8] text-gray-900" : "bg-[#161421] text-white"}`}>
                      <header className={`h-14 border-b flex items-center justify-between px-4 sm:px-6 backdrop-blur-md shrink-0 relative z-50 ${isLight ? "border-gray-200 bg-white/90" : "border-white/5 bg-[#161422]/90"}`}>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setShowContactInfo(false)}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? "hover:bg-gray-100 text-gray-600 hover:text-gray-900" : "hover:bg-white/5 text-white/70 hover:text-white"}`}
                            title={t("close", "Close")}
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <span className={`text-sm font-bold tracking-wide select-none ${isLight ? "text-gray-900" : "text-white"}`}>
                            {activeRoom.is_community ? t("community_info", "Community info") : t("group_info", "Group info")}
                          </span>
                        </div>
                      </header>

                      <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 w-full space-y-4 select-none">

                        <div className={`border rounded-2xl p-5 flex flex-col items-center text-center shadow-sm relative ${isLight ? "bg-white border-gray-200/80" : "bg-[#1b1928] border-white/5"}`}>
                          <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-[#7c5dfa] to-purple-600 flex items-center justify-center font-bold text-3xl shadow-xl shrink-0 relative group border-4 ${isLight ? "border-white" : "border-[#111019]"}`}>
                            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                              {activeRoom.group_image ? (
                                <img src={activeRoom.group_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-10 h-10 text-white" />
                              )}
                            </div>
                            {isUserAnyAdmin && (
                              <button
                                type="button"
                                onClick={() => groupImageInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex flex-col items-center justify-center text-white transition-all cursor-pointer"
                              >
                                <Camera className="w-5 h-5 mb-1" />
                                <span className="text-[9px] font-bold uppercase">{t("edit", "Edit")}</span>
                              </button>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={groupImageInputRef}
                            accept="image/*"
                            onChange={(e) => {
                              handleGroupImageChange(e);
                              if (isMemberChangesEnabled) {
                                setStatusTip("Group image updated!");
                              }
                            }}
                            className="hidden"
                          />

                          {isEditingTitleInline ? (
                            <div className="mt-3 flex items-center justify-center gap-1.5 w-full px-2">
                              <input
                                type="text"
                                value={inlineTitleText}
                                onChange={(e) => setInlineTitleText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && inlineTitleText.trim()) {
                                    setEditGroupName(inlineTitleText.trim());
                                    handleRenameGroup();
                                    setIsEditingTitleInline(false);
                                  } else if (e.key === "Escape") {
                                    setIsEditingTitleInline(false);
                                  }
                                }}
                                autoFocus
                                className={`rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none w-full text-center shadow-inner ${isLight ? "bg-gray-100 text-gray-900 border border-gray-300" : "bg-[#262338] text-white border border-[#7c5dfa]/60"}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (inlineTitleText.trim()) {
                                    setEditGroupName(inlineTitleText.trim());
                                    handleRenameGroup();
                                    setIsEditingTitleInline(false);
                                  }
                                }}
                                className="p-1.5 bg-[#7c5dfa] hover:bg-[#684ce2] text-white rounded-xl transition-colors cursor-pointer shrink-0"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsEditingTitleInline(false)}
                                className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${isLight ? "bg-gray-200 hover:bg-gray-300 text-gray-700" : "bg-white/10 hover:bg-white/20 text-white/60"}`}
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="mt-3 flex items-center justify-center gap-2 w-full px-2">
                              <h3 className={`text-base font-bold tracking-wide truncate ${isLight ? "text-gray-900" : "text-white"}`}>{activeRoom.name}</h3>
                              {isUserAnyAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsEditingTitleInline(true);
                                    setInlineTitleText(activeRoom.name);
                                  }}
                                  className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${isLight ? "hover:bg-gray-100 text-gray-500 hover:text-gray-900" : "hover:bg-white/10 text-white/50 hover:text-white"}`}
                                  title="Edit group name"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-[#7c5dfa] font-semibold mt-1">
                            {activeRoom.is_community ? `Community · ${groupMembers.length} Groups` : `Group · ${groupMembers.length} members`}
                          </p>

                          <div className={`flex items-center justify-center mt-4 pt-3 border-t w-full ${isLight ? "border-gray-200" : "border-white/5"}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setShowContactInfo(false);
                                if (setIsGroupModalOpen) setIsGroupModalOpen(true);
                              }}
                              className={`flex flex-col items-center gap-1 transition-colors cursor-pointer group ${isLight ? "text-gray-700 hover:text-gray-900" : "text-white/80 hover:text-white"}`}
                            >
                              <div className="w-10 h-10 rounded-full bg-[#7c5dfa]/15 group-hover:bg-[#7c5dfa]/25 text-[#7c5dfa] dark:text-[#b69eff] flex items-center justify-center border border-[#7c5dfa]/30 transition-all">
                                <UserPlus className="w-4.5 h-4.5" />
                              </div>
                              <span className="text-[10px] font-bold">{t("add_member", "Add member")}</span>
                            </button>
                          </div>
                        </div>

                        <div className={`border rounded-2xl p-4 space-y-1.5 shadow-sm ${isLight ? "bg-white border-gray-200/80" : "bg-[#1b1928] border-white/5"}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#7c5dfa] uppercase tracking-wider">
                              {t("group_description", "Group description")}
                            </span>
                            {isUserAnyAdmin && !isEditingAboutInline && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingAboutInline(true);
                                  setInlineAboutText(editGroupAbout || "");
                                }}
                                className={`p-1 rounded-lg transition-colors cursor-pointer ${isLight ? "hover:bg-gray-100 text-gray-500 hover:text-gray-900" : "hover:bg-white/10 text-white/50 hover:text-white"}`}
                                title="Edit group description"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {isEditingAboutInline ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                value={inlineAboutText}
                                onChange={(e) => setInlineAboutText(e.target.value)}
                                rows={3}
                                autoFocus
                                placeholder="Write group description here..."
                                className={`w-full text-xs rounded-xl p-2.5 focus:outline-none resize-none shadow-inner ${isLight ? "bg-gray-100 text-gray-900 border border-gray-300" : "bg-[#262338] text-white border border-[#7c5dfa]/60"}`}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsEditingAboutInline(false)}
                                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${isLight ? "bg-gray-200 hover:bg-gray-300 text-gray-700" : "bg-white/10 hover:bg-white/20 text-white/70"}`}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditGroupAbout(inlineAboutText.trim());
                                    localStorage.setItem(`group_about_${activeRoom.id}`, inlineAboutText.trim());
                                    setStatusTip("Group description saved!");
                                    setIsEditingAboutInline(false);
                                  }}
                                  className="px-3 py-1 bg-[#7c5dfa] hover:bg-[#684ce2] text-white text-xs rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> {t("save", "Save")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className={`text-xs leading-relaxed font-medium ${isLight ? "text-gray-600" : "text-white/70"}`}>
                              {editGroupAbout || (t("add_group_description") || "Add group description")}
                            </p>
                          )}
                        </div>

                        {activeRoom.is_community && (
                          <div className={`border rounded-2xl p-4 space-y-3.5 shadow-sm ${isLight ? "bg-white border-gray-200/80 text-gray-800" : "bg-[#1b1928] border-white/5 text-white"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#7c5dfa]" />
                                <span className="text-xs font-black uppercase tracking-wider">{t("community_groups", "Groups in this community")}</span>
                              </div>
                              {isUserAnyAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubGroupManagerTab("list");
                                    setNewSubGroupName("");
                                    setSelectedSubGroupMembers([]);
                                    setIsCommunityGroupManagerOpen(true);
                                  }}
                                  className="text-[10px] font-extrabold text-[#b69eff] bg-[#7c5dfa]/10 hover:bg-[#7c5dfa]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer select-none"
                                >
                                  {t("manage_groups", "Manage Groups")}
                                </button>
                              )}
                            </div>

                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar divide-y divide-white/[0.02]">
                              {(() => {
                                const subGroups = (chatList || []).filter(c => c.is_group && !c.is_community && Number(c.community_id) === Number(activeRoom.id));
                                if (subGroups.length === 0) {
                                  return (
                                    <p className="text-[10px] text-white/30 text-center py-4 italic">{t("no_groups_linked", "No groups linked to this community yet.")}</p>
                                  );
                                }

                                return subGroups.map((group) => (
                                  <div key={group.id} className="pt-2 flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-[#7c5dfa]/10 border border-[#7c5dfa]/20 flex items-center justify-center font-bold text-xs shrink-0 text-[#b69eff]">
                                        #
                                      </div>
                                      <div className="truncate">
                                        <p className="text-xs font-bold truncate">{group.name}</p>
                                        <p className="text-[9px] text-white/30 truncate mt-0.5">{group.members?.length || 0} {t("members", "members")}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (typeof handleSelectRoom === "function") {
                                          handleSelectRoom(group);
                                        }
                                      }}
                                      className="text-[9px] font-bold text-[#b69eff] hover:text-[#7c5dfa] transition-colors bg-[#7c5dfa]/5 hover:bg-[#7c5dfa]/15 px-2 py-1 rounded-lg cursor-pointer border-none"
                                    >
                                      {t("open_chat", "Open Chat")}
                                    </button>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        )}

                        <div
                          onClick={() => setIsMediaModalOpen(true)}
                          className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors shadow-sm ${isLight ? "bg-white border-gray-200/80 hover:bg-gray-50 text-gray-800" : "bg-[#1b1928] border-white/5 hover:bg-white/[0.02] text-white"}`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className={`w-4 h-4 ${isLight ? "text-gray-500" : "text-white/60"}`} />
                            <span className="text-xs font-bold">{t("media_links_docs", "Media, links and docs")}</span>
                          </div>
                          <span className={`text-xs font-mono font-bold ${isLight ? "text-gray-400" : "text-white/40"}`}>{sharedMediaMessages.length} ›</span>
                        </div>

                        <div className={`border rounded-2xl divide-y shadow-sm ${isLight ? "bg-white border-gray-200/80 divide-gray-100" : "bg-[#1b1928] border-white/5 divide-white/5"}`}>

                          <div
                            onClick={() => setIsStarredModalOpen(true)}
                            className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${isLight ? "hover:bg-gray-50" : "hover:bg-white/[0.02]"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Star className="w-4 h-4 text-amber-400" />
                              <span className={`text-xs font-bold ${isLight ? "text-gray-800" : "text-white"}`}>{t("starred_messages", "Starred messages")}</span>
                            </div>
                            <span className={`text-xs ${isLight ? "text-gray-400" : "text-white/40"}`}>{starredMessagesList.length > 0 ? `${starredMessagesList.length} ›` : "›"}</span>
                          </div>



                          <div className="border-t border-b border-dashed my-1 border-white/5">
                            <div
                              onClick={() => setIsDisappearingDropdownOpen(!isDisappearingDropdownOpen)}
                              className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${isLight ? "hover:bg-gray-50" : "hover:bg-white/[0.02]"}`}
                            >
                              <div className="flex items-center gap-3">
                                <Clock1 className={`w-4 h-4 ${isLight ? "text-gray-500" : "text-white/60"}`} />
                                <div>
                                  <p className={`text-xs font-bold ${isLight ? "text-gray-800" : "text-white"}`}>{t("disappearing_messages", "Disappearing messages")}</p>
                                  <p className="text-[10px] text-[#7c5dfa] font-semibold mt-0.5">{disappearingMode}</p>
                                </div>
                              </div>
                              <span className={`text-xs transition-transform duration-200 ${isDisappearingDropdownOpen ? "rotate-90" : ""} ${isLight ? "text-gray-400" : "text-white/40"}`}>›</span>
                            </div>

                            {isDisappearingDropdownOpen && (
                              <div className={`mx-3 mb-3 p-1.5 rounded-xl border space-y-1 transition-all animate-fade-in ${isLight ? "bg-gray-50 border-gray-200" : "bg-black/20 border-white/10"}`}>
                                {["24 hours", "7 days", "90 days", "Off"].map((option) => {
                                  const isSelected = disappearingMode === option;
                                  return (
                                    <div
                                      key={option}
                                      onClick={() => {
                                        setDisappearingMode(option);
                                        if (typeof setDisappearingDuration === "function") setDisappearingDuration(option);
                                        localStorage.setItem(`disappearing_${activeRoom.id}`, option);
                                        localStorage.setItem("disappearingDuration", option);
                                        setIsDisappearingDropdownOpen(false);
                                        if (handleSendMessage && option !== "Off") {
                                          handleSendMessage(null, `Your chat is disappearing. Messages will automatically disappear after ${option}.`);
                                        }
                                      }}
                                      className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-all ${isSelected ? (isLight ? "bg-[#7c5dfa]/15 text-[#7c5dfa] font-bold" : "bg-[#7c5dfa]/20 text-[#b69eff] font-bold") : (isLight ? "hover:bg-gray-200/60 text-gray-700 text-xs" : "hover:bg-white/5 text-white/70 text-xs")}`}
                                    >
                                      <span>{option}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-[#7c5dfa]" />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {isUserAnyAdmin && (
                            <div className="border-t border-dashed my-1 border-white/5">
                              <div
                                onClick={() => setIsGroupSendDropdownOpen && setIsGroupSendDropdownOpen(!isGroupSendDropdownOpen)}
                                className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${isLight ? "hover:bg-gray-50" : "hover:bg-white/[0.02]"}`}
                              >
                                <div className="flex items-center gap-3">
                                  <svg className={`w-4 h-4 ${isLight ? "text-gray-500" : "text-white/60"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                  <div>
                                    <p className={`text-xs font-bold ${isLight ? "text-gray-800" : "text-white"}`}>{t("group_send_permission", "Send Messages")}</p>
                                    <p className={`text-[10px] mt-0.5 font-medium ${isOnlyAdminSendEnabled ? "text-amber-400" : "text-[#7c5dfa]"}`}>
                                      {isOnlyAdminSendEnabled ? t("only_admins", "Only Admins") : t("all_participants", "All Participants")}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-xs ${isLight ? "text-gray-400" : "text-white/40"}`}>›</span>
                              </div>

                              {isGroupSendDropdownOpen && (
                                <div className={`mx-3 mb-3 p-1.5 rounded-xl border space-y-1 transition-all animate-fade-in ${isLight ? "bg-gray-50 border-gray-200" : "bg-black/20 border-white/10"}`}>
                                  {[
                                    {
                                      value: false,
                                      label: activeRoom.is_community ? "Everyone" : t("all_participants", "All Participants"),
                                      desc: activeRoom.is_community ? "Anyone in this community can send messages" : t("all_participants_desc", "Anyone in this group can send messages")
                                    },
                                    {
                                      value: true,
                                      label: t("only_admins", "Only Admins"),
                                      desc: activeRoom.is_community ? "Only admins can send messages in this community" : t("only_admins_desc", "Only admins can send messages")
                                    },
                                  ].map(({ value, label, desc }) => {
                                    const isSelected = isOnlyAdminSendEnabled === value;
                                    return (
                                      <div
                                        key={String(value)}
                                        onClick={async () => {
                                          localStorage.setItem(`only_admin_send_${activeRoom.id}`, String(value));
                                          if (typeof setActiveRoom === "function") {
                                            setActiveRoom(prev => ({ ...prev, only_admins_send: value }));
                                          }
                                          setAdminOnlySendState(value);
                                          try {
                                            await updateGroupPermissions(activeRoom.id, value);
                                          } catch (err) {
                                            console.error("Failed to persist permission to backend:", err);
                                          }
                                          if (isGroupSendDropdownOpen && typeof setIsGroupSendDropdownOpen === "function") setIsGroupSendDropdownOpen(false);
                                          setStatusTip(value ? "Only admins can now send messages." : "All participants can now send messages.");
                                          if (handleSendMessage) {
                                            handleSendMessage(null, value
                                              ? (activeRoom.is_community
                                                ? `🔒 This community's messages can now only be sent by admins.`
                                                : `🔒 This group's messages can now only be sent by admins.`)
                                              : (activeRoom.is_community
                                                ? `🔓 All participants can now send messages in this community.`
                                                : `🔓 All participants can now send messages in this group.`));
                                          }
                                        }}
                                        className={`p-2.5 rounded-lg flex items-start justify-between gap-2 cursor-pointer transition-all ${isSelected
                                          ? (isLight ? "bg-[#7c5dfa]/15 text-[#7c5dfa] font-bold" : "bg-[#7c5dfa]/20 text-[#b69eff] font-bold")
                                          : (isLight ? "hover:bg-gray-200/60 text-gray-700 text-xs" : "hover:bg-white/5 text-white/70 text-xs")
                                          }`}
                                      >
                                        <div>
                                          <p className="text-xs font-bold">{label}</p>
                                          <p className={`text-[10px] mt-0.5 ${isSelected ? "opacity-70" : (isLight ? "text-gray-400" : "text-white/40")}`}>{desc}</p>
                                        </div>
                                        {isSelected && <svg className="w-3.5 h-3.5 text-[#7c5dfa] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          <div
                            onClick={() => {
                              setShowContactInfo(false);
                              if (typeof setGroupName === "function") setGroupName(`Copy of ${activeRoom.name}`);
                              if (typeof setSelectedGroupMembers === "function") setSelectedGroupMembers(groupMembers.map(m => Number(m.id)));
                              if (typeof setIsGroupModalOpen === "function") setIsGroupModalOpen(true);
                            }}
                            className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${isLight ? "hover:bg-gray-50" : "hover:bg-white/[0.02]"}`}
                          >
                            <Users className="w-4 h-4 text-[#7c5dfa]" />
                            <div>
                              <p className={`text-xs font-bold ${isLight ? "text-gray-800" : "text-white"}`}>{t("create_similar_group", "Create a similar group")}</p>
                              <p className={`text-[10px] mt-0.5 ${isLight ? "text-gray-500" : "text-white/40"}`}>Copy group with the same members.</p>
                            </div>
                          </div>

                        </div>

                        {activeRoom.is_community && isUserAnyAdmin && communityRequests.length > 0 && (
                          <div className={`border rounded-2xl p-4 space-y-3 shadow-sm ${isLight ? "bg-white border-gray-200/80" : "bg-[#1b1928] border-white/5"}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-black uppercase tracking-wider ${isLight ? "text-gray-900" : "text-[#b69eff]"}`}>
                                {t("community_join_requests_label", "Join Requests")} ({communityRequests.length})
                              </span>
                            </div>

                            <div className={`space-y-2 divide-y ${isLight ? "divide-gray-100" : "divide-white/[0.03]"}`}>
                              {communityRequests.map((req) => {
                                const user = req.signup_users;
                                if (!user) return null;
                                const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
                                return (
                                  <div key={req.id} className="pt-2 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${isLight ? "bg-gray-200 text-gray-800 border-gray-300" : "bg-[#2c283d] text-white border-white/10"}`}>
                                        {user.profile_image ? (
                                          <img src={user.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                                        ) : userInitials}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{user.first_name} {user.last_name}</p>
                                        <p className="text-[9px] text-white/40 truncate mt-0.5">{user.email}</p>
                                      </div>
                                    </div>

                                    <div className="flex gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            const res = await handleJoinRequest(activeRoom.id, req.id, "approved");
                                            if (res && res.success) {
                                              setStatusTip(t("approved_request_success", "Approved request successfully!"));
                                              await fetchCommunityRequests();
                                              await fetchGroupMembers(activeRoom.id);
                                              if (refreshChatList) await refreshChatList();
                                            }
                                          } catch (err) {
                                            console.error(err);
                                            setStatusTip(t("failed_approve_request", "Failed to approve request."));
                                          }
                                        }}
                                        className="px-2.5 py-1 bg-[#7c5dfa] hover:bg-[#684ce2] text-white text-[9px] font-bold rounded-lg cursor-pointer border-none"
                                      >
                                        {t("approve", "Approve")}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            const res = await handleJoinRequest(activeRoom.id, req.id, "rejected");
                                            if (res && res.success) {
                                              setStatusTip(t("rejected_request_success", "Rejected request successfully."));
                                              await fetchCommunityRequests();
                                            }
                                          } catch (err) {
                                            console.error(err);
                                            setStatusTip(t("failed_reject_request", "Failed to reject request."));
                                          }
                                        }}
                                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[9px] font-bold rounded-lg cursor-pointer border-none"
                                      >
                                        {t("reject", "Reject")}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className={`border rounded-2xl p-4 space-y-3 shadow-sm ${isLight ? "bg-white border-gray-200/80" : "bg-[#1b1928] border-white/5"}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-gray-900" : "text-white"}`}>
                              {groupMembers.length} {t("members", "members")}
                            </span>
                          </div>

                          <div className={`space-y-1.5 divide-y ${isLight ? "divide-gray-100" : "divide-white/[0.03]"}`}>
                            {groupMembers.map((member) => {
                              if (!member) return null;
                              const isCreator = Number(member.id) === Number(activeRoom.created_by);
                              const isSecAdmin = secondaryAdminsList.includes(Number(member.id)) || member.role === "admin";
                              const isAdmin = isCreator || isSecAdmin;
                              const memberInitials = `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`.toUpperCase();

                              return (
                                <div key={member.id} className={`pt-2 flex items-center justify-between p-1.5 rounded-xl transition-colors ${isLight ? "hover:bg-gray-50" : "hover:bg-white/[0.02]"}`}>
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${isLight ? "bg-gray-200 text-gray-800 border-gray-300" : "bg-[#2c283d] text-white border-white/10"}`}>
                                      {member.profile_image ? (
                                        <img src={member.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                                      ) : memberInitials}
                                    </div>
                                    <div className="min-w-0">
                                      <p className={`text-xs font-bold truncate ${isLight ? "text-gray-900" : "text-white"}`}>
                                        {(() => {
                                          const contact = (contacts || []).find(c => Number(c.id) === Number(member.id));
                                          if (Number(member.id) === Number(currentUser?.id)) {
                                            return `${member.first_name || ""} ${member.last_name || ""}`.trim();
                                          }
                                          return contact
                                            ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
                                            : (member.mobile || `${member.first_name || ""} ${member.last_name || ""}`.trim());
                                        })()}
                                        {Number(member.id) === Number(currentUser?.id) && (
                                          <span className="ml-1 text-[10px] text-[#7c5dfa] font-normal italic">({t("contacts_you_badge", "You")})</span>
                                        )}
                                      </p>
                                      <p className={`text-[10px] truncate ${isLight ? "text-gray-500" : "text-white/40"}`}>{member.mobile || member.email}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {isAdmin && (
                                      <span className="text-[9px] bg-[#7c5dfa]/15 text-[#7c5dfa] border border-[#7c5dfa]/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-sans">
                                        {activeRoom?.is_community ? t("community_admin", "Community admin") : t("group_admin", "Group admin")}
                                      </span>
                                    )}

                                    {isUserAnyAdmin && Number(member.id) !== Number(currentUser?.id) && !isCreator && (
                                      <div className="flex gap-1 items-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newRole = isSecAdmin ? "member" : "admin";
                                            updateMemberRole(activeRoom.id, member.id, newRole)
                                              .then(async (apiRes) => {
                                                if (apiRes.success) {
                                                  let updated;
                                                  if (isSecAdmin) {
                                                    updated = secondaryAdminsList.filter(id => Number(id) !== Number(member.id));
                                                    setStatusTip(`Dismissed ${member.first_name} as Admin.`);
                                                    if (handleSendMessage) handleSendMessage(null, `${member.first_name} is no longer a group admin.`);
                                                  } else {
                                                    updated = [...secondaryAdminsList, Number(member.id)];
                                                    setStatusTip(`Promoted ${member.first_name} to Admin.`);
                                                    if (handleSendMessage) handleSendMessage(null, `${member.first_name} is now a group admin.`);
                                                  }
                                                  localStorage.setItem(`group_admins_${activeRoom.id}`, JSON.stringify(updated));
                                                  setCurrentGroupAdmins(updated);
                                                  if (refreshChatList) await refreshChatList();
                                                } else {
                                                  setStatusTip("Failed to update member role.");
                                                }
                                              })
                                              .catch(err => {
                                                console.error("Role update failed:", err);
                                                setStatusTip("Error updating member role.");
                                              });
                                          }}
                                          className="w-5 h-5 flex items-center justify-center bg-[#7c5dfa]/15 hover:bg-[#7c5dfa]/30 text-[#7c5dfa] rounded font-bold text-xs cursor-pointer"
                                          title={isSecAdmin ? "Demote Admin" : "Make Admin (+)"}
                                        >
                                          {isSecAdmin ? "−" : "+"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              if (activeRoom.is_community) {
                                                await removeMemberFromCommunity(activeRoom.id, member.id);
                                              } else {
                                                await removeMemberFromGroup(activeRoom.id, member.id);
                                              }
                                              setStatusTip("Member removed.");
                                              if (handleSendMessage) handleSendMessage(null, `🚪 ${member.first_name} left/was removed from the group.`);
                                              await fetchGroupMembers(activeRoom.id);
                                              if (refreshChatList) await refreshChatList();
                                            } catch (err) {
                                              console.error(err);
                                              setStatusTip("Failed to remove member.");
                                            }
                                          }}
                                          className="w-5 h-5 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded cursor-pointer"
                                          title="Remove Member"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className={`border rounded-2xl divide-y font-medium shadow-sm ${isLight ? "bg-white border-gray-200/80 divide-gray-100" : "bg-[#1b1928] border-white/5 divide-white/5"}`}>

                          <div
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: t("clear_chat", "Clear chat"),
                                description: "Are you sure you want to clear all messages in this group for yourself?",
                                icon: "trash",
                                onConfirm: async () => {
                                  localStorage.setItem(`cleared_at_${currentUser?.id}_${activeRoom.id}`, new Date().toISOString());
                                  setMessages([]);
                                  setStatusTip("Chat cleared locally.");
                                }
                              });
                            }}
                            className={`p-3.5 flex items-center gap-3 text-red-500 hover:text-red-600 cursor-pointer transition-colors ${isLight ? "hover:bg-red-50" : "hover:bg-red-950/10"}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold">{t("clear_chat", "Clear chat")}</span>
                          </div>

                          <div
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: activeRoom.is_community ? "Exit community" : "Exit group",
                                description: activeRoom.is_community ? "Are you sure you want to exit this community?" : "Are you sure you want to exit this group?",
                                icon: "trash",
                                onConfirm: async () => {
                                  await handleDeleteRoom(activeRoom.id, "me");
                                }
                              });
                            }}
                            className={`p-3.5 flex items-center gap-3 text-red-500 hover:text-red-600 cursor-pointer transition-colors ${isLight ? "hover:bg-red-50" : "hover:bg-red-950/10"}`}
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold">{activeRoom?.is_community ? t("exit_community", "Exit community") : t("exit_group", "Exit group")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const isLight = typeof window !== "undefined" && localStorage.getItem("theme") === "light";
                  const userToDisplay = !currentPartner ? currentUser : currentPartner;
                  const initials = userToDisplay
                    ? `${userToDisplay.first_name?.[0] || ""}${userToDisplay.last_name?.[0] || ""}`.toUpperCase()
                    : "U";

                  return (
                    <div className={`flex-1 flex flex-col overflow-hidden animate-fade-in relative z-50 ${isLight ? "bg-[#ffffff] text-gray-900" : "bg-[#161421] text-white"}`}>
                      <header className={`h-14  flex items-center gap-3 px-4 sm:px-6 backdrop-blur-md shrink-0 relative z-50 ${isLight ? "border-gray-200 bg-white/90" : "border-white/5 bg-[#161422]/90"}`}>
                        <button
                          type="button"
                          onClick={() => setShowContactInfo(false)}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? "hover:bg-gray-100 text-gray-600 hover:text-gray-900" : "hover:bg-white/5 text-white/70 hover:text-white"}`}
                          title={t("close", "Close")}
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <span className={`text-md font-bold tracking-wide select-none ${isLight ? "text-gray-900" : "text-white"}`}>
                          {t("contact_profile_title") || "Contact info"}
                        </span>
                      </header>

                      <div className="flex-1 overflow-y-auto no-scrollbar select-none">
                        <div className="w-full">

                          <div className={`p-6 flex flex-col items-center text-center ${isLight ? "bg-white" : "bg-[#161422]/80"}`}>
                            <div
                              onClick={() => {
                                if (userToDisplay?.profile_image) setIsLargeAvatarOpen(true);
                              }}
                              className={`w-24 h-24 rounded-full bg-gradient-to-tr from-[#7c5dfa] to-purple-600 flex items-center justify-center font-bold text-3xl shadow-xl cursor-pointer hover:scale-105 transition-all overflow-hidden relative shrink-0 mb-3 border-4 ${isLight ? "border-white" : "border-[#111019]"}`}
                            >
                              {userToDisplay?.profile_image ? (
                                <img src={userToDisplay.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>
                            <h3 className={`text-base text-[15px] font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                              {userToDisplay?.first_name} {userToDisplay?.last_name}
                            </h3>
                          </div>

                          <div className="p-4 space-y-3">
                            {userToDisplay?.mobile && (
                              <div className={`rounded-2xl p-4 space-y-1.5 shadow-sm border ${isLight ? "bg-white border-gray-200/80" : "bg-[#1b1928] border-white/5"}`}>
                                <span className="text-[10px] font-bold text-[#7c5dfa] uppercase tracking-wider">
                                  {t("phone") || "Phone"}
                                </span>
                                <p className={`text-xs font-semibold select-all ${isLight ? "text-gray-700" : "text-white/80"}`}>
                                  {userToDisplay.mobile}
                                </p>
                              </div>
                            )}

                            <div className={`rounded-2xl p-4 space-y-1.5 shadow-sm border ${isLight ? "bg-white border-gray-200/80" : "bg-[#1b1928] border-white/5"}`}>
                              <span className="text-[10px] font-bold text-[#7c5dfa] uppercase tracking-wider">
                                {t("email_address") || "Email address"}
                              </span>
                              <p className={`text-xs font-semibold select-all ${isLight ? "text-gray-700" : "text-white/80"}`}>
                                {userToDisplay?.email || "N/A"}
                              </p>
                            </div>

                            {(userToDisplay?.about || userToDisplay?.status_text || userToDisplay?.status) && (
                              <div className={`rounded-2xl p-4 space-y-1.5 shadow-sm border ${isLight ? "bg-white border-gray-200/80" : "bg-[#1b1928] border-white/5"}`}>
                                <span className="text-[10px] font-bold text-[#7c5dfa] uppercase tracking-wider">
                                  {t("about", "About")}
                                </span>
                                <p className={`text-xs leading-relaxed font-medium ${isLight ? "text-gray-700" : "text-white/80"}`}>
                                  {userToDisplay?.about || userToDisplay?.status_text || userToDisplay?.status}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      ) : (

        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0a0a0f] relative overflow-hidden select-none">
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[#7c5dfa]/5 blur-[120px] pointer-events-none"></div>

          <div className="relative mb-8 w-72 h-44 select-none flex items-center justify-center">
            <div className="absolute w-36 h-36 rounded-full bg-[#7c5dfa]/15 blur-[50px] top-6 left-12"></div>

            <svg className="w-full h-full" viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M70 95 C 110 50, 170 130, 210 85" stroke="url(#wave-gradient)" strokeWidth="2.5" strokeDasharray="5 4" className="animate-pulse" />

              <rect x="65" y="22" width="36" height="22" rx="6" fill="#7c5dfa" fillOpacity="0.15" stroke="#7c5dfa" strokeOpacity="0.25" strokeWidth="1" />
              <path d="M75 44 L 75 49 L 80 44 Z" fill="#7c5dfa" fillOpacity="0.15" stroke="#7c5dfa" strokeOpacity="0.25" strokeWidth="1" />

              <rect x="180" y="115" width="40" height="24" rx="8" fill="#a855f7" fillOpacity="0.1" stroke="#a855f7" strokeOpacity="0.2" strokeWidth="1" />
              <path d="M210 139 L 210 145 L 204 139 Z" fill="#a855f7" fillOpacity="0.1" stroke="#a855f7" strokeOpacity="0.2" strokeWidth="1" />

              <g transform="translate(30, 50)">
                <rect x="10" y="10" width="70" height="46" rx="4" fill="#1b192b" stroke="#7c5dfa" strokeWidth="1.5" />
                <circle cx="45" cy="33" r="14" fill="#7c5dfa" fillOpacity="0.25" />
                <circle cx="45" cy="33" r="9.5" fill="#7c5dfa" />
                <path d="M40.5 33 L 43.5 36.5 L 49.5 29.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 56 L 88 56 L 82 64 L 8 64 Z" fill="#24213d" stroke="#7c5dfa" strokeWidth="1.5" strokeLinejoin="round" />
                <rect x="36" y="58" width="18" height="4" rx="1" fill="#131122" />
              </g>

              <g transform="translate(195, 55)">
                <rect x="10" y="5" width="28" height="54" rx="6" fill="#1b192b" stroke="#7c5dfa" strokeWidth="1.5" strokeLinejoin="round" />
                <rect x="13" y="9" width="22" height="42" rx="3" fill="#0d0c15" />
                <line x1="21" y1="7" x2="27" y2="7" stroke="#7c5dfa" strokeWidth="1.2" strokeLinecap="round" />
                <rect x="17" y="32" width="2.5" height="10" rx="0.5" fill="#7c5dfa" fillOpacity="0.4" />
                <rect x="21" y="27" width="2.5" height="15" rx="0.5" fill="#7c5dfa" fillOpacity="0.6" />
                <rect x="25" y="22" width="2.5" height="20" rx="0.5" fill="#7c5dfa" />
                <circle cx="24" cy="46" r="1.5" fill="#7c5dfa" fillOpacity="0.5" />
              </g>

              <defs>
                <linearGradient id="wave-gradient" x1="70" y1="90" x2="210" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7c5dfa" />
                  <stop offset="50%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#7c5dfa" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h2 className="text-base font-bold text-white tracking-wide">{t("welcome_title")}</h2>
          <p className="text-xs text-white/45 mt-2.5 max-w-sm leading-relaxed px-4">
            {t("welcome_subtitle")}
          </p>
          <div className="border-t border-white/5 w-52 my-6"></div>
          <div className="flex items-center gap-1.5 text-[9px] text-white/35 font-medium select-none uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-white/20" />
            <span>{t("welcome_encrypted")}</span>
          </div>
        </div>
      )}
      {
        isQrScannerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsQrScannerOpen(false)}
          >
            <style>{`
            @keyframes scan-laser {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            .scanner-laser-line {
              position: absolute;
              left: 0;
              width: 100%;
              height: 2px;
              background: #7c5dfa;
              box-shadow: 0 0 8px #7c5dfa, 0 0 15px #7c5dfa;
              animation: scan-laser 3s infinite linear;
            }
          `}</style>

            <div
              className="bg-[#1f1d2c] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center animate-fade-in relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsQrScannerOpen(false)}
                className="absolute top-4 right-4 p-2 bg-[#2a273a] hover:bg-[#36324c] rounded-full text-white/60 hover:text-white transition-all shadow-md cursor-pointer flex items-center justify-center animate-pulse-subtle"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative w-44 h-44 bg-white p-4 rounded-2xl shadow-lg mt-6 flex flex-col items-center justify-center overflow-hidden border-2 border-[#7c5dfa]/30 group">
                <div className="scanner-laser-line pointer-events-none z-10"></div>

                <svg className="w-32 h-32 text-black pointer-events-none select-none" viewBox="0 0 100 100" fill="none">
                  <rect x="2" y="2" width="22" height="22" rx="3" stroke="black" strokeWidth="4" fill="none" />
                  <rect x="7" y="7" width="12" height="12" rx="1.5" fill="black" />

                  <rect x="76" y="2" width="22" height="22" rx="3" stroke="black" strokeWidth="4" fill="none" />
                  <rect x="81" y="7" width="12" height="12" rx="1.5" fill="black" />

                  <rect x="2" y="76" width="22" height="22" rx="3" stroke="black" strokeWidth="4" fill="none" />
                  <rect x="7" y="81" width="12" height="12" rx="1.5" fill="black" />

                  <rect x="76" y="76" width="10" height="10" rx="1.5" stroke="black" strokeWidth="2" fill="none" />
                  <rect x="80" y="80" width="2" height="2" fill="black" />

                  <rect x="32" y="4" width="4" height="4" rx="1" fill="black" /><rect x="44" y="4" width="4" height="4" rx="1" fill="black" /><rect x="52" y="4" width="4" height="4" rx="1" fill="black" /><rect x="64" y="4" width="4" height="4" rx="1" fill="black" />
                  <rect x="32" y="12" width="4" height="4" rx="1" fill="black" /><rect x="40" y="12" width="4" height="4" rx="1" fill="black" /><rect x="56" y="12" width="4" height="4" rx="1" fill="black" /><rect x="68" y="12" width="4" height="4" rx="1" fill="black" />
                  <rect x="36" y="20" width="4" height="4" rx="1" fill="black" /><rect x="48" y="20" width="4" height="4" rx="1" fill="black" /><rect x="60" y="20" width="4" height="4" rx="1" fill="black" />
                  <rect x="4" y="32" width="4" height="4" rx="1" fill="black" /><rect x="16" y="32" width="4" height="4" rx="1" fill="black" /><rect x="28" y="32" width="4" height="4" rx="1" fill="black" /><rect x="40" y="32" width="4" height="4" rx="1" fill="black" /><rect x="52" y="32" width="4" height="4" rx="1" fill="black" /><rect x="68" y="32" width="4" height="4" rx="1" fill="black" /><rect x="80" y="32" width="4" height="4" rx="1" fill="black" /><rect x="92" y="32" width="4" height="4" rx="1" fill="black" />
                  <rect x="8" y="40" width="4" height="4" rx="1" fill="black" /><rect x="24" y="40" width="4" height="4" rx="1" fill="black" /><rect x="36" y="40" width="4" height="4" rx="1" fill="black" /><rect x="48" y="40" width="4" height="4" rx="1" fill="black" /><circle cx="50" cy="50" r="14" fill="white" /><rect x="60" y="40" width="4" height="4" rx="1" fill="black" /><rect x="72" y="40" width="4" height="4" rx="1" fill="black" /><rect x="84" y="40" width="4" height="4" rx="1" fill="black" />
                  <rect x="4" y="48" width="4" height="4" rx="1" fill="black" /><rect x="16" y="48" width="4" height="4" rx="1" fill="black" /><rect x="32" y="48" width="4" height="4" rx="1" fill="black" /><rect x="44" y="48" width="4" height="4" rx="1" fill="black" /><rect x="56" y="48" width="4" height="4" rx="1" fill="black" /><rect x="64" y="48" width="4" height="4" rx="1" fill="black" /><rect x="80" y="48" width="4" height="4" rx="1" fill="black" /><rect x="92" y="48" width="4" height="4" rx="1" fill="black" />
                  <rect x="12" y="56" width="4" height="4" rx="1" fill="black" /><rect x="24" y="56" width="4" height="4" rx="1" fill="black" /><rect x="40" y="56" width="4" height="4" rx="1" fill="black" /><rect x="52" y="56" width="4" height="4" rx="1" fill="black" /><rect x="72" y="56" width="4" height="4" rx="1" fill="black" /><rect x="88" y="56" width="4" height="4" rx="1" fill="black" />
                  <rect x="4" y="64" width="4" height="4" rx="1" fill="black" /><rect x="20" y="64" width="4" height="4" rx="1" fill="black" /><rect x="36" y="64" width="4" height="4" rx="1" fill="black" /><rect x="48" y="64" width="4" height="4" rx="1" fill="black" /><rect x="60" y="64" width="4" height="4" rx="1" fill="black" /><rect x="68" y="64" width="4" height="4" rx="1" fill="black" /><rect x="80" y="64" width="4" height="4" rx="1" fill="black" /><rect x="92" y="64" width="4" height="4" rx="1" fill="black" />
                  <rect x="32" y="72" width="4" height="4" rx="1" fill="black" /><rect x="44" y="72" width="4" height="4" rx="1" fill="black" /><rect x="56" y="72" width="4" height="4" rx="1" fill="black" /><rect x="68" y="72" width="4" height="4" rx="1" fill="black" />
                  <rect x="36" y="84" width="4" height="4" rx="1" fill="black" /><rect x="48" y="84" width="4" height="4" rx="1" fill="black" /><rect x="64" y="84" width="4" height="4" rx="1" fill="black" />
                  <rect x="40" y="92" width="4" height="4" rx="1" fill="black" /><rect x="52" y="92" width="4" height="4" rx="1" fill="black" /><rect x="60" y="92" width="4" height="4" rx="1" fill="black" />

                  <circle cx="50" cy="50" r="14" fill="white" />
                  <circle cx="50" cy="50" r="11" fill="#7c5dfa" />
                  <rect x="44.5" y="45.5" width="11" height="8" rx="1.5" fill="white" />
                  <polygon points="45.5,52.5 45.5,55.5 48.5,52.5" fill="white" />
                  <rect x="46.5" y="47.5" width="7" height="1" rx="0.5" fill="#7c5dfa" />
                  <rect x="46.5" y="49.5" width="5" height="1" rx="0.5" fill="#7c5dfa" />
                </svg>
              </div>

              <h3 className="text-base font-bold text-white mt-5">{t("qr_scan_title")}</h3>
              <p className="text-xs text-white/50 mt-2 leading-relaxed px-2">
                {t("qr_scan_desc")}
              </p>

              <button
                onClick={() => {
                  setIsQrScannerOpen(false);
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                className="mt-6 w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white py-2.5 rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                {t("qr_scan_get_started")}
              </button>
            </div>
          </div>
        )
      }

      {
        isCameraActive && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#1f1d2c] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col relative animate-fade-in text-white">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#161421]/60">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#9f85ff]" /> {t("camera_title")}
                </h3>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex flex-col items-center gap-4 bg-black/20">
                {!capturedPhotoUrl ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/5">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-end justify-center pb-4">
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="w-14 h-14 bg-white hover:bg-white/90 text-black border-4 border-[#1f1d2c] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-200 cursor-pointer"
                        title={t("camera_take_photo")}
                      >
                        <div className="w-6 h-6 rounded-full border-2 border-black"></div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/5">
                    <img
                      src={capturedPhotoUrl}
                      alt="Captured snapshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-4 gap-3">
                      <button
                        type="button"
                        onClick={() => setCapturedPhotoUrl("")}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        {t("camera_retake")}
                      </button>
                      <button
                        type="button"
                        onClick={sendCapturedPhoto}
                        className="px-4 py-2 bg-[#7c5dfa] hover:bg-[#684ce2] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
                      >
                        {t("camera_send_photo")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {
        isContactSharingOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsContactSharingOpen(false)}
          >
            <div
              className="bg-[#201d2d] border border-white/5 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-fade-in text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#161421]/60">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  👤 {t("share_contact_title")}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsContactSharingOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 max-h-[350px] overflow-y-auto no-scrollbar space-y-2">
                {(!contacts || contacts.length === 0) ? (
                  <p className="text-xs text-white/30 text-center py-10">{t("share_contact_no_contacts")}</p>
                ) : (
                  contacts.map((c) => {
                    const initials = `${c.first_name?.[0] || ""}${c.last_name?.[0] || ""}`.toUpperCase();
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleShareContact(c)}
                        className="p-2.5 flex items-center gap-3 hover:bg-white/[0.02] border border-transparent hover:border-white/5 rounded-xl cursor-pointer transition-all"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#2c283d] flex items-center justify-center font-bold text-xs border border-white/5">
                          {c.profile_image ? (
                            <img src={c.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{c.first_name} {c.last_name}</p>
                          <p className="text-[9px] text-[#7c5dfa] truncate">{c.email}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )
      }

      {
        isPollCreationOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none"
            onClick={() => {
              setIsPollCreationOpen(false);
              setActiveEmojiField(null);
            }}
          >
            <div
              className="bg-[#201d2d]  w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col text-white relative pb-24"
              style={{ maxHeight: "90vh", height: "560px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {activeEmojiField && (
                <div className="absolute inset-0 bg-[#201d2d] z-30 flex flex-col">
                  <div
                    className="p-4 border-b border-black/5 dark:border-white/5 flex items-center gap-4 shrink-0 select-none text-white"
                    style={{ backgroundColor: currentRoomTheme || '#008069' }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveEmojiField(null)}
                      className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-sm font-bold tracking-wide">{t("select_emoji") || "Select Emoji"}</h3>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <EmojiPicker
                      theme={typeof window !== "undefined" && localStorage.getItem("theme") === "light" ? "light" : "dark"}
                      width="100%"
                      height="100%"
                      onEmojiClick={(emojiData) => {
                        handleEmojiClickForField(emojiData);
                        setActiveEmojiField(null);
                      }}
                    />
                  </div>
                </div>
              )}

              {pollView === "create" ? (
                <>
                  {/* Header */}
                  <div
                    className="p-4 flex items-center justify-between text-white shrink-0 shadow-sm poll-header-force-white"
                    style={{ backgroundColor: currentRoomTheme || '#473eceff' }}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPollCreationOpen(false);
                          setActiveEmojiField(null);
                        }}
                        className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-sm font-bold tracking-wide poll-header-force-white ">{t("poll_new") || "Create Poll"}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPollCreationOpen(false);
                        setActiveEmojiField(null);
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <div className="p-5 space-y-5 flex-1 overflow-y-auto no-scrollbar">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("poll_question") || "Question"}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          placeholder={t("poll_type_question_placeholder") || "Ask a question..."}
                          required
                          className="w-full bg-transparent border-b border-white/10 focus:border-[#008069] dark:focus:border-[#00a884] pb-2 pr-8 text-xs text-white placeholder:text-white/20 focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveEmojiField(activeEmojiField === 'question' ? null : 'question')}
                          className="absolute right-1 bottom-2 text-white/30 hover:text-[#008069] dark:hover:text-[#00a884] cursor-pointer bg-transparent border-none"
                        >
                          <SmileIcon className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("poll_options") || "Options"}</label>
                      <div className="space-y-3">
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="relative flex items-center gap-2.5 border-b border-white/10 pb-1.5">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...pollOptions];
                                newOpts[idx] = e.target.value;
                                setPollOptions(newOpts);
                              }}
                              placeholder={`${t("poll_add_option") || "Add option"} ${idx + 1}`}
                              required={idx < 2}
                              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none pr-14 animate-none"
                            />
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setActiveEmojiField(activeEmojiField === `option-${idx}` ? null : `option-${idx}`)}
                                className="text-white/30 hover:text-[#008069] dark:hover:text-[#00a884] p-0.5 cursor-pointer bg-transparent border-none"
                              >
                                <Smile className="w-4 h-4" />
                              </button>
                              {pollOptions.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePollOption(idx)}
                                  className="text-white/30 hover:text-red-500 p-0.5 cursor-pointer bg-transparent border-none"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {pollOptions.length < 5 && (
                        <button
                          type="button"
                          onClick={handleAddPollOption}
                          className="flex items-center gap-1.5 text-xs font-bold mt-2.5 transition-colors cursor-pointer bg-transparent border-none"
                          style={{ color: currentRoomTheme || '#008069' }}
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t("poll_add_option") || "Add"}</span>
                        </button>
                      )}
                    </div>

                    <div className="h-px bg-white/5 my-2"></div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-semibold text-white/85">{t("poll_multiple_options") || "Allow multiple answers"}</span>
                      <div
                        onClick={() => setAllowMultipleOptions(!allowMultipleOptions)}
                        className="w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all flex items-center"
                        style={{
                          backgroundColor: allowMultipleOptions ? (currentRoomTheme || '#008069') : 'rgba(0,0,0,0.1)',
                          justifyContent: allowMultipleOptions ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPollView("settings")}
                      className="w-full flex items-center gap-2 text-xs text-white/50 hover:text-white font-bold pl-0.5 transition-colors cursor-pointer text-left mt-1 bg-transparent border-none"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{t("poll_settings") || "More Settings"}</span>
                    </button>
                  </div>

                  <div className="absolute bottom-5 right-5 z-20">
                    <button
                      type="button"
                      onClick={handleCreatePoll}
                      disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim() !== "").length < 2}
                      className="w-10 h-10 hover:scale-105 disabled:scale-100 disabled:opacity-30 poll-header-force-white disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer border-none"
                      style={{ backgroundColor: currentRoomTheme || '#008069' }}
                    >
                      <svg className="w-5 h-5 rotate-45 mr-0.5 mt-[-1px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="p-4 flex items-center gap-4 text-white shrink-0 shadow-sm poll-header-force-white"
                    style={{ backgroundColor: currentRoomTheme || '#7c5dfa' }}
                  >
                    <button
                      type="button"
                      onClick={() => setPollView("create")}
                      className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h3 className="text-sm font-bold tracking-wide text-white poll-header-force-white">{t("poll_settings") || "Settings"}</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-xs font-bold">{t("poll_duration") || "Poll Duration"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextDur = pollDuration === "30 min" ? "1 hour" : pollDuration === "1 hour" ? "24 hours" : "30 min";
                            setPollDuration(nextDur);
                          }}
                          className="text-[10px] font-bold flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg border"
                          style={{
                            color: currentRoomTheme || '#7c5dfa',
                            borderColor: `${currentRoomTheme || '#7c5dfa'}40`,
                            backgroundColor: `${currentRoomTheme || '#7c5dfa'}10`
                          }}
                        >
                          {pollDuration === "30 min" ? t("poll_duration_30m") : pollDuration === "1 hour" ? t("poll_duration_1h") : t("poll_duration_24h")}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-xs font-bold">{t("poll_set_reminder") || "Set Reminder"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReminderActive(!reminderActive)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors border-none ${reminderActive ? "bg-amber-500/20 text-amber-500" : "bg-white/5 text-white/40"}`}
                        >
                          <Bell className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-xs font-bold">{t("poll_anonymous_voting") || "Anonymous Voting"}</p>
                        </div>
                        <div
                          onClick={() => setAnonymousVoting(!anonymousVoting)}
                          className="w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all flex items-center"
                          style={{
                            backgroundColor: anonymousVoting ? (currentRoomTheme || '#7c5dfa') : 'rgba(0,0,0,0.1)',
                            justifyContent: anonymousVoting ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-xs font-bold">{t("poll_multiple_options") || "Allow multiple answers"}</p>
                        </div>
                        <div
                          onClick={() => setAllowMultipleOptions(!allowMultipleOptions)}
                          className="w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all flex items-center"
                          style={{
                            backgroundColor: allowMultipleOptions ? (currentRoomTheme || '#7c5dfa') : 'rgba(0,0,0,0.1)',
                            justifyContent: allowMultipleOptions ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-xs font-bold">{t("poll_participants_add_options") || "Participants can add options"}</p>
                        </div>
                        <div
                          onClick={() => setParticipantsAddOptions(!participantsAddOptions)}
                          className="w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all flex items-center"
                          style={{
                            backgroundColor: participantsAddOptions ? (currentRoomTheme || '#7c5dfa') : 'rgba(0,0,0,0.1)',
                            justifyContent: participantsAddOptions ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>


                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-xs font-bold">{t("poll_quiz_mode") || "Quiz Mode"}</p>
                        </div>
                        <div
                          onClick={() => setQuizMode(!quizMode)}
                          className="w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all flex items-center"
                          style={{
                            backgroundColor: quizMode ? (currentRoomTheme || '#7c5dfa') : 'rgba(0,0,0,0.1)',
                            justifyContent: quizMode ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <p className="text-xs font-bold text-white">{t("poll_send_to_users") || "Send Poll to Contacts"}</p>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1 no-scrollbar">
                          {((contacts && contacts.length > 0) ? contacts : (chatList || [])).map((item) => {
                            let displayName = item.first_name ? `${item.first_name} ${item.last_name || ""}`.trim() : (item.name || "");
                            if (!displayName && item.members) {
                              const partner = item.members.find(m => Number(m.id || m.user_id) !== Number(currentUser?.id));
                              if (partner) displayName = `${partner.first_name || ""} ${partner.last_name || ""}`.trim();
                            }
                            if (!displayName) displayName = `Contact #${item.id}`;

                            let targetRoomId = item.id;
                            if (item.first_name) {
                              const matchingChat = (chatList || []).find(c => !c.is_group && (c.members || []).some(m => Number(m.id || m.user_id) === Number(item.id)));
                              if (matchingChat) targetRoomId = matchingChat.id;
                            }
                            const isSel = selectedRecipientRoomIds.includes(targetRoomId);

                            return (
                              <label key={item.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white/5 cursor-pointer text-xs select-none">
                                <span className="text-white/80 font-medium truncate">{displayName}</span>
                                <input
                                  type="checkbox"
                                  checked={isSel}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRecipientRoomIds((prev) => [...prev, targetRoomId]);
                                    } else {
                                      setSelectedRecipientRoomIds((prev) => prev.filter((id) => id !== targetRoomId));
                                    }
                                  }}
                                  className="rounded text-[#7c5dfa] focus:ring-0 cursor-pointer accent-[#7c5dfa]"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-5 right-5 z-20">
                    <button
                      type="button"
                      onClick={() => setPollView("create")}
                      className="px-6 py-2.5 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer border-none hover:scale-105 poll-header-force-white"
                      style={{ backgroundColor: currentRoomTheme || '#7c5dfa' }}
                    >
                      {t("poll_done") || "Done"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      }

      {
        isConfirmDeleteOpen && (() => {
          const allSelectedSentByMe = selectedMessageIds.every(id => {
            const msg = visibleMessages.find(m => m.id === id);
            return msg && Number(msg.sender_id) === Number(currentUser?.id);
          });

          return (
            <div
              className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              <div
                className={`custom-modal-box w-full max-w-xs rounded-2xl shadow-2xl p-6 animate-fade-in text-left space-y-4 border ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "bg-white text-gray-800 border-gray-200 shadow-xl" : "bg-[#1f1d2c] text-white border-white/10"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className={`text-sm font-bold leading-snug ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "text-gray-900" : "text-white"}`}>{t("delete_confirm_title", "Delete message?")}</h3>

                <div className="flex flex-col items-end gap-5 text-xs font-bold pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleLocalDeleteMessages(false);
                      setIsConfirmDeleteOpen(false);
                    }}
                    style={{ color: chatThemeColor || "#7c5dfa" }}
                    className="hover:opacity-80 transition-opacity uppercase cursor-pointer text-right"
                  >
                    {t("delete_for_me", "DELETE FOR ME")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmDeleteOpen(false)}
                    style={{ color: chatThemeColor || "#7c5dfa" }}
                    className="hover:opacity-80 transition-opacity uppercase cursor-pointer text-right opacity-90"
                  >
                    {t("delete_confirm_cancel", "CANCEL")}
                  </button>
                  {allSelectedSentByMe && (
                    <button
                      type="button"
                      onClick={() => {
                        handleLocalDeleteMessages(true);
                        setIsConfirmDeleteOpen(false);
                      }}
                      style={{ color: chatThemeColor || "#7c5dfa" }}
                      className="hover:opacity-80 transition-opacity uppercase cursor-pointer text-right"
                    >
                      {t("delete_for_everyone", "DELETE FOR EVERYONE")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      }
      {
        isForwardModalOpen && (() => {
          const getForwardChatName = (chat) => {
            if (chat.is_group || chat.is_community) return chat.name;
            const partner = chat.members?.find(m => Number(m.id) !== Number(currentUser?.id));
            if (partner) {
              return `${partner.first_name} ${partner.last_name || ""}`.trim();
            }
            return "Unknown Chat";
          };

          return (
            <div
              className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
              onClick={() => {
                setIsForwardModalOpen(false);
                setSelectedForwardRoomIds([]);
              }}
            >
              <div
                className="custom-modal-box w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/10">
                  <h3 className="text-sm font-bold">{t("forward_to_title")}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForwardModalOpen(false);
                      setSelectedForwardRoomIds([]);
                    }}
                    className="opacity-50 hover:opacity-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 border-b border-white/5 bg-black/5">
                  <input
                    type="text"
                    value={forwardSearch}
                    onChange={(e) => setForwardSearch(e.target.value)}
                    placeholder={t("forward_to_search_placeholder")}
                    className="modal-search-input w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                  {(chatList || [])
                    .filter(chat => {
                      const name = getForwardChatName(chat).toLowerCase();
                      return name.includes(forwardSearch.toLowerCase());
                    })
                    .map((chat) => {
                      const chatName = getForwardChatName(chat);
                      const isSelected = selectedForwardRoomIds.includes(chat.id);
                      return (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() => {
                            setSelectedForwardRoomIds(prev =>
                              prev.includes(chat.id)
                                ? prev.filter(id => id !== chat.id)
                                : [...prev, chat.id]
                            );
                          }}
                          className={`modal-chat-item w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${isSelected
                            ? "bg-[#7c5dfa]/15 border-[#7c5dfa]/30"
                            : "bg-transparent border-transparent"
                            }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-8 h-8 rounded-full bg-[#7c5dfa]/20 flex items-center justify-center font-bold text-xs shrink-0 border border-white/5">
                              {chatName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold truncate">{chatName}</span>
                          </div>
                          <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-[#7c5dfa] border-transparent" : "border-white/20 bg-black/10"
                            }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                </div>

                <div className="p-4 border-t border-white/5 flex items-center justify-end gap-3.5 bg-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForwardModalOpen(false);
                      setSelectedForwardRoomIds([]);
                    }}
                    className="text-xs font-bold opacity-60 hover:opacity-100 uppercase transition-all cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={selectedForwardRoomIds.length === 0}
                    onClick={handleForwardMessages}
                    className="bg-[#7c5dfa] hover:bg-[#684ce2] disabled:opacity-40 disabled:hover:bg-[#7c5dfa]  text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    {t("send")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      }
      {
        confirmModal.isOpen && (
          <div
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in"
            onClick={() => {
              if (!confirmModal.isLoading) {
                setConfirmModal((p) => ({ ...p, isOpen: false }));
              }
            }}
          >
            <div
              className={`w-full max-w-xs rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl backdrop-blur-md border transition-all ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "bg-white text-gray-800 border-gray-200 shadow-xl" : "bg-[#201d2d]/95 text-white border-white/10"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${confirmModal.icon === "trash" ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                {confirmModal.icon === "trash" ? (
                  <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path
                      className={confirmModal.isLoading ? "animate-trash-lid" : ""}
                      d="M3 6h18M9 6v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                    />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                )}
              </div>

              <h4 className={`text-sm font-bold mb-1.5 confirm-dialog-title ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "text-gray-900" : "text-white"}`}>{confirmModal.title}</h4>
              <p className={`text-[11px] leading-relaxed mb-6 px-1 confirm-dialog-desc ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "text-gray-600 font-medium" : "text-white/50"}`}>{confirmModal.description}</p>

              <div className="flex items-center gap-2.5 w-full">
                {!confirmModal.isAlert && (
                  <button
                    type="button"
                    disabled={confirmModal.isLoading}
                    onClick={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
                    className={`flex-1 py-2.5 border rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "border-gray-300 hover:border-gray-400 text-gray-700 bg-gray-100 hover:bg-gray-200" : "border-white/10 hover:border-white/20 text-white/60 hover:text-white bg-white/5 hover:bg-white/10"}`}
                  >
                    {t("cancel")}
                  </button>
                )}
                <button
                  type="button"
                  disabled={confirmModal.isLoading}
                  onClick={async () => {
                    if (confirmModal.onConfirm) {
                      setConfirmModal((p) => ({ ...p, isLoading: true }));
                      try {
                        await confirmModal.onConfirm();
                      } catch (err) {
                        console.error(err);
                      }
                    }
                    setConfirmModal((p) => ({ ...p, isOpen: false, isLoading: false }));
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-white disabled:opacity-40 shadow-md ${confirmModal.icon === "trash"
                    ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/20"
                    : "bg-gradient-to-r from-[#7c5dfa] to-[#6d28d9] hover:from-[#684ce2] hover:to-[#5b21b6] shadow-[#7c5dfa]/20"
                    }`}
                >
                  {confirmModal.isLoading ? t("blank_loading") : confirmModal.isAlert ? t("ok") : confirmModal.title.toLowerCase().includes("delete") ? t("delete_confirm_yes") : t("confirm")}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        isEventCreationOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsEventCreationOpen(false)}
          >
            <form
              onSubmit={handleCreateEvent}
              className="bg-[#201d2d] border border-white/5 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col text-white relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#161421]/60 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEventCreationOpen(false)}
                    className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-sm font-bold tracking-wide">{t("event_create")}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEventCreationOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto no-scrollbar max-h-[380px]">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("event_name")}</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={t("event_name_placeholder")}
                    required
                    className="w-full bg-[#1c1a29]/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#7c5dfa]/60 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("event_description")}</label>
                  <textarea
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder={t("event_desc_placeholder")}
                    rows={2}
                    className="w-full bg-[#1c1a29]/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#7c5dfa]/60 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("event_date_time")}</label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full bg-[#1c1a29]/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7c5dfa]/60 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("event_location")}</label>
                  <input
                    type="text"
                    value={eventLoc}
                    onChange={(e) => setEventLoc(e.target.value)}
                    placeholder={t("event_location_placeholder")}
                    className="w-full bg-[#1c1a29]/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#7c5dfa]/60 transition-colors"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("poll_send_to_users") || "Send Event to Contacts"}</label>
                  <div className="max-h-28 overflow-y-auto no-scrollbar space-y-1 bg-black/20 p-2.5 rounded-xl border border-white/5">
                    {((contacts && contacts.length > 0) ? contacts : (chatList || [])).map((item) => {
                      let displayName = item.first_name ? `${item.first_name} ${item.last_name || ""}`.trim() : (item.name || "");
                      if (!displayName && item.members) {
                        const partner = item.members.find(m => Number(m.id || m.user_id) !== Number(currentUser?.id));
                        if (partner) displayName = `${partner.first_name || ""} ${partner.last_name || ""}`.trim();
                      }
                      if (!displayName) displayName = `Contact #${item.id}`;

                      let targetRoomId = item.id;
                      if (item.first_name) {
                        const matchingChat = (chatList || []).find(c => !c.is_group && (c.members || []).some(m => Number(m.id || m.user_id) === Number(item.id)));
                        if (matchingChat) targetRoomId = matchingChat.id;
                      }
                      const isSelected = selectedRecipientRoomIds.includes(targetRoomId);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedRecipientRoomIds((prev) =>
                              prev.includes(targetRoomId)
                                ? prev.filter((id) => id !== targetRoomId)
                                : [...prev, targetRoomId]
                            );
                          }}
                          className="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                        >
                          <span className="text-[11px] text-white/80 truncate max-w-[180px]">{displayName}</span>
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-[#7c5dfa] border-transparent" : "border-white/20"}`}>
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/5 bg-[#161421]/30 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEventCreationOpen(false)}
                  className="px-3.5 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-bold cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#7c5dfa] hover:bg-[#684ce2] text-white rounded-lg transition-colors font-bold shadow-md cursor-pointer"
                >
                  {t("event_create_button")}
                </button>
              </div>
            </form>
          </div>
        )
      }

      {
        isConfirmDeleteOpen && (() => {
          const allSelectedSentByMe = selectedMessageIds.every(id => {
            const msg = visibleMessages.find(m => m.id === id);
            return msg && Number(msg.sender_id) === Number(currentUser?.id);
          });

          return (
            <div
              className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              <div
                className={`custom-modal-box w-full max-w-xs rounded-2xl shadow-2xl p-6 animate-fade-in text-left space-y-4 border ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "bg-white text-gray-800 border-gray-200 shadow-xl" : "bg-[#1f1d2c] text-white border-white/10"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className={`text-sm font-bold leading-snug ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "text-gray-900" : "text-white"}`}>{t("delete_confirm_title", "Delete message?")}</h3>

                <div className="flex flex-col items-end gap-5 text-xs font-bold pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleLocalDeleteMessages(false);
                      setIsConfirmDeleteOpen(false);
                    }}
                    style={{ color: chatThemeColor || "#7c5dfa" }}
                    className="hover:opacity-80 transition-opacity uppercase cursor-pointer text-right"
                  >
                    {t("delete_for_me", "DELETE FOR ME")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmDeleteOpen(false)}
                    style={{ color: chatThemeColor || "#7c5dfa" }}
                    className="hover:opacity-80 transition-opacity uppercase cursor-pointer text-right opacity-90"
                  >
                    {t("delete_confirm_cancel", "CANCEL")}
                  </button>
                  {allSelectedSentByMe && (
                    <button
                      type="button"
                      onClick={() => {
                        handleLocalDeleteMessages(true);
                        setIsConfirmDeleteOpen(false);
                      }}
                      style={{ color: chatThemeColor || "#7c5dfa" }}
                      className="hover:opacity-80 transition-opacity uppercase cursor-pointer text-right"
                    >
                      {t("delete_for_everyone", "DELETE FOR EVERYONE")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      }

      {
        isForwardModalOpen && (() => {
          const getForwardChatName = (chat) => {
            if (chat.is_group || chat.is_community) return chat.name;
            const partner = chat.members?.find(m => Number(m.id) !== Number(currentUser?.id));
            if (partner) {
              return `${partner.first_name} ${partner.last_name || ""}`.trim();
            }
            return "Unknown Chat";
          };

          return (
            <div
              className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
              onClick={() => {
                setIsForwardModalOpen(false);
                setSelectedForwardRoomIds([]);
              }}
            >
              <div
                className="custom-modal-box w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/10">
                  <h3 className="text-sm font-bold">{t("forward_to_title")}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForwardModalOpen(false);
                      setSelectedForwardRoomIds([]);
                    }}
                    className="opacity-50 hover:opacity-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 border-b border-white/5 bg-black/5">
                  <input
                    type="text"
                    value={forwardSearch}
                    onChange={(e) => setForwardSearch(e.target.value)}
                    placeholder={t("forward_to_search_placeholder")}
                    className="modal-search-input w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                  {(chatList || [])
                    .filter(chat => {
                      const name = getForwardChatName(chat).toLowerCase();
                      return name.includes(forwardSearch.toLowerCase());
                    })
                    .map((chat) => {
                      const chatName = getForwardChatName(chat);
                      const isSelected = selectedForwardRoomIds.includes(chat.id);
                      return (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() => {
                            setSelectedForwardRoomIds(prev =>
                              prev.includes(chat.id)
                                ? prev.filter(id => id !== chat.id)
                                : [...prev, chat.id]
                            );
                          }}
                          className={`modal-chat-item w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${isSelected
                            ? "bg-[#7c5dfa]/15 border-[#7c5dfa]/30"
                            : "bg-transparent border-transparent"
                            }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-8 h-8 rounded-full bg-[#7c5dfa]/20 flex items-center justify-center font-bold text-xs shrink-0 border border-white/5">
                              {chatName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold truncate">{chatName}</span>
                          </div>
                          <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-[#7c5dfa] border-transparent" : "border-white/20 bg-black/10"
                            }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                </div>

                <div className="p-4 border-t border-white/5 flex items-center justify-end gap-3.5 bg-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForwardModalOpen(false);
                      setSelectedForwardRoomIds([]);
                    }}
                    className="text-xs font-bold opacity-60 hover:opacity-100 uppercase transition-all cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={selectedForwardRoomIds.length === 0}
                    onClick={handleForwardMessages}
                    className="bg-[#7c5dfa] hover:bg-[#684ce2] disabled:opacity-40 disabled:hover:bg-[#7c5dfa] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    {t("send")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      }

      {
        confirmModal.isOpen && (
          <div
            className="fixed inset-0 z-[500] w-screen h-screen bg-black/75 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in"
            onClick={() => {
              if (!confirmModal.isLoading) {
                setConfirmModal((p) => ({ ...p, isOpen: false }));
              }
            }}
          >
            <div
              className={`w-full max-w-xs rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl backdrop-blur-md border transition-all ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "bg-white text-gray-800 border-gray-200 shadow-xl" : "bg-[#201d2d]/95 text-white border-white/10"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${confirmModal.icon === "trash" ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                {confirmModal.icon === "trash" ? (
                  <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path
                      className={confirmModal.isLoading ? "animate-trash-lid" : ""}
                      d="M3 6h18M9 6v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                    />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                )}
              </div>

              <h4 className={`text-sm font-bold mb-1.5 confirm-dialog-title ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "text-gray-900" : "text-white"}`}>{confirmModal.title}</h4>
              <p className={`text-[11px] leading-relaxed mb-6 px-1 confirm-dialog-desc ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "text-gray-600 font-medium" : "text-white/50"}`}>{confirmModal.description}</p>

              <div className="flex items-center gap-2.5 w-full">
                {!confirmModal.isAlert && (
                  <button
                    type="button"
                    disabled={confirmModal.isLoading}
                    onClick={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
                    className={`flex-1 py-2.5 border rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40 ${(typeof window !== "undefined" && localStorage.getItem("theme") === "light") ? "border-gray-300 hover:border-gray-400 text-gray-700 bg-gray-100 hover:bg-gray-200" : "border-white/10 hover:border-white/20 text-white/60 hover:text-white bg-white/5 hover:bg-white/10"}`}
                  >
                    {t("cancel")}
                  </button>
                )}
                <button
                  type="button"
                  disabled={confirmModal.isLoading}
                  onClick={async () => {
                    if (confirmModal.onConfirm) {
                      setConfirmModal((p) => ({ ...p, isLoading: true }));
                      try {
                        await confirmModal.onConfirm();
                      } catch (err) {
                        console.error(err);
                      }
                    }
                    setConfirmModal((p) => ({ ...p, isOpen: false, isLoading: false }));
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-white disabled:opacity-40 shadow-md ${confirmModal.icon === "trash"
                    ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/20"
                    : "bg-gradient-to-r from-[#7c5dfa] to-[#6d28d9] hover:from-[#684ce2] hover:to-[#5b21b6] shadow-[#7c5dfa]/20"
                    }`}
                >
                  {confirmModal.isLoading ? t("blank_loading") : confirmModal.isAlert ? t("ok") : confirmModal.title.toLowerCase().includes("delete") ? t("delete_confirm_yes") : t("confirm")}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {isStarredModalOpen && (
        <div
          className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsStarredModalOpen(false)}
        >
          <div
            className="bg-[#1f1d2c] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">{t("starred_messages", "Starred Messages")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStarredModalOpen(false)}
                className="opacity-60 hover:opacity-100 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center text-center space-y-2 overflow-y-auto no-scrollbar">
              <div className="w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center border border-amber-400/20 text-amber-400 mb-1">
                <Star className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-white">{t("no_starred_messages", "No Starred Messages")}</h4>
              <p className="text-[11px] text-white/50 max-w-xs leading-relaxed">
                {t("star_important_messages_desc", "Star important messages in this group so you can easily find them later.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {isMemberChangesModalOpen && (
        <div
          className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsMemberChangesModalOpen(false)}
        >
          <div
            className="bg-[#1f1d2c] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-[#7c5dfa]" />
                <h3 className="text-sm font-bold">{t("view_member_changes", "Member Changes Log")}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMemberChangesModalOpen(false)}
                className="opacity-60 hover:opacity-100 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto no-scrollbar">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <span className="text-white/70">{t("group_created_with_members", "Group created with {count} members").replace("{count}", groupMembers.length)}</span>
                <span className="text-[10px] text-white/30 font-mono">{t("recent", "Recent")}</span>
              </div>
              {groupMembers.map((m, idx) => (
                <div key={m.id || idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#7c5dfa]/20 text-[#b69eff] flex items-center justify-center font-bold text-[10px]">
                      {m.first_name?.[0]}
                    </div>
                    <span className="font-semibold text-white/90">{m.first_name} {m.last_name} {t("joined_room", "joined room")}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">{t("active", "Active")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isMediaModalOpen && (
        (() => {
          const isLight = typeof window !== "undefined" && localStorage.getItem("theme") === "light";
          const mediaMsgs = (visibleMessages || []).filter(m => m.attachment_url || m.attachment_type || m.message_text?.startsWith("http"));
          return (
            <div
              className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setIsMediaModalOpen(false)}
            >
              <div
                className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border transition-all ${isLight ? "bg-white text-gray-900 border-gray-200" : "bg-[#1f1d2c] text-white border-white/10"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`p-4 border-b flex items-center justify-between ${isLight ? "border-gray-200 bg-gray-50" : "border-white/5 bg-black/20"}`}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-[#7c5dfa]" />
                    <h3 className="text-sm font-bold">{t("media_links_docs", "Media, links and docs")} ({mediaMsgs.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(false)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${isLight ? "hover:bg-gray-200 text-gray-600" : "hover:bg-white/10 text-white/70"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className={`flex border-b text-xs font-bold ${isLight ? "border-gray-200 bg-gray-100/50" : "border-white/5 bg-black/10"}`}>
                  <button
                    type="button"
                    onClick={() => setMediaModalTab("all")}
                    className={`flex-1 py-2.5 text-center cursor-pointer transition-colors ${mediaModalTab === "all" ? "text-[#7c5dfa] border-b-2 border-[#7c5dfa]" : isLight ? "text-gray-500" : "text-white/40"}`}
                  >
                    {t("all", "All")} ({mediaMsgs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaModalTab("images")}
                    className={`flex-1 py-2.5 text-center cursor-pointer transition-colors ${mediaModalTab === "images" ? "text-[#7c5dfa] border-b-2 border-[#7c5dfa]" : isLight ? "text-gray-500" : "text-white/40"}`}
                  >
                    {t("media", "Media")} ({mediaMsgs.filter(m => m.attachment_type === "image" || m.attachment_type === "video").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaModalTab("docs")}
                    className={`flex-1 py-2.5 text-center cursor-pointer transition-colors ${mediaModalTab === "docs" ? "text-[#7c5dfa] border-b-2 border-[#7c5dfa]" : isLight ? "text-gray-500" : "text-white/40"}`}
                  >
                    {t("docs_and_links", "Docs & Links")} ({mediaMsgs.filter(m => m.attachment_type !== "image" && m.attachment_type !== "video").length})
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-3">
                  {mediaMsgs.length === 0 ? (
                    <div className="py-12 text-center text-xs opacity-50">
                      {t("no_media_shared", "No media, links, or docs shared in this chat yet.")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {mediaMsgs
                        .filter(m => {
                          if (mediaModalTab === "images") return m.attachment_type === "image" || m.attachment_type === "video";
                          if (mediaModalTab === "docs") return m.attachment_type !== "image" && m.attachment_type !== "video";
                          return true;
                        })
                        .map((m, idx) => (
                          <div
                            key={m.id || idx}
                            onClick={() => {
                              if (m.attachment_url) window.open(m.attachment_url, "_blank");
                            }}
                            className={`aspect-square rounded-xl overflow-hidden border flex items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 ${isLight ? "bg-gray-100 border-gray-200" : "bg-white/5 border-white/10"}`}
                          >
                            {m.attachment_type === "image" ? (
                              <img src={m.attachment_url} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center p-2">
                                <FileText className="w-6 h-6 text-[#7c5dfa] mb-1" />
                                <span className="text-[9px] font-bold truncate max-w-full">{m.message_text || "Document"}</span>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}


      {isStarredModalOpen && (
        (() => {
          const starredMsgs = (visibleMessages || []).filter((m) => m.is_starred || m.starred);
          return (
            <div
              className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setIsStarredModalOpen(false)}
            >
              <div
                className={`w-full max-w-md max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border transition-all ${isLight ? "bg-white text-gray-900 border-gray-200" : "bg-[#1f1d2c] text-white border-white/10"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`p-4 border-b flex items-center justify-between ${isLight ? "border-gray-200 bg-gray-50" : "border-white/5 bg-black/20"}`}>
                  <div className="flex items-center gap-2 text-amber-400">
                    <Star className="w-4.5 h-4.5 fill-amber-400" />
                    <h3 className="text-sm font-bold">{t("starred_messages", "Starred Messages")} ({starredMsgs.length})</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStarredModalOpen(false)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${isLight ? "hover:bg-gray-200 text-gray-600" : "hover:bg-white/10 text-white/70"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-3">
                  {starredMsgs.length === 0 ? (
                    <div className="py-12 text-center text-xs opacity-50">
                      {t("no_starred_messages_yet", "No starred messages in this group yet.")}
                    </div>
                  ) : (
                    starredMsgs.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className={`p-3 rounded-xl border space-y-1 ${isLight ? "bg-gray-50 border-gray-200" : "bg-white/5 border-white/10"}`}
                      >
                        <div className="flex items-center justify-between text-[10px] opacity-60">
                          <span className="font-bold">{m.sender_name || "Member"}</span>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed">{m.message_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}
      {isCommunityGroupManagerOpen && activeRoom?.is_community && (
        <div
          className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsCommunityGroupManagerOpen(false)}
        >
          <div
            className={`w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border transition-all ${isLight ? "bg-white text-gray-900 border-gray-200" : "bg-[#1f1d2c] text-white border-white/10"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b flex items-center justify-between ${isLight ? "border-gray-200 bg-gray-50" : "border-white/5 bg-black/20"}`}>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#b69eff]">{t("manage_community_groups", "Manage Community Groups")}</h3>
                <p className="text-[10px] opacity-60 mt-0.5">{activeRoom.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCommunityGroupManagerOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer border-none bg-transparent ${isLight ? "hover:bg-gray-200 text-gray-600" : "hover:bg-white/10 text-white/70"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`flex border-b text-xs font-bold ${isLight ? "border-gray-200 bg-gray-50" : "border-white/5 bg-black/10"}`}>
              {[
                { id: "list", label: t("community_groups_tab_label", "Groups in Community") },
                { id: "link", label: t("community_link_group_tab", "Link Group") },
                { id: "create", label: t("community_create_group_tab", "Create Group") }
              ].map(tab => {
                const isActive = subGroupManagerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSubGroupManagerTab(tab.id)}
                    className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer border-none bg-transparent ${isActive ? "border-[#7c5dfa] text-[#b69eff] font-black" : "border-transparent opacity-60 text-white"}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-4">
              {subGroupManagerTab === "list" && (() => {
                const communityGroups = (chatList || []).filter(c => c.is_group && !c.is_community && Number(c.community_id) === Number(activeRoom.id));
                if (communityGroups.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs opacity-50 italic">
                      {t("no_groups_linked", "No groups linked to this community yet.")}
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {communityGroups.map(group => (
                      <div key={group.id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${isLight ? "bg-gray-50 border-gray-200" : "bg-white/5 border-white/10"}`}>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{group.name}</p>
                          <p className="text-[9px] opacity-60 mt-0.5">{group.members?.length || 0} {t("members", "members")}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await unlinkGroupFromCommunity(activeRoom.id, group.id);
                              if (res && res.success) {
                                setStatusTip(t("group_removed_from_community", "Group removed from community."));
                                if (refreshChatList) await refreshChatList();
                              }
                            } catch (err) {
                              console.error(err);
                              setStatusTip(t("failed_to_unlink_group", "Failed to unlink group."));
                            }
                          }}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border-none"
                        >
                          {t("remove_group", "Remove Group")}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {subGroupManagerTab === "link" && (() => {
                const linkableGroups = (chatList || []).filter(c =>
                  c.is_group &&
                  !c.is_community &&
                  !c.community_id
                );

                if (linkableGroups.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs opacity-50 italic">
                      {t("no_standalone_groups_available", "No standalone groups available to link.")}
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <p className="text-[10px] opacity-50 uppercase tracking-widest pl-1 font-bold">{t("your_available_groups", "Your Available Groups")}</p>
                    {linkableGroups.map(group => (
                      <div key={group.id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${isLight ? "bg-gray-50 border-gray-200" : "bg-white/5 border-white/10"}`}>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{group.name}</p>
                          <p className="text-[9px] opacity-60 mt-0.5">{group.members?.length || 0} {t("members", "members")}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await linkGroupToCommunity(activeRoom.id, group.id);
                              if (res && res.success) {
                                if (res.pendingApproval) {
                                  setStatusTip(res.message || t("link_request_sent", "Link request sent to group creator."));
                                } else {
                                  setStatusTip(t("group_linked_success", "Group linked to community successfully!"));
                                }
                                if (refreshChatList) await refreshChatList();
                              }
                            } catch (err) {
                              console.error(err);
                              setStatusTip(t("failed_link_group", "Failed to link group."));
                            }
                          }}
                          className="px-3 py-1.5 bg-[#7c5dfa] hover:bg-[#684ce2] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer border-none"
                        >
                          {t("link_group", "Link Group")}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {subGroupManagerTab === "create" && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newSubGroupName.trim()) return;
                    try {
                      const res = await createGroupInCommunity(
                        activeRoom.id,
                        newSubGroupName,
                        selectedSubGroupMembers,
                        newSubGroupOnlyAdminsSend
                      );
                      if (res && res.success) {
                        setStatusTip(t("subgroup_created_success", "Sub-group created inside community!"));
                        setNewSubGroupName("");
                        setSelectedSubGroupMembers([]);
                        try {
                          const membersRes = await getGroupMembers(activeRoom.id);
                          if (membersRes.success) setGroupMembers(membersRes.members);
                        } catch (err) {
                          console.error("Failed to refresh community members list:", err);
                        }
                        setSubGroupMemberQuery("");
                        setSubGroupSearchResults([]);
                        setNewSubGroupOnlyAdminsSend(false);
                        if (refreshChatList) await refreshChatList();
                        setSubGroupManagerTab("list");
                      }
                    } catch (err) {
                      console.error(err);
                      setStatusTip(t("failed_create_group", "Failed to create group."));
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">{t("community_group_name_label", "Group Name")}</label>
                    <input
                      type="text"
                      value={newSubGroupName}
                      onChange={(e) => setNewSubGroupName(e.target.value)}
                      placeholder={t("group_name_placeholder_eg", "e.g. Residents Group")}
                      className={`w-full text-xs rounded-xl p-3 focus:outline-none ${isLight ? "bg-gray-100 text-gray-900 border border-gray-300" : "bg-[#262338] text-white border border-[#7c5dfa]/60"}`}
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/10">
                    <div>
                      <p className="text-xs font-bold">{t("community_only_admins_send_label", "Only Admins Can Send Messages")}</p>
                      <p className="text-[9px] text-white/40 mt-0.5">{t("only_admins_send_messages_desc", "If enabled, only admins can send messages in this group")}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={newSubGroupOnlyAdminsSend}
                      onChange={(e) => setNewSubGroupOnlyAdminsSend(e.target.checked)}
                      className="w-4 h-4 accent-[#7c5dfa] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">{t("community_search_students_placeholder", "Search & Add Students directly (by Mobile / Email)")}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={subGroupMemberQuery}
                        onChange={async (e) => {
                          const val = e.target.value;
                          setSubGroupMemberQuery(val);
                          if (!val.trim()) {
                            setSubGroupSearchResults([]);
                            return;
                          }
                          try {
                            const res = await searchUsersInDirectory(val);
                            if (res && res.success) {
                              setSubGroupSearchResults(res.users || []);
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        placeholder={t("search_student_placeholder", "Type student name, email, or phone number...")}
                        className={`w-full text-xs rounded-xl p-3 focus:outline-none ${isLight ? "bg-gray-100 text-gray-900 border border-gray-300" : "bg-[#262338] text-white border border-[#7c5dfa]/60"}`}
                      />
                    </div>

                    {subGroupSearchResults.length > 0 && (
                      <div className="max-h-[140px] overflow-y-auto no-scrollbar border border-[#7c5dfa]/30 rounded-xl divide-y divide-white/[0.02] p-2 bg-[#2c283d]/50">
                        {subGroupSearchResults.map(user => {
                          if (Number(user.id) === Number(currentUser?.id)) return null;
                          const isSelected = selectedSubGroupMembers.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSubGroupMembers(selectedSubGroupMembers.filter(id => id !== user.id));
                                } else {
                                  setSelectedSubGroupMembers([...selectedSubGroupMembers, user.id]);
                                }
                              }}
                              className="py-2 px-1 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] text-xs font-bold text-[#b69eff]"
                            >
                              <div>
                                <p className="text-white">{user.first_name} {user.last_name || ""}</p>
                                <p className="text-[9px] text-white/40">{user.email} • {user.mobile || t("no_phone", "No phone")}</p>
                              </div>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-[#7c5dfa] border-transparent" : "border-white/10 hover:border-white/20"}`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">{t("community_select_members_label", "Select Group Members")}</label>
                    <div className="max-h-[160px] overflow-y-auto no-scrollbar border border-white/5 rounded-xl divide-y divide-white/[0.02] p-2 bg-black/10">
                      {(() => {
                        const userMap = new Map();
                        if (activeRoom && activeRoom.members) {
                          activeRoom.members.forEach(m => {
                            if (m && Number(m.id) !== Number(currentUser?.id)) {
                              userMap.set(Number(m.id), m);
                            }
                          });
                        }
                        if (contacts) {
                          contacts.forEach(c => {
                            if (c && Number(c.id) !== Number(currentUser?.id)) {
                              userMap.set(Number(c.id), c);
                            }
                          });
                        }
                        if (selectableUsers) {
                          selectableUsers.forEach(u => {
                            if (u && Number(u.id) !== Number(currentUser?.id)) {
                              userMap.set(Number(u.id), u);
                            }
                          });
                        }
                        const list = Array.from(userMap.values());
                        if (list.length === 0) {
                          return (
                            <p className="text-[11px] text-white/30 text-center py-4 italic">{t("no_contacts_or_members_available", "No contacts or members available.")}</p>
                          );
                        }
                        return list.map(member => {
                          const isSelected = selectedSubGroupMembers.includes(member.id);
                          return (
                            <div
                              key={member.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSubGroupMembers(selectedSubGroupMembers.filter(id => id !== member.id));
                                } else {
                                  setSelectedSubGroupMembers([...selectedSubGroupMembers, member.id]);
                                }
                              }}
                              className="py-2 px-1 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] text-xs font-bold"
                            >
                              <span>{member.first_name} {member.last_name || ""}</span>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-[#7c5dfa] border-transparent" : "border-white/10 hover:border-white/20"}`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> {t("community_create_subgroup_button", "Create Sub-group")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )
      }

      {
        isLightboxOpen && lightboxImages.length > 0 && (
          <div
            className={`fixed inset-0 z-[700] flex items-center justify-center p-4 select-none animate-fade-in transition-all ${isLight ? "bg-white/80 backdrop-blur-xl" : "bg-black/95 backdrop-blur-md"}`}
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className={`absolute top-5 right-5 p-2.5 rounded-full transition-colors cursor-pointer z-20 ${isLight ? "bg-black/5 hover:bg-black/10 text-gray-800" : "bg-white/10 hover:bg-white/20 text-white"}`}
            >
              <X className="w-5 h-5" />
            </button>

            {lightboxImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
                }}
                className={`absolute left-5 top-1/2 -translate-y-1/2 p-3 rounded-full transition-colors cursor-pointer z-20 ${isLight ? "bg-black/5 hover:bg-black/10 text-gray-800" : "bg-white/10 hover:bg-white/20 text-white"}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-[500px] h-[500px] max-w-full max-h-[80vh] flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
              <img
                src={lightboxImages[lightboxIndex]}
                alt={`preview-${lightboxIndex}`}
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
              />
            </div>

            {lightboxImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
                }}
                className={`absolute right-5 top-1/2 -translate-y-1/2 p-3 rounded-full transition-colors cursor-pointer z-20 ${isLight ? "bg-black/5 hover:bg-black/10 text-gray-800" : "bg-white/10 hover:bg-white/20 text-white"}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {lightboxImages.length > 1 && (
              <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 border px-4 py-1.5 rounded-full text-xs font-bold tracking-widest ${isLight ? "bg-white/80 border-gray-200 text-gray-800 shadow-sm" : "bg-black/70 border-white/10 text-white"}`}>
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            )}
          </div>
        )
      }

      <AnimatePresence>
        {isFeedbackPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
            className={`fixed bottom-6 right-6 z-[350] w-80 rounded-3xl shadow-2xl flex flex-col p-5 border transition-colors duration-300 ${isLight ? "bg-white text-gray-900 border-gray-200" : "bg-[#161421] text-white border-white/5"}`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${chatThemeColor || "#7c5dfa"}18`, color: chatThemeColor || "#7c5dfa" }}
                >
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <h3 className="text-xs font-extrabold tracking-wide">{t("feedback_title", "Rate Us & Feedback")}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFeedbackPanelOpen(false);
                  setStarRating(0);
                }}
                className={`p-1.5 rounded-full transition-colors cursor-pointer border-none bg-transparent ${isLight ? "hover:bg-gray-200 text-gray-600" : "hover:bg-white/10 text-white/70"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-bold text-emerald-400">{t("feedback_submitted", "Thank You!")}</h4>
                <p className={`text-xs ${isLight ? "text-gray-500" : "text-white/50"}`}>
                  {t("feedback_success_desc", "Your star feedback has been submitted successfully.")}
                </p>
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center space-y-4">
                <p className={`text-xs text-center font-medium ${isLight ? "text-gray-500" : "text-white/50"}`}>
                  {t("feedback_subtitle", "How would you rate your chat experience?")}
                </p>

                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setStarHover(star)}
                      onMouseLeave={() => setStarHover(0)}
                      onClick={() => setStarRating(star)}
                      className="p-1 transition-transform active:scale-90 cursor-pointer border-none bg-transparent"
                    >
                      <Star
                        className="w-8 h-8 transition-colors"
                        style={{
                          color: (starHover || starRating) >= star ? (chatThemeColor || "#7c5dfa") : (isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.1)"),
                          fill: (starHover || starRating) >= star ? (chatThemeColor || "#7c5dfa") : "transparent"
                        }}
                      />
                    </button>
                  ))}
                </div>

                <div className="h-5 flex items-center justify-center">
                  {starRating > 0 ? (
                    <span
                      className="text-xs font-black tracking-wide uppercase transition-all"
                      style={{ color: chatThemeColor || "#7c5dfa" }}
                    >
                      {
                        starRating === 1 ? t("rating_very_bad", "Very Bad") :
                          starRating === 2 ? t("rating_bad", "Bad") :
                            starRating === 3 ? t("rating_average", "Average") :
                              starRating === 4 ? t("rating_good", "Good") :
                                t("rating_excellent", "Excellent")
                      }
                    </span>
                  ) : (
                    <span className={`text-[10px] font-semibold ${isLight ? "text-gray-400" : "text-white/30"}`}>
                      {t("feedback_select_stars", "Choose your rating")}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={starRating === 0 || feedbackSubmitting}
                  onClick={async () => {
                    setFeedbackSubmitting(true);
                    try {
                      const res = await sendStarFeedback(starRating, "");
                      if (res.success) {
                        setFeedbackSuccess(true);
                        setTimeout(() => {
                          setIsFeedbackPanelOpen(false);
                          setFeedbackSuccess(false);
                          setStarRating(0);
                        }, 1500);
                      }
                    } catch (err) {
                      console.error("Failed to send feedback:", err);
                    } finally {
                      setFeedbackSubmitting(false);
                    }
                  }}
                  style={{ backgroundColor: chatThemeColor || "#7c5dfa" }}
                  className="w-full text-white py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 border-none disabled:opacity-40"
                >
                  {feedbackSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    t("send", "Send")
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}
