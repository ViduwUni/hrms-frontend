import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const withUser = (data = {}) => {
  const username = localStorage.getItem("username");
  return { ...data, performedBy: username };
};

export const getOvertimes = () => API.get("/overtime");
export const addOvertime = (data) => API.post("/overtime", withUser(data));
export const updateOvertime = (id, data) => API.put(`/overtime/${id}`, withUser(data));
export const approveOvertime = (id, details = {}) => API.put(`/overtime/${id}/approve`, withUser(details));
export const rejectOvertime = (id, details = {}) => API.put(`/overtime/${id}/reject`, withUser(details));
export const deleteOvertime = (id) => API.delete(`/overtime/${id}`, { data: withUser() });

export const overtimeExport = (startDate, endDate) =>
  API.get(`/overtime/export?startDate=${startDate}&endDate=${endDate}`, {
    responseType: "blob",
  });
