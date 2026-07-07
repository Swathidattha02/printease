const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
    const smtpPort = parseInt(process.env.SMTP_PORT || '2525', 10);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    });

    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@xeroxflow.com',
        to,
        subject,
        text
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            const info = await transporter.sendMail(mailOptions);
            return info;
        } catch (error) {
            console.error(`SMTP Error sending mail to ${to}:`, error.message);
            throw error;
        }
    } else {
        console.log(`\n=== SMTP not configured. Logged Email: ===\nTo: ${to}\nSubject: ${subject}\nBody:\n${text}\n===========================\n`);
        return null;
    }
};

module.exports = { sendEmail };
