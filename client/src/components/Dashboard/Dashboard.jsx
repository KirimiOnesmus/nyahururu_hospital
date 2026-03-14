import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdmin, GeneralDashboard } from "../layouts";

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (
      !token ||
      !storedRole ||
      ![
        "admin",
        "it",
        "communication",
        "doctor",
        "staff",
        "superadmin",
      ].includes(storedRole)
    ) {
      navigate("/");
    } else {
      setRole(storedRole); // store role in state
    }
  }, [navigate]);

  if (!role) return null; // or a loading spinner while checking role

  return (
    <div>{role === "superadmin" ? <SuperAdmin /> : <GeneralDashboard />}</div>
  );
};

export default Dashboard;
