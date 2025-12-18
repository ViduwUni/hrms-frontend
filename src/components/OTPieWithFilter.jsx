import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { getOvertimes } from "../api/overtimeAPI";

export default function OTPieWithFilter() {
  const [mode, setMode] = useState("month"); // month | range
  const [filters, setFilters] = useState({});
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await getOvertimes();

      let normal = 0,
        double = 0,
        triple = 0;

      res.data.forEach((o) => {
        const d = new Date(o.date);
        let valid = true;

        if (mode === "month" && filters.month) {
          const [y, m] = filters.month.split("-");
          valid = d.getFullYear() === +y && d.getMonth() === +m - 1;
        }

        if (mode === "range" && filters.from && filters.to) {
          valid = d >= new Date(filters.from) && d <= new Date(filters.to);
        }

        if (valid) {
          normal += o.normalot || 0;
          double += o.doubleot || 0;
          triple += o.tripleot || 0;
        }
      });

      setData([
        { name: "Normal OT", value: normal },
        { name: "Double OT", value: double },
        { name: "Triple OT", value: triple },
      ]);
    };

    load();
  }, [filters, mode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart */}
      <motion.div className="lg:col-span-2 bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-2">OT Breakdown</h2>

        {/* Display selected month or range */}
        <p className="text-sm text-gray-500 mb-4">
          {mode === "month" && filters.month
            ? `Month: ${filters.month}`
            : mode === "range" && filters.from && filters.to
            ? `Range: ${filters.from} to ${filters.to}`
            : "All Data"}
        </p>

        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={data} dataKey="value" outerRadius={100}>
              <Cell fill="#3b82f6" />
              <Cell fill="#f59e0b" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Filters */}
      <motion.div className="bg-white rounded-xl border p-6 space-y-4">
        <h3 className="font-semibold">Filter Mode</h3>

        {/* Month checkbox */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={mode === "month"}
            onChange={() => {
              setMode("month");
              setFilters({});
            }}
          />
          Month
        </label>

        <input
          type="month"
          disabled={mode !== "month"}
          className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
          onChange={(e) => setFilters({ month: e.target.value })}
        />

        {/* Date range checkbox */}
        <label className="flex items-center gap-2 text-sm mt-4">
          <input
            type="checkbox"
            checked={mode === "range"}
            onChange={() => {
              setMode("range");
              setFilters({});
            }}
          />
          Date Range
        </label>

        <input
          type="date"
          disabled={mode !== "range"}
          className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
        />

        <input
          type="date"
          disabled={mode !== "range"}
          className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
        />
      </motion.div>
    </div>
  );
}
