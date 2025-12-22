import { useEffect, useMemo, useState, memo, useContext } from "react";
import { getOvertimes } from "../api/overtimeAPI";
import toast from "react-hot-toast";
import InfoLoader from "../components/InfoLoader";
import { UIContext } from "../context/UIContext";

export default function Overtime() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // ✅ store raw entries only (less state churn)
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const { collapsed } = useContext(UIContext);

  // ✅ fetch ONCE (frontend optimization)
  useEffect(() => {
    fetchOvertimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOvertimes = async () => {
    setLoading(true);
    try {
      const res = await getOvertimes();
      setEntries(res.data || []);
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

  // ✅ month filtering via string slice (fast + avoids timezone parsing issues)
  const monthEntries = useMemo(() => {
    const sel = selectedMonth; // "YYYY-MM"
    return (entries || []).filter((entry) => {
      const d = entry?.date ? String(entry.date) : "";
      return d.slice(0, 7) === sel;
    });
  }, [entries, selectedMonth]);

  // ✅ group by employeeNumber (memoized)
  const overtimeData = useMemo(() => {
    const grouped = {};
    for (const entry of monthEntries) {
      const empNumber = entry.employeeNumber || entry.employee?.employeeNumber;
      if (!empNumber) continue;
      if (!grouped[empNumber]) grouped[empNumber] = [];
      grouped[empNumber].push(entry);
    }
    return grouped;
  }, [monthEntries]);

  // ✅ summary (memoized)
  const summary = useMemo(() => {
    let normal = 0,
      double = 0,
      triple = 0;

    for (const empEntries of Object.values(overtimeData)) {
      for (const e of empEntries) {
        normal += Number(e.normalot) || 0;
        double += Number(e.doubleot) || 0;
        triple += Number(e.tripleot) || 0;
      }
    }
    return { normal, double, triple };
  }, [overtimeData]);

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
          <div className="flex flex-wrap items-center gap-2 font-medium text-sm">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              Normal {summary.normal}h
            </span>

            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              Double {summary.double}h
            </span>

            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              Triple {summary.triple}h
            </span>
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
        Object.entries(overtimeData).map(([empNumber, empEntries]) => (
          <EmployeeCard
            key={empNumber}
            empNumber={empNumber}
            empEntries={empEntries}
          />
        ))
      )}
    </div>
  );
}

/**
 * ✅ Memoized heavy UI block so sidebar collapse / month input doesn't re-render
 * all employee tables unnecessarily.
 */
const EmployeeCard = memo(function EmployeeCard({ empNumber, empEntries }) {
  const employeeName =
    empEntries[0].name || empEntries[0].employee?.name || "Unknown";

  // ✅ totals computed once per card render
  let totalNormal = 0,
    totalDouble = 0,
    totalTriple = 0;

  for (const e of empEntries) {
    totalNormal += Number(e.normalot) || 0;
    totalDouble += Number(e.doubleot) || 0;
    totalTriple += Number(e.tripleot) || 0;
  }

  // ✅ precompute date labels to avoid new Date() on every cell render
  const rows = useMemo(() => {
    return empEntries.map((e) => ({
      ...e,
      _dateLabel: e?.date ? new Date(e.date).toLocaleDateString() : "-",
    }));
  }, [empEntries]);

  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Employee Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {employeeName} ({empNumber})
        </h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            Normal {totalNormal}h
          </span>

          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            Double {totalDouble}h
          </span>

          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            Triple {totalTriple}h
          </span>
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
            {rows.map((entry, idx) => (
              <tr
                key={
                  entry._id ||
                  entry.id ||
                  `${empNumber}-${entry.date}-${entry.intime}-${idx}`
                }
                className="hover:bg-gray-50/50"
              >
                <Td>{entry._dateLabel}</Td>
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
});

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
