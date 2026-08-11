"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../services/api";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLightMode, setIsLightMode] = useState(false);

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
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      setIsLightMode(savedTheme === "light");
    }
  }, []);

  useEffect(() => {
    const canvas = document.getElementById("login-animation-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    const mouse = { x: null, y: null, radius: 150 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const particles = [];
    const particleCount = 110;
    const particleColor = isLightMode ? "rgba(124, 93, 250, 0.25)" : "rgba(124, 93, 250, 0.4)";

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 3 + 1.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let maxConnectDist = 100;
          let inMouseZone = false;

          if (mouse.x !== null && mouse.y !== null) {
            const distToMouseI = Math.sqrt((mouse.x - particles[i].x) ** 2 + (mouse.y - particles[i].y) ** 2);
            const distToMouseJ = Math.sqrt((mouse.x - particles[j].x) ** 2 + (mouse.y - particles[j].y) ** 2);
            if (distToMouseI < mouse.radius && distToMouseJ < mouse.radius) {
              maxConnectDist = 160;
              inMouseZone = true;
            }
          }

          if (dist < maxConnectDist) {
            const opacity = ((maxConnectDist - dist) / maxConnectDist) * (inMouseZone ? 0.25 : 0.1);
            ctx.strokeStyle = isLightMode
              ? `rgba(124, 93, 250, ${opacity * 0.6})`
              : `rgba(124, 93, 250, ${opacity})`;
            ctx.lineWidth = inMouseZone ? 1.0 : 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = particleColor;
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle) * force * 0.9;
            p.y += Math.sin(angle) * force * 0.9;

            ctx.strokeStyle = isLightMode
              ? `rgba(124, 93, 250, ${force * 0.18})`
              : `rgba(124, 93, 250, ${force * 0.35})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLightMode]);

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
              const isAdmin = response.data.user?.is_admin || response.data.user?.role === "admin" || response.data.user?.email === "admin@yopmail.com";
              setSuccess(isAdmin ? "Google login successful! Redirecting to admin dashboard..." : "Google login successful! Redirecting...");
              localStorage.setItem("token", response.data.token);
              localStorage.setItem("user", JSON.stringify(response.data.user));
              if (!isAdmin && response.data.user?.login_count === 1) {
                localStorage.setItem("show_feedback_directly", "true");
              }

              setTimeout(() => {
                if (isAdmin) {
                  router.push("/admin-dashboard");
                } else {
                  router.push("/chat");
                }
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
    console.log("Google Login clicked");
  };

  const validateField = (name, value) => {
    let errorMsg = "";

    if (name === "email") {
      if (!value.trim()) {
        errorMsg = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMsg = "Please enter a valid email address.";
      }
    } else if (name === "password") {
      if (!value) {
        errorMsg = "Password is required.";
      }
    } else if (name === "rememberMe") {

      if (!value) {
        errorMsg = "You must check Remember Me to log in.";
      }
    }

    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("verified") === "true") {
        setSuccess("✓ Email verified successfully! You can now log in to your account.");
      } else if (searchParams.get("verify_sent") === "true") {
        const eParam = searchParams.get("email");
        if (eParam) setEmail(decodeURIComponent(eParam));
        setSuccess("✉ Verification email sent! Please check your inbox and click the link to verify your account.");
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setSuccess("");
    setUnverifiedEmail("");
    setResendStatus("");

    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    }
    if (Object.keys(newErrors).some((k) => newErrors[k])) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        const isAdmin = response.data.user?.is_admin || response.data.user?.role === "admin" || response.data.user?.email === "admin@yopmail.com";
        setSuccess(isAdmin ? "Login successful! Redirecting to admin dashboard..." : "Login successful! Redirecting to chat...");
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (!isAdmin && response.data.user?.login_count === 1) {
          localStorage.setItem("show_feedback_directly", "true");
        }

        setTimeout(() => {
          if (isAdmin) {
            router.push("/admin-dashboard");
          } else {
            router.push("/chat");
          }
        }, 1200);
      } else {
        setGlobalError(response.data.message || "Failed to login.");
      }
    } catch (err) {
      if (err.response?.data?.require_verification) {
        setUnverifiedEmail(email);
      }
      setGlobalError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Something went wrong. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300 relative overflow-hidden ${isLightMode ? "bg-[#f8fafc]" : "bg-[#121118]"}`}>
      {/* Auto playing interactive Canvas Background animation */}
      <canvas id="login-animation-canvas" className="absolute inset-0 z-0 pointer-events-none w-full h-full" />

      <div className={`w-full max-w-4xl auth-card-shell rounded-[24px] overflow-hidden flex flex-col md:flex-row min-h-0 md:min-h-[600px] border shadow-2xl transition-all duration-300 relative z-10 ${isLightMode ? "bg-white border-slate-200/80 shadow-slate-100/50" : "bg-[#23212b] border-white/5 shadow-black/40"
        }`}>

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

        <div className={`w-full md:w-1/2 p-8 sm:p-10 md:p-12 flex flex-col justify-center transition-colors duration-300 ${isLightMode ? "bg-white" : "bg-[#23212b]"
          }`}>

          <div className="mb-6">
            <h3 className={`text-2xl sm:text-3xl font-bold tracking-wide transition-colors ${isLightMode ? "text-slate-800" : "text-white"
              }`}>
              Sign In
            </h3>
            <p className={`text-xs mt-1.5 font-medium transition-colors ${isLightMode ? "text-slate-500" : "text-white/50"
              }`}>
              New user?{" "}
              <Link href="/signup" className={`hover:underline ml-1 font-bold ${isLightMode ? "text-[#7c5dfa]" : "text-white"
                }`}>
                Create an account
              </Link>
            </p>
          </div>

          {globalError && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs mb-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                <span>{globalError}</span>
              </div>
              {unverifiedEmail && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await api.post("/auth/send-verification", { email: unverifiedEmail });
                        setResendStatus(res.data.message || "Verification link sent! Please check your email.");
                      } catch (err) {
                        setResendStatus("Failed to send verification email.");
                      }
                    }}
                    className="px-3 py-1.5 bg-[#7c5dfa] hover:bg-[#684ce2] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    Resend Verification Link
                  </button>
                  {resendStatus && (
                    <p className="text-[10px] text-emerald-400 font-semibold mt-1.5">{resendStatus}</p>
                  )}
                </div>
              )}
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
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateField("email", e.target.value);
                }}
                placeholder="Enter email address"
                className={`w-full border rounded-lg px-4 py-3 text-xs focus:outline-none transition-all ${isLightMode
                  ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#7c5dfa]"
                  : "bg-[#2a2836] border-transparent text-white placeholder:text-white/20 focus:bg-[#201e29] focus:border-[#7c5dfa]"
                  } ${errors.email ? "!border-red-500" : ""}`}
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
                  placeholder="Enter password"
                  className={`w-full border rounded-lg pl-4 pr-10 py-3 text-xs focus:outline-none transition-all ${isLightMode
                    ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#7c5dfa]"
                    : "bg-[#2a2836] border-transparent text-white placeholder:text-white/20 focus:bg-[#201e29] focus:border-[#7c5dfa]"
                    } ${errors.password ? "!border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${isLightMode ? "text-slate-400 hover:text-slate-700" : "text-white/30 hover:text-white"
                    }`}
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

            <div className="flex justify-end pt-1.5">
              <Link href="/forgot-password" className="text-[11px] text-[#7c5dfa] hover:underline font-semibold transition-all">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7c5dfa] hover:bg-[#684ce2] text-white font-semibold py-3 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-4 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isLightMode ? "border-slate-100" : "border-white/5"}`}></div>
            </div>
            <span className={`relative px-3 text-[10px] font-semibold uppercase tracking-widest transition-colors ${isLightMode ? "bg-white text-slate-400" : "bg-[#23212b] text-white/20"
              }`}>
              Or sign in with
            </span>
          </div>

          <div className="w-full">
            <button
              type="button"
              className={`w-full flex items-center justify-center gap-2 border py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${isLightMode
                ? "border-slate-200 hover:bg-slate-50 text-slate-700 bg-white"
                : "border-white/10 hover:bg-white/5 text-white/80"
                }`}
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

      </div>
    </div>
  );
}
