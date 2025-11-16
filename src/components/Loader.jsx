// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

export default function Loader({ size = 50, color = "#3b82f6" }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/50 z-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <FaSpinner size={size} color={color} />
      </motion.div>
    </div>
  );
}
