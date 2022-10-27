module.exports = {
  async afterCreate({ result }) {
    await strapi.config.email.send(strapi, {
      subject: `[${result.source}] ${result.subject} - ${result.name}`,
      tableData: {
        name: result.name,
        email: result.email,
        phone: result.phone,
        source: result.source,
        subject: result.subject,
      },
      contentBottom: result.message,
    });
  },
};
