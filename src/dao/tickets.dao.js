import { Ticket } from '../models/ticket.model.js';

export class TicketsDao {
    async create(ticketData) {
        return Ticket.create(ticketData);
    }
    async findByUserAndEvent(userId, eventId, status) {
        return Ticket.findOne({ user: userId, event: eventId, status: status }).lean();
    }
    async findById(id) {
        return Ticket.findById(id).populate('event');
    }
    async findByUser(userId){
        return Ticket.find({user:userId})
        .populate('event')
        .sort({ createdAt: -1 });
    }
    async findByEvent(eventId){
        return Ticket.find({event:eventId})
        .populate('user', 'first_name last_name email')
        .sort({ createdAt: -1 });
    }
    async save(ticket) {
        return ticket.save();
    }
    async sumReservedByEvent(eventId) {
        const result = await Ticket.aggregate([
            { $match: { event: eventId, status: 'confirmed' } },
            { $group: { _id: "$event", totalReserved: { $sum: '$quantity' } } }
        ]);
        return result.length > 0 ? result[0].totalReserved : 0;
    }

}

export default new TicketsDao();
