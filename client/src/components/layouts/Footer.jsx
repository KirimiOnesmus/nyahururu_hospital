import React from "react";
import logo from "../../assets/logo.png";
import { MdFacebook, MdEmail, MdLocationOn } from "react-icons/md";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FaPhoneAlt } from "react-icons/fa";
import { AiFillInstagram } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Give us your Feedback", path: "/feedback" },
    { label: "Report Fraud", path: "/report-fraud" },
    { label: "Events", path: "/events" },
    { label: "Careers", path: "/careers" },
    { label: "Tenders", path: "/tenders" },
    { label: "Downloads", path: "/downloads" },
  ];

  const contactInfo = [
    { icon: FaPhoneAlt, label: "0712345678", type: "phone" },
    { icon: MdEmail, label: "nyahururuhospital@gmail.com", type: "email" },
    { icon: MdLocationOn, label: "Along Nyahururu-Nakuru Road", type: "location" },
  ];

  const socialLinks = [
    { icon: MdFacebook, color: "text-blue-600", label: "Facebook", url: "#" },
    { icon: FaSquareXTwitter, color: "text-black", label: "Twitter", url: "#" },
    { icon: AiFillInstagram, color: "text-pink-500", label: "Instagram", url: "#" },
  ];
  
  const externalLinks = [
    {
      label: "Ministry of Health",
      path: "https://www.health.go.ke/"
    },
    {
      label: "Laikipia County Government",
      path: "https://laikipia.go.ke/"
    },
    {
      label: "Social Health Authority",
      path: "https://sha.go.ke/"
    },
    {
      label: "Kenya Medical Training College",
      path: "https://kmtc.ac.ke/"
    }
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
    
          <div className="flex flex-col items-center md:items-start">
            <img src={logo} alt="Nyahururu Hospital logo" className="h-24 mb-4" />
            <p className="text-sm text-gray-600 text-center md:text-left">
              Providing quality healthcare services to our community
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              {contactInfo.map((info, idx) => {
                const Icon = info.icon;
                return (
                  <li key={idx} className="flex items-start space-x-3 group">
                    <Icon className="text-blue-600 text-lg flex-shrink-0 mt-1" />
                    <span className="text-gray-700 text-sm group-hover:text-blue-600 transition-colors duration-300 cursor-pointer">
                      {info.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex space-x-4 pt-3">
              {socialLinks.map((social, idx) => {
                const Icon = social.icon;
                return (
                  <a
                    key={idx}
                    href={social.url}
                    aria-label={social.label}
                    className={`${social.color} text-2xl hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-gray-700 text-sm hover:text-blue-600 transition-colors duration-300 font-medium"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">External Links</h3>
            <ul className="space-y-2">
              {externalLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 text-sm hover:text-blue-600 transition-colors duration-300 font-medium"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-300"></div>

        <div className="py-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-gray-600 text-sm">
            &copy; {currentYear} Nyahururu Hospital. All rights reserved.
          </p>
          <a
            href="https://onesmuskirimi.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:text-blue-800 transition-colors duration-300 font-medium"
          >
            Design & Development by Onesmus Kirimi - ITR Limited
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;