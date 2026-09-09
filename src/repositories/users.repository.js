import usersDao from "../dao/users.dao.js";

class UsersRepository {
  findAll() {
    return usersDao.findAll();
  }
  findById(id) {
    return usersDao.findById(id);
  }

  findByEmail(email) {
    return usersDao.findByEmail(email);
  }

  create(userData) {
    return usersDao.create(userData);
  }
}

export default new UsersRepository();
