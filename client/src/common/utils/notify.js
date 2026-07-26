import { toast } from "react-toastify";

const defaults = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
};

const notify = {
  success: (msg, opts) => toast.success(msg, { ...defaults, ...opts }),
  error: (msg, opts) => toast.error(msg, { ...defaults, ...opts }),
  warning: (msg, opts) => toast.warning(msg, { ...defaults, ...opts }),
  info: (msg, opts) => toast.info(msg, { ...defaults, ...opts }),
};

export default notify;
