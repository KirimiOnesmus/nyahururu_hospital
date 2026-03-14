import radiology from"../assets/Icons/radiology-icon.png"
import renal from "../assets/Icons/dialysis-icon.png"
import dental from  "../assets/Icons/dental.png"
import lab from "../assets/Icons/lab-services.png"
import ICU from "../assets/Icons/ICU-icon.png"
import emergency from "../assets/Icons/emergency-icon.png"
import nutrition from "../assets/Icons/nutrition-icon.png"
import rehab from "../assets/Icons/rehab-icon.png"
import medical from "../assets/Icons/medical-icon.png"
import paediatrics from "../assets/Icons/paediatrics-icon.png"
import surgical from "../assets/Icons/surgical-icon.png"
import pharmacy from "../assets/Icons/pharmacy-icon.png"
import wellness from "../assets/Icons/wellness.png"
import physical from "../assets/Icons/physical-therapy.png"
import checkup  from "../assets/Icons/medical-checkup.png"
const services = [
  {
    id: 1,
    title: "Radiology & Imaging",
    image:radiology,
    details: "The Nyahururu Hospital Radiology Department is a modern, dynamic, fully digital Diagnostic Imaging Centre with the latest technology equipment and a commitment to providing our patients with the highest quality imaging and care. The department is fully compliant with local and international radiation protection regulatory bodies to ensure that our patients are imaged in a SAFE environment. We operate 24/7. Our services include:MRI (Magnetic Resonance Imaging)Magnetic resonance imaging (MRI) of the body uses a powerful magnetic field, radio waves, and a computer to produce detailed pictures of the inside of your body. We perform the following: Head, body, and musculoskeletal MRI services.MRI Angiography, MRI Venography, and MRI Diffusion tensor imaging.CT (Computed Tomography) scanning.A computed tomography (CT) scan is an imaging method that uses X-rays to create pictures of cross-sections of the body. The pictures are taken from different angles and are used to create 3-dimensional (3-D) views of tissues and organs. A dye may be injected into a vein or swallowed to help the tissues and organs show up more clearly. We perform the following: Whole body, neuro, trauma, and emergency CT scan imaging. CT scan Angiography, CT-guided biopsies. Ultrasound - Ultrasound is a non-invasive imaging procedure that shows structures inside the body using high-frequency sound waves. "
  },
  {
    id: 2,
    title: "Renal Unit / Dialysis",
    image:renal,
    details: "Nyahururu Hospital’s Renal Unit has 11 beds dedicated for dialysis which aims at reducing the burden of care for patients requiring blood cleaning services. Our renal unit provides hemodialysis  for both newly diagnosed patients with kidney failure and maintenance treatments for those patients who have chronic kidney failure. Through a combination of skilled specialized nurses our main goal is to provide life sustaining treatment so that our patients can live their lives and function in society as normally as possible.",
  },
  {
    id: 3,
    title: "Dental",
    image:dental,
    details: "At Nyahururu Hospital we are committed to providing world class dental treatment in a spaciously designed modern clinic where quality and care is given utmost importance. Our Patients are assured of a holistic personalized dental experience through its team of professionally trained dental specialists, world class dental equipment and technology and patient centered treatment plans.  Services Offered: Dental Implants, Pain Free Root Canal, Dental Crowns, Dental Surgeries.",
  },
  {
    id: 4,
    title: "Laboratory",
    image:lab,
    details: "Our laboratory is registered and licensed to operate at class F by Ministry of health under The Kenya Medical Laboratory Technicians and Technologist Board (KMLTTB). The laboratory is equipped with high-end ultramodern equipment that helps us offer timely, Accurate, and precise laboratory reports.Our team comprises of highly trained, dedicated, and competent pathologists and laboratory technologists. The laboratory operates 24 hours per day for both inpatient and outpatient services. ",
  },
  {
    id: 5,
    title: "Critical Care (ICU, NICU & HDU)",
    image:ICU,
    details: "Our Intensive Care Unit (ICU) provides complex 24-hour medical and nursing care, as well as specialized equipment for patients requiring a higher level of care. Patients are admitted to the ICU either electively after a planned major operation or because of an emergency that may arise during hospital admission. Other admission reasons include prolonged and complex surgery and post-operative monitoring of other chronic health conditions, such as heart or lung disease. The ICU is a 12-bed unit adjacent to a 9-bed High Dependency Unit (HDU) which allows for the stepping down of patients from ICU as they recover.",
  },
  {
    id: 6,
    title: "Emergency Care",
    image: emergency,
    details: "Nyahururu hospital accident and emergency unit is located on the ground floor with its own dedicated entrance specializing in emergency care response. It is a 24-hour urgent care team that will handle all the emergency cases and a wide range of treatment services, diagnostic tests, and minor surgical procedures. Nyahururu hospital aims to provide care for patients requiring critical emergency care. The department is located adjacent to the CT scan and imaging services hence offering convenience and hastened trauma care.  The Accident & Emergency staffed with proficient nurses and doctors skilled in trauma and emergency care.",
  },
  {
    id: 7,
    title: "Nutrition",
    image:nutrition,
    details: "Nyahururu hospital is committed to providing our patients with the highest standard of healthcare. The department adheres to the regulatory requirement of Kenya Radiation Board for quality assurance and Radiation safety. The department is manned by highly specialized, experienced, and dedicated magnetic imaging technicians, sonographers, radiologists, and radiographers. Our imaging department offers exceptional services such as. Digital MRI ,CT Scan,X-Ray Services",
  },
  {
    id: 8,
    title: "Rehabilitative Services",
    image: rehab,
    details: "Nyahururu hospital is committed to providing our patients with the highest standard of healthcare. The department adheres to the regulatory requirement of Kenya Radiation Board for quality assurance and Radiation safety. The department is manned by highly specialized, experienced, and dedicated magnetic imaging technicians, sonographers, radiologists, and radiographers. Our imaging department offers exceptional services such as.Digital MRI, CT Scan, X-Ray Services, Mammography (Breast X-Ray), Bone Densitometry.",
  },
  {
    id: 9,
    title: "Medical",
    image: medical,
    details: "The Medical-Surgical care at Nyahururu Hospital has dedicated staff offering evidence-based healthcare using innovative technology. Patient care is provided using an interdisciplinary approach involving the patient, nursing, medical staff, pharmacy, laboratory, pathology, respiratory therapy, spiritual care, nutritional services, rehabilitation, and radiology.",
  },
  {
    id: 10,
    title: "Paediatric Services",
    image:paediatrics,
    details: "Paediatric services is based around family-centred care and include comprehensive general paediatric medical and surgical services, both at inpatient and outpatient levels. We have a dedicated children’s ward with skilled and seasoned medical staff to provide round the clock care for patients. The scope will include outpatient and day surgical services for children.",
  },
  {
    id: 11,
    title: "Surgical Services",
    image:surgical,
    details: "The surgical theatre services encompass patients of all ages from minor routine procedures to more complex surgeries. Our staff understands that it takes a team of technically-skilled professionals to provide exceptional surgical services and that’s what we deliver! From surgery prep to post-operative care, our team of compassionate nurses and surgeons will work together to ensure that your surgery is successful and that you are well catered for along the way. The surgical services include day care surgery services meant for all patients who require minor surgeries and do not need admission into the wards. Patient are operated on, observed until well enough to go home.",
  },
  {
    id: 12,
    title: "Pharmacy Services",
    image:pharmacy,
    details: "We operate 24 hours providing genuine affordable drugs and surgical items both for inpatient, outpatient and external prescribed drugs. The Pharmacy is well stocked with a wide range of generic and branded medicines. Our pharmacists will help you understand the role of medication in their overall treatment plan. We believe in providing you with the relevant information on your prescribed medications as this will ensure you take medications as prescribed and work with the doctors to manage your medical issues. We also provide medication management services to patients who have difficulties with multiple prescriptions as well as help you resolve any drug-related issues.",
  },
  {
    id: 13,
    title: "Wellness Program",
    image: wellness,
    details: "We offer a wider range of Wellness Program – your personalized path to health, safety, and well-being. Our comprehensive resources cater to all our wellness partners, addressing individual needs, whether maintaining good health or managing ongoing health issues. Our program is designed to sensitize and educate, empowering you to stay healthy and prevent serious health issues. The benefits extend to employers too, with improved productivity, employee retention, enhanced morale, and reduced health-related costs.",
  },
 
  {
    id: 14,
    title: "Physiotherapy Services",
    image:physical,
    details: "Our dedicated team of experienced physiotherapists is committed to your health and vitality. We understand the importance of mobility and pain management in your daily life, and we are here to provide personalized care that meets your unique needs. Our state-of-the-art facility is equipped with the latest technology and treatment modalities to ensure you receive the highest standard of care. Whether you’re recovering from surgery, seeking relief from pain, or aiming to improve your physical performance, our physiotherapy services are tailored to empower you on your path to recovery and wellness.",
  },
  {
    id: 15,
    title: "Medical Check-ups",
    image:checkup,
    details: "We offer a range of Pre-Employment and Medical Examinations. We are your partner in ensuring a healthy and productive workforce. With our vast experience in this area, we offer tailored packages to meet your specific needs.",
  }
];
export default services;