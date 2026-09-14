import eventsDao from "../dao/events.dao.js";

class EventsRepository {
  findAll(filter = {}, options = {}) {
    return eventsDao.findAll(filter, options);
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

  count(filter = {}) {
    return eventsDao.count(filter);
  }
}

export default new EventsRepository();
