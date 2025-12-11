import { useEffect, useState } from "react";
import {
  getTripleOTs,
  addTripleOT,
  updateTripleOT,
  deleteTripleOT,
} from "../api/tripleOTAPI";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import { useContext } from "react";
import { UIContext } from "../context/UIContext";

export default function OTConfiguration() {
  const [tripleOTs, setTripleOTs] = useState([]);
  const [formData, setFormData] = useState({ date: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    tripleOT: false,
    // Add more sections here as needed in the future
  });
  const { collapsed } = useContext(UIContext);

  // Fetch existing triple OT records
  const fetchTripleOTs = async () => {
    try {
      const { data } = await getTripleOTs();
      setTripleOTs(data);
    } catch (err) {
      toast.error(`Failed to fetch Triple OT records: ${err}`);
    }
  };

  useEffect(() => {
    fetchTripleOTs();
  }, []);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date) {
      toast.error("Date is required");
      return;
    }

    try {
      if (editingId) {
        await updateTripleOT(editingId, formData);
        toast.success("Triple OT updated successfully");
      } else {
        await addTripleOT(formData);
        toast.success("Triple OT added successfully");
      }
      setFormData({ date: "", description: "" });
      setEditingId(null);
      fetchTripleOTs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving data");
    }
  };

  // Handle edit click
  const handleEdit = (record) => {
    setFormData({
      date: record.date.split("T")[0],
      description: record.description,
    });
    setEditingId(record._id);
  };

  // Handle delete
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the Triple OT record.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTripleOT(id);
          toast.success("Triple OT deleted");
          fetchTripleOTs();
        } catch (err) {
          toast.error(`Error deleting record: ${err}`);
        }
      }
    });
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <motion.div
      className={`transition-all duration-300 ${
        collapsed ? "ml-0" : "ml-60"
      } p-8 relative bg-gray-50 min-h-screen`}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Overtime Configuration
        </h1>
        <p className="text-gray-600">
          Manage overtime settings and special dates
        </p>
      </div>

      {/* Triple OT Configuration Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <button
          onClick={() => toggleSection("tripleOT")}
          className="w-full px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: expandedSections.tripleOT ? 0 : -90 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {expandedSections.tripleOT ? (
                  <FaChevronDown className="text-gray-600" />
                ) : (
                  <FaChevronRight className="text-gray-600" />
                )}
              </motion.div>
              <h2 className="text-lg font-semibold text-gray-800">
                Triple OT Dates
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {tripleOTs.length} records
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Manage dates with triple overtime rates
            </div>
          </div>
        </button>

        <AnimatePresence>
          {expandedSections.tripleOT && (
            <motion.div
              key="tripleOT"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-b border-gray-100"
            >
              <div className="px-6 py-4 bg-gray-50/50">
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  Add Triple OT Record
                </h3>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-wrap gap-6 items-end"
                >
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  <div className="flex-1 min-w-[250px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Optional description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                        editingId
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {editingId ? (
                        <FaSave className="text-sm" />
                      ) : (
                        <FaPlus className="text-sm" />
                      )}
                      {editingId ? "Update" : "Add Record"}
                    </button>

                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ date: "", description: "" });
                          setEditingId(null);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <FaTimes className="text-sm" /> Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {expandedSections.tripleOT && (
            <motion.div
              key="tripleOT-table"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6 overflow-x-auto"
            >
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <Th>#</Th>
                    <Th>Date</Th>
                    <Th>Description</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tripleOTs.length > 0 ? (
                    tripleOTs.map((record, index) => (
                      <tr key={record._id} className="hover:bg-blue-50/50">
                        <Td className="text-center">{index + 1}</Td>
                        <Td>
                          {new Date(record.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Td>
                        <Td>{record.description || "-"}</Td>
                        <Td>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center p-8">
                        <div className="text-gray-400 mb-4">
                          <svg
                            className="w-16 h-16 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          No Triple OT records found
                        </h3>
                        <p className="text-gray-500">
                          Add your first triple OT record using the form above.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Placeholder for Future Configuration Sections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <button
          onClick={() => toggleSection("futureSection1")}
          className="w-full px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`transform transition-transform duration-200 ${
                  expandedSections.futureSection1 ? "rotate-0" : "-rotate-90"
                }`}
              >
                {expandedSections.futureSection1 ? (
                  <FaChevronDown className="text-gray-600" />
                ) : (
                  <FaChevronRight className="text-gray-600" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                OT Rates Configuration
              </h2>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Coming Soon
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Configure normal, double, and triple OT rates
            </div>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <button
          onClick={() => toggleSection("futureSection2")}
          className="w-full px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`transform transition-transform duration-200 ${
                  expandedSections.futureSection2 ? "rotate-0" : "-rotate-90"
                }`}
              >
                {expandedSections.futureSection2 ? (
                  <FaChevronDown className="text-gray-600" />
                ) : (
                  <FaChevronRight className="text-gray-600" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                Shift Settings
              </h2>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Coming Soon
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Manage shift timings and configurations
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

// Reused component from OvertimeEntry
function Th({ children }) {
  return (
    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`p-4 ${className}`}>{children}</td>;
}
