export const createEventDao = ({ EventModel }) => ({
  findAll() {
    return EventModel.find().lean();
  },

  findById(id) {
    return EventModel.findById(id).lean();
  },

  async create(eventData) {
    const event = await EventModel.create(eventData);
    return event.toObject();
  },

  updateById(id, eventData) {
    return EventModel.findByIdAndUpdate(id, eventData, {
      new: true,
      runValidators: true,
    }).lean();
  },

  deleteById(id) {
    return EventModel.findByIdAndDelete(id).lean();
  },
});
