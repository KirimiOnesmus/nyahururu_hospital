const sms = require("./africastalking");

class SMSService {
 
  async sendAppointmentConfirmation(appointmentData) {
    const { patientName, phone, service, appointmentDate, time } = appointmentData;

    console.log("SMS Service - Appointment Data:", {
      patientName,
      phone,
      service,
      appointmentDate,
      time,
    });
    console.log("SMS Service - Phone type:", typeof phone);
    console.log("SMS Service - Phone value:", phone);

    const message = `Hello ${patientName}, your appointment for ${service} on ${appointmentDate} at ${time} has been booked. Await confirmation. - Nyahururu County Referral Hospital`;

    return this.sendSMS(phone, message);
  }

  
  async sendAppointmentStatusUpdate(phone, patientName, service, date, time, status) {
    console.log("SMS Service - Status Update Data:", {
      phone,
      patientName,
      service,
      date,
      time,
      status
    });
    
    let message;
    if (status === "confirmed") {
      message = `Hello ${patientName}, your appointment for ${service} on ${date} at ${time} has been CONFIRMED. See you then! - Nyahururu County Referral Hospital`;
    } else if (status === "cancelled") {
      message = `Hello ${patientName}, your appointment for ${service} on ${date} at ${time} has been CANCELLED. Contact us to reschedule. - Nyahururu County Referral Hospital`;
    } else if (status === "completed") {
      message = `Hello ${patientName}, thank you for visiting us. We hope you had a great experience. - Nyahururu County Referral Hospital`;
    } else {
      message = `Hello ${patientName}, your appointment status has been updated to ${status}. - Nyahururu County Referral Hospital`;
    }
    
    return this.sendSMS(phone, message);
  }

  /**
   * Send appointment reminder SMS (for scheduled reminders)
   */
//   async sendAppointmentReminder(appointmentData) {
//     const { patientName, phone, service, appointmentDate, time } = appointmentData;
    
//     const message = `REMINDER: Hello ${patientName}, you have an appointment for ${service} tomorrow at ${time}. Please arrive 10 mins early. - Nyahururu County Referral Hospital`;

//     return this.sendSMS(phone, message);
//   }

  async sendSMS(phoneNumber, message) {
    try {
      if (!phoneNumber) {
        throw new Error("Phone number is required");
      }

      if (!message) {
        throw new Error("Message is required");
      }


      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      console.log(`Sending SMS to ${formattedPhone}: ${message.substring(0, 50)}...`);

      const options = {
        to: [formattedPhone],
        message: message,
      };

      const response = await sms.send(options);

      console.log("SMS sent successfully:", response);
      return { success: true, response };
    } catch (error) {
      console.error("SMS sending failed:", error);
      return { success: false, error: error.message };
    }
  }


  formatPhoneNumber(phone) {
    if (!phone) {
      throw new Error("Phone number is required");
    }


    if (typeof phone === "object" && phone !== null) {
      console.error("Phone number is an object:", JSON.stringify(phone));
    
      phone = phone.phone || phone.phoneNumber || phone.number || phone.value;
      if (!phone) {
        throw new Error("Could not extract phone number from object");
      }
    }

    let cleaned = String(phone).trim();

  
    if (cleaned === "[object Object]") {
      throw new Error("Invalid phone number: received object instead of string/number");
    }

  
    cleaned = cleaned.replace(/[\s\-\(\)]/g, "");

  
    if (!/^\+?\d+$/.test(cleaned)) {
      throw new Error(`Invalid phone number format: ${cleaned}`);
    }

 
    if (cleaned.startsWith("0")) {
      cleaned = "+254" + cleaned.substring(1);
    }

   
    if (!cleaned.startsWith("+")) {
      cleaned = "+254" + cleaned;
    }

    return cleaned;
  }

}

module.exports = new SMSService();