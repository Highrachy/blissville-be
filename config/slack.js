const axios = require("axios");
// import { convertDateToShortHumanFormat } from "./dates";

const { SLACK_TOKEN } = process.env;
const SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";
module.exports = {
  // https://app.slack.com/block-kit-builder
  // https://thecodebarbarian.com/working-with-the-slack-api-in-node-js.html
  async sendSlackNotification(
    message,
    { blocks, border, channel, icon, username }
  ) {
    await axios.post(
      SLACK_POST_MESSAGE_URL,
      {
        channel,
        username,
        icon_emoji: icon,
        text: message,
        attachments: [{ color: border, blocks }],
      },
      { headers: { authorization: `Bearer ${SLACK_TOKEN}` } }
    );
  },
};
