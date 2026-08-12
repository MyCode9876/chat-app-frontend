import axios from "axios";

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// Safeguard: Ensure the API URL ends with /api
if (API_BASE_URL && !API_BASE_URL.endsWith("/api") && !API_BASE_URL.endsWith("/api/")) {
  API_BASE_URL = API_BASE_URL.replace(/\/+$/, "") + "/api";
}

// Utility to normalize local development URLs (localhost:8000, 127.0.0.1:8000, etc.)
// and relative /uploads/ paths to the correct backend base URL in live environments.
export const normalizeUrls = (obj) => {
  if (!obj) return obj;
  if (typeof obj === "string") {
    if (obj.includes("localhost:8000") || obj.includes("127.0.0.1:8000") || obj.startsWith("/uploads/") || obj.startsWith("uploads/")) {
      const backendBase = API_BASE_URL.replace(/\/api\/?$/, "");
      
      let res = obj;
      if (res.includes("localhost:8000")) {
        res = res.replace(/https?:\/\/localhost:8000/g, backendBase);
      }
      if (res.includes("127.0.0.1:8000")) {
        res = res.replace(/https?:\/\/127\.0\.0\.1:8000/g, backendBase);
      }
      if (res.startsWith("/uploads/") || res.startsWith("uploads/")) {
        const cleanUrl = res.startsWith("/") ? res : `/${res}`;
        res = `${backendBase}${cleanUrl}`;
      }
      return res;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeUrls);
  }
  if (typeof obj === "object") {
    // Avoid traversing non-plain objects like file blobs, HTMLElements, socket instances, React components, etc.
    if (obj.constructor && obj.constructor.name !== "Object") {
      return obj;
    }
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = normalizeUrls(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      response.data = normalizeUrls(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("Session expired. Logging out...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Only redirect if not already on login/signup page
        if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
