import * as S from "effect/Schema"

export const UrlFromString = S.String.pipe(
  S.filter((s) => {
    try {
      new URL(s)
    } catch (_) {
      return false
    }

    return true
  })
)
