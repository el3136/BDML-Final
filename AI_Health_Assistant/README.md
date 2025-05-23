# [Voxify](https://ai-voice-assistant-gules.vercel.app/)

Voxify is a fast AI voice assistant.

-   [Groq](https://groq.com) is used for fast inference of [OpenAI Whisper](https://github.com/openai/whisper) (for transcription) and [Meta Llama 3](https://llama.meta.com/llama3/) (for generating the text response).
-   [Cartesia](https://cartesia.ai)'s [Sonic](https://cartesia.ai/sonic) voice model is used for fast speech synthesis, which is streamed to the frontend.
-   [VAD](https://www.vad.ricky0123.com/) is used to detect when the user is talking, and run callbacks on speech segments.
-   The app is a [Next.js](https://nextjs.org) project written in TypeScript and deployed to [Vercel](https://vercel.com).

You can access the live app here: [AI Voice Assistant](https://ai-voice-assistant-gules.vercel.app/).

[Deploy with Vercel](https://vercel.com/button)

## Developing

-   Clone the repository
-   Copy `.env.example` to `.env` and fill in the environment variables.
-   Run `pnpm install` to install dependencies.
-   Run `pnpm dev` to start the development server.
