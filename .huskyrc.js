module.exports = {
  hooks: {
    "pre-commit": "yarn pretty && yarn lint && yarn test",
  },
};
