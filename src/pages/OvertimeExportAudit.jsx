import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { getDownloadLogs } from "../api/downloadLogAPI";
import { getProfile } from "../api/authAPI";
import toast from "react-hot-toast";
import InfoLoader from "../components/InfoLoader";

export default function Audit() {
  const [downloadLogs, setDownloadLogs] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [openSections, setOpenSections] = useState({ downloadLogs: true });
  const [profile, setProfile] = useState(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (error) {
        toast.error(`Error fetching profile: ${error}`);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch download logs (only for admin)
  const fetchDownloadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await getDownloadLogs();
      setDownloadLogs(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error("You do not have permission to view download logs.");
      } else {
        toast.error("Failed to load download logs");
      }
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch logs once profile is loaded and user is admin
  useEffect(() => {
    if (profile?.isAdmin) {
      fetchDownloadLogs();
    }
  }, [profile]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="ml-64 p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Audit Logs</h1>
      <p className="text-gray-600 mb-6">
        View and track audit information for actions performed in the system.
      </p>

      {/* Wait until profile is loaded */}
      {loadingProfile ? (
        <InfoLoader text="Fetching profile..." />
      ) : profile?.isAdmin ? (
        <div className="mb-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          <button
            className="w-full px-6 py-4 flex justify-between items-center text-left text-gray-800 font-semibold focus:outline-none"
            onClick={() => toggleSection("downloadLogs")}
          >
            <span>Overtime Download Logs</span>
            {openSections.downloadLogs ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {openSections.downloadLogs && (
            <div className="p-6 border-t border-gray-200 overflow-x-auto">
              {loadingLogs ? (
                <InfoLoader text="Loading download logs..." />
              ) : downloadLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No download logs found.
                </p>
              ) : (
                <table className="w-full text-sm text-gray-700 border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">User</th>
                      <th className="border px-4 py-2 text-left">Start Date</th>
                      <th className="border px-4 py-2 text-left">End Date</th>
                      <th className="border px-4 py-2 text-left">
                        Download Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {downloadLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">
                          {log.user?.username || "N/A"}
                        </td>
                        <td className="border px-4 py-2">
                          {new Date(log.startDate).toLocaleDateString()}
                        </td>
                        <td className="border px-4 py-2">
                          {new Date(log.endDate).toLocaleDateString()}
                        </td>
                        <td className="border px-4 py-2">
                          {new Date(log.downloadedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-red-500 text-center py-4">
          Only admin users can view download logs.
        </p>
      )}
    </div>
  );
}
