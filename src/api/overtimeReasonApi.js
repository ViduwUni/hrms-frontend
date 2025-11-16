import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// GET all overtime reasons
export const fetchOvertimeReasons = () =>
    API.get("/settings/overtime-reasons");

// ADD a new overtime reason
export const addOvertimeReason = (option) =>
    API.post("/settings/overtime-reasons", { option });

// DELETE a reason by ID
export const deleteOvertimeReason = (id) =>
    API.delete(`/settings/overtime-reasons/${id}`);
