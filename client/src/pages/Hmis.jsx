import React from "react";
import LoginForm from "../common/layouts/LoginForm";
import { IconHome } from "../common/icons";
import { useNavigate } from "react-router-dom";

const Hmis = () => {
  const navigate = useNavigate();
  return (
    <div className="relative">
      <LoginForm />
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="Back to home"
        className="absolute right-4 bottom-4 min-w-12 min-h-12 bg-primary text-white rounded-full
         inline-flex items-center justify-center hover:bg-primary-hover border border-primary"
      >
        <IconHome className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Hmis;
