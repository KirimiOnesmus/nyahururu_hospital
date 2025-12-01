import React, { useState } from "react";
import { Header, Footer, Slider, Management } from "../components/layouts";
import { 
  FaHistory, 
  FaBullseye, 
  FaEye, 
  FaChartLine, 
  FaSitemap, 
  FaUsers,
  FaBars,
  FaTimes 
} from "react-icons/fa";

const About = () => {
  const [activeSection, setActiveSection] = useState("about");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "about", label: "About Us - History", icon: FaHistory },
    { id: "mission", label: "Our Mission", icon: FaBullseye },
    { id: "vision", label: "Our Vision", icon: FaEye },
    { id: "strategy", label: "Strategic Plan", icon: FaChartLine },
    { id: "org-structure", label: "Management Team", icon: FaSitemap },
    { id: "board", label: "Board of Management", icon: FaUsers },
  ];

  const handleMenuClick = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <div className="body flex-grow relative">
    
        <div className="slider">
          <Slider />
        </div>

        <div className="flex relative">
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden fixed bottom-10 left-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>


          <aside
            className={`fixed md:sticky top-20 left-0 h-screen md:h-auto bg-white shadow-lg md:shadow-none z-30 transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 w-64 md:w-72 overflow-y-auto`}
          >
            <div className="px-4 md:p-6 pt-14 md:pt-8 space-y-2">
              
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                      activeSection === item.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    <Icon className="text-lg flex-shrink-0" />
                    <span className=" font-light md:font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

         
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          
          <main className="flex-1 px-6 md:px-12 py-8 max-w-5xl min-h-screen">
            
            {activeSection === "about" && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-xl shadow-md p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <FaHistory className="text-3xl text-blue-600" />
                    <h2 className="text-3xl font-bold text-gray-900">About Us - History</h2>
                  </div>
                  <div className="space-y-4 text-gray-700 leading-relaxed">
                    <p className="text-lg">
                      Nyahururu County Referral Hospital has been a cornerstone of healthcare excellence 
                      in our community for over [X] years. Founded in [Year], our institution has grown 
                      from a small clinic to a comprehensive medical facility serving thousands of 
                      patients annually.
                    </p>
                    <p className="text-lg">
                      Throughout our history, we have remained committed to providing accessible, 
                      high-quality healthcare to all members of our community, regardless of their 
                      background or circumstances. Our journey has been marked by continuous innovation, 
                      expansion of services, and unwavering dedication to patient care.
                    </p>
                    <p className="text-lg">
                      Today, we stand as a leading healthcare provider, equipped with modern facilities, 
                      advanced medical technology, and a team of highly skilled professionals dedicated 
                      to improving health outcomes and enhancing the quality of life for our patients.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mission Section */}
            {activeSection === "mission" && (
              <div className="animate-fadeIn">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-8 border-l-4 border-blue-600">
                  <div className="flex items-center gap-3 mb-6">
                    <FaBullseye className="text-3xl text-blue-600" />
                    <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
                  </div>
                  <p className="text-lg text-gray-800 leading-relaxed">
                    Our mission is to provide exceptional healthcare services with compassion, 
                    integrity, and respect. We are dedicated to improving the health and well-being 
                    of the community through innovative medical practices and personalized care. 
                    Every patient deserves to receive the highest standard of medical attention in 
                    a welcoming and supportive environment.
                  </p>
                </div>
              </div>
            )}

            {/* Vision Section */}
            {activeSection === "vision" && (
              <div className="animate-fadeIn">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-8 border-l-4 border-purple-600">
                  <div className="flex items-center gap-3 mb-6">
                    <FaEye className="text-3xl text-purple-600" />
                    <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
                  </div>
                  <p className="text-lg text-gray-800 leading-relaxed">
                    Our vision is to be a leading healthcare provider recognized for excellence in 
                    patient care, medical innovation, and community engagement. We strive to create 
                    a healthier future for all by setting new standards in healthcare delivery, 
                    fostering medical research, and building strong partnerships with our community.
                  </p>
                </div>
              </div>
            )}

            {/* Strategic Plan Section */}
            {activeSection === "strategy" && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-xl shadow-md p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <FaChartLine className="text-3xl text-green-600" />
                    <h2 className="text-3xl font-bold text-gray-900">Strategic Plan</h2>
                  </div>
                  <div className="space-y-6">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      Our strategic plan focuses on enhancing patient experience, expanding our 
                      services, and fostering a culture of continuous improvement. We aim to achieve 
                      these goals through strategic investment in technology, infrastructure, and our 
                      dedicated team of healthcare professionals.
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-green-50 p-5 rounded-lg border-l-4 border-green-600">
                        <h4 className="font-bold text-gray-900 mb-2">Patient-Centered Care</h4>
                        <p className="text-sm text-gray-700">
                          Implementing comprehensive programs to improve patient satisfaction and outcomes.
                        </p>
                      </div>
                      <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-600">
                        <h4 className="font-bold text-gray-900 mb-2">Technology Integration</h4>
                        <p className="text-sm text-gray-700">
                          Adopting cutting-edge medical technology and digital health solutions.
                        </p>
                      </div>
                      <div className="bg-purple-50 p-5 rounded-lg border-l-4 border-purple-600">
                        <h4 className="font-bold text-gray-900 mb-2">Workforce Development</h4>
                        <p className="text-sm text-gray-700">
                          Investing in training and professional development for our staff.
                        </p>
                      </div>
                      <div className="bg-orange-50 p-5 rounded-lg border-l-4 border-orange-600">
                        <h4 className="font-bold text-gray-900 mb-2">Community Partnerships</h4>
                        <p className="text-sm text-gray-700">
                          Building strong relationships with community organizations and stakeholders.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Management Team / Organizational Structure Section */}
            {activeSection === "org-structure" && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-xl shadow-md p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <FaSitemap className="text-3xl text-indigo-600" />
                    <h2 className="text-3xl font-bold text-gray-900">Management Team</h2>
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    Meet the passionate leaders driving our mission and vision forward with 
                    dedication and expertise.
                  </p>
                  
                  {/* Organizational Structure Diagram */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                      Organizational Structure
                    </h3>
                    <div className="flex flex-col items-center space-y-4">
                      {/* CEO/Director Level */}
                      <div className="bg-white rounded-lg shadow-md p-4 w-64 text-center border-2 border-indigo-600">
                        <p className="font-bold text-gray-900">Chief Executive Officer</p>
                        <p className="text-sm text-gray-600">Hospital Director</p>
                      </div>
                      
                      {/* Department Heads Level */}
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {[
                          "Medical Director",
                          "Nursing Director",
                          "Finance Director",
                          "Operations Director"
                        ].map((position, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg shadow p-3 w-48 text-center border border-indigo-400"
                          >
                            <p className="font-semibold text-sm text-gray-900">{position}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Management Team Cards */}
                  <div className="py-4">
                    <Management />
                  </div>
                </div>
              </div>
            )}

            {/* Board of Management Section */}
            {activeSection === "board" && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-xl shadow-md p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <FaUsers className="text-3xl text-blue-600" />
                    <h2 className="text-3xl font-bold text-gray-900">Board of Management</h2>
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    Our Board of Management provides strategic oversight and governance, ensuring 
                    that the hospital maintains the highest standards of care and operational excellence.
                  </p>
                  
                  {/* Board Members Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { name: "Dr. Jane Kimani", position: "Board Chairperson", specialty: "Healthcare Administration" },
                      { name: "Mr. Peter Mwangi", position: "Vice Chairperson", specialty: "Finance & Governance" },
                      { name: "Dr. Sarah Odhiambo", position: "Board Member", specialty: "Medical Ethics" },
                      { name: "Ms. Grace Wanjiru", position: "Board Member", specialty: "Legal Affairs" },
                      { name: "Mr. James Mutua", position: "Board Member", specialty: "Community Relations" },
                      { name: "Dr. David Otieno", position: "Board Member", specialty: "Public Health" },
                    ].map((member, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                      >
                        <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <FaUsers className="text-3xl text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-center mb-1">{member.name}</h4>
                        <p className="text-sm text-blue-600 font-semibold text-center mb-2">
                          {member.position}
                        </p>
                        <p className="text-xs text-gray-600 text-center">{member.specialty}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <div className="">
        <Footer />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default About;



