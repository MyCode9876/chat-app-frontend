"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../services/api";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (value) => {
    let errorMsg = "";
    if (!value.trim()) {
      errorMsg = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errorMsg = "Please enter a valid email address.";
    }
    setError(errorMsg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", {
        email,
      });

      if (response.data.success) {
        setSuccess("OTP sent successfully to your email!");
        localStorage.setItem("resetEmail", email);

        setTimeout(() => {
          router.push("/verify-otp");
        }, 1500);
      } else {
        setError(response.data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Something went wrong. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121118] flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] rounded-full bg-[#7c5dfa]/5 blur-[100px] -top-12 -left-12 pointer-events-none"></div>
      <div className="absolute w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] -bottom-12 -right-12 pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#23212b] rounded-[24px] p-6 sm:p-10 border border-white/5 shadow-2xl relative z-10 transition-all duration-300">

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shadow-lg mb-4 text-purple-200">
            <KeyRound className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-wide">
            Forgot Password
          </h3>
          <p className="text-xs text-white/50 mt-2 px-4 leading-relaxed">
            Enter your registered email address below and we'll send you a 6-digit OTP code to verify and reset your password.
          </p>
        </div>

        {success && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 px-4 py-2.5 rounded-xl text-xs mb-5 flex items-center gap-2 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
                placeholder="Enter a email"
                className={`w-full bg-[#2a2836] border text-white rounded-lg px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${error ? "border-red-500" : "border-transparent focus:border-[#7c5dfa]"
                  }`}
              />
            </div>
            {error && (
              <p className="text-[10px] text-red-400 mt-1 pl-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-semibold py-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Send OTP Verification Code"
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-white/5 pt-4">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-[#7c5dfa] hover:underline font-semibold transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
