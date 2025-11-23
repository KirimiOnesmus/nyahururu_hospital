const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userModel');
const Doctor = require('./models/doctorModel');
require('dotenv').config();

const connectDB = require('./config/db');

// Comprehensive list of clinics/specialties with doctor data
const clinicsData = [
  {
    speciality: "Emergency Medicine",
    doctors: [
      {
        firstName: "James",
        lastName: "Mwangi",
        email: "james.mwangi@ncrh.com",
        password: "Doctor123!",
        bio: "Senior Emergency Medicine Specialist with 15 years of experience in trauma care and critical emergency response.",
        education: "MBChB, MMed (Emergency Medicine), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "17:00" },
          { day: "Tuesday", startTime: "08:00", endTime: "17:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "17:00" },
          { day: "Thursday", startTime: "08:00", endTime: "17:00" },
          { day: "Friday", startTime: "08:00", endTime: "17:00" },
        ]
      },
      {
        firstName: "Sarah",
        lastName: "Kipchoge",
        email: "sarah.kipchoge@ncrh.com",
        password: "Doctor123!",
        bio: "Emergency Medicine Physician specializing in pediatric emergencies and acute care.",
        education: "MBChB, MMed (Emergency Medicine), Moi University",
        availability: [
          { day: "Monday", startTime: "14:00", endTime: "22:00" },
          { day: "Tuesday", startTime: "14:00", endTime: "22:00" },
          { day: "Wednesday", startTime: "14:00", endTime: "22:00" },
          { day: "Thursday", startTime: "14:00", endTime: "22:00" },
          { day: "Friday", startTime: "14:00", endTime: "22:00" },
        ]
      }
    ]
  },
  {
    speciality: "Internal Medicine",
    doctors: [
      {
        firstName: "David",
        lastName: "Ochieng",
        email: "david.ochieng@ncrh.com",
        password: "Doctor123!",
        bio: "Consultant Physician specializing in diabetes, hypertension, and chronic disease management.",
        education: "MBChB, MMed (Internal Medicine), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "09:00", endTime: "16:00" },
          { day: "Tuesday", startTime: "09:00", endTime: "16:00" },
          { day: "Wednesday", startTime: "09:00", endTime: "16:00" },
          { day: "Thursday", startTime: "09:00", endTime: "16:00" },
        ]
      },
      {
        firstName: "Grace",
        lastName: "Wanjiku",
        email: "grace.wanjiku@ncrh.com",
        password: "Doctor123!",
        bio: "Internal Medicine Specialist with expertise in infectious diseases and tropical medicine.",
        education: "MBChB, MMed (Internal Medicine), Kenyatta University",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "15:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "15:00" },
          { day: "Friday", startTime: "08:00", endTime: "15:00" },
        ]
      }
    ]
  },
  {
    speciality: "General Surgery",
    doctors: [
      {
        firstName: "Peter",
        lastName: "Kamau",
        email: "peter.kamau@ncrh.com",
        password: "Doctor123!",
        bio: "Consultant General Surgeon with expertise in laparoscopic and trauma surgery.",
        education: "MBChB, MMed (Surgery), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "17:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "17:00" },
          { day: "Friday", startTime: "08:00", endTime: "17:00" },
        ]
      },
      {
        firstName: "Mary",
        lastName: "Njeri",
        email: "mary.njeri@ncrh.com",
        password: "Doctor123!",
        bio: "General Surgeon specializing in gastrointestinal and abdominal surgeries.",
        education: "MBChB, MMed (Surgery), Moi University",
        availability: [
          { day: "Tuesday", startTime: "08:00", endTime: "17:00" },
          { day: "Thursday", startTime: "08:00", endTime: "17:00" },
        ]
      }
    ]
  },
  {
    speciality: "Obstetrics & Gynecology",
    doctors: [
      {
        firstName: "Lucy",
        lastName: "Achieng",
        email: "lucy.achieng@ncrh.com",
        password: "Doctor123!",
        bio: "Senior Obstetrician and Gynecologist with 20 years of experience in maternal and reproductive health.",
        education: "MBChB, MMed (Obstetrics & Gynecology), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "16:00" },
          { day: "Tuesday", startTime: "08:00", endTime: "16:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "16:00" },
          { day: "Thursday", startTime: "08:00", endTime: "16:00" },
        ]
      },
      {
        firstName: "Esther",
        lastName: "Mwende",
        email: "esther.mwende@ncrh.com",
        password: "Doctor123!",
        bio: "Gynecologist specializing in family planning, cervical cancer screening, and women's health.",
        education: "MBChB, MMed (Obstetrics & Gynecology), Kenyatta University",
        availability: [
          { day: "Monday", startTime: "09:00", endTime: "15:00" },
          { day: "Wednesday", startTime: "09:00", endTime: "15:00" },
          { day: "Friday", startTime: "09:00", endTime: "15:00" },
        ]
      }
    ]
  },
  {
    speciality: "Pediatrics",
    doctors: [
      {
        firstName: "John",
        lastName: "Onyango",
        email: "john.onyango@ncrh.com",
        password: "Doctor123!",
        bio: "Pediatrician specializing in child health, immunizations, and childhood diseases.",
        education: "MBChB, MMed (Pediatrics), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "16:00" },
          { day: "Tuesday", startTime: "08:00", endTime: "16:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "16:00" },
          { day: "Thursday", startTime: "08:00", endTime: "16:00" },
          { day: "Friday", startTime: "08:00", endTime: "16:00" },
        ]
      },
      {
        firstName: "Ruth",
        lastName: "Chebet",
        email: "ruth.chebet@ncrh.com",
        password: "Doctor123!",
        bio: "Pediatrician with expertise in neonatal care and childhood nutrition.",
        education: "MBChB, MMed (Pediatrics), Moi University",
        availability: [
          { day: "Monday", startTime: "09:00", endTime: "15:00" },
          { day: "Tuesday", startTime: "09:00", endTime: "15:00" },
          { day: "Thursday", startTime: "09:00", endTime: "15:00" },
        ]
      }
    ]
  },
  {
    speciality: "Nephrology",
    doctors: [
      {
        firstName: "Michael",
        lastName: "Kiprotich",
        email: "michael.kiprotich@ncrh.com",
        password: "Doctor123!",
        bio: "Nephrologist specializing in kidney diseases, dialysis, and renal care.",
        education: "MBChB, MMed (Internal Medicine), Fellowship in Nephrology",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "15:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "15:00" },
          { day: "Friday", startTime: "08:00", endTime: "15:00" },
        ]
      }
    ]
  },
  {
    speciality: "Orthopedics",
    doctors: [
      {
        firstName: "Robert",
        lastName: "Mutua",
        email: "robert.mutua@ncrh.com",
        password: "Doctor123!",
        bio: "Orthopedic Surgeon specializing in fractures, joint replacements, and trauma surgery.",
        education: "MBChB, MMed (Orthopedics), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "17:00" },
          { day: "Tuesday", startTime: "08:00", endTime: "17:00" },
          { day: "Thursday", startTime: "08:00", endTime: "17:00" },
        ]
      },
      {
        firstName: "Patricia",
        lastName: "Wambui",
        email: "patricia.wambui@ncrh.com",
        password: "Doctor123!",
        bio: "Orthopedic Specialist focusing on pediatric orthopedics and corrective surgery.",
        education: "MBChB, MMed (Orthopedics), Moi University",
        availability: [
          { day: "Wednesday", startTime: "08:00", endTime: "17:00" },
          { day: "Friday", startTime: "08:00", endTime: "17:00" },
        ]
      }
    ]
  },
  {
    speciality: "Cardiology",
    doctors: [
      {
        firstName: "Daniel",
        lastName: "Kipchoge",
        email: "daniel.kipchoge@ncrh.com",
        password: "Doctor123!",
        bio: "Cardiologist specializing in heart diseases, cardiac rehabilitation, and preventive cardiology.",
        education: "MBChB, MMed (Internal Medicine), Fellowship in Cardiology",
        availability: [
          { day: "Monday", startTime: "09:00", endTime: "16:00" },
          { day: "Tuesday", startTime: "09:00", endTime: "16:00" },
          { day: "Thursday", startTime: "09:00", endTime: "16:00" },
        ]
      }
    ]
  },
  {
    speciality: "Dermatology",
    doctors: [
      {
        firstName: "Jane",
        lastName: "Wanjala",
        email: "jane.wanjala@ncrh.com",
        password: "Doctor123!",
        bio: "Dermatologist specializing in skin conditions, allergies, and cosmetic dermatology.",
        education: "MBChB, MMed (Dermatology), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "15:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "15:00" },
          { day: "Friday", startTime: "08:00", endTime: "15:00" },
        ]
      }
    ]
  },
  {
    speciality: "Ophthalmology",
    doctors: [
      {
        firstName: "Samuel",
        lastName: "Omondi",
        email: "samuel.omondi@ncrh.com",
        password: "Doctor123!",
        bio: "Ophthalmologist specializing in cataract surgery, glaucoma management, and eye care.",
        education: "MBChB, MMed (Ophthalmology), University of Nairobi",
        availability: [
          { day: "Tuesday", startTime: "08:00", endTime: "16:00" },
          { day: "Thursday", startTime: "08:00", endTime: "16:00" },
        ]
      }
    ]
  },
  {
    speciality: "Dentistry",
    doctors: [
      {
        firstName: "Faith",
        lastName: "Nyambura",
        email: "faith.nyambura@ncrh.com",
        password: "Doctor123!",
        bio: "Dental Surgeon specializing in oral surgery, root canals, and preventive dentistry.",
        education: "BDS, MDS (Oral Surgery), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "17:00" },
          { day: "Tuesday", startTime: "08:00", endTime: "17:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "17:00" },
          { day: "Thursday", startTime: "08:00", endTime: "17:00" },
        ]
      },
      {
        firstName: "Brian",
        lastName: "Kipngetich",
        email: "brian.kipngetich@ncrh.com",
        password: "Doctor123!",
        bio: "Dentist specializing in pediatric dentistry and orthodontics.",
        education: "BDS, MDS (Pediatric Dentistry), Moi University",
        availability: [
          { day: "Monday", startTime: "09:00", endTime: "16:00" },
          { day: "Wednesday", startTime: "09:00", endTime: "16:00" },
          { day: "Friday", startTime: "09:00", endTime: "16:00" },
        ]
      }
    ]
  },
  {
    speciality: "Physiotherapy",
    doctors: [
      {
        firstName: "Catherine",
        lastName: "Muthoni",
        email: "catherine.muthoni@ncrh.com",
        password: "Doctor123!",
        bio: "Physiotherapist specializing in orthopedic rehabilitation and stroke recovery.",
        education: "BSc (Physiotherapy), MSc (Rehabilitation), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "17:00" },
          { day: "Tuesday", startTime: "08:00", endTime: "17:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "17:00" },
          { day: "Thursday", startTime: "08:00", endTime: "17:00" },
          { day: "Friday", startTime: "08:00", endTime: "17:00" },
        ]
      }
    ]
  },
  {
    speciality: "Neurology",
    doctors: [
      {
        firstName: "Joseph",
        lastName: "Kariuki",
        email: "joseph.kariuki@ncrh.com",
        password: "Doctor123!",
        bio: "Neurologist specializing in stroke management, epilepsy, and neurological disorders.",
        education: "MBChB, MMed (Internal Medicine), Fellowship in Neurology",
        availability: [
          { day: "Monday", startTime: "09:00", endTime: "16:00" },
          { day: "Wednesday", startTime: "09:00", endTime: "16:00" },
          { day: "Friday", startTime: "09:00", endTime: "16:00" },
        ]
      }
    ]
  },
  {
    speciality: "Psychiatry",
    doctors: [
      {
        firstName: "Anne",
        lastName: "Wanjiru",
        email: "anne.wanjiru@ncrh.com",
        password: "Doctor123!",
        bio: "Psychiatrist specializing in mental health, behavioral disorders, and counseling.",
        education: "MBChB, MMed (Psychiatry), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "15:00" },
          { day: "Tuesday", startTime: "08:00", endTime: "15:00" },
          { day: "Thursday", startTime: "08:00", endTime: "15:00" },
        ]
      }
    ]
  },
  {
    speciality: "Urology",
    doctors: [
      {
        firstName: "Paul",
        lastName: "Mwangi",
        email: "paul.mwangi@ncrh.com",
        password: "Doctor123!",
        bio: "Urologist specializing in kidney stones, prostate surgery, and urological conditions.",
        education: "MBChB, MMed (Surgery), Fellowship in Urology",
        availability: [
          { day: "Tuesday", startTime: "08:00", endTime: "17:00" },
          { day: "Thursday", startTime: "08:00", endTime: "17:00" },
        ]
      }
    ]
  },
  {
    speciality: "General Practice",
    doctors: [
      {
        firstName: "Elizabeth",
        lastName: "Njoroge",
        email: "elizabeth.njoroge@ncrh.com",
        password: "Doctor123!",
        bio: "General Practitioner providing comprehensive primary healthcare for all ages.",
        education: "MBChB, MMed (Family Medicine), University of Nairobi",
        availability: [
          { day: "Monday", startTime: "08:00", endTime: "17:00" },
          { day: "Tuesday", startTime: "08:00", endTime: "17:00" },
          { day: "Wednesday", startTime: "08:00", endTime: "17:00" },
          { day: "Thursday", startTime: "08:00", endTime: "17:00" },
          { day: "Friday", startTime: "08:00", endTime: "17:00" },
        ]
      },
      {
        firstName: "Thomas",
        lastName: "Onyango",
        email: "thomas.onyango@ncrh.com",
        password: "Doctor123!",
        bio: "Family Medicine Physician with expertise in preventive care and chronic disease management.",
        education: "MBChB, MMed (Family Medicine), Moi University",
        availability: [
          { day: "Monday", startTime: "09:00", endTime: "16:00" },
          { day: "Tuesday", startTime: "09:00", endTime: "16:00" },
          { day: "Wednesday", startTime: "09:00", endTime: "16:00" },
          { day: "Thursday", startTime: "09:00", endTime: "16:00" },
        ]
      }
    ]
  }
];

const seedDoctors = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    let createdUsers = 0;
    let createdDoctors = 0;
    let skippedUsers = 0;
    let skippedDoctors = 0;
    let errors = 0;

    for (const clinic of clinicsData) {
      for (const doctorData of clinic.doctors) {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: doctorData.email });
          
          if (!user) {
            // Create user
            const hashedPassword = await bcrypt.hash(doctorData.password, 10);
            const fullName = `${doctorData.firstName} ${doctorData.lastName}`;
            
            user = new User({
              firstName: doctorData.firstName,
              lastName: doctorData.lastName,
              name: fullName,
              email: doctorData.email,
              password: hashedPassword,
              role: 'doctor',
              department: clinic.speciality,
            });

            await user.save();
            console.log(`✓ Created user: ${fullName} (${doctorData.email})`);
            createdUsers++;
          } else {
            console.log(`⚠ User already exists: ${doctorData.email}, skipping user creation...`);
            skippedUsers++;
          }

          // Check if doctor profile already exists
          const existingDoctor = await Doctor.findOne({ userId: user._id });
          
          if (!existingDoctor) {
            // Create doctor profile
            const doctor = new Doctor({
              userId: user._id,
              speciality: clinic.speciality,
              bio: doctorData.bio,
              education: doctorData.education,
              availability: doctorData.availability,
            });

            await doctor.save();
            console.log(`✓ Created doctor profile: ${user.name} - ${clinic.speciality}`);
            createdDoctors++;
          } else {
            console.log(`⚠ Doctor profile already exists for ${user.name}, skipping...`);
            skippedDoctors++;
          }
        } catch (error) {
          if (error.code === 11000) {
            console.log(`⚠ Duplicate key error for ${doctorData.email}, skipping...`);
            skippedUsers++;
          } else {
            console.error(`✗ Error creating doctor "${doctorData.firstName} ${doctorData.lastName}":`, error.message);
            errors++;
          }
        }
      }
    }

    console.log('\n=== Seeding Summary ===');
    console.log(`Created: ${createdUsers} users, ${createdDoctors} doctor profiles`);
    console.log(`Skipped: ${skippedUsers} users (already exist), ${skippedDoctors} doctor profiles (already exist)`);
    console.log(`Errors: ${errors}`);
    console.log(`Total clinics/specialties: ${clinicsData.length}`);
    console.log(`Total doctors processed: ${createdDoctors + skippedDoctors}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
};

// Run seeder
seedDoctors();

