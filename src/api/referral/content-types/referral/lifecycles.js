module.exports = {
  async afterCreate({ result }) {
    if (result.status === 0) {
      const referralInfo = await strapi.entityService.findOne(
        "api::referral.referral",
        result.id,
        {
          populate: {
            user: {
              fields: ["id", "firstName", "lastName", "email"],
            },
          },
          fields: ["id"],
        }
      );

      await strapi.config.email.send(strapi, {
        to: result.email,
        subject: `You have been invited to join Blissville`,
        firstName: result.firstName,
        contentTop: `${referralInfo.user.firstName} just invited you to join Blissville.
        Click on the link below to accept their invitation.
        `,
        contentBottom: `Best Regards,<br>
        Operation's Team.`,
        buttonText: "Join Blissville",
        buttonLink: `${process.env.FRONT_END_URL}?inviteCode=${result.id}`,
      });
    }
  },
};
