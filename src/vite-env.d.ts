/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPMYINDIA_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
