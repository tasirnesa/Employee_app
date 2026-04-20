const nodemailer = require('nodemailer');
require('dotenv').config();

const user = (process.env.EMAIL_USER || '').trim();
const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

console.log('--- SMTP Diagnostic Test ---');
console.log('User:', user);
console.log('Pass Length:', pass.length);
console.log('Pass Hint:', pass.length > 0 ? `${pass[0]}...${pass[pass.length-1]}` : 'empty');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass }
});

console.log('Attempting to verify transporter...');

transporter.verify((error, success) => {
  if (error) {
    console.error('!! Verification Failed !!');
    console.error(error);
    if (error.code === 'EAUTH') {
      console.log('\nSUGGESTION: This is a login error. Please ensure:');
      console.log('1. The user account ' + user + ' is correct.');
      console.log('2. The App Password is exactly 16 characters (currently ' + pass.length + ').');
      console.log('3. 2-Step Verification is ENABLED on the Google account.');
    }
  } else {
    console.log('>> Server is ready to take our messages! <<');
    
    // Attempt to send a test email
    const mailOptions = {
      from: user,
      to: user, // Send to self
      subject: 'SMTP Test Email',
      text: 'If you are reading this, your SMTP configuration is perfect!'
    };

    console.log('Sending test email to ' + user + '...');
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('!! Send Failed !!', err);
      } else {
        console.log('>> Email Sent Successfully! Message ID: ' + info.messageId);
      }
    });
  }
});
