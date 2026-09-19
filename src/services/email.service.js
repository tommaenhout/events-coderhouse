import { transporter } from '../config/mailerConfig.js';

let from = process.env.MAIL_FROM

class EmailService {
    async sendTicketConfirmationEmail(user, event, ticket) {
        return this.#send({
            from: from,
            to: user.email,
            subject: `Inscripción confirmada para ${event.name}`,
            html: `
                <strong>Ticket Confirmation</strong>
                <p>Hola ${user.name},</p>
                <p>Tu inscripción para el evento "${event.name}" ha sido confirmada.</p>
                <p>Fecha del evento: ${event.date}</p>
                <p>ID del ticket: ${ticket.id}</p>
            `
        });
    }
    async sendTicketCancellation(user, event, ticket) {
        return this.#send({
            from: from,
            to: user.email,
            subject: `Inscripción cancelada para ${event.name}`,
            html: `
                <strong>Ticket Cancellation</strong>
                <p>Hola ${user.name},</p>
                <p>Tu inscripción para el evento "${event.name}" ha sido cancelada.</p>
                <p>Fecha del evento: ${event.date}</p>
                <p>ID del ticket: ${ticket.id}</p>
            `
        });
    }
    async #send({to,subject, html}) {
        try {
            const info = await transporter.sendMail({
                from: from,
                to,
                subject,
                html
            });
            console.log('Email sent: ' + info.response);
            return Promise.resolve(info);
        } catch (error) {
            console.error('Error sending email: ' + error.message);
            return Promise.reject(new Error('Error sending email'));
        }
    }
}

export default new EmailService();