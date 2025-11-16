import { useEffect, useState } from "react";
import { fetchOvertimeReasons } from "../api/overtimeReasonApi";

export default function OvertimeReasonDropdown({
  value = "",
  onChange = () => {},
  style = {},
  className = "",
}) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    fetchOvertimeReasons().then((res) => {
      setOptions(res.data);
    });
  }, []);

  return (
    <select
      value={value}
      onChange={onChange}
      style={style}
      className={className}
    >
      <option value="">Select Overtime Reason</option>
      {options.map((o) => (
        <option key={o._id} value={o.option}>
          {o.option}
        </option>
      ))}
    </select>
  );
}
