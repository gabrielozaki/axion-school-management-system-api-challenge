export default ({ meta, config, managers }) => {
  return ({ req, res, next }) => {
    next(req.params);
  };
};
