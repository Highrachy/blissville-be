module.exports = {
  routes: [
    {
      method: "GET",
      path: "/administrative/user-dashboard",
      handler: "administrative.userDashboard",
      config: {
        policies: [],
        middlewares: [],
      },
    },
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
