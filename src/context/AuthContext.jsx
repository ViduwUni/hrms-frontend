import { createContext, useEffect, useState } from "react";
import { getProfile, logoutUser } from "../api/authAPI";
import toast from "react-hot-toast";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getProfile()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("username", res.data.username);
        })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.log("Logout error:", err);
      toast.error(`Logout error: ${err.message}`);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("sessionExpires");
      setUser(null);
      toast.success("User logged out successfully.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
