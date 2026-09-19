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
  reserveSeats(eventId, seats){
    return eventsDao.reserveSeats(eventId, seats);
  }
  releaseSeats(eventId, seats){
    return eventsDao.releaseSeats(eventId, seats);
  }
}

export default new EventsRepository();
