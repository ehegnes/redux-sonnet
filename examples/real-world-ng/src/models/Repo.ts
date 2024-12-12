import * as S from "effect/Schema"

export const Repo = S.Struct({
  // 'fullName' is 'idAttribute'
  fullName: S.String
})
export type Repo = S.Schema.Type<typeof Repo>
