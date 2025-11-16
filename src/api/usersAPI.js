import axios from "axios";

// Ensure your VITE_API_BASE_URL ends with /api
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Auth API instance
const API = axios.create({
  baseURL: `${API_BASE}/auth`,
});

// Users API instance
const USER_API = axios.create({
  baseURL: `${API_BASE}/users`,
});

// Attach JWT token if available
const attachToken = (config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

API.interceptors.request.use(attachToken);
USER_API.interceptors.request.use(attachToken);

// --- Auth routes ---
export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);
export const getProfile = () => API.get("/profile");

// --- User management routes (Admin) ---
export const getUsers = async () => {
  try {
    const res = await USER_API.get("/");
    return res;
  } catch (err) {
    console.error("Error fetching users:", err.response?.data || err.message);
    throw err;
  }
};

export const getUserById = async (id) => {
  try {
    const res = await USER_API.get(`/${id}`);
    return res;
  } catch (err) {
    console.error(
      "Error fetching user by ID:",
      err.response?.data || err.message
    );
    throw err;
  }
};

export const updateUser = async (id, data) => {
  try {
    const res = await USER_API.put(`/${id}`, data);
    return res;
  } catch (err) {
    console.error("Error updating user:", err.response?.data || err.message);
    throw err;
  }
};

export const deleteUser = async (id) => {
  try {
    const res = await USER_API.delete(`/${id}`);
    return res;
  } catch (err) {
    console.error("Error deleting user:", err.response?.data || err.message);
    throw err;
  }
};
