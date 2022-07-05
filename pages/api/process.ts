// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { parseISO } from "date-fns";
import type { NextApiRequest, NextApiResponse } from "next";
import { Parser } from "../../lib/parser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { start, end } = req.query as { start: string; end: string };

  const lines = req.body;

  if (!start || !end) {
    throw new Error("Missing filter parameters");
  }

  const parser = Parser(lines);

  const interval = {
    start: parseISO(start),
    end: parseISO(end),
  };

  const calculatedHoursByClient =
    parser.calculateTimeBetweenDateRange(interval);

  const calculatedHoursByDayAndClient =
    parser.getTimesAndDescriptionByDay(interval);

  res
    .status(200)
    .json({ calculatedHoursByClient, calculatedHoursByDayAndClient });
}
