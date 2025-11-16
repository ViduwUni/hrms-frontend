import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

import {
  fetchOvertimeReasons,
  addOvertimeReason,
  deleteOvertimeReason,
} from "../api/overtimeReasonApi";
import toast from "react-hot-toast";

export default function Settings() {
  const [openSections, setOpenSections] = useState({
    overtimeReasons: true,
  });

  const [reasons, setReasons] = useState([]);
  const [newReason, setNewReason] = useState("");
  const [loadingReasons, setLoadingReasons] = useState(false);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Fetch all overtime reasons
  const loadReasons = async () => {
    setLoadingReasons(true);
    try {
      const res = await fetchOvertimeReasons();
      setReasons(res.data);
    } catch (error) {
      toast.error(`Failed to load overtime reasons: ${error.message}`);
    } finally {
      setLoadingReasons(false);
    }
  };

  useEffect(() => {
    loadReasons();
  }, []);

  // Add new reason
  const handleAddReason = async () => {
    if (!newReason.trim()) return toast.error("Reason cannot be empty");

    try {
      await addOvertimeReason(newReason.trim());
      toast.success("Reason added");
      setNewReason("");
      loadReasons();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to add reason");
    }
  };

  // Delete reason
  const handleDelete = async (id) => {
    try {
      await deleteOvertimeReason(id);
      toast.success("Deleted successfully");
      loadReasons();
    } catch (error) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  return (
    <div className="ml-64 p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Settings</h1>
      <p className="text-gray-600 mb-6">
        Configure system preferences and settings.
      </p>

      {/* OVERTIME REASONS SECTION */}
      <div className="mb-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <button
          className="w-full px-6 py-4 flex justify-between items-center text-left text-gray-800 font-semibold focus:outline-none"
          onClick={() => toggleSection("overtimeReasons")}
        >
          <span>Overtime Reasons</span>
          {openSections.overtimeReasons ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {openSections.overtimeReasons && (
          <div className="p-6 border-t border-gray-200">
            {/* Add Reason Row */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Add new overtime reason"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddReason}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            {/* List of reasons */}
            {loadingReasons ? (
              <p className="text-gray-500">Loading...</p>
            ) : reasons.length === 0 ? (
              <p className="text-gray-500">No overtime reasons found.</p>
            ) : (
              <table className="w-full text-sm text-gray-700 border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Reason</th>
                    <th className="border px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reasons.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{item.option}</td>
                      <td className="border px-4 py-2">
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
