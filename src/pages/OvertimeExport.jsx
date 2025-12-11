import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaFileExcel } from "react-icons/fa";
import { overtimeExport, overtimePreview } from "../api/overtimeAPI";
import { getProfile } from "../api/authAPI";
import { addDownloadLog } from "../api/downloadLogAPI";
import { useContext } from "react";
import { UIContext } from "../context/UIContext";

export default function OvertimeExport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [preview, setPreview] = useState([]);
  const [summary, setSummary] = useState(null);
  const { collapsed } = useContext(UIContext);

  useEffect(() => {
    if (startDate && endDate) loadPreview();
  }, [startDate, endDate]);

  const loadPreview = async () => {
    try {
      const res = await overtimePreview(startDate, endDate);
      const records = res.data.data;

      setPreview(records);

      // summary calculations
      let s = {
        normal: 0,
        double: 0,
        triple: 0,
        approved: 0,
        night: 0,
      };

      records.forEach((ot) => {
        s.normal += ot.normalot || 0;
        s.double += ot.doubleot || 0;
        s.triple += ot.tripleot || 0;
        s.approved += ot.approvedot || 0;
        s.night += ot.night === "yes" ? 1 : 0;
      });

      setSummary(s);
    } catch {
      toast.error("Failed to load preview");
    }
  };

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
    } catch {
      toast.error("Failed to generate Excel file");
    } finally {
      setLoading(false);
    }
  };

  // Group data by employee
  const grouped = preview.reduce((acc, ot) => {
    if (!acc[ot.employeeNumber]) acc[ot.employeeNumber] = [];
    acc[ot.employeeNumber].push(ot);
    return acc;
  }, {});

  return (
    <div
      className={`transition-all duration-300 ${
        collapsed ? "ml-0" : "ml-60"
      } p-8 min-h-screen bg-gray-50`}
    >
      {/* --- Your Original Page --- */}
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

      {/* --- NEW PREVIEW AREA --- */}

      {summary && (
        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 mt-10">
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <ul className="text-gray-700">
            <li>Normal OT: {summary.normal.toFixed(2)}</li>
            <li>Double OT: {summary.double.toFixed(2)}</li>
            <li>Triple OT: {summary.triple.toFixed(2)}</li>
            <li>Approved OT: {summary.approved.toFixed(2)}</li>
            <li>Night Shifts: {summary.night}</li>
          </ul>
        </div>
      )}

      {preview.length > 0 && (
        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 mt-6">
          <h2 className="text-xl font-bold mb-4">Detailed Preview</h2>

          {Object.keys(grouped).map((emp) => (
            <div key={emp} className="mb-8">
              <h3 className="font-bold text-lg mb-2 text-blue-700">
                Employee: {emp} - {grouped[emp][0].name}
              </h3>

              <table className="w-full border text-sm">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Shift</th>
                    <th className="border p-2">In</th>
                    <th className="border p-2">Out</th>
                    <th className="border p-2">Reason</th>
                    <th className="border p-2">Normal</th>
                    <th className="border p-2">Double</th>
                    <th className="border p-2">Triple</th>
                    <th className="border p-2">Night</th>
                    <th className="border p-2">Approved</th>
                    <th className="border p-2">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {grouped[emp].map((ot) => (
                    <tr key={ot._id} className="border">
                      <td className="border p-2">{ot.date?.slice(0, 10)}</td>
                      <td className="border p-2">{ot.shift}</td>
                      <td className="border p-2">{ot.intime}</td>
                      <td className="border p-2">{ot.outtime}</td>
                      <td className="border p-2">{ot.reason}</td>
                      <td className="border p-2">{ot.normalot}</td>
                      <td className="border p-2">{ot.doubleot}</td>
                      <td className="border p-2">{ot.tripleot}</td>
                      <td className="border p-2">
                        {ot.night === "yes" ? 1 : 0}
                      </td>
                      <td className="border p-2">{ot.approvedot}</td>
                      <td className="border p-2">{ot.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
