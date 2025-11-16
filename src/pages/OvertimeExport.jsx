import { useState } from "react";
import toast from "react-hot-toast";
import { FaFileExcel } from "react-icons/fa";
import { overtimeExport } from "../api/overtimeAPI";
import { getProfile } from "../api/authAPI";
import { addDownloadLog } from "../api/downloadLogAPI";

export default function OvertimeExport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setLoading(true);
    try {
      const res = await overtimeExport(startDate, endDate);

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Overtime_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Excel file generated successfully!");

      const profile = await getProfile();
      await addDownloadLog({
        userId: profile.data._id,
        startDate,
        endDate,
        downloadedAt: new Date(),
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-64 p-8 min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Export Overtime Report
        </h1>
        <p className="text-gray-600">
          Select a date range and download the employee overtime report in Excel
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <button
              onClick={handleExport}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-200 shadow-sm ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              <FaFileExcel /> {loading ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
