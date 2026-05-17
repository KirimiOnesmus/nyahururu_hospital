import React from "react";
import { LoginForm } from "../components/layouts";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const Hmis = () => {
  const navigate = useNavigate();
  return (
    <div>
      <div>
        <LoginForm />
      </div>
      <div className="
      absolute right-4 bottom-4 text-4xl bg-blue-600 p-2 text-white rounded-full
       cursor-pointer hover:text-blue-600 hover:bg-transparent
       border border-blue-500 transition-all duration-300
       ">
        <FaHome   onClick={() => navigate("/")}/>
      </div>
    </div>
  );
};

export default Hmis;
