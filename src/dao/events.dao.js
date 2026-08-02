import { Event } from "../models/event.model.js";

class EventsDao {
  findAll() {
    return Event.find().lean();
  }

  findById(id) {
    return Event.findById(id).lean();
  }

  async create(eventData) {
    const event = await Event.create(eventData);
    return event.toObject();
  }

  updateById(id, eventData) {
    return Event.findByIdAndUpdate(id, eventData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  deleteById(id) {
    return Event.findByIdAndDelete(id).lean();
  }
}

export default new EventsDao();
