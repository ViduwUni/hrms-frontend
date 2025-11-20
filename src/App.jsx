import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Loader from "./components/Loader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import { Toaster } from "react-hot-toast";
import "sweetalert2/dist/sweetalert2.min.css";

import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Employees from "./pages/Employees";
import OvertimeEntry from "./pages/OvertimeEntry";
import Overtime from "./pages/Overtime";
import OvertimeExport from "./pages/OvertimeExport";
import OTConfiguration from "./pages/OTConfiguration";
import OvertimeExportAudit from "./pages/OvertimeExportAudit";
import OvertimeAudit from "./pages/OvertimeAudit";
import LogsUploader from "./components/LogsUploader";
import SessionExpired from "./components/SessionExpired";

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Sidebar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/session-expired" element={<SessionExpired />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overtimeentry"
            element={
              <ProtectedRoute>
                <OvertimeEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overtimes"
            element={
              <ProtectedRoute>
                <Overtime />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overtimeexport"
            element={
              <ProtectedRoute>
                <OvertimeExport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <LogsUploader />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overtimeconfiguration"
            element={
              <ProtectedRoute>
                <OTConfiguration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overtime-export-audit"
            element={
              <ProtectedRoute>
                <OvertimeExportAudit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overtime-audit"
            element={
              <ProtectedRoute>
                <OvertimeAudit />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
