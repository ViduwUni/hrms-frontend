import { useEffect, useState } from "react";
import { getOvertimes } from "../api/overtimeAPI";
import toast from "react-hot-toast";
import InfoLoader from "../components/InfoLoader";
import { useContext } from "react";
import { UIContext } from "../context/UIContext";

export default function Overtime() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [overtimeData, setOvertimeData] = useState({});
  const [loading, setLoading] = useState(false);
  const { collapsed } = useContext(UIContext);

  // Fetch overtime data whenever month changes
  useEffect(() => {
    fetchOvertimes();
  }, [selectedMonth]);

  const fetchOvertimes = async () => {
    setLoading(true);
    try {
      const res = await getOvertimes();

      // Filter entries by selected month
      const monthEntries = res.data.filter((entry) => {
        const entryDate = new Date(entry.createdAt);
        const entryMonth = `${entryDate.getFullYear()}-${String(
          entryDate.getMonth() + 1
        ).padStart(2, "0")}`;
        return entryMonth === selectedMonth;
      });

      // Group by employeeNumber
      const grouped = {};
      monthEntries.forEach((entry) => {
        const empNumber =
          entry.employeeNumber || entry.employee?.employeeNumber;
        if (!grouped[empNumber]) grouped[empNumber] = [];
        grouped[empNumber].push(entry);
      });

      setOvertimeData(grouped);
    } catch (err) {
      toast.error("Failed to load overtime entries");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  // Calculate overall summary for the month
  const summary = Object.values(overtimeData).reduce(
    (totals, empEntries) => {
      totals.normal += empEntries.reduce(
        (sum, e) => sum + (Number(e.normalot) || 0),
        0
      );
      totals.double += empEntries.reduce(
        (sum, e) => sum + (Number(e.doubleot) || 0),
        0
      );
      totals.triple += empEntries.reduce(
        (sum, e) => sum + (Number(e.tripleot) || 0),
        0
      );
      return totals;
    },
    { normal: 0, double: 0, triple: 0 }
  );

  return (
    <div
      className={`transition-all duration-300 ${
        collapsed ? "ml-0" : "ml-60"
      } p-8 min-h-screen bg-gray-50`}
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Monthly Overtime Monitoring
      </h1>

      {/* Month Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="font-medium text-gray-700">Select Month:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary */}
      {!loading && Object.keys(overtimeData).length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Month Summary</h2>
          <div className="text-gray-700 font-medium">
            Total OT: Normal {summary.normal}h | Double {summary.double}h |
            Triple {summary.triple}h
          </div>
        </div>
      )}

      {loading ? (
        <InfoLoader text={"Loading overtime data."} />
      ) : Object.keys(overtimeData).length === 0 ? (
        <div className="text-gray-400 mb-4 border border-gray-500 p-5 justify-center flex flex-col items-center rounded-lg">
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
            No Overtime records found
          </h3>
          <p className="text-gray-500">
            Add your first overtime record using the entry form in (Entries
            Tab).
          </p>
        </div>
      ) : (
        Object.keys(overtimeData).map((empNumber) => {
          const empEntries = overtimeData[empNumber];
          const employeeName =
            empEntries[0].name || empEntries[0].employee?.name || "Unknown";

          // Calculate total OT per employee
          const totalNormal = empEntries.reduce(
            (sum, e) => sum + (Number(e.normalot) || 0),
            0
          );
          const totalDouble = empEntries.reduce(
            (sum, e) => sum + (Number(e.doubleot) || 0),
            0
          );
          const totalTriple = empEntries.reduce(
            (sum, e) => sum + (Number(e.tripleot) || 0),
            0
          );

          return (
            <div
              key={empNumber}
              className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Employee Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  {employeeName} ({empNumber})
                </h2>
                <div className="text-gray-600 text-sm">
                  Total OT: Normal {totalNormal}h | Double {totalDouble}h |
                  Triple {totalTriple}h
                </div>
              </div>

              {/* OT Table */}
              <div className="p-6 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Date</Th>
                      <Th>Shift</Th>
                      <Th>In Time</Th>
                      <Th>Out Time</Th>
                      <Th>Reason</Th>
                      <Th>Normal OT</Th>
                      <Th>Double OT</Th>
                      <Th>Triple OT</Th>
                      <Th>Night</Th>
                      <Th>Approved OT</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {empEntries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <Td>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </Td>
                        <Td>{entry.shift || "-"}</Td>
                        <Td>{entry.intime || "-"}</Td>
                        <Td>{entry.outtime || "-"}</Td>
                        <Td>{entry.reason || "-"}</Td>
                        <Td className="text-center">{entry.normalot || 0}</Td>
                        <Td className="text-center">{entry.doubleot || 0}</Td>
                        <Td className="text-center">{entry.tripleot || 0}</Td>
                        <Td className="text-center">
                          {entry.night?.toLowerCase() === "yes" ? "Yes" : "No"}
                        </Td>
                        <Td className="text-center">{entry.approvedot || 0}</Td>
                        <Td className="text-center">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              entry.status === "Approved"
                                ? "bg-green-100 text-green-700"
                                : entry.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {entry.status || "Pending"}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// Table Head Cell
function Th({ children }) {
  return (
    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
      {children}
    </th>
  );
}

// Table Data Cell
function Td({ children, className = "" }) {
  return <td className={`p-4 ${className}`}>{children}</td>;
}
