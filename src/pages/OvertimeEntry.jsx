import { useEffect, useState } from "react";
import { getEmployees } from "../api/employeeAPI";
import {
  addOvertime,
  getOvertimes,
  updateOvertime,
  approveOvertime,
  deleteOvertime,
  rejectOvertime,
} from "../api/overtimeAPI";
import { getTripleOTs } from "../api/tripleOTAPI";
import { getProfile } from "../api/authAPI";
import { FaPlus, FaSave, FaCircle, FaRegCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import InfoLoader from "../components/InfoLoader";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import OvertimeReasonDropdown from "../components/OvertimeReasonDropdown";

export default function OvertimeEntry() {
  const [employees, setEmployees] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingEntries, setExistingEntries] = useState([]);
  const [weeklyEntries, setWeeklyEntries] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editableRows, setEditableRows] = useState([]);
  const [tripleOTDates, setTripleOTDates] = useState([]);
  const [profile, setProfile] = useState(null);

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

  useEffect(() => {
    const fetchTripleOTDates = async () => {
      try {
        const response = await getTripleOTs();
        const dates = response.data.map((item) => item.date);
        setTripleOTDates(dates);
      } catch (error) {
        toast.error(`Failed to load triple OT dates: ${error}`);
      }
    };

    fetchTripleOTDates();
  }, []);

  const fetchWeeklyEntries = async () => {
    setLoading(true);
    try {
      const res = await getOvertimes();
      // Filter only entries for the current week
      const weekEntries = res.data.filter((e) => {
        const d = new Date(e.date);
        return (
          d >= weekStart &&
          d < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        );
      });
      setWeeklyEntries(weekEntries);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load weekly entries");
    } finally {
      setLoading(false);
    }
  };

  const fetchExisting = async () => {
    if (!selectedDay) return;
    setLoading(true);
    try {
      const res = await getOvertimes();
      const dayEntries = res.data.filter((e) => {
        const entryDate = new Date(e.date);
        return (
          entryDate.toLocaleDateString("en-CA") ===
          selectedDay.toLocaleDateString("en-CA")
        );
      });
      setExistingEntries(dayEntries);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyEntries();
  }, [weekStart]);

  useEffect(() => {
    setLoading(true);
    getEmployees()
      .then((res) => setEmployees(res.data))
      .catch(() => toast.error("Failed to load employees"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchExisting();
  }, [selectedDay]);

  const handleEditableRowChange = (index, field, value) => {
    const updated = [...editableRows];
    updated[index][field] = value;

    // Recalculate OT if needed
    if (["shift", "intime", "outtime"].includes(field)) {
      updated[index] = calculateOT(updated[index]);
    }

    setEditableRows(updated);
  };

  const handleSaveEditedRow = async () => {
    if (editingRowIndex === null) return;

    const row = editableRows[editingRowIndex];

    try {
      setLoading(true);
      await updateOvertime(row._id, { ...row, status: row.status });
      toast.success("Overtime updated successfully!");

      // refresh table
      fetchExisting();
      setEditingRowIndex(null);
      setSelectedRowIndex(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update overtime");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditableRows(existingEntries);
  }, [existingEntries]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const changeWeek = (offset) => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + offset * 7);
    setWeekStart(newStart);
    setSelectedDay(null);
    setRows([]);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        employeeNumber: "",
        name: "",
        shift: "",
        intime: "",
        outtime: "",
        reason: "",
        normalot: 0,
        doubleot: 0,
        tripleot: 0,
        night: "No",
      },
    ]);
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;

    if (field === "employeeNumber") {
      const emp = employees.find((e) => e.employeeNumber === value);
      updated[index].name = emp ? emp.name : "";
      if (!emp) toast.error("Invalid employee selected");
    }

    // Recalculate OT whenever time or shift changes
    if (["shift", "intime", "outtime"].includes(field)) {
      updated[index] = calculateOT(updated[index]);
    }

    setRows(updated);
  };

  const calculateOT = (row) => {
    const intime = parseTime(row.intime);
    let outtime = parseTime(row.outtime);
    if (!intime || !outtime || !row.shift || !selectedDay) return row;

    // Handle overnight shifts
    if (outtime < intime) {
      outtime += 24;
    }

    const dayType = getDayType(selectedDay);

    const isTripleOT = tripleOTDates.some((d) => {
      const tripleDate = new Date(d);
      return tripleDate.toDateString() === selectedDay.toDateString();
    });

    let normal = 0,
      double = 0,
      triple = 0;

    // OT start config for weekdays
    const shiftOTStart = {
      "6:30am": 15.5,
      "8:30am": 17.5,
    };

    const saturdayShiftHours = {
      "6:30am": 5,
      "8:30am": 4,
    };

    // NORMAL OT calculation
    if (dayType === "weekday") {
      const otStart = shiftOTStart[row.shift] ?? 17.5;
      normal = floorToQuarter(Math.max(0, outtime - otStart));
    }

    if (dayType === "saturday") {
      const shiftDuration = saturdayShiftHours[row.shift] ?? 5;
      const shiftEnd = intime + shiftDuration;
      normal = floorToQuarter(Math.max(0, outtime - shiftEnd));
    }

    if (dayType === "sunday") {
      double = floorToQuarter(Math.max(0, outtime - intime));
    }

    // TRIPLE OT override
    if (isTripleOT) {
      triple = floorToQuarter(outtime - intime);
      normal = 0;
      double = 0;
    }

    // Night OT
    const night = outtime > 21 ? "Yes" : "No";

    return {
      ...row,
      normalot: normal,
      doubleot: double,
      tripleot: triple,
      night,
    };
  };

  const handleSave = async () => {
    if (loading) return;
    if (!selectedDay) {
      toast.error("Please select a day first");
      return;
    }

    if (rows.length === 0) {
      toast.error("No entries to save");
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirm Save",
      text: `Save ${rows.length} overtime entr${
        rows.length > 1 ? "ies" : "y"
      } for ${selectedDay.toDateString()}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save it!",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    // --- Field validations before saving ---
    for (const row of rows) {
      if (!row.employeeNumber || !row.name) {
        toast.error("Please select an employee for all rows");
        return;
      }
      if (!row.shift || !row.intime || !row.outtime || !row.reason?.trim()) {
        toast.error("Please fill all fields for all rows");
        return;
      }
    }

    try {
      setLoading(true);

      // Get all existing overtimes
      const res = await getOvertimes();
      const existing = res.data;

      for (const row of rows) {
        const payload = {
          ...row,
          date: selectedDay.toISOString(),
          status: "Pending",
        };

        // --- Duplicate check using the `date` field ---
        const duplicate = existing.find((e) => {
          const existingDate = new Date(e.date);
          const targetDate = new Date(selectedDay);

          // Match by employee number
          const sameEmployee = e.employeeNumber === row.employeeNumber;

          // Match by same calendar day (ignore hours/timezones)
          const sameDay =
            existingDate.getFullYear() === targetDate.getFullYear() &&
            existingDate.getMonth() === targetDate.getMonth() &&
            existingDate.getDate() === targetDate.getDate();

          return sameEmployee && sameDay;
        });

        console.log("Checking duplicates:", {
          selectedDay: selectedDay.toISOString(),
          existing: existing.map((e) => ({
            emp: e.employeeNumber,
            date: e.date,
          })),
        });

        if (duplicate) {
          // Ask before updating existing overtime record
          const updateConfirm = await Swal.fire({
            title: "Duplicate Overtime Found",
            html: `
            <p><b>${
              row.name
            }</b> already has an overtime record for <b>${selectedDay.toDateString()}</b>.</p>
            <p><b>Existing Record:</b><br>
              Shift: ${duplicate.shift}<br>
              In: ${duplicate.intime} | Out: ${duplicate.outtime}<br>
              Reason: ${duplicate.reason}<br>
              Normal OT: ${duplicate.normalot} | Double OT: ${
              duplicate.doubleot
            }
            </p>
            <hr>
            <p><b>New Record:</b><br>
              Shift: ${row.shift}<br>
              In: ${row.intime} | Out: ${row.outtime}<br>
              Reason: ${row.reason}<br>
              Normal OT: ${row.normalot} | Double OT: ${row.doubleot}
            </p>
            <p class="mt-3 text-gray-600">Do you want to <b>update</b> the existing record?</p>
          `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Update",
            cancelButtonText: "Cancel",
            width: 600,
          });

          if (updateConfirm.isConfirmed) {
            await updateOvertime(duplicate._id, payload);
            toast.success(`Updated overtime for ${row.name}`);
          } else {
            toast(`Skipped updating ${row.name}`);
          }
        } else {
          await addOvertime(payload);
          toast.success(`Added overtime for ${row.name}`);
        }
      }

      toast.success("All overtime entries processed successfully!");
      setRows([]);
      fetchExisting();
    } catch (err) {
      console.error(err);
      toast.error("Failed to process overtime entries");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoading(true);

      const overtimeEntry = existingEntries.find((o) => o._id === id);

      if (newStatus === "Approved") {
        await approveOvertime(id, {
          approvedBy: profile?.username,
          entryId: id,
          action: "Status changed to Approved",
          details: { overtime: overtimeEntry },
        });
      } else if (newStatus === "Rejected") {
        await rejectOvertime(id, {
          approvedBy: profile?.username,
          entryId: id,
          action: "Status changed to Rejected",
          details: { overtime: overtimeEntry },
        });
      } else {
        // Other updates
        await updateOvertime(id, { status: newStatus });
      }

      toast.success(`Entry ${newStatus}`);

      await fetchExisting();
      await fetchWeeklyEntries();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    selectedRowIndex === null ||
    !profile?.isAdmin ||
    editableRows[selectedRowIndex]?.status === "Approved";

  return (
    <motion.div className="ml-64 p-8 relative bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Overtime Management
        </h1>
        <p className="text-gray-600">
          Manage employee overtime entries and tracking
        </p>
      </div>

      {/* Week Navigation */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Week Selection
          </h2>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => changeWeek(-1)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              ← Previous Week
            </button>

            <h2 className="text-xl font-semibold text-gray-800">
              Week of{" "}
              {weekStart.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h2>

            <button
              onClick={() => changeWeek(1)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Next Week →
            </button>
          </div>

          <div className="flex gap-4 justify-center overflow-x-auto pb-2">
            {weekDays.map((d, i) => {
              const isSelected =
                selectedDay?.toDateString() === d.toDateString();
              const isToday = new Date().toDateString() === d.toDateString();

              // Count of entries for the day
              const dayEntriesCount = weeklyEntries.filter((e) => {
                const entryDate = new Date(e.date);

                const sameDay =
                  entryDate.toLocaleDateString("en-CA") ===
                  d.toLocaleDateString("en-CA");

                const isCompleted = ["Approved", "Rejected"].includes(e.status);

                return sameDay && isCompleted;
              }).length;

              const empCount = employees.length;

              let bgClass =
                "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400";

              if (dayEntriesCount === empCount && empCount > 0) {
                bgClass = "bg-green-100 border-green-400 text-green-800"; // full completion
              } else if (dayEntriesCount >= 0) {
                bgClass = "border-red-400";
              }

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(d)}
                  className={`px-6 py-3 rounded-lg border-2 font-medium transition-all duration-200 min-w-[120px] ${bgClass} 
          ${
            isSelected
              ? "bg-blue-500 border-blue-500 text-white shadow-md"
              : isToday
              ? "bg-yellow-100 border-yellow-400 text-yellow-800 shadow-sm"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          }
        `}
                >
                  <div className="text-sm font-semibold uppercase">
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-base">
                    {d.toLocaleDateString("en-US", { day: "numeric" })}
                  </div>

                  {/* Count indicator */}
                  <div className="flex justify-center mt-1 text-xs font-semibold text-gray-700 border-gray-500 border rounded-md">
                    {dayEntriesCount}/{empCount}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {profile?.isAdmin && selectedDay && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Overtime Entries for{" "}
                  {selectedDay.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {rows.length} entr{rows.length !== 1 ? "ies" : "y"} added
                </p>
              </div>
              <button
                onClick={addRow}
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <FaPlus className="text-sm" /> Add Row
              </button>
            </div>
          </div>

          <div className="p-6">
            {rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-50">
                    <tr>
                      <Th>Employee</Th>
                      <Th>Shift</Th>
                      <Th>In Time</Th>
                      <Th>Out Time</Th>
                      <Th>Reason</Th>
                      <Th>Normal OT</Th>
                      <Th>Double OT</Th>
                      <Th>Triple OT</Th>
                      <Th>Night</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/50">
                        <Td>
                          <select
                            value={row.employeeNumber}
                            onChange={(e) =>
                              handleRowChange(
                                i,
                                "employeeNumber",
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Employee</option>
                            {employees.map((emp) => (
                              <option
                                key={emp._id}
                                value={emp.employeeNumber}
                              >{`${emp.employeeNumber} - ${emp.name}`}</option>
                            ))}
                          </select>
                        </Td>
                        <Td>
                          <select
                            value={row.shift}
                            onChange={(e) =>
                              handleRowChange(i, "shift", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Shift</option>
                            <option value="6:30am">6:30am</option>
                            <option value="8:30am">8:30am</option>
                          </select>
                        </Td>
                        <Td>
                          <input
                            type="time"
                            value={row.intime}
                            onChange={(e) =>
                              handleRowChange(i, "intime", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </Td>
                        <Td>
                          <input
                            type="time"
                            value={row.outtime}
                            onChange={(e) =>
                              handleRowChange(i, "outtime", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </Td>
                        <Td>
                          <OvertimeReasonDropdown
                            value={row.reason}
                            onChange={(e) =>
                              handleRowChange(i, "reason", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </Td>
                        <Td className="text-center">{row.normalot}</Td>
                        <Td className="text-center">{row.doubleot}</Td>
                        <Td className="text-center">{row.tripleot}</Td>
                        <Td className="text-center">{row.night}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}

            {rows.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  <FaSave className="text-sm" />
                  {loading ? "Saving..." : "Save All Entries"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedDay && existingEntries.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Existing Overtime Entries for {selectedDay.toDateString()}
            </h2>
            <div className="flex gap-2">
              {editingRowIndex !== null ? (
                <>
                  <button
                    onClick={async () => {
                      const row = editableRows[selectedRowIndex];
                      if (!row) return;

                      const confirm = await Swal.fire({
                        title: `Delete Overtime for ${row.name}?`,
                        text: "This action cannot be undone.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Yes, delete it",
                        cancelButtonText: "Cancel",
                      });

                      if (confirm.isConfirmed) {
                        try {
                          setLoading(true);
                          await deleteOvertime(row._id);
                          toast.success(`Deleted overtime for ${row.name}`);
                          setSelectedRowIndex(null);
                          setEditingRowIndex(null);
                          fetchExisting();
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to delete overtime");
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    disabled={selectedRowIndex === null || loading}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      selectedRowIndex === null
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    Delete
                  </button>
                  <button
                    disabled={editingRowIndex === null}
                    onClick={handleSaveEditedRow}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg ml-2"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingRowIndex(null)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  disabled={isDisabled}
                  onClick={() => setEditingRowIndex(selectedRowIndex)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isDisabled
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-yellow-400 hover:bg-yellow-500 text-white"
                  }`}
                >
                  Edit Selected
                </button>
              )}
              <button
                onClick={() =>
                  toast.promise(fetchExisting(), {
                    loading: "Refreshing entries...",
                    success: "Overtime entries loaded!",
                    error: "Failed to refresh entries",
                  })
                }
                disabled={loading}
                className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-sm
    ${
      loading
        ? "bg-gray-400 text-white cursor-not-allowed"
        : "bg-blue-500 hover:bg-blue-600 text-white"
    }`}
              >
                Refresh
              </button>
            </div>
          </div>
          {loading ? (
            <InfoLoader text={"Loading entries."} />
          ) : (
            <div className="p-6 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Select</Th>
                    <Th>Employee</Th>
                    <Th>Shift</Th>
                    <Th>In Time</Th>
                    <Th>Out Time</Th>
                    <Th>Reason</Th>
                    <Th>Normal OT</Th>
                    <Th>Double OT</Th>
                    <Th>Triple OT</Th>
                    <Th>Night</Th>
                    <Th>Status</Th>
                    {profile?.canApprove && <Th>Actions</Th>}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {editableRows.map((row, i) => {
                    const isEditing = editingRowIndex === i;
                    return (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <Td>
                          <input
                            type="radio"
                            name="editRow"
                            checked={selectedRowIndex === i}
                            onChange={() => setSelectedRowIndex(i)}
                          />
                        </Td>

                        {/* Editable fields */}
                        <Td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) =>
                                handleEditableRowChange(
                                  i,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            row.name
                          )}
                        </Td>

                        <Td>
                          {isEditing ? (
                            <select
                              value={row.shift}
                              onChange={(e) =>
                                handleEditableRowChange(
                                  i,
                                  "shift",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="6:30am">6:30am</option>
                              <option value="8:30am">8:30am</option>
                            </select>
                          ) : (
                            row.shift
                          )}
                        </Td>

                        <Td>
                          {isEditing ? (
                            <input
                              type="time"
                              value={row.intime}
                              onChange={(e) =>
                                handleEditableRowChange(
                                  i,
                                  "intime",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            row.intime
                          )}
                        </Td>

                        <Td>
                          {isEditing ? (
                            <input
                              type="time"
                              value={row.outtime}
                              onChange={(e) =>
                                handleEditableRowChange(
                                  i,
                                  "outtime",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            row.outtime
                          )}
                        </Td>

                        <Td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.reason}
                              onChange={(e) =>
                                handleEditableRowChange(
                                  i,
                                  "reason",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                          ) : (
                            row.reason
                          )}
                        </Td>

                        <Td className="text-center">{row.normalot}</Td>
                        <Td className="text-center">{row.doubleot}</Td>
                        <Td className="text-center">{row.tripleot}</Td>
                        <Td className="text-center">{row.night}</Td>
                        {/* Status Display */}
                        <Td className="text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              row.status === "Approved"
                                ? "bg-green-100 text-green-700"
                                : row.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </Td>

                        {/* Approve / Reject Buttons */}
                        {profile?.canApprove && (
                          <Td className="text-center flex gap-2">
                            {profile?.canApprove &&
                              row.status !== "Approved" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(row._id, "Approved")
                                  }
                                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm"
                                >
                                  Approve
                                </button>
                              )}

                            {profile?.canApprove &&
                              row.status !== "Rejected" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(row._id, "Rejected")
                                  }
                                  disabled={
                                    !profile.canApprove ||
                                    row.status === "Approved"
                                  }
                                  className={`px-3 py-1 rounded-md text-sm text-white
                                    ${
                                      row.status === "Approved"
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-red-500 hover:bg-red-600"
                                    }`}
                                >
                                  Reject
                                </button>
                              )}
                          </Td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function getMonday(d) {
  d = new Date(d);
  const day = d.getDay(),
    diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getDayType(date) {
  const day = date.getDay();
  if (day === 0) return "sunday";
  if (day === 6) return "saturday";
  return "weekday";
}

function parseTime(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map((x) => Number(x));
  return h + m / 60;
}

function floorToQuarter(hours) {
  const quarters = Math.floor(hours * 4);
  return quarters / 4;
}

function Th({ children }) {
  return (
    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`p-4 ${className}`}>{children}</td>;
}

function EmptyState() {
  return (
    <div className="text-center py-12">
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">
        No overtime entries
      </h3>
      <p className="text-gray-500 mb-4">
        Click "Add Row" to start adding overtime entries for this day.
      </p>
    </div>
  );
}
