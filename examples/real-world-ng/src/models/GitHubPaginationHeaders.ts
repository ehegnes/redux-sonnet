import * as A from "effect/Array"
import { pipe } from "effect/Function"
import * as O from "effect/Option"
import * as S from "effect/Schema"
import * as String from "effect/String"

const GitHubPaginationHeaders = S.Struct({
  prev: S.Option(S.String),
  next: S.Option(S.String),
  last: S.Option(S.String),
  first: S.Option(S.String)
})

export const LinkHeaderToGitHubPaginationHeaders = S.transform(
  S.String,
  GitHubPaginationHeaders,
  {
    decode: (fromA, fromI) =>
      pipe(
        fromA,
        String.split(","),
        (xs) => ({
          first: A.findFirst(xs, String.includes("rel=\"first\"")),
          last: A.findFirst(xs, String.includes("rel=\"last\"")),
          next: A.findFirst(xs, String.includes("rel=\"next\"")),
          prev: A.findFirst(xs, String.includes("rel=\"prev\""))
        })
      ),
    encode(toI, toA) {
      return ""
    }
  }
)

export const GitHubHeaders = S.Struct({
  link: S.optional(LinkHeaderToGitHubPaginationHeaders)
})
