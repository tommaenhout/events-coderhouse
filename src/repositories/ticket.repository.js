import ticketsDao from "../dao/tickets.dao.js";

class TicketsRepository {
  constructor() {
    this.ticketsDao = ticketsDao;
  }  
  create(ticketData) {
    return this.ticketsDao.create(ticketData);
  }
  isValidId(id) {
    return this.ticketsDao.isValidId(id);
  }
  findByUserAndEvent(userId, eventId, status) {
    return this.ticketsDao.findByUserAndEvent(userId, eventId, status);
  }
  findById(id) {
    return this.ticketsDao.findById(id);
  }
  findByUser(userId) {
    return this.ticketsDao.findByUser(userId);
  }
  findByEvent(eventId) {
    return this.ticketsDao.findByEvent(eventId);
  }
  cancelTicket(ticketId, cancelledAt = new Date()) {
    return this.ticketsDao.updateById(ticketId, {
      status: "cancelled",
      cancelledAt,
    });
  }
  sumReservedByEvent(eventId) {
    return this.ticketsDao.sumReservedByEvent(eventId);
  } 

  countActiveTickets(eventId) {
    return this.ticketsDao.sumReservedByEvent(eventId);
  }

}

export default new TicketsRepository();
