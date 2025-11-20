import { useEffect, useState } from "react";
import { getOvertimeAuditLogs } from "../api/overtimeAuditAPI";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import InfoLoader from "../components/InfoLoader";
import toast from "react-hot-toast";

export default function OvertimeAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [expanded, setExpanded] = useState({});

  const fetchLogs = async () => {
    await toast
      .promise(
        (async () => {
          setLoading(true);
          const res = await getOvertimeAuditLogs();
          setLogs(res.data);
          return res;
        })(),
        {
          loading: "Refreshing audit logs...",
          success: "Audit logs refreshed!",
          error: "Failed to refresh audit logs",
        }
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionColor = {
    CREATE: "text-green-600 font-semibold",
    UPDATE: "text-blue-600 font-semibold",
    DELETE: "text-red-600 font-semibold",
    APPROVE: "text-purple-600 font-semibold",
    REJECT: "text-pink-600 font-semibold",
  };

  const renderDetails = (details, id, action) => {
    let overtimeDetails;

    if (action === "APPROVE" || action === "REJECT") {
      overtimeDetails = {
        approvedot: details?.approvedot,
        previousStatus: details?.previousStatus,
        newStatus: details?.newStatus,
        updatedReason: details?.updatedReason,
      };
    } else if (action === "UPDATE") {
      overtimeDetails = details?.updatedFields || {};
    } else if (action === "DELETE") {
      const overtime = details?.overtime || {};
      overtimeDetails = { deleted: details?.deleted, ...overtime };
    } else {
      overtimeDetails =
        details?.overtime || details?.details?.overtime || details?.details;
    }

    if (!overtimeDetails || typeof overtimeDetails !== "object")
      return <i>No details available</i>;

    const filtered = Object.entries(overtimeDetails).filter(
      // eslint-disable-next-line no-unused-vars
      ([key, value]) => value !== undefined && value !== null
    );

    const isExpanded = expanded[id] || false;
    const shownData = isExpanded ? filtered : filtered.slice(0, 6);

    return (
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
        {shownData.map(([key, value]) => (
          <div key={key} className="py-0.5">
            <span className="font-semibold capitalize">
              {key.replace(/([A-Z])/g, " $1")}:
            </span>{" "}
            <span>{String(value)}</span>
          </div>
        ))}

        {filtered.length > 6 && (
          <button
            onClick={() =>
              setExpanded((prev) => ({ ...prev, [id]: !isExpanded }))
            }
            className="text-blue-600 underline mt-1 text-xs"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        )}
      </div>
    );
  };

  // Search filter
  const filteredLogs = logs.filter((log) => {
    const text = search.toLowerCase();

    return (
      log.action.toLowerCase().includes(text) ||
      log.performedBy.toLowerCase().includes(text) ||
      JSON.stringify(log.details).toLowerCase().includes(text)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="ml-64 p-8 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Overtime Audit Logs
        </h1>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      <p className="text-gray-600 mb-6">
        Track all actions related to overtime entries.
      </p>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by action, user, reason, employee number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full p-3 border rounded-lg shadow-sm"
        />
      </div>

      <div className="mb-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <button
          className="w-full px-6 py-4 flex justify-between items-center text-left text-gray-800 font-semibold"
          onClick={() => setOpen(!open)}
        >
          <span>Overtime Audit Logs</span>
          {open ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {open && (
          <div className="p-6 border-t border-gray-200 overflow-x-auto">
            {loading ? (
              <InfoLoader text="Loading audit logs..." />
            ) : paginatedLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No audit logs found.
              </p>
            ) : (
              <>
                <table className="w-full text-sm text-gray-700 border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">Action</th>
                      <th className="border px-4 py-2 text-left">
                        Performed By
                      </th>
                      <th className="border px-4 py-2 text-left">Details</th>
                      <th className="border px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td
                          className={`border px-4 py-2 ${
                            actionColor[log.action] || "text-gray-700"
                          }`}
                        >
                          {log.action}
                        </td>

                        <td className="border px-4 py-2">{log.performedBy}</td>

                        <td className="border px-4 py-2">
                          {renderDetails(log.details, log._id, log.action)}
                        </td>

                        <td className="border px-4 py-2">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <span>
                    Page {page} of {totalPages}
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
