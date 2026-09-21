import { useState, useCallback } from "react";
import api from "../../api/axios";
import notify from "../utils/notify";


const useFetch = (endpoint, opts = {}) => {
  const { errorMsg = "Failed to fetch data", transform } = opts;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint);
      const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
      setData(transform ? transform(raw) : raw);
    } catch (err) {
      notify.error(err.response?.data?.message || errorMsg);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, errorMsg, transform]);

  return { data, setData, loading, fetch };
};

export default useFetch;
