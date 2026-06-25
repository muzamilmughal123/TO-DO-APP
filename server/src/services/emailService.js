const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let transporter;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE || false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  // Fallback: use a stub transport that doesn't send real emails (safe for local/test)
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

async function sendInviteEmail({ to, name, tempPassword }) {
  const subject = 'You have been invited to the Task Management App';
  const html = `
    <p>Hi ${name || 'there'},</p>
    <p>An administrator created an account for you on the Task Management app.</p>
    <p>Please sign in using the temporary password below, then change your password in your profile settings.</p>
    <p><strong>Temporary password:</strong> <code>${tempPassword}</code></p>
    <p>Sign in here: <a href="${FRONTEND_URL}">${FRONTEND_URL}</a></p>
    <hr />
    <p>If you did not expect this email, please contact your administrator.</p>
  `;

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text: `Hi ${name || ''},\n\nYour temporary password: ${tempPassword}\nSign in: ${FRONTEND_URL}`,
  };

  const info = await transporter.sendMail(mailOptions);

  // When using streamTransport the message is available in info.message
  return info;
}

module.exports = { sendInviteEmail };
