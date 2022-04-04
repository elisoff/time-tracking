import {
  differenceInMinutes,
  isWithinInterval,
  parseISO,
  format,
} from "date-fns";

// TODO fix types

type HoursByDayAndClient = {
  [date: string]: HoursByClient | StartStopByClient;
};

type StartStopByClient = {
  [clientName: string]: {
    start: string[];
    stop: string[];
  };
};

type HoursByClient = {
  [clientName: string]: number;
};

export function Parser(content: string) {
  function groupContentyDate() {
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

  function parseContentByDateAndClient() {
    const contentByDate = groupContentyDate();
    const calculatedTimesByDay: any = {};

    contentByDate.forEach((lines: string[], date) => {
      let timesByClients: StartStopByClient = {};
      lines.forEach((line) => {
        const [client, _action, datetime] = line.split(",");
        const action = _action as "start" | "stop";

        const clientData = timesByClients[client] || {
          start: [],
          stop: [],
        };
        timesByClients[client] = {
          ...clientData,
          [action]: [...clientData[action], datetime],
        };
      });

      calculatedTimesByDay[date as string] = timesByClients;
    });

    return calculatedTimesByDay;
  }

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

    return parseFloat((timeInMinutes / 60).toFixed(2));
  }

  function calculateTimeByClient(timeRangeByClient: any) {
    const calculatedHoursByClient: any = {};
    for (let client in timeRangeByClient) {
      const { start, stop } = timeRangeByClient[client];

      calculatedHoursByClient[client] =
        (calculatedHoursByClient[client] || 0) +
        calculateTimeRange(start, stop);
    }

    return calculatedHoursByClient;
  }

  function groupCalculatedHoursByDay() {
    const hoursByDayAndClient: HoursByDayAndClient = {};
    for (let day in timesByDateAndClient) {
      hoursByDayAndClient[day] = calculateTimeByClient(
        timesByDateAndClient[day]
      );
    }
    return hoursByDayAndClient;
  }

  const lines = content
    .split("\n")
    .filter((line) => line.split(",").length === 3)
    .map((line) => line.replace("\r", ""));
  const timesByDateAndClient = parseContentByDateAndClient();
  const calculatedTimesByDay = groupCalculatedHoursByDay();

  return {
    calculateTimeBetweenDateRange(startDate: string, endDate: string) {
      const interval = {
        start: parseISO(startDate),
        end: parseISO(endDate),
      };

      const calculatedHoursByClient: any = {};

      Object.keys(calculatedTimesByDay).filter((date) => {
        const parsedDate = parseISO(date);
        if (!isWithinInterval(parsedDate, interval)) {
          return;
        }
        const hoursByClientByDay = calculatedTimesByDay[date];
        Object.keys(hoursByClientByDay).forEach((client) => {
          calculatedHoursByClient[client] =
            (calculatedHoursByClient[client] || 0) + hoursByClientByDay[client];
        });
      });
      return calculatedHoursByClient;
    },
  };
}
