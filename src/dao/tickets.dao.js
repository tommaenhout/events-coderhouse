import { Ticket } from '../models/ticket.model.js';
import mongoose from 'mongoose';

export class TicketsDao {
    isValidId(id) {
        return mongoose.isValidObjectId(id);
    }
    async create(ticketData) {
        const ticket = await Ticket.create(ticketData);
        return typeof ticket.toObject === 'function' ? ticket.toObject() : ticket;
    }
    async findByUserAndEvent(userId, eventId, status) {
        return Ticket.findOne({ user: userId, event: eventId, status: status }).lean();
    }
    async findById(id) {
        return Ticket.findById(id).populate('event').lean();
    }
    async findByUser(userId){
        return Ticket.find({user:userId})
        .populate('event')
        .sort({ createdAt: -1 })
        .lean();
    }
    async findByEvent(eventId){
        return Ticket.find({event:eventId})
        .populate('user', 'first_name last_name email')
        .sort({ createdAt: -1 })
        .lean();
    }

    async updateById(id, ticketData) {
        return Ticket.findByIdAndUpdate(id, ticketData, {
            new: true,
            runValidators: true,
        }).populate('event').lean();
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
