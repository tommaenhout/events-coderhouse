import bcrypt from "bcrypt";

export const createHash = async (password) => {
    return await bcrypt.hash(password, 10);
}