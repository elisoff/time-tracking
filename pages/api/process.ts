// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { differenceInMinutes, parseISO, format } from "date-fns";

function calculateTimeRange(start = [], stop = []) {
  const timeInMinutes =
    start.reduce((prev, time, index) => {
      const stopTime = stop[index] && parseISO(stop[index]);

      const difference = stopTime
        ? differenceInMinutes(stopTime, parseISO(time), {
            roundingMethod: "floor",
          })
        : 1;

      return prev + difference;
    }, 0) || 1;

  return timeInMinutes / 60;
}

async function groupFileContentyDate(content: string) {
  const lines = content.split("\n");

  const timesByDay = new Map();

  lines.forEach((line) => {
    const [, , datetime] = line.split(",");
    const parsedDatetime = parseISO(datetime);
    const date = format(parsedDatetime, "yyyy-MM-dd");

    if (timesByDay.has(date)) {
      timesByDay.set(date, [line, ...timesByDay.get(date)]);
    } else {
      timesByDay.set(date, [line]);
    }
  });

  return timesByDay;
}

async function parseContent(content: string) {
  const contentByDate = await groupFileContentyDate(content);

  const calculatedTimesByDay = {};

  contentByDate.forEach((lines, date) => {
    const timesByClients = {};
    lines.forEach((line) => {
      const [client, action, datetime] = line.split(",");

      const clientData = timesByClients[client] || {
        start: [],
        stop: [],
      };
      timesByClients[client] = {
        ...clientData,
        [action]: [...clientData[action], datetime],
      };
    });

    calculatedTimesByDay[date] = timesByClients;
  });

  return calculatedTimesByDay;
}

function calculateTimeByDay(timesByDay) {
  const hoursByDayAndClient = {};
  for (let day in timesByDay) {
    console.log(timesByDay[day]);
    hoursByDayAndClient[day] = calculateTimeByClient(timesByDay[day]);
  }

  return hoursByDayAndClient;
}

function calculateTimeByClient(timeByClients) {
  const hoursByClient = {};
  for (let client in timeByClients) {
    const { start, stop } = timeByClients[client];

    hoursByClient[client] =
      (hoursByClient[client] || 0) + calculateTimeRange(start, stop);
  }

  return hoursByClient;
}

type TimeData = {
  [date: string]: {
    [clientName: string]: number;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TimeData>
) {
  const lines = req.body;

  const data = calculateTimeByDay(await parseContent(lines));

  res.status(200).json(data);
}
