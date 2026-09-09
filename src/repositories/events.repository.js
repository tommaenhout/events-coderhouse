import eventsDao from "../dao/events.dao.js";

class EventsRepository {
  findAll() {
    return eventsDao.findAll();
  }

  findById(id) {
    return eventsDao.findById(id);
  }

  create(eventData) {
    return eventsDao.create(eventData);
  }

  updateById(id, eventData) {
    return eventsDao.updateById(id, eventData);
  }
}

export default new EventsRepository();
