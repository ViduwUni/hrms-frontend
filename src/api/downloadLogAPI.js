import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const addDownloadLog = (data) => API.post("/downloadLog", data);
export const getDownloadLogs = () => API.get("/downloadLog");
