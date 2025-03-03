import type { Octokit } from "@octokit/rest"
import type { GetResponseDataTypeFromEndpointMethod } from "@octokit/types/dist-types/GetResponseTypeFromEndpointMethod.js"
import { flow } from "effect"
import * as S from "effect/Schema"

type GetUserResponse = GetResponseDataTypeFromEndpointMethod<
  InstanceType<typeof Octokit>["users"]["getByUsername"]
>

type ListStargazersForRepoResponse = GetResponseDataTypeFromEndpointMethod<
  InstanceType<typeof Octokit>["activity"]["listStargazersForRepo"]
>

export const User = S.Struct({
  login: S.String,
  id: S.Number
})
export type User = S.Schema.Type<typeof User>

export const normalize = (_:
  | ListStargazersForRepoResponse[number]
  | GetUserResponse
) => 'user' in _ ? _.user : _

/**
 * XXX: For some silly reason, GitHub can return nullish for a user
 */
export const decode = flow(
  normalize,
  S.decode(User, { onExcessProperty: "ignore" })
)