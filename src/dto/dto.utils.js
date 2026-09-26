export const toPlainObject = (value) => {
  if (!value) return value;
  return typeof value.toObject === "function" ? value.toObject() : value;
};

export const toId = (value) => value?.toString?.() ?? value;

