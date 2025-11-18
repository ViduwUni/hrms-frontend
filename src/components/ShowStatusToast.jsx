import toast from "react-hot-toast";

let activeToast = null;

export const showStatusToast = (message, type = "success") => {
  if (activeToast) {
    toast.dismiss(activeToast);
  }

  activeToast = toast[type](message, {
    id: "ot-status-toast",
    duration: 3000,
    // style: {
    //   background: "#1f2937",
    //   color: "#fff",
    //   borderRadius: "8px",
    //   padding: "12px 16px",
    //   fontSize: "14px",
    // },
  });
};
