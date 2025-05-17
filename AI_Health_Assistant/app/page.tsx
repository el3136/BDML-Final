"use client";

import clsx from "clsx";
import {
    useActionState,
    useEffect,
    useRef,
    useState,
    startTransition,
} from "react";
import { toast } from "sonner";
import { EnterIcon, LoadingIcon } from "@/lib/icons";
import { usePlayer } from "@/lib/usePlayer";
import { track } from "@vercel/analytics";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { useCallback } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  latency?: number;
};

type SubmissionData = {
  input: string | Blob;
};

export default function Home() {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const player = usePlayer();

    const imageBlobRef = useRef<Blob | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        imageBlobRef.current = file;
        setImagePreviewUrl(URL.createObjectURL(file)); // 👈 create preview URL
        toast.info("Image selected for analysis.");
      }
    }, []);

    const vad = useMicVAD({
      startOnLoad: true,
      positiveSpeechThreshold: 0.6,
      minSpeechFrames: 4,
      onSpeechEnd: (audio) => {
        // audio is already Float32Array[]
        const wav = utils.encodeWAV(audio);
        const blob = new Blob([wav], { type: "audio/wav" });
        startTransition(() => submit({ input: blob }));
    
        if (navigator.userAgent.includes("Firefox")) vad.pause();
      }
    });         

    useEffect(() => {
        function keyDown(e: KeyboardEvent) {
            if (e.key === "Enter") return inputRef.current?.focus();
            if (e.key === "Escape") return setInput("");
        }

        window.addEventListener("keydown", keyDown);
        return () => window.removeEventListener("keydown", keyDown);
    }, []);

    useEffect(() => {
      return () => {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      };
    }, [imagePreviewUrl]);

    const [messages, submit, isPending] = useActionState<Message[], SubmissionData>(
      async (prevMessages, formData) => {
        const form = new FormData();
    
        if (typeof formData.input === "string") {
          form.append("input", formData.input);
          track("Text input");
        } else {
          form.append("input", formData.input, "audio.wav");
          track("Speech input");
        }
    
        for (const message of prevMessages) {
          form.append("message", JSON.stringify(message));
        }
    
        if (imageBlobRef.current) {
          form.append("image", imageBlobRef.current);
        }
    
        const submittedAt = Date.now();
    
        const response = await fetch("/api", {
          method: "POST",
          body: form,
        });
    
        const transcript = decodeURIComponent(
          response.headers.get("X-Transcript") || ""
        );
        const text = decodeURIComponent(response.headers.get("X-Response") || "");
    
        if (!response.ok || !transcript || !text || !response.body) {
          if (response.status === 429) {
            toast.error("Too many requests. Please try again later.");
          } else {
            toast.error((await response.text()) || "An error occurred.");
          }
          return prevMessages;
        }
    
        const latency = Date.now() - submittedAt;
    
        player.play(response.body, () => {
          if (navigator.userAgent.includes("Firefox")) vad.start();
        });
    
        setInput(transcript);
    
        return [
          ...prevMessages,
          { role: "user", content: transcript },
          { role: "assistant", content: text, latency },
        ];
      },
      [], // initial state
    );

    function handleFormSubmit(e: React.FormEvent) {
      e.preventDefault();
      startTransition(() => submit({ input }));
    }

    return (
        <>
            <div className="pb-4 min-h-28" />
            {imagePreviewUrl && (
              <div className="flex justify-center pb-4 relative">
                <img
                  src={imagePreviewUrl}
                  alt="Selected"
                  className="max-h-48 rounded-lg shadow"
                />
                <button
                  onClick={() => {
                    setImagePreviewUrl(null);
                    imageBlobRef.current = null;
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 text-black shadow hover:bg-red-500 hover:text-white"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            )}
            <form
              className="... your existing classes ..."
              onSubmit={handleFormSubmit}
              encType="multipart/form-data"
            >
              <input
                type="text"
                className="... your existing classes ..."
                required
                placeholder="Ask me anything"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                ref={inputRef}
              />

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer px-2">
                🖼️
              </label>

              <button
                type="submit"
                className="p-4 text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white"
                disabled={isPending}
                aria-label="Submit"
              >
                {isPending ? <LoadingIcon /> : <EnterIcon />}
              </button>
            </form>


            <div className="text-neutral-400 dark:text-neutral-600 pt-4 text-center max-w-xl text-balance min-h-28 space-y-4">
                {messages.length > 0 && (
                    <p>
                        {messages.at(-1)?.content}
                        <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700">
                            {" "}
                            ({messages.at(-1)?.latency}ms)
                        </span>
                    </p>
                )}

                {messages.length === 0 && (
                    <>
                        <p>
                            A fast, open-source voice assistant powered by{" "}
                            <A href="https://groq.com">Groq</A>,{" "}
                            <A href="https://cartesia.ai">Cartesia</A>,{" "}
                            <A href="https://www.vad.ricky0123.com/">VAD</A>, and{" "}
                            <A href="https://vercel.com">Vercel</A>.{" "}
                            <A href="https://github.com/el3136/AI_Voice_Assistant" target="_blank">
                                Learn more
                            </A>
                            .
                        </p>

                        {vad.loading ? (
                            <p>Loading speech detection...</p>
                        ) : vad.errored ? (
                            <p>Failed to load speech detection.</p>
                        ) : (
                            <p>Start talking to chat.</p>
                        )}
                    </>
                )}
            </div>

            <div
                className={clsx(
                    "absolute size-36 blur-3xl rounded-full bg-linear-to-b from-red-200 to-red-400 dark:from-red-600 dark:to-red-800 -z-50 transition ease-in-out",
                    {
                        "opacity-0": vad.loading || vad.errored,
                        "opacity-30": !vad.loading && !vad.errored && !vad.userSpeaking,
                        "opacity-100 scale-110": vad.userSpeaking,
                    }
                )}
            />
        </>
    );
}

function A(props: any) {
    return (
        <a
            {...props}
            className="text-neutral-500 dark:text-neutral-500 hover:underline font-medium"
        />
    );
}
