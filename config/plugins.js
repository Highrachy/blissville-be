module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: env("MAIL_TRAP_USER"),
          pass: env("MAIL_TRAP_PASSWORD"),
        },
        secure: false,
      },
      settings: {
        defaultFrom: "info@highrachy.com",
        defaultReplyTo: "info@highrachy.com",
      },
    },
  },
});
