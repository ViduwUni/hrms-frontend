import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaPlus, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

import {
  fetchOvertimeReasons,
  addOvertimeReason,
  deleteOvertimeReason,
} from "../api/overtimeReasonApi";

import {
  getOTSettings,
  createOTSettings,
  updateOTSettings,
  deleteOTSettings,
} from "../api/otAPI";

export default function Settings() {
  const [openSections, setOpenSections] = useState({
    overtimeReasons: true,
    otSettings: true,
  });
  const [reasons, setReasons] = useState([]);
  const [newReason, setNewReason] = useState("");
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [shiftOTStart, setShiftOTStart] = useState({});
  const [saturdayShiftHours, setSaturdayShiftHours] = useState({});
  const [loadingOT, setLoadingOT] = useState(false);
  const [tempStop, setTempStop] = useState(false);

  useEffect(() => {
    setTempStop(true);
  }, []);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const loadReasons = async () => {
    setLoadingReasons(true);
    try {
      const res = await fetchOvertimeReasons();
      setReasons(res.data || []);
    } catch (error) {
      toast.error(`Failed to load overtime reasons: ${error.message}`);
    } finally {
      setLoadingReasons(false);
    }
  };

  useEffect(() => {
    loadReasons();
  }, []);

  const handleAddReason = async () => {
    if (!newReason.trim()) return toast.error("Reason cannot be empty");

    try {
      const saved = await addOvertimeReason(newReason.trim());
      toast.success("Reason added");
      setReasons((prev) => [...prev, saved.data]); // add locally
      setNewReason("");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to add reason");
    }
  };

  const handleDeleteReason = async (id) => {
    try {
      await deleteOvertimeReason(id);
      setReasons((prev) => prev.filter((r) => r._id !== id)); // remove locally
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  // --- Load OT Settings ---
  const loadOTSettings = async () => {
    try {
      const res = await getOTSettings();

      // Check if res.data.settings exists and has at least one item
      const data =
        res.data?.settings && res.data.settings.length > 0
          ? res.data.settings[0]
          : null;

      if (data) {
        setShiftOTStart({ ...data.shiftOTStart });
        setSaturdayShiftHours({ ...data.saturdayShiftHours });
      } else {
        setShiftOTStart({});
        setSaturdayShiftHours({});
      }
    } catch (err) {
      toast.error("Failed to fetch OT Settings");
      console.error(err);
    }
  };

  useEffect(() => {
    if (!tempStop) {
      loadOTSettings();
    }
  }, []);

  // --- OT Save Handler ---
  const handleOTSave = async () => {
    setLoadingOT(true);
    try {
      const res = await getOTSettings();
      const existing =
        res.data?.settings && res.data.settings.length > 0
          ? res.data.settings[0]
          : null;

      if (existing) {
        await updateOTSettings({ shiftOTStart, saturdayShiftHours });
        toast.success("OT settings updated successfully");
      } else {
        await createOTSettings({ shiftOTStart, saturdayShiftHours });
        toast.success("OT settings created successfully");
      }

      await loadOTSettings(); // refresh dynamically
    } catch (err) {
      toast.error("Failed to save OT settings");
      console.error(err);
    } finally {
      setLoadingOT(false);
    }
  };

  const handleOTDelete = async () => {
    if (!window.confirm("Are you sure you want to delete OT settings?")) return;
    setLoadingOT(true);
    try {
      await deleteOTSettings();
      setShiftOTStart({});
      setSaturdayShiftHours({});
      toast.success("OT settings deleted successfully");
    } catch (err) {
      toast.error("Failed to delete OT settings");
      console.error(err);
    } finally {
      setLoadingOT(false);
    }
  };

  // --- Dynamic shift handlers ---
  const addShift = (type) => {
    const name = prompt("Enter shift name (e.g., 9:00am):");
    if (!name) return;
    if (type === "weekday") {
      setShiftOTStart((prev) => ({ ...prev, [name]: 0 }));
    } else {
      setSaturdayShiftHours((prev) => ({ ...prev, [name]: 0 }));
    }
  };

  const removeShift = (type, shift) => {
    if (!window.confirm(`Remove shift ${shift}?`)) return;
    if (type === "weekday") {
      const { [shift]: _, ...rest } = shiftOTStart;
      setShiftOTStart(rest);
    } else {
      const { [shift]: _, ...rest } = saturdayShiftHours;
      setSaturdayShiftHours(rest);
    }
  };

  return (
    <div className="ml-64 p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-600 mb-8">
        Configure system preferences and settings.
      </p>

      {/* OVERTIME REASONS SECTION */}
      <div className="mb-8 border border-gray-300 rounded-2xl bg-white shadow-lg">
        <button
          className="w-full px-6 py-4 flex justify-between items-center text-left text-gray-900 font-bold text-lg hover:bg-gray-100 rounded-t-2xl transition"
          onClick={() => toggleSection("overtimeReasons")}
        >
          <span>Overtime Reasons</span>
          {openSections.overtimeReasons ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {openSections.overtimeReasons && (
          <div className="p-6 border-t border-gray-200 space-y-4">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>

            {loadingReasons ? (
              <p className="text-gray-500">Loading...</p>
            ) : reasons.length === 0 ? (
              <p className="text-gray-500">No overtime reasons found.</p>
            ) : (
              <table className="w-full text-sm text-gray-700 border-collapse rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
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
                          onClick={() => handleDeleteReason(item._id)}
                          className="text-red-600 hover:underline transition"
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

      {/* OT SETTINGS SECTION */}
      {tempStop === true ? null : (
        <div className="mb-8 border border-gray-300 rounded-2xl bg-white shadow-lg">
          <button
            className="w-full px-6 py-4 flex justify-between items-center text-left text-gray-900 font-bold text-lg hover:bg-gray-100 rounded-t-2xl transition"
            onClick={() => toggleSection("otSettings")}
          >
            <span>OT Settings</span>
            {openSections.otSettings ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {openSections.otSettings && (
            <div className="p-6 border-t border-gray-200 space-y-6">
              {/* Weekday OT Start */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex justify-between items-center text-base">
                  Weekday OT Start (hours)
                  <button
                    onClick={() => addShift("weekday")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 hover:text-green-800 transition"
                  >
                    <FaPlus /> Add Shift
                  </button>
                </h3>
                <div className="space-y-2">
                  {Object.entries(shiftOTStart).map(([shift, value]) => (
                    <div
                      key={shift}
                      className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg shadow-sm"
                    >
                      <span className="text-gray-700 font-medium">{shift}</span>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) =>
                          setShiftOTStart((prev) => ({
                            ...prev,
                            [shift]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-24 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 text-gray-900"
                      />
                      <button
                        onClick={() => removeShift("weekday", shift)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saturday Shift Hours */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex justify-between items-center text-base">
                  Saturday Shift Hours
                  <button
                    onClick={() => addShift("saturday")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 hover:text-green-800 transition"
                  >
                    <FaPlus /> Add Shift
                  </button>
                </h3>
                <div className="space-y-2">
                  {Object.entries(saturdayShiftHours).map(([shift, value]) => (
                    <div
                      key={shift}
                      className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg shadow-sm"
                    >
                      <span className="text-gray-700 font-medium">{shift}</span>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) =>
                          setSaturdayShiftHours((prev) => ({
                            ...prev,
                            [shift]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-24 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 text-gray-900"
                      />
                      <button
                        onClick={() => removeShift("saturday", shift)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleOTSave}
                  disabled={loadingOT}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition"
                >
                  {loadingOT ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleOTDelete}
                  disabled={loadingOT}
                  className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
