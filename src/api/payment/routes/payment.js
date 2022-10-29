module.exports = {
  routes: [
    {
      method: "POST",
      path: "/payment/initialize",
      handler: "payment.initialize",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/payment/verify/:reference",
      handler: "payment.verifyPaystackPayment",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
