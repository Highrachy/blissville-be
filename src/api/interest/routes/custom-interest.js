module.exports = {
  routes: [
    {
      method: "GET",
      path: "/interests/hello",
      handler: "interest.hello",
      config: {
        auth: false,
      },
    },
  ],
};
