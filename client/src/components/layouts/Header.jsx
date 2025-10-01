import React, { useState } from "react";
import logo from "../../assets/logo.png";
import { MdMenu } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [contactOpen, setContactOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (page, path) => {
    setActive(page);
    navigate(path);
    setIsOpen(false);
    setContactOpen(false);
    setStaffOpen(false);
    setDonationOpen(false);
  };
  return (
    <div className=" px-6">
      <div className="flex gap-4 justify-center border-b py-2 items-center">
        <p className="text-blue-600 font-semibold border-r px-4">
          Toll Free Number: <span>+254712345678</span>
        </p>
        <button
          className="border-green-600 px-2 py-1 sm:text-sm cursor-pointer rounded-lg
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
            <li
              className="relative group md:cursor-pointer"
              onClick={() => setContactOpen(!contactOpen)}
            >
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
                className={`absolute md:top-6 md:right-2 mt-2 w-56 bg-white shadow-lg rounded-lg transition-all duration-300 ease-in-out z-50
                ${contactOpen ? "block" : "hidden"} 
                md:group-hover:block md:hidden`}
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
                      handleNavigate("book-appointment", "/appointment")
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
            <li
              className="relative group md:cursor-pointer bg-green-500 px-2 py-1 rounded-lg hover:bg-green-600 text-center"
              onClick={() => setDonationOpen(!donationOpen)}
            >
              <a href="" className="text-md font-semibold text-white">
                Donations
              </a>
              <ul
                className={`absolute md:top-8 md:right-2 mt-2 w-56 bg-white shadow-lg rounded-lg transition-all duration-300 ease-in-out z-50
                ${staffOpen ? "block" : "hidden"} 
                md:group-hover:block md:hidden`}
              >
                <li>
                  <a
                    href="#"
                    onClick={() =>
                      handleNavigate("blood-donation", "/blood-donation")
                    }
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    Blood Donation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() =>
                      handleNavigate("/financial-aid", "/financial-aid")
                    }
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    Financial Aid
                  </a>
                </li>
              </ul>
            </li>
            <li
              className="relative group md:cursor-pointer bg-green-500 px-2 py-1 rounded-lg hover:bg-green-600 text-center"
              onClick={() => setStaffOpen(!staffOpen)}
            >
              <a href="" className="text-md font-semibold text-white ">
                Staff Portal
              </a>
              <ul
                className={`absolute md:top-8 md:right-2 mt-2 w-56 bg-white shadow-lg rounded-lg transition-all duration-300 ease-in-out z-50
                ${staffOpen ? "block" : "hidden"} 
                md:group-hover:block md:hidden`}
              >
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() => handleNavigate("ipc-login", "/ipc-login")}
                    className="block px-4 py-2 hover:bg-blue-100 text-gray-700 hover:font-semibold"
                  >
                    IPC Login
                  </a>
                </li>
                <li>
                  {" "}
                  <a
                    href="#"
                    onClick={() => handleNavigate("hmis", "/hmis")}
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
