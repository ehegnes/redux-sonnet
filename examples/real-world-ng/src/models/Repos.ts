import * as S from "effect/Schema"
import { Repo } from "./Repo"

export const Repos = S.Array(Repo)
export type Repos = S.Schema.Type<typeof Repos>
