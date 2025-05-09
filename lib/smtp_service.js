import {
  createTransport
} from 'nodemailer';
import {
  mail_host,
  mail_password,
  mail_port,
  mail_username
} from './configs.js';

const transporter = createTransport({
  host: mail_host,
  port: mail_port,
  secure: true,
  auth: {
    user: mail_username,
    pass: mail_password,
  },
});

export function sendMail({
  recipient,
  subject,
  content,
  template
}) {
  const mailOptions = {
    from: mail_username,
    to: recipient,
    subject,
    text: content,
    html: template
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}