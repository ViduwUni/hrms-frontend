import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { FaUsers, FaTachometerAlt, FaIdBadge } from "react-icons/fa";
import { MdAccessTimeFilled } from "react-icons/md";
import { AiOutlineAudit } from "react-icons/ai";
import { LuLogs } from "react-icons/lu";
import { getProfile } from "../api/authAPI";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import Notifications from "./Notifications";
import { UIContext } from "../context/UIContext";

function SessionTimer({ onExpire }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const expires = localStorage.getItem("sessionExpires");
    return expires ? new Date(expires) - new Date() : 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const expires = localStorage.getItem("sessionExpires");
      if (!expires) return;

      const diff = new Date(expires) - new Date();
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  if (timeLeft <= 0)
    return <span className="text-red-600">Session expired</span>;

  const hours = Math.floor(timeLeft / 1000 / 60 / 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);
  const totalMinutesLeft = timeLeft / 1000 / 60;

  let color = "text-green-600";
  if (totalMinutesLeft <= 60) color = "text-orange-500";
  if (totalMinutesLeft <= 30) color = "text-red-600";

  return (
    <span className={`text-xs font-semibold ${color}`}>
      Session expires in {hours}h {minutes}m {seconds}s
    </span>
  );
}

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const handleSessionExpire = () => {
    toast.success("Session expired! Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("sessionExpires");
    navigate("/session-expired");
  };
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { collapsed, setCollapsed } = useContext(UIContext);

  const allowedCollapseRoutes = [
    "/overtimeentry",
    "/overtimes",
    "/overtimeexport",
    "/overtimeconfiguration",
  ];
  const collapseAllowed = allowedCollapseRoutes.includes(location.pathname);

  useEffect(() => {
    if (!collapseAllowed && collapsed) {
      setCollapsed(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (err) {
        toast.error(`Session expired. Please login again: ${err}`);
        logout();
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) return null;
  const isAdmin = user?.isAdmin || false;
  const canApprove = profile?.canApprove || false;
  const hasOTPrivilege = isAdmin || canApprove;

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleRestrictedAccess = (itemName) => {
    toast.error(
      `Access Denied\n\nYou don't have permission to access ${itemName}. This feature requires administrator privileges.`
    );
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FaTachometerAlt className="text-lg" />,
      adminOnly: false,
    },
    {
      name: "Management",
      icon: <FaUsers className="text-lg" />,
      adminOnly: false,
      children: [
        { name: "Users", path: "/users", adminOnly: true },
        { name: "Employees", path: "/employees", adminOnly: false },
      ],
    },
    {
      name: "Overtime",
      icon: <MdAccessTimeFilled className="text-lg" />,
      adminOnly: false,
      children: [
        { name: "Entries", path: "/overtimeentry", adminOnly: !hasOTPrivilege },
        { name: "Logs", path: "/overtimes", adminOnly: false },
        { name: "Export", path: "/overtimeexport", adminOnly: false },
        {
          name: "Configuration",
          path: "/overtimeconfiguration",
          adminOnly: true,
        },
      ],
    },
    {
      name: "Auditing",
      icon: <AiOutlineAudit className="text-lg" />,
      adminOnly: true,
      children: [
        {
          name: "OT Record Operations",
          path: "/overtime-audit",
          adminOnly: true,
        },
        {
          name: "OT Record Exports",
          path: "/overtime-export-audit",
          adminOnly: true,
        },
      ],
    },
    {
      name: "Utils",
      path: "/logs",
      icon: <LuLogs className="text-lg" />,
      adminOnly: true,
    },
  ];

  const renderNavItem = (item) => {
    const isRestricted = item.adminOnly && !isAdmin;

    if (item.children) {
      return (
        <div key={item.name}>
          <button
            onClick={() =>
              isRestricted
                ? handleRestrictedAccess(item.name)
                : toggleMenu(item.name)
            }
            className={`flex justify-between items-center w-full p-3 rounded-xl transition-all duration-200 group ${
              isRestricted
                ? "bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed"
                : openMenus[item.name]
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "hover:bg-gray-750 text-gray-300 hover:text-white"
            }`}
            disabled={isRestricted}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  isRestricted
                    ? "bg-red-500/20 text-red-400"
                    : openMenus[item.name]
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-gray-700 group-hover:bg-gray-600 text-gray-400 group-hover:text-white"
                }`}
              >
                {item.icon}
              </div>
              <span className="font-medium">{item.name}</span>
              {isRestricted && (
                <AlertCircle size={14} className="text-red-400" />
              )}
            </div>
            {!isRestricted &&
              (openMenus[item.name] ? (
                <ChevronDown size={16} className="text-blue-400" />
              ) : (
                <ChevronRight
                  size={16}
                  className="text-gray-500 group-hover:text-gray-400"
                />
              ))}
          </button>

          {/* Animated submenu */}
          <AnimatePresence initial={false}>
            {!isRestricted && openMenus[item.name] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="ml-4 mt-1 space-y-1 overflow-hidden border-l border-gray-700 pl-3"
              >
                {item.children.map((child) => {
                  const isChildRestricted = child.adminOnly && !isAdmin;
                  return isChildRestricted ? (
                    <button
                      key={child.path}
                      onClick={() => handleRestrictedAccess(child.name)}
                      className="flex items-center gap-2 w-full p-2.5 rounded-lg text-sm transition-all duration-200 group bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed"
                      disabled
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="font-medium">{child.name}</span>
                      <AlertCircle size={12} className="ml-auto" />
                    </button>
                  ) : (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={`block p-2.5 rounded-lg text-sm transition-all duration-200 group ${
                        location.pathname === child.path
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "text-gray-400 hover:text-white hover:bg-gray-750"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            location.pathname === child.path
                              ? "bg-white"
                              : "bg-gray-600 group-hover:bg-gray-500"
                          }`}
                        />
                        <span className="font-medium">{child.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (isRestricted) {
      return (
        <button
          key={item.path}
          onClick={() => handleRestrictedAccess(item.name)}
          className="flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed"
          disabled
        >
          <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
            {item.icon}
          </div>
          <span className="font-medium">{item.name}</span>
          <AlertCircle size={14} className="ml-auto text-red-400" />
        </button>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
          location.pathname === item.path
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
            : "hover:bg-gray-750 text-gray-300 hover:text-white"
        }`}
      >
        <div
          className={`p-2 rounded-lg transition-colors ${
            location.pathname === item.path
              ? "bg-white/20 text-white"
              : "bg-gray-700 group-hover:bg-gray-600 text-gray-400 group-hover:text-white"
          }`}
        >
          {item.icon}
        </div>
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Collapse / Expand Button */}
      <button
        onClick={() => {
          if (collapseAllowed) {
            setCollapsed(!collapsed);
          } else {
            toast.error("Sidebar collapse is disabled on this page");
          }
        }}
        // disabled={!collapseAllowed}
        className={`fixed top-4 z-50 bg-gray-900 p-2 rounded-lg shadow-lg transition
    ${collapsed ? "left-4" : "left-64"}
    ${collapseAllowed ? "hover:bg-gray-700" : "opacity-50 cursor-not-allowed"}
  `}
      >
        <div className="space-y-1">
          <span className="block w-5 h-0.5 bg-white"></span>
          <span className="block w-5 h-0.5 bg-white"></span>
          <span className="block w-5 h-0.5 bg-white"></span>
        </div>
      </button>

      {/* Sidebar */}
      <div
        className={`${
          collapsed ? "w-0" : "w-60"
        } h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white fixed top-0 left-0 flex flex-col shadow-xl border-r border-gray-700 transition-all duration-300 overflow-hidden`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 relative">
          {profile?.canApprove && (
            <div className="absolute top-6 right-6">
              <Notifications />
            </div>
          )}

          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
            OTFlow
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Human Resource Management
          </p>

          {/* Mode & Session */}
          <div className="mt-2 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isAdmin ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">
                {isAdmin ? "Admin Mode" : "User Mode"}
              </span>
              <SessionTimer onExpire={handleSessionExpire} />
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white p-1">
              <img src="/logo.png" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.name || user.username}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {isAdmin ? "Administrator" : "Standard User"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map(renderNavItem)}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {profile?.isAdmin && (
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center justify-center gap-3 w-full p-3 rounded-xl bg-gray-750 hover:bg-gray-700 text-gray-300 hover:text-white transition border border-gray-600 hover:border-gray-500"
            >
              <Settings
                size={18}
                className="text-gray-400 group-hover:text-white"
              />
              <span className="font-medium">Settings</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className={`flex items-center justify-center gap-3 w-full p-3 rounded-xl transition 
            ${
              logoutLoading
                ? "bg-red-500/20 text-red-300 cursor-not-allowed"
                : "bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300"
            }
            border border-red-500/20 hover:border-red-500/30`}
          >
            {logoutLoading ? (
              <span className="animate-spin border-2 border-red-400 border-t-transparent rounded-full w-4 h-4"></span>
            ) : (
              <LogOut size={18} />
            )}
            <span className="font-medium">
              {logoutLoading ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
