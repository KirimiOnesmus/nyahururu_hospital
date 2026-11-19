import React from "react";
import { FaUser } from "react-icons/fa";

const Management = () => {
  const team = [
    {
      name: "Dr Lawrence Kamande",
      role: "Chief Executive Officer",
    },
    {
      name: "Mr. Ireri",
      role: "Hospital Administrator",
    },
  ];
  return (
    <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
      {team.map((member) => (
        <article key={member.name} className="text-center">
          <div
            role="img"
            aria-label="Neutral profile placeholder"
            className="w-full h-64 sm:h-72 bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <div className="w-36 h-36 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <FaUser aria-hidden="true" className="text-6xl text-slate-400 dark:text-slate-500" />
            </div>
          </div>
          <div className="pt-4 space-y-2">
            <h4 className="text-lg font-bold text-blue-700 dark:text-blue-300">{member.name}</h4>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{member.role}</p>
          </div>
        </article>
      ))}
    </div>
  );
};

export default Management;
