"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../services/api";
import { Eye, EyeOff, Mail, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");

  const [errors, setErrors] = useState({});

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?q=80&w=800&auto=format&fit=crop",
      title: "Real-time\nCommunication",
      subtitle: "Connect instantly with friends and group circles across the globe."
    },
    {
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
      title: "Secure &\nEncrypted Space",
      subtitle: "Your personal chat history, notifications, and profile details are kept safe."
    },
    {
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
      title: "Share Files\n& Attachments",
      subtitle: "Send photos, images, PDFs, and documents directly within the chat pane."
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");

      if (accessToken) {
        setLoading(true);
        window.location.hash = "";

        api.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
          .then(async (googleRes) => {
            const { email, given_name, family_name } = googleRes.data;

            const response = await api.post("/auth/google-login", {
              email,
              first_name: given_name,
              last_name: family_name
            });

            if (response.data.success) {
              setSuccess("Google login successful! Redirecting...");
              localStorage.setItem("token", response.data.token);
              localStorage.setItem("user", JSON.stringify(response.data.user));

              setTimeout(() => {
                router.push("/chat");
              }, 1500);
            } else {
              setGlobalError(response.data.message || "Failed to authenticate with Google.");
            }
          })
          .catch(err => {
            setGlobalError(
              err.response?.data?.message ||
              err.response?.data?.error ||
              "Google login authentication failed."
            );
          })
          .finally(() => setLoading(false));
      }
    }
  }, [router]);

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      const testEmail = prompt("Enter a test email to simulate Google login:", "testuser@gmail.com");
      if (!testEmail) return;

      setLoading(true);
      api.post("/auth/google-login", {
        email: testEmail,
        first_name: "Google User",
        last_name: "Test"
      })
        .then(response => {
          if (response.data.success) {
            setSuccess("Google login simulated successfully! Redirecting...");
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            setTimeout(() => {
              router.push("/chat");
            }, 1500);
          } else {
            setGlobalError(response.data.message || "Failed to login with Google.");
          }
        })
        .catch(err => {
          setGlobalError(err.response?.data?.message || "Google auth error.");
        })
        .finally(() => setLoading(false));
      return;
    }

    const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
    const scope = encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account`;

    window.location.href = googleAuthUrl;
  };

  const validateField = (name, value) => {
    let errorMsg = "";

    if (name === "firstName") {
      if (!value.trim()) {
        errorMsg = "First name is required.";
      }
    } else if (name === "lastName") {
      if (!value.trim()) {
        errorMsg = "Last name is required.";
      }
    } else if (name === "email") {
      if (!value.trim()) {
        errorMsg = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMsg = "Please enter a valid email address.";
      }
    } else if (name === "password") {
      if (!value) {
        errorMsg = "Password is required.";
      } else if (value.length < 6) {
        errorMsg = "Password must be at least 6 characters.";
      }
    } else if (name === "mobile") {
      if (!value.trim()) {
        errorMsg = "Mobile number is required.";
      } else if (!/^[0-9]{10}$/.test(value.trim())) {
        errorMsg = "Mobile number must be exactly 10 digits (numbers only).";
      }
    } else if (name === "address") {
      if (!value.trim()) {
        errorMsg = "Address is required.";
      }
    } else if (name === "agreeTerms") {
      if (!value) {
        errorMsg = "You must agree to the terms and conditions.";
      }
    }

    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setSuccess("");

    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required.";
    if (!lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (!mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!/^[0-9]{10}$/.test(mobile.trim())) {
      newErrors.mobile = "Mobile number must be exactly 10 digits (numbers only).";
    }
    if (!address.trim()) {
      newErrors.address = "Address is required.";
    }
    if (Object.keys(newErrors).some((k) => newErrors[k])) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/signup", {
        first_name: firstName,
        last_name: lastName || undefined,
        email,
        password,
        mobile: mobile || undefined,
        address: address || undefined,
      });

      if (response.data.success) {
        setSuccess("Account created successfully! Verification email sent.");
        setShowVerifyModal(true);
      } else {
        setGlobalError(response.data.message || "Failed to create account.");
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
    <div className="min-h-screen bg-[#121118] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-4xl auth-card-shell bg-[#23212b] rounded-[24px] overflow-hidden flex flex-col md:flex-row min-h-0 md:min-h-[600px] border border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">

        <div className="auth-slide-panel hidden md:flex w-1/2 p-8 flex-col justify-between relative overflow-hidden min-h-[350px] md:min-h-auto">

          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? "opacity-100" : "opacity-0"
                }`}
            >
              <img
                src={slide.image}
                alt="Slide Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/25"></div>
            </div>
          ))}

          <div className="relative z-10 flex items-center gap-2 w-full select-none">
            <svg
              className="w-6 h-6 text-white/90"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" fill="currentColor" fillOpacity="0.15" />
            </svg>
            <span className="text-white text-xs font-bold tracking-[0.25em] uppercase pl-1.5">
              MYCHATBOX
            </span>
          </div>

          <div className="relative z-10 text-center md:text-left mt-auto pt-24 px-4 pb-2">
            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight whitespace-pre-line min-h-[56px] transition-all duration-500">
              {slides[currentSlide].title}
            </h2>
            <p className="text-xs text-white/70 mt-2 transition-all duration-500 min-h-[32px]">
              {slides[currentSlide].subtitle}
            </p>

            <div className="flex justify-center md:justify-start gap-1.5 mt-5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  className={`h-[3px] rounded-full transition-all duration-300 ${currentSlide === index ? "w-6 bg-white" : "w-3 bg-white/30"
                    }`}
                />
              ))}
            </div>
          </div>

        </div>

        <div className="w-full md:w-1/2 p-8 sm:p-10 md:p-12 flex flex-col justify-center">

          <div className="mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Create an account
            </h3>
            <p className="text-xs text-white/50 mt-1.5 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:underline ml-1">
                Log in
              </Link>
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
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      validateField("firstName", e.target.value);
                    }}
                    placeholder="Firstname"
                    className={`w-full bg-[#2a2836] border text-white rounded-lg px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.firstName ? "border-red-500" : "border-transparent focus:border-purple-500 focus:bg-[#201e29]"
                      }`}
                  />
                  {errors.firstName && (
                    <span className="text-[10px] text-red-400 mt-1 block pl-1">
                      {errors.firstName}
                    </span>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      validateField("lastName", e.target.value);
                    }}
                    placeholder="Last name"
                    className={`w-full bg-[#2a2836] border text-white rounded-lg px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.lastName ? "border-red-500" : "border-transparent focus:border-purple-500 focus:bg-[#201e29]"
                      }`}
                  />
                  {errors.lastName && (
                    <span className="text-[10px] text-red-400 mt-1 block pl-1">
                      {errors.lastName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateField("email", e.target.value);
                }}
                placeholder="Enter a Email"
                className={`w-full bg-[#2a2836] border text-white rounded-lg px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.email ? "border-red-500" : "border-transparent focus:border-purple-500 focus:bg-[#201e29]"
                  }`}
              />
              {errors.email && (
                <span className="text-[10px] text-red-400 mt-1 block pl-1">
                  {errors.email}
                </span>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validateField("password", e.target.value);
                  }}
                  placeholder="Enter your password"
                  className={`w-full bg-[#2a2836] border text-white rounded-lg pl-4 pr-10 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.password ? "border-red-500" : "border-transparent focus:border-[#7c5dfa] focus:bg-[#201e29]"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-[10px] text-red-400 mt-1 block pl-1">
                  {errors.password}
                </span>
              )}
            </div>

            <div>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => {
                  const numOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setMobile(numOnly);
                  validateField("mobile", numOnly);
                }}
                maxLength={10}
                placeholder="Enter your mobile number"
                className={`w-full bg-[#2a2836] border text-white rounded-lg px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.mobile ? "border-red-500" : "border-transparent focus:border-[#7c5dfa] focus:bg-[#201e29]"
                  }`}
              />
              {errors.mobile && (
                <span className="text-[10px] text-red-400 mt-1 block pl-1">
                  {errors.mobile}
                </span>
              )}
            </div>

            <div>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  validateField("address", e.target.value);
                }}
                placeholder="Enter your address"
                className={`w-full bg-[#2a2836] border text-white rounded-lg px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-white/20 ${errors.address ? "border-red-500" : "border-transparent focus:border-[#7c5dfa] focus:bg-[#201e29]"
                  }`}
              />
              {errors.address && (
                <span className="text-[10px] text-red-400 mt-1 block pl-1">
                  {errors.address}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-semibold py-3 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-4"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-3 bg-[#23212b] text-[10px] font-semibold text-white/20 uppercase tracking-widest">
              Or register with
            </span>
          </div>

          <div className="w-full">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 py-2.5 px-4 rounded-lg text-xs font-semibold text-white/80 transition-colors cursor-default"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

        </div>

        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md bg-[#1e1c2a] border border-[#7c5dfa]/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 relative text-white">
              <div className="w-16 h-16 rounded-full bg-[#7c5dfa]/20 border border-[#7c5dfa]/40 text-[#9f85ff] flex items-center justify-center mx-auto shadow-lg shadow-[#7c5dfa]/20">
                <Mail className="w-8 h-8 text-[#9f85ff]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Check Your Email</h3>
                <p className="text-xs text-white/60 leading-relaxed px-2">
                  Account created successfully! We sent a verification email to:
                </p>
                <div className="inline-block px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs font-bold text-[#9f85ff]">
                  {email}
                </div>
                <p className="text-[11px] text-white/40 pt-1 leading-relaxed">
                  Please check your email inbox and click the <strong>Verify Email Address</strong> button to activate your account.
                </p>
              </div>

              {resendStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  {resendStatus}
                </div>
              )}

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => router.push(`/login?verify_sent=true&email=${encodeURIComponent(email)}`)}
                  className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-[#7c5dfa]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Login Page</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={async () => {
                    setResendLoading(true);
                    try {
                      const res = await api.post("/auth/send-verification", { email });
                      setResendStatus(res.data.message || "Verification link resent!");
                    } catch (err) {
                      setResendStatus(err.response?.data?.message || "Failed to resend email.");
                    } finally {
                      setResendLoading(false);
                    }
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-white/5"
                >
                  {resendLoading ? "Sending..." : "Resend Verification Link"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
