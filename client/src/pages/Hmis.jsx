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
        className="fixed right-4 z-[110] min-w-12 min-h-12 bg-primary text-white rounded-full
         inline-flex items-center justify-center hover:bg-primary-hover"
        style={{ right: "max(1rem, env(safe-area-inset-right, 0px))", bottom: "calc(max(1rem, env(safe-area-inset-bottom, 0px)) + 3.75rem)" }}
      >
        <IconHome className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Hmis;
