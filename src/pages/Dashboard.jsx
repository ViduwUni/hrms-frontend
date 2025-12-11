import { useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  FaUsers,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaClipboardList,
  FaUserClock,
} from "react-icons/fa";
import { PiExportBold } from "react-icons/pi";
import {
  MdDisabledByDefault,
  MdEditDocument,
  MdApproval,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useContext } from "react";
import { UIContext } from "../context/UIContext";

import { getEmployees } from "../api/employeeAPI";
import { getOvertimes } from "../api/overtimeAPI";
import { getUsers, getProfile } from "../api/usersAPI";

export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const { collapsed } = useContext(UIContext);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (error) {
        toast.error(`Error fetching profile: ${error}`);
      }
    };

    fetchProfile();
  }, []);

  const quickActions = [
    {
      title: "Employees",
      icon: <FaUsers className="text-blue-600" size={20} />,
      bgColor: "bg-blue-100",
      hoverBgColor: "group-hover:bg-blue-200",
      borderHover: "hover:border-blue-300",
      hoverBg: "hover:bg-blue-50",
      path: "/employees",
      adminOnly: false,
    },
    {
      title: "Overtime Entries & Approvals",
      icon: <MdEditDocument className="text-emerald-600" size={20} />,
      bgColor: "bg-emerald-100",
      hoverBgColor: "group-hover:bg-emerald-200",
      borderHover: "hover:border-emerald-300",
      hoverBg: "hover:bg-emerald-50",
      path: "/overtimeentry",
      adminOnly: true,
    },
    {
      title: "Overtime Logs",
      icon: <FaClipboardList className="text-purple-600" size={20} />,
      bgColor: "bg-purple-100",
      hoverBgColor: "group-hover:bg-purple-200",
      borderHover: "hover:border-purple-300",
      hoverBg: "hover:bg-purple-50",
      path: "/overtimes",
      adminOnly: false,
    },
    {
      title: "Overtime Export",
      icon: <PiExportBold className="text-red-600" size={20} />,
      bgColor: "bg-red-100",
      hoverBgColor: "group-hover:bg-red-200",
      borderHover: "hover:border-red-300",
      hoverBg: "hover:bg-red-50",
      path: "/overtimeexport",
      adminOnly: false,
    },
  ];

  const fetchStats = async () => {
    try {
      const [empRes, otRes, userRes] = await Promise.all([
        getEmployees(),
        getOvertimes(),
        getUsers(),
      ]);

      const employees = empRes.data;
      const overtimes = otRes.data;
      const users = userRes.data;
      const dashToday = new Date();
      const todaysOT = overtimes.filter(
        (o) => new Date(o.date).toDateString() === dashToday.toDateString()
      );

      const today = new Date();

      // Employee Change
      const empToday = new Date();
      const empYesterday = new Date();
      empYesterday.setDate(empToday.getDate() - 1);
      const isSameDay = (date1, date2) =>
        new Date(date1).toDateString() === new Date(date2).toDateString();
      const employeesYesterday = employees.filter((emp) =>
        isSameDay(emp.createdAt, empYesterday)
      );
      const employeeChange = employees.length - employeesYesterday.length;
      const employeeTrend = employeeChange >= 0 ? "up" : "down";

      // OT Change
      const otYesterday = new Date();
      otYesterday.setDate(today.getDate() - 1);
      const yesterdaysOT = overtimes.filter(
        (o) => new Date(o.date).toDateString() === otYesterday.toDateString()
      );
      const overtimeChange = todaysOT.length - yesterdaysOT.length;
      const overtimeTrend = overtimeChange >= 0 ? "up" : "down";

      // Users Change
      const activeUsersToday = users.filter((user) => {
        if (!user.lastLogin) return false;
        const lastLoginDate = new Date(user.lastLogin);
        return lastLoginDate.toDateString() === today.toDateString();
      });
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const activeUsersYesterday = users.filter((user) => {
        if (!user.lastLogin) return false;
        const lastLoginDate = new Date(user.lastLogin);
        return lastLoginDate.toDateString() === yesterday.toDateString();
      });

      const activeChange =
        activeUsersToday.length - activeUsersYesterday.length;
      const activeTrend = activeChange >= 0 ? "up" : "down";

      const newStats = [
        {
          title: "Total Employees",
          value: employees.length.toString(),
          change: Math.abs(employeeChange),
          trend: employeeTrend,
          icon: <FaUsers className="text-white" size={24} />,
          color: "bg-gradient-to-br from-blue-500 to-blue-600",
          bgColor: "bg-blue-50",
          textColor: "text-blue-600",
        },
        {
          title: "Overtime Today",
          value: todaysOT.length.toString(),
          change: Math.abs(overtimeChange),
          trend: overtimeTrend,
          icon: <FaClock className="text-white" size={24} />,
          color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-600",
        },
        {
          title: "Active Users Today",
          value: activeUsersToday.length.toString(),
          change: Math.abs(activeChange),
          trend: activeTrend,
          icon: <FaClipboardList className="text-white" size={24} />,
          color: "bg-gradient-to-br from-green-500 to-green-600",
          bgColor: "bg-green-50",
          textColor: "text-green-600",
        },
      ];

      setStats(newStats);

      // Example recent activities (you can make API call for real events)
      const activities = todaysOT.slice(-5).map((o, i) => ({
        id: i + 1,
        name: o.name,
        action: `Overtime Logged`,
        time: new Date(o.date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "success",
      }));

      setRecentActivities(activities);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getStatusIcon = (action) => {
    switch (action) {
      case "Overtime Logged":
        return <FaUserClock />;
      default:
        return <MdDisabledByDefault />;
    }
  };

  return (
    <div
      className={`p-8 transition-all duration-300 ${
        collapsed ? "ml-0" : "ml-60"
      } min-h-screen bg-gray-50`}
    >
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Cards Grid */}
      {profile?.isAdmin && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-10">
          {stats.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${item.color}`}>
                    {item.icon}
                  </div>
                  <div
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.bgColor} ${item.textColor}`}
                  >
                    {item.trend === "up" ? (
                      <FaArrowUp size={10} className="mr-1" />
                    ) : (
                      <FaArrowDown size={10} className="mr-1" />
                    )}
                    {item.change}%
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  {item.title}
                </h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-800">
                    {item.value}
                  </p>
                  <span className="text-sm text-gray-500 ml-2">active</span>
                </div>
              </div>
              <div
                className={`h-1 ${
                  item.color.replace("bg-gradient-to-br", "bg").split(" ")[0]
                }`}
              ></div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities Card */}
        {profile?.isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Recent Activities
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  Today
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Latest employee activities and events
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: activity.id * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg border border-gray-400 rounded-full p-2">
                        {getStatusIcon(activity.action)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {activity.name}
                        </p>
                        <p
                          className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                            activity.status
                          )}`}
                        >
                          {activity.action}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {activity.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Quick Actions
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Frequently used actions
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
              {quickActions
                .filter((action) => !action.adminOnly || profile?.isAdmin)
                .map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={`p-4 border border-gray-200 rounded-xl transition-all duration-200 group ${action.borderHover} ${action.hoverBg}`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`p-2 rounded-lg mb-2 ${action.bgColor} ${action.hoverBgColor} transition-colors`}
                      >
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {action.title}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
