"use client";
import ChatPage from "../chat/page";

export default function ProfileRoute() {
  return <ChatPage initialTab="settings" initialSettingsView="profile" />;
}
