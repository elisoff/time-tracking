import Head from "next/head";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import { useState } from "react";

interface FileForm {
  timeTrackerFile: FileList;
}

// TODO fix types

function ResultList({ result }: any) {
  return (
    <div className="">
      <ul>
        {Object.keys(result).map((date, idx) => {
          const byClient = result[date];

          return (
            <li key={idx}>
              Date: {date}
              <ul>
                {Object.keys(byClient).map((client, idx2) => (
                  <li key={idx2}>
                    {client} - {byClient[client]}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Home() {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FileForm>();
  const [result, setResult] = useState(null);

  const onSubmit = async (data: FileForm) => {
    console.log(data.timeTrackerFile[0]);

    const response = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      body: data.timeTrackerFile[0],
    }).then((value) => {
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
            accept=".csv"
            className="required:border-red-500"
            {...register("timeTrackerFile", {
              required: "This field is required",
            })}
          />
          <ErrorMessage errors={errors} name="timeTrackerFile" />

          <button
            className="text-blue-900 bg-blue-100 px-2 py-2 disabled:opacity-75 cursor-pointer"
            disabled={isSubmitting}
          >
            Submit
          </button>
        </form>
        {result && <ResultList result={result} />}
      </main>
    </div>
  );
}
