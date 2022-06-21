// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Parser } from "../../lib/parser";
import mailgun from "mailgun-js";

const { MAILGUN_API_KEY = "", EMAIL } = process.env;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method !== "POST") {
    return res.status(500).json({ message: "Method not supported" });
  }

  if (!req.body.email) {
    return res.status(400).json({ message: "Missing email" });
  }

  const DOMAIN = "sandboxd1d7f7576c0b4066a9b7e13b343db1b2.mailgun.org";
  const mg = mailgun({ apiKey: MAILGUN_API_KEY, domain: DOMAIN });
  const data = {
    from: `Elis <${EMAIL}>`,
    to: req.body.email,
    subject: "Daily Reminder - Time tracking",
    text: "Don't forget to start/stop time tracking!",
  };

  mg.messages().send(data);

  res.status(200).json({ message: "Ok" });
}
