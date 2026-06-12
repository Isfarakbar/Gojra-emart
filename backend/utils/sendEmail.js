const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Check if SMTP credentials exist in environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP_USER or SMTP_PASS missing in .env. Password reset emails will NOT be sent.');
        return;
    }

    // Configure the transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Default to Gmail, change if using another service
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: `Gojra E-Mart <${process.env.SMTP_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
