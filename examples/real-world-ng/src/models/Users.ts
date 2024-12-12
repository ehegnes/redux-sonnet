import * as S from "effect/Schema"
import { User } from "./User"

export const Users = S.Array(User)
export type Users = S.Schema.Type<typeof Users>
