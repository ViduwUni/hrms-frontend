import { useEffect, useState } from "react";
import {
  getUsers,
  updateUser,
  deleteUser,
  registerUser,
} from "../api/usersAPI";
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus } from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import InfoLoader from "../components/InfoLoader";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { getProfile } from "../api/authAPI";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    isAdmin: false,
    canApprove: false,
  });
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    isAdmin: false,
    canApprove: false,
  });
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const startEdit = (user) => {
    setEditId(user._id);
    setEditForm({
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      canApprove: user.canApprove,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({ username: "", email: "", isAdmin: false });
  };

  const saveEdit = async (id) => {
    try {
      const data = { ...editForm };
      if (!data.password) delete data.password;
      await updateUser(id, data);
      toast.success("User updated successfully.");
      setEditId(null);
      setEditForm({ username: "", email: "", isAdmin: false });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(id);
        fetchUsers();
        toast.success("User removed successfully.");
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await registerUser(newUser);
      toast.success("User created successfully.");
      setNewUser({ username: "", email: "", password: "", isAdmin: false });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="ml-64 p-8 relative bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">
          Manage system users and their permissions
        </p>
      </div>

      {/* Add User Card */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Add New User</h2>
        </div>
        <form onSubmit={handleAddUser} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                placeholder="Enter username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                placeholder="Enter email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col items-center justify-center mt-6 border border-gray-400 rounded-md">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUser.isAdmin}
                    onChange={(e) =>
                      setNewUser({ ...newUser, isAdmin: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Admin
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUser.canApprove}
                    onChange={(e) =>
                      setNewUser({ ...newUser, canApprove: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Can Approve
                  </span>
                </label>
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <FaPlus className="text-sm" /> Add User
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            User Directory
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {users.length} user{users.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {loading ? (
          <InfoLoader text="Loading Users..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    #
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    Username
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    Email
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    Password
                  </th>
                  <th className="p-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    Admin
                  </th>
                  <th className="p-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    Can Approve
                  </th>
                  <th className="p-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {users.map((user, i) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="hover:bg-blue-50/50 transition-colors duration-150"
                    >
                      <td className="p-4 text-sm font-medium text-gray-700">
                        {i + 1}
                      </td>

                      {/* Username */}
                      <td className="p-4">
                        {editId === user._id ? (
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                username: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {user.username}
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="p-4">
                        {editId === user._id ? (
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        ) : (
                          <span className="text-sm text-gray-800">
                            {user.email}
                          </span>
                        )}
                      </td>

                      {/* Password */}
                      <td className="p-4">
                        {editId === user._id ? (
                          <input
                            type="password"
                            placeholder="New password (optional)"
                            value={editForm.password || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                password: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        ) : (
                          <span className="text-sm text-gray-500 font-mono">
                            ••••••
                          </span>
                        )}
                      </td>

                      {/* Admin */}
                      <td className="p-4 text-center">
                        {editId === user._id ? (
                          <label className="flex items-center justify-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.isAdmin}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  isAdmin: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400"
                            />
                          </label>
                        ) : user.isAdmin ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full text-xs font-semibold">
                            ✗
                          </span>
                        )}
                      </td>

                      {/* Approve */}
                      <td className="p-4 text-center">
                        {editId === user._id ? (
                          <label className="flex items-center justify-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.canApprove}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  canApprove: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400"
                            />
                          </label>
                        ) : user.canApprove ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full text-xs font-semibold">
                            ✗
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        {editId === user._id ? (
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => saveEdit(user._id)}
                              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                              title="Save"
                            >
                              <FaSave size={14} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                              title="Cancel"
                            >
                              <FaTimes size={14} />
                            </button>
                          </div>
                        ) : (user?.email === "sterlingsteels.it@gmail.com" ||
                            user?.email ===
                              "vidun.hettiarachchi@sterlingsteels.com") &&
                          profile?.email !== "sterlingsteels.it@gmail.com" &&
                          profile?.email !==
                            "vidun.hettiarachchi@sterlingsteels.com" ? null : (
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="bg-red-100 hover:bg-red-200 text-red-600 p-2.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
