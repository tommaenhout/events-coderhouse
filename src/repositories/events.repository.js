export const createEventRepository = ({ eventDao }) => ({
  findAll() {
    return eventDao.findAll();
  },

  findById(id) {
    return eventDao.findById(id);
  },

  create(eventData) {
    return eventDao.create(eventData);
  },

  updateById(id, eventData) {
    return eventDao.updateById(id, eventData);
  },

  deleteById(id) {
    return eventDao.deleteById(id);
  },
});
