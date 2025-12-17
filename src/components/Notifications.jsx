import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FaBell } from "react-icons/fa";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { getPendingOvertime } from "../api/overtimeAPI";
import { getProfile } from "../api/authAPI";
import toast from "react-hot-toast";

export default function Notifications() {
  const [pending, setPending] = useState([]);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const previousCount = useRef(0);
  const ref = useRef(null);

  const NotificationSound = useMemo(() => {
    return typeof Audio !== "undefined" ? new Audio("/notify.mp3") : null;
  }, []);

  // Fetch user profile once
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (error) {
        toast.error(`Error fetching profile: ${error}`);
      }
    };
    fetchProfile();
  }, []);

  // Optimized comparison (fast)
  const isDifferent = (oldList, newList) => {
    if (oldList.length !== newList.length) return true;
    const oldIds = oldList.map((i) => i._id);
    const newIds = newList.map((i) => i._id);
    return oldIds.join() !== newIds.join();
  };

  // Load pending overtime
  const loadPending = useCallback(async () => {
    try {
      const res = await getPendingOvertime();
      const newList = res.data.pending || [];

      if (isDifferent(pending, newList)) {
        if (newList.length > previousCount.current) {
          NotificationSound?.play().catch(() => {});
        }
        previousCount.current = newList.length;
        setPending(newList);
      }
    } catch (err) {
      console.error("Failed to fetch pending overtime:", err);
    }
  }, [pending, NotificationSound]);

  // Auto-refresh every 2 seconds (highly optimized)
  useEffect(() => {
    if (!profile?.canApprove) return;

    const interval = setInterval(() => {
      if (!open) loadPending(); // Pause updates when dropdown is open
    }, 2000);

    return () => clearInterval(interval);
  }, [open, profile, loadPending]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!profile?.canApprove) return null;

  return (
    <div className="relative z-50" ref={ref}>
      {/* Bell Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="relative"
        whileTap={{ scale: 0.95 }}
        whileHover={{ rotate: [0, -15, 15, -10, 10, 0] }}
        animate={
          pending.length > 0
            ? { rotate: [0, -10, 10, -10, 10, 0] }
            : { rotate: 0 }
        }
        transition={
          pending.length > 0
            ? { repeat: Infinity, repeatType: "loop", duration: 0.6 }
            : { duration: 0 }
        }
      >
        <FaBell className="text-2xl text-gray-600 transition-colors hover:text-gray-400" />

        {/* Notification Badge */}
        <AnimatePresence>
          {pending.length > 0 && (
            <motion.span
              key={pending.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full"
            >
              {pending.length}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Notification Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50"
          >
            <h3 className="font-semibold text-sm mb-3 text-white">
              Pending Overtime Approvals
            </h3>

            {pending.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                No pending approval requests
              </p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto pr-1">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: { staggerChildren: 0.08 },
                    },
                  }}
                >
                  {pending.map((p) => (
                    <motion.div
                      key={p._id}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: { opacity: 1, x: 0 },
                      }}
                      className="mb-3 pb-2 border-b border-gray-700 text-xs text-gray-300"
                    >
                      <p className="font-medium">
                        {p.name} ({p.employeeNumber})
                      </p>
                      <p className="text-gray-500">
                        {new Date(p.date).toDateString()}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
