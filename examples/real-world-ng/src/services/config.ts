import { ConfigProvider, pipe } from "effect"

export const ViteConfigProvider = pipe(
    ConfigProvider.fromJson(import.meta.env),
    ConfigProvider.constantCase
)
