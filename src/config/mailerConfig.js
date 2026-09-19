import nodemailer from 'nodemailer';

const port = Number(process.env.MAIL_PORT) || 587;

export const mailerConfig = {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: port,
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
}

export const transporter = nodemailer.createTransport({
    host: mailerConfig.host,
    port: mailerConfig.port,
    secure: mailerConfig.port === 465,
    auth: {
        user: mailerConfig.user,
        pass: mailerConfig.pass,
    },
    tls: {
        rejectUnauthorized: false
    }
});