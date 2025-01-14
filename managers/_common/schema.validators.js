export const username = (data) => {
  if (data.trim().length < 3) {
    return false;
  }
  return true;
};
export default {
  username,
};
