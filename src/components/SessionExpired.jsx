import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SessionExpired() {
  const [seconds, setSeconds] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    const timeout = setTimeout(() => {
      navigate("/login");
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white shadow-lg p-8 rounded-xl text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">
          Session Expired
        </h1>
        <p className="text-gray-700 mb-4">
          Your session has timed out. You will be redirected to the login page
          in <span className="font-bold">{seconds}</span> seconds.
        </p>
      </div>
    </div>
  );
}
