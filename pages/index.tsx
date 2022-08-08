import { useState } from "react";
import Head from "next/head";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import { format, parseISO } from "date-fns";

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

// TODO fix types

function ResultList({ result }: { result: ProcessedData }) {
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
              {format(parseISO(day), "MM/dd/yyyy")}
              {Object.keys(calculatedHoursByDayAndClient[day]).map(
                (client, j) => (
                  <li key={`li-${j}`} className="flex gap-1">
                    <strong>{client}</strong>
                    <span>
                      {Number(
                        calculatedHoursByDayAndClient[day][client].hours
                      ).toFixed(2)}
                    </span>
                    <span>
                      {calculatedHoursByDayAndClient[day][
                        client
                      ].description.join(", ")}
                    </span>
                  </li>
                )
              )}
            </ul>
          ))}
      </div>
    </div>
  );
}

export default function Home() {
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

    const response = await fetch(
      `/api/process?start=${data.startDate}&end=${data.endDate}`,
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
          <label className="font-bold">Start and end date</label>
          <input
            type="date"
            {...register("startDate", { required: "This field is required" })}
          />
          <input
            type="date"
            {...register("endDate", { required: "This field is required" })}
          />

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
              Times between {getValues("startDate")} and {getValues("endDate")}
            </h2>
            <ResultList result={result} />
          </div>
        )}
      </main>
    </div>
  );
}
