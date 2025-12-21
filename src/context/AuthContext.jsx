import { createContext, useEffect, useRef, useState } from "react";
import { getProfile, logoutUser } from "../api/authAPI";
import toast from "react-hot-toast";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const SESSION_EXPIRES_KEY = "sessionExpires";
const TOKEN_KEY = "token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // timers
  const warnTimerRef = useRef(null);
  const autoLogoutTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // to avoid re-scheduling repeatedly with same value
  const lastSeenExpiresRef = useRef(null);

  const clearSessionTimers = () => {
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (autoLogoutTimerRef.current) clearTimeout(autoLogoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    warnTimerRef.current = null;
    autoLogoutTimerRef.current = null;
    countdownRef.current = null;
  };

  const startCountdown = (expiresAtMs) => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    const tick = () => {
      const left = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setSecondsLeft(left);
    };

    tick();
    countdownRef.current = setInterval(tick, 1000);
  };

  const logout = async (message = "Logged out.") => {
    try {
      await logoutUser();
    } catch (err) {
      console.log("Logout error:", err);
      // don't block local logout
    } finally {
      clearSessionTimers();
      setShowWarningModal(false);
      setShowWarningBanner(false);
      setSecondsLeft(0);

      localStorage.clear();
      setUser(null);

      toast.success(message);
      // If using react-router: navigate("/login")
    }
  };

  const scheduleSessionTimers = (sessionExpiresISO) => {
    clearSessionTimers();

    // reset warning UI if no expiry
    if (!sessionExpiresISO) {
      setShowWarningModal(false);
      setShowWarningBanner(false);
      setSecondsLeft(0);
      return;
    }

    const expiresAtMs = new Date(sessionExpiresISO).getTime();
    if (Number.isNaN(expiresAtMs)) {
      // bad value, treat as logged out
      return;
    }

    const now = Date.now();

    // ✅ Your requested timings
    const WARN_BEFORE_MS = 60 * 1000; // 1 minute
    const AUTO_LOGOUT_BEFORE_MS = 5 * 1000; // 5 seconds before expiry

    if (now >= expiresAtMs) {
      logout("Session expired. Please log in again.");
      return;
    }

    const warnAtMs = expiresAtMs - WARN_BEFORE_MS;
    const autoLogoutAtMs = expiresAtMs - AUTO_LOGOUT_BEFORE_MS;

    const showWarning = () => {
      // show modal once, keep banner visible
      setShowWarningModal(true);
      setShowWarningBanner(true);
      startCountdown(expiresAtMs);
    };

    // warn
    const warnDelay = warnAtMs - now;
    if (warnDelay <= 0) {
      showWarning();
    } else {
      warnTimerRef.current = setTimeout(showWarning, warnDelay);
    }

    // auto logout
    const autoDelay = autoLogoutAtMs - now;
    autoLogoutTimerRef.current = setTimeout(() => {
      logout("Session expired. Please log in again.");
    }, Math.max(0, autoDelay));
  };

  /** Call when sessionExpires might have changed */
  const onSessionExpiresMaybeChanged = () => {
    const next = localStorage.getItem(SESSION_EXPIRES_KEY);

    // avoid re-scheduling if unchanged
    if (next === lastSeenExpiresRef.current) return;

    lastSeenExpiresRef.current = next;
    scheduleSessionTimers(next);
  };

  // Initial boot: load profile + schedule timers
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      getProfile()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("username", res.data.username);

          lastSeenExpiresRef.current =
            localStorage.getItem(SESSION_EXPIRES_KEY);
          scheduleSessionTimers(lastSeenExpiresRef.current);
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(SESSION_EXPIRES_KEY);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => clearSessionTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ✅ Detect localStorage changes WITHOUT refresh:
   * 1) Patch localStorage setItem/removeItem/clear in THIS TAB (so updates are noticed immediately)
   * 2) Listen to "storage" for OTHER TABS
   * 3) Optional lightweight polling fallback (in case some code bypasses patching)
   */
  useEffect(() => {
    // ---- 1) Patch localStorage in this tab ----
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;

    const notify = () =>
      window.dispatchEvent(new Event("localstorage:changed"));

    localStorage.setItem = function (key, value) {
      originalSetItem.call(this, key, value);
      if (key === SESSION_EXPIRES_KEY || key === TOKEN_KEY) notify();
    };

    localStorage.removeItem = function (key) {
      originalRemoveItem.call(this, key);
      if (key === SESSION_EXPIRES_KEY || key === TOKEN_KEY) notify();
    };

    localStorage.clear = function () {
      originalClear.call(this);
      notify();
    };

    // listen for our custom event
    const onCustom = () => onSessionExpiresMaybeChanged();
    window.addEventListener("localstorage:changed", onCustom);

    // ---- 2) Other tabs ----
    const onStorage = (e) => {
      if (e.key === SESSION_EXPIRES_KEY || e.key === TOKEN_KEY) {
        onSessionExpiresMaybeChanged();
      }
    };
    window.addEventListener("storage", onStorage);

    // ---- 3) Optional poll fallback (every 2s) ----
    const pollId = setInterval(() => {
      onSessionExpiresMaybeChanged();
    }, 2000);

    // init once
    onSessionExpiresMaybeChanged();

    return () => {
      // restore
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      localStorage.clear = originalClear;

      window.removeEventListener("localstorage:changed", onCustom);
      window.removeEventListener("storage", onStorage);
      clearInterval(pollId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        loading,
        secondsLeft,
      }}
    >
      {children}

      {/* Sticky top banner (stays visible after warning starts) */}
      {showWarningBanner && (
        <SessionExpiryBanner secondsLeft={secondsLeft} onLogout={logout} />
      )}

      {/* Dismissible modal (click outside closes) */}
      {showWarningModal && (
        <SessionExpiryModal
          secondsLeft={secondsLeft}
          onClose={() => setShowWarningModal(false)}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
};

// ---------- UI helpers ----------
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function SessionExpiryBanner({ secondsLeft, onLogout }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-sm">
          <span className="font-semibold">Session expiring soon.</span> Save
          your work. Auto logout in{" "}
          <span className="font-mono font-bold">{formatTime(secondsLeft)}</span>
        </div>

        <button
          onClick={() => onLogout("Logged out. Please log in again.")}
          className="shrink-0 rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
        >
          Logout now
        </button>
      </div>
    </div>
  );
}

function SessionExpiryModal({ secondsLeft, onClose, onLogout }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* backdrop - clicking it closes modal */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        className="relative w-[92%] max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900">
          Session expiring in {formatTime(secondsLeft)}
        </h2>

        <p className="mt-2 text-gray-700">
          Please save your work now. You will be logged out automatically
          shortly.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-800 font-medium hover:bg-gray-200"
          >
            Continue working
          </button>

          <button
            onClick={() => onLogout("Logged out. Please log in again.")}
            className="rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
          >
            Logout now
          </button>
        </div>
      </div>
    </div>
  );
}
