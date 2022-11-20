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
      method: "GET",
      path: "/administrative/user-transactions",
      handler: "administrative.userTransactions",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/administrative/admin-dashboard",
      handler: "administrative.adminDashboard",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/administrative/admin-transactions",
      handler: "administrative.adminTransactions",
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
    {
      method: "POST",
      path: "/administrative/forgot-password",
      handler: "administrative.forgotPassword",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
