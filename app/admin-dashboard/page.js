"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  Mail,
  RefreshCw,
  LogOut,
  Search,
  ShieldCheck,
  Sun,
  Moon,
  Filter,
  AlertCircle,
  Trash2,
} from "lucide-react";
import api from "../../services/api";

const StatCard = ({ title, value, icon: Icon, color, isDark }) => (
  <div
    className={`border rounded-2xl p-4 shadow-sm transition-colors ${isDark
      ? "bg-[#110f1e] border-white/5"
      : "bg-white border-slate-200"
      }`}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          backgroundColor: isDark ? `${color}20` : `${color}15`,
          color: color,
        }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-white/50" : "text-slate-500"
          }`}>
          {title}
        </p>
        <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          {value}
        </p>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState({
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      totalFeedbacks: 0,
      totalContactQueries: 0,
      totalGroups: 0,
      totalCommunities: 0,
      totalMessages: 0,
    },
    users: [],
    feedbacks: [],
    contactMessages: [],
    groups: [],
    communities: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [groupReports, setGroupReports] = useState([]);


  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_theme_mode") || "dark";
    }
    return "dark";
  });

  const toggleTheme = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_theme_mode", next);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/dashboard-data");
      if (res.data?.success) {
        setData(res.data);
        if (res.data.reports) setGroupReports(res.data.reports);
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.email !== "admin@yopmail.com" && !user.is_admin && user.role !== "admin") {
          router.push("/chat");
          return;
        }
      } catch (_) { }
    }
    try {
      const saved = localStorage.getItem("reported_groups");
      if (saved) setGroupReports(JSON.parse(saved));
    } catch (_) { }
    fetchData();
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/login");
  };

  const filteredUsers = data.users.filter((u) => {
    const searchStr =
      `${u.first_name || ""} ${u.last_name || ""} ${u.email || ""} ${u.mobile || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const statusMatch =
      userStatusFilter === "all" ||
      (userStatusFilter === "active" ? u.status !== "deleted" : u.status === userStatusFilter);
    return searchStr && statusMatch;
  });

  const filteredFeedbacks = data.feedbacks.filter((f) => {
    const searchStr =
      `${f.user_name || ""} ${f.user_email || ""} ${f.message || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const typeMatch = feedbackTypeFilter === "all" || f.feedback_type === feedbackTypeFilter;
    return searchStr && typeMatch;
  });

  const filteredContacts = data.contactMessages.filter((c) =>
    `${c.name || ""} ${c.mobile || ""} ${c.subject || ""} ${c.message || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredReports = groupReports.filter((r) =>
    `${r.group_name || ""} ${r.reason || ""} ${r.reported_by?.first_name || ""} ${r.reported_by?.email || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredGroups = (data.groups || []).filter((g) =>
    `${g.name || ""} ${g.creator?.first_name || ""} ${g.creator?.email || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredCommunities = (data.communities || []).filter((c) =>
    `${c.name || ""} ${c.creator?.first_name || ""} ${c.creator?.email || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const isDark = themeMode === "dark";

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? "bg-[#07060d] text-white" : "bg-slate-50 text-slate-800"
        }`}
    >
      <header
        className={`h-16 px-6 flex items-center justify-between sticky top-0 z-50 border-b transition-colors ${isDark
          ? "bg-[#0d0b17]/95 backdrop-blur-md border-white/5"
          : "bg-white/95 backdrop-blur-md border-slate-200"
          }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7c5dfa] flex items-center justify-center text-white shadow-md shadow-[#7c5dfa]/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              MYCHATBOX Admin
            </h1>
            <p className={`text-[11px] ${isDark ? "text-white/40" : "text-slate-500"}`}>
              Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all cursor-pointer border text-xs ${isDark
              ? "bg-white/5 hover:bg-white/10 text-amber-300 border-white/10"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${isDark
              ? "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
              : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
              }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#7c5dfa]" : ""}`} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Users"
            value={data.stats.totalUsers}
            icon={Users}
            color="#7c5dfa"
            isDark={isDark}
          />
          <StatCard
            title="Messages"
            value={data.stats.totalMessages}
            icon={MessageSquare}
            color="#14b8a6"
            isDark={isDark}
          />
          <StatCard
            title="Feedbacks"
            value={data.stats.totalFeedbacks}
            icon={MessageSquare}
            color="#f59e0b"
            isDark={isDark}
          />
          <StatCard
            title="Groups"
            value={data.stats.totalGroups}
            icon={Users}
            color="#6366f1"
            isDark={isDark}
          />
          <StatCard
            title="Communities"
            value={data.stats.totalCommunities}
            icon={Users}
            color="#14b8a6"
            isDark={isDark}
          />
          <StatCard
            title="Reports"
            value={groupReports.length}
            icon={AlertCircle}
            color="#ef4444"
            isDark={isDark}
          />
        </div>

        <div
          className={`border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors ${isDark ? "bg-[#110f1e] border-white/5" : "bg-white border-slate-200"
            }`}
        >
          <div
            className={`p-4 border-b flex flex-wrap gap-4 items-center justify-between transition-colors ${isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/50 border-slate-200"
              }`}
          >
            <div className={`flex p-1 rounded-xl gap-1 ${isDark ? "bg-white/5" : "bg-slate-200/60"} flex-wrap`}>
              {[
                { id: "users", label: "Users", count: data.users.length },
                { id: "feedbacks", label: "Feedbacks", count: data.feedbacks.length },
                { id: "contacts", label: "Contacts", count: data.contactMessages.length },
                { id: "reports", label: "Reports", count: groupReports.length },
                { id: "groups", label: "Groups", count: data.groups?.length || 0 },
                { id: "communities", label: "Communities", count: data.communities?.length || 0 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id
                    ? isDark
                      ? "bg-[#7c5dfa] text-white shadow-md"
                      : "bg-white text-purple-700 shadow-sm"
                    : isDark
                      ? "text-white/60 hover:text-white"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  {tab.label}{" "}
                  <span
                    className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id
                      ? isDark
                        ? "bg-white/20 text-white"
                        : "bg-purple-100 text-purple-700"
                      : isDark
                        ? "bg-white/10 text-white/40"
                        : "bg-slate-200 text-slate-500"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
              <div className="relative flex-1 min-w-[140px]">
                <Search
                  className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-slate-400"
                    }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none transition-all shadow-sm ${isDark
                    ? "bg-[#191727] border-white/10 text-white placeholder:text-white/30 focus:border-[#7c5dfa]"
                    : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-500"
                    }`}
                />
              </div>

              {activeTab === "feedbacks" && (
                <select
                  value={feedbackTypeFilter}
                  onChange={(e) => setFeedbackTypeFilter(e.target.value)}
                  className={`border text-xs px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer shadow-sm font-medium ${isDark
                    ? "bg-[#191727] border-white/10 text-white"
                    : "bg-white border-slate-200 text-slate-700"
                    }`}
                >
                  <option value="all">All Types</option>
                  <option value="general">General</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                </select>
              )}

              {activeTab === "users" && (
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className={`border text-xs px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer shadow-sm font-medium ${isDark
                    ? "bg-[#191727] border-white/10 text-white"
                    : "bg-white border-slate-200 text-slate-700"
                    }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="deleted">Deleted</option>
                </select>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeTab === "users" && (
              <table className="w-full text-left text-xs">
                <thead
                  className={`uppercase tracking-widest text-[10px] font-semibold border-b ${isDark
                    ? "bg-white/[0.02] text-white/40 border-white/5"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                >
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Logins</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Joined</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`p-8 text-center italic ${isDark ? "text-white/30" : "text-slate-400"}`}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "User";
                      const initials = u.first_name ? u.first_name.charAt(0).toUpperCase() : "?";
                      return (
                        <tr key={u.id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"}`}>
                          <td className={`p-4 font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden shadow-sm">
                              {u.profile_image ? (
                                <img src={u.profile_image} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                initials
                              )}
                            </div>
                            <div>
                              <p className="font-bold">{name}</p>
                              <p className={`text-[10px] font-mono ${isDark ? "text-white/40" : "text-slate-400"}`}>
                                ID: #{u.id}
                              </p>
                            </div>
                          </td>
                          <td className={`p-4 font-mono ${isDark ? "text-white/70" : "text-slate-600"}`}>{u.email}</td>
                          <td className={`p-4 font-mono ${isDark ? "text-white/60" : "text-slate-600"}`}>{u.mobile || "N/A"}</td>
                          <td className="p-4 font-mono font-bold text-purple-500">
                            <span className={`px-2.5 py-1 rounded-lg border ${isDark
                              ? "bg-purple-500/15 text-purple-300 border-purple-500/20"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                              }`}>
                              {u.login_count || 1} logins
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.status === "deleted"
                              ? "bg-red-500/15 text-red-400 border border-red-500/20"
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              }`}>
                              {u.status || "active"}
                            </span>
                          </td>
                          <td className={`p-4 font-mono text-[11px] ${isDark ? "text-white/40" : "text-slate-500"}`}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "feedbacks" && (
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-widest text-[10px] font-semibold border-b ${isDark
                  ? "bg-white/[0.02] text-white/40 border-white/5"
                  : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}>
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                  {filteredFeedbacks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`p-8 text-center italic ${isDark ? "text-white/30" : "text-slate-400"}`}>
                        No feedbacks found.
                      </td>
                    </tr>
                  ) : (
                    filteredFeedbacks.map((f) => (
                      <tr key={f.id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"}`}>
                        <td className={`p-4 font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{f.user_name || "User"}</td>
                        <td className={`p-4 font-mono ${isDark ? "text-white/60" : "text-slate-600"}`}>{f.user_email || "N/A"}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${f.feedback_type === "bug" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                            f.feedback_type === "feature" ? "bg-purple-500/15 text-purple-300 border border-purple-500/20" :
                              "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                            }`}>
                            {f.feedback_type}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-amber-500 select-none tracking-wide whitespace-nowrap">
                          {"★".repeat(f.rating || 5)}
                          <span className="text-[10px] ml-1.5 text-white/40">({f.rating || 5})</span>
                        </td>
                        <td className={`p-4 font-mono text-[11px] ${isDark ? "text-white/40" : "text-slate-500"}`}>
                          {new Date(f.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "contacts" && (
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-widest text-[10px] font-semibold border-b ${isDark
                  ? "bg-white/[0.02] text-white/40 border-white/5"
                  : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}>
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Phone / Email</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Message</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`p-8 text-center italic ${isDark ? "text-white/30" : "text-slate-400"}`}>
                        No contact queries found.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c) => (
                      <tr key={c.id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"}`}>
                        <td className={`p-4 font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{c.name}</td>
                        <td className={`p-4 font-mono ${isDark ? "text-white/60" : "text-slate-600"}`}>{c.mobile}</td>
                        <td className="p-4 font-bold text-purple-500">{c.subject}</td>
                        <td className={`p-4 max-w-md leading-relaxed ${isDark ? "text-white/90" : "text-slate-800"}`}>{c.message}</td>
                        <td className={`p-4 font-mono text-[11px] ${isDark ? "text-white/40" : "text-slate-500"}`}>
                          {new Date(c.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "groups" && (
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-widest text-[10px] font-semibold border-b ${isDark
                  ? "bg-white/[0.02] text-white/40 border-white/5"
                  : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}>
                  <tr>
                    <th className="p-4">Group</th>
                    <th className="p-4">Creator</th>
                    <th className="p-4">Members</th>
                    <th className="p-4">Permissions</th>
                    <th className="p-4">Created</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                  {filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`p-8 text-center italic ${isDark ? "text-white/30" : "text-slate-400"}`}>
                        No groups found.
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((g) => (
                      <tr key={g.id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"}`}>
                        <td className={`p-4 font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden shadow-sm">
                            {g.group_image ? (
                              <img src={g.group_image} alt="group" className="w-full h-full object-cover" />
                            ) : (
                              (g.name || "G").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold">{g.name}</p>
                            <p className={`text-[10px] font-mono ${isDark ? "text-white/40" : "text-slate-400"}`}>ID: #{g.id}</p>
                          </div>
                        </td>
                        <td className={`p-4 ${isDark ? "text-white/70" : "text-slate-600"}`}>
                          <div>
                            <p className="font-semibold">{g.creator?.first_name} {g.creator?.last_name || ""}</p>
                            <p className={`text-[10px] font-mono ${isDark ? "text-white/40" : "text-slate-400"}`}>{g.creator?.email}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-indigo-500">
                          <span className={`px-2.5 py-1 rounded-lg border ${isDark
                            ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/20"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            }`}>
                            {g.members_count} members
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${g.only_admins_send
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            }`}>
                            {g.only_admins_send ? "Admins Only" : "All Members"}
                          </span>
                        </td>
                        <td className={`p-4 font-mono text-[11px] ${isDark ? "text-white/40" : "text-slate-500"}`}>
                          {g.created_at ? new Date(g.created_at).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "communities" && (
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-widest text-[10px] font-semibold border-b ${isDark
                  ? "bg-white/[0.02] text-white/40 border-white/5"
                  : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}>
                  <tr>
                    <th className="p-4">Community</th>
                    <th className="p-4">Creator</th>
                    <th className="p-4">Members</th>
                    <th className="p-4">Permissions</th>
                    <th className="p-4">Created</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                  {filteredCommunities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`p-8 text-center italic ${isDark ? "text-white/30" : "text-slate-400"}`}>
                        No communities found.
                      </td>
                    </tr>
                  ) : (
                    filteredCommunities.map((c) => (
                      <tr key={c.id} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"}`}>
                        <td className={`p-4 font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                          <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden shadow-sm">
                            {c.group_image ? (
                              <img src={c.group_image} alt="community" className="w-full h-full object-cover" />
                            ) : (
                              (c.name || "C").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold">{c.name}</p>
                            <p className={`text-[10px] font-mono ${isDark ? "text-white/40" : "text-slate-400"}`}>ID: #{c.id}</p>
                          </div>
                        </td>
                        <td className={`p-4 ${isDark ? "text-white/70" : "text-slate-600"}`}>
                          <div>
                            <p className="font-semibold">{c.creator?.first_name} {c.creator?.last_name || ""}</p>
                            <p className={`text-[10px] font-mono ${isDark ? "text-white/40" : "text-slate-400"}`}>{c.creator?.email}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-teal-500">
                          <span className={`px-2.5 py-1 rounded-lg border ${isDark
                            ? "bg-teal-500/15 text-teal-300 border-teal-500/20"
                            : "bg-teal-50 text-teal-700 border-teal-200"
                            }`}>
                            {c.members_count} members
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.only_admins_send
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            }`}>
                            {c.only_admins_send ? "Admins Only" : "All Members"}
                          </span>
                        </td>
                        <td className={`p-4 font-mono text-[11px] ${isDark ? "text-white/40" : "text-slate-500"}`}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "reports" && (
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-widest text-[10px] font-semibold border-b ${isDark
                  ? "bg-white/[0.02] text-white/40 border-white/5"
                  : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}>
                  <tr>
                    <th className="p-4">#</th>
                    <th className="p-4">Group</th>
                    <th className="p-4">Reported By</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`p-8 text-center italic ${isDark ? "text-white/30" : "text-slate-400"}`}>
                        No group reports submitted yet.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r, idx) => (
                      <tr key={idx} className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/80"}`}>
                        <td className={`p-4 font-mono font-bold ${isDark ? "text-white/40" : "text-slate-400"}`}>#{idx + 1}</td>
                        <td className={`p-4 font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          <div>
                            <p>{r.group_name || "Unknown Group"}</p>
                            <p className={`text-[10px] font-mono ${isDark ? "text-white/30" : "text-slate-400"}`}>ID: {r.group_id}</p>
                          </div>
                        </td>
                        <td className={`p-4 ${isDark ? "text-white/70" : "text-slate-600"}`}>
                          <div>
                            <p className="font-semibold">{r.reported_by?.first_name} {r.reported_by?.last_name}</p>
                            <p className={`text-[10px] font-mono ${isDark ? "text-white/30" : "text-slate-400"}`}>{r.reported_by?.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isDark
                            ? "bg-red-500/15 text-red-400 border border-red-500/20"
                            : "bg-red-50 text-red-600 border border-red-200"
                            }`}>
                            {r.reason || "No reason"}
                          </span>
                        </td>
                        <td className={`p-4 font-mono text-[11px] ${isDark ? "text-white/40" : "text-slate-500"}`}>
                          {r.created_at ? new Date(r.created_at).toLocaleString() : "N/A"}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => {
                              const updated = groupReports.filter((_, i) => i !== idx);
                              setGroupReports(updated);
                              localStorage.setItem("reported_groups", JSON.stringify(updated));
                            }}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Dismiss
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className={`p-3 border-t text-[10px] font-mono flex justify-between items-center ${isDark ? "border-white/5 text-white/30" : "border-slate-200 text-slate-400"
            }`}>
            <span>
              Showing{" "}
              {activeTab === "users"
                ? filteredUsers.length
                : activeTab === "feedbacks"
                  ? filteredFeedbacks.length
                  : activeTab === "contacts"
                    ? filteredContacts.length
                    : activeTab === "reports"
                      ? filteredReports.length
                      : activeTab === "groups"
                        ? filteredGroups.length
                        : filteredCommunities.length}{" "}
              entries
            </span>
            <span>Data sourced from live API</span>
          </div>
        </div>

        <div className={`text-center text-[11px] py-4 ${isDark ? "text-white/20" : "text-slate-400"}`}>
          MYCHATBOX Admin Dashboard &bull; Built with Next.js
        </div>
      </main>
    </div>
  );
}