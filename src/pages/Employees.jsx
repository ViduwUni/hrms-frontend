import { useEffect, useState } from "react";
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from "../api/employeeAPI";
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes } from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import InfoLoader from "../components/InfoLoader";
import { getProfile } from "../api/authAPI";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useContext } from "react";
import { UIContext } from "../context/UIContext";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employeeNumber: "", name: "", phone: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    employeeNumber: "",
    name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
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

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Add employee
  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addEmployee(form);
      toast.success("Employee added successfully.");
      setForm({ employeeNumber: "", name: "", phone: "" });
      await fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  // Start editing
  const startEdit = (emp) => {
    setEditingId(emp._id);
    setEditForm({
      employeeNumber: emp.employeeNumber,
      name: emp.name,
      phone: emp.phone || "",
    });
  };

  // Cancel editing
  const cancelEdit = () => setEditingId(null);

  // Update employee
  const handleUpdate = async (id) => {
    setLoading(true);
    try {
      await updateEmployee(id, editForm);
      toast.success("Employee updated successfully.");
      setEditingId(null);
      await fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  // Delete employee
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
    setLoading(true);
    if (result.isConfirmed) {
      try {
        await deleteEmployee(id);
        await fetchEmployees();
        toast.success("Employee deleted successfully.");
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
        setLoading(false);
      }
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${
        collapsed ? "ml-0" : "ml-60"
      } p-8 relative bg-gray-50 min-h-screen`}
    >
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Employee Management
        </h1>
        <p className="text-gray-600">Manage employee informations</p>
      </div>

      {/* Add Employee Card */}
      {profile?.isAdmin && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Add New Employee
            </h2>
          </div>
          <form onSubmit={handleAdd} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Number *
                </label>
                <input
                  type="text"
                  required
                  value={form.employeeNumber}
                  onChange={(e) =>
                    setForm({ ...form, employeeNumber: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter employee number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <FaPlus className="text-sm" /> Add Employee
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Employee Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Employee Directory
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {employees.length} employee{employees.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {loading ? (
          <InfoLoader text="Loading Employees..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    #
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    Employee No
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    Name
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    Phone
                  </th>
                  {profile?.isAdmin && (
                    <th className="p-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {employees.map((emp, i) => (
                    <motion.tr
                      key={emp._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="hover:bg-blue-50/50 transition-colors duration-150"
                    >
                      <td className="p-4 text-sm font-medium text-gray-700">
                        {i + 1}
                      </td>

                      {/* Inline Editing */}
                      {editingId === emp._id ? (
                        <>
                          <td className="p-4">
                            <input
                              type="text"
                              value={editForm.employeeNumber}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  employeeNumber: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              value={editForm.phone}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  phone: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => handleUpdate(emp._id)}
                                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                                title="Save"
                              >
                                <FaCheck size={14} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                                title="Cancel"
                              >
                                <FaTimes size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 text-sm font-medium text-gray-900">
                            {emp.employeeNumber}
                          </td>
                          <td className="p-4 text-sm text-gray-800">
                            {emp.name}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {emp.phone || (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          {profile?.isAdmin && (
                            <td className="p-4">
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  onClick={() => startEdit(emp)}
                                  className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                                  title="Edit"
                                >
                                  <FaEdit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(emp._id)}
                                  className="bg-red-100 hover:bg-red-200 text-red-600 p-2.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                                  title="Delete"
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </>
                      )}
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
