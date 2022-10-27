const mjml2html = require("mjml");

const camelToSentence = (str) =>
  str.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

module.exports = {
  async send(strapi, { subject, to, ...emailContent }) {
    await strapi
      .plugin("email")
      .service("email")
      .send({
        to: to || process.env.OUR_EMAIL || "haruna@highrachy.com",
        from: "no-reply@highrachy.com",
        subject,
        text: generateTextEmail(emailContent),
        html: generateHTMLEmail(emailContent),
      });
  },
};

const generateGreetingText = ({ greeting, firstName }) => {
  const hello = greeting || "Hello";
  return firstName ? `${hello} ${firstName},` : `${hello},`;
};

const generateHTMLEmail = ({
  title,
  greeting,
  firstName,
  contentTop,
  contentBottom,
  tableData,
  image,
  buttonText,
  buttonLink,
}) => {
  const htmlOutput = mjml2html(
    `
  <mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="150px" src="https://blissville.com.ng/assets/img/logo.png"></mj-image>
        <mj-divider border-color="#60778E"></mj-divider>
      </mj-column>
    </mj-section>
    ${
      title &&
      `<mj-section>
      <mj-column>
        <mj-text font-size="24px" color="#333" font-family="Helvetica" align="center">${title}</mj-text>
      </mj-column>
    </mj-section>`
    }
    ${
      (greeting || firstName) &&
      `<mj-section>
      <mj-column>
      <mj-text font-size="14px" line-height="1.8" color="#333" font-family="Helvetica">${generateGreetingText(
        { greeting, firstName }
      )}</mj-text>
      </mj-column>
    </mj-section>`
    }
    ${
      image &&
      `<mj-section padding="0">
      <mj-column>
        <mj-image width="300px" src=${image} />
      </mj-column>
    </mj-section>`
    }
    ${
      contentTop &&
      `<mj-section padding="0">
      <mj-column>
      <mj-text font-size="14px" line-height="1.8" color="#333" font-family="Helvetica">${contentTop}</mj-text>
      </mj-column>
    </mj-section>`
    }
    ${
      tableData &&
      Object.keys(tableData).length > 0 &&
      `<mj-section padding="0">
      <mj-column>
        <mj-table>
            ${Object.entries(tableData)
              .map(
                ([key, value]) =>
                  `<tr style="border-bottom:1px solid #ecedee;border-top:1px solid #ecedee;text-align:left;padding:15px 0;">
              <th style="padding: 15px 0;">${camelToSentence(key)}</th>
              <td style="padding: 15px 0;">${value}</th>
            </tr>`
              )
              .join("")}
        </mj-table>
      </mj-column>
    </mj-section>`
    }
    ${
      buttonText &&
      buttonLink &&
      `<mj-section>
      <mj-column>
        <mj-button font-family="Helvetica" background-color="#ED3237" font-size="14px" color="white" inner-padding="20px 35px" href=${buttonLink}>
          ${buttonText}
         </mj-button>
      </mj-column>
    </mj-section>`
    }
    ${
      contentBottom &&
      `<mj-section padding="0">
      <mj-column>
      <mj-text font-size="14px" line-height="1.8" color="#333" font-family="Helvetica">${contentBottom}</mj-text>
      </mj-column>
    </mj-section>`
    }
  </mj-body>
</mjml>
`,
    {}
  );

  return htmlOutput.html;
};

const generateTextEmail = ({
  title,
  greeting,
  firstName,
  contentTop,
  contentBottom,
  buttonText,
  buttonLink,
  tableData,
}) => {
  const titleText = (title && `${title}\n--- \n\n`) || "\n";
  let content = "";
  const greetings = generateGreetingText({ greeting, firstName });
  const button =
    buttonLink && buttonText
      ? `[${buttonText}](${buttonLink}) \n\n or copy this url and view in a web browser ${buttonLink}`
      : "";
  content += (contentTop && contentTop.replace("<br>", "\n")) || "";
  if (tableData && Object.keys(tableData).length > 0) {
    content +=
      Object.keys(tableData).length > 0
        ? Object.entries(tableData)
            .map(
              ([key, value]) => `\n\n - ${camelToSentence(key)}: ${value} \n`
            )
            .join("")
        : "";
  }
  content += contentBottom ? `\n\n${contentBottom.replace("<br>", "\n")}` : "";

  // Note: The text is formatted as it should appear on the device
  return `
${titleText.replace(/<[^>]+>/g, "")}
${greetings}

${content.replace(/<[^>]+>/g, "")}

${button}

Thank you.`;
};

// Sample Usage
// await strapi.config.email.send(strapi, {
//   subject: "New Job Applicant",
//   firstName: "John",
//   image:
//     "https://www.online-image-editor.com//styles/2014/images/example_image.png",
//   title: "New Sample Applicant Title",
//   tableData: {
//     fullName: "Fulani Hausa",
//     age: 32,
//     address: "25 Ikorodu road, Obanikoro, Lagos",
//   },
//   buttonText: "View Info",
//   buttonLink: "www.highrachy.com",
//   contentTop:
//     "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Potenti nullam ac tortor vitae. Donec pretium vulputate sapien nec sagittis aliquam malesuada bibendum. Ut eu sem integer vitae justo eget magna fermentum iaculis. Eget mi proin sed libero. Aliquet enim tortor at auctor urna nunc id cursus. A scelerisque purus semper eget duis at tellus at urna. Facilisis gravida neque convallis a cras semper. Dolor sit amet consectetur adipiscing elit duis tristique sollicitudin nibh. Faucibus scelerisque eleifend donec pretium vulputate sapien. Volutpat est velit egestas dui id ornare arcu odio",
//   contentBottom:
//     "This one na content bottom. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Potenti nullam ac tortor vitae. Donec pretium vulputate sapien nec sagittis aliquam malesuada bibendum. Ut eu sem integer vitae justo eget magna fermentum iaculis. Eget mi proin sed libero. Aliquet enim tortor at auctor urna nunc id cursus. A scelerisque purus semper eget duis at tellus at urna. Facilisis gravida neque convallis a cras semper. Dolor sit amet consectetur adipiscing elit duis tristique sollicitudin nibh. Faucibus scelerisque eleifend donec pretium vulputate sapien. Volutpat est velit egestas dui id ornare arcu odio",
// });
