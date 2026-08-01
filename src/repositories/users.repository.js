export const createUserRepository = ({ userDao }) => ({
  findAll() {
    return userDao.findAll();
  },

  findById(id) {
    return userDao.findById(id);
  },

  findByEmail(email) {
    return userDao.findByEmail(email);
  },

  create(userData) {
    return userDao.create(userData);
  },

  updateById(id, userData) {
    return userDao.updateById(id, userData);
  },

  deleteById(id) {
    return userDao.deleteById(id);
  },
});
