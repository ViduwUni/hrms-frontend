import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getOTSettings = () => API.get("/settings/overtime-configs/all");
export const createOTSettings = (data) =>
  API.post("/settings/overtime-configs/create", data);
export const updateOTSettings = (data) =>
  API.put("/settings/overtime-configs/update", data);
export const deleteOTSettings = () =>
  API.delete("/settings/overtime-configs/delete");
