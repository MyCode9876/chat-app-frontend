"use client";

import { useState, useEffect, useRef } from "react";
import { X, Eye, ChevronLeft, ChevronRight, Trash2, Share2, MoreVertical, Heart, Smile, Send } from "lucide-react";
import { viewStatusUpdate, getStatusViewersList, deleteStatusUpdate, likeStatusUpdate } from "../services/status";
import { createPersonalChat } from "../services/chat";
import { sendChatMessage } from "../services/message";
import { useTranslation } from "./i18n";

export default function StatusViewer({
  statusGroup,
  currentUser,
  themeColor,
  contacts = [],
  onClose,
  onStatusDeleted,
}) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [localViewsCount, setLocalViewsCount] = useState(0);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [showDotMenu, setShowDotMenu] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [showEmojiReactions, setShowEmojiReactions] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkLight = () => {
        const isLight = document.documentElement.classList.contains("light") || localStorage.getItem("theme") === "light";
        setIsLightMode(isLight);
      };
      checkLight();
      const observer = new MutationObserver(checkLight);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    }
  }, []);

  const activeStatus = statusGroup.statuses[currentIndex];
  const isOwnStatus = Number(statusGroup.user.id) === Number(currentUser.id);
  const timerRef = useRef(null);

  let displayUrl = activeStatus?.content || "";
  let displayCaption = "";
  if (activeStatus && (activeStatus.type === "image" || activeStatus.type === "video")) {
    if (activeStatus.content?.startsWith("{")) {
      try {
        const parsed = JSON.parse(activeStatus.content);
        displayUrl = parsed.url;
        displayCaption = parsed.caption || "";
      } catch (e) { }
    }
  }

  const getStatusReplyPrefix = () => {
    if (!activeStatus) return "";
    let cleanUrl = activeStatus.content || "";
    if (activeStatus.type === "image" || activeStatus.type === "video") {
      if (activeStatus.content && activeStatus.content.startsWith("{")) {
        try {
          const parsed = JSON.parse(activeStatus.content);
          cleanUrl = parsed.url || "";
        } catch (e) { }
      }
    }
    return `\u200Bstatus_reply:${activeStatus.type || "image"}:${encodeURIComponent(cleanUrl)}\u200B`;
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    setReplyText("");
    try {
      const roomRes = await createPersonalChat(statusGroup.user.id);
      if (roomRes && roomRes.success) {
        await sendChatMessage({
          room_id: roomRes.room.id,
          message_text: `${getStatusReplyPrefix()}${text}`
        });
      }
    } catch (err) {
      console.error("Failed to send status reply:", err);
    }
  };

  const triggerHearts = () => {
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Math.random(),
      left: 40 + Math.random() * 20, // around center bottom
      delay: i * 150,
      rot: (Math.random() - 0.5) * 60,
    }));
    setHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.find((nh) => nh.id === h.id)));
    }, 2500);
  };

  // Auto-advance status slides
  useEffect(() => {
    setProgress(0);
    setShowDotMenu(false);
    if (!activeStatus) return;

    setIsLiked(!!activeStatus.liked);

    // Dynamically refresh status views list and count
    if (isOwnStatus) {
      getStatusViewersList(activeStatus.id)
        .then((res) => {
          if (res.success) {
            setViewers(res.viewers);
            setLocalViewsCount(res.viewers.length);
            const hasLikes = res.viewers.some(v => v.is_liked);
            if (hasLikes) {
              triggerHearts();
            }
          }
        })
        .catch((err) => console.error("Failed to fetch viewers:", err));
    } else {
      setLocalViewsCount(activeStatus.views_count || 0);
    }

    // Log a view if it is not the user's own status
    if (!isOwnStatus) {
      viewStatusUpdate(activeStatus.id).catch((err) =>
        console.error("Failed to log view:", err)
      );
    }

    // Interval to update progress bar (every 100ms)
    const duration = activeStatus.type === "video" ? 8000 : 5000;
    const intervalTime = 100;
    const increment = (intervalTime / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleNext();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < statusGroup.statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(0);
      setProgress(0);
    }
  };

  const handleCloseViewers = (e) => {
    e.stopPropagation();
    setShowViewers(false);
  };

  const handleOpenViewers = async (e) => {
    e.stopPropagation();
    if (!isOwnStatus) return;

    setShowViewers(true);
    setViewersLoading(true);
    try {
      const res = await getStatusViewersList(activeStatus.id);
      if (res.success) {
        setViewers(res.viewers);
      }
    } catch (err) {
      console.error("Failed to load viewers:", err);
    } finally {
      setViewersLoading(false);
    }
  };

  const handleDeleteStatus = (e) => {
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteStatus = async () => {
    try {
      const res = await deleteStatusUpdate(activeStatus.id);
      if (res.success) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (onStatusDeleted) {
          onStatusDeleted(activeStatus.id);
        }
        if (statusGroup.statuses.length <= 1) {
          onClose();
        } else {
          if (currentIndex >= statusGroup.statuses.length - 1) {
            setCurrentIndex((prev) => Math.max(0, prev - 1));
          } else {
            setCurrentIndex(currentIndex);
          }
        }
      }
    } catch (err) {
      console.error("Failed to delete status:", err);
    }
  };

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    setShowDotMenu(false);
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    activeStatus.liked = nextLiked;
    try {
      await likeStatusUpdate(activeStatus.id, nextLiked);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleDoubleClick = async (e) => {
    e.stopPropagation();
    if (isOwnStatus) return;
    if (!isLiked) {
      setIsLiked(true);
      activeStatus.liked = true;
      triggerHearts();
      try {
        await likeStatusUpdate(activeStatus.id, true);
      } catch (err) {
        console.error("Failed to like status:", err);
      }
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ url: activeStatus.content }).catch(() => { });
    } else {
      navigator.clipboard?.writeText(activeStatus.content);
    }
  };

  // Click on screen sides to go back/forward
  const handleScreenClick = (e) => {
    if (showViewers || showDotMenu) return;

    const screenWidth = window.innerWidth;
    const clickX = e.clientX;

    if (clickX < screenWidth * 0.3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const formattedTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("status_viewer_just_now");
    if (diffMin < 60) return `${diffMin}${t("status_viewer_time_ago")}`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}${t("status_viewer_time_hours_ago")}`;
    return d.toLocaleDateString();
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col select-none overflow-hidden transition-colors duration-200 ${isLightMode ? "bg-[#efeae2]" : "bg-black"}`}
      onClick={handleScreenClick}
    >
      <style>{`
        @keyframes fly-up-heart {
          0% {
            transform: translateY(0) scale(0.4) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(-320px) scale(1.1) rotate(var(--rot));
            opacity: 0;
          }
        }
        .flying-heart {
          position: absolute;
          bottom: 40px;
          animation: fly-up-heart 2.2s forwards cubic-bezier(0.1, 0.8, 0.3, 1);
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none z-[80] overflow-hidden">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="flying-heart"
            style={{
              left: `${h.left}%`,
              animationDelay: `${h.delay}ms`,
              "--rot": `${h.rot}deg`,
            }}
          >
            <Heart className="w-4 h-4 text-[#7c5dfa] fill-[#7c5dfa]" />
          </div>
        ))}
      </div>

      <div className="absolute top-3 left-0 right-0 z-50 flex gap-1 px-4">
        {statusGroup.statuses.map((s, idx) => {
          let widthVal = "0%";
          if (idx < currentIndex) widthVal = "100%";
          else if (idx === currentIndex) widthVal = `${progress}%`;
          return (
            <div key={s.id} className={`flex-1 h-[3px] rounded-full overflow-hidden ${isLightMode ? "bg-black/10" : "bg-white/25"}`}>
              <div
                className={`h-full transition-all duration-100 ease-linear rounded-full ${isLightMode ? "bg-black" : "bg-white"}`}
                style={{ width: widthVal }}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute top-7 left-0 right-0 z-50 flex items-center justify-between px-3 py-1 pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className={`p-1.5 transition-colors cursor-pointer ${isLightMode ? "text-black/70 hover:text-black" : "text-white/80 hover:text-white"}`}
          >
            <X className="w-5 h-5" />
          </button>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${isLightMode ? "bg-gray-200 border-2 border-black/10" : "bg-[#27243c] border-2 border-white/20"}`}>
            {statusGroup.user.profile_image ? (
              <img src={statusGroup.user.profile_image} alt="" className="w-full h-full object-cover" />
            ) : (() => {
              const savedContact = (contacts || []).find(c => Number(c.id) === Number(statusGroup.user.id));
              const first = savedContact ? savedContact.first_name : statusGroup.user.first_name;
              const last = savedContact ? savedContact.last_name : statusGroup.user.last_name;
              return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
            })()}
          </div>
          <div>
            <p className="text-xs font-bold leading-none" style={{ color: isLightMode ? '#000000' : '#ffffff' }}>
              {isOwnStatus ? t("status_my_status") : (() => {
                const savedContact = (contacts || []).find(c => Number(c.id) === Number(statusGroup.user.id));
                if (savedContact) {
                  return `${savedContact.first_name || ""} ${savedContact.last_name || ""}`.trim();
                }
                return `${statusGroup.user.first_name || ""} ${statusGroup.user.last_name || ""}`.trim();
              })()}
            </p>
            {activeStatus && (
              <p className={`text-[10px] mt-0.5 ${isLightMode ? "text-black/50" : "text-white/60"}`}>{formattedTime(activeStatus.created_at)}</p>
            )}
          </div>
        </div>

      </div>

      {activeStatus && activeStatus.type !== "text" && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110 pointer-events-none z-0"
          style={{ backgroundImage: `url(${displayUrl})` }}
        />
      )}

      <div onDoubleClick={handleDoubleClick} className="flex-1 flex flex-col items-center justify-center p-4 z-10 relative mt-16 mb-20">
        {activeStatus && (
          activeStatus.type === "text" ? (
            <div
              className="w-full max-w-sm aspect-[9/16] max-h-[58vh] flex items-center justify-center p-8 text-center text-xl sm:text-2xl font-black rounded-3xl shadow-2xl overflow-hidden"
              style={{ backgroundColor: activeStatus.bg_color || "#7c5dfa" }}
            >
              <p className="text-white force-text-white select-text leading-relaxed whitespace-pre-wrap drop-shadow-md">
                {activeStatus.content}
              </p>
            </div>
          ) : activeStatus.type === "video" ? (
            <div className="w-full max-w-sm aspect-[9/16] max-h-[58vh] rounded-3xl overflow-hidden shadow-2xl bg-black relative flex flex-col justify-between">
              <video
                src={displayUrl}
                className="w-full h-full object-cover"
                autoPlay muted playsInline
              />
              {displayCaption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xs p-4 text-center text-white force-text-white text-xs font-medium border-t border-white/5 select-text whitespace-pre-wrap">
                  {displayCaption}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-sm aspect-[9/16] max-h-[58vh] rounded-3xl overflow-hidden shadow-2xl bg-black relative flex flex-col justify-between">
              <img
                src={displayUrl}
                alt="Status update"
                className="w-full h-full object-cover"
              />
              {displayCaption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xs p-4 text-center text-white force-text-white text-xs font-medium border-t border-white/5 select-text whitespace-pre-wrap">
                  {displayCaption}
                </div>
              )}
            </div>
          )
        )}
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 left-3 z-40 hidden md:block">
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          disabled={currentIndex === 0}
          className="p-2.5 bg-white/10 border border-white/10 text-white hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed rounded-full transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-3 z-40 hidden md:block">
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="p-2.5 bg-white/10 border border-white/10 text-white hover:bg-white/20 rounded-full transition-all cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {isOwnStatus ? (
        <div className="absolute bottom-5 left-0 right-0 z-50 flex justify-center pointer-events-auto">
          <button
            onClick={handleOpenViewers}
            className="bg-black/60 backdrop-blur-md border border-white/10 text-white force-text-white px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-black/80 transition-all shadow-lg cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#b69eff]" />
            <span>{localViewsCount} {localViewsCount === 1 ? t("view") : t("views")}</span>
          </button>
        </div>
      ) : (
        <div
          className="absolute bottom-5 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2 pointer-events-auto w-full max-w-sm mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t("reply_label", "Reply")}
            className={`flex-1 text-xs rounded-full py-2.5 px-4 focus:outline-none transition-all font-medium backdrop-blur-md ${isLightMode
              ? "bg-black/5 hover:bg-black/10 text-black placeholder-black/50"
              : "bg-white/15 hover:bg-white/20 text-white placeholder-white/50"
              }`}
            style={{
              border: "none",
              outline: "none"
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendReply();
              }
            }}
          />

          <button
            type="button"
            onClick={handleSendReply}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border-none shrink-0 ${isLightMode
              ? "bg-black/5 hover:bg-black/10 text-black/70 hover:text-black"
              : "bg-white/15 hover:bg-white/20 text-white/80 hover:text-white"
              }`}
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiReactions(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border-none ${isLightMode
              ? "bg-black/5 hover:bg-black/10 text-black/70 hover:text-black"
              : "bg-white/15 hover:bg-white/20 text-white/80 hover:text-white"
              }`}
            title="Quick Reactions"
          >
            <Smile className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={async () => {
              const nextLiked = !isLiked;
              setIsLiked(nextLiked);
              activeStatus.liked = nextLiked;
              try {
                await likeStatusUpdate(activeStatus.id, nextLiked);
                if (nextLiked) {
                  triggerHearts();
                }
              } catch (err) {
                console.error("Failed to toggle like status:", err);
              }
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border-none ${isLightMode
              ? "bg-black/5 hover:bg-black/10 text-black/70 hover:text-black"
              : "bg-white/15 hover:bg-white/20 text-white/80 hover:text-white"
              }`}
            title="Like status"
          >
            <Heart
              className="w-4 h-4"
              style={{
                fill: isLiked ? (themeColor || "#7c5dfa") : "transparent",
                color: isLiked ? (themeColor || "#7c5dfa") : (isLightMode ? "#000000" : "#ffffff")
              }}
            />
          </button>
        </div>
      )}

      {showEmojiReactions && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowEmojiReactions(false)}
        >
          <div
            className={`border rounded-[28px] p-5 flex flex-col items-center gap-3.5 shadow-2xl animate-scale-up w-full max-w-[280px] ${isLightMode
              ? "bg-white/95 border-gray-200/80 text-gray-900"
              : "bg-[#1f1d2c]/95 border-white/15 text-white"
              }`}
            style={{
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-widest pl-0.5 ${isLightMode ? "text-gray-400" : "text-white/40"
                }`}
            >
              {t("status_viewer_tap_to_send", "Tap to send")}
            </span>
            <div className="grid grid-cols-4 gap-3">
              {["😍", "😂", "😮", "😢", "🙏", "👏", "🎉", "👍"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={async () => {
                    setShowEmojiReactions(false);
                    triggerHearts();
                    try {
                      const roomRes = await createPersonalChat(statusGroup.user.id);
                      if (roomRes && roomRes.success) {
                        await sendChatMessage({
                          room_id: roomRes.room.id,
                          message_text: `${getStatusReplyPrefix()}${emoji}`
                        });
                      }
                    } catch (err) {
                      console.error("Failed to send emoji reaction:", err);
                    }
                  }}
                  className="text-3xl hover:scale-125 transition-transform duration-100 bg-transparent border-none cursor-pointer p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showViewers && (
        <div
          className="absolute inset-0 z-[120] bg-black/50 backdrop-blur-sm flex justify-center items-end"
          onClick={handleCloseViewers}
        >
          <div
            className={`w-full max-w-lg rounded-t-3xl flex flex-col max-h-[65%] shadow-2xl text-[#ffffff] overflow-hidden ${isLightMode ? "bg-white border-t border-gray-200" : "bg-[#1f1d2c] border-t border-white/10"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-[#7c5dfa] text-white !text-white select-none status-viewer-header">
              <p className="text-sm font-extrabold text-white status-viewer-header" style={{ color: "#ffffff" }}>
                {t("status_viewer_viewed_by")} {viewers.length}
              </p>
              <div className="flex items-center gap-1" style={{ color: "#ffffff" }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleShare(e); }}
                  title={t("share_status")}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  style={{ color: "#ffffff" }}
                >
                  <Share2 className="w-4 h-4" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowViewers(false); setIsDeleteConfirmOpen(true); }}
                  title={t("delete_status")}
                  className="p-2 rounded-full hover:bg-red-600/30 transition-colors cursor-pointer"
                  style={{ color: "#ffffff" }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                </button>
                <button
                  type="button"
                  onClick={handleCloseViewers}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer ml-1"
                  style={{ color: "#ffffff" }}
                >
                  <X className="w-4 h-4" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                </button>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto no-scrollbar py-2 px-5 ${isLightMode ? "bg-white divide-y divide-gray-100" : "bg-[#1a1726] divide-y divide-white/5"
              }`}>
              {viewersLoading ? (
                <div className={`text-center py-10 text-xs ${isLightMode ? "text-gray-400" : "text-white/40"}`}>{t("status_viewer_loading")}</div>
              ) : viewers.length === 0 ? (
                <div className={`text-center py-12 text-xs ${isLightMode ? "text-gray-400" : "text-white/40"}`}>{t("status_viewer_no_views")}</div>
              ) : (
                viewers.map((viewer) => {
                  const initials = (() => {
                    const savedContact = (contacts || []).find(c => Number(c.id) === Number(viewer.id));
                    const first = savedContact ? savedContact.first_name : viewer.first_name;
                    const last = savedContact ? savedContact.last_name : viewer.last_name;
                    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
                  })();
                  return (
                    <div key={viewer.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold overflow-hidden shrink-0 ${isLightMode ? "bg-gray-100 text-gray-700 border border-gray-200" : "bg-[#2a273c] text-white/80 border border-white/10"
                          }`}>
                          {viewer.profile_image ? (
                            <img src={viewer.profile_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold flex items-center gap-1.5 animate-fade-in ${isLightMode ? "text-gray-900" : "text-white"
                            }`}>
                            {(() => {
                              const savedContact = (contacts || []).find(c => Number(c.id) === Number(viewer.id));
                              if (savedContact) {
                                return `${savedContact.first_name || ""} ${savedContact.last_name || ""}`.trim();
                              }
                              return `${viewer.first_name || ""} ${viewer.last_name || ""}`.trim();
                            })()}
                            {viewer.is_liked && <span className="text-[10px]" title="Liked">💜</span>}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isLightMode ? "text-gray-500" : "text-white/40"}`}>{formattedTime(viewer.viewed_at)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={(e) => { e.stopPropagation(); setIsDeleteConfirmOpen(false); }}
        >
          <div
            className={`w-full max-w-xs rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl ${isLightMode ? "bg-white border border-gray-200" : "bg-[#1f1d2c] border border-white/10"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h4 className={`text-sm font-bold mb-1.5 ${isLightMode ? "text-gray-900" : "text-white"}`}>{t("status_viewer_delete_confirm_title")}</h4>
            <p className={`text-[11px] leading-relaxed mb-6 px-1 ${isLightMode ? "text-gray-600" : "text-white/50"}`}>
              {t("status_viewer_delete_confirm_desc")}
            </p>
            <div className="flex items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsDeleteConfirmOpen(false); }}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${isLightMode ? "bg-gray-100 hover:bg-gray-200 text-gray-700" : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
                  }`}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsDeleteConfirmOpen(false);
                  await executeDeleteStatus();
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer"
              >
                {t("status_viewer_delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
