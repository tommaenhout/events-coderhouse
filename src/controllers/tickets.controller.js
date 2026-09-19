import ticketService from "../services/ticket.service.js";


export const enroll = async (req, res, next) => {
    try {
        const { eid } = req.params;
        const { quantity } = req.body;

        const ticket = await ticketService.enroll(req.user, eid, quantity);
        
        res.status(201).json({
            status: 'success',
            message: "Inscripción realizada con éxito",
            data: {
                id: ticket._id,
                event: ticket.event,
                quantity: ticket.quantity,
                status: ticket.status,
                reservationCode: ticket.reservationCode
            }
        })
    } catch (error) {
        next(error);
    }

}

export const getTicketsFromUser = async (req, res, next) => {
    try {
        const tickets = await ticketService.getTicketsFromUser(req.user);
        res.status(200).json({
            status: 'success',
            message: 'Tickets obtenidos con éxito',
            data: tickets
        });
    } catch (error) {
        next(error);
    }
}

export const getTicketsByEvent = async (req, res, next) => {
    try {
        const { eid } = req.params;
        const tickets = await ticketService.getTicketsByEvent(eid);
        res.status(200).json({
            status: 'success',
            message: 'Tickets obtenidos con éxito',
            data: tickets
        });
    } catch (error) {
        next(error);
    }
}

export const cancelTicket = async (req, res, next) => { 
    try {
        const { tid } = req.params;
        const cancelledTicket = await ticketService.cancelTicket(req.user, tid);
        res.status(200).json({
            status: 'success',
            message: 'Ticket cancelado con éxito',
            data: cancelledTicket
        });
    } catch (error) {
        next(error);
    }
}
