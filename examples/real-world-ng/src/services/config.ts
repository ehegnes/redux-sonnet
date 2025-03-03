import { ConfigProvider } from "effect"

const nestedConfigProvider = (prefix: string) =>
  ConfigProvider.fromEnv().pipe(
    ConfigProvider.nested(prefix),
    ConfigProvider.constantCase,
  )

export const ViteConfigProvider = nestedConfigProvider("vite")
