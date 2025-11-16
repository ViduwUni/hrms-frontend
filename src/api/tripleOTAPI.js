import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getTripleOTs = () => API.get("/tripleot");
export const addTripleOT = (data) => API.post("/tripleot", data);
export const updateTripleOT = (id, data) => API.put(`/tripleot/${id}`, data);
export const deleteTripleOT = (id) => API.delete(`/tripleot/${id}`);
