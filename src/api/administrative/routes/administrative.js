module.exports = {
  routes: [
    {
      method: "POST",
      path: "/administrative/set-password",
      handler: "administrative.setPassword",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
