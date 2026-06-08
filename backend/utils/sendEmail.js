const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MindEase" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
   console.log('✅ Email sent to:', to);
};

module.exports = sendEmail;