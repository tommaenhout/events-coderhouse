export const pickFields = (source, allowedFields) =>
  Object.fromEntries(
    allowedFields
      .filter((field) => Object.hasOwn(source, field))
      .map((field) => [field, source[field]]),
  );
