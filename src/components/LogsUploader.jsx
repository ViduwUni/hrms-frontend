import { useState } from "react";
import { FaDownload } from "react-icons/fa";
import InfoLoader from "./InfoLoader";
import toast from "react-hot-toast";

export default function LogsUploader() {
  const [logs, setLogs] = useState([]);
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/logs/process`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!data.logs) {
        toast.error("Invalid file or format");
        setLoading(false);
        return;
      }

      setLogs(data.logs);
      setCsv(data.csv);

      toast.success("Log file processed!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to process file");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "sorted_logs.csv";
    a.click();

    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded successfully.");
  };

  return (
    <div className="ml-64 p-8 min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Fingerprint Log Formatter
        </h1>
        <p className="text-gray-600">
          Upload raw fingerprint machine TXT logs and get clean, sorted output
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
        {/* Upload Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-1">
              Upload TXT File
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white file:bg-gray-100 file:border-none file:px-4 file:py-2 file:rounded-l-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {loading && <InfoLoader />}

      {/* Logs Table */}
      {logs.length > 0 && !loading && (
        <div className="mt-8 bg-white shadow-sm rounded-xl p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Processed Logs
            </h2>

            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-all shadow-sm"
            >
              <FaDownload />
              Download CSV
            </button>
          </div>

          <div className="overflow-auto max-h-[60vh] border rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border px-3 py-2 text-left">Emp ID</th>
                  <th className="border px-3 py-2 text-left">Date</th>
                  <th className="border px-3 py-2 text-left">Time</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{log.empId}</td>
                    <td className="border px-3 py-2">{log.date}</td>
                    <td className="border px-3 py-2">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
