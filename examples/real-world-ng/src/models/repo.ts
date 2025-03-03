import type { Octokit } from "@octokit/rest"
import type { GetResponseDataTypeFromEndpointMethod } from "@octokit/types/dist-types/GetResponseTypeFromEndpointMethod.js"
import { flow } from "effect"
import * as S from "effect/Schema"
import { User } from "./user.js"

type ListReposStarredByUserResponse = GetResponseDataTypeFromEndpointMethod<
  InstanceType<typeof Octokit>["activity"]["listReposStarredByUser"]
>

type GetRepoResponse = GetResponseDataTypeFromEndpointMethod<
  InstanceType<typeof Octokit>["repos"]["get"]
>

const normalizeRepo = (_:
  | ListReposStarredByUserResponse[number]
  | GetRepoResponse
) => 'repo' in _ ? _.repo : _

export const Repo = S.Struct({
  id: S.Number,
  name: S.String,
  full_name: S.String,
  owner: User,
  description: S.OptionFromNullOr(S.String)
})
export type Repo = S.Schema.Type<typeof Repo>

export const decode = flow(
  normalizeRepo,
  S.decode(Repo, { onExcessProperty: "ignore" })
)