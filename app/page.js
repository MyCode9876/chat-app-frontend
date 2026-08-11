"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "../components/SplashScreen";

import { useTranslation } from "../components/i18n";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem("token");
      if (token) {
        router.push("/chat");
      } else {
        router.push("/login");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return <SplashScreen message={t("splash_secure_workspace")} />;
}
