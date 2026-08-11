"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../services/api";
import { Eye, EyeOff, ShieldAlert, ArrowLeft } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const validateField = (name, value) => {
    let errorMsg = "";

    if (name === "email") {
      if (!value.trim()) {
        errorMsg = "Email address is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMsg = "Please enter a valid email address.";
      }
    } else if (name === "otp") {
      if (!value.trim()) {
        errorMsg = "OTP code is required.";
      } else if (!/^\d{6}$/.test(value)) {
        errorMsg = "OTP must be a 6-digit number.";
      }
    } else if (name === "newPassword") {
      if (!value) {
        errorMsg = "New password is required.";
      } else if (value.length < 6) {
        errorMsg = "Password must be at least 6 characters.";
      }
    } else if (name === "confirmPassword") {
      if (value !== newPassword) {
        errorMsg = "Passwords do not match.";
      }
    }

    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setSuccess("");

    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!otp.trim()) {
      newErrors.otp = "OTP code is required.";
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = "OTP must be a 6-digit number.";
    }
    if (!newPassword) {
      newErrors.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters.";
    }
    if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).some((k) => newErrors[k])) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        otp: otp.trim(),
        new_password: newPassword,
      });

      if (response.data.success) {
        setSuccess("Password updated successfully! Redirecting to login...");
        localStorage.removeItem("resetEmail");

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setGlobalError(response.data.message || "Invalid OTP code.");
      }
    } catch (err) {
      setGlobalError(
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
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-wide">
            Verify OTP
          </h3>
          <p className="text-xs text-white/50 mt-2 px-4 leading-relaxed">
            Enter the 6-digit verification code sent to your email along with your new secure password.
          </p>
        </div>

        {globalError && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-xl text-xs mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
            {globalError}
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 px-4 py-2.5 rounded-xl text-xs mb-5 flex items-center gap-2">
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
                  validateField("email", e.target.value);
                }}
                placeholder="Enter a email"
                className={`w-full bg-[#2a2836] border text-white rounded-lg px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.email ? "border-red-500" : "border-transparent focus:border-[#7c5dfa]"
                  }`}
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-red-400 mt-1 pl-1">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  validateField("otp", e.target.value);
                }}
                placeholder="6-Digit OTP Code"
                className={`w-full bg-[#2a2836] border text-white rounded-lg px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.otp ? "border-red-500" : "border-transparent focus:border-[#7c5dfa]"
                  }`}
              />
            </div>
            {errors.otp && (
              <p className="text-[10px] text-red-400 mt-1 pl-1">
                {errors.otp}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  validateField("newPassword", e.target.value);
                }}
                placeholder="Enter your new password"
                className={`w-full bg-[#2a2836] border text-white rounded-lg pl-4 pr-10 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.newPassword ? "border-red-500" : "border-transparent focus:border-[#7c5dfa]"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[10px] text-red-400 mt-1 pl-1">
                {errors.newPassword}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  validateField("confirmPassword", e.target.value);
                }}
                placeholder="Confirm your new password"
                className={`w-full bg-[#2a2836] border text-white rounded-lg px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.confirmPassword ? "border-red-500" : "border-transparent focus:border-[#7c5dfa]"
                  }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-red-400 mt-1 pl-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-semibold py-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-4"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Reset Password & Verify"
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-white/5 pt-4 flex justify-between items-center px-1">
          <Link href="/forgot-password" className="inline-flex items-center gap-1 text-xs text-[#7c5dfa] hover:underline font-semibold transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            Request New OTP
          </Link>
          <Link href="/login" className="text-xs text-[#7c5dfa] hover:underline font-semibold transition-all">
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
