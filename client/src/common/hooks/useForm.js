import { useState, useCallback } from "react";


const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);

  const setField = useCallback(
    (key, value) => setValues((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked, files } = e.target;
      setValues((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : type === "file" ? files?.[0] : value,
      }));
    },
    []
  );

  const reset = useCallback(
    (vals) => setValues(vals || initialValues),
    [initialValues]
  );

  return { values, setValues, setField, handleChange, reset };
};

export default useForm;
