import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {  GeneralDashboard } from "../layouts";
import SuperAdmin from "./SuperAdmin";

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
        "research",
        "blood_donation",
      ].includes(storedRole)
    ) {
      navigate("/");
    } else {
      setRole(storedRole);
    }
  }, [navigate]);

  useEffect(() => {
    if (localStorage.getItem("role") === "blood_donation") {
      navigate("/dashboard/donations", { replace: true });
    }
  }, [navigate]);

  if (!role) return null; 

  return (
    <div>{role === "superadmin" ? <SuperAdmin /> : <GeneralDashboard />}</div>
  );
};

export default Dashboard;
