import ticketService from "../services/ticket.service.js";
import { EnrollmentDTO, TicketDTO } from "../dto/ticket.dto.js";

export const enroll = async (req, res, next) => {
  try {
    const ticket = await ticketService.enroll(req.user, req.params.eid, req.body.quantity);
    return res.status(201).json({
      status: "success",
      message: "Inscripción realizada con éxito",
      data: new EnrollmentDTO(ticket),
    });
  } catch (error) {
    return next(error);
  }
};

export const getTicketsFromUser = async (req, res, next) => {
  try {
    const tickets = await ticketService.getTicketsFromUser(req.user);
    return res.status(200).json({
      status: "success",
      message: "Tickets obtenidos con éxito",
      data: tickets.map((ticket) => new TicketDTO(ticket)),
    });
  } catch (error) {
    return next(error);
  }
};

export const getTicketsByEvent = async (req, res, next) => {
  try {
    const tickets = await ticketService.getTicketsByEvent(req.params.eid, req.user);
    return res.status(200).json({
      status: "success",
      message: "Tickets obtenidos con éxito",
      data: tickets.map((ticket) => new TicketDTO(ticket)),
    });
  } catch (error) {
    return next(error);
  }
};

export const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.cancelTicket(req.user, req.params.tid);
    return res.status(200).json({
      status: "success",
      message: "Ticket cancelado con éxito",
      data: new TicketDTO(ticket),
    });
  } catch (error) {
    return next(error);
  }
};
