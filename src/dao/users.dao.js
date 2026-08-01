import { UserEmailConflictError } from "../errors/users.errors.js";

const translateWriteError = (error) => {
  if (error.code === 11_000) {
    throw new UserEmailConflictError();
  }

  throw error;
};

export const createUserDao = ({ UserModel }) => ({
  findAll() {
    return UserModel.find().lean();
  },

  findById(id) {
    return UserModel.findById(id).lean();
  },

  findByEmail(email) {
    return UserModel.findOne({ email }).lean();
  },

  async create(userData) {
    try {
      const user = await UserModel.create(userData);
      return user.toObject();
    } catch (error) {
      return translateWriteError(error);
    }
  },

  async updateById(id, userData) {
    try {
      return await UserModel.findByIdAndUpdate(id, userData, {
        new: true,
        runValidators: true,
      }).lean();
    } catch (error) {
      return translateWriteError(error);
    }
  },

  deleteById(id) {
    return UserModel.findByIdAndDelete(id).lean();
  },
});
