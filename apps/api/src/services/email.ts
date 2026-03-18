import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { env } from "../env";

const ses = new SESv2Client({ region: process.env.AWS_REGION ?? "eu-west-1" });

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: env.SES_FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: { Html: { Data: html } },
        },
      },
    }),
  );
}
