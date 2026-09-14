import { Event } from "../models/event.model.js";

const organizerProjection = "first_name last_name role";

class EventsDao {
  findAll(filter = {}, { skip = 0, limit = 10, sort = { date: 1 } } = {}) {
    return Event.find(filter)
      .populate("organizer", organizerProjection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  findById(id) {
    return Event.findById(id).populate("organizer", organizerProjection).lean();
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

}

export default new EventsDao();
