import React, { useState } from "react";
import logo from "../../assets/logo.png";
import { MdMenu } from "react-icons/md";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("home");
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="logo flex items-center">
          <img src={logo} alt="LHS logo" className="w-24 h-24" />
          <h3 className="text-2xl font-bold">N.C.R.H</h3>
        </div>
        <div className="links">
          <button className="md:hidden text-3xl cursor-pointer hover:text-blue-500">
            <MdMenu onClick={() => setIsOpen(!isOpen)} />
          </button>
          <ul
            className={`${
              isOpen ? "block" : "hidden"
            } absolute md:static top-18 right-10 w-76 max-h-svh md:w-auto bg-blue-400 md:bg-transparent md:flex space-y-4 md:space-y-0 md:space-x-6 p-4 md:p-0 rounded-md`}
          >
            <li>
              <a
                href="#"
                onClick={() => setActive("home")}
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
                onClick={() => setActive("about")}
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
               onClick={() => setActive("services")}
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
                onClick={() => setActive("doctors")}
                className={`font-semibold text-lg ${
                  active === "doctors"
                    ? "text-white md:text-blue-500"
                    : "hover:text-white md:hover:text-blue-500"
                }`}
              >
                Our Doctors
              </a>
            </li>
            <li>
              <a
                href=""
                onClick={() => setActive("contact")}
                className={`font-semibold text-lg ${
                  active === "contact"
                    ? "text-white md:text-blue-500"
                    : "hover:text-white md:hover:text-blue-500"
                }`}
              >
                Contact Us
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
