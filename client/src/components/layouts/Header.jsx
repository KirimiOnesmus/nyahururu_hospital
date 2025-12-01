import React, { useState, useRef, useEffect } from "react";
import logo from "../../assets/logo.png";
import { MdMenu, MdClose, MdOutlineArrowDropDown } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const [departmentsOpen, setDepartmentsOpen] = useState(false);
  const [divisions, setDivisions] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const BACKEND_URL = "http://localhost:5000";

  // Fetch divisions from backend on component mount
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setLoadingDivisions(true);
        const res = await api.get(`${BACKEND_URL}/api/services`);
       
        // Extract unique divisions from services
        const uniqueDivisions = [...new Set(
          res.data
            .map(s => s.division)
            .filter(Boolean) 
        )];
        
        // Sort alphabetically (Inpatient, Outpatient)
        setDivisions(uniqueDivisions.sort());
        console.log("Fetched divisions:", uniqueDivisions);
      } catch (error) {
        console.error("Failed to fetch divisions:", error);
        setDivisions([]);
      } finally {
        setLoadingDivisions(false);
      }
    };

    fetchDivisions();
  }, [BACKEND_URL]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setContactOpen(false);
        setDonationOpen(false);
        setDepartmentsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
    setContactOpen(false);
    setDonationOpen(false);
    setDepartmentsOpen(false);
  };

  // Navigate to services page with division filter
  const handleDivisionClick = (division) => {
    navigate(`/services?division=${encodeURIComponent(division)}`);
    setIsOpen(false);
    setDepartmentsOpen(false);
  };

  const toggleContact = () => {
    setContactOpen(!contactOpen);
    setDonationOpen(false);
    setDepartmentsOpen(false);
  };

  const toggleDonation = () => {
    setDonationOpen(!donationOpen);
    setContactOpen(false);
    setDepartmentsOpen(false);
  };

  const toggleDepartments = () => {
    setDepartmentsOpen(!departmentsOpen);
    setContactOpen(false);
    setDonationOpen(false);
  };

  const active = location.pathname;

  return (
    <div className="px-6" ref={dropdownRef}>
      <div className="flex gap-4 justify-center border-b border-gray-500 py-2 items-center flex-wrap">
        <p className="text-blue-600 font-semibold px-4">
       +254712345678
        </p>
        <a
          className=" px-2 py-1 text-md sm:text-sm cursor-pointer rounded-lg
         text-black font-semibold hover:text-green-600 transition-colors"
          onClick={() => handleNavigate("/ambulance-services")}
          target="_blank"
        >
          Ambulance Services
        </a>
      </div>
      <div className="flex items-center justify-between">
        <div className="logo flex items-center">
          <img src={logo} alt="LHS logo" className="w-20 h-20" />
          <h3 className="text-2xl font-bold">N.C.R.H</h3>
        </div>
        <div className="links">
          <button className="md:hidden text-3xl cursor-pointer hover:text-blue-500 transition-colors">
            {isOpen ? (
              <MdClose onClick={() => setIsOpen(!isOpen)} />
            ) : (
              <MdMenu onClick={() => setIsOpen(!isOpen)} />
            )}
          </button>
          <ul
            className={`${
              isOpen ? "block" : "hidden"
            } absolute md:static top-30 right-12 w-76 md:w-auto bg-blue-400 md:bg-transparent
             md:flex space-y-4 md:space-y-0 md:space-x-6 p-4 md:p-0 rounded-md z-40 items-center overflow-visible`}
          >
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate("/");
                }}
                className={`font-semibold text-lg cursor-pointer transition-colors ${
                  active === "/"
                    ? "text-white md:text-blue-500"
                    : "text-white md:text-gray-900 hover:text-white md:hover:text-blue-500"
                }`}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate("/about");
                }}
                className={`font-semibold text-lg cursor-pointer transition-colors ${
                  active === "/about"
                    ? "text-white md:text-blue-500"
                    : "text-white md:text-gray-900 hover:text-white md:hover:text-blue-500"
                }`}
              >
                About Us
              </a>
            </li>

            {/* Departments/Services Dropdown - FULLY DYNAMIC FROM BACKEND (BY DIVISION) */}
            <li className="relative md:w-auto">
              <button
                onClick={toggleDepartments}
                className={`font-semibold text-lg cursor-pointer transition-colors flex items-center gap-1 w-full md:w-auto justify-between md:justify-start ${
                  active === "/services"
                    ? "text-white md:text-blue-500"
                    : "text-white md:text-gray-900 hover:text-white md:hover:text-blue-500"
                }`}
              >
                Our Departments
                <MdOutlineArrowDropDown
                  className={`transition-transform duration-300 ${
                    departmentsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              {/* Dropdown Menu - Fixed positioning on mobile, absolute on desktop */}
              <ul
                className={`fixed md:absolute left-10 top-30 md:left-0 md:right-auto  md:top-10 md:mt-2 w-56 bg-blue-300 md:bg-white md:shadow-lg md:rounded-lg z-40 md:z-50
                  transition-all duration-300 ease-in-out md:origin-top
                  md:max-h-96 md:overflow-y-auto
                  ${
                    departmentsOpen
                      ? "opacity-100 visible scale-y-100"
                      : "opacity-0 invisible scale-y-95"
                  }
                  ${departmentsOpen ? "mt-0" : "-mt-96"}
                `}
                style={departmentsOpen ? {
                  top: "auto",
                  bottom: "0",
                  transform: "translateY(100%)"
                } : {}}
              >
                {loadingDivisions ? (
                  <li className="px-4 py-3 text-gray-500 text-sm text-center md:text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading departments...</span>
                  </li>
                ) : divisions.length === 0 ? (
                  <li className="px-4 py-3 text-white text-sm text-center md:text-gray-500">
                    No departments available
                  </li>
                ) : (
                  divisions.map((division) => (
                    <li key={division}>
                      <button
                        onClick={() => handleDivisionClick(division)}
                        className={`w-full text-left block px-4 py-3 cursor-pointer transition-colors
                          md:border-b md:border-gray-100 md:last:border-b-0
                          text-white md:text-gray-700 
                          hover:bg-blue-400 md:hover:bg-blue-100 
                          hover:font-semibold md:hover:font-semibold
                          ${
                            location.search.includes(encodeURIComponent(division))
                              ? "bg-blue-400 md:bg-blue-100 font-semibold"
                              : ""
                          }
                        `}
                      >
                        {division}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </li>

            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate("/doctors");
                }}
                className={`font-semibold text-lg cursor-pointer transition-colors ${
                  active === "/doctors"
                    ? "text-white md:text-blue-500"
                    : "text-white md:text-gray-900 hover:text-white md:hover:text-blue-500"
                }`}
              >
                Our Specialists
              </a>
            </li>

            {/* Contact Us Dropdown */}
            <li className="relative">
              <button
                onClick={toggleContact}
                className={`font-semibold text-lg cursor-pointer transition-colors flex items-center gap-1 ${
                  active === "/contact"
                    ? "text-white md:text-blue-500"
                    : "text-white md:text-gray-900 hover:text-white md:hover:text-blue-500"
                }`}
              >
                Contact Us
                <MdOutlineArrowDropDown
                  className={`transition-transform duration-300 ${contactOpen ? "rotate-180" : ""}`}
                />
              </button>
              
              {/* Contact Dropdown Menu */}
              <ul
                className={`absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg z-50
                  transition-all duration-300 ease-in-out origin-top
                  ${
                    contactOpen
                      ? "opacity-100 visible scale-y-100"
                      : "opacity-0 invisible scale-y-95"
                  }
                `}
              >
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/feedback");
                    }}
                    className={`block px-4 py-3 hover:bg-blue-100 text-gray-700 hover:font-semibold cursor-pointer transition-colors border-b border-gray-100
                      ${active === "/feedback" ? "bg-blue-100 font-semibold" : ""}
                    `}
                  >
                    Patient Feedback
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/report-fraud");
                    }}
                    className={`block px-4 py-3 hover:bg-blue-100 text-gray-700 hover:font-semibold cursor-pointer transition-colors border-b border-gray-100
                      ${active === "/report-fraud" ? "bg-blue-100 font-semibold" : ""}
                    `}
                  >
                    Report Fraud
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/ask-doctor");
                    }}
                    className={`block px-4 py-3 hover:bg-blue-100 text-gray-700 hover:font-semibold cursor-pointer transition-colors border-b border-gray-100
                      ${active === "/ask-doctor" ? "bg-blue-100 font-semibold" : ""}
                    `}
                  >
                    Ask Doctor
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/appointment");
                    }}
                    className={`block px-4 py-3 hover:bg-blue-100 text-gray-700 hover:font-semibold cursor-pointer transition-colors border-b border-gray-100
                      ${active === "/appointment" ? "bg-blue-100 font-semibold" : ""}
                    `}
                  >
                    Book Appointment
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/virtual-tour");
                    }}
                    className={`block px-4 py-3 hover:bg-blue-100 text-gray-700 hover:font-semibold cursor-pointer transition-colors
                      ${active === "/virtual-tour" ? "bg-blue-100 font-semibold" : ""}
                    `}
                  >
                    Virtual Tour
                  </a>
                </li>
              </ul>
            </li>

            {/* Donations Dropdown */}
            <li className="relative">
              <button
                onClick={toggleDonation}
                className="bg-green-500 px-2 py-1 rounded-lg hover:bg-green-600 text-center cursor-pointer w-full md:w-auto transition-colors flex items-center justify-center gap-1"
              >
                <span className="text-md font-semibold text-white">Donations</span>
                <MdOutlineArrowDropDown
                  className={`text-white transition-transform duration-300 ${donationOpen ? "rotate-180" : ""}`}
                />
              </button>
              
              {/* Donations Dropdown Menu */}
              <ul
                className={`absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg z-50
                  transition-all duration-300 ease-in-out origin-top
                  ${
                    donationOpen
                      ? "opacity-100 visible scale-y-100"
                      : "opacity-0 invisible scale-y-95"
                  }
                `}
              >
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/blood-donation");
                    }}
                    className={`block px-4 py-3 hover:bg-blue-100 text-gray-700 hover:font-semibold cursor-pointer transition-colors border-b border-gray-100
                      ${active === "/blood-donation" ? "bg-blue-100 font-semibold" : ""}
                    `}
                  >
                    Blood Donation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("/financial-aid");
                    }}
                    className={`block px-4 py-3 hover:bg-blue-100 text-gray-700 hover:font-semibold cursor-pointer transition-colors
                      ${active === "/financial-aid" ? "bg-blue-100 font-semibold" : ""}
                    `}
                  >
                    Financial Aid
                  </a>
                </li>
              </ul>
            </li>
            
            <button
              className="bg-green-500 px-2 py-1 rounded-lg hover:bg-green-600 text-center cursor-pointer text-white font-semibold transition-colors w-full md:w-auto"
              onClick={() => handleNavigate("/hmis")}
            >
              Log In
            </button>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;