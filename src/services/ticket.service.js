import mongoose from 'mongoose';
import ticketRepository from '../repositories/ticket.repository.js';
import eventsRepository from '../repositories/events.repository.js';
import emailService from '../services/email.service.js';
import { generateTicketCode } from '../utils/ticketCode.js';
import e from 'express';

const businessError = (message, statusCode = 400) => 
        Object.assign(new Error(message), { statusCode });


class TicketService {
    constructor() {
        this.ticketRepository =  ticketRepository;
        this.eventsRepository = eventsRepository;
        this.emailService = emailService;
    }

    validateObjectId(id) {
        if (!mongoose.isValidObjectId(id)) {
            throw businessError('ID de ticket inválido', 400);
        }
    }

    validateQuantity(quantity) {
        const value = Number(quantity);
        if (!Number.isInteger(value) || value <= 0) {
            throw businessError('La cantidad de lugares debe ser un número entero mayor que 0', 400);
        }
        return value;
    }

    async enroll(user, eventId, quantity) {
        this.validateObjectId(eventId);
        const seats = this.validateQuantity(quantity);

        const event = await this.eventsRepository.findById(eventId);
        if (!event) {
            throw businessError('Evento no encontrado', 404);
        }

        if (event.status !== 'published') {
            throw businessError('No se puede inscribir a un evento que no está publicado', 400);
        }

        if (new Date(event.date) < new Date()) {
            throw businessError('No se puede inscribir a un evento que ya ha ocurrido', 400);
        }
        const existingTicket = await this.ticketRepository.findByUserAndEvent(user.id, eventId, 'confirmed');
        
        if (existingTicket) {
            throw businessError('El usuario ya tiene un ticket confirmado para este evento', 400);
        }

        const reservedEvent = await this.eventsRepository.reserveSeats(event._id, seats);
        if (!reservedEvent){
            throw businessError('No hay suficientes asientos disponibles para este evento', 400);
        } 

        let ticket = null;

        try {
            ticket = await this.ticketRepository.create({
                user: user.id,
                event: event._id,
                quantity: seats,
                status: 'confirmed',
                reservationCode: generateTicketCode(),
            });
        } catch (error) {
            await this.eventsRepository.releaseSeats(event._id, seats);
            throw businessError('Error al crear el ticket', 500);
        }

        await this.emailService.sendTicketConfirmationEmail(user, event, ticket);

        return ticket;
    }   

    async getTicketsFromUser(user) {
        return this.ticketRepository.findByUser(user.id);
    }

    async getTicketsByEvent(eventId) {
        this.validateObjectId(eventId);
        return this.ticketRepository.findByEvent(eventId);
    }
    async cancelTicket(user, ticketId) {
        this.validateObjectId(ticketId);
        const existantTicket = await this.ticketRepository.findById(ticketId);
        if (!existantTicket) {
            throw businessError('Ticket no encontrado', 404);
        }
        const isAdmin = user.role === 'admin';
        const ticketUserId = existantTicket.user.toString();
        const isOwner = user.id === ticketUserId;
        if (!isAdmin && !isOwner) {
            throw businessError('No tienes permiso para cancelar este ticket', 403);
        }
        if(existantTicket.status === 'cancelled'){
            throw businessError('El ticket ya ha sido cancelado', 400);
        }
        existantTicket.status = 'cancelled';
        existantTicket.cancelledAt = new Date();

        const cancelledTicket = await this.ticketRepository.save(existantTicket);

        const eventId = existantTicket.event._id

        await this.eventsRepository.releaseSeats(eventId, existantTicket.quantity);

        await this.emailService.sendTicketCancellation(user, existantTicket.event, existantTicket);

        return cancelledTicket;
    }
}

export default new TicketService();
