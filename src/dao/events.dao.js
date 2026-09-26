import { Event } from "../models/event.model.js";
import mongoose from "mongoose";

const organizerProjection = "first_name last_name role";

class EventsDao {
  isValidId(id) {
    return mongoose.isValidObjectId(id);
  }

  findAll(filter = {}, { skip = 0, limit = 10, sort = { date: 1 } } = {}) {
    return Event.find(filter)
      .populate("organizer", organizerProjection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findById(id) {
    const query = Event.findById(id);
    if (typeof query?.populate !== "function") return query;
    return query.populate("organizer", organizerProjection).lean();
  }

  updateById(id, eventData) {
    return Event.findByIdAndUpdate(id, eventData, {
      new: true,
      runValidators: true,
    }).populate("organizer", organizerProjection).lean();
  }

  async create(eventData) {
    const event = await Event.create(eventData);
    return event.toObject();
  }

  async count(filter) {
    return Event.countDocuments(filter);
  }

  async reserveSeats(eventId, seats) {
    return Event.findOneAndUpdate(
      {
        _id: eventId,
        status: "published",
        date: { $gt: new Date() },
        $expr: { $lte: [{ $add: ["$reserved", seats] }, "$capacity"] },
      },
      { $inc: { reserved: seats } },
      { new: true },
    ).lean();
  }

  async releaseSeats(eventId, seats) {
    return Event.findOneAndUpdate(
      { _id: eventId, reserved: { $gte: seats } },
      { $inc: { reserved: -seats } },
      { new: true },
    ).lean();
  }
}

export default new EventsDao();
