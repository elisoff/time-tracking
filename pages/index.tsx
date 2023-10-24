import { useRef, useState } from "react";
import Head from "next/head";
import NextImage from "next/image";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import { format, parseISO, previousMonday, previousSunday } from "date-fns";

interface FileForm {
  timeTrackerFile: FileList;
  startDate: Date;
  endDate: Date;
}

interface ProcessedData {
  calculatedHoursByClient: { [clientName: string]: number };
  calculatedHoursByDayAndClient: {
    [date: string]: {
      [clientName: string]: { hours: number; description: string[] };
    };
  };
}

function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}

// TODO fix types

const copyIcon = (
  <NextImage
    width="16"
    height="16"
    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAYklEQVR4nGNgGE7Am4GB4QkDA8N/MjFB8JgCw/8TNp4EheQCulvgTWacgILakxgLKImTR8RYQG6Q/celb9QCGBgNIoJgNIgIApqXrv8HjQWPqV3YoQNPMi0BGe5Bhs8HKQAA5qOmsSMWnn4AAAAASUVORK5CYII="
    alt="copy"
  />
);

function ResultList({ result }: { result: ProcessedData }) {
  const [copied, setCopied] = useState<number | null>(null);

  const copiedEffect = (idx: number) => {
    setCopied(idx);
    setTimeout(() => {
      setCopied(null);
    }, 500);
  };

  const renderCopyButton = (text: string, index: number) => (
    <button
      type="button"
      onClick={async () => {
        await copyToClipboard(text);
        copiedEffect(index);
      }}
      className="px-1 rounded hover:bg-slate-200"
    >
      {copyIcon}
    </button>
  );

  const { calculatedHoursByClient, calculatedHoursByDayAndClient } = result;
  return (
    <div className="flex flex-col gap-2">
      <div>
        {calculatedHoursByClient && (
          <ul>
            {Object.keys(calculatedHoursByClient).map((client, idx) => {
              return (
                <li key={idx}>
                  {client} -{" "}
                  {Number(calculatedHoursByClient[client]).toFixed(2)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div>
        <h3 className="font-semibold my-2">Summary by date and client</h3>
        {calculatedHoursByDayAndClient &&
          Object.keys(calculatedHoursByDayAndClient).map((day, i) => (
            <ul key={`ul-${i}`}>
              <p className="font-semibold">
                {format(parseISO(day), "MM/dd/yyyy")}
              </p>
              {Object.keys(calculatedHoursByDayAndClient[day]).map(
                (client, j) => {
                  const hours = Number(
                    calculatedHoursByDayAndClient[day][client].hours
                  ).toFixed(2);

                  const description =
                    calculatedHoursByDayAndClient[day][client].description.join(
                      ", "
                    );

                  return (
                    <li
                      key={`li-${j}`}
                      className={`flex gap-1.5 my-2 p-1 ${
                        copied === i ? "bg-lime-100" : ""
                      }`}
                    >
                      <strong>{client}</strong>
                      <span className="inline-flex gap-1">
                        {hours}
                        {renderCopyButton(hours, i)}
                      </span>
                      <span className="inline-flex gap-1">
                        {description} {renderCopyButton(description, i)}
                      </span>
                    </li>
                  );
                }
              )}
            </ul>
          ))}
      </div>
    </div>
  );
}

export default function Home() {
  const lastWeek = {
    startDate: format(previousMonday(new Date()), "yyyy-MM-dd"),
    endDate: format(previousSunday(new Date()), "yyyy-MM-dd"),
  };
  const {
    handleSubmit,
    register,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FileForm>();
  const [result, setResult] = useState<ProcessedData | null>(null);

  const onSubmit = async (data: FileForm) => {
    const formData = new FormData();

    const files = data.timeTrackerFile;
    for (let i = 0; i < files.length; i++) {
      formData.append(`file${i}`, files.item(i) as Blob);
    }

    const startDate = data.startDate || lastWeek.startDate;
    const endDate = data.endDate || lastWeek.endDate;

    const response = await fetch(
      `/api/process?start=${startDate}&end=${endDate}`,
      {
        method: "POST",
        body: formData,
      }
    ).then((value) => {
      if (value.ok) {
        return value.json();
      }
      throw new Error("Something when wrong");
    });

    setResult(response);
  };

  return (
    <div className="m-10">
      <Head>
        <title>Time tracking with Alfred</title>
      </Head>
      <main className="flex flex-col gap-4 w-1/2">
        <h1 className="text-2xl">Time tracking with Alfred</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          encType="multipart/form-data"
          className="flex flex-col gap-2"
        >
          <label className="font-bold">Select your file</label>
          <input
            type="file"
            multiple
            accept=".csv"
            className="required:border-red-500"
            {...register("timeTrackerFile", {
              required: "This field is required",
            })}
          />
          <ErrorMessage errors={errors} name="timeTrackerFile" />
          <label className="font-bold">
            Start and end date (default last week)
          </label>
          <input type="date" {...register("startDate")} />
          <input type="date" {...register("endDate")} />

          <button
            className="text-blue-900 bg-blue-100 px-2 py-2 disabled:opacity-75 cursor-pointer"
            disabled={isSubmitting}
          >
            Submit
          </button>
        </form>
        {result && (
          <div>
            <h2 className="font-bold text-lg">
              Times between {getValues("startDate") || lastWeek.startDate} and{" "}
              {getValues("endDate") || lastWeek.endDate}
            </h2>
            <ResultList result={result} />
          </div>
        )}
      </main>
    </div>
  );
}
