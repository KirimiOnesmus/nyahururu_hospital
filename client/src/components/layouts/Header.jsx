import React, { useState } from "react";
import logo from "../../assets/logo.png";
import { MdMenu } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("home");
  const navigate = useNavigate();

  const handleNavigate = (page, path) => {
    setActive(page);
    navigate(path);
    setIsOpen(false);
  };
  return (
    <div className=" px-6">
      <div className="flex gap-4 justify-center border-b py-2 items-center">
        <p className="text-blue-600 font-semibold border-r px-4">
          Toll Free Number: <span>+254712345678</span>
        </p>
        <button
          className="border-green-600 px-2 py-1 cursor-pointer rounded-lg
         bg-green-600 text-white font-semibold hover:bg-transparent hover:text-green-600"
        >
          Ambulance Services
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="logo flex items-center">
          <img src={logo} alt="LHS logo" className="w-20 h-20" />
          <h3 className="text-2xl font-bold">N.C.R.H</h3>
        </div>
        <div className="links">
          <button className="md:hidden text-3xl cursor-pointer hover:text-blue-500">
            <MdMenu onClick={() => setIsOpen(!isOpen)} />
          </button>
          <ul
            className={`${
              isOpen ? "block" : "hidden"
            } absolute md:static top-24 right-10 w-76 max-h-svh md:w-auto bg-blue-400 md:bg-transparent
             md:flex space-y-4 md:space-y-0 md:space-x-6 p-4 md:p-0 rounded-md z-50 items-center`}
          >
            <li>
              <a
                href="#"
                onClick={() => handleNavigate("home", "/")}
                className={`font-semibold text-lg ${
                  active === "home"
                    ? "text-white md:text-blue-500"
                    : "hover:text-white md:hover:text-blue-500"
                }`}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href=""
                onClick={() => handleNavigate("about", "/about")}
                className={`font-semibold text-lg ${
                  active === "about"
                    ? "text-white md:text-blue-500"
                    : "hover:text-white md:hover:text-blue-500"
                }`}
              >
                About Us
              </a>
            </li>
            <li>
              <a
                href=""
                onClick={() => handleNavigate("services", "/services")}
                className={`font-semibold text-lg ${
                  active === "services"
                    ? "text-white md:text-blue-500"
                    : "hover:text-white md:hover:text-blue-500"
                }`}
              >
                Our Services
              </a>
            </li>
            <li>
              <a
                href=""
                onClick={() => handleNavigate("doctors", "/doctors")}
                className={`font-semibold text-lg ${
                  active === "doctors"
                    ? "text-white md:text-blue-500"
                    : "hover:text-white md:hover:text-blue-500"
                }`}
              >
                Our Doctors
              </a>
            </li>
            <li className="relative group">
              <a
                href="#"
                // onClick={() => handleNavigate("contact", "/contact")}
                className={`font-semibold text-lg ${
                  active === "contact"
                    ? "text-white md:text-blue-500"
                    : "hover:text-white md:hover:text-blue-500"
                }`}
              >
                Contact Us
              </a>
              <ul
                className="absolute right-70 top-2 md:top-4 md:right-2 mt-2 w-56 bg-white shadow-lg rounded-lg opacity-0 
              group-hover:opacity-100 group-hover:visible invisible transition-all
               duration-300 ease-in-out delay-300 group-hover:delay-0 z-50"
              >
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() =>
                      handleNavigate("patient-feedback", "/feedback")
                    }
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    Patient Feedback
                  </a>
                </li>
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() =>
                      handleNavigate("report-fraud", "/report-fraud")
                    }
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    Report Fraud
                  </a>
                </li>
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() => handleNavigate("ask-doctor", "/ask-doctor")}
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    Ask Doctor
                  </a>
                </li>
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() =>
                      handleNavigate("book-appointment", "/book-appointment")
                    }
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    Book Appointment
                  </a>
                </li>
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() =>
                      handleNavigate("virtual-tour", "/virtual-tour")
                    }
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    Virtual Tour
                  </a>
                </li>
              </ul>
            </li>
            <li className="text-center  py-1 rounded-lg hover:cursor-pointer md:px-2 bg-green-500 text-white hover:bg-green-600">
              <a href="" className="text-md font-semibold ">
                Donations
              </a>
            </li>
            <li
              className="text-center py-1 rounded-lg hover:cursor-pointer md:px-2
             bg-green-500 text-white hover:bg-green-600 relative group"
            >
              <a href="" className="text-md font-semibold ">
                Staff Portal
              </a>
              <ul
                className="absolute right-70 md:right-2 top-0 md:top-8 mt-2 w-56 bg-white shadow-lg rounded-lg opacity-0 
              group-hover:opacity-100 group-hover:visible invisible transition-all
               duration-300 ease-in-out delay-300 group-hover:delay-0 z-50"
              >
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() =>
                      handleNavigate("patient-feedback", "/feedback")
                    }
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    IPC Login
                  </a>
                </li>
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() =>
                      handleNavigate("report-fraud", "/report-fraud")
                    }
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    Staff Email
                  </a>
                </li>
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() => handleNavigate("ask-doctor", "/ask-doctor")}
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    HMIS
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
