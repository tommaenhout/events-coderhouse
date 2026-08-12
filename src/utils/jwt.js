import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "development-only-secret";
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || "development-only-refresh-secret";

export const generateJWT = (user) => {
    return jwt.sign(user, secret, { expiresIn: process.env.JWT_EXPIRES_IN || "1h" });
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id.toString() },
        refreshTokenSecret,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
    );
}

export const verifyJWT = (token) => {
    return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, refreshTokenSecret);
}
