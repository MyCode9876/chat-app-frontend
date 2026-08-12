"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/message";
import { MdGroups } from "react-icons/md";
import updatesIcon from "./updates.png";
import defaultWallpaper from "../public/wllapers.png";
import { MessageSquare, Phone, CircleDot, Users, Bell, Settings, LogOut, Plus, Search, Camera, X, QrCode, MoreVertical, UserPlus, ArrowLeft, Pencil, User, Shield, Key, Check, Globe, Pin, Moon, Sun, Paintbrush, Trash2, Eye, Download, HelpCircle, AlertTriangle, Lock, Paintbrush2, Mail, Archive, FileText, Video, Image, Music, BarChart2, ChevronRight, Info, FlaskConical, Bug, AlertCircle, Smile, Star, CheckCheck, CheckSquare } from "lucide-react";
import {
  saveContact,
  createCommunityChat,
  searchUsersInDirectory,
  deleteMultipleChats,
  pinChatRoom,
  deleteContact,
  blockUser,
  unblockUser,
  getBlockedUsers,
  deleteChatRoom,
  getUserLists,
  createUserList,
  updateUserList,
  deleteUserList,
  editContact,
  acceptCommunityInvite,
  declineCommunityInvite,
  discoverCommunities,
  requestToJoinCommunity,
  linkGroupToCommunity
} from "../services/chat";
import { getStatusUpdates, createStatusUpdate, deleteStatusUpdate } from "../services/status";
import { uploadAttachmentFile, markRoomMessagesAsSeen } from "../services/message";
import { getPrivacySettings, updatePrivacySettings, requestAccountInfo, sendFeedback, sendStarFeedback, toggleLockChat, setChatLockPin, verifyChatLockPin, sendVerificationEmailService } from "../services/auth";
import { deleteNotificationsBatch } from "../services/notification";
import StatusViewer from "./statusViewer";
import { useTranslation } from "./i18n";
import api from "../services/api";

/* ─── Premium Custom Select (SS3 style dropdown) ─────────────────────────── */
const CustomSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-[#9f85ff] bg-[#201d2d] border border-white/[0.08] hover:border-[#7c5dfa]/40 hover:shadow-[0_2px_12px_rgba(124,93,250,0.15)] transition-all cursor-pointer custom-select-btn"
        aria-expanded={open}
      >
        <span>{selected?.label}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-36 bg-[#1f1d2c] border border-white/[0.08] rounded-xl shadow-2xl py-1 z-50 animate-fade-in custom-select-panel max-h-[220px] overflow-y-auto custom-scrollbar">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 text-[10px] font-bold transition-all cursor-pointer custom-select-option ${value === opt.value
                ? 'bg-[#7c5dfa]/20 text-[#b69eff]'
                : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                }`}
            >
              {value === opt.value && <span className="mr-1.5 text-[#7c5dfa]">✓</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusAvatarRing = ({ statuses = [], hasUnviewed = false, viewedStatusesLocal = [], isOwn = false, children }) => {
  const total = statuses.length;
  if (total === 0) return children;

  const r = 20;
  const c = 2 * Math.PI * r;
  const gap = total > 1 ? 3.5 : 0;
  const segmentLength = (c - total * gap) / total;

  return (
    <div className="relative w-11 h-11 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
        {statuses.map((status, index) => {
          const isViewed = !isOwn && (status.viewed || viewedStatusesLocal.includes(status.id));
          const strokeColor = isViewed ? "#9ca3af" : "#7c5dfa";
          const strokeDashoffset = index * (segmentLength + gap);
          const strokeWidthVal = isOwn ? "3.8" : "2.5";

          return (
            <circle
              key={index}
              cx="22"
              cy="22"
              r={r}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidthVal}
              strokeDasharray={`${segmentLength} ${c - segmentLength}`}
              strokeDashoffset={-strokeDashoffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="w-8.5 h-8.5 rounded-full overflow-hidden flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const getSearchableSettingsList = (t) => [
  { id: "profile", name: t("profile"), desc: t("settings_profile_desc"), target: "profile", icon: User, color: "text-[#9f85ff] bg-[#7c5dfa]/10" },
  { id: "account", name: t("account"), desc: t("settings_account_desc"), target: "account", icon: Key, color: "text-blue-400 bg-blue-500/10" },
  { id: "security", name: t("security_notifications", "Security notifications"), desc: "Security, encryption, email", target: "security", icon: Shield, color: "text-blue-400 bg-blue-500/10" },
  { id: "delete_account", name: t("how_to_delete_account", "How to delete my account"), desc: "Deactivate account", target: "delete-account-info", icon: Trash2, color: "text-red-400 bg-red-500/10" },
  { id: "privacy", name: t("privacy"), desc: t("settings_privacy_desc"), target: "privacy", icon: Shield, color: "text-purple-400 bg-purple-500/10" },
  { id: "last_seen", name: t("last_seen_and_online"), desc: "Privacy: Last seen & online", target: "privacy-last-seen", icon: Eye, color: "text-purple-400 bg-purple-500/10" },
  { id: "profile_pic", name: t("profile_picture"), desc: "Privacy: Profile photo visibility", target: "privacy-profile-pic", icon: Camera, color: "text-purple-400 bg-purple-500/10" },
  { id: "about_privacy", name: t("about"), desc: "Privacy: About info visibility", target: "privacy-about", icon: Info, color: "text-purple-400 bg-purple-500/10" },
  { id: "status_privacy", name: t("status"), desc: "Privacy: Status updates visibility", target: "privacy-status", icon: CircleDot, color: "text-purple-400 bg-purple-500/10" },
  { id: "disappearing", name: t("disappearing_messages"), desc: "Default message timer", target: "disappearing-messages", icon: Shield, color: "text-purple-400 bg-purple-500/10" },
  { id: "chats", name: t("chats"), desc: t("settings_chats_desc"), target: "chats", icon: MessageSquare, color: "text-emerald-400 bg-emerald-500/10" },
  { id: "chat_theme", name: t("chatTheme", "Chat Theme"), desc: "Change chat accent colors", target: "chat-theme", icon: Paintbrush, color: "text-emerald-400 bg-emerald-500/10" },
  { id: "wallpaper", name: t("wallpaper"), desc: "Set chat wallpaper", target: "wallpaper", icon: Image, color: "text-emerald-400 bg-emerald-500/10" },
  { id: "notifications", name: t("notifications"), desc: t("settings_notifications_desc"), target: "notifications", icon: Bell, color: "text-amber-400 bg-amber-500/10" },
  { id: "help", name: t("help_and_feedback", "Help and feedback"), desc: t("settings_help_desc"), target: "help", icon: HelpCircle, color: "text-cyan-400 bg-cyan-500/10" },
  { id: "send_feedback", name: t("send_feedback"), desc: "Send app feedback or report issue", target: "send-feedback", icon: Bug, color: "text-cyan-400 bg-cyan-500/10" },
  { id: "invite", name: t("inviteFriend"), desc: t("settings_invite_menu_desc"), target: "invite", icon: UserPlus, color: "text-pink-400 bg-pink-500/10" },
  { id: "updates", name: t("appUpdates"), desc: t("settings_updates_desc"), target: "updates", icon: Download, color: "text-indigo-400 bg-indigo-500/10" },
  { id: "language", name: t("language"), desc: t("settings_language_menu_desc"), target: "language", icon: Globe, color: "text-teal-400 bg-teal-500/10" },
];

export default function ChatSidebar({
  activeTab,
  setActiveTab,
  initialSettingsView,
  chatFilter,
  setChatFilter,
  currentUser,
  chatList,
  contacts = [],
  refreshContacts,
  refreshChatList,
  activeRoom,
  handleSelectRoom,
  handleStartPersonalChat,
  notifications,
  setNotifications,
  handleClearNotifications,
  handleReadNotification,
  handleDeleteNotification,
  editFirstName,
  setEditFirstName,
  editLastName,
  setEditLastName,
  editMobile,
  setEditMobile,
  editAddress,
  setEditAddress,
  editAbout,
  setEditAbout,
  profileSuccessMsg,
  setProfileSuccessMsg,
  profileErrorMsg,
  setProfileErrorMsg,
  handleUpdateProfile,
  handleProfileImageChange,
  handleDeleteAccount,
  handleLogout,
  isGroupModalOpen,
  setIsGroupModalOpen,
  groupName = "",
  setGroupName,
  selectedGroupMembers = [],
  setSelectedGroupMembers,
  handleCreateGroup,
  profileImageInputRef,
  getRoomPartner,
  mobileActiveView,
  setMobileActiveView,
  chatWallpaper,
  setChatWallpaper,
  chatThemeColor,
  setChatThemeColor,
  statusRefreshTrigger = 0,
  directoryUsers = [],
  directorySearch = "",
  handleDirectorySearch,
  disappearingDuration,
  setDisappearingDuration,
  fontSize,
  setFontSize,
  statusTip,
  setStatusTip,
}) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [statusSearch, setStatusSearch] = useState("");
  const [isStatusSearching, setIsStatusSearching] = useState(false);
  const [isMyStatusMenuOpen, setIsMyStatusMenuOpen] = useState(false);
  const [isThreeDotMenuOpen, setIsThreeDotMenuOpen] = useState(false);
  const [showCommunityMembersId, setShowCommunityMembersId] = useState(null);
  const [groupValidationError, setGroupValidationError] = useState("");
  const [isViewingLockedChats, setIsViewingLockedChats] = useState(false);
  const [isUnlockPinModalOpen, setIsUnlockPinModalOpen] = useState(false);
  const [isSetupPinModalOpen, setIsSetupPinModalOpen] = useState(false);
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [targetLockRoomId, setTargetLockRoomId] = useState(null);
  const [selectedNotifIds, setSelectedNotifIds] = useState([]);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Discover communities state
  const [discoverList, setDiscoverList] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);

  const fetchDiscoveredCommunities = async () => {
    try {
      setDiscoverLoading(true);
      const res = await discoverCommunities();
      if (res && res.success) {
        setDiscoverList(res.communities || []);
      }
    } catch (err) {
      console.error("Failed to load discover list:", err);
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "community") {
      fetchDiscoveredCommunities();
    }
  }, [activeTab]);

  const { t } = useTranslation();

  const cleanLastMessageText = (msg) => {
    if (!msg) return "";
    if (msg.message_text === "\u200Bdeleted\u200B") {
      return t("deleted_message_placeholder") || "This message was deleted";
    }
    let text = msg.message_text || "";
    text = text.replace(/^\u200B(reply:[^\u200B]+|status_reply:[^:]+:[^\u200B]+)\u200B/g, "");
    text = text.replace(/\u200Bforwarded\u200B/g, "");
    text = text.replace(/\u200B/g, "");
    if (text.startsWith(":")) {
      text = text.substring(1).trim();
    }
    return text;
  };

  const renderLastMessageAttachmentIcon = (msg) => {
    if (!msg) return null;
    const type = msg.attachment_type ? msg.attachment_type.toLowerCase() : "";
    if (type === "image") {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{t("photo", "Photo")}</span>
        </span>
      );
    }
    if (type === "video") {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          <Video className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{t("video", "Video")}</span>
        </span>
      );
    }
    if (type === "gif") {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          <Image className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{t("gif", "GIF")}</span>
        </span>
      );
    }
    if (type === "sticker") {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          <Smile className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{t("sticker", "Sticker")}</span>
        </span>
      );
    }
    if (type === "audio" || type === "mp3" || type === "wav") {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          <Music className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{t("audio", "Audio")}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-slate-400">
        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{t("document", "Document")}</span>
      </span>
    );
  };

  // Custom Lists States
  const [userLists, setUserLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsSubView, setListsSubView] = useState("chats"); // "chats", "new-list", "edit-list"
  const [selectedListForEdit, setSelectedListForEdit] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [newListItems, setNewListItems] = useState([]);
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listValidationError, setListValidationError] = useState("");

  const loadUserLists = async () => {
    setListsLoading(true);
    try {
      const res = await getUserLists();
      if (res.success) {
        setUserLists(res.lists || []);
      }
    } catch (err) {
      console.error("Failed to load lists:", err);
    } finally {
      setListsLoading(false);
    }
  };

  useEffect(() => {
    loadUserLists();
  }, []);

  // Dynamic settings preferences states
  const [readReceipts, setReadReceipts] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("pref_readReceipts");
      return v !== "false"; // default true
    }
    return true;
  });
  const [conversationTones, setConversationTones] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("pref_conversationTones");
      return v !== "false"; // default true
    }
    return true;
  });
  const [highPriorityNotif, setHighPriorityNotif] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("pref_highPriorityNotif");
      return v !== "false"; // default true
    }
    return true;
  });
  const [mediaVisibility, setMediaVisibility] = useState(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("pref_mediaVisibility");
      return v !== "false"; // default true
    }
    return true;
  });

  const [contactsView, setContactsView] = useState("list"); // "list" or "add"
  const [editingContactId, setEditingContactId] = useState(null);
  const [editContactFirstName, setEditContactFirstName] = useState("");
  const [editContactLastName, setEditContactLastName] = useState("");
  const [contactEmailOrMobile, setContactEmailOrMobile] = useState("");
  const [newContactFirstName, setNewContactFirstName] = useState("");
  const [newContactLastName, setNewContactLastName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [addContactError, setAddContactError] = useState("");
  const [addContactSuccess, setAddContactSuccess] = useState("");
  const [addContactLoading, setAddContactLoading] = useState(false);
  const [addContactErrors, setAddContactErrors] = useState({
    firstName: false,
    lastName: false,
    phone: false,
  });
  const [settingsView, setSettingsView] = useState(initialSettingsView || "menu");
  const [settingsTip, setSettingsTip] = useState("");
  const [settingsSearchQuery, setSettingsSearchQuery] = useState("");
  const [isSettingsSearching, setIsSettingsSearching] = useState(false);
  const [showSecurityNotifs, setShowSecurityNotifs] = useState(true);
  const [isTwoStepEnabled, setIsTwoStepEnabled] = useState(true);
  const [contactSubject, setContactSubject] = useState("");

  // Feedback Form States
  const [feedbackType, setFeedbackType] = useState("general");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackStarHover, setFeedbackStarHover] = useState(0);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Sub-pages preferences states matching screenshots UI
  const [lastSeenVisibility, setLastSeenVisibility] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_lastSeen") || "My contacts" : "My contacts"));
  const [profilePicVisibility, setProfilePicVisibility] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_profilePic") || "My contacts" : "My contacts"));
  const [aboutVisibility, setAboutVisibility] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_about") || "Everyone" : "Everyone"));
  const [statusVisibility, setStatusVisibility] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_statusVis") || "My contacts" : "My contacts"));
  const [disappearingTimer, setDisappearingTimer] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_disappearingTimer") || "Off" : "Off"));
  const [groupPrivacy, setGroupPrivacy] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_groupPrivacy") || "Everyone" : "Everyone"));
  const [appLockEnabled, setAppLockEnabled] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_appLock") === "true" : false));

  const [mediaUploadQuality, setMediaUploadQuality] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_mediaQuality") || "Standard" : "Standard"));
  const [mediaAutoDownload, setMediaAutoDownload] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_autoDownload") || "Wi-Fi" : "Wi-Fi"));
  const [spellCheck, setSpellCheck] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_spellCheck") !== "false" : true));
  const [replaceEmoji, setReplaceEmoji] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_replaceEmoji") !== "false" : true));
  const [enterIsSend, setEnterIsSend] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_enterIsSend") !== "false" : true));

  const [messageNotifications, setMessageNotifications] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_msgNotif") !== "false" : true));
  const [reactionNotifications, setReactionNotifications] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_reactionNotif") !== "false" : true));
  const [incomingSounds, setIncomingSounds] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_incomingSounds") !== "false" : true));
  const [outgoingSounds, setOutgoingSounds] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_outgoingSounds") === "true" : false));
  const [joinBeta, setJoinBeta] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("pref_joinBeta") === "true" : false));

  // WhatsApp Chat Theme Preview Modal State
  const [previewThemeModal, setPreviewThemeModal] = useState({
    isOpen: false,
    presetId: null,
    name: "",
    color: "#7c5dfa",
    wallpaper: "",
    previewBg: "",
    isDarkPreview: true,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/profile") {
        setSettingsView("profile");
      } else if (path === "/settings") {
        setSettingsView("menu");
      }
    }
  }, [activeTab]);

  // Load Privacy Settings from DB on component mount
  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const res = await getPrivacySettings();
        if (res.success && res.privacy) {
          const p = res.privacy;
          if (p.last_seen) setLastSeenVisibility(p.last_seen === "my_contacts" ? "My contacts" : p.last_seen === "nobody" ? "Nobody" : "Everyone");
          if (p.profile_pic) setProfilePicVisibility(p.profile_pic === "my_contacts" ? "My contacts" : p.profile_pic === "nobody" ? "Nobody" : "Everyone");
          if (p.about) setAboutVisibility(p.about === "my_contacts" ? "My contacts" : p.about === "nobody" ? "Nobody" : "Everyone");
          if (p.status) setStatusVisibility(p.status === "my_contacts" ? "My contacts" : p.status === "nobody" ? "Nobody" : "Everyone");
          if (p.groups) setGroupPrivacy(p.groups === "my_contacts" ? "My contacts" : p.groups === "nobody" ? "Nobody" : "Everyone");
          if (typeof p.read_receipts === "boolean") setReadReceipts(p.read_receipts);
          if (typeof p.app_lock === "boolean") setAppLockEnabled(p.app_lock);
        }
      } catch (err) {
        console.warn("Using local privacy preferences:", err);
      }
    };
    fetchPrivacy();
  }, []);

  const savePrivacyOption = async (key, val) => {
    try {
      let dbVal = val.toLowerCase().replace(/ /g, "_");
      await updatePrivacySettings({ [key]: dbVal });
    } catch (err) {
      console.warn("Failed to sync privacy setting with backend DB:", err);
    }
  };

  const cycleVisibility = (key) => {
    const options = ["Everyone", "My contacts", "Nobody"];
    if (key === "lastSeen") {
      const next = options[(options.indexOf(lastSeenVisibility) + 1) % options.length];
      setLastSeenVisibility(next);
      localStorage.setItem("pref_lastSeen", next);
    } else if (key === "profilePic") {
      const next = options[(options.indexOf(profilePicVisibility) + 1) % options.length];
      setProfilePicVisibility(next);
      localStorage.setItem("pref_profilePic", next);
    } else if (key === "about") {
      const next = options[(options.indexOf(aboutVisibility) + 1) % options.length];
      setAboutVisibility(next);
      localStorage.setItem("pref_about", next);
    } else if (key === "status") {
      const next = options[(options.indexOf(statusVisibility) + 1) % options.length];
      setStatusVisibility(next);
      localStorage.setItem("pref_statusVis", next);
    } else if (key === "groups") {
      const next = options[(options.indexOf(groupPrivacy) + 1) % options.length];
      setGroupPrivacy(next);
      localStorage.setItem("pref_groupPrivacy", next);
    }
  };

  const cycleDisappearingTimer = () => {
    const opts = ["Off", "24 hours", "7 days", "90 days"];
    const next = opts[(opts.indexOf(disappearingTimer) + 1) % opts.length];
    setDisappearingTimer(next);
    localStorage.setItem("pref_disappearingTimer", next);
  };

  const cycleMediaQuality = () => {
    const opts = ["Standard", "HD quality"];
    const next = opts[(opts.indexOf(mediaUploadQuality) + 1) % opts.length];
    setMediaUploadQuality(next);
    localStorage.setItem("pref_mediaQuality", next);
  };

  const cycleAutoDownload = () => {
    const opts = ["Wi-Fi", "Wi-Fi and cellular", "Never"];
    const next = opts[(opts.indexOf(mediaAutoDownload) + 1) % opts.length];
    setMediaAutoDownload(next);
    localStorage.setItem("pref_autoDownload", next);
  };

  const [keepChatsArchived, setKeepChatsArchived] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pref_keepChatsArchived") === "true";
    }
    return false;
  });

  const [archivedRoomIds, setArchivedRoomIds] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pref_archivedRoomIds");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isViewingArchivedChats, setIsViewingArchivedChats] = useState(false);
  const [notifSearchQuery, setNotifSearchQuery] = useState("");
  const [muteAllNotifications, setMuteAllNotifications] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pref_muteAllNotifications") === "true";
    }
    return false;
  });

  useEffect(() => {
    const handleSyncArchived = () => {
      const saved = localStorage.getItem("pref_archivedRoomIds");
      setArchivedRoomIds(saved ? JSON.parse(saved) : []);
    };
    window.addEventListener("storage_archived_rooms", handleSyncArchived);
    return () => window.removeEventListener("storage_archived_rooms", handleSyncArchived);
  }, []);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [editingField, setEditingField] = useState(null); // null, "name", "about", "mobile", "address"

  // Block list states
  const [customPills, setCustomPills] = useState(() => {
    try {
      const saved = localStorage.getItem("chat_filter_pills");
      return saved ? JSON.parse(saved) : ["all", "unread", "groups"];
    } catch {
      return ["all", "unread", "groups"];
    }
  });

  const handleAddCustomFilter = () => {
    const filterName = prompt(t("prompt_enter_filter_tag"));
    if (filterName && filterName.trim()) {
      const cleanName = filterName.trim();
      const pillVal = cleanName.toLowerCase();
      if (!customPills.includes(pillVal)) {
        const updated = [...customPills, pillVal];
        setCustomPills(updated);
        localStorage.setItem("chat_filter_pills", JSON.stringify(updated));
        setChatFilter(pillVal);
      }
    }
  };

  const handleRemoveCustomFilter = (e, pillToRemove) => {
    e.stopPropagation();
    const updated = customPills.filter(p => p !== pillToRemove);
    setCustomPills(updated);
    localStorage.setItem("chat_filter_pills", JSON.stringify(updated));
    if (chatFilter === pillToRemove) {
      setChatFilter("all");
    }
  };

  useEffect(() => {
    if (settingsView === "contact-us" && currentUser) {
      setContactName(`${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim());
      setContactPhone(currentUser.mobile || currentUser.email || "");
    }
  }, [settingsView, currentUser]);

  // Block list states
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState(null);

  const loadBlockedUsersList = async () => {
    setBlockedLoading(true);
    try {
      const res = await getBlockedUsers();
      if (res.success) {
        setBlockedUsers(res.blockedUsers || []);
      }
    } catch (err) {
      console.error("Failed to load blocked users:", err);
    } finally {
      setBlockedLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    setUnblockingUserId(userId);
    try {
      const res = await unblockUser(userId);
      if (res.success) {
        setSettingsTip(t("success_user_unblocked"));
        setTimeout(() => setSettingsTip(""), 3000);
        await loadBlockedUsersList();
        if (refreshChatList) await refreshChatList();
        if (refreshContacts) await refreshContacts();
      }
    } catch (err) {
      console.error("Failed to unblock user:", err);
      setSettingsTip(t("error_user_unblock_failed"));
      setTimeout(() => setSettingsTip(""), 3000);
    } finally {
      setUnblockingUserId(null);
    }
  };

  // Community creation states
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [selectedCommunityMembers, setSelectedCommunityMembers] = useState([]);
  const [selectedCommunityGroups, setSelectedCommunityGroups] = useState([]);
  const [communityError, setCommunityError] = useState("");
  const [communitySuccess, setCommunitySuccess] = useState("");
  const [communityLoading, setCommunityLoading] = useState(false);

  // Search API results state
  const [searchApiResults, setSearchApiResults] = useState([]);

  // Selection / Delete Mode states
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState([]);

  // Custom confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    icon: "trash", // "trash" | "warning"
    onConfirm: null,
  });

  // Status updates states
  const [statusesData, setStatusesData] = useState({ myStatus: { user: null, statuses: [] }, contactUpdates: [] });
  const [viewedStatusesLocal, setViewedStatusesLocal] = useState([]);
  const [isUploadingStatus, setIsUploadingStatus] = useState(false);
  const [statusUploadProgress, setStatusUploadProgress] = useState(0);
  const [statusUploadPreviewFile, setStatusUploadPreviewFile] = useState(null);
  const [statusCaptionText, setStatusCaptionText] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("viewed_statuses_local");
      if (saved) {
        setViewedStatusesLocal(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleReadAllChats = async () => {
    try {
      for (const chat of chatList) {
        if (chat.unread_count > 0) {
          await markRoomMessagesAsSeen(chat.id);
        }
      }
      if (refreshChatList) await refreshChatList();
      setSettingsTip(t("success_all_chats_read"));
      setTimeout(() => setSettingsTip(""), 3000);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleLockChat = async (roomId) => {
    setTargetLockRoomId(roomId);
    setPinDigits(["", "", "", ""]);
    setPinError("");
    setIsSetupPinModalOpen(true);
  };

  const handleUnlockChat = async (roomId) => {
    try {
      const res = await toggleLockChat(roomId, false);
      if (res.success && refreshChatList) {
        await refreshChatList();
      }
    } catch (err) {
      console.error("Failed to unlock chat:", err);
    }
  };

  const handleVerifyPinSubmit = async (enteredPin) => {
    if (!enteredPin || enteredPin.length !== 4) return;
    setPinSubmitting(true);
    setPinError("");
    try {
      const res = await verifyChatLockPin(enteredPin);
      if (res.success && res.valid) {
        setIsUnlockPinModalOpen(false);
        setIsViewingLockedChats(true);
      } else {
        setPinError(t("error_invalid_pin", "Incorrect 4-digit PIN code. Please try again."));
      }
    } catch (err) {
      setPinError(t("error_invalid_pin", "Incorrect 4-digit PIN code. Please try again."));
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleSetupPinSubmit = async (newPin) => {
    if (!newPin || newPin.length !== 4) {
      setPinError(t("error_pin_4_digits", "PIN must be exactly 4 digits."));
      return;
    }
    setPinSubmitting(true);
    setPinError("");
    try {
      const res = await setChatLockPin(newPin);
      if (res.success) {
        setIsSetupPinModalOpen(false);
        if (targetLockRoomId) {
          await toggleLockChat(targetLockRoomId, true);
          if (refreshChatList) await refreshChatList();
          setTargetLockRoomId(null);
        }
      } else {
        setPinError(res.message || "Failed to set PIN.");
      }
    } catch (err) {
      setPinError("Failed to set 4-digit PIN.");
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleStatusClick = (group) => {
    setActiveStatusGroup(group);
    if (group && group.statuses) {
      setViewedStatusesLocal((prev) => {
        const next = [...prev];
        let changed = false;
        group.statuses.forEach((s) => {
          if (!next.includes(s.id)) {
            next.push(s.id);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem("viewed_statuses_local", JSON.stringify(next));
        }
        return next;
      });
    }
  };

  const [activeStatusGroup, setActiveStatusGroup] = useState(null);
  const [statusesSubView, setStatusesSubView] = useState("list"); // "list" | "my-details"
  const [isTextStatusOpen, setIsTextStatusOpen] = useState(false);
  const [mediaStatusFile, setMediaStatusFile] = useState(null);
  const [mediaStatusPreview, setMediaStatusPreview] = useState("");
  const [mediaStatusCaption, setMediaStatusCaption] = useState("");
  const [isMediaStatusModalOpen, setIsMediaStatusModalOpen] = useState(false);
  const [textStatusContent, setTextStatusContent] = useState("");
  const [textStatusBg, setTextStatusBg] = useState("#7c5dfa");
  const [textStatusSubmitting, setTextStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");
  const statusFileInputRef = useRef(null);

  // Theme & Qr states
  const [theme, setTheme] = useState("dark");
  const [isQrScannerActive, setIsQrScannerActive] = useState(false);
  const [qrScannerError, setQrScannerError] = useState("");
  const [contactsSearch, setContactsSearch] = useState("");
  const [notifFilter, setNotifFilter] = useState("all");

  const threeDotMenuRef = useRef(null);

  const loadStatuses = async () => {
    try {
      const res = await getStatusUpdates();
      if (res.success) {
        setStatusesData({
          myStatus: res.myStatus || { user: currentUser, statuses: [] },
          contactUpdates: res.contactUpdates || [],
        });
      }
    } catch (err) {
      console.error("Failed to load statuses:", err);
    }
  };

  const handleUploadMediaStatus = async (file) => {
    if (!file) return;

    // Only allow images and videos
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      if (setStatusTip) setStatusTip("Only images and videos are allowed on status updates!");
      else alert("Only images and videos are allowed on status updates!");
      return;
    }

    // Limit size to 10MB due to Supabase payload size limits
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      if (setStatusTip) setStatusTip("File is too large! Status uploads are limited to 10MB max.");
      else alert("File is too large! Status uploads are limited to 10MB max.");
      return;
    }

    setIsUploadingStatus(true);
    setStatusUploadProgress(0);
    try {
      const uploadRes = await uploadAttachmentFile(file, (pct) => {
        setStatusUploadProgress(pct);
      });
      if (uploadRes.success) {
        const type = file.type.startsWith("video") ? "video" : "image";
        const statusContent = JSON.stringify({
          url: uploadRes.url,
          caption: ""
        });

        const statusRes = await createStatusUpdate({
          type,
          content: statusContent,
        });
        if (statusRes.success) {
          await loadStatuses();
        }
      }
    } catch (err) {
      console.error("Status upload failed:", err);
    } finally {
      setIsUploadingStatus(false);
    }
  };

  useEffect(() => {
    const handleTriggerAddContact = (e) => {
      const { phone, email } = e.detail || {};
      setNewContactFirstName("");
      setNewContactLastName("");
      setNewContactPhone(phone || "");
      setNewContactEmail(email || "");
      setContactsView("add");
      setActiveTab("contacts");
    };

    window.addEventListener("triggerAddContact", handleTriggerAddContact);
    return () => window.removeEventListener("triggerAddContact", handleTriggerAddContact);
  }, [setNewContactFirstName, setNewContactLastName, setNewContactPhone, setNewContactEmail, setContactsView, setActiveTab]);

  useEffect(() => {
    if (activeTab === "status" && currentUser) {
      loadStatuses();
    }
  }, [activeTab, currentUser]);

  // Real-time socket refresh - fires when a contact posts a new status
  useEffect(() => {
    if (statusRefreshTrigger > 0 && currentUser) {
      loadStatuses();
    }
  }, [statusRefreshTrigger]);

  useEffect(() => {
    const isModalActive = isGroupModalOpen || isCommunityModalOpen || isTextStatusOpen || confirmModal.isOpen;
    if (isModalActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isGroupModalOpen, isCommunityModalOpen, isTextStatusOpen, confirmModal.isOpen]);

  const applyTheme = (themeName) => {
    const root = window.document.documentElement;
    if (themeName === "light") {
      root.classList.add("light");
    } else if (themeName === "dark") {
      root.classList.remove("light");
    } else if (themeName === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        root.classList.remove("light");
      } else {
        root.classList.add("light");
      }
    }
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: themeName }));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentTheme = localStorage.getItem("theme") || "system";
      if (currentTheme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleOpenSettingsView = (e) => {
      if (e.detail) {
        setSettingsView(e.detail);
      }
    };
    window.addEventListener("openSettingsView", handleOpenSettingsView);
    return () => window.removeEventListener("openSettingsView", handleOpenSettingsView);
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };


  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (threeDotMenuRef.current && !threeDotMenuRef.current.contains(e.target)) {
        setIsThreeDotMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleChatSearchChange = async (val) => {
    setChatSearch(val);
    if (!val.trim()) {
      setSearchApiResults([]);
      return;
    }
    try {
      const res = await searchUsersInDirectory(val);
      if (res.success) {
        // Exclude current user from search results
        const filtered = (res.users || []).filter((u) => Number(u.id) !== Number(currentUser?.id));
        setSearchApiResults(filtered);
      }
    } catch (err) {
      console.error("Search API failed:", err);
    }
  };

  const handleCreateCommunitySubmit = async (e) => {
    e.preventDefault();
    setCommunityError("");
    setCommunitySuccess("");

    if (!communityName.trim()) {
      setCommunityError(t("error_community_name_required"));
      return;
    }

    setCommunityLoading(true);
    try {
      const res = await createCommunityChat(communityName, selectedCommunityMembers, selectedCommunityGroups);
      if (res.success) {
        setCommunitySuccess(t("success_community_created"));
        setCommunityName("");
        setSelectedCommunityMembers([]);
        setSelectedCommunityGroups([]);
        if (refreshChatList) {
          await refreshChatList();
        }
        setTimeout(() => {
          setIsCommunityModalOpen(false);
          setCommunitySuccess("");
        }, 1500);
      } else {
        setCommunityError(res.message || t("error_community_failed"));
      }
    } catch (err) {
      setCommunityError(err.response?.data?.message || err.response?.data?.error || t("error_community_failed"));
    } finally {
      setCommunityLoading(false);
    }
  };

  const toggleCommunityMemberSelection = (uid) => {
    setSelectedCommunityMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const toggleCommunityGroupSelection = (gid) => {
    setSelectedCommunityGroups((prev) =>
      prev.includes(gid) ? prev.filter((id) => id !== gid) : [...prev, gid]
    );
  };

  const nameEditableRef = useRef(null);
  const aboutEditableRef = useRef(null);
  const mobileEditableRef = useRef(null);
  const addressEditableRef = useRef(null);

  const focusEditableField = (ref) => {
    if (ref.current) {
      ref.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const initials = currentUser
    ? `${currentUser.first_name?.[0] || ""}${currentUser.last_name?.[0] || ""}`.toUpperCase()
    : "U";

  const [chatSearch, setChatSearch] = useState("");

  const mergedChatList = [...chatList];

  // 1. Auto-inject mock Self-Chat (You) room if not exists in active chats
  const hasSelfChatRoom = chatList.some((chat) => {
    return !chat.is_group && chat.members?.length === 1 && Number(chat.members[0].id) === Number(currentUser?.id);
  });

  if (!hasSelfChatRoom && currentUser) {
    mergedChatList.push({
      id: `self-${currentUser.id}`,
      is_group: false,
      name: null,
      members: [currentUser],
      lastMessage: null,
      unreadCount: 0,
      isSelfChatOnly: true,
      contactUser: currentUser
    });
  }

  // 2. Inject contact-only mock rooms
  contacts.forEach((c) => {
    // Avoid duplicate self chat injection from contacts list
    if (Number(c.id) === Number(currentUser?.id)) return;

    const hasActiveChat = chatList.some((chat) => {
      if (chat.is_group) return false;
      return chat.members?.some((m) => m && Number(m.id) === Number(c.id));
    });

    if (!hasActiveChat) {
      mergedChatList.push({
        id: `contact-${c.id}`,
        is_group: false,
        name: null,
        members: [currentUser, c],
        lastMessage: null,
        unreadCount: 0,
        isContactOnly: true,
        contactUser: c
      });
    }
  });

  const lockedRoomIds = chatList.filter((c) => c.is_locked).map((c) => Number(c.id));

  const filteredChatList = mergedChatList.filter((chat) => {
    const isLocked = chat.is_locked || lockedRoomIds.includes(Number(chat.id));
    if (isViewingLockedChats) {
      if (!isLocked) return false;
    } else {
      if (isLocked) return false;
    }

    const isArchived = archivedRoomIds.includes(Number(chat.id));
    if (isViewingArchivedChats) {
      if (!isArchived) return false;
    } else {
      if (isArchived) return false;
    }

    if (chat.is_community) return false; // Exclude communities from Chats tab
    if (chatFilter === "unread") return chat.unreadCount > 0;
    if (chatFilter === "groups") return chat.is_group;

    if (chatFilter && chatFilter.startsWith("list_")) {
      const listId = Number(chatFilter.substring(5));
      const list = userLists.find((l) => Number(l.id) === listId);
      if (list && Array.isArray(list.items)) {
        const partner = getRoomPartner(chat);
        const partnerId = partner ? Number(partner.id) : null;
        const roomId = Number(chat.id);
        const isContactOnlyId = chat.isContactOnly ? Number(chat.contactUser?.id) : null;

        return list.items.some(item =>
          Number(item) === roomId ||
          (partnerId && Number(item) === partnerId) ||
          (isContactOnlyId && Number(item) === isContactOnlyId)
        );
      }
      return false;
    }

    // Custom filter implementations
    if (chatFilter !== "all" && chatFilter) {
      const filterLower = chatFilter.toLowerCase();
      // "favorite" / "favorites" / "pinned" -> matches pinned chats
      if (filterLower === "favorite" || filterLower === "favorites" || filterLower === "pinned") {
        return chat.is_pinned;
      }
      // "personal" -> non-group chats
      if (filterLower === "personal") {
        return !chat.is_group;
      }
      // General name match for tags (e.g. Work, Family)
      const chatName = chat.is_group
        ? (chat.name || "")
        : (() => {
          const partner = getRoomPartner(chat);
          return partner ? `${partner.first_name || ""} ${partner.last_name || ""}` : "";
        })();
      return chatName.toLowerCase().includes(filterLower);
    }
    return true;
  }).filter((chat) => {
    if (!chatSearch.trim()) return true;
    const query = chatSearch.toLowerCase();
    if (chat.is_group) {
      return chat.name?.toLowerCase().includes(query);
    }
    const partner = getRoomPartner(chat);
    if (!partner) {
      const selfName = `${currentUser?.first_name || ""} ${currentUser?.last_name || ""} (You)`;
      return selfName.toLowerCase().includes(query);
    }
    const isSaved = (contacts || []).some(c => Number(c.id) === Number(partner.id));
    if (isSaved) {
      const name = `${partner.first_name || ""} ${partner.last_name || ""}`;
      return name.toLowerCase().includes(query);
    }
    return (
      partner.first_name?.toLowerCase().includes(query) ||
      partner.last_name?.toLowerCase().includes(query) ||
      partner.mobile?.toLowerCase().includes(query) ||
      partner.email?.toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    // Pinned chats always first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    // Sort by latest message time (most recent at top)
    const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
    return bTime - aTime;
  });



  const communityList = chatList.filter((chat) => chat.is_community);

  const handleSaveList = async (e) => {
    if (e) e.preventDefault();
    if (!newListName.trim()) {
      setListValidationError(t("error_list_name_required"));
      return;
    }
    setListValidationError("");
    try {
      if (listsSubView === "new-list") {
        const res = await createUserList(newListName.trim(), newListItems);
        if (res.success) {
          setSettingsTip(t("success_list_created"));
          await loadUserLists();
          setListsSubView("chats");
        }
      } else if (listsSubView === "edit-list" && selectedListForEdit) {
        const res = await updateUserList(selectedListForEdit.id, newListName.trim(), newListItems);
        if (res.success) {
          setSettingsTip(t("success_list_updated"));
          await loadUserLists();
          setListsSubView("chats");
        }
      }
      setTimeout(() => setSettingsTip(""), 3000);
    } catch (err) {
      console.error(err);
      setListValidationError(t("error_list_save_failed"));
    }
  };

  const handleDeleteList = async (listId) => {
    setConfirmModal({
      isOpen: true,
      title: t("delete_list_title"),
      description: t("delete_list_desc"),
      icon: "trash",
      onConfirm: async () => {
        try {
          const res = await deleteUserList(listId);
          if (res.success) {
            setSettingsTip(t("success_list_deleted"));
            if (chatFilter === `list_${listId}`) {
              setChatFilter("all");
            }
            await loadUserLists();
            setListsSubView("chats");
          }
          setTimeout(() => setSettingsTip(""), 3000);
        } catch (err) {
          console.error(err);
          setSettingsTip(t("error_list_delete_failed"));
          setTimeout(() => setSettingsTip(""), 3000);
        }
      }
    });
  };

  // Helper to extract unique selectable users from both contacts and active chats partners
  const getSelectableUsers = () => {
    const userMap = new Map();

    // 1. Add all contacts
    contacts.forEach((c) => {
      if (c && c.id && Number(c.id) !== Number(currentUser?.id)) {
        userMap.set(Number(c.id), c);
      }
    });

    // 2. Add all partners from active 1-1 chats
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

  const toggleSelectChat = (chatId) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

  const handleDeleteSelectedChats = async () => {
    if (selectedChatIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      icon: "trash",
      title: t("delete_chats_title"),
      description: t("delete_chats_desc").replace("{count}", selectedChatIds.length),
      onConfirm: async () => {
        try {
          const res = await deleteMultipleChats(selectedChatIds);
          if (res.success) {
            setIsDeleteMode(false);
            setSelectedChatIds([]);
            if (refreshChatList) await refreshChatList();
          }
        } catch (err) {
          console.error("Failed to delete chats:", err);
        }
      }
    });
  };


  const handleTogglePinChat = async (roomId, currentPinned) => {
    try {
      const res = await pinChatRoom(roomId, !currentPinned);
      if (res.success) {
        if (refreshChatList) await refreshChatList();
      }
    } catch (err) {
      console.error("Failed to pin/unpin chat:", err);
    }
  };

  const [activeChatMenuId, setActiveChatMenuId] = useState(null);
  const isEffectiveLightTheme =
    theme === "light" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-color-scheme: dark)").matches);

  const handleAddContactSubmit = async (e) => {
    e.preventDefault();
    setAddContactError("");
    setAddContactSuccess("");

    const errors = {
      firstName: !newContactFirstName.trim(),
      lastName: !newContactLastName.trim(),
      phone: !editingContactId && !newContactPhone.trim(),
    };

    setAddContactErrors(errors);

    if (errors.firstName || errors.lastName || errors.phone) {
      return;
    }

    setAddContactLoading(true);
    try {
      if (editingContactId) {
        // Edit mode
        const res = await editContact(editingContactId, newContactFirstName.trim(), newContactLastName.trim());
        if (res.success) {
          setAddContactSuccess(t("success_contact_updated"));
          setNewContactFirstName("");
          setNewContactLastName("");
          setNewContactPhone("");
          setNewContactEmail("");
          setEditingContactId(null);
          if (refreshContacts) {
            await refreshContacts();
          }
          if (refreshChatList) {
            await refreshChatList();
          }
          setTimeout(() => {
            setContactsView("list");
            setAddContactSuccess("");
          }, 1500);
        } else {
          setAddContactError(res.message || t("error_contact_update_failed"));
        }
      } else {
        // Add mode
        const identifier = newContactPhone.trim() || newContactEmail.trim() || contactEmailOrMobile.trim();
        const res = await saveContact(identifier, newContactFirstName.trim(), newContactLastName.trim());
        if (res.success) {
          setAddContactSuccess(res.message || t("success_contact_saved"));
          setNewContactFirstName("");
          setNewContactLastName("");
          setNewContactPhone("");
          setNewContactEmail("");
          setContactEmailOrMobile("");
          setAddContactErrors({ firstName: false, lastName: false, phone: false });
          if (refreshContacts) {
            await refreshContacts();
          }
          if (refreshChatList) {
            await refreshChatList();
          }
          setContactsView("list");
          setTimeout(() => {
            setAddContactSuccess("");
          }, 1500);
        } else {
          setAddContactError(res.message || t("error_contact_add_failed"));
        }
      }
    } catch (err) {
      setAddContactError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        t("error_user_not_found")
      );
    } finally {
      setAddContactLoading(false);
    }
  };

  const totalUnreadChatsCount = (chatList || []).reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);

  const isRootView = (activeTab === "chats" && listsSubView === "chats") ||
    (activeTab === "status" && statusesSubView === "list") ||
    (activeTab === "community" && !isCommunityModalOpen) ||
    (activeTab === "settings" && settingsView === "menu") ||
    (activeTab === "contacts" && contactsView === "list") ||
    (activeTab === "notifications");

  return (
    <>
      <div
        className={`chat-sidebar-root flex flex-col-reverse lg:flex-row h-full min-h-0 shrink-0 ${mobileActiveView === "sidebar" ? "flex w-full flex-1 min-w-0 lg:w-auto lg:flex-none" : "hidden lg:flex lg:w-auto lg:flex-none"}`}
      >
        {/* 1. Leftmost WhatsApp-Style Sidebar (thin icon drawer) - Hidden on mobile, vertical drawer on desktop */}
        <aside className="hidden lg:flex sidebar-container h-full w-14 sm:w-16 bg-[#161421] border-r border-white/5 flex-col justify-between items-center py-4 sm:py-5 z-20 shrink-0">
          <div className="flex flex-col items-center gap-1 w-full">
            <button
              onClick={() => {
                setActiveTab("chats");
                window.history.pushState(null, "", "/chat");
              }}
              title={t("chats")}
              className={`w-full flex items-center justify-center py-3 relative transition-all group ${activeTab === "chats" ? "text-[#9f85ff]" : "text-white/40 hover:text-white/80"}`}
            >
              {activeTab === "chats" && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7c5dfa] rounded-r-full" />}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${activeTab === "chats" ? "bg-[#7c5dfa]/20" : "group-hover:bg-white/5"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {totalUnreadChatsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-[#7c5dfa] text-white text-[8px] font-black shadow-[0_0_8px_rgba(124,93,250,0.6)] select-none">
                    {totalUnreadChatsCount}
                  </span>
                )}
              </div>
            </button>

            {/* Contacts */}
            <button
              onClick={() => {
                setActiveTab("contacts");
                setContactsView("list");
                window.history.pushState(null, "", "/contacts");
              }}
              title={t("contacts")}
              className={`w-full flex items-center justify-center py-3 relative transition-all group ${activeTab === "contacts" ? "text-[#9f85ff]" : "text-white/40 hover:text-white/80"}`}
            >
              {activeTab === "contacts" && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7c5dfa] rounded-r-full" />}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === "contacts" ? "bg-[#7c5dfa]/20" : "group-hover:bg-white/5"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </button>

            {/* Status Updates - circle with dot inside */}
            <button
              onClick={() => {
                setActiveTab("status");
                window.history.pushState(null, "", "/status");
              }}
              title={t("status_my_status")}
              className={`w-full flex items-center justify-center py-3 relative transition-all group ${activeTab === "status" ? "text-[#9f85ff]" : "text-white/40 hover:text-white/80"}`}
            >
              {activeTab === "status" && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7c5dfa] rounded-r-full" />}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${activeTab === "status" ? "bg-[#7c5dfa]/20" : "group-hover:bg-white/5"}`}>
                <img
                  src={updatesIcon.src}
                  alt="Status"
                  className="w-6 h-6 object-contain transition-all"
                  style={{
                    filter: isEffectiveLightTheme
                      ? activeTab === "status"
                        ? "invert(41%) sepia(87%) saturate(2924%) hue-rotate(238deg) brightness(98%) contrast(103%)"
                        : "invert(44%) sepia(13%) saturate(612%) hue-rotate(164deg) brightness(95%) contrast(89%)"
                      : activeTab === "status"
                        ? "invert(48%) sepia(79%) saturate(2379%) hue-rotate(235deg) brightness(101%) contrast(101%)"
                        : "invert(100%) opacity(0.4)"
                  }}
                />

                {statusesData.contactUpdates.some(g => g.statuses.some(s => !s.viewed && !viewedStatusesLocal.includes(s.id))) && (
                  <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-3 h-3">
                    <span className="absolute w-3 h-3 rounded-full bg-[#7c5dfa]/30 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-[#7c5dfa] shadow-[0_0_8px_rgba(124,93,250,0.8)]"></span>
                  </span>
                )}
              </div>
            </button>

            {/* Communities - nested groups SVG */}
            <button
              onClick={() => {
                setActiveTab("community");
                window.history.pushState(null, "", "/community");
              }}
              title={t("communities")}
              className={`w-full flex items-center justify-center py-3 relative transition-all group ${activeTab === "community" ? "text-[#9f85ff]" : "text-white/40 hover:text-white/80"}`}
            >
              {activeTab === "community" && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7c5dfa] rounded-r-full" />}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${activeTab === "community" ? "bg-[#7c5dfa]/20" : "group-hover:bg-white/5"}`}>
                <MdGroups size={24} />
                {communityList.some(c => (c.unreadCount || 0) > 0) && (
                  <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-3 h-3">
                    <span className="absolute w-3 h-3 rounded-full bg-[#7c5dfa]/30 animate-ping"></span>
                    <span className="w-2 h-2 rounded-full bg-[#7c5dfa] shadow-[0_0_8px_rgba(124,93,250,0.8)]"></span>
                  </span>
                )}
              </div>
            </button>
            {/* Notifications Bell */}
            {highPriorityNotif && (
              <button
                onClick={() => setActiveTab("notifications")}
                title={t("notifications")}
                className={`w-full flex items-center justify-center py-3 relative transition-all group ${activeTab === "notifications" ? "text-[#9f85ff]" : "text-white/40 hover:text-white/80"}`}
              >
                {activeTab === "notifications" && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7c5dfa] rounded-r-full" />}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${activeTab === "notifications" ? "bg-[#7c5dfa]/20" : "group-hover:bg-white/5"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {notifications.some(n => !n.is_read && !n.read && !n.is_seen && !n.seen) && (
                    <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-3 h-3">
                      <span className="absolute w-3 h-3 rounded-full bg-[#7c5dfa]/30 animate-ping"></span>
                      <span className="w-2 h-2 rounded-full bg-[#7c5dfa] shadow-[0_0_8px_rgba(124,93,250,0.8)]"></span>
                    </span>
                  )}
                </div>
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 w-full">
            {/* Settings */}
            <button
              onClick={() => {
                setActiveTab("settings");
                setSettingsView("menu");
                window.history.pushState(null, "", "/settings");
              }}
              title={t("settings")}
              className={`w-full flex items-center justify-center py-3 relative transition-all group ${activeTab === "settings" ? "text-[#9f85ff]" : "text-white/40 hover:text-white/80"}`}
            >
              {activeTab === "settings" && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#7c5dfa] rounded-r-full" />}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === "settings" ? "bg-[#7c5dfa]/20" : "group-hover:bg-white/5"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
            </button>

            {/* Profile image button */}
            <button
              onClick={() => {
                setActiveTab("settings");
                setSettingsView("profile");
                window.history.pushState(null, "", "/profile");
              }}
              className="w-10 h-10 rounded-full bg-[#27233a] flex items-center justify-center font-bold text-xs relative select-none cursor-pointer focus:outline-none border border-white/10 my-2"
            >
              {currentUser?.profile_image ? (
                <img
                  src={currentUser.profile_image}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                initials
              )}
            </button>
          </div>
        </aside>

        {/* 2. Mobile Bottom Navigation Bar - Visible only on mobile/tablet (under 1024px) when on root views */}
        {isRootView && (
          <div className="block lg:hidden w-full h-[68px] bg-[#161421] border-t border-white/5 shrink-0 select-none z-20">
            <div className="flex items-center justify-around h-full px-2">

              {/* Chats Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("chats");
                  window.history.pushState(null, "", "/chat");
                }}
                className="flex flex-col items-center justify-center gap-1 w-16 h-full relative cursor-pointer focus:outline-none bg-transparent"
              >
                <div className={`px-5 py-1 rounded-full transition-all flex items-center justify-center relative ${activeTab === "chats" ? "bg-[#7c5dfa]/20 text-[#9f85ff]" : "text-white/40"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {totalUnreadChatsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-[#7c5dfa] text-white text-[8px] font-black shadow-[0_0_8px_rgba(124,93,250,0.6)] select-none">
                      {totalUnreadChatsCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide transition-all ${activeTab === "chats" ? "text-white font-bold" : "text-white/40"}`}>
                  {t("chats_tab_label", "Chats")}
                </span>
              </button>

              {/* Status Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("status");
                  window.history.pushState(null, "", "/status");
                }}
                className="flex flex-col items-center justify-center gap-1 w-16 h-full relative cursor-pointer focus:outline-none bg-transparent"
              >
                <div className={`px-5 py-1 rounded-full transition-all flex items-center justify-center relative ${activeTab === "status" ? "bg-[#7c5dfa]/20" : "text-white/40"}`}>
                  <img
                    src={updatesIcon.src}
                    alt="Status"
                    className="w-5 h-5 object-contain"
                    style={{
                      filter: isEffectiveLightTheme
                        ? activeTab === "status"
                          ? "invert(41%) sepia(87%) saturate(2924%) hue-rotate(238deg) brightness(98%) contrast(103%)"
                          : "invert(44%) sepia(13%) saturate(612%) hue-rotate(164deg) brightness(95%) contrast(89%)"
                        : activeTab === "status"
                          ? "invert(48%) sepia(79%) saturate(2379%) hue-rotate(235deg) brightness(101%) contrast(101%)"
                          : "invert(100%) opacity(0.4)"
                    }}
                  />
                  {statusesData.contactUpdates.some(g => g.statuses.some(s => !s.viewed && !viewedStatusesLocal.includes(s.id))) && (
                    <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-[#7c5dfa] shadow-[0_0_8px_rgba(124,93,250,0.8)]"></span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide transition-all ${activeTab === "status" ? "text-white font-bold" : "text-white/40"}`}>
                  {t("status_tab_label", "Updates")}
                </span>
              </button>

              {/* Communities Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("community");
                  window.history.pushState(null, "", "/community");
                }}
                className="flex flex-col items-center justify-center gap-1 w-16 h-full relative cursor-pointer focus:outline-none bg-transparent"
              >
                <div className={`px-5 py-1 rounded-full transition-all flex items-center justify-center relative ${activeTab === "community" ? "bg-[#7c5dfa]/20 text-[#9f85ff]" : "text-white/40"}`}>
                  <MdGroups size={22} />
                  {communityList.some(c => (c.unreadCount || 0) > 0) && (
                    <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-[#7c5dfa] shadow-[0_0_8px_rgba(124,93,250,0.8)]"></span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide transition-all ${activeTab === "community" ? "text-white font-bold" : "text-white/40"}`}>
                  {t("communities_tab_label", "Communities")}
                </span>
              </button>

              {/* Settings Tab (Replacing Calls) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("settings");
                  setSettingsView("menu");
                  window.history.pushState(null, "", "/settings");
                }}
                className="flex flex-col items-center justify-center gap-1 w-16 h-full relative cursor-pointer focus:outline-none bg-transparent"
              >
                <div className={`px-5 py-1 rounded-full transition-all flex items-center justify-center relative ${activeTab === "settings" ? "bg-[#7c5dfa]/20 text-[#9f85ff]" : "text-white/40"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <span className={`text-[10px] font-semibold tracking-wide transition-all ${activeTab === "settings" ? "text-white font-bold" : "text-white/40"}`}>
                  {t("settings_tab_label", "Settings")}
                </span>
              </button>

            </div>
          </div>
        )}

        <section className={`sidebar-container h-full flex-1 min-w-0 lg:flex-none lg:w-80 xl:w-[380px] bg-[#161421]/95 border-r border-white/5 flex-col z-10 shrink-0 relative overflow-hidden ${mobileActiveView === "sidebar" ? "flex" : "hidden lg:flex"}`}>

          {/* Mobile Top Header & Actions View */}
          {isRootView ? (
            <div className="block lg:hidden w-full shrink-0 select-none sticky top-0 z-10 bg-transparent border-none">
              {/* Top Branding Bar */}
              <div className="h-14 px-4 flex justify-between items-center">
                {activeTab === "status" && isStatusSearching ? (
                  <div className="flex items-center gap-2 w-full bg-[#1c1a29]/60 dark:bg-[#1c1a29]/60 light:bg-slate-100 border border-[#7c5dfa]/20 focus-within:border-[#7c5dfa]/60 rounded-full px-4 py-2 shadow-inner">
                    <Search className="w-4 h-4 text-white/30 light:text-black/30 shrink-0" />
                    <input
                      type="text"
                      value={statusSearch}
                      onChange={(e) => setStatusSearch(e.target.value)}
                      placeholder={t("search_statuses", "Search updates...")}
                      className="bg-transparent outline-none w-full text-xs text-white light:text-black placeholder-white/30 light:placeholder:text-black/30"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="text-white/40 hover:text-white light:text-black/40 light:hover:text-black shrink-0 cursor-pointer"
                      onClick={() => {
                        setIsStatusSearching(false);
                        setStatusSearch("");
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-white tracking-wide truncate flex items-center gap-2 w-full">
                      {(activeTab === "settings" || activeTab === "contacts" || activeTab === "notifications") && (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeTab === "settings" && settingsView !== "menu") {
                              if (settingsView === "blocked-users" || settingsView.startsWith("privacy-") || settingsView === "disappearing-messages") {
                                setSettingsView("privacy");
                              } else if (settingsView === "security" || settingsView === "two-step" || settingsView === "delete-account-info") {
                                setSettingsView("account");
                              } else if (settingsView === "wallpaper-solid-colors") {
                                setSettingsView("wallpaper");
                              } else if (settingsView === "chat-color") {
                                setSettingsView("chat-theme");
                              } else if (settingsView === "wallpaper" || settingsView === "chat-theme") {
                                setSettingsView("menu");
                              } else if (settingsView === "faq" || settingsView === "contact-us" || settingsView === "app-info" || settingsView === "features-guide" || settingsView === "send-feedback") {
                                setSettingsView("help");
                              } else {
                                setSettingsView("menu");
                              }
                            } else if (activeTab === "contacts" && (contactsView === "add" || contactsView === "edit" || contactsView === "new-group")) {
                              setContactsView("list");
                            } else {
                              setActiveTab("chats");
                              window.history.pushState(null, "", "/chat");
                            }
                          }}
                          className="p-1 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5 rounded-full transition-all cursor-pointer mr-1 shrink-0 bg-transparent border-none text-white"
                          title="Back"
                        >
                          <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                      )}
                      {activeTab === "settings" && settingsView === "menu" && isSettingsSearching ? (
                        <div className="flex-1 max-w-[220px]">
                          <div className="flex items-center gap-2 w-full bg-[#1c1a29]/60 dark:bg-[#1c1a29]/60 light:bg-slate-100 border border-[#7c5dfa]/20 focus-within:border-[#7c5dfa]/60 rounded-full px-3 py-1.5 shadow-inner">
                            <Search className="w-3.5 h-3.5 text-white/30 light:text-black/30 shrink-0" />
                            <input
                              type="text"
                              value={settingsSearchQuery}
                              onChange={(e) => setSettingsSearchQuery(e.target.value)}
                              placeholder={t("search_settings_placeholder", "Search settings...")}
                              className="bg-transparent outline-none w-full text-xs text-white light:text-black placeholder-white/30 light:placeholder:text-black/30"
                              autoFocus
                            />
                            <button
                              type="button"
                              className="text-white/40 hover:text-white light:text-black/40 light:hover:text-black shrink-0 cursor-pointer bg-transparent border-none"
                              onClick={() => {
                                setIsSettingsSearching(false);
                                setSettingsSearchQuery("");
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span>
                          {activeTab === "chats"
                            ? t("app_name", "MYCHATBOX")
                            : activeTab === "status"
                              ? t("status_tab_label", "Updates")
                              : activeTab === "community"
                                ? t("communities_tab_label", "Communities")
                                : activeTab === "contacts"
                                  ? t("contacts", "Contacts")
                                  : activeTab === "notifications"
                                    ? t("notifications", "Notifications")
                                    : activeTab === "settings"
                                      ? t("settings_tab_label", "Settings")
                                      : t("app_name", "MYCHATBOX")
                          }
                        </span>
                      )}
                    </h1>
                    <div className="flex items-center gap-2 text-white/60">
                      {activeTab === "status" ? (
                        <>
                          {/* Search button for Status updates */}
                          <button
                            type="button"
                            className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer"
                            onClick={() => setIsStatusSearching(true)}
                            title="Search Updates"
                          >
                            <Search className="w-5 h-5" />
                          </button>
                        </>
                      ) : activeTab === "community" ? (
                        null
                      ) : activeTab === "settings" ? (
                        settingsView === "menu" && !isSettingsSearching ? (
                          <>
                            {/* Search settings */}
                            <button
                              type="button"
                              className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer bg-transparent border-none text-white/60"
                              onClick={() => setIsSettingsSearching(true)}
                              title="Search Settings"
                            >
                              <Search className="w-5 h-5 text-white" />
                            </button>
                            {/* Notifications Bell */}
                            <button
                              type="button"
                              className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer relative bg-transparent border-none text-white/60"
                              onClick={() => {
                                setActiveTab("notifications");
                                window.history.pushState(null, "", "/notifications");
                              }}
                              title="Notifications"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              </svg>
                              {notifications.some(n => !n.is_read && !n.read && !n.is_seen && !n.seen) && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7c5dfa] shadow-[0_0_8px_rgba(124,93,250,0.8)] animate-pulse block"></span>
                              )}
                            </button>
                          </>
                        ) : null
                      ) : activeTab === "notifications" ? (
                        null
                      ) : (
                        <>
                          {/* All Contacts Button */}
                          <button
                            type="button"
                            className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer"
                            onClick={() => {
                              setActiveTab("contacts");
                              setContactsView("list");
                              window.history.pushState(null, "", "/contacts");
                            }}
                            title="Contacts"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </button>

                          {/* Notifications Bell */}
                          <button
                            type="button"
                            className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer relative"
                            onClick={() => setActiveTab("notifications")}
                            title="Notifications"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {notifications.some(n => !n.is_read && !n.read && !n.is_seen && !n.seen) && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7c5dfa] shadow-[0_0_8px_rgba(124,93,250,0.8)] animate-pulse block"></span>
                            )}
                          </button>
                        </>
                      )}

                      {/* 3-dot Menu (Not shown for Settings & Notifications Page) */}
                      {activeTab !== "settings" && activeTab !== "notifications" && (
                        <div className="relative" ref={threeDotMenuRef}>
                          <button
                            type="button"
                            className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer"
                            onClick={() => setIsThreeDotMenuOpen(!isThreeDotMenuOpen)}
                            title="More options"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {isThreeDotMenuOpen && (
                            <div className="absolute right-0 top-11 w-48 bg-[#1f1d2c] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in text-xs text-white">
                              {activeTab === "status" ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setIsThreeDotMenuOpen(false);
                                      window.history.pushState(null, "", "/settings");
                                      setActiveTab("settings");
                                      setSettingsView("menu");
                                      if (setMobileActiveView) setMobileActiveView("sidebar");
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                                  >
                                    {t("settings", "Settings")}
                                  </button>
                                </>
                              ) : activeTab === "community" ? (
                                <button
                                  onClick={() => {
                                    setIsThreeDotMenuOpen(false);
                                    window.history.pushState(null, "", "/settings");
                                    setActiveTab("settings");
                                    setSettingsView("menu");
                                    if (setMobileActiveView) setMobileActiveView("sidebar");
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                                >
                                  {t("settings", "Settings")}
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setIsThreeDotMenuOpen(false);
                                      if (setGroupName) setGroupName("");
                                      if (setSelectedGroupMembers) setSelectedGroupMembers([]);
                                      if (setContactsView) setContactsView("new-group");
                                      setActiveTab("contacts");
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                                  >
                                    {t("contacts_new_group", "New Group")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsThreeDotMenuOpen(false);
                                      setActiveTab("community");
                                      setIsCommunityModalOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                                  >
                                    {t("contacts_new_community", "New Community")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsThreeDotMenuOpen(false);
                                      window.history.pushState(null, "", "/settings");
                                      setActiveTab("settings");
                                      setSettingsView("menu");
                                      if (setMobileActiveView) setMobileActiveView("sidebar");
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer"
                                  >
                                    {t("settings", "Settings")}
                                  </button>
                                  {activeTab !== "contacts" && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setIsThreeDotMenuOpen(false);
                                          setActiveTab("chats");
                                          setIsDeleteMode(true);
                                          setSelectedChatIds([]);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer flex items-center gap-2"
                                      >
                                        <CheckSquare className="w-3.5 h-3.5" />
                                        <span>{t("select_chats", "Select chats")}</span>
                                      </button>
                                      <div className="h-px bg-white/5 my-1.5"></div>
                                      <button
                                        onClick={() => {
                                          setIsThreeDotMenuOpen(false);
                                          setActiveTab("chats");
                                          setIsDeleteMode(true);
                                          setSelectedChatIds([]);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-red-950/20 text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer flex items-center gap-2"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        <span>{t("delete_chats", "Delete Chats")}</span>
                                      </button>
                                      <div className="h-px bg-white/5 my-1.5"></div>
                                    </>
                                  )}
                                  <button
                                    onClick={() => {
                                      setIsThreeDotMenuOpen(false);
                                      setIsLogoutConfirmOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-red-950/20 text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer flex items-center gap-2"
                                  >
                                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                                    <span>{t("logout")}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (activeTab === "status" && statusesSubView === "my-details") ? null : (
            /* Mobile Sub-View Header with Back Button - shown when NOT on root view */
            <div className="block lg:hidden w-full shrink-0 select-none sticky top-0 z-10 bg-transparent border-none">
              <div className="h-12 px-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "chats" && (listsSubView === "new-list" || listsSubView === "edit-list")) {
                      setListValidationError("");
                      setListsSubView("chats");
                    } else if (activeTab === "contacts" && (contactsView === "add" || contactsView === "edit" || contactsView === "new-group")) {
                      setContactsView("list");
                      setContactEmailOrMobile("");
                      setAddContactError("");
                      setAddContactSuccess("");
                      setEditingContactId(null);
                      setNewContactFirstName("");
                      setNewContactLastName("");
                      setNewContactPhone("");
                      setNewContactEmail("");
                    } else if (activeTab === "settings") {
                      if (settingsView === "blocked-users" || settingsView.startsWith("privacy-") || settingsView === "disappearing-messages") {
                        setSettingsView("privacy");
                      } else if (settingsView === "security" || settingsView === "two-step" || settingsView === "delete-account-info") {
                        setSettingsView("account");
                      } else if (settingsView === "wallpaper-solid-colors") {
                        setSettingsView("wallpaper");
                      } else if (settingsView === "chat-color") {
                        setSettingsView("chat-theme");
                      } else if (settingsView === "wallpaper" || settingsView === "chat-theme") {
                        setSettingsView("menu");
                      } else if (settingsView === "faq" || settingsView === "contact-us" || settingsView === "app-info" || settingsView === "features-guide" || settingsView === "send-feedback") {
                        setSettingsView("help");
                      } else {
                        setSettingsView("menu");
                        window.history.pushState(null, "", "/settings");
                        setEditingField(null);
                        setProfileSuccessMsg("");
                        setProfileErrorMsg("");
                      }
                    } else if (activeTab === "status" && statusesSubView === "my-details") {
                      setStatusesSubView("list");
                    } else if (activeTab === "community" && isCommunityModalOpen) {
                      setCommunityName("");
                      setSelectedCommunityMembers([]);
                      setCommunityError("");
                      setCommunitySuccess("");
                      setIsCommunityModalOpen(false);
                    } else {
                      // Go back to chats (default fallback)
                      setStatusesSubView("list");
                      setContactsView("list");
                      setContactEmailOrMobile("");
                      setAddContactError("");
                      setAddContactSuccess("");
                      setEditingContactId(null);
                      setNewContactFirstName("");
                      setNewContactLastName("");
                      setNewContactPhone("");
                      setNewContactEmail("");
                      setActiveTab("chats");
                      window.history.pushState(null, "", "/chat");
                    }
                  }}
                  className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-all cursor-pointer shrink-0"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-white tracking-wide truncate flex-1 pl-2">
                  {activeTab === "chats"
                    ? (listsSubView === "new-list" ? t("new_list") : (listsSubView === "edit-list" ? t("edit_list") : t("chats")))
                    : activeTab === "community"
                      ? (isCommunityModalOpen ? t("community_new") : t("community_title"))
                      : activeTab === "notifications"
                        ? t("notifications")
                        : activeTab === "settings"
                          ? (settingsView === "menu" ? t("settings")
                            : settingsView === "profile" ? t("profile")
                              : settingsView === "account" ? t("account")
                                : settingsView === "privacy" ? t("privacy")
                                  : settingsView === "blocked-users" ? t("blockedContacts")
                                    : settingsView === "notifications" ? t("notifications")
                                      : settingsView === "help" ? t("help_and_feedback", "Help & Feedback")
                                        : settingsView === "language" ? t("language")
                                          : t(settingsView))
                          : activeTab === "contacts"
                            ? (contactsView === "add" ? (editingContactId ? t("edit_contact_modal_title") : t("contacts_add_title")) : contactsView === "new-group" ? t("blank_new_group") : t("contacts"))
                            : t(activeTab)
                  }
                </h2>
              </div>
            </div>
          )}

          {/* Header Branding - Desktop only */}
          <div className="h-14 hidden lg:flex justify-between items-center bg-[#161421]/50 relative shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {((activeTab === "settings" && settingsView !== "menu") ||
                (activeTab === "contacts" && contactsView !== "list") ||
                (activeTab === "community" && isCommunityModalOpen) ||
                (activeTab === "chats" && (listsSubView === "new-list" || listsSubView === "edit-list"))) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "chats" && (listsSubView === "new-list" || listsSubView === "edit-list")) {
                        setListValidationError("");
                        setListsSubView("chats");
                      } else if (activeTab === "settings" && settingsView !== "menu") {
                        if (settingsView === "blocked-users" || settingsView.startsWith("privacy-") || settingsView === "disappearing-messages") {
                          setSettingsView("privacy");
                        } else if (settingsView === "security" || settingsView === "two-step" || settingsView === "delete-account-info") {
                          setSettingsView("account");
                        } else if (settingsView === "wallpaper-solid-colors") {
                          setSettingsView("wallpaper");
                        } else if (settingsView === "chat-color") {
                          setSettingsView("chat-theme");
                        } else if (settingsView === "wallpaper" || settingsView === "chat-theme") {
                          setSettingsView("menu");
                        } else if (settingsView === "faq" || settingsView === "contact-us" || settingsView === "app-info" || settingsView === "features-guide" || settingsView === "send-feedback") {
                          setSettingsView("help");
                        } else {
                          setSettingsView("menu");
                          window.history.pushState(null, "", "/settings");
                          setEditingField(null);
                          setProfileSuccessMsg("");
                          setProfileErrorMsg("");
                        }
                      } else if (activeTab === "contacts" && (contactsView === "add" || contactsView === "edit" || contactsView === "new-group")) {
                        setContactsView("list");
                      } else if (activeTab === "community" && isCommunityModalOpen) {
                        setCommunityName("");
                        setSelectedCommunityMembers([]);
                        setCommunityError("");
                        setCommunitySuccess("");
                        setIsCommunityModalOpen(false);
                      } else {
                        setActiveTab("chats");
                        window.history.pushState(null, "", "/chat");
                      }
                    }}
                    className="p-1 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5 rounded-full text-white/60 hover:text-white transition-all cursor-pointer mr-1 shrink-0 bg-transparent border-none flex items-center justify-center"
                    title="Go back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
              {activeTab === "settings" && settingsView === "menu" && isSettingsSearching ? (
                <div className="w-full max-w-[280px]">
                  <div className="flex items-center gap-2 w-full bg-[#1c1a29]/60 dark:bg-[#1c1a29]/60 light:bg-slate-100 border border-[#7c5dfa]/20 focus-within:border-[#7c5dfa]/60 rounded-full px-3.5 py-1.5 shadow-inner">
                    <Search className="w-3.5 h-3.5 text-white/30 light:text-black/30 shrink-0" />
                    <input
                      type="text"
                      value={settingsSearchQuery}
                      onChange={(e) => setSettingsSearchQuery(e.target.value)}
                      placeholder={t("search_settings_placeholder", "Search settings...")}
                      className="bg-transparent outline-none w-full text-xs text-white light:text-black placeholder-white/30 light:placeholder:text-black/30"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="text-white/40 hover:text-white light:text-black/40 light:hover:text-black shrink-0 cursor-pointer bg-transparent border-none"
                      onClick={() => {
                        setIsSettingsSearching(false);
                        setSettingsSearchQuery("");
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <h2 className="text-xl font-bold text-white tracking-wide truncate pl-2">
                  {activeTab === "chats"
                    ? (listsSubView === "new-list" ? t("new_list") : (listsSubView === "edit-list" ? t("edit_list") : t("app_name", "MYCHATBOX")))
                    : activeTab === "community"
                      ? (isCommunityModalOpen ? t("community_new") : t("communities_tab_label", "Communities"))
                      : activeTab === "notifications"
                        ? t("notifications")
                        : activeTab === "settings"
                          ? (settingsView === "menu" ? t("settings")
                            : settingsView === "profile" ? t("profile")
                              : settingsView === "account" ? t("account")
                                : settingsView === "delete-account-info" ? t("how_to_delete_account", "How to delete my account")
                                  : settingsView === "security" ? t("security_notifications", "Security notifications")
                                    : settingsView === "two-step" ? t("two_step_verification")
                                      : settingsView === "chats" ? t("chats")
                                        : settingsView === "chat-theme" ? t("chatTheme", "Chat theme")
                                          : settingsView === "chat-color" ? t("chatColor", "Chat color")
                                            : settingsView === "wallpaper" ? t("wallpaper", "Wallpaper")
                                              : settingsView === "wallpaper-solid-colors" ? t("solidColors", "Solid colors")
                                                : settingsView === "privacy" ? t("privacy")
                                                  : settingsView === "privacy-last-seen" ? t("last_seen_and_online")
                                                    : settingsView === "privacy-profile-pic" ? t("profile_picture")
                                                      : settingsView === "privacy-about" ? t("about")
                                                        : settingsView === "privacy-status" ? t("status_privacy", "Status privacy")
                                                          : settingsView === "privacy-groups" ? t("groups")
                                                            : settingsView === "disappearing-messages" ? t("disappearing_messages")
                                                              : settingsView === "blocked-users" ? t("blockedContacts")
                                                                : settingsView === "notifications" ? t("notifications")
                                                                  : settingsView === "help" ? t("help_and_feedback", "Help and feedback")
                                                                    : settingsView === "send-feedback" ? t("send_feedback")
                                                                      : settingsView === "invite" ? t("inviteFriend")
                                                                        : settingsView === "updates" ? t("appUpdates")
                                                                          : settingsView === "language" ? t("language")
                                                                            : settingsView === "faq" ? t("helpCentreFaq")
                                                                              : settingsView === "contact-us" ? t("contactUs")
                                                                                : settingsView === "app-info" ? t("appInfo")
                                                                                  : settingsView === "features-guide" ? t("featuresGuide")
                                                                                    : activeTab === "status"
                                                                                      ? (statusesSubView === "my-details" ? "My status" : t("status_tab_label", "Updates"))
                                                                                      : t(activeTab))
                          : activeTab === "contacts"
                            ? (contactsView === "add" ? (editingContactId ? t("edit_contact_modal_title") : t("contacts_add_title")) : contactsView === "new-group" ? t("blank_new_group") : t("contacts"))
                            : t(activeTab)
                  }
                </h2>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-white/60">
              {activeTab === "status" ? (
                <>
                  {/* Search button for Status updates */}
                  <button
                    type="button"
                    className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer bg-transparent border-none"
                    onClick={() => setIsStatusSearching(true)}
                    title="Search Updates"
                  >
                    <Search className="w-5 h-5 text-white" />
                  </button>
                </>
              ) : activeTab === "community" ? (
                null
              ) : activeTab === "settings" ? (
                settingsView === "menu" && !isSettingsSearching ? (
                  <>
                    <button
                      type="button"
                      className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer bg-transparent border-none"
                      onClick={() => setIsSettingsSearching(true)}
                      title="Search Settings"
                    >
                      <Search className="w-5 h-5 text-white" />
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer relative bg-transparent border-none"
                      onClick={() => {
                        setActiveTab("notifications");
                        window.history.pushState(null, "", "/notifications");
                      }}
                      title="Notifications"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      {notifications.some(n => !n.is_read && !n.read && !n.is_seen && !n.seen) && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7c5dfa] shadow-[0_0_8px_rgba(124,93,250,0.8)] animate-pulse block"></span>
                      )}
                    </button>
                  </>
                ) : null
              ) : activeTab === "notifications" ? (
                null
              ) : (
                <>
                  {/* All Contacts Button */}
                  <button
                    type="button"
                    className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer bg-transparent border-none"
                    onClick={() => {
                      setActiveTab("contacts");
                      setContactsView("list");
                      window.history.pushState(null, "", "/contacts");
                    }}
                    title="Contacts"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </button>
                </>
              )}

              {/* 3-dot Menu (Not shown for Settings & Notifications Page) */}
              {activeTab !== "settings" && activeTab !== "notifications" && (
                <div className="relative flex items-center" ref={threeDotMenuRef}>
                  <button
                    type="button"
                    className="p-2 hover:text-[#7c5dfa] dark:hover:text-[#9f85ff] light:hover:text-[#7c5dfa] hover:bg-white/5 rounded-full transition-all cursor-pointer bg-transparent border-none"
                    onClick={() => setIsThreeDotMenuOpen(!isThreeDotMenuOpen)}
                    title="More options"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                  {isThreeDotMenuOpen && (
                    <div className="absolute right-0 top-11 w-48 bg-[#1f1d2c] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in text-xs text-white">
                      {activeTab === "status" ? (
                        <>
                          <button
                            onClick={() => {
                              setIsThreeDotMenuOpen(false);
                              window.history.pushState(null, "", "/settings");
                              setActiveTab("settings");
                              setSettingsView("menu");
                              if (setMobileActiveView) setMobileActiveView("sidebar");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer bg-transparent border-none"
                          >
                            {t("settings", "Settings")}
                          </button>
                        </>
                      ) : activeTab === "community" ? (
                        <button
                          onClick={() => {
                            setIsThreeDotMenuOpen(false);
                            window.history.pushState(null, "", "/settings");
                            setActiveTab("settings");
                            setSettingsView("menu");
                            if (setMobileActiveView) setMobileActiveView("sidebar");
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer bg-transparent border-none"
                        >
                          {t("settings", "Settings")}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setIsThreeDotMenuOpen(false);
                              if (setGroupName) setGroupName("");
                              if (setSelectedGroupMembers) setSelectedGroupMembers([]);
                              if (setContactsView) setContactsView("new-group");
                              setActiveTab("contacts");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer bg-transparent border-none"
                          >
                            {t("contacts_new_group", "New Group")}
                          </button>
                          <button
                            onClick={() => {
                              setIsThreeDotMenuOpen(false);
                              setActiveTab("community");
                              setIsCommunityModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer bg-transparent border-none"
                          >
                            {t("contacts_new_community", "New Community")}

                          </button>
                          <button
                            onClick={() => {
                              setIsThreeDotMenuOpen(false);
                              window.history.pushState(null, "", "/settings");
                              setActiveTab("settings");
                              setSettingsView("menu");
                              if (setMobileActiveView) setMobileActiveView("sidebar");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer bg-transparent border-none"
                          >
                            {t("settings", "Settings")}
                          </button>
                          {activeTab !== "contacts" && (
                            <>
                              <button
                                onClick={() => {
                                  setIsThreeDotMenuOpen(false);
                                  setActiveTab("chats");
                                  setIsDeleteMode(true);
                                  setSelectedChatIds([]);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors font-medium text-white/80 hover:text-white cursor-pointer flex items-center gap-2 bg-transparent border-none"
                              >
                                {/* <CheckSquare className="w-3.5 h-3.5" /> */}
                                <span>{t("select_chats", "Select chats")}</span>
                              </button>
                              <div className="h-px bg-white/5 my-1.5"></div>
                              <button
                                onClick={() => {
                                  setIsThreeDotMenuOpen(false);
                                  setActiveTab("chats");
                                  setIsDeleteMode(true);
                                  setSelectedChatIds([]);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-950/20 text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer flex items-center gap-2 bg-transparent border-none"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>{t("delete_chats", "Delete Chats")}</span>
                              </button>
                              <div className="h-px bg-white/5 my-1.5"></div>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setIsThreeDotMenuOpen(false);
                              setIsLogoutConfirmOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-red-950/20 text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer flex items-center gap-2 bg-transparent border-none"
                          >
                            <LogOut className="w-3.5 h-3.5 text-red-400" />
                            <span>{t("logout")}</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Search segment / Delete action bar */}
          {activeTab === "chats" && (
            isDeleteMode ? (
              <div className="px-5 py-3 border-b border-white/5 bg-[#7c5dfa]/10 border-t border-[#7c5dfa]/20 flex justify-between items-center animate-fade-in text-xs">
                <span className="font-bold text-[#b69eff]">{selectedChatIds.length} {t("selected_count", "selected")}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setIsDeleteMode(false);
                      setSelectedChatIds([]);
                    }}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium cursor-pointer"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={async () => {
                      if (isViewingLockedChats) {
                        for (const id of selectedChatIds) {
                          await handleUnlockChat(id);
                        }
                      } else {
                        if (selectedChatIds.length === 1) {
                          await handleLockChat(selectedChatIds[0]);
                        } else {
                          for (const id of selectedChatIds) {
                            await toggleLockChat(id, true);
                          }
                          if (refreshChatList) await refreshChatList();
                        }
                      }
                      setIsDeleteMode(false);
                      setSelectedChatIds([]);
                    }}
                    disabled={selectedChatIds.length === 0}
                    className="px-2.5 py-1.5 bg-[#7c5dfa] hover:bg-[#684ce2] disabled:opacity-40 rounded-lg text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isViewingLockedChats ? t("unlock_action", "Unlock") : t("lock_chats_action", "Lock")}</span>
                  </button>
                  <button
                    onClick={handleDeleteSelectedChats}
                    disabled={selectedChatIds.length === 0}
                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg text-white font-bold transition-colors cursor-pointer"
                  >
                    {t("blank_delete_chat", "Delete")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-4 border-b border-white/5 bg-[#161421]/30">
                {/* Search Input bar - always visible */}
                <div className="relative mb-3 mt-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 light:text-black/30 w-4 h-4" />
                  <input
                    type="text"
                    value={chatSearch}
                    onChange={(e) => handleChatSearchChange(e.target.value)}
                    placeholder={t("chat_sidebar_search", "Search...")}
                    className="w-full bg-[#1c1a29]/60 dark:bg-[#1c1a29]/60 light:bg-slate-100 border border-[#7c5dfa]/20 focus:border-[#7c5dfa]/60 hover:bg-[#1c1a29]/80 focus:bg-[#1c1a29]/95 rounded-[30px] pl-10 pr-10 py-2.5 text-xs focus:outline-none transition-all placeholder:text-white/30 light:placeholder:text-black/30 text-white light:text-black shadow-inner"
                  />
                  {chatSearch && (
                    <button
                      type="button"
                      onClick={() => handleChatSearchChange("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Chat Filters Pill Row */}
                {activeTab === "chats" && (
                  <div className="flex items-center mt-2 gap-2 ml-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
                    {customPills.map((pill) => {
                      const isActive = chatFilter === pill;
                      const isSystem = ["all", "unread", "groups"].includes(pill);

                      return (
                        <button
                          key={pill}
                          onClick={() => setChatFilter(pill)}
                          className={`shrink-0 px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${isActive
                            ? "bg-[#7c5dfa]/20 border border-[#7c5dfa]/50 text-[#b69eff]"
                            : "bg-white/[0.02] border border-white/5 text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                            }`}
                        >
                          <span>
                            {pill === "all"
                              ? t("filter_all", "All")
                              : pill === "unread"
                                ? t("filter_unread", "Unread")
                                : pill === "groups"
                                  ? t("filter_groups", "Groups")
                                  : pill.charAt(0).toUpperCase() + pill.slice(1)}
                          </span>

                          {!isSystem && (
                            <span
                              onClick={(e) => handleRemoveCustomFilter(e, pill)}
                              className="ml-1 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[8px] text-white/40 hover:text-red-400 transition-colors"
                            >
                              ×
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Render Custom DB Lists */}
                    {userLists.map((list) => {
                      const isActive = chatFilter === `list_${list.id}`;
                      return (
                        <div
                          key={list.id}
                          onClick={() => setChatFilter(`list_${list.id}`)}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${isActive
                            ? "bg-[#7c5dfa]/20 border border-[#7c5dfa]/50 text-[#b69eff]"
                            : "bg-white/[0.02] border border-white/5 text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                            }`}
                        >
                          <span>{list.name}</span>
                          <span
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await deleteUserList(list.id);
                                if (res && res.success) {
                                  setUserLists(prev => prev.filter(l => l.id !== list.id));
                                  if (chatFilter === `list_${list.id}`) setChatFilter("all");
                                }
                              } catch (err) {
                                console.error("Failed to delete list:", err);
                              }
                            }}
                            className="ml-0.5 w-3 h-3 flex items-center justify-center rounded-full text-[10px] font-bold leading-none hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete List"
                          >
                            ×
                          </span>
                        </div>
                      );
                    })}

                    {/* Add Pill Button */}
                    <button
                      onClick={() => {
                        setNewListName("");
                        setNewListItems([]);
                        setListsSubView("new-list");
                      }}
                      className="shrink-0 w-6 h-6 rounded-lg bg-white/[0.02] border border-white/5 text-white/40 hover:text-white/80 hover:bg-white/[0.04] flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                      title="Add Custom List"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/[0.02]">

            {/* TAB 1: CONVERSATIONS (CHATS) */}
            {activeTab === "chats" && (
              <>
                {listsSubView === "new-list" || listsSubView === "edit-list" ? (
                  /* NEW / EDIT LIST SCREEN - RENDER INLINE */
                  <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto no-scrollbar animate-fade-in text-white">

                    {/* List Name Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                        {t("list_name_label")}
                      </label>
                      <input
                        type="text"
                        value={newListName}
                        onChange={(e) => {
                          setNewListName(e.target.value);
                          if (listValidationError) setListValidationError("");
                        }}
                        placeholder={t("list_name_placeholder")}
                        className="w-full bg-[#28253b] border border-transparent focus:border-[#7c5dfa] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none transition-all"
                        autoFocus
                      />
                      {listValidationError && (
                        <p className="text-[10px] text-red-500 font-semibold mt-1 pl-1">
                          {listValidationError}
                        </p>
                      )}
                    </div>

                    {/* Included Items Section */}
                    <div className="flex-1 flex flex-col overflow-hidden space-y-2 pt-2">
                      <div className="flex justify-between items-center pl-1">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                          {t("list_included_label")}
                        </span>
                        <span className="text-[10px] text-[#b69eff] font-bold">
                          {newListItems.length} {t("selected_count")}
                        </span>
                      </div>

                      {/* Member select sub-area with Search */}
                      <div className="relative mb-2 shrink-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 w-3.5 h-3.5" />
                        <input
                          type="text"
                          value={listSearchQuery}
                          onChange={(e) => setListSearchQuery(e.target.value)}
                          placeholder={t("list_search_placeholder")}
                          className="w-full bg-[#1c1a29] border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-[11px] focus:outline-none placeholder:text-white/20 text-white"
                        />
                      </div>

                      {/* Scrollable list of options (contacts and groups) */}
                      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/[0.02]">
                        {(() => {
                          const selectableItems = [];

                          // Contacts
                          getSelectableUsers().forEach((user) => {
                            selectableItems.push({
                              id: Number(user.id),
                              type: "contact",
                              name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                              subText: user.email || user.mobile || "",
                              image: user.profile_image,
                              initials: `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase(),
                            });
                          });

                          // Groups
                          chatList.filter(c => c.is_group).forEach((group) => {
                            selectableItems.push({
                              id: Number(group.id),
                              type: "group",
                              name: group.name || "Unnamed Group",
                              subText: `${group.members?.length || 0} members`,
                              image: group.group_image,
                              initials: (group.name || "GP").substring(0, 2).toUpperCase(),
                            });
                          });

                          const filtered = selectableItems.filter(item =>
                            item.name.toLowerCase().includes(listSearchQuery.toLowerCase())
                          );

                          if (filtered.length === 0) {
                            return (
                              <p className="text-[10px] text-white/30 text-center py-6">
                                {t("no_contacts_or_groups_found")}
                              </p>
                            );
                          }

                          return filtered.map((item) => {
                            const isSelected = newListItems.includes(item.id);
                            return (
                              <div
                                key={`${item.type}-${item.id}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setNewListItems(newListItems.filter(id => id !== item.id));
                                  } else {
                                    setNewListItems([...newListItems, item.id]);
                                  }
                                }}
                                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.01]"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#2c283d] flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                                    {item.image ? (
                                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      item.initials
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                                    <p className="text-[9px] text-white/40 truncate">{item.subText}</p>
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-[#7c5dfa] border-transparent" : "border-white/10 hover:border-white/20"
                                  }`}>
                                  {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>



                    {/* Actions (Save & Delete) */}
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center shrink-0">
                      {listsSubView === "edit-list" && selectedListForEdit ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteList(selectedListForEdit.id)}
                          className="p-2 bg-red-950/20 text-red-400 hover:text-red-300 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                          title="Delete List"
                        >
                          <Trash2 className="w-4 h-4" /> {t("delete_contact_button")}
                        </button>
                      ) : (
                        <div></div>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveList}
                        className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> {t("edit_contact_save_button")}
                      </button>
                    </div>

                  </div>
                ) : (
                  /* CHAT LIST RENDER */
                  <>
                    {/* Locked chats top bar */}
                    {!isViewingLockedChats && !isViewingArchivedChats && lockedRoomIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPinDigits(["", "", "", ""]);
                          setPinError("");
                          setIsUnlockPinModalOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border-b border-white/5 transition-all text-left cursor-pointer shrink-0"
                      >
                        <div className="flex items-center gap-3 ml-[15px]">
                          <Lock className="w-4 h-4 text-purple-400" />
                          <span className="text-xs tracking-wide font-bold text-white/90">{t("locked_chats_title", "Locked chats")}</span>
                        </div>
                        <span className="bg-[#7c5dfa]/20 text-[#b69eff] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {lockedRoomIds.length}
                        </span>
                      </button>
                    )}

                    {/* Header/back button when viewing locked chats */}
                    {isViewingLockedChats && (
                      <div className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border-b border-white/5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsViewingLockedChats(false)}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-white/90">{t("locked_chats_title", "Locked chats")}</span>
                      </div>
                    )}

                    {/* Archived top bar */}
                    {!isViewingLockedChats && !isViewingArchivedChats && archivedRoomIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsViewingArchivedChats(true)}
                        className="w-full flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border-b border-white/5 transition-all text-left cursor-pointer shrink-0"
                      >
                        <div className="flex items-center gap-3 ml-[15px]">
                          <Archive className="w-4 h-4 text-purple-400" />
                          <span className="text-xs  tracking-wide font-bold text-white/90">{t("archived_chats_title") || "Archived"}</span>
                        </div>
                        <span className="bg-[#7c5dfa]/20 text-[#b69eff] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {archivedRoomIds.length}
                        </span>
                      </button>
                    )}

                    {/* Header/back button when viewing archived list */}
                    {!isViewingLockedChats && isViewingArchivedChats && (
                      <div className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border-b border-white/5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsViewingArchivedChats(false)}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-white/90">{t("archived_chats_title") || "Archived chats"}</span>
                      </div>
                    )}

                    {filteredChatList.length === 0 && searchApiResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-white/30 h-64 space-y-2.5">
                        <MessageSquare className="w-10 h-10 opacity-30 animate-pulse text-purple-300" />
                        <p className="text-xs">{t("no_chats_matching")}</p>
                      </div>
                    ) : (
                      <>
                        {filteredChatList.map((chat) => {
                          const partner = getRoomPartner(chat);
                          const isSelf = !chat.is_group && !partner;
                          const isSavedContact = partner && (contacts || []).some(c => Number(c.id) === Number(partner.id));
                          const chatTitle = chat.is_group
                            ? chat.name
                            : isSelf
                              ? `${currentUser?.first_name || ""} ${currentUser?.last_name || ""} (${t("contacts_you_badge", "You")})`
                              : isSavedContact
                                ? `${partner?.first_name || ""} ${partner?.last_name || ""}`
                                : partner?.mobile
                                  ? `+${partner.mobile}`
                                  : t("unknown_contact", "Unknown Contact");
                          const avatarText = chat.is_group
                            ? chat.name?.substring(0, 2).toUpperCase()
                            : isSelf
                              ? `${currentUser?.first_name?.[0] || ""}${currentUser?.last_name?.[0] || ""}`.toUpperCase()
                              : `${partner?.first_name?.[0] || ""}${partner?.last_name?.[0] || ""}`.toUpperCase();

                          const isSelected = activeRoom && activeRoom.id === chat.id;

                          return (
                            <div
                              key={chat.id}
                              onClick={() => {
                                if (isDeleteMode) {
                                  toggleSelectChat(chat.id);
                                } else {
                                  if (chat.isSelfChatOnly) {
                                    handleStartPersonalChat(currentUser);
                                  } else if (chat.isContactOnly) {
                                    handleStartPersonalChat(chat.contactUser);
                                  } else {
                                    handleSelectRoom(chat);
                                  }
                                }
                              }}
                              className={`p-4 flex items-center gap-3.5 cursor-pointer transition-all relative group/chat ${isSelected
                                ? "bg-[#7c5dfa]/15 hover:bg-[#7c5dfa]/20"
                                : "hover:bg-[#201e30]"
                                }`}
                            >
                              {isDeleteMode && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectChat(chat.id);
                                  }}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedChatIds.includes(chat.id)
                                    ? "bg-[#7c5dfa] border-transparent"
                                    : "border-white/10 hover:border-white/20"
                                    }`}
                                >
                                  {selectedChatIds.includes(chat.id) && (
                                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                              )}

                              <div className="w-11 h-11 rounded-full bg-[#27243c] flex items-center justify-center font-bold text-xs relative shrink-0">
                                {chat.is_group ? (
                                  chat.group_image ? (
                                    <img
                                      src={chat.group_image}
                                      alt="group avatar"
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  ) : (
                                    <Users className="w-5.5 h-5.5 text-purple-300" />
                                  )
                                ) : (isSelf ? currentUser?.profile_image : partner?.profile_image) ? (
                                  <img
                                    src={isSelf ? currentUser.profile_image : partner.profile_image}
                                    alt="avatar"
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <span>{avatarText}</span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                  <h4 className="text-xs font-bold text-white truncate pr-2">{chatTitle}</h4>
                                  <span className={`text-[10px] whitespace-nowrap ${chat.unreadCount > 0 ? "text-[#9f85ff] font-bold" : "text-white/30"}`}>
                                    {chat.lastMessage
                                      ? new Date(chat.lastMessage.created_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                      : ""}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <p className="text-[11px] text-white/50 truncate flex-1 pr-3 flex items-center gap-1">
                                    {/* Sent/delivered tick for own messages */}
                                    {chat.lastMessage && Number(chat.lastMessage.sender_id) === Number(currentUser?.id) && (
                                      <svg className="w-3 h-3 text-[#9f85ff] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                        <polyline points="20 6 9 17 4 12" transform="translate(4,0)" />
                                      </svg>
                                    )}
                                    {chat.lastMessage ? (
                                      chat.lastMessage.attachment_url ? (
                                        renderLastMessageAttachmentIcon(chat.lastMessage)
                                      ) : chat.lastMessage.poll_options?.length > 0 ? (
                                        <span className="flex items-center gap-1 text-slate-400">
                                          <BarChart2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <span>{t("poll", "Poll")}</span>
                                        </span>
                                      ) : (
                                        <span className="truncate">
                                          {(() => {
                                            const cleanText = cleanLastMessageText(chat.lastMessage);
                                            if (chat.is_group && Number(chat.lastMessage.sender_id) !== Number(currentUser?.id)) {
                                              const senderMember = chat.members?.find((m) => Number(m?.id) === Number(chat.lastMessage.sender_id));
                                              const senderName = senderMember ? senderMember.first_name : "User";
                                              return `${senderName} : ${cleanText}`;
                                            } else if (Number(chat.lastMessage.sender_id) === Number(currentUser?.id)) {
                                              return `You : ${cleanText}`;
                                            } else {
                                              return cleanText;
                                            }
                                          })()}
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-white/20 italic">{t("no_messages_yet")}</span>
                                    )}
                                  </p>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {chat.is_pinned && (
                                      <Pin className="w-3 h-3 text-[#b69eff] -rotate-45" fill="currentColor" />
                                    )}
                                    {chat.unreadCount > 0 && (
                                      <span className="w-5 h-5 bg-[#7c5dfa] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {chat.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>


                            </div>
                          );
                        })}

                        {/* Render API search results if user searched */}
                        {chatSearch.trim() && searchApiResults.length > 0 && (
                          <div className="py-2.5">
                            <div className="px-5 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                              {t("start_new_chat")}
                            </div>
                            {searchApiResults.map((user) => {
                              const alreadyInChatList = chatList.some((chat) => {
                                if (chat.is_group) return false;
                                return chat.members?.some((m) => Number(m.id) === Number(user.id));
                              });

                              if (alreadyInChatList) return null;

                              const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
                              return (
                                <div
                                  key={user.id}
                                  onClick={() => {
                                    setChatSearch("");
                                    setSearchApiResults([]);
                                    handleStartPersonalChat(user);
                                  }}
                                  className="p-4 flex items-center gap-3.5 cursor-pointer hover:bg-[#201e30] transition-all animate-fade-in"
                                >
                                  <div className="w-11 h-11 rounded-full bg-[#27243c] flex items-center justify-center font-bold text-xs shrink-0 border border-white/5">
                                    {user.profile_image ? (
                                      <img
                                        src={user.profile_image}
                                        alt="avatar"
                                        className="w-full h-full object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(user.profile_image, "_blank");
                                        }}
                                      />
                                    ) : (
                                      userInitials
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-white truncate">
                                      {user.first_name} {user.last_name}
                                    </h4>
                                    <p className="text-[10px] text-[#7c5dfa] truncate">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* TAB 2: COMMUNITIES */}
            {activeTab === "community" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#161421]">
                {isCommunityModalOpen ? (
                  /* COMMUNITY CREATION PANEL */
                  <div className="flex-1 flex flex-col overflow-hidden animate-fade-in text-white">
                    <form onSubmit={handleCreateCommunitySubmit} className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pt-0 space-y-4">
                        {communityError && (
                          <div className="bg-red-950/40 border border-red-500/30 text-red-200 p-3 rounded-xl text-xs text-center">
                            {communityError}
                          </div>
                        )}
                        {communitySuccess && (
                          <div className="bg-[#7c5dfa]/20 border border-[#7c5dfa]/40 text-[#b69eff] p-3 rounded-xl text-xs font-bold text-center shadow-lg">
                            {communitySuccess}
                          </div>
                        )}

                        <div className="space-y-1 pt-2">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                            {t("community_name_label")}
                          </label>
                          <input
                            type="text"
                            value={communityName}
                            onChange={(e) => setCommunityName(e.target.value)}
                            placeholder={t("group_name_placeholder", "Enter name")}
                            className="w-full bg-[#28253b] border border-transparent focus:border-[#7c5dfa] rounded-lg px-3 py-2.5 text-xs text-white"
                            autoFocus
                          />
                        </div>

                        <div className="space-y-2 pt-2">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                            {t("community_add_members_label")}
                          </label>
                          <div className="space-y-1 divide-y divide-white/[0.02] max-h-[250px] overflow-y-auto no-scrollbar pr-1">
                            {selectableUsers.length === 0 ? (
                              <p className="text-[11px] text-white/30 text-center py-4">{t("o_selectable_users")}</p>
                            ) : (
                              selectableUsers.map((user) => {
                                const isSelected = selectedCommunityMembers.includes(user.id);
                                const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
                                return (
                                  <div
                                    key={user.id}
                                    onClick={() => toggleCommunityMemberSelection(user.id)}
                                    className="py-2 flex items-center justify-between cursor-pointer hover:bg-white/[0.01]"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-[#2c283d] flex items-center justify-center font-bold text-[10px]">
                                        {user.profile_image ? (
                                          <img
                                            src={user.profile_image}
                                            alt="avatar"
                                            className="w-full h-full object-cover rounded-full"
                                          />
                                        ) : (
                                          userInitials
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-white">{user.first_name} {user.last_name}</p>
                                        <p className="text-[9px] text-white/40">{user.email}</p>
                                      </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-[#7c5dfa] border-transparent" : "border-white/10 hover:border-white/20"
                                      }`}>
                                      {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Groups Selection List */}
                        <div className="space-y-2 pt-2">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                            Link Your Groups (Optional)
                          </label>
                          <div className="space-y-1 divide-y divide-white/[0.02] max-h-[180px] overflow-y-auto no-scrollbar pr-1">
                            {(() => {
                              const linkableGroups = (chatList || []).filter(c =>
                                c.is_group &&
                                !c.is_community &&
                                Number(c.created_by) === Number(currentUser?.id) &&
                                !c.community_id
                              );

                              if (linkableGroups.length === 0) {
                                return (
                                  <p className="text-[11px] text-white/20 text-center py-4 italic">No standalone groups available to link.</p>
                                );
                              }

                              return linkableGroups.map((group) => {
                                const isSelected = selectedCommunityGroups.includes(group.id);
                                return (
                                  <div
                                    key={group.id}
                                    onClick={() => toggleCommunityGroupSelection(group.id)}
                                    className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.01]"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-[#b69eff]/10 border border-[#b69eff]/20 flex items-center justify-center font-bold text-[11px] text-[#b69eff]">
                                        #
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-white">{group.name}</p>
                                        <p className="text-[9px] text-white/40">{group.members?.length || 0} members</p>
                                      </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-[#7c5dfa] border-transparent" : "border-white/10 hover:border-white/20"}`}>
                                      {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-4 border-t border-white/5 flex gap-2 justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setCommunityName("");
                            setSelectedCommunityMembers([]);
                            setSelectedCommunityGroups([]);
                            setCommunityError("");
                            setCommunitySuccess("");
                            setIsCommunityModalOpen(false);
                          }}
                          className="px-3.5 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          {t("cancel")}
                        </button>
                        <button
                          type="submit"
                          disabled={communityLoading}
                          className="px-4 py-2 bg-[#7c5dfa] hover:bg-[#684ce2] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          {communityLoading ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            t("create")
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* EXISTING COMMUNITY LIST VIEW */
                  <div className="p-3.5 flex-1 overflow-y-auto no-scrollbar space-y-4">
                    {/* Dotted "New Community" item at the top matching screenshot layout */}
                    <div
                      onClick={() => setIsCommunityModalOpen(true)}
                      className="p-3.5 flex items-center gap-4.5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-dashed border-white/10 group mb-3 bg-[#1a1829]/40"
                    >
                      <div className="w-10 h-10 mr-4 rounded-2xl bg-[#7c5dfa]/10 group-hover:bg-[#7c5dfa]/20 flex items-center justify-center font-bold text-xs shrink-0 border border-[#7c5dfa]/20 relative transition-colors shadow-inner">
                        <Users className="w-6 h-6 text-[#b69eff] group-hover:scale-105 transition-transform" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#7c5dfa] rounded-full flex items-center justify-center border-2 border-[#161421]">
                          <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-[#b69eff] transition-colors">{t("contacts_new_community")}</h4>
                        <p className="text-[10px] text-white/30 truncate mt-0.5">{t("community_new_description")}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1 mb-2">{t("community_my_communities")}</div>
                      {communityList.length === 0 ? (
                        <div className="text-center py-12 text-white/30 text-xs">{t("community_no_communities")}</div>
                      ) : (
                        communityList.map((chat, cIdx) => {
                          const isOwnAdmin = Number(chat.created_by) === Number(currentUser?.id);
                          const isSelected = activeRoom && activeRoom.id === chat.id;

                          return (
                            <div
                              key={chat.id}
                              className="bg-[#1f1d2c]/60 border border-white/5 rounded-2xl p-2.5 shadow-sm space-y-2 mb-3 transition-all hover:border-[#7c5dfa]/30"
                            >
                              <div className="flex items-center justify-between px-1 py-1 select-none">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7c5dfa] to-[#a78bfa] border border-[#7c5dfa]/30 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-md relative">
                                    <Users className="w-5 h-5 text-white" style={{ color: "#ffffff" }} />
                                  </div>
                                  <div className="truncate">
                                    <h4 className="text-xs font-black text-white truncate tracking-wide">
                                      {chat.name}
                                    </h4>
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCommunityMembersId(showCommunityMembersId === chat.id ? null : chat.id);
                                      }}
                                      className="inline-block text-[9px] text-[#9f85ff] font-bold uppercase tracking-wider mt-0.5 cursor-pointer hover:underline bg-[#7c5dfa]/10 hover:bg-[#7c5dfa]/20 px-1.5 py-0.5 rounded-full select-none"
                                    >
                                      {isOwnAdmin ? "Admin" : "Member"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* {showCommunityMembersId === chat.id && chat.members && (
                              <div className="ml-5 mt-2 p-2 bg-white/[0.01] border border-white/5 rounded-xl space-y-2.5 animate-fade-in">
                                <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1 mb-1">
                                  {t("community_members_title")} ({chat.members.length})
                                </div>
                                <div className="max-h-[150px] overflow-y-auto no-scrollbar space-y-2">
                                  {chat.members.map((member) => {
                                    const memberInitials = `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`.toUpperCase();
                                    const isMemberAdmin = Number(chat.created_by) === Number(member.id);
                                    return (
                                      <div key={member.id} className="flex items-center justify-between py-0.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="w-6 h-6 rounded-full bg-[#2c283d] flex items-center justify-center font-bold text-[9px] border border-white/5 shrink-0">
                                            {member.profile_image ? (
                                              <img src={member.profile_image} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                              memberInitials
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-white/90 truncate">
                                              {member.first_name} {member.last_name}
                                              {Number(member.id) === Number(currentUser?.id) && (
                                                <span className="ml-1 text-[8px] text-white/40 font-normal italic">({t("contacts_you_badge", "You")})</span>
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                        {isMemberAdmin && (
                                          <span className="text-[8px] text-[#7c5dfa] font-bold bg-[#7c5dfa]/15 px-1 py-0.5 rounded">{t("community_admin_badge")}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )} */}

                              {/* 1. Announcement Group */}
                              <div
                                onClick={() => handleSelectRoom(chat)}
                                className={`ml-5 mr-1 p-2.5 flex items-center justify-between rounded-xl hover:bg-white/5 transition-all cursor-pointer ${isSelected ? "bg-[#7c5dfa]/15 text-[#9f85ff]" : "text-white/70"}`}
                              >

                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-[#7c5dfa]/10 flex items-center justify-center shrink-0 border border-[#7c5dfa]/20">
                                    <svg className="w-4 h-4 text-[#b69eff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a4.5 4.5 0 0 1 0 7M19.07 4.93a10 10 0 0 1 0 14.14" />
                                    </svg>
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-bold truncate">{t("community_announcement_group")}</p>
                                    <p className="text-[10px] text-white/30 truncate mt-0.5">
                                      {chat.lastMessage ? cleanLastMessageText(chat.lastMessage) : t("community_only_admins_send")}
                                    </p>
                                  </div>
                                </div>

                                {chat.unreadCount > 0 && (
                                  <span className="w-4 h-4 bg-[#7c5dfa] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                    {chat.unreadCount}
                                  </span>
                                )}
                              </div>

                              {/* 2. Sub-Groups */}
                              {(() => {
                                const subGroups = (chatList || []).filter(c => c.is_group && !c.is_community && Number(c.community_id) === Number(chat.id));
                                return subGroups.map((subGroup) => {
                                  const isSubGroupSelected = activeRoom && activeRoom.id === subGroup.id;
                                  return (
                                    <div
                                      key={subGroup.id}
                                      onClick={() => handleSelectRoom(subGroup)}
                                      className={`ml-9 mr-1 mt-1.5 p-2 flex items-center justify-between rounded-xl hover:bg-white/5 transition-all cursor-pointer ${isSubGroupSelected ? "bg-[#7c5dfa]/15 text-[#9f85ff]" : "text-white/70"}`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-6 h-6 rounded-lg bg-[#b69eff]/10 flex items-center justify-center shrink-0 border border-[#b69eff]/20 text-[10px] text-[#b69eff] font-bold">
                                          #
                                        </div>

                                        <div className="truncate">
                                          <p className="text-[11px] font-bold truncate">{subGroup.name}</p>
                                          <p className="text-[9px] text-white/30 truncate mt-0.5">
                                            {subGroup.lastMessage ? cleanLastMessageText(subGroup.lastMessage) : "No messages yet"}
                                          </p>
                                        </div>
                                      </div>
                                      {subGroup.unreadCount > 0 && (
                                        <span className="w-3.5 h-3.5 bg-[#7c5dfa] text-white text-[8px] font-black rounded-full flex items-center justify-center shrink-0">
                                          {subGroup.unreadCount}
                                        </span>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-[#161421]">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#161421]/50 shrink-0">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">{t("Notification_Alerts")}</span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearNotifications}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/10 cursor-pointer"
                    >
                      {t("ClearAll")}
                    </button>
                  )}
                </div>

                {/* Search Bar */}
                <div className="px-4 py-2 border-b border-white/5 shrink-0 bg-[#161421]/30 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 light:text-black/30" />
                    <input
                      type="text"
                      value={notifSearchQuery}
                      onChange={(e) => setNotifSearchQuery(e.target.value)}
                      placeholder={t("search_notifications_placeholder") || "Search by name or date..."}
                      className="w-full bg-[#1c1a29]/60 dark:bg-[#1c1a29]/60 light:bg-slate-100 border border-[#7c5dfa]/20 focus:border-[#7c5dfa]/60 hover:bg-[#1c1a29]/80 focus:bg-[#1c1a29]/95 rounded-[30px] pl-10 pr-10 py-2.5 text-xs focus:outline-none transition-all placeholder:text-white/30 light:placeholder:text-black/30 text-white light:text-black shadow-inner"
                    />
                    {notifSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setNotifSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="px-4 py-2 border-b border-white/5 flex gap-2 shrink-0 bg-[#161421]/30">
                  <button
                    type="button"
                    onClick={() => setNotifFilter("all")}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${notifFilter === "all"
                      ? "bg-[#7c5dfa]/20 border border-[#7c5dfa]/50 text-[#b69eff]"
                      : "bg-white/[0.02] border border-white/5 text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                      }`}
                  >
                    {t("All")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter("unread")}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${notifFilter === "unread"
                      ? "bg-[#7c5dfa]/20 border border-[#7c5dfa]/50 text-[#b69eff]"
                      : "bg-white/[0.02] border border-white/5 text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                      }`}
                  >
                    {t("Unread")}
                  </button>
                </div>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                  {(() => {
                    const filteredNotifications = notifications.filter(n => {
                      if (notifFilter === "unread") {
                        if (n.is_seen || n.is_read || n.seen || n.read) return false;
                      }
                      if (notifSearchQuery && notifSearchQuery.trim() !== "") {
                        const q = notifSearchQuery.toLowerCase();
                        const senderName = n.signup_users
                          ? `${n.signup_users.first_name} ${n.signup_users.last_name}`.toLowerCase()
                          : "";
                        const notifText = (n.notification_text || "").toLowerCase();
                        const date = n.created_at
                          ? new Date(n.created_at).toLocaleDateString().toLowerCase()
                          : "";
                        const dateString = n.created_at
                          ? new Date(n.created_at).toDateString().toLowerCase()
                          : "";
                        return senderName.includes(q) || notifText.includes(q) || date.includes(q) || dateString.includes(q);
                      }
                      return true;
                    });

                    if (filteredNotifications.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none animate-fade-in">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/30 mb-4 border border-white/10">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                          </div>
                          <h4 className="text-xs font-bold text-white/80">{t("notifications_all_caught_up")}</h4>
                          <p className="text-[10px] text-white/30 mt-1 max-w-[200px]">
                            {notifFilter === "unread" ? t("notifications_no_unread") : t("notifications_no_notifications")}
                          </p>
                        </div>
                      );
                    }

                    const today = [];
                    const yesterday = [];
                    const olderGroups = {};

                    const todayDate = new Date();
                    const yesterdayDate = new Date();
                    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

                    const isSameDay = (d1, d2) => {
                      return d1.getFullYear() === d2.getFullYear() &&
                        d1.getMonth() === d2.getMonth() &&
                        d1.getDate() === d2.getDate();
                    };

                    filteredNotifications.forEach(n => {
                      const date = new Date(n.created_at || Date.now());
                      if (isSameDay(date, todayDate)) {
                        today.push(n);
                      } else if (isSameDay(date, yesterdayDate)) {
                        yesterday.push(n);
                      } else {
                        const dateStr = date.toLocaleDateString([], {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        });
                        if (!olderGroups[dateStr]) {
                          olderGroups[dateStr] = [];
                        }
                        olderGroups[dateStr].push(n);
                      }
                    });

                    const renderNotifCard = (n) => {
                      const senderName = n.signup_users
                        ? `${n.signup_users.first_name} ${n.signup_users.last_name}`
                        : "Someone";
                      const senderInitials = n.signup_users
                        ? `${n.signup_users.first_name?.[0] || ""}${n.signup_users.last_name?.[0] || ""}`.toUpperCase()
                        : "?";
                      const createdTime = n.created_at
                        ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : "";
                      const isRead = n.is_read || n.read || n.is_seen || n.seen;
                      const isInvite = n.chat_rooms?.is_community && !n.message_id;
                      const isPoll = n.chat_messages?.attachment_type === "poll";
                      const isLinkGroupReq = n.chat_messages?.message_text && n.chat_messages.message_text.startsWith("LINK_GROUP_REQUEST:");
                      const statusReplyMatch = n.chat_messages?.message_text ? n.chat_messages.message_text.match(/^\u200Bstatus_reply:([^:]+):([^\u200B]+)\u200B/) : null;

                      const handleNotifClick = async () => {
                        if (!isRead) {
                          try {
                            if (handleReadNotification) {
                              await handleReadNotification(n.id);
                            } else {
                              await markNotificationAsRead(n.id);
                            }
                          } catch (e) {
                            console.error("Error marking notification read:", e);
                          }
                          if (setNotifications) {
                            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                          }
                        }
                        if (n.is_security_reminder || (n.chat_messages?.message_text && n.chat_messages.message_text.includes("verify your email"))) {
                          try {
                            const res = await sendVerificationEmailService();
                            if (setStatusTip) setStatusTip(res.message || "Verification email sent! Please check your inbox.");
                          } catch (err) {
                            if (setStatusTip) setStatusTip("Failed to send verification email.");
                          }
                        }
                        if (n.room_id) {
                          const targetRoom = (chatList || []).find(r => Number(r.id) === Number(n.room_id)) || {
                            id: n.room_id,
                            is_group: n.chat_rooms?.is_group || false,
                            name: n.chat_rooms?.name || senderName,
                            members: n.signup_users ? [n.signup_users] : []
                          };
                          if (handleSelectRoom) handleSelectRoom(targetRoom);
                          setActiveTab("chats");
                        }
                      };

                      return (
                        <div
                          key={n.id}
                          onClick={handleNotifClick}
                          className={`border rounded-2xl p-3 flex gap-3.5 items-center shadow-sm relative group hover:opacity-95 transition-all animate-fade-in cursor-pointer ${isRead
                            ? "bg-white/[0.01] border-white/5 opacity-60 hover:opacity-100"
                            : "bg-[#7c5dfa]/20 hover:bg-[#7c5dfa]/25 border-[#7c5dfa]/45 shadow-lg shadow-[#7c5dfa]/5"
                            }`}
                        >
                          {/* Sender Avatar */}
                          <div className="w-9 h-9 rounded-full bg-[#27233a] flex items-center justify-center font-bold text-xs border border-white/10 shrink-0 select-none">
                            {n.signup_users?.profile_image ? (
                              <img
                                src={n.signup_users.profile_image}
                                alt="avatar"
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-[#9f85ff]">{senderInitials}</span>
                            )}
                          </div>

                          {/* Notification Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white/90 truncate">{senderName}</span>
                              <span className="text-[9px] text-white/30 font-mono shrink-0">{createdTime}</span>
                            </div>
                            <p className="text-[10.5px] text-white/60 truncate mt-0.5 whitespace-normal">
                              {isInvite
                                ? t("invited_you_to_join_community", 'Invited you to join the community "{name}"').replace("{name}", n.chat_rooms?.name || t("community", "Community"))
                                : isPoll
                                  ? t("poll_reminder_notif", '📊 Poll Reminder: "{text}"').replace("{text}", n.chat_messages?.message_text || t("poll_reminder_default_text", "Please select an option and vote in active poll!"))
                                  : isLinkGroupReq
                                    ? t("wants_to_link_group_notif", 'wants to link your group "{name}" to their community.').replace("{name}", n.chat_rooms?.name || t("group", "Group"))
                                    : statusReplyMatch
                                      ? `💬 Status Reply: "${n.chat_messages.message_text.replace(/^\u200Bstatus_reply:[^:]+:[^\u200B]+\u200B/, "")}"`
                                      : n.chat_messages?.message_text
                                        ? n.chat_messages.message_text
                                        : (n.notification_text || t("sent_new_notification", "Sent you a new notification"))}
                            </p>

                            {statusReplyMatch && (() => {
                              const statusType = statusReplyMatch[1];
                              const statusContent = decodeURIComponent(statusReplyMatch[2]);
                              return (
                                <div className="mt-2 bg-black/25 rounded-xl p-2 flex items-center justify-between gap-2 border-l-2 border-[#b69eff] select-none">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-bold text-[#b69eff] uppercase tracking-wide">Replied to Status</p>
                                    <p className="text-[10px] text-white/50 truncate italic mt-0.5">
                                      {statusType === "video" ? "📹 Video status" : "📷 Image status"}
                                    </p>
                                  </div>
                                  <div className="w-7 h-7 rounded overflow-hidden shrink-0 border border-white/10 bg-black/40 flex items-center justify-center">
                                    {statusType === "video" ? (
                                      <video src={statusContent} className="w-full h-full object-cover" muted />
                                    ) : (
                                      <img src={statusContent} alt="" className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Interactive Link Group Action Buttons (Accept / Reject) */}
                            {isLinkGroupReq && !isRead && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const communityId = n.chat_messages.message_text.split(":")[1];
                                      const groupId = n.room_id;
                                      await linkGroupToCommunity(communityId, groupId);
                                      if (handleReadNotification) {
                                        await handleReadNotification(n.id);
                                      } else {
                                        await markNotificationAsRead(n.id);
                                      }
                                      if (setNotifications) {
                                        setNotifications(prev => prev.filter(item => item.id !== n.id));
                                      }
                                      if (refreshChatList) await refreshChatList();
                                      if (typeof setStatusTip === "function") {
                                        setStatusTip(t("group_linked_success", "Group linked to community successfully."));
                                      }
                                    } catch (err) {
                                      console.error("Failed to link group:", err);
                                    }
                                  }}
                                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer border-none"
                                >
                                  {t("accept", "Accept")}
                                </button>

                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      if (handleReadNotification) {
                                        await handleReadNotification(n.id);
                                      } else {
                                        await markNotificationAsRead(n.id);
                                      }
                                      if (setNotifications) {
                                        setNotifications(prev => prev.filter(item => item.id !== n.id));
                                      }
                                    } catch (err) {
                                      console.error("Failed to reject link request:", err);
                                    }
                                  }}
                                  className="px-3 py-1 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-white/5"
                                >
                                  {t("reject", "Reject")}
                                </button>
                              </div>
                            )}

                            {/* Interactive Community Invite Action Buttons (Accept / Reject) */}
                            {isInvite && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const communityId = n.room_id || n.chat_rooms?.id;
                                      await acceptCommunityInvite(communityId);
                                      if (setNotifications) {
                                        setNotifications(prev => prev.filter(item => item.id !== n.id));
                                      }
                                      if (refreshChatList) await refreshChatList();
                                      if (handleSelectRoom) {
                                        handleSelectRoom({ id: communityId, is_group: true, is_community: true, name: n.chat_rooms?.name || "Community" });
                                        setActiveTab("chats");
                                      }
                                    } catch (err) {
                                      console.error("Failed to accept community invite:", err);
                                    }
                                  }}
                                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                                >
                                  {t("accept", "Accept")}
                                </button>

                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const communityId = n.room_id || n.chat_rooms?.id;
                                      await declineCommunityInvite(communityId);
                                      if (setNotifications) {
                                        setNotifications(prev => prev.filter(item => item.id !== n.id));
                                      }
                                    } catch (err) {
                                      console.error("Failed to decline community invite:", err);
                                    }
                                  }}
                                  className="px-3 py-1 bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-white/5"
                                >
                                  {t("reject", "Reject")}
                                </button>
                              </div>
                            )}

                            {/* Poll Action Button */}
                            {isPoll && (
                              <div className="mt-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotifClick();
                                  }}
                                  className="px-3 py-1 bg-[#7c5dfa] hover:bg-[#684ce2] text-white text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                                >
                                  {t("vote_now", "Vote Now")}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Delete Single Notification Button */}
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                if (handleDeleteNotification) {
                                  await handleDeleteNotification(n.id);
                                } else {
                                  await deleteNotificationsBatch([n.id]);
                                  if (refreshNotifications) await refreshNotifications();
                                }
                              } catch (err) {
                                console.error("Failed to delete notification:", err);
                              }
                            }}
                            title="Delete notification"
                            className="p-1.5 hover:bg-red-500/20 text-white/30 hover:text-red-400 rounded-lg transition-all cursor-pointer shrink-0 border border-transparent hover:border-red-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-4">
                        {today.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">{t("notif_group_today")}</div>
                            {today.map(renderNotifCard)}
                          </div>
                        )}

                        {yesterday.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1 pt-2">{t("notif_group_yesterday")}</div>
                            {yesterday.map(renderNotifCard)}
                          </div>
                        )}

                        {Object.keys(olderGroups).map((dateStr, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1 pt-2">{dateStr}</div>
                            {olderGroups[dateStr].map(renderNotifCard)}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB 4: SETTINGS (SUB-VIEWS AND SLIDE-IN PROFILE PAGE AS SS 2 & SS 3) */}
            {activeTab === "settings" && (
              <div className="flex-1 flex flex-col overflow-visible bg-transparent relative">
                {/* Settings tip banner */}
                {settingsTip && (
                  <div
                    style={{ backgroundColor: "#7c5dfa", color: "#ffffff" }}
                    className="mx-4 mt-3 border border-[#7c5dfa]/50 text-center py-2.5 px-3 rounded-xl text-xs font-bold shadow-xl animate-bounce z-50 shrink-0"
                  >
                    <span style={{ color: "#ffffff" }}>{settingsTip}</span>
                  </div>
                )}

                {/* VIEW A: MAIN SETTINGS MENU */}
                {settingsView === "menu" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">

                    {/* Profile Quick Link Card */}
                    <div
                      onClick={() => {
                        setSettingsView("profile");
                        window.history.pushState(null, "", "/profile");
                      }}
                      className="p-3 pb-1 flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <div className="w-14 h-14 ml-2 rounded-full bg-gradient-to-tr from-[#7c5dfa] to-purple-600 flex items-center justify-center font-bold text-lg border-2 border-white/10 shadow-lg overflow-hidden shrink-0">
                        {currentUser?.profile_image ? (
                          <img
                            src={currentUser.profile_image}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-white truncate">
                            {currentUser?.first_name} {currentUser?.last_name}
                          </h4>
                          <p className="text-xs text-white/45 truncate mt-0.5">
                            {currentUser?.about || "Hey there! I am using MYCHATBOX."}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Settings Search Bar */}
                    {/* <div className="px-4 py-2.5 border-b border-white/5 bg-[#161421]">
                    <div className="flex items-center gap-2 bg-[#201d2d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus-within:border-[#7c5dfa]/80 transition-all">
                      <Search className="w-4 h-4 text-white/40 shrink-0" />
                      <input
                        type="text"
                        value={settingsSearchQuery}
                        onChange={(e) => setSettingsSearchQuery(e.target.value)}
                        placeholder={t("search_settings_placeholder", "Search settings...")}
                        className="bg-transparent outline-none w-full text-xs text-white placeholder-white/40"
                      />
                      {settingsSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setSettingsSearchQuery("")}
                          className="text-white/40 hover:text-white shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div> */}

                    {/* Settings Search Results (If query is non-empty) */}
                    {settingsSearchQuery.trim() !== "" ? (
                      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
                        {(() => {
                          const q = settingsSearchQuery.toLowerCase().trim();
                          const filtered = getSearchableSettingsList(t).filter(item => item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q));
                          if (filtered.length === 0) {
                            return (
                              <div className="p-8 text-center text-white/30 text-xs select-none">
                                No settings found for "{settingsSearchQuery}"
                              </div>
                            );
                          }
                          return filtered.map(item => {
                            const IconComp = item.icon;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSettingsSearchQuery("");
                                  setSettingsView(item.target);
                                }}
                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-white/80 hover:text-white cursor-pointer"
                              >
                                <div className={`p-2 rounded-lg ${item.color}`}>
                                  <IconComp className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{item.name}</p>
                                  <p className="text-[9px] text-white/45 truncate mt-0.5">{item.desc}</p>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      /* Normal Settings Options List */
                      <div className="px-3 pb-3 pt-1.5 space-y-1 flex-1">
                        <button
                          onClick={() => setSettingsView("profile")}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-white/80 hover:text-white cursor-pointer"
                        >
                          <div className="p-2 bg-[#7c5dfa]/10 rounded-lg text-[#9f85ff]">
                            <User className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t("profile")}</p>
                            <p className="text-[9px] text-white/45 mt-0.5">{t("settings_profile_desc")}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setSettingsView("account")}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-white/80 hover:text-white cursor-pointer"
                        >
                          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Key className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t("account")}</p>
                            <p className="text-[9px] text-white/45 mt-0.5">{t("settings_account_desc")}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setSettingsView("privacy")}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-white/80 hover:text-white cursor-pointer"
                        >
                          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Shield className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t("privacy")}</p>
                            <p className="text-[9px] text-white/45 mt-0.5">{t("settings_privacy_desc")}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setSettingsView("chats")}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-white/80 hover:text-white cursor-pointer"
                        >
                          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <MessageSquare className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t("chats")}</p>
                            <p className="text-[9px] text-white/45 mt-0.5">{t("settings_chats_desc")}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setSettingsView("notifications")}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-white/80 hover:text-white cursor-pointer"
                        >
                          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                            <Bell className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t("notifications")}</p>
                            <p className="text-[9px] text-white/45 mt-0.5">{t("settings_notifications_desc")}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setSettingsView("help")}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-white/80 hover:text-white cursor-pointer"
                        >
                          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                            <HelpCircle className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t("help")}</p>
                            <p className="text-[9px] text-white/45 mt-0.5">{t("settings_help_desc")}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setSettingsView("updates")}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-white/80 hover:text-white cursor-pointer"
                        >
                          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Download className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t("appUpdates", "App Updates")}</p>
                            <p className="text-[9px] text-white/45 mt-0.5">{t("settings_updates_desc", "Auto-update settings and build details")}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setSettingsView("language")}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-left text-white/80 hover:text-white cursor-pointer"
                        >
                          <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                            <Globe className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t("language")}</p>
                            <p className="text-[9px] text-white/45 mt-0.5">{t("settings_language_menu_desc")}</p>
                          </div>
                        </button>

                        <div className="h-px bg-white/5 my-3 px-3"></div>

                        <button
                          onClick={() => setIsLogoutConfirmOpen(true)}
                          className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 transition-all text-left text-red-400 hover:text-red-300 cursor-pointer shadow-sm mt-2"
                        >
                          <div className="p-2 bg-red-500/15 rounded-xl text-red-400">
                            <LogOut className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t("logout")}</p>
                            <p className="text-[10px] text-red-400/70 mt-0.5">{t("logout_desc")}</p>
                          </div>
                        </button>

                        <div className="pt-6 pb-2 text-center text-white/20 text-[9px] tracking-wider font-bold">
                          from MYCHATBOX
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* VIEW B: STYLE SLIDE-IN PROFILE PAGE (SS 2 & SS 3 STYLE WITH PURPLE BRAND COLOR) */}
                {settingsView === "profile" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in">

                    <div className="p-6 flex flex-col items-center space-y-6">
                      {/* Circle Profile Avatar with Camera Button Overlay */}
                      <div className="relative group select-none mt-2">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#7c5dfa] to-purple-600 flex items-center justify-center font-bold text-3xl border-4 border-[#161421] shadow-2xl overflow-hidden">
                          {currentUser?.profile_image ? (
                            <img
                              src={currentUser.profile_image}
                              alt="avatar"
                              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(currentUser.profile_image, "_blank")}
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => profileImageInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-[#7c5dfa] hover:bg-[#684ce2] text-white p-2.5 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-200 cursor-pointer"
                          title={t("profile_upload_photo_title")}
                        >
                          <Camera className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      <input
                        type="file"
                        ref={profileImageInputRef}
                        onChange={handleProfileImageChange}
                        accept="image/*"
                        className="hidden"
                      />

                      {/* Messages feedback */}
                      {profileSuccessMsg && (
                        <div className="w-full bg-[#7c5dfa]/20 border border-[#7c5dfa]/40 text-[#b69eff] px-3.5 py-2.5 rounded-xl text-xs font-bold text-center shadow-lg">
                          {profileSuccessMsg}
                        </div>
                      )}
                      {profileErrorMsg && (
                        <div className="w-full bg-red-950/40 border border-red-500/30 text-red-200 px-3.5 py-2.5 rounded-xl text-xs text-center">
                          {profileErrorMsg}
                        </div>
                      )}

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (document.activeElement instanceof HTMLElement) {
                            document.activeElement.blur();
                          }
                          await new Promise((resolve) => setTimeout(resolve, 0));
                          handleUpdateProfile(e);
                        }}
                        className="w-full space-y-5"
                      >

                        {/* 1. Name Field */}
                        <div className="space-y-1.5 border-b border-white/5 pb-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-[#9f85ff] uppercase tracking-wider block">{t("profile_name_label")}</label>
                            <button
                              type="button"
                              onClick={() => focusEditableField(nameEditableRef)}
                              className="text-white/40 hover:text-white transition-colors cursor-pointer"
                              title={t("profile_edit_name_title")}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div
                            ref={nameEditableRef}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const text = e.target.innerText;
                              const parts = text.trim().split(" ");
                              setEditFirstName(parts[0] || "");
                              setEditLastName(parts.slice(1).join(" ") || "");
                            }}
                            className="text-xs text-white font-medium pl-0.5 pb-1 border-b border-transparent focus:border-[#7c5dfa]/80 outline-none transition-all cursor-text min-h-[1.5rem]"
                          >
                            {editFirstName} {editLastName}
                          </div>
                          <p className="text-[10px] text-white/35 leading-relaxed mt-1">
                            {t("profile_name_help_text")}
                          </p>
                        </div>

                        {/* 2. About Field */}
                        <div className="space-y-1.5 border-b border-white/5 pb-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-[#9f85ff] uppercase tracking-wider block">{t("about_label")}</label>
                            <button
                              type="button"
                              onClick={() => focusEditableField(aboutEditableRef)}
                              className="text-white/40 hover:text-white transition-colors cursor-pointer"
                              title={t("profile_edit_about_title")}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div
                            ref={aboutEditableRef}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              setEditAbout(e.target.innerText || "");
                            }}
                            className="text-xs text-white font-medium pl-0.5 pb-1 border-b border-transparent focus:border-[#7c5dfa]/80 outline-none transition-all cursor-text min-h-[1.5rem]"
                          >
                            {editAbout}
                          </div>
                        </div>

                        {/* 3. Phone/Mobile Field */}
                        <div className="space-y-1.5 border-b border-white/5 pb-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-[#9f85ff] uppercase tracking-wider block">{t("add_contact_phone_label")}</label>
                            <button
                              type="button"
                              onClick={() => focusEditableField(mobileEditableRef)}
                              className="text-white/40 hover:text-white transition-colors cursor-pointer"
                              title={t("profile_edit_phone_title")}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div
                            ref={mobileEditableRef}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              setEditMobile(e.target.innerText || "");
                            }}
                            className="text-xs text-white font-medium pl-0.5 pb-1 border-b border-transparent focus:border-[#7c5dfa]/80 outline-none transition-all cursor-text min-h-[1.5rem]"
                          >
                            {editMobile}
                          </div>
                        </div>

                        {/* 4. Address Field */}
                        <div className="space-y-1.5 border-b border-white/5 pb-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-[#9f85ff] uppercase tracking-wider block">{t("profile_address")}</label>
                            <button
                              type="button"
                              onClick={() => focusEditableField(addressEditableRef)}
                              className="text-white/40 hover:text-white transition-colors cursor-pointer"
                              title={t("profile_edit_address_title")}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div
                            ref={addressEditableRef}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              setEditAddress(e.target.innerText || "");
                            }}
                            className="text-xs text-white font-medium pl-0.5 pb-1 border-b border-transparent focus:border-[#7c5dfa]/80 outline-none transition-all cursor-text min-h-[2.5rem] whitespace-pre-wrap leading-relaxed"
                          >
                            {editAddress}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-4"
                        >
                          {t("save_profile_button")}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* VIEW C: ACCOUNT SETTINGS VIEW */}
                {settingsView === "account" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421]">
                    <div className="p-4 space-y-1">
                      <button
                        type="button"
                        onClick={() => setSettingsView("security")}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/5 transition-all text-left group cursor-pointer"
                      >
                        <Shield className="w-5 h-5 text-white/70 group-hover:text-white shrink-0" />
                        <span className="text-sm font-medium text-white/90 group-hover:text-white flex-1">
                          {t("security_notifications", "Security notifications")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettingsView("delete-account-info")}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/5 transition-all text-left group cursor-pointer"
                      >
                        <Info className="w-5 h-5 text-white/70 group-hover:text-white shrink-0" />
                        <span className="text-sm font-medium text-white/90 group-hover:text-white flex-1">
                          {t("how_to_delete_account", "How to delete my account")}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW C0: DELETE ACCOUNT INFO VIEW (SOFT DELETE) */}
                {settingsView === "delete-account-info" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421]">
                    <div className="p-5 space-y-5">
                      <div className="bg-red-950/20 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200 leading-relaxed space-y-2">
                        <p className="font-bold flex items-center gap-1.5 text-sm text-amber-400">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" /> {t("account_deletion_notice", "Account Deactivation")}
                        </p>
                        <p>{t("delete_account_soft_desc", "Deleting your account will remove your account credentials and logout. Your chat messages and history will remain safely stored so you can re-register or sign up again anytime with the same email.")}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsLogoutConfirmOpen(false);
                          if (handleDeleteAccount) handleDeleteAccount();
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                      >
                        {t("delete_account_deactivate", "Deactivate Account")}
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW C1: SECURITY SETTINGS VIEW */}
                {settingsView === "security" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421]">
                    <div className="p-5 space-y-5 text-left font-sans">
                      <p className="text-[11px] text-white/50 leading-relaxed pl-0.5">
                        {t("security_intro_text", "Your messages and calls are end-to-end encrypted. No one outside of this chat, not even MYCHATBOX, can read or listen to them.")}
                      </p>

                      {/* Toggle notification */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm">
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="text-xs font-bold">{t("security_toggle_title", "Show security notifications on this device")}</p>
                          <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
                            {t("security_toggle_desc", "Get notified when your security code changes for a contact's phone.")}
                          </p>
                        </div>
                        <div
                          onClick={() => setShowSecurityNotifs(!showSecurityNotifs)}
                          className={`w-9 h-5 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 shrink-0 ${showSecurityNotifs ? "bg-[#7c5dfa] justify-end" : "bg-white/10 justify-start"
                            }`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>

                      <div className="h-px bg-white/5"></div>

                      {/* Email Verification status card */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                        <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("security_email_verification_title", "Account Protection")}</h4>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/70">{t("blank_status", "Status")}</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> {t("profile_status_value_verified", "Verified")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/70">{t("security_verified_address_label", "Verified Email")}</span>
                          <span className="font-mono text-white/50 text-[10px] truncate max-w-[180px]">{currentUser?.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW C2: TWO-STEP VERIFICATION VIEW */}
                {settingsView === "two-step" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421]">
                    <div className="p-5 space-y-5 text-left font-sans">
                      <p className="text-[11px] text-white/50 leading-relaxed pl-0.5">
                        {t("two_step_intro_text", "For extra security, enable two-step verification to require a PIN when registering your phone number again.")}
                      </p>

                      {/* Toggle two-step */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm">
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="text-xs font-bold">{t("two_step_verification", "Two-step verification")}</p>
                          <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
                            {t("two_step_toggle_desc", "Require a PIN when accessing your account on new devices.")}
                          </p>
                        </div>
                        <div
                          onClick={() => setIsTwoStepEnabled(!isTwoStepEnabled)}
                          className={`w-9 h-5 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 shrink-0 ${isTwoStepEnabled ? "bg-[#7c5dfa] justify-end" : "bg-white/10 justify-start"
                            }`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW E: CHATS SETTINGS VIEW AS IMAGE 2 */}
                {settingsView === "chats" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in">

                    <div className="p-5 pb-36 space-y-6">
                      {/* Display options */}
                      <div className="space-y-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">{t("settings_display")}</div>


                        {/* Default chat theme/wallpaper link */}
                        <button
                          type="button"
                          onClick={() => setSettingsView("wallpaper")}
                          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-left hover:bg-white/[0.05] transition-all cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">{t("settings_default_wallpaper")}</p>
                            <p className="text-[10px] text-white/45 mt-0.5">{t("settings_default_wallpaper_desc")}</p>
                          </div>
                          <span className="text-[10px] text-[#7c5dfa] font-bold">{t("change_action")} ›</span>
                        </button>
                        <button
                          onClick={() => setSettingsView("chat-theme")}
                          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-left hover:bg-white/[0.05] transition-all cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">{t("settings_default_chat_theme")}</p>
                            <p className="text-[10px] text-white/45 mt-0.5">{t("settings_default_chat_theme_desc")}</p>
                          </div>
                          <span className="text-[10px] text-[#7c5dfa] font-bold">{t("change_action")} ›</span>
                        </button>
                      </div>


                      {/* Chat settings toggles matching Image 2 */}
                      <div className="space-y-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">{t("settings_chats")}</div>

                        {/* Keep chats archived toggle */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">{t("settings_keep_chats_archived") || "Keep chats archived"}</p>
                            <p className="text-[10px] text-white/45 mt-0.5">{t("settings_keep_chats_archived_desc") || "Archived chats will remain archived when you receive a new message"}</p>
                          </div>
                          <div
                            onClick={() => {
                              const val = !keepChatsArchived;
                              setKeepChatsArchived(val);
                              localStorage.setItem("pref_keepChatsArchived", String(val));
                            }}
                            className={`w-8 h-4 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 ${keepChatsArchived ? "bg-[#7c5dfa] justify-end" : "bg-white/10 justify-start"}`}
                          >
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">{t("settings_media_visibility")}</p>
                            <p className="text-[10px] text-white/45 mt-0.5">{t("settings_media_visibility_desc")}</p>
                          </div>
                          <div
                            onClick={() => {
                              const val = !mediaVisibility;
                              setMediaVisibility(val);
                              localStorage.setItem("pref_mediaVisibility", String(val));
                            }}
                            className={`w-8 h-4 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 ${mediaVisibility ? "bg-[#7c5dfa] justify-end" : "bg-white/10 justify-start"}`}
                          >
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>




                        {/* Enter is send */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">
                              {t("enter_is_send", "Enter is send")}
                            </p>
                            <p className="text-[10px] text-white/45 mt-0.5">
                              {t(
                                "enter_is_send_subtext",
                                "Enter key will send your message"
                              )}
                            </p>
                          </div>

                          <div
                            onClick={() => {
                              const val = !enterIsSend;
                              setEnterIsSend(val);
                              localStorage.setItem("pref_enterIsSend", String(val));
                            }}
                            className={`w-8 h-4 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 ${enterIsSend
                              ? "bg-[#7c5dfa] justify-end"
                              : "bg-white/10 justify-start"
                              }`}
                          >
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>

                        {/* Media upload quality */}
                        <div
                          onClick={cycleMediaQuality}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">
                              {t("media_upload_quality", "Media upload quality")}
                            </p>
                            <p className="text-[10px] text-white/45 mt-0.5">
                              {mediaUploadQuality}
                            </p>
                          </div>

                          <ChevronRight className="w-4 h-4 text-white/30" />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">{t("settings_font_size")}</p>
                            <p className="text-[10px] text-white/45 mt-0.5">{t("settings_font_size_desc")}</p>
                          </div>
                          <CustomSelect
                            value={fontSize}
                            onChange={(val) => {
                              setFontSize(val);
                              localStorage.setItem("pref_fontSize", val);
                            }}
                            options={[
                              { value: "small", label: t("font_size_small") || "Small" },
                              { value: "medium", label: t("font_size_medium") || "Medium" },
                              { value: "large", label: t("font_size_large") || "Large" },
                            ]}
                          />
                        </div>
                      </div>

                      {/* Theme section */}
                      <div className="space-y-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">{t("theme")}</div>
                        <div className="flex items-center justify-between  rounded-2xl">
                          <div className="flex gap-2 w-full">
                            {[
                              { id: "dark", label: t("themeDark") || "Dark" },
                              { id: "light", label: t("themeLight") || "Light" },
                              { id: "system", label: t("themeSystemDefault") || "System Default" }
                            ].map((themeItem) => (
                              <button
                                key={themeItem.id}
                                type="button"
                                onClick={() => changeTheme(themeItem.id)}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center font-sans settings-theme-btn ${theme === themeItem.id
                                  ? "border-[#7c5dfa] bg-[#7c5dfa]/10 theme-btn-active"
                                  : "border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"
                                  }`}
                              >
                                {themeItem.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW F: PRIVACY SETTINGS VIEW */}
                {settingsView === "privacy" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-4 space-y-5">
                    {/* Section 1: Who can see my personal info */}
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-white/40 tracking-wide pl-1 pb-1">
                        {t("who_can_see_my_personal_info", "Who can see my personal info")}
                      </h3>

                      <div
                        className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                        onClick={() => setSettingsView("privacy-last-seen")}
                      >
                        <div>
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("last_seen_and_online", "Last seen and online")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{lastSeenVisibility}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70" />
                      </div>

                      <div
                        className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                        onClick={() => setSettingsView("privacy-profile-pic")}
                      >
                        <div>
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("profile_picture", "Profile picture")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{profilePicVisibility}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70" />
                      </div>

                      <div
                        className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                        onClick={() => setSettingsView("privacy-about")}
                      >
                        <div>
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("about", "About")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{aboutVisibility}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70" />
                      </div>

                      <div
                        className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                        onClick={() => setSettingsView("privacy-status")}
                      >
                        <div>
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("status", "Status")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{statusVisibility}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70" />
                      </div>

                      <div className="h-px bg-white/5 my-2"></div>

                      {/* Read receipts */}
                      <div className="p-3.5 rounded-xl flex items-start justify-between gap-4 hover:bg-white/5 transition-all">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-medium text-white/90">{t("read_receipts", "Read receipts")}</p>
                          <p className="text-xs text-white/45 mt-1 leading-relaxed">
                            {t("read_receipts_subtext", "If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.")}
                          </p>
                        </div>
                        <div
                          onClick={() => {
                            const val = !readReceipts;
                            setReadReceipts(val);
                            localStorage.setItem("pref_readReceipts", String(val));
                            savePrivacyOption("read_receipts", val);
                          }}
                          className={`w-9 h-5 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 shrink-0 mt-0.5 ${readReceipts ? "bg-[#7c5dfa] justify-end" : "bg-white/10 justify-start"
                            }`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Disappearing messages */}
                    <div className="space-y-1 pt-1">
                      <h3 className="text-xs font-bold text-white/40 tracking-wide pl-1 pb-1">
                        {t("disappearing_messages", "Disappearing messages")}
                      </h3>

                      <div
                        className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                        onClick={() => setSettingsView("disappearing-messages")}
                      >
                        <div>
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("default_message_timer", "Default message timer")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{disappearingTimer}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70" />
                      </div>
                    </div>

                    {/* Section 3: Groups, Blocked, App lock */}
                    <div className="space-y-1 pt-1">
                      <div
                        className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                        onClick={() => setSettingsView("privacy-groups")}
                      >
                        <div>
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("groups", "Groups")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{groupPrivacy}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70" />
                      </div>

                      <div className="h-px bg-white/5"></div>

                      <div
                        className="flex items-center justify-between p-3.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                        onClick={() => {
                          setSettingsView("blocked-users");
                          loadBlockedUsersList();
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("blocked_contacts", "Blocked contacts")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{blockedUsers.length || "0"}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70" />
                      </div>

                    </div>
                  </div>
                )}

                {/* VIEW F1: PRIVACY SUB-PAGE: LAST SEEN */}
                {settingsView === "privacy-last-seen" && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-5">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">
                        {t("who_can_see_my_last_seen", "Who can see my Last Seen")}
                      </h3>
                      <div className="space-y-1">
                        {["Everyone", "My contacts", "Nobody"].map((opt) => (
                          <div
                            key={opt}
                            onClick={() => {
                              setLastSeenVisibility(opt);
                              localStorage.setItem("pref_lastSeen", opt);
                              savePrivacyOption("last_seen", opt);
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${lastSeenVisibility === opt ? "bg-white/5" : "hover:bg-white/5"
                              }`}
                          >
                            <span className="text-sm font-medium text-white/90">{opt === "Everyone" ? t("opt_everyone", "Everyone") : opt === "My contacts" ? t("opt_my_contacts", "My contacts") : t("opt_nobody", "Nobody")}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${lastSeenVisibility === opt ? "border-[#7c5dfa] bg-[#7c5dfa]" : "border-white/30"}`}>
                              {lastSeenVisibility === opt && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed pl-1 pt-2">
                        {t("last_seen_subtext", "If you don't share your Last Seen, you won't be able to see other people's Last Seen.")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsView("privacy")}
                      className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-6"
                    >
                      {t("done_action", "DONE")}
                    </button>
                  </div>
                )}

                {/* VIEW F2: PRIVACY SUB-PAGE: PROFILE PIC */}
                {settingsView === "privacy-profile-pic" && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-5">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">
                        {t("who_can_see_my_profile_photo", "Who can see my Profile Photo")}
                      </h3>
                      <div className="space-y-1">
                        {["Everyone", "My contacts", "Nobody"].map((opt) => (
                          <div
                            key={opt}
                            onClick={() => {
                              setProfilePicVisibility(opt);
                              localStorage.setItem("pref_profilePic", opt);
                              savePrivacyOption("profile_pic", opt);
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${profilePicVisibility === opt ? "bg-white/5" : "hover:bg-white/5"
                              }`}
                          >
                            <span className="text-sm font-medium text-white/90">{opt === "Everyone" ? t("opt_everyone", "Everyone") : opt === "My contacts" ? t("opt_my_contacts", "My contacts") : t("opt_nobody", "Nobody")}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${profilePicVisibility === opt ? "border-[#7c5dfa] bg-[#7c5dfa]" : "border-white/30"}`}>
                              {profilePicVisibility === opt && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsView("privacy")}
                      className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-6"
                    >
                      {t("done_action", "DONE")}
                    </button>
                  </div>
                )}

                {/* VIEW F3: PRIVACY SUB-PAGE: ABOUT */}
                {settingsView === "privacy-about" && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-5">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">
                        {t("who_can_see_my_about", "Who can see my About")}
                      </h3>
                      <div className="space-y-1">
                        {["Everyone", "My contacts", "Nobody"].map((opt) => (
                          <div
                            key={opt}
                            onClick={() => {
                              setAboutVisibility(opt);
                              localStorage.setItem("pref_about", opt);
                              savePrivacyOption("about", opt);
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${aboutVisibility === opt ? "bg-white/5" : "hover:bg-white/5"
                              }`}
                          >
                            <span className="text-sm font-medium text-white/90">{opt === "Everyone" ? t("opt_everyone", "Everyone") : opt === "My contacts" ? t("opt_my_contacts", "My contacts") : t("opt_nobody", "Nobody")}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${aboutVisibility === opt ? "border-[#7c5dfa] bg-[#7c5dfa]" : "border-white/30"}`}>
                              {aboutVisibility === opt && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsView("privacy")}
                      className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-6"
                    >
                      {t("done_action", "DONE")}
                    </button>
                  </div>
                )}

                {/* VIEW F4: PRIVACY SUB-PAGE: STATUS (EXACTLY MATCHING SCREENSHOT 1 RIGHT SIDE) */}
                {settingsView === "privacy-status" && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-5">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">
                        {t("who_can_see_my_status_updates", "Who can see my status updates")}
                      </h3>
                      <div className="space-y-1">
                        {[
                          { label: t("opt_my_contacts", "My contacts"), val: "My contacts" },
                          { label: t("opt_my_contacts_except", "My contacts except..."), val: "My contacts except..." },
                          { label: t("opt_only_share_with", "Only share with..."), val: "Only share with..." }
                        ].map((item) => (
                          <div
                            key={item.val}
                            onClick={() => {
                              setStatusVisibility(item.val);
                              localStorage.setItem("pref_statusVis", item.val);
                              savePrivacyOption("status", item.val);
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${statusVisibility === item.val ? "bg-white/5" : "hover:bg-white/5"
                              }`}
                          >
                            <span className="text-sm font-medium text-white/90">{item.label}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${statusVisibility === item.val ? "border-[#7c5dfa] bg-[#7c5dfa]" : "border-white/30"}`}>
                              {statusVisibility === item.val && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed pl-1 pt-2">
                        Changes to your privacy settings won't affect status updates that you've sent already.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsView("privacy")}
                      className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-6"
                    >
                      {t("done_action", "DONE")}
                    </button>
                  </div>
                )}

                {/* VIEW F5: PRIVACY SUB-PAGE: GROUPS */}
                {settingsView === "privacy-groups" && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-5">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">
                        {t("who_can_add_me_to_groups", "Who can add me to groups")}
                      </h3>
                      <div className="space-y-1">
                        {["Everyone", "My contacts", "Nobody"].map((opt) => (
                          <div
                            key={opt}
                            onClick={() => {
                              setGroupPrivacy(opt);
                              localStorage.setItem("pref_groupPrivacy", opt);
                              savePrivacyOption("groups", opt);
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${groupPrivacy === opt ? "bg-white/5" : "hover:bg-white/5"
                              }`}
                          >
                            <span className="text-sm font-medium text-white/90">{opt === "Everyone" ? t("opt_everyone", "Everyone") : opt === "My contacts" ? t("opt_my_contacts", "My contacts") : t("opt_nobody", "Nobody")}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${groupPrivacy === opt ? "border-[#7c5dfa] bg-[#7c5dfa]" : "border-white/30"}`}>
                              {groupPrivacy === opt && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsView("privacy")}
                      className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-6"
                    >
                      {t("done_action", "DONE")}
                    </button>
                  </div>
                )}

                {/* VIEW F6: DISAPPEARING MESSAGES SUB-PAGE */}
                {settingsView === "disappearing-messages" && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-5">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">
                        {t("default_message_timer", "Default message timer")}
                      </h3>
                      <p className="text-xs text-white/50 leading-relaxed pl-1">
                        {t("disappearing_messages_desc", "New messages will disappear after chosen duration.")}
                      </p>
                      <div className="space-y-1 pt-2">
                        {[
                          { id: "off", label: t("timer_off", "Off") },
                          { id: "24h", label: t("timer_24h", "24 hours") },
                          { id: "7d", label: t("timer_7d", "7 days") },
                          { id: "90d", label: t("timer_90d", "90 days") }
                        ].map((timer) => (
                          <div
                            key={timer.id}
                            onClick={() => {
                              setDisappearingTimer(timer.label);
                              localStorage.setItem("pref_disappearingTimer", timer.label);
                              localStorage.setItem("pref_disappearing_duration", timer.id);
                              if (setDisappearingDuration) setDisappearingDuration(timer.id);
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${disappearingTimer === timer.label ? "bg-white/5" : "hover:bg-white/5"
                              }`}
                          >
                            <span className="text-sm font-medium text-white/90">{timer.label}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${disappearingTimer === timer.label ? "border-[#7c5dfa] bg-[#7c5dfa]" : "border-white/30"}`}>
                              {disappearingTimer === timer.label && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsView("privacy")}
                      className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-6"
                    >
                      {t("done_action", "DONE")}
                    </button>
                  </div>
                )}

                {/* VIEW FG: BLOCKED USERS SETTINGS VIEW */}
                {settingsView === "blocked-users" && (
                  <div className="flex-1 flex flex-col overflow-hidden text-white animate-fade-in bg-[#161421]">
                    {blockedLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#161421] text-xs text-white/30 gap-2.5 z-50">
                        <span className="w-6 h-6 border-2 border-[#7c5dfa] border-t-transparent rounded-full animate-spin"></span>
                        <span>{t("blocked_loading_users", "Loading blocked users...")}</span>
                      </div>
                    ) : blockedUsers.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/30 text-xs select-none">
                        <Shield className="w-8 h-8 text-white/10 mb-2" />
                        {t("blocked_no_users", "No blocked users")}
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3">
                        {blockedUsers.map((user) => {
                          const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User";
                          const initials = user.first_name ? user.first_name.charAt(0).toUpperCase() : "?";
                          return (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-[#27243c] flex items-center justify-center font-bold text-xs shrink-0 select-none border border-white/5 overflow-hidden">
                                  {user.profile_image ? (
                                    <img
                                      src={user.profile_image}
                                      alt="avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    initials
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate">{name}</p>
                                  <p className="text-[10px] text-white/40 truncate mt-0.5">{user.mobile || user.email}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={unblockingUserId === user.id}
                                onClick={() => handleUnblockUser(user.id)}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 hover:text-red-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-red-500/10 flex items-center gap-1.5"
                              >
                                {unblockingUserId === user.id && (
                                  <span className="w-2.5 h-2.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin shrink-0"></span>
                                )}
                                {t("blocked_unblock_button", "Unblock")}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW G: NOTIFICATIONS SETTINGS VIEW */}
                {settingsView === "notifications" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-4 space-y-5">
                    {/* Section 1: Messages */}
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-white/40 tracking-wide pl-1 pb-1">
                        {t("messages", "Messages")}
                      </h3>

                      {/* Message notifications */}
                      <div className="p-3.5 rounded-xl flex items-center justify-between gap-4 hover:bg-white/5 transition-all">
                        <div>
                          <p className="text-sm font-medium text-white/90">{t("message_notifications", "Message notifications")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{t("message_notifications_subtext", "Show notifications for new messages")}</p>
                        </div>
                        <div
                          onClick={() => {
                            const val = !messageNotifications;
                            setMessageNotifications(val);
                            localStorage.setItem("pref_msgNotif", String(val));
                            if (val && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                              Notification.requestPermission();
                            }
                          }}
                          className={`w-9 h-5 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 shrink-0 ${messageNotifications ? "bg-[#7c5dfa] justify-end" : "bg-white/10 justify-start"
                            }`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl flex items-center justify-between gap-4 hover:bg-white/5 transition-all">
                        <p className="text-sm font-medium text-white/90">{t("show_reaction_notifications", "Show reaction notifications")}</p>
                        <div
                          onClick={() => {
                            const val = !reactionNotifications;
                            setReactionNotifications(val);
                            localStorage.setItem("pref_reactionNotif", String(val));
                          }}
                          className={`w-9 h-5 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 shrink-0 ${reactionNotifications ? "bg-[#7c5dfa] justify-end" : "bg-white/10 justify-start"
                            }`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Notification tones */}
                    <div className="space-y-1 pt-1">
                      <h3 className="text-xs font-bold text-white/40 tracking-wide pl-1 pb-1">
                        {t("notification_tones", "Notification tones")}
                      </h3>

                      <div className="p-3.5 rounded-xl flex items-center justify-between gap-4 hover:bg-white/5 transition-all">
                        <div>
                          <p className="text-sm font-medium text-white/90">{t("incoming_sounds", "Incoming sounds")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{t("incoming_sounds_subtext", "Play sounds for incoming messages")}</p>
                        </div>
                        <div
                          onClick={() => {
                            const val = !incomingSounds;
                            setIncomingSounds(val);
                            localStorage.setItem("pref_incomingSounds", String(val));
                            if (val && typeof window !== "undefined") {
                              try {
                                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                                if (AudioCtx) {
                                  const ctx = new AudioCtx();
                                  const osc1 = ctx.createOscillator();
                                  const gain1 = ctx.createGain();
                                  osc1.type = "sine";
                                  osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
                                  gain1.gain.setValueAtTime(0.15, ctx.currentTime);
                                  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                                  osc1.connect(gain1); gain1.connect(ctx.destination);
                                  osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.15);

                                  const osc2 = ctx.createOscillator();
                                  const gain2 = ctx.createGain();
                                  osc2.type = "sine";
                                  osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
                                  gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.08);
                                  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                                  osc2.connect(gain2); gain2.connect(ctx.destination);
                                  osc2.start(ctx.currentTime + 0.08); osc2.stop(ctx.currentTime + 0.3);
                                }
                              } catch (e) { }
                            }
                          }}
                          className={`w-9 h-5 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 shrink-0 ${incomingSounds ? "bg-[#7c5dfa] justify-end" : "bg-white/10 justify-start"
                            }`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl flex items-center justify-between gap-4 hover:bg-white/5 transition-all">
                        <div>
                          <p className="text-sm font-medium text-white/90">{t("outgoing_sounds", "Outgoing sounds")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{t("outgoing_sounds_subtext", "Play sounds for outgoing messages")}</p>
                        </div>
                        <div
                          onClick={() => {
                            const val = !outgoingSounds;
                            setOutgoingSounds(val);
                            localStorage.setItem("pref_outgoingSounds", String(val));
                            if (val && typeof window !== "undefined") {
                              try {
                                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                                if (AudioCtx) {
                                  const ctx = new AudioCtx();
                                  const osc = ctx.createOscillator();
                                  const gain = ctx.createGain();
                                  osc.type = "sine";
                                  osc.frequency.setValueAtTime(440, ctx.currentTime);
                                  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
                                  gain.gain.setValueAtTime(0.12, ctx.currentTime);
                                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
                                  osc.connect(gain); gain.connect(ctx.destination);
                                  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06);
                                }
                              } catch (e) { }
                            }
                          }}
                          className={`w-9 h-5 rounded-full p-0.5 cursor-pointer flex transition-all duration-300 shrink-0 ${outgoingSounds ? "bg-[#7c5dfa] justify-end" : "bg-white/10 justify-start"
                            }`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsView === "help" && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-4 min-h-[500px]">
                    <div className="space-y-1">
                      {/* 1. Help Centre */}
                      <button
                        type="button"
                        onClick={() => setSettingsView("faq")}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/5 transition-all text-left group cursor-pointer"
                      >
                        <HelpCircle className="w-5 h-5 text-white/70 group-hover:text-white shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("help_centre", "Help Centre")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{t("faq_subtext", "Frequently asked questions")}</p>
                        </div>
                      </button>

                      {/* 2. Contact us */}
                      <button
                        type="button"
                        onClick={() => setSettingsView("contact-us")}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/5 transition-all text-left group cursor-pointer"
                      >
                        <MessageSquare className="w-5 h-5 text-white/70 group-hover:text-white shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("contact_us", "Contact us")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{t("contact_us_subtext", "Chat with support to get answers")}</p>
                        </div>
                      </button>

                      {/* 3. Send feedback */}
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackMessage("");
                          setFeedbackSuccess(false);
                          setSettingsView("send-feedback");
                        }}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/5 transition-all text-left group cursor-pointer"
                      >
                        <Bug className="w-5 h-5 text-white/70 group-hover:text-white shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("send_feedback", "Send feedback")}</p>
                          <p className="text-xs text-white/45 mt-0.5">{t("send_feedback_subtext", "Technical issues, suggestions")}</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettingsView("app-info")}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl hover:bg-white/5 transition-all text-left group cursor-pointer"
                      >
                        <FileText className="w-5 h-5 text-white/70 group-hover:text-white shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 group-hover:text-white">{t("terms_privacy_policy", "Terms and Privacy Policy")}</p>
                        </div>
                      </button>
                    </div>

                    <div className="pt-8 pb-4 text-center text-white/30 text-xs font-normal">
                      Version 2.3000.1043449446
                    </div>
                  </div>
                )}

                {settingsView === "send-feedback" && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-5">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!feedbackMessage.trim()) return;
                        setFeedbackSubmitting(true);
                        try {
                          const res = await sendStarFeedback(
                            feedbackRating,
                            feedbackMessage.trim(),
                            feedbackType
                          );
                          if (res.success) {
                            setFeedbackSuccess(true);
                            setFeedbackMessage("");
                            setFeedbackRating(5);
                            setTimeout(() => {
                              setFeedbackSuccess(false);
                              setSettingsView("help");
                            }, 2500);
                          }
                        } catch (err) {
                          console.error("Failed to send feedback:", err);
                        } finally {
                          setFeedbackSubmitting(false);
                        }
                      }}
                      className="space-y-4 flex-1 flex flex-col"
                    >
                      <div className="space-y-4 flex-1">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">
                          {t("feedback_title", "Send Feedback")}
                        </h3>

                        {feedbackSuccess && (
                          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
                            {t("feedback_success_msg", "Thank you! Your feedback has been submitted.")}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-0.5">
                            {t("feedback_type_label", "Feedback Type")}
                          </label>
                          <div className="flex items-center gap-2">
                            {["general", "bug", "feature"].map((typeOpt) => (
                              <button
                                key={typeOpt}
                                type="button"
                                onClick={() => setFeedbackType(typeOpt)}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${feedbackType === typeOpt ? "bg-[#7c5dfa] text-white border-[#7c5dfa]" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"}`}
                              >
                                {typeOpt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-0.5">
                            {t("feedback_rating_label", "Rating")}
                          </label>
                          <div className="flex items-center justify-center gap-1.5 py-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setFeedbackStarHover(star)}
                                onMouseLeave={() => setFeedbackStarHover(0)}
                                onClick={() => setFeedbackRating(star)}
                                className="p-1 transition-transform active:scale-90 cursor-pointer bg-transparent border-none"
                              >
                                <Star
                                  className={`w-7 h-7 transition-colors ${(feedbackStarHover || feedbackRating) >= star
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-white/10"
                                    }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5 flex-1 flex flex-col">
                          <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider pl-0.5">
                            {t("feedback_desc_label", "Description")}
                          </label>
                          <textarea
                            rows={5}
                            required
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            placeholder={t("feedback_desc_placeholder", "Describe the issue or suggestion in detail...")}
                            className="w-full bg-[#201d2d] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:border-[#7c5dfa]/80 outline-none resize-none"
                          ></textarea>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={feedbackSubmitting || !feedbackMessage.trim()}
                        className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-4 flex items-center justify-center gap-2"
                      >
                        {feedbackSubmitting && (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        )}
                        {t("submit_button", "Submit")}
                      </button>
                    </form>
                  </div>
                )}


                {settingsView === "updates" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in">
                  </div>
                )}

                {settingsView === "language" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in">

                    <div className="p-5 space-y-4">
                      <p className="text-[11px] text-white/40 leading-relaxed px-1">
                        {t("settings_language_desc")}
                      </p>

                      <div className="space-y-2.5">
                        {[
                          { code: "en", name: t("lang_en"), sub: t("lang_en_sub") },
                          { code: "hi", name: t("lang_hi"), sub: t("lang_hi_sub") },
                          { code: "gu", name: t("lang_gu"), sub: t("lang_gu_sub") },
                        ].map((lang) => {
                          const savedLang = typeof window !== "undefined" ? localStorage.getItem("appLanguage") || "en" : "en";
                          const isSelected = savedLang === lang.code;
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                localStorage.setItem("appLanguage", lang.code);
                                if (typeof window !== "undefined") {
                                  window.dispatchEvent(new Event("languageChanged"));
                                }
                                const msg = t("success_language_saved") || "Language preference saved!";
                                setSettingsTip(msg);
                                if (setStatusTip) setStatusTip(msg);
                                setTimeout(() => {
                                  setSettingsTip("");
                                  if (setStatusTip) setStatusTip("");
                                }, 3000);
                              }}
                              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${isSelected
                                ? "bg-[#7c5dfa]/15 border-[#7c5dfa] text-white"
                                : "bg-white/[0.02] border-white/5 text-white/80 hover:bg-white/[0.04]"
                                }`}
                            >
                              <div>
                                <p className="text-xs font-bold">{lang.name}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">{lang.sub}</p>
                              </div>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-[#7c5dfa] flex items-center justify-center text-white">
                                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {settingsView === "faq" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421]">
                    <div className="p-4 space-y-3">
                      <p className="text-[11px] text-white/40 leading-relaxed px-1">
                        {t("help_faq_intro")}
                      </p>

                      <div className="space-y-3 font-sans">
                        {[
                          { q: t("faq_q1"), a: t("faq_a1") },
                          { q: t("faq_q2"), a: t("faq_a2") },
                          { q: t("faq_q3"), a: t("faq_a3") },
                          { q: t("faq_q4"), a: t("faq_a4") },
                          { q: t("faq_q5"), a: t("faq_a5") },
                          { q: t("faq_q6"), a: t("faq_a6") },
                          { q: t("faq_q7"), a: t("faq_a7") },
                          { q: t("faq_q8"), a: t("faq_a8") }
                        ].map((faq, idx) => {
                          const isOpen = openFaqIndex === idx;
                          return (
                            <div
                              key={idx}
                              className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden select-none transition-all duration-200"
                            >
                              <button
                                type="button"
                                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                className="w-full p-4 flex items-center justify-between text-xs font-bold cursor-pointer hover:bg-white/[0.04] transition-colors text-left outline-none"
                              >
                                <span>{faq.q}</span>
                                <span className={`text-[10px] text-[#9f85ff] font-bold shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                                  ▼
                                </span>
                              </button>

                              {isOpen && (
                                <div className="p-4 pt-2 text-[10px] text-white/60 leading-relaxed border-t border-white/[0.02] bg-black/10 animate-fade-in">
                                  {faq.a}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {settingsView === "contact-us" && (
                  <div className="flex-1 flex flex-col overflow-hidden text-white animate-fade-in bg-[#161421]">
                    <div className="flex-1 overflow-y-auto no-scrollbar p-5">
                      {contactSuccess ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-10">
                          <div className="w-16 h-16 bg-[#10b981]/15 border border-[#10b981]/30 rounded-full flex items-center justify-center text-[#10b981] animate-bounce">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-sm font-bold text-white">{t("contact_success_title")}</h3>
                          <p className="text-[11px] text-white/50 max-w-[200px] leading-relaxed">
                            {t("contact_success_desc")}
                          </p>
                          <button
                            onClick={() => {
                              setContactSuccess(false);
                              setSettingsView("help");
                            }}
                            className="px-4 py-2 bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all font-sans"
                          >
                            {t("contact_back_to_help")}
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!contactSubject.trim() || !contactMessage.trim()) return;
                            setContactSubmitting(true);
                            try {
                              const response = await api.post("/profile/contact-us", {
                                name: contactName,
                                mobile: contactPhone,
                                subject: contactSubject,
                                message: contactMessage
                              });
                              const data = response.data;
                              if (data.success || response.status === 200 || response.status === 201) {
                                setContactSuccess(true);
                                setContactSubject("");
                                setContactMessage("");
                              } else {
                                setSettingsTip(data.message || "Failed to submit request.");
                                setTimeout(() => setSettingsTip(""), 4000);
                              }
                            } catch (err) {
                              console.error(err);
                              // Fallback client-side simulated success if API endpoint is missing/offline
                              setContactSuccess(true);
                              setContactSubject("");
                              setContactMessage("");
                            } finally {
                              setContactSubmitting(false);
                            }
                          }}
                          className="space-y-4 font-sans"
                        >
                          <p className="text-[11px] text-white/40 leading-relaxed pl-0.5">
                            {t("contact_form_intro")}
                          </p>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("contact_name_placeholder")}</label>
                            <input
                              type="text"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder={t("contact_name_placeholder")}
                              required
                              className="w-full bg-white/[0.02] border border-white/5 focus:border-[#7c5dfa] rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 transition-all outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("contact_phone_or_email_label")}</label>
                            <input
                              type="text"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              placeholder={t("contact_phone_or_email_label")}
                              required
                              className="w-full bg-white/[0.02] border border-white/5 focus:border-[#7c5dfa] rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 transition-all outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("contact_subject")}</label>
                            <input
                              type="text"
                              value={contactSubject}
                              onChange={(e) => setContactSubject(e.target.value)}
                              placeholder={t("contact_subject_placeholder")}
                              required
                              className="w-full bg-white/[0.02] border border-white/5 focus:border-[#7c5dfa] rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 transition-all outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-0.5">{t("contact_message")}</label>
                            <textarea
                              rows={4}
                              value={contactMessage}
                              onChange={(e) => setContactMessage(e.target.value)}
                              placeholder={t("contact_message_placeholder")}
                              required
                              className="w-full bg-white/[0.02] border border-white/5 focus:border-[#7c5dfa] rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 transition-all resize-none outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={contactSubmitting}
                            className="w-full py-2.5 bg-[#7c5dfa] hover:bg-[#684ce2] disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-1.5 font-sans"
                          >
                            {contactSubmitting && (
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            )}
                            {t("contact_send_button")}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {settingsView === "app-info" && (
                  <div className="flex-1 flex flex-col overflow-hidden text-white animate-fade-in bg-[#161421]">
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 text-center space-y-6">
                      <div className="flex flex-col items-center space-y-3 py-4">
                        <div className="w-18 h-18 bg-[#7c5dfa] rounded-3xl flex items-center justify-center shadow-lg relative animate-pulse">
                          <MessageSquare className="w-10 h-10 text-white animate-spin [animation-duration:10s]" />
                          <div className="absolute inset-0 rounded-3xl border-2 border-white/10"></div>
                        </div>
                        <div>
                          <h2 className="text-base font-black text-white tracking-wide font-sans">MYCHATBOX</h2>
                          <p className="text-[10px] text-[#9f85ff] font-bold tracking-widest uppercase mt-0.5 font-sans">Version 1.2.0 (Stable)</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-left font-sans animate-fade-in">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                          <h3 className="text-xs font-bold text-white">{t("app_info_what_is")}</h3>
                          <p className="text-[11px] text-white/50 leading-relaxed">
                            {t("app_info_what_is_desc")}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                          <h3 className="text-xs font-bold text-white">{t("app_info_purpose")}</h3>
                          <ul className="text-[10px] text-white/50 space-y-2 leading-relaxed">
                            <li className="flex items-start gap-2">
                              <span className="text-[#9f85ff] font-bold">•</span>
                              <span><strong>{t("app_info_feat_delivery_title")}:</strong> {t("app_info_feat_delivery_desc")}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#9f85ff] font-bold">•</span>
                              <span><strong>{t("app_info_feat_media_title")}:</strong> {t("app_info_feat_media_desc")}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#9f85ff] font-bold">•</span>
                              <span><strong>{t("app_info_feat_collab_title")}:</strong> {t("app_info_feat_collab_desc")}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#9f85ff] font-bold">•</span>
                              <span><strong>{t("app_info_feat_privacy_title")}:</strong> {t("app_info_feat_privacy_desc")}</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <p className="text-[9px] text-white/30 pt-4 font-sans">{t("app_info_copyright")}</p>
                    </div>
                  </div>
                )}

                {settingsView === "updates" && (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar text-white animate-fade-in bg-[#161421] p-5">
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-500/15 text-indigo-400 rounded-xl">
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">MYCHATBOX Desktop & Web</h4>
                            <p className="text-[10px] text-emerald-400 font-bold">You are on the latest version (v1.2.0)</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-white/50 leading-relaxed">
                          Auto-updates ensure you always have access to the latest security features, end-to-end chat encryption, and real-time messaging performance.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsView("menu")}
                      className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-6"
                    >
                      {t("ok_action", "OK")}
                    </button>
                  </div>
                )}

                {settingsView === "features-guide" && (
                  <div className="flex-1 flex flex-col overflow-hidden text-white animate-fade-in bg-[#161421]">
                    <div className="flex-1 overflow-y-auto no-scrollbar p-5 pt-0 space-y-4">
                      <p className="text-[11px] text-white/45 leading-relaxed pl-0.5 font-sans">
                        {t("features_guide_intro")}
                      </p>

                      <div className="space-y-3 font-sans">
                        {[
                          {
                            title: t("feature_edit_messages_title"),
                            desc: t("feature_edit_messages_desc")
                          },
                          {
                            title: t("feature_delete_for_everyone_title"),
                            desc: t("feature_delete_for_everyone_desc")
                          },
                          {
                            title: t("feature_disappearing_messages_title"),
                            desc: t("feature_disappearing_messages_desc")
                          },
                          {
                            title: t("feature_polls_voting_title"),
                            desc: t("feature_polls_voting_desc")
                          },
                          {
                            title: t("feature_event_scheduling_title"),
                            desc: t("feature_event_scheduling_desc")
                          },
                          {
                            title: t("feature_custom_themes_title"),
                            desc: t("feature_custom_themes_desc")
                          }
                        ].map((feat, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 text-left hover:bg-white/[0.04] transition-colors">
                            <h3 className="text-xs font-bold text-white flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7c5dfa]"></span>
                              {feat.title}
                            </h3>
                            <p className="text-[10px] text-white/50 leading-relaxed pl-3.5">
                              {feat.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {settingsView === "chat-theme" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-5 space-y-6 text-white animate-fade-in">
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider pl-0.5">{t("chat_themes_title", "Themes")}</p>

                      <div className="grid grid-cols-4 gap-2.5">
                        {[
                          { id: "default", name: "Default Clean", color: "#7c5dfa", wallpaper: "", previewBg: "linear-gradient(135deg, #181627 0%, #110f1d 100%)" },
                          { id: "peachy_bloom", name: "Peachy Bloom", color: "#ec4899", wallpaper: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)" },
                          { id: "ocean_waves", name: "Ocean Waves", color: "#06b6d4", wallpaper: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #a5f3fc 0%, #06b6d4 100%)" },
                          { id: "sky_horizon", name: "Sky Horizon", color: "#3b82f6", wallpaper: "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #bfdbfe 0%, #3b82f6 100%)" },
                          { id: "lilac_holographic", name: "Lilac Iridescent", color: "#a855f7", wallpaper: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #e9d5ff 0%, #a855f7 100%)" },
                          { id: "golden_sunset", name: "Golden Sunset", color: "#f97316", wallpaper: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #ffedd5 0%, #f97316 100%)" },
                          { id: "rose_quartz", name: "Rose Quartz", color: "#f43f5e", wallpaper: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #fecdd3 0%, #f43f5e 100%)" },
                          { id: "tropical_palms", name: "Tropical Palms", color: "#10b981", wallpaper: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #a7f3d0 0%, #10b981 100%)" },
                        ].map((th) => {
                          const isSelected = chatThemeColor === th.color && chatWallpaper === th.wallpaper;
                          const isLightMode = typeof window !== "undefined" && localStorage.getItem("theme") === "light";
                          return (
                            <button
                              key={th.id}
                              type="button"
                              onClick={() => {
                                setPreviewThemeModal({
                                  isOpen: true,
                                  presetId: th.id,
                                  name: th.name,
                                  color: th.color,
                                  wallpaper: th.wallpaper,
                                  previewBg: th.previewBg,
                                  isDarkPreview: !isLightMode,
                                });
                              }}
                              className={`h-24 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between p-2 shadow-md ${isSelected
                                ? "border-[#7c5dfa] ring-2 ring-[#7c5dfa]/40 bg-[#7c5dfa]/10 scale-[1.02]"
                                : "border-white/10 hover:border-white/30 bg-white/[0.03]"
                                }`}
                              style={{
                                backgroundColor: th.id === "default" ? (isLightMode ? "#efeae2" : "#000000") : "transparent",
                              }}
                            >
                              <div
                                className="absolute inset-0 pointer-events-none transition-all duration-300"
                                style={{
                                  backgroundImage: th.wallpaper
                                    ? `url(${th.wallpaper})`
                                    : (th.id === "default"
                                      ? `url(${defaultWallpaper.src})`
                                      : th.previewBg),
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  filter: th.id === "default" && !isLightMode
                                    ? "invert(1) sepia(1) saturate(600%) hue-rotate(235deg) brightness(0.95) opacity(0.35)"
                                    : "none"
                                }}
                              />
                              <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

                              <div className="relative z-10 flex justify-start">
                                <div className="w-8 h-2.5 rounded-full bg-white/80 backdrop-blur-sm"></div>
                              </div>

                              <div className="relative z-10 flex justify-end">
                                <div className="w-10 h-3 rounded-full shadow-sm" style={{ backgroundColor: th.color }}></div>
                              </div>

                              {isSelected && (
                                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-md z-20" style={{ backgroundColor: chatThemeColor || "#7c5dfa" }}>
                                  ✓
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[10px] text-white/40 italic pt-1 pl-0.5">
                        {t("chat_theme_change_desc", "The chat color and wallpaper will both change.")}
                      </p>
                    </div>

                    <div className="h-px bg-white/10 my-2"></div>

                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider pl-0.5">{t("chat_customize_title", "Customize")}</p>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setSettingsView("chat-color")}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#7c5dfa]/15 text-[#9f85ff] flex items-center justify-center">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-white/90">{t("chat_color_label", "Chat color")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                              style={{ backgroundColor: chatThemeColor || "#7c5dfa" }}
                            ></div>
                            <span className="text-white/40 text-xs">›</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettingsView("wallpaper")}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#7c5dfa]/15 text-[#9f85ff] flex items-center justify-center">
                              <Globe className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-white/90">{t("chat_wallpaper_label", "Wallpaper")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {chatWallpaper ? (
                              <div
                                className="w-5 h-5 rounded-lg border border-white/30 bg-cover bg-center"
                                style={{ backgroundImage: `url(${chatWallpaper})` }}
                              ></div>
                            ) : (
                              <div className="w-4 h-4 rounded-sm bg-white/20 border border-white/30"></div>
                            )}
                            <span className="text-white/40 text-xs">›</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setChatThemeColor("#7c5dfa");
                        setChatWallpaper("");
                        localStorage.setItem("chatThemeColor", "#7c5dfa");
                        localStorage.setItem("chatWallpaper", "");
                        window.dispatchEvent(new Event("chatThemeColorChanged"));
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-2xl text-xs font-semibold shadow-md transition-colors cursor-pointer text-center"
                    >
                      {t("chat_reset_theme_wallpaper", "Reset theme & wallpaper to default")}
                    </button>
                  </div>
                )}

                {settingsView === "chat-color" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-5 space-y-6 text-white animate-fade-in">
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider pl-0.5">{t("chat_select_color_title", "Select Chat Color")}</p>

                      <div className="grid grid-cols-4 gap-4 py-2">
                        {[
                          { id: "default_violet", hex: "#7c5dfa", name: "Default Violet" },
                          { id: "soft_purple", hex: "#a855f7", name: "Soft Purple" },
                          { id: "emerald", hex: "#00a884", name: "Emerald Green" },
                          { id: "mint", hex: "#25d366", name: "Mint Green" },
                          { id: "vibrant_magenta", hex: "#d946ef", name: "Vibrant Magenta" },
                          { id: "soft_pink", hex: "#f472b6", name: "Soft Pink" },
                          { id: "coral_orange", hex: "#f97416e7", name: "Coral Orange" },
                          { id: "peach_nude", hex: "#fbd5c6", name: "Peach Nude" },
                          { id: "dark_teal", hex: "#008069", name: "Dark Teal" },
                          { id: "bright_cyan", hex: "#06b6d4", name: "Bright Cyan" },
                          { id: "electric_blue", hex: "#3b82f6", name: "Electric Blue" },
                          { id: "ice_blue", hex: "#bae6fd", name: "Ice Blue" },
                          { id: "deep_navy", hex: "#1d4ed8", name: "Deep Navy" },
                          { id: "dark_forest", hex: "#14532dee", name: "Dark Forest" },
                          { id: "deep_maroon", hex: "#881337", name: "Deep Maroon" },
                          { id: "blush_rose", hex: "#fb7185", name: "Blush Rose" },
                          { id: "dark_slate", hex: "#334155", name: "Dark Slate" },
                          { id: "dark_graphite", hex: "#1e293b", name: "Dark Graphite" },
                          { id: "silver_gray", hex: "#cbd5e1", name: "Silver Gray" },
                        ].map((c) => {
                          const isSelected = chatThemeColor === c.hex;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setChatThemeColor(c.hex);
                                localStorage.setItem("chatThemeColor", c.hex);
                                window.dispatchEvent(new Event("chatThemeColorChanged"));
                              }}
                              className="flex flex-col items-center gap-1.5 group cursor-pointer"
                              title={c.name}
                            >
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${isSelected ? "ring-4 ring-white/80 scale-105" : "border border-white/10"
                                  }`}
                                style={{ backgroundColor: c.hex }}
                              >
                                {isSelected && <Check className="w-5 h-5 text-white stroke-[3]" />}
                              </div>
                              <span className="text-[9px] font-medium text-white/50 truncate max-w-[60px]">{c.name}</span>
                            </button>
                          );

                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setChatThemeColor("#7c5dfa");
                        localStorage.setItem("chatThemeColor", "#7c5dfa");
                        window.dispatchEvent(new Event("chatThemeColorChanged"));
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-2xl text-xs font-semibold shadow-md transition-colors cursor-pointer text-center"
                    >
                      {t("chat_reset_color", "Reset chat color to default")}
                    </button>
                  </div>
                )}

                {settingsView === "wallpaper" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-5 space-y-6 text-white animate-fade-in">
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider pl-0.5">{t("wallpaper_gallery_title", "Wallpaper Gallery")}</p>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { name: "Peachy Bloom", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop" },
                          { name: "Iridescent Lilac", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop" },
                          { name: "Soft Blossom", url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop" },
                          { name: "Coral Sunset", url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=800&auto=format&fit=crop" },
                          { name: "Dandelion Whisp", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop" },
                          { name: "Tropical Palms", url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=800&auto=format&fit=crop" },
                          { name: "Ocean Waves", url: "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=800&auto=format&fit=crop" },
                          { name: "Golden Sunset", url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=800&auto=format&fit=crop" },
                          { name: "Lavender Sky", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop" },
                          { name: "Emerald Forest", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop" },
                          { name: "Rose Quartz", url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop" },
                        ].map((img) => {
                          const isLightMode = typeof window !== "undefined" && localStorage.getItem("theme") === "light";
                          return (
                            <button
                              key={img.name}
                              type="button"
                              onClick={() => {
                                setPreviewThemeModal({
                                  isOpen: true,
                                  presetId: "wallpaper_" + img.name,
                                  name: img.name,
                                  color: chatThemeColor || "#7c5dfa",
                                  wallpaper: img.url,
                                  previewBg: "",
                                  isDarkPreview: !isLightMode,
                                });
                              }}
                              className="h-28 rounded-2xl border border-white/10 hover:border-white/30 transition-all relative overflow-hidden group cursor-pointer text-left flex flex-col justify-end p-2 bg-cover bg-center shadow-md"
                              style={{ backgroundImage: `url(${img.url})` }}
                            >
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors"></div>
                              <span className="wallpaper-card-title relative z-10 text-[9px] font-bold text-white bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded truncate max-w-full">
                                {img.name}
                              </span>
                              {chatWallpaper === img.url && (
                                <div className="absolute inset-0 bg-[#7c5dfa]/20 border-2 border-[#7c5dfa] rounded-2xl flex items-center justify-center z-10">
                                  <span className="text-xs text-white font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: chatThemeColor || "#7c5dfa" }}>✓</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSettingsView("wallpaper-solid-colors")}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#7c5dfa]/15 text-[#9f85ff] flex items-center justify-center">
                            <Globe className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-white/90">{t("wallpaper_set_color", "Set a colour")}</span>
                        </div>
                        <span className="text-white/40 text-xs">›</span>
                      </button>

                      <label
                        htmlFor="custom-wallpaper-upload-settings"
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                            <Camera className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-white/90">{t("wallpaper_choose_gallery", "Choose from gallery")}</span>
                        </div>
                        <input
                          id="custom-wallpaper-upload-settings"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const imgUrl = event.target?.result;
                                if (imgUrl) {
                                  const isLightMode = typeof window !== "undefined" && localStorage.getItem("theme") === "light";
                                  setPreviewThemeModal({
                                    isOpen: true,
                                    presetId: "custom",
                                    name: "Custom Wallpaper",
                                    color: chatThemeColor || "#7c5dfa",
                                    wallpaper: imgUrl,
                                    previewBg: "",
                                    isDarkPreview: !isLightMode,
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setChatWallpaper("");
                          localStorage.setItem("chatWallpaper", "");
                          window.dispatchEvent(new Event("chatThemeColorChanged"));
                        }}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-2xl text-xs font-semibold shadow-md transition-colors cursor-pointer text-center"
                      >
                        {t("wallpaper_reset_default", "Reset wallpaper to default")}
                      </button>
                    </div>
                  </div>
                )}

                {settingsView === "wallpaper-solid-colors" && (
                  <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-5 space-y-6 text-white animate-fade-in">
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider pl-0.5">{t("wallpaper_solid_colors_title", "Solid Colors")}</p>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "pastel_violet", hex: "#ede9fe", name: "Soft Lilac" },
                          { id: "mint_sage", hex: "#d1fae5", name: "Mint Sage" },
                          { id: "ice_blue", hex: "#e0f2fe", name: "Soft Ice Blue" },
                          { id: "blush_rose", hex: "#ffe4e6", name: "Blush Rose" },
                          { id: "peach_cream", hex: "#ffedd5", name: "Peach Cream" },
                          { id: "warm_cream", hex: "#fef3c7", name: "Warm Cream" },
                          { id: "slate_light", hex: "#f1f5f9", name: "Slate Light" },
                          { id: "soft_cyan", hex: "#cffaff", name: "Soft Cyan" },
                          { id: "deep_violet", hex: "#1e1b4b", name: "Deep Violet" },
                          { id: "midnight_purple", hex: "#2e1065", name: "Midnight Purple" },
                          { id: "dark_emerald", hex: "#064e3b", name: "Dark Emerald" },
                          { id: "ocean_navy", hex: "#1e3a8a", name: "Ocean Navy" },
                          { id: "charcoal_slate", hex: "#1e293b", name: "Charcoal Slate" },
                          { id: "wine_burgundy", hex: "#4c0519", name: "Wine Burgundy" },
                          { id: "rich_graphite", hex: "#0f172a", name: "Rich Graphite" },
                          { id: "muted_teal", hex: "#115e59", name: "Muted Teal" },
                        ].map((w) => {
                          const isSelected = chatWallpaper === w.hex;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => {
                                setChatWallpaper(w.hex);
                                localStorage.setItem("chatWallpaper", w.hex);
                                window.dispatchEvent(new Event("chatThemeColorChanged"));
                              }}
                              className="h-28 rounded-2xl border border-white/10 hover:border-white/30 transition-all relative overflow-hidden group cursor-pointer text-left flex flex-col justify-end p-2 shadow-md"
                              style={{ backgroundColor: w.hex }}
                              title={w.name}
                            >
                              <span className="relative z-10 text-[9px] font-bold text-gray-900 bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded truncate max-w-full">
                                {w.name}
                              </span>
                              {isSelected && (
                                <div className="absolute inset-0 bg-black/20 border-2 border-white rounded-2xl flex items-center justify-center z-10">
                                  <span className="text-xs text-white font-bold bg-[#7c5dfa] w-5 h-5 rounded-full flex items-center justify-center shadow-lg">✓</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setChatWallpaper("");
                        localStorage.setItem("chatWallpaper", "");
                        window.dispatchEvent(new Event("chatThemeColorChanged"));
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-2xl text-xs font-semibold shadow-md transition-colors cursor-pointer text-center"
                    >
                      Reset wallpaper to default
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "contacts" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-transparent relative">

                {contactsView === "new-group" && (
                  (() => {
                    const isLight = typeof window !== "undefined" && localStorage.getItem("theme") === "light";
                    return (
                      <div className={`flex-1 flex flex-col overflow-hidden animate-fade-in ${isLight ? "text-gray-900" : "text-white"}`}>
                        <div className="flex flex-col overflow-hidden p-4 space-y-4 flex-1">
                          <div className="space-y-1">
                            <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 ${isLight ? "text-gray-500" : "text-white/30"}`}>{t("group_name_label")}</label>
                            <input
                              type="text"
                              value={groupName}
                              onChange={(e) => {
                                if (setGroupName) setGroupName(e.target.value);
                                if (groupValidationError) setGroupValidationError("");
                              }}
                              placeholder={t("enter_group_name_ph")}
                              className={`w-full px-4 py-3 border rounded-2xl text-xs font-medium focus:outline-none transition-all shadow-inner ${isLight ? "bg-white border-gray-300 text-gray-900 focus:border-[#7c5dfa]" : "bg-[#201d2d] border-white/10 text-[#ffffff] focus:border-[#7c5dfa]"}`}
                              autoFocus
                            />
                            {groupValidationError && (
                              <p className="text-[10px] text-red-500 font-semibold mt-1 pl-1">
                                {groupValidationError}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
                            <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 ${isLight ? "text-gray-500" : "text-white/30"}`}>{t("select_members_label")}</label>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                              {selectableUsers.length === 0 ? (
                                <p className={`text-[11px] text-center py-6 ${isLight ? "text-gray-400" : "text-white/30"}`}>{t("no_selectable_users")}</p>
                              ) : (
                                (() => {
                                  const groups = {};
                                  selectableUsers.forEach((user) => {
                                    const name = (user.first_name || user.name || "").trim();
                                    const firstChar = name ? name[0].toUpperCase() : "#";
                                    const key = /[A-Z]/.test(firstChar) ? firstChar : "#";
                                    if (!groups[key]) groups[key] = [];
                                    groups[key].push(user);
                                  });
                                  const sortedKeys = Object.keys(groups).sort((a, b) => (a === "#" ? -1 : b === "#" ? 1 : a.localeCompare(b)));

                                  return sortedKeys.map((letter) => (
                                    <div key={letter} className="space-y-1">
                                      <div className={`text-xs font-bold text-[#7c5dfa] sticky top-0 backdrop-blur-xs py-1 px-1 z-10 ${isLight ? "bg-[#f4f5f8]/90" : "bg-[#161421]/90"}`}>
                                        {letter}
                                      </div>
                                      {groups[letter].map((user) => {
                                        const isSelected = selectedGroupMembers.includes(user.id);
                                        const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
                                        return (
                                          <div
                                            key={user.id}
                                            onClick={() => {
                                              if (setSelectedGroupMembers) {
                                                setSelectedGroupMembers((prev) =>
                                                  prev.includes(user.id) ? prev.filter((id) => id !== user.id) : [...prev, user.id]
                                                );
                                              }
                                            }}
                                            className={`py-2 flex items-center justify-between cursor-pointer px-2 rounded-xl transition-colors ${isLight ? "hover:bg-gray-100" : "hover:bg-white/[0.04]"}`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${isLight ? "bg-gray-200 text-gray-800 border-gray-300" : "bg-[#2c283d] text-white border-white/10"}`}>
                                                {user.profile_image ? (
                                                  <img src={user.profile_image} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                  userInitials
                                                )}
                                              </div>
                                              <div>
                                                <p className={`text-xs font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{user.first_name} {user.last_name}</p>
                                                <p className={`text-[10px] ${isLight ? "text-gray-500" : "text-white/40"}`}>{user.about || user.email || "Hey there! I am using ChatBox"}</p>
                                              </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${isSelected ? "bg-[#7c5dfa] border-transparent" : isLight ? "border-gray-400 hover:border-gray-600" : "border-white/30 hover:border-white/50"}`}>
                                              {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ));
                                })()
                              )}
                            </div>
                          </div>

                          <div className={`pt-4 border-t flex gap-2 justify-end shrink-0 ${isLight ? "border-gray-200" : "border-white/5"}`}>
                            <button
                              type="button"
                              onClick={() => {
                                if (setGroupName) setGroupName("");
                                if (setSelectedGroupMembers) setSelectedGroupMembers([]);
                                setGroupValidationError("");
                                setContactsView("list");
                              }}
                              className={`px-3.5 py-2 text-xs rounded-lg transition-colors font-bold cursor-pointer ${isLight ? "text-gray-600 hover:text-gray-900 hover:bg-gray-200" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                            >
                              {t("cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!groupName.trim()) {
                                  setGroupValidationError(t("pleaseEnterGroupName"));
                                  return;
                                }
                                if (selectedGroupMembers.length === 0) {
                                  setGroupValidationError(t("pleaseSelectGroupMembers"));
                                  return;
                                }
                                setGroupValidationError("");
                                if (handleCreateGroup) {
                                  const success = await handleCreateGroup();
                                  if (success) {
                                    setContactsView("list");
                                    if (setStatusTip) setStatusTip("Group created successfully!");
                                  }
                                }
                              }}
                              className="px-4 py-2 text-xs bg-[#7c5dfa] hover:bg-[#684ce2] text-white rounded-lg transition-colors font-bold shadow-md cursor-pointer"
                            >
                              {t("create")}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {contactsView === "add" ? (
                  <div className="flex-1 flex flex-col p-5 space-y-4 animate-fade-in text-white overflow-y-auto no-scrollbar">
                    <form onSubmit={handleAddContactSubmit} className="space-y-4">
                      {addContactError && (
                        <div className="bg-red-950/40 border border-red-500/30 text-red-200 p-3 rounded-xl text-xs text-center">
                          {addContactError}
                        </div>
                      )}
                      {addContactSuccess && (
                        <div className="bg-[#7c5dfa]/20 border border-[#7c5dfa]/40 text-[#b69eff] p-3 rounded-xl text-xs font-bold text-center shadow-lg">
                          {addContactSuccess}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                          {t("add_contact_first_name_label")}
                        </label>
                        <input
                          type="text"
                          value={newContactFirstName}
                          onChange={(e) => {
                            setNewContactFirstName(e.target.value);
                            if (addContactErrors.firstName) {
                              setAddContactErrors(prev => ({ ...prev, firstName: false }));
                            }
                          }}
                          placeholder={t("add_contact_first_name_placeholder")}
                          className={`w-full bg-[#28253b] border rounded-lg px-3 py-2.5 text-xs text-white transition-all focus:outline-none ${addContactErrors.firstName
                            ? "border-red-500 focus:border-red-400"
                            : "border-transparent focus:border-[#7c5dfa]"
                            }`}
                          autoFocus
                        />
                        {addContactErrors.firstName && (
                          <span className="text-[10px] text-red-400 font-semibold pl-1 mt-1 block">
                            {t("add_contact_error_first_name_required")}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                          {t("add_contact_last_name_label")}
                        </label>
                        <input
                          type="text"
                          value={newContactLastName}
                          onChange={(e) => {
                            setNewContactLastName(e.target.value);
                            if (addContactErrors.lastName) {
                              setAddContactErrors(prev => ({ ...prev, lastName: false }));
                            }
                          }}
                          placeholder={t("add_contact_last_name_placeholder")}
                          className={`w-full bg-[#28253b] border rounded-lg px-3 py-2.5 text-xs text-white transition-all focus:outline-none ${addContactErrors.lastName
                            ? "border-red-500 focus:border-red-400"
                            : "border-transparent focus:border-[#7c5dfa]"
                            }`}
                        />
                        {addContactErrors.lastName && (
                          <span className="text-[10px] text-red-400 font-semibold pl-1 mt-1 block">
                            {t("add_contact_error_last_name_required")}
                          </span>
                        )}
                      </div>

                      {!editingContactId && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                            {t("add_contact_phone_label")}
                          </label>
                          <input
                            type="text"
                            value={newContactPhone}
                            onChange={(e) => {
                              setNewContactPhone(e.target.value);
                              if (addContactErrors.phone) {
                                setAddContactErrors(prev => ({ ...prev, phone: false }));
                              }
                            }}
                            placeholder={t("add_contact_phone_placeholder")}
                            className={`w-full bg-[#28253b] border rounded-lg px-3 py-2.5 text-xs text-white transition-all focus:outline-none ${addContactErrors.phone
                              ? "border-red-500 focus:border-red-400"
                              : "border-transparent focus:border-[#7c5dfa]"
                              }`}
                          />
                          {addContactErrors.phone && (
                            <span className="text-[10px] text-red-400 font-semibold pl-1 mt-1 block">
                              {t("add_contact_error_phone_required")}
                            </span>
                          )}
                        </div>
                      )}

                      {!editingContactId && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                            {t("add_contact_email_label")}
                          </label>
                          <input
                            type="email"
                            value={newContactEmail}
                            onChange={(e) => setNewContactEmail(e.target.value)}
                            placeholder={t("add_contact_email_placeholder")}
                            className="w-full bg-[#28253b] border border-transparent focus:border-[#7c5dfa] focus:outline-none rounded-lg px-3 py-2.5 text-xs text-white transition-all"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={addContactLoading}
                        className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        {addContactLoading ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          editingContactId ? t("update_contact_button") : t("add_contact_save_button")
                        )}
                      </button>
                    </form>
                  </div>
                ) : contactsView === "new-group" ? null : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-5 pb-3 pt-2">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 light:text-black/30 w-4 h-4" />
                        <input
                          type="text"
                          value={contactsSearch}
                          onChange={(e) => setContactsSearch(e.target.value)}
                          placeholder={t("contacts_search_placeholder", "Search...")}
                          className="w-full bg-[#1c1a29]/60 dark:bg-[#1c1a29]/60 light:bg-slate-100 border border-[#7c5dfa]/20 focus:border-[#7c5dfa]/60 hover:bg-[#1c1a29]/80 focus:bg-[#1c1a29]/95 rounded-[30px] pl-10 pr-10 py-2.5 text-xs focus:outline-none transition-all placeholder:text-white/30 light:placeholder:text-black/30 text-white light:text-black shadow-inner"
                        />
                        {contactsSearch && (
                          <button
                            type="button"
                            onClick={() => setContactsSearch("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1.5 pb-4">
                      <div
                        onClick={() => {
                          if (setGroupName) setGroupName("");
                          if (setSelectedGroupMembers) setSelectedGroupMembers([]);
                          setContactsView("new-group");
                        }}
                        className="p-2.5 flex items-center gap-3.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all select-none"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/10 shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white">{t("contacts_new_group")}</h4>
                        </div>
                      </div>

                      <div
                        onClick={() => setContactsView("add")}
                        className="p-2.5 flex items-center gap-3.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all select-none border border-[#7c5dfa]/20 bg-[#7c5dfa]/5"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#7c5dfa]/20 text-[#b69eff] flex items-center justify-center border border-[#7c5dfa]/30 shrink-0">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white">{t("contacts_new_contact")}</h4>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setActiveTab("community");
                          setIsCommunityModalOpen(true);
                        }}
                        className="p-2.5 flex items-center gap-3.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all select-none"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/10 shrink-0">
                          <MdGroups className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white">{t("contacts_new_community")}</h4>
                        </div>
                      </div>

                      <div className="h-px bg-white/5 my-2 mx-1"></div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1.5 mb-2.5">
                          {t("contacts_my_contacts")} ({contacts.filter(c => Number(c.id) !== Number(currentUser?.id)).length})
                        </div>

                        {(() => {
                          const savedContacts = contacts.filter((c) => {
                            if (Number(c.id) === Number(currentUser?.id)) return false;
                            if (!contactsSearch.trim()) return true;
                            const name = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
                            return name.includes(contactsSearch.toLowerCase()) || c.mobile?.toLowerCase().includes(contactsSearch.toLowerCase());
                          });

                          const showSelf = currentUser && (() => {
                            if (!contactsSearch.trim()) return true;
                            const selfName = `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.toLowerCase();
                            return selfName.includes(contactsSearch.toLowerCase()) || currentUser.mobile?.toLowerCase().includes(contactsSearch.toLowerCase());
                          })();

                          if (savedContacts.length === 0 && !showSelf) {
                            return (
                              <div className="flex flex-col items-center justify-center py-12 text-center select-none animate-fade-in">
                                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-3 border border-white/10">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                  </svg>
                                </div>
                                <p className="text-xs text-white/30 font-medium">
                                  {contactsSearch.trim() ? t("contacts_no_contacts_match") : t("contacts_no_contacts_yet")}
                                </p>
                                {!contactsSearch.trim() && (
                                  <button
                                    onClick={() => setContactsView("add")}
                                    className="mt-3 px-4 py-1.5 bg-[#7c5dfa]/20 hover:bg-[#7c5dfa]/30 text-[#b69eff] text-[10px] font-bold rounded-lg border border-[#7c5dfa]/30 transition-colors cursor-pointer"
                                  >
                                    + {t("addContact")}
                                  </button>
                                )}
                              </div>
                            );
                          }

                          return (
                            <>
                              {showSelf && (() => {
                                const selfInitials = `${currentUser.first_name?.[0] || ""}${currentUser.last_name?.[0] || ""}`.toUpperCase();
                                return (
                                  <div
                                    key="self"
                                    onClick={() => handleStartPersonalChat(currentUser)}
                                    className="py-2.5 px-2.5 flex items-center justify-between hover:bg-white/[0.03] rounded-xl transition-all cursor-pointer select-none group/contact border border-transparent hover:border-white/5"
                                  >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <div className="w-10 h-10 rounded-full bg-[#27243c] flex items-center justify-center font-bold text-xs shrink-0 border border-white/5">
                                        {currentUser.profile_image ? (
                                          <img src={currentUser.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                          selfInitials
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-white truncate">
                                          {currentUser.first_name} {currentUser.last_name}
                                          <span className="ml-1.5 text-[9px] font-normal text-[#7c5dfa] bg-[#7c5dfa]/10 px-1.5 py-0.5 rounded-full">{t("contacts_you_badge")}</span>
                                        </h4>
                                        <p className="text-[10px] text-white/40 truncate">
                                          {currentUser.about || "Hey there! I am using MYCHATBOX."}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {savedContacts.map((c) => {
                                const contactInitials = `${c.first_name?.[0] || ""}${c.last_name?.[0] || ""}`.toUpperCase();
                                const hasActiveChat = chatList.some((chat) => {
                                  if (chat.is_group) return false;
                                  return chat.members?.some((m) => m && Number(m.id) === Number(c.id));
                                });
                                const isEditing = Number(editingContactId) === Number(c.id);

                                return (
                                  <div
                                    key={c.id}
                                    className="py-2.5 px-2.5 flex items-center justify-between hover:bg-white/[0.03] rounded-xl transition-all cursor-pointer select-none group/contact border border-transparent hover:border-white/5"
                                  >
                                    {isEditing ? (
                                      <div className="flex-1 flex flex-col gap-2 p-1" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={editContactFirstName}
                                            onChange={(e) => setEditContactFirstName(e.target.value)}
                                            placeholder={t("add_contact_first_name_label")}
                                            className="flex-1 bg-[#28253b] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#7c5dfa]"
                                          />
                                          <input
                                            type="text"
                                            value={editContactLastName}
                                            onChange={(e) => setEditContactLastName(e.target.value)}
                                            placeholder={t("add_contact_last_name_label")}
                                            className="flex-1 bg-[#28253b] border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#7c5dfa]"
                                          />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-1">
                                          <button
                                            type="button"
                                            onClick={() => setEditingContactId(null)}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white cursor-pointer"
                                          >
                                            {t("cancel")}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try {
                                                const res = await editContact(c.id, editContactFirstName.trim(), editContactLastName.trim());
                                                if (res.success) {
                                                  setSettingsTip(t("success_contact_updated"));
                                                  setTimeout(() => setSettingsTip(""), 2000);
                                                  if (refreshContacts) await refreshContacts();
                                                  if (refreshChatList) await refreshChatList();
                                                  setEditingContactId(null);
                                                } else {
                                                  setSettingsTip(t("error_contact_update_failed"));
                                                  setTimeout(() => setSettingsTip(""), 3000);
                                                }
                                              } catch (err) {
                                                console.error(err);
                                                setSettingsTip(t("error_contact_update_failed"));
                                                setTimeout(() => setSettingsTip(""), 3000);
                                              }
                                            }}
                                            className="px-3.5 py-1 bg-[#7c5dfa] hover:bg-[#684ce2] rounded-lg text-[10px] font-bold text-white cursor-pointer"
                                          >
                                            {t("edit_contact_save_button")}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div onClick={() => handleStartPersonalChat(c)} className="flex items-center gap-3.5 min-w-0 flex-1">
                                          <div className="w-10 h-10 rounded-full bg-[#27243c] flex items-center justify-center font-bold text-xs shrink-0 border border-white/5">
                                            {c.profile_image ? (
                                              <img src={c.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                              contactInitials
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-white truncate">
                                              {c.first_name} {c.last_name}
                                            </h4>
                                            {c.about && (
                                              <p className="text-[10px] text-white/40 truncate">
                                                {c.about}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/contact:opacity-100 transition-all shrink-0">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStartPersonalChat(c);
                                            }}
                                            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-[#7c5dfa] transition-all cursor-pointer"
                                            title={t("contacts_message_label")}
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingContactId(c.id);
                                              setEditContactFirstName(c.custom_first_name || c.first_name || "");
                                              setEditContactLastName(c.custom_last_name || c.last_name || "");
                                              setNewContactFirstName(c.custom_first_name || c.first_name || "");
                                              setNewContactLastName(c.custom_last_name || c.last_name || "");
                                              setNewContactPhone(c.mobile || "");
                                              setNewContactEmail(c.email || "");
                                              setAddContactError("");
                                              setAddContactSuccess("");
                                              setContactsView("add");
                                            }}
                                            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer"
                                            title={t("contact_edit_title")}
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setConfirmModal({
                                                isOpen: true,
                                                icon: "trash",
                                                title: t("delete_contact_confirm_title"),
                                                description: `${t("delete_contact_confirm_description")} ${c.first_name} ${c.last_name}?`,
                                                onConfirm: async () => {
                                                  try {
                                                    const res = await deleteContact(c.id);
                                                    if (res.success) {
                                                      setSettingsTip(t("success_contact_deleted"));
                                                      setTimeout(() => setSettingsTip(""), 3000);
                                                      if (refreshContacts) await refreshContacts();
                                                    } else {
                                                      setSettingsTip(res.message || t("failed_to_delete_contact"));
                                                      setTimeout(() => setSettingsTip(""), 3000);
                                                    }
                                                  } catch (err) {
                                                    console.error(err);
                                                    setSettingsTip(t("failed_to_delete_contact"));
                                                    setTimeout(() => setSettingsTip(""), 3000);
                                                  }
                                                }
                                              });
                                            }}
                                            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-all cursor-pointer"
                                            title={t("blank_delete_contact")}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "status" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-transparent relative">

                {statusesSubView === "my-details" ? (
                  <div className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-4 text-white">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStatusesSubView("list")}
                          className="p-1.5 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-all cursor-pointer border-none bg-transparent"
                          title="Back"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t("status_my_status_updates", "My Status Updates")}</span>
                      </div>
                    </div>

                    {isUploadingStatus && (
                      <div className="p-3.5 rounded-2xl border border-[#7c5dfa]/20 bg-[#7c5dfa]/5 flex items-center gap-3 shadow-inner">
                        <span className="w-3.5 h-3.5 border-2 border-[#7c5dfa] border-t-transparent rounded-full animate-spin shrink-0"></span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-white/80">{t("status_uploading", "Uploading status...")}</span>
                            <span className="text-[#b69eff] font-mono">{statusUploadProgress}%</span>
                          </div>
                          <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div className="bg-[#7c5dfa] h-full transition-all duration-150" style={{ width: `${statusUploadProgress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(!statusesData.myStatus || !statusesData.myStatus.statuses || statusesData.myStatus.statuses.length === 0) ? (
                      <div className="text-center py-12 text-white/30 text-xs italic">{t("status_no_active_updates", "No active status updates.")}</div>
                    ) : (
                      <div className="space-y-3.5">
                        {statusesData.myStatus.statuses.map((status, index) => {
                          let displayUrl = status.content;
                          let displayCaption = "";
                          if (status.type === "image" || status.type === "video") {
                            if (status.content.startsWith("{")) {
                              try {
                                const parsed = JSON.parse(status.content);
                                displayUrl = parsed.url;
                                displayCaption = parsed.caption || "";
                              } catch (e) { }
                            }
                          }

                          const statusTime = new Date(status.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          const statusDate = new Date(status.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' });

                          return (
                            <div
                              key={status.id}
                              className={`p-3 rounded-2xl border flex items-center justify-between gap-3.5 transition-all bg-white/[0.02] border-white/5 hover:bg-white/[0.04]`}
                            >
                              <div
                                onClick={() => {
                                  const group = {
                                    ...statusesData.myStatus,
                                    statuses: statusesData.myStatus.statuses
                                  };
                                  handleStatusClick(group);
                                }}
                                className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                              >
                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 flex items-center justify-center bg-[#2c283d] relative">
                                  {status.type === "text" ? (
                                    <div
                                      className="w-full h-full flex items-center justify-center p-1 text-[7px] font-extrabold text-white text-center leading-none overflow-hidden"
                                      style={{ backgroundColor: status.bg_color || "#7c5dfa" }}
                                    >
                                      {status.content.substring(0, 15)}
                                    </div>
                                  ) : status.type === "video" ? (
                                    <video src={displayUrl} className="w-full h-full object-cover animate-pulse" />
                                  ) : (
                                    <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">
                                    {status.type === "text" ? status.content : (displayCaption || t("photo_status", "Photo status"))}
                                  </p>
                                  <p className="text-[10px] text-white/40 mt-0.5">
                                    {status.views_count || 0} {t("views_count", "views")} • {statusDate}, {statusTime}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setConfirmModal({
                                    isOpen: true,
                                    icon: "trash",
                                    title: t("delete_status_confirm", "Delete status?"),
                                    description: t("delete_status_confirm_desc", "Are you sure you want to delete this status update? This action cannot be undone."),
                                    onConfirm: async () => {
                                      try {
                                        const res = await deleteStatusUpdate(status.id);
                                        if (res.success) {
                                          await loadStatuses();
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }
                                  });
                                }}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-colors cursor-pointer border-none"
                                title="Delete status"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-5">

                    <div>
                      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1 mb-2.5">{t("status_my_status")}</div>
                      <div className="relative">
                        <input
                          type="file"
                          ref={statusFileInputRef}
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            handleUploadMediaStatus(file);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                        <div
                          onClick={() => {
                            if (statusesData.myStatus && statusesData.myStatus.statuses.length > 0) {
                              setStatusesSubView("my-details");
                            } else {
                              statusFileInputRef.current?.click();
                            }
                          }}
                          className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-all select-none"
                        >
                          <div className="relative shrink-0 select-none">
                            {statusesData.myStatus && statusesData.myStatus.statuses.length > 0 ? (
                              <StatusAvatarRing
                                statuses={statusesData.myStatus.statuses}
                                hasUnviewed={statusesData.myStatus.statuses.some(s => !viewedStatusesLocal.includes(s.id))}
                                viewedStatusesLocal={viewedStatusesLocal}
                                isOwn={true}
                              >
                                {currentUser?.profile_image ? (
                                  <img src={currentUser.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-[#27233a] flex items-center justify-center font-bold text-xs text-white">
                                    {initials}
                                  </div>
                                )}
                              </StatusAvatarRing>
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-[#27233a] flex items-center justify-center font-bold text-xs border border-white/5">
                                {currentUser?.profile_image ? (
                                  <img src={currentUser.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                                ) : initials}
                                <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-[#7c5dfa] rounded-full flex items-center justify-center border-2 border-[#161421]">
                                  <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white">{t("status_my_status")}</h4>
                            <p className="text-[10px] text-white/40 mt-0.5 truncate">
                              {isUploadingStatus ? (
                                <span className="text-[#b69eff] font-bold flex items-center gap-1.5 font-mono">
                                  <span className="w-2.5 h-2.5 border border-t-transparent border-[#b69eff] rounded-full animate-spin shrink-0"></span>
                                  {t("status_uploading_label", "Uploading")} {statusUploadProgress}%
                                </span>
                              ) : statusesData.myStatus && statusesData.myStatus.statuses.length > 0 ? (
                                `${t("status_last_updated")} ${new Date(statusesData.myStatus.statuses[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              ) : (
                                t("status_add_text")
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(() => {
                        const filteredUpdates = (statusesData?.contactUpdates || []).filter(g => {
                          if (!statusSearch.trim()) return true;
                          const name = `${g.user?.first_name || ""} ${g.user?.last_name || ""}`.toLowerCase();
                          return name.includes(statusSearch.toLowerCase());
                        });

                        const recentUpdates = filteredUpdates.filter(g => g.statuses?.some(s => !s.viewed && !viewedStatusesLocal.includes(s.id)));
                        const viewedUpdates = filteredUpdates.filter(g => !g.statuses?.some(s => !s.viewed && !viewedStatusesLocal.includes(s.id)));

                        if (filteredUpdates.length === 0) {
                          return (
                            <div className="text-center py-12 text-white/30 text-xs italic">
                              {t("no_status_updates_match", "No matching status updates.")}
                            </div>
                          );
                        }

                        return (
                          <>
                            {recentUpdates.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1 mb-1">{t("status_recent_updates")}</div>
                                {recentUpdates.map((group) => {
                                  const userInitials = `${group.user?.first_name?.[0] || ""}${group.user?.last_name?.[0] || ""}`.toUpperCase();
                                  const latestStatus = group.statuses?.[0] || {};
                                  return (
                                    <div
                                      key={group.user?.id}
                                      onClick={() => handleStatusClick(group)}
                                      className="flex items-center gap-3.5 p-2 hover:bg-white/[0.02] rounded-2xl cursor-pointer border border-transparent hover:border-white/5 transition-all select-none"
                                    >
                                      <div className="shrink-0">
                                        <StatusAvatarRing
                                          statuses={group.statuses}
                                          hasUnviewed={group.statuses?.some(s => !s.viewed && !viewedStatusesLocal.includes(s.id))}
                                          viewedStatusesLocal={viewedStatusesLocal}
                                        >
                                          {group.user?.profile_image ? (
                                            <img src={group.user.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                                          ) : (
                                            <div className="w-full h-full rounded-full bg-[#27233a] flex items-center justify-center font-bold text-xs text-white/80">
                                              {userInitials}
                                            </div>
                                          )}
                                        </StatusAvatarRing>
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-bold text-white">{group.user?.first_name} {group.user?.last_name}</h4>
                                        <p className="text-[10px] text-white/40 mt-0.5">
                                          {latestStatus.created_at ? new Date(latestStatus.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {viewedUpdates.length > 0 && (
                              <div className="space-y-2 pt-2">
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1 mb-1">{t("status_viewed_updates")}</div>
                                {viewedUpdates.map((group) => {
                                  const userInitials = `${group.user?.first_name?.[0] || ""}${group.user?.last_name?.[0] || ""}`.toUpperCase();
                                  const latestStatus = group.statuses?.[0] || {};
                                  return (
                                    <div
                                      key={group.user?.id}
                                      onClick={() => handleStatusClick(group)}
                                      className="flex items-center gap-3.5 p-2 hover:bg-white/[0.01] rounded-2xl cursor-pointer border border-transparent hover:border-white/5 transition-all select-none opacity-60 hover:opacity-100"
                                    >
                                      <div className="shrink-0">
                                        <StatusAvatarRing
                                          statuses={group.statuses}
                                          hasUnviewed={group.statuses?.some(s => !s.viewed && !viewedStatusesLocal.includes(s.id))}
                                          viewedStatusesLocal={viewedStatusesLocal}
                                        >
                                          {group.user?.profile_image ? (
                                            <img src={group.user.profile_image} alt="" className="w-full h-full object-cover rounded-full" />
                                          ) : (
                                            <div className="w-full h-full rounded-full bg-[#27233a] flex items-center justify-center font-bold text-xs text-white/50">
                                              {userInitials}
                                            </div>
                                          )}
                                        </StatusAvatarRing>
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <h4 className="text-xs font-bold text-white/80">{group.user?.first_name} {group.user?.last_name}</h4>
                                        <p className="text-[10px] text-white/35 mt-0.5">
                                          {latestStatus.created_at ? new Date(latestStatus.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )
                }
              </div>
            )}

            {
              activeTab === "status" && statusesSubView === "list" && (
                <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTextStatusOpen(true);
                    }}
                    className="w-9 h-9 bg-[#2a2640] hover:bg-[#34304e] text-white/80 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer border border-white/5"
                  >
                    <Pencil className="w-4 h-4 text-purple-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      statusFileInputRef.current?.click();
                    }}
                    className="w-12 h-12 bg-[#7c5dfa] hover:bg-[#684ce2] text-white rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Camera className="w-5.5 h-5.5" />
                  </button>
                </div>
              )
            }

            {
              activeTab === "chats" && listsSubView !== "new-list" && listsSubView !== "edit-list" && (
                <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2.5 z-50 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("contacts");
                      setContactsView("add");
                    }}
                    title="Add Contact"
                    className="w-12 h-12 bg-[#7c5dfa] hover:bg-[#684ce2] text-white rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-6 h-6" strokeWidth={3} />
                  </button>
                </div>
              )
            }
          </div>
        </section>
      </div>
      {
        isTextStatusOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setIsTextStatusOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center animate-fade-in relative"
              style={{ backgroundColor: textStatusBg }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsTextStatusOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white force-text-white transition-all shadow cursor-pointer border-none"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => {
                  const colors = ["#7c5dfa", "#10b981", "#3b82f6", "#f97316", "#ec4899", "#14b8a6", "#6366f1", "#a855f7"];
                  const nextIdx = (colors.indexOf(textStatusBg) + 1) % colors.length;
                  setTextStatusBg(colors[nextIdx]);
                }}
                className="absolute top-4 left-4 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white force-text-white transition-all shadow cursor-pointer flex items-center gap-1 text-[9px] font-bold border-none"
              >
                <Paintbrush2
                  className="w-3.5 h-3.5 text-white" /> <span className="text-white">{t("color_label")}</span>
              </button>

              <textarea
                value={textStatusContent}
                onChange={(e) => setTextStatusContent(e.target.value)}
                placeholder={t("status_type_placeholder")}
                maxLength={150}
                className="w-full bg-transparent border-0 resize-none text-white force-text-white text-center text-lg sm:text-xl font-black focus:outline-none placeholder:text-white/40 h-44 mt-12 overflow-y-auto no-scrollbar"
                style={{ caretColor: "white", color: "#ffffff" }}
                autoFocus
              />

              <div className="w-full flex justify-between items-center mt-4 pt-4 border-t border-white/10 text-white/50 force-text-white text-[10px]">
                <span className="text-white/70">{textStatusContent.length}/150 {t("status_chars_suffix")}</span>
                <button
                  onClick={async () => {
                    if (!textStatusContent.trim()) return;
                    setTextStatusSubmitting(true);
                    try {
                      const res = await createStatusUpdate({
                        type: "text",
                        content: textStatusContent.trim(),
                        bg_color: textStatusBg,
                      });
                      if (res.success) {
                        setIsTextStatusOpen(false);
                        await loadStatuses();
                      }
                    } catch (err) {
                      console.error("Text status failed:", err);
                    } finally {
                      setTextStatusSubmitting(false);
                    }
                  }}
                  disabled={textStatusSubmitting || !textStatusContent.trim()}
                  className="px-4 py-2 bg-white text-black force-text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md border-none"
                >
                  {textStatusSubmitting ? t("status_posting") : t("status_post")}
                </button>
              </div>
            </div>
          </div>
        )
      }
      {
        activeStatusGroup && (
          <StatusViewer
            statusGroup={activeStatusGroup}
            currentUser={currentUser}
            themeColor={chatThemeColor || "#7c5dfa"}
            onClose={() => {
              setActiveStatusGroup(null);
              loadStatuses();
            }}
            onStatusDeleted={async (deletedId) => {
              await loadStatuses();
              setActiveStatusGroup((prev) => {
                if (!prev) return null;
                const remaining = prev.statuses.filter((s) => s.id !== deletedId);
                if (remaining.length === 0) return null;
                return { ...prev, statuses: remaining };
              });
            }}
          />
        )
      }

      {
        confirmModal.isOpen && (
          <div
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => {
              if (!confirmModal.isLoading) {
                setConfirmModal((p) => ({ ...p, isOpen: false }));
              }
            }}
          >
            <div
              className="w-full max-w-xs rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl confirm-dialog-container transition-all"
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
                  <span className="text-xl">⚠️</span>
                )}
              </div>

              <h4 className="text-sm font-bold text-white mb-1.5 confirm-dialog-title">{confirmModal.title}</h4>
              <p className="text-[11px] text-white/50 leading-relaxed mb-6 px-1 confirm-dialog-desc">{confirmModal.description}</p>

              <div className="flex items-center gap-2.5 w-full">
                {!confirmModal.isAlert && (
                  <button
                    type="button"
                    disabled={confirmModal.isLoading}
                    onClick={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
                    className="flex-1 py-2.5 border border-red-500/40 hover:border-red-500/60 text-red-500 hover:bg-red-500/5 bg-transparent rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40"
                  >
                    {t("cancel", "Cancel")}
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
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-white disabled:opacity-40 ${confirmModal.icon === "trash" ? "bg-red-500 hover:bg-red-600" : "bg-[#7c5dfa] hover:bg-[#684ce2]"}`}
                >
                  {confirmModal.isLoading ? t("loading_label", "Loading...") : confirmModal.isAlert ? t("ok_action", "OK") : confirmModal.title.toLowerCase().includes("delete") ? t("yes_delete", "Yes, delete") : t("confirm_action", "Confirm")}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        isLogoutConfirmOpen && (
          <div
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsLogoutConfirmOpen(false)}
          >
            <div
              className="bg-[#1f1d2c] border border-white/10 w-full max-w-[280px] rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">{t("logout")}</h4>
              <p className="text-[11px] text-white/50 leading-relaxed mb-6 px-1">
                {t("logout_confirm_msg")}
              </p>
              <div className="flex items-center gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogoutConfirmOpen(false);
                    handleLogout();
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                >
                  {t("logout")}
                </button>
              </div>
            </div>
          </div>
        )
      }
      {isUnlockPinModalOpen && (
        <div
          className="fixed inset-0 z-[350] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsUnlockPinModalOpen(false)}
        >
          <div
            className="bg-[#161421] border border-white/10 w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl space-y-4 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsUnlockPinModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 bg-[#7c5dfa]/15 rounded-full flex items-center justify-center border border-[#7c5dfa]/30 mt-2">
              <Lock className="w-6 h-6 text-[#9f85ff]" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{t("unlock_to_continue", "Unlock to continue")}</h3>
              <p className="text-xs text-white/45 mt-1">{t("enter_4_digit_pin", "Enter your 4-digit PIN code to view locked chats")}</p>
            </div>

            {pinError && (
              <p className="text-xs text-red-400 font-medium bg-red-950/30 border border-red-500/20 px-3 py-1.5 rounded-xl w-full">
                {pinError}
              </p>
            )}

            <div className="flex justify-center gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  id={`unlock-pin-${idx}`}
                  type="password"
                  maxLength={1}
                  value={pinDigits[idx]}
                  onChange={(e) => {
                    const val = e.target.value;
                    const next = [...pinDigits];
                    next[idx] = val;
                    setPinDigits(next);
                    if (val && idx < 3) {
                      document.getElementById(`unlock-pin-${idx + 1}`)?.focus();
                    }
                    if (next.every(d => d !== "")) {
                      handleVerifyPinSubmit(next.join(""));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !pinDigits[idx] && idx > 0) {
                      document.getElementById(`unlock-pin-${idx - 1}`)?.focus();
                    }
                  }}
                  className="w-12 h-14 bg-[#201d2d] border border-white/10 rounded-2xl text-center font-bold text-xl text-white focus:border-[#7c5dfa] focus:outline-none transition-all shadow-inner"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <div className="flex items-center gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={() => setIsUnlockPinModalOpen(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {t("cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={pinSubmitting || pinDigits.some(d => d === "")}
                onClick={() => handleVerifyPinSubmit(pinDigits.join(""))}
                className="flex-1 py-3 bg-[#7c5dfa] hover:bg-[#684ce2] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                {pinSubmitting ? t("verifying", "Verifying...") : t("unlock", "Unlock")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSetupPinModalOpen && (
        <div
          className="fixed inset-0 z-[350] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsSetupPinModalOpen(false)}
        >
          <div
            className="bg-[#161421] border border-white/10 w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl space-y-4 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsSetupPinModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 bg-[#7c5dfa]/15 rounded-full flex items-center justify-center border border-[#7c5dfa]/30 mt-2">
              <Lock className="w-6 h-6 text-[#9f85ff]" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{t("set_chat_lock_pin", "Set Chat Lock PIN")}</h3>
              <p className="text-xs text-white/45 mt-1">{t("set_4_digit_pin_desc", "Choose a 4-digit PIN code to secure your locked chats")}</p>
            </div>

            {pinError && (
              <p className="text-xs text-red-400 font-medium bg-red-950/30 border border-red-500/20 px-3 py-1.5 rounded-xl w-full">
                {pinError}
              </p>
            )}

            <div className="flex justify-center gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  id={`setup-pin-${idx}`}
                  type="password"
                  maxLength={1}
                  value={pinDigits[idx]}
                  onChange={(e) => {
                    const val = e.target.value;
                    const next = [...pinDigits];
                    next[idx] = val;
                    setPinDigits(next);
                    if (val && idx < 3) {
                      document.getElementById(`setup-pin-${idx + 1}`)?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !pinDigits[idx] && idx > 0) {
                      document.getElementById(`setup-pin-${idx - 1}`)?.focus();
                    }
                  }}
                  className="w-12 h-14 bg-[#201d2d] border border-white/10 rounded-2xl text-center font-bold text-xl text-white focus:border-[#7c5dfa] focus:outline-none transition-all shadow-inner"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <div className="flex items-center gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={() => setIsSetupPinModalOpen(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {t("cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={pinSubmitting || pinDigits.some(d => d === "")}
                onClick={() => handleSetupPinSubmit(pinDigits.join(""))}
                className="flex-1 py-3 bg-[#7c5dfa] hover:bg-[#684ce2] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                {pinSubmitting ? t("saving", "Saving...") : t("save_pin_and_lock", "Lock Chat")}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewThemeModal.isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex flex-col justify-between animate-fade-in font-sans">
          <div className={`p-4 flex items-center justify-between border-b z-20 ${previewThemeModal.isDarkPreview
            ? "border-white/10 bg-black/80 text-white"
            : "border-gray-200 bg-white/90 text-gray-900 shadow-sm"
            }`}>
            <button
              type="button"
              onClick={() => setPreviewThemeModal({ ...previewThemeModal, isOpen: false })}
              className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${previewThemeModal.isDarkPreview ? "text-white hover:text-[#9f85ff]" : "text-gray-900 hover:text-[#7c5dfa]"
                }`}
            >
              <ArrowLeft className={`w-5 h-5 ${previewThemeModal.isDarkPreview ? "text-white" : "text-gray-900"}`} />
              <span className="font-bold text-sm" style={{ color: previewThemeModal.isDarkPreview ? "#ffffff" : "#111827" }}>{t("preview_label", "Preview")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (previewThemeModal.color) {
                  setChatThemeColor(previewThemeModal.color);
                  localStorage.setItem("chatThemeColor", previewThemeModal.color);
                }
                if (previewThemeModal.wallpaper !== undefined) {
                  setChatWallpaper(previewThemeModal.wallpaper);
                  localStorage.setItem("chatWallpaper", previewThemeModal.wallpaper);
                }
                window.dispatchEvent(new Event("chatThemeColorChanged"));
                setPreviewThemeModal({ ...previewThemeModal, isOpen: false });
              }}
              style={{ backgroundColor: previewThemeModal.color || chatThemeColor || "#7c5dfa" }}
              className="w-9 h-9 rounded-full text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer filter brightness-110"
              title="Set theme"
            >
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 pointer-events-none z-0">
              {previewThemeModal.wallpaper ? (
                (previewThemeModal.wallpaper.startsWith("http") || previewThemeModal.wallpaper.startsWith("data:") || previewThemeModal.wallpaper.startsWith("blob:")) ? (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${previewThemeModal.wallpaper})` }}
                  />
                ) : (
                  <div className="w-full h-full" style={{ backgroundColor: previewThemeModal.wallpaper }} />
                )
              ) : previewThemeModal.isDarkPreview ? (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: "#0b0a12",
                    backgroundImage: `url(${defaultWallpaper.src})`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "412px",
                    backgroundPosition: "center",
                    filter: "invert(0.85) sepia(1) saturate(5) hue-rotate(220deg) opacity(0.3)"
                  }}
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: "#efeae2",
                    backgroundImage: `url(${defaultWallpaper.src})`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "412px",
                    backgroundPosition: "center"
                  }}
                />
              )}
            </div>
            <div className={`absolute inset-0 transition-opacity duration-300 ${previewThemeModal.isDarkPreview ? "bg-black/35" : "bg-white/10"}`}></div>

            <div className="w-full max-w-sm space-y-3 relative z-10 select-none">
              <div className="flex justify-center">
                <span
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", color: "#ffffff" }}
                  className="backdrop-blur-md text-[10px] font-bold px-3 py-1 rounded-full shadow-sm !text-white"
                >
                  {t("today_label", "Today")}
                </span>
              </div>

              <div className="flex justify-start">
                <div
                  className="max-w-[85%] rounded-2xl rounded-tl-sm p-3.5 shadow-xl text-xs space-y-1 transition-colors duration-300 border bg-white/95 text-gray-900 border-gray-200"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.96)", color: "#0f172a", borderColor: "rgba(0, 0, 0, 0.1)" }}
                >
                  <p className="font-semibold leading-relaxed" style={{ color: "#0f172a" }}>
                    {t("preview_sample_incoming", "Hey! How does this chat theme look?")}
                  </p>
                  <div className="flex justify-end text-[9px] pt-0.5" style={{ color: "rgba(15, 23, 42, 0.6)" }}>
                    10:42 AM
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <div
                  className="max-w-[85%] text-white rounded-2xl rounded-tr-sm p-3.5 shadow-xl text-xs space-y-1 sent-message-bubble"
                  style={{ backgroundColor: previewThemeModal.color || "#7c5dfa", color: "#ffffff" }}
                >
                  <p className="font-semibold leading-relaxed" style={{ color: "#ffffff" }}>
                    {t("preview_sample_outgoing", "This will replace your existing default chat theme. Only you see your chat themes.")}
                  </p>
                  <div className="flex justify-end items-center gap-1 text-[9px] text-white/90 pt-0.5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    <span>10:43 AM</span>
                    <CheckCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 backdrop-blur-md border-t flex items-center justify-between z-20 ${previewThemeModal.isDarkPreview
            ? "bg-black/60 border-white/10 text-white"
            : "bg-white/90 border-gray-200 text-gray-900 shadow-sm"
            }`}>
            <label className="relative cursor-pointer group flex items-center gap-1.5" title="Choose custom color">
              <div
                className={`w-7 h-7 rounded-full border-2 shadow-lg group-hover:scale-110 transition-transform ${previewThemeModal.isDarkPreview ? "border-white/60" : "border-gray-400"
                  }`}
                style={{ backgroundColor: previewThemeModal.color || "#7c5dfa" }}
              ></div>
              <input
                type="color"
                value={previewThemeModal.color || "#7c5dfa"}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setPreviewThemeModal(prev => ({ ...prev, color: newColor }));
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>

            <div className="flex items-center gap-1.5">
              {[
                { id: "default", name: "Default Clean", color: "#7c5dfa", wallpaper: "", previewBg: "linear-gradient(135deg, #181627 0%, #110f1d 100%)" },
                { id: "peachy_bloom", name: "Peachy Bloom", color: "#ec4899", wallpaper: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)" },
                { id: "ocean_waves", name: "Ocean Waves", color: "#06b6d4", wallpaper: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #a5f3fc 0%, #06b6d4 100%)" },
                { id: "sky_horizon", name: "Sky Horizon", color: "#3b82f6", wallpaper: "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #bfdbfe 0%, #3b82f6 100%)" },
                { id: "lilac_holographic", name: "Lilac Iridescent", color: "#a855f7", wallpaper: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #e9d5ff 0%, #a855f7 100%)" },
                { id: "golden_sunset", name: "Golden Sunset", color: "#f97316", wallpaper: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #ffedd5 0%, #f97316 100%)" },
                { id: "rose_quartz", name: "Rose Quartz", color: "#f43f5e", wallpaper: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #fecdd3 0%, #f43f5e 100%)" },
                { id: "tropical_palms", name: "Tropical Palms", color: "#10b981", wallpaper: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=800&auto=format&fit=crop", previewBg: "linear-gradient(135deg, #a7f3d0 0%, #10b981 100%)" },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    setPreviewThemeModal({
                      ...previewThemeModal,
                      presetId: th.id,
                      name: th.name,
                      color: th.color,
                      wallpaper: th.wallpaper,
                      previewBg: th.previewBg,
                    });
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${previewThemeModal.presetId === th.id
                    ? (previewThemeModal.isDarkPreview ? "w-6 bg-white" : "w-6 bg-gray-900")
                    : (previewThemeModal.isDarkPreview ? "w-2 bg-white/40 hover:bg-white/60" : "w-2 bg-gray-300 hover:bg-gray-500")
                    }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const nextDark = !previewThemeModal.isDarkPreview;
                setPreviewThemeModal(prev => ({ ...prev, isDarkPreview: nextDark }));
                changeTheme(nextDark ? "dark" : "light");
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${previewThemeModal.isDarkPreview
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              title={previewThemeModal.isDarkPreview ? "Switch to Light mode" : "Switch to Dark mode"}
            >
              {previewThemeModal.isDarkPreview ? (
                <Moon className="w-4 h-4 text-indigo-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>
          </div>
        </div>
      )}

      {isUploadingStatus && (
        <div className="fixed inset-0 z-[500] bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-[#1f1d2c] border border-white/10 w-full max-w-xs rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl space-y-4">
            <span className="w-10 h-10 border-4 border-[#7c5dfa] border-t-transparent rounded-full animate-spin"></span>
            <h4 className="text-sm font-bold text-white font-sans">Uploading status update...</h4>
            <p className="text-xs text-[#b69eff] font-bold font-mono">{statusUploadProgress}%</p>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#7c5dfa] h-full transition-all duration-200" style={{ width: `${statusUploadProgress}%` }}></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
