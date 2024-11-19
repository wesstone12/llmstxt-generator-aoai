"use client";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [apiMessage, setApiMessage] = useState<string>("");

  const callApi = async () => {
    try {
      const response = await fetch("/api/service");
      const data = await response.json();
      setApiMessage(data.message);
    } catch (error) {
      setApiMessage("Error calling API");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={callApi}
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Call API
          </button>
          {apiMessage && (
            <p className="text-sm font-[family-name:var(--font-geist-mono)]">
              API Response: {apiMessage}
            </p>
          )}
        </div>
      
   
    </div>
  );
}
