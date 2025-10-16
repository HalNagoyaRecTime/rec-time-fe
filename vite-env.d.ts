/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DEV_PORT: string;
  readonly VITE_HOST: string;
  readonly VITE_EVENT_DATE: string;
  readonly VITE_NOTIFICATION_TIMINGS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
