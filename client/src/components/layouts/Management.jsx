import React from "react";
import CEO from "../../assets/Management/CEO.jpg";
import Clinical_Service from "../../assets/Management/HOD Clinal Services.jpg";
import Nursing from "../../assets/Management/HOD Nursing.jpg";
import HR from "../../assets/Management/Human Resource.jpg";

const Management = () => {
  const team = [
    {
      name: "Mr. David Kimani",
      role: "Chief Executive Officer",
      image: CEO,
      bio: "Leading NCRH with a vision for patient-centered healthcare and innovation.",
    },
    {
      name: "Dr. Jane Mwangi ",
      role: "Chief Medical Officer",
      image: Clinical_Service,
      bio: "Dedicated to advancing clinical care, research, and medical excellence.",
    },
    {
      name: "Ms. Grace Wanjiru",
      role: "Human Resource/ Director of Operations",
      image: HR,
      bio: "Oversees hospital operations, ensuring smooth service delivery and efficiency.",
    },
    {
      name: "Dr. Peter Ndegwa",
      role: "Head of Nursing Services",
      image: Nursing,
      bio: "Provides leadership in nursing practice, patient care, and professional development of the nursing team.",
    },
  ];
  return (
    <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-4">
      {team.map((member, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
        >
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-64 object-fit md:object-cover"
          />
          <div className="p-4 space-y-2">
            <h4 className="text-xl font-bold text-blue-600">{member.name}</h4>
            <p className="text-sm font-semibold text-gray-600">{member.role}</p>
            {/* <p className="text-sm text-gray-700">{member.bio}</p> */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Management;
