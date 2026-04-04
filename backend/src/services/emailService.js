const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Initialize transporter
// These values should ideally come from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

const emailService = {
  /**
   * Generic send email function
   */
  sendEmail: async ({ to, subject, text, html, attachments }) => {
    try {
      const info = await transporter.sendMail({
        from: `"Employee Evaluation System" <${process.env.EMAIL_FROM || 'noreply@ees.com'}>`,
        to,
        subject,
        text,
        html,
        attachments
      });
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  },

  /**
   * Send Password Reset Email
   */
  sendPasswordResetEmail: async (user, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0288d1;">Password Reset Request</h2>
        <p>Hello ${user.fullName},</p>
        <p>You requested a password reset for your Employee Evaluation System account. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0288d1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">Employee Evaluation System &copy; 2026</p>
      </div>
    `;
    return await emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `Reset your password here: ${resetUrl}`,
      html
    });
  },

  /**
   * Send Leave Status Email
   */
  sendLeaveStatusEmail: async (employee, leave, status) => {
    const color = status === 'Approved' ? '#4caf50' : '#f44336';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: ${color};">Leave Request ${status}</h2>
        <p>Hello ${employee.fullName || 'Employee'},</p>
        <p>Your leave request for the period <strong>${new Date(leave.startDate).toLocaleDateString()}</strong> to <strong>${new Date(leave.endDate).toLocaleDateString()}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
        ${leave.comments ? `<p><strong>Comments from Manager:</strong> ${leave.comments}</p>` : ''}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/leave-management" style="background-color: #0288d1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Details</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">Employee Evaluation System &copy; 2026</p>
      </div>
    `;
    return await emailService.sendEmail({
      to: employee.email || employee.user?.email, 
      subject: `Leave Request ${status}`,
      text: `Your leave request has been ${status.toLowerCase()}.`,
      html
    });
  },

  /**
   * Send Payslip Email
   */
  sendPayslipEmail: async (employee, payslip) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0288d1;">Your Payslip for ${payslip.period}</h2>
        <p>Hello ${employee.fullName || 'Employee'},</p>
        <p>Your payslip for the period <strong>${payslip.period}</strong> is now available.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr><td><strong>Basic Salary:</strong></td><td style="text-align: right;">$${payslip.basicSalary}</td></tr>
            <tr><td><strong>Allowances:</strong></td><td style="text-align: right;">$${payslip.allowances}</td></tr>
            <tr><td><strong>Deductions:</strong></td><td style="text-align: right;">-$${payslip.deductions}</td></tr>
            <tr style="border-top: 1px solid #ddd;"><td style="padding-top: 10px;"><strong>Net Salary:</strong></td><td style="text-align: right; padding-top: 10px; font-size: 18px; font-weight: bold; color: #0288d1;">$${payslip.netSalary}</td></tr>
          </table>
        </div>
        <p>Please log in to the portal to view the full breakdown or download your PDF payslip.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/payroll" style="background-color: #0288d1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Details</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">Employee Evaluation System &copy; 2026</p>
      </div>
    `;
    return await emailService.sendEmail({
      to: employee.email || employee.user?.email,
      subject: `Payslip for ${payslip.period}`,
      text: `Your payslip for ${payslip.period} is ready. Net Salary: $${payslip.netSalary}`,
      html
    });
  }
};

module.exports = emailService;
