import React from "react";
import logo from "../../assets/logo.png";
import { MdFacebook, MdEmail, MdLocationOn } from "react-icons/md";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FaPhoneAlt } from "react-icons/fa";
import { AiFillInstagram } from "react-icons/ai";

const Footer = () => {
  return (
    <div>
      <div className="md:flex md:justify-between py-4 md:space-y-0 space-y-4">
        <img src={logo} alt="LHS logo" className="h-32" />
        <div className="">
          <h3 className="text-lg font-semibold pb-4">Get in Touch With Us</h3>
          <div>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <FaPhoneAlt className="text-lg text-blue-500" />{" "}
                <span className="hover:text-blue-500 hover:cursor-pointer transition-all duration-300">0712345678</span>
              </li>
              <li className="flex items-center space-x-2">
                <MdEmail className="text-lg text-blue-500" />{" "}
                <span className="hover:text-blue-500 hover:cursor-pointer transition-all duration-300">nyahururuhospital@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <MdLocationOn className="text-lg text-blue-500" />{" "}
                <span className="hover:text-blue-500 hover:cursor-pointer transition-all duration-300">Along Nyahururu-Nakuru Road</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="links ">
          <h3 className="text-lg font-semibold pb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <a href="" className="hover:text-blue-500 hover:cursor-pointer transition-all duration-300">Give us your Feedback</a>
            </li>
            <li>
              <a href="" className="hover:text-blue-500 hover:cursor-pointer transition-all duration-300">Report Fraud</a>
            </li>
            <li>
              <a href="" className="hover:text-blue-500 hover:cursor-pointer transition-all duration-300">News</a>
            </li>
            <li>
              <a href="" className="hover:text-blue-500 hover:cursor-pointer transition-all duration-300">Events</a>
            </li>
            <li>
              <a href="" className="hover:text-blue-500 hover:cursor-pointer transition-all duration-300">Blogs</a>
            </li>
            <li>
              <a href="" className="hover:text-blue-500 hover:cursor-pointer transition-all duration-300">Downloads</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex justify-between items-center my-2 border-t border-gray-400 p-2">
        <p><span> &copy;{new Date().getFullYear()}</span> Nyahururu Hospital. All right reserved.</p>
        <div className="socials">
          <ul className="flex text-2xl space-x-3">
            <li className="text-blue-500 cursor-pointer">
              <MdFacebook />
            </li>
            <li className="text-black cursor-pointer">
              <FaSquareXTwitter />
            </li>
            <li className="text-pink-500 cursor-pointer">
              <AiFillInstagram />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Footer;
