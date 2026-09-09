import { UserEmailConflictError } from "../errors/users.errors.js";
import { User } from "../models/user.model.js";

const translateWriteError = (error) => {
  if (error.code === 11_000) {
    throw new UserEmailConflictError();
  }
  throw error;
};

class UsersDao {
  findAll() {
    return User.find().select("-password").lean();
  }
  findById(id) {
    return User.findById(id).select("-password").lean();
  }

  findByEmail(email) {
    return User.findOne({ email }).lean();
  }

  async create(userData) {
    try {
      const createdUser = await User.create(userData);
      return createdUser.toObject();
    } catch (error) {
      return translateWriteError(error);
    }
  }
}

export default new UsersDao();
