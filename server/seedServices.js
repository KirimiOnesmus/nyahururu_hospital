const mongoose = require('mongoose');
const Service = require('./models/servicesModel');
require('dotenv').config();

const connectDB = require('./config/db');

// Comprehensive hospital services data
const hospitalServices = [
  {
    department: "Outpatient & Emergency (A&E)",
    narration: "The heartbeat of the hospital's response system. This is where the siren stops and immediate care begins. From the triage nurse checking vitals to the emergency doctors stabilizing trauma victims from road accidents, the focus is speed and precision. It is the 24-hour gateway where no appointment is needed to save a life.",
    services: [
      "24/7 Casualty & Emergency Response",
      "Triage & Patient Stabilization",
      "Ambulance & Referral Coordination",
      "Minor Theatre Procedures (Suturing, Dressing)",
      "General Outpatient Consultant Clinics",
      "Sexual & Gender-Based Violence (SGBV) Support Center",
      "Emergency Cardiac Care (Resuscitation)"
    ]
  },
  {
    department: "Internal Medicine (Medical Wards)",
    narration: "This department handles the silent battles inside the body. It is the home for patients with complex, non-surgical conditions. Doctors here play the role of detectives, using history and lab results to treat conditions ranging from severe pneumonia and malaria to managing complications of diabetes and strokes.",
    services: [
      "Inpatient Ward Admission (Male & Female)",
      "Management of Chronic Diseases (Diabetes, Hypertension)",
      "Infectious Disease Management (Malaria, Typhoid, Pneumonia)",
      "Cardiology Consultations (Heart Conditions)",
      "Gastroenterology (Stomach & Digestive Issues)",
      "Neurology Clinics (Stroke & Nerve Disorders)",
      "Dermatology (Skin Conditions)"
    ]
  },
  {
    department: "Surgical Department",
    narration: "Where precision meets cure. In the sterile environment of the operating theatre, surgeons perform life-changing procedures. Whether it's removing an inflamed appendix, repairing a hernia, or conducting complex abdominal surgeries, the team works in unison under bright lights to physically repair the body.",
    services: [
      "Major Elective Surgeries",
      "Emergency Trauma Surgery",
      "Laparoscopic (Keyhole) Surgery",
      "General Surgery (Hernia, Appendectomy, Gallbladder)",
      "Urology (Kidney Stones, Prostate Surgery)",
      "Pediatric Surgery",
      "Anesthesia & Pain Management",
      "Post-Operative Ward Care"
    ]
  },
  {
    department: "Maternity & Reproductive Health (MCH)",
    narration: "A place of new beginnings. The journey spans from the first antenatal checkup where parents hear the baby's heartbeat, to the intensity of the delivery room, and finally to the calm of the Postnatal ward. The 'Linda Mama' initiative ensures that every mother receives skilled care during this critical time.",
    services: [
      "Antenatal Care (ANC) Clinics",
      "Normal Delivery & Labour Ward Services",
      "Caesarean Section (C-Section) Theatre",
      "Postnatal Care (PNC) & Immunization",
      "Family Planning & Reproductive Counseling",
      "Cervical & Breast Cancer Screening",
      "PMTCT (Prevention of Mother-to-Child Transmission)"
    ]
  },
  {
    department: "Pediatrics & Child Health",
    narration: "Dedicated to our smallest patients. The environment here is softer, but the care is intensive. From immunizing toddlers against polio to caring for premature babies in the Newborn Unit (NBU) incubators, the goal is to give every child a fighting chance at a healthy future.",
    services: [
      "General Pediatric Outpatient Clinic",
      "Newborn Unit (NBU) / Neonatal ICU",
      "Child Immunization (KEPI Standards)",
      "Nutrition & Growth Monitoring",
      "Management of Childhood Pneumonia & Diarrhea",
      "Adolescent Friendly Health Services"
    ]
  },
  {
    department: "Renal Unit (Nephrology)",
    narration: "A lifeline for patients with kidney failure. In this quiet, highly specialized room, dialysis machines hum rhythmically, filtering toxins from patients' blood—a job their kidneys can no longer do. It turns a fatal condition into a manageable lifestyle, saving patients the cost and fatigue of traveling to distant cities.",
    services: [
      "Haemodialysis Sessions (NHIF/SHA Covered)",
      "Nephrology Specialist Clinics",
      "Kidney Disease Screening & Management",
      "Pre-Dialysis Counseling",
      "AV Fistula Creation & Maintenance"
    ]
  },
  {
    department: "Orthopedics & Trauma",
    narration: "Restoring movement and structure. This department is often busy with victims of road accidents and elderly patients with fractures. Using traction, casts, and metal implants, surgeons rebuild broken bones, allowing patients who were carried in on stretchers to eventually walk out on crutches or their own feet.",
    services: [
      "Fracture Management & Casting (Plaster)",
      "Trauma & Accident Surgery",
      "Joint Replacement (Hip/Knee)",
      "Arthroscopy (Joint Issues)",
      "Bone Infection (Osteomyelitis) Treatment",
      "Corrective Surgery for Deformities (Clubfoot)"
    ]
  },
  {
    department: "Radiology & Imaging",
    narration: "The diagnostic eyes of the hospital. Using advanced physics, this department peers inside the human body without making a cut. From the rapid flashes of X-rays checking for broken bones to the detailed cross-sections of a CT scan revealing internal bleeding, these images dictate the treatment plan.",
    services: [
      "Digital X-Ray Imaging",
      "CT Scan (Computed Tomography)",
      "Ultrasound (Obstetric, Abdominal, Doppler)",
      "MRI (Magnetic Resonance Imaging)",
      "Mammography (Breast Imaging)",
      "OPG (Dental X-Ray)"
    ]
  },
  {
    department: "Laboratory & Pathology",
    narration: "The science of detection. Here, blood, tissue, and samples tell the truth about a patient's health. Phlebotomists draw samples, and technologist analyze them to spot malaria parasites, measure blood sugar levels, or culture bacteria to find the right antibiotic. It is evidence-based medicine in action.",
    services: [
      "Haematology (Full Blood Count, Clotting)",
      "Biochemistry (Liver & Kidney Function Tests)",
      "Parasitology (Malaria, Stool Tests)",
      "Microbiology (Culture & Sensitivity)",
      "Serology (HIV, Hepatitis, H. Pylori)",
      "Blood Transfusion Services (Blood Bank)",
      "Histopathology (Biopsy Analysis)"
    ]
  },
  {
    department: "Pharmacy & Therapeutics",
    narration: "The final stop in the patient's journey. It's not just about handing over boxes of medicine; it's about safety. Medication Therapy Management (MTM) specialists ensure that patients understand *how* to take their drugs, checking for interactions and ensuring that the treatment prescribed in the ward continues effectively at home.",
    services: [
      "Prescription Dispensing (Outpatient & Inpatient)",
      "Medication Therapy Management (MTM)",
      "Oncology (Cancer) Pharmacy Services",
      "Essential Medicines Supply Chain",
      "Patient Drug Adherence Counseling"
    ]
  },
  {
    department: "Comprehensive Care Centre (CCC)",
    narration: "A sanctuary of support for HIV/AIDS and TB care. This department operates with high confidentiality and compassion. Beyond providing ARVs, it offers nutritional support, psychological counseling, and community health outreach, proving that a viral diagnosis is not the end of a productive life.",
    services: [
      "HIV Testing & Counseling (HTS)",
      "Antiretroviral Therapy (ART) Clinics",
      "Tuberculosis (TB) Screening & Treatment",
      "Nutritional Support for Immune Compromised",
      "Psychosocial Support Groups"
    ]
  },
  {
    department: "Dental Unit",
    narration: "More than just extractions. The dental unit relieves the excruciating pain of toothaches and restores smiles. Using specialized chairs and drills, dentists perform fillings, root canals, and surgeries, ensuring oral hygiene which is deeply linked to overall body health.",
    services: [
      "Tooth Extractions (Exodontia)",
      "Dental Fillings & Restoration",
      "Root Canal Therapy",
      "Scaling & Polishing",
      "Maxillofacial Surgery (Jaw Injuries)",
      "Pediatric Dentistry"
    ]
  },
  {
    department: "Ophthalmology (Eye Unit)",
    narration: "Restoring the gift of sight. Many elderly patients arrive here guided by relatives due to cataracts. Through microsurgery, cloudy lenses are replaced, and vision is restored. The unit also treats infections, allergies, and screen diabetic patients for retinal damage.",
    services: [
      "Visual Acuity Testing",
      "Cataract Surgery",
      "Glaucoma Management",
      "Treatment of Eye Infections & Allergies",
      "Removal of Foreign Bodies",
      "Diabetic Retinopathy Screening"
    ]
  },
  {
    department: "Physiotherapy & Rehabilitation",
    narration: "The road to recovery. After a stroke or a major fracture, healing isn't finished when the wound closes. Physiotherapists work patiently with patients, using exercises, heat therapy, and massage to retrain muscles to walk, hold, and move again.",
    services: [
      "Orthopedic Rehabilitation (Post-Fracture/Surgery)",
      "Neurological Rehab (Stroke/Paralysis recovery)",
      "Pediatric Therapy (Delayed Milestones/Cerebral Palsy)",
      "Electrotherapy & Heat Therapy",
      "Occupational Therapy"
    ]
  },
  {
    department: "Nutrition & Dietetics",
    narration: "Food as medicine. Dieticians here don't just tell you what to eat; they design therapeutic diets for patients with diabetes, kidney failure, or severe malnutrition. They are critical in the wards, ensuring patients have the caloric strength to recover from surgery or illness.",
    services: [
      "Clinical Nutrition (Diabetes/Hypertension Diets)",
      "Enteral Feeding (Tube Feeding) Management",
      "Malnutrition Management (Therapeutic Foods)",
      "Maternal & Infant Young Child Feeding (MIYCN)",
      "Weight Management Counseling"
    ]
  }
];

const seedServices = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const dept of hospitalServices) {
      // Create individual service entries for each service in the department
      for (const serviceName of dept.services) {
        try {
          // Check if service already exists
          const existing = await Service.findOne({ name: serviceName });
          if (existing) {
            console.log(`Service "${serviceName}" already exists, skipping...`);
            skipped++;
            continue;
          }

          // Create new service
          const newService = new Service({
            name: serviceName,
            description: dept.narration,
            department: dept.department,
            imageUrl: null // Can be updated later
          });

          await newService.save();
          console.log(`✓ Created service: ${serviceName}`);
          created++;
        } catch (error) {
          if (error.code === 11000) {
            // Duplicate key error
            console.log(`⚠ Service "${serviceName}" already exists (duplicate key), skipping...`);
            skipped++;
          } else {
            console.error(`✗ Error creating service "${serviceName}":`, error.message);
            errors++;
          }
        }
      }
    }

    console.log('\n=== Seeding Summary ===');
    console.log(`Created: ${created} services`);
    console.log(`Skipped: ${skipped} services (already exist)`);
    console.log(`Errors: ${errors} services`);
    console.log(`Total processed: ${created + skipped + errors} services`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding services:', error);
    process.exit(1);
  }
};

// Run seeder
seedServices();

