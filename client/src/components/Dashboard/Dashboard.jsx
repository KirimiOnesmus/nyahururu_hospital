import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {  GeneralDashboard } from "../layouts";

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");

    if (
      !storedRole ||
      ![
        "admin",
        "it",
        "communication",
        "doctor",
        "staff",
        "superadmin",
        "research"
      ].includes(storedRole)
    ) {
      navigate("/");
    } else {
      setRole(storedRole);
    }
  }, [navigate]);

  if (!role) return null; 

  return (
    <div>{role === "superadmin" ? <SuperAdmin /> : <GeneralDashboard />}</div>
  );
};

export default Dashboard;
