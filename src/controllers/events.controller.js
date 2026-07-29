export const getEvents = (_request, response) => {
  response.status(200).json({
    status: "success",
    payload: [],
  });
};
