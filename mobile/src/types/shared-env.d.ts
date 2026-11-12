// Shared web files are type-checked here too; on the web Vite provides import.meta.env.
interface ImportMetaEnv {
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
