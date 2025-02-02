/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly SLACK_WEBHOOK_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 