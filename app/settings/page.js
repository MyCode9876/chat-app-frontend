"use client";
import ChatPage from "../chat/page";

export default function SettingsRoute() {
  return <ChatPage initialTab="settings" initialSettingsView="menu" />;
}
