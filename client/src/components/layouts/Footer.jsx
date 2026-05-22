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
    { label: "Careers", path: "/careers" },
    { label: "Tenders", path: "/tenders" },
    { label: "Downloads", path: "/downloads" },
    { label: "Research", path: "/research" },
  ];

  const contactInfo = [
    { icon: FaPhoneAlt, label: "0712 345 678", type: "phone" },
    { icon: MdEmail, label: "nyahururuhospital@gmail.com", type: "email" },
    { icon: MdLocationOn, label: "Along Nyahururu–Nakuru Road", type: "location" },
  ];

  const socialLinks = [
    { icon: MdFacebook, label: "Facebook", url: "#" },
    { icon: FaSquareXTwitter, label: "Twitter", url: "#" },
    { icon: AiFillInstagram, label: "Instagram", url: "#" },
  ];

  const externalLinks = [
    { label: "Ministry of Health", path: "https://www.health.go.ke/" },
    { label: "Laikipia County Government", path: "https://laikipia.go.ke/" },
    { label: "Social Health Authority", path: "https://sha.go.ke/" },
    { label: "Kenya Medical Training College", path: "https://kmtc.ac.ke/" },
  ];

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 py-12">

       
          <div className="flex flex-col items-start gap-3">
            <img src={logo} alt="Nyahururu Hospital logo" className="h-16" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Providing quality healthcare services to our community.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 pt-1">
              {socialLinks.map(({ icon: Icon, label, url }) => (
                <a
                  key={label}
                  href={url}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all duration-150"
                >
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Get in Touch
            </p>
            <ul className="space-y-3">
              {contactInfo.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon className="text-blue-500 text-sm shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-600 leading-relaxed">{label}</span>
                </li>
              ))}
            </ul>
          </div>

      
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Quick Links
            </p>
            <ul className="space-y-2">
              {quickLinks.map(({ label, path }) => (
                <li key={label}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-xs text-slate-600 hover:text-blue-600 transition-colors duration-150 font-medium"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

     
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              External Links
            </p>
            <ul className="space-y-2">
              {externalLinks.map(({ label, path }) => (
                <li key={label}>
                  <a
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-600 hover:text-blue-600 transition-colors duration-150 font-medium"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

      
        <div className="border-t border-slate-100 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-400">
            &copy; {currentYear} Nyahururu Hospital. All rights reserved.
          </p>
          <a
            href="https://onesmuskirimi.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-700 transition-colors duration-150 font-medium"
          >
            Design &amp; Development by Onesmus Kirimi – ITR Limited
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;