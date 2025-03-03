import type { Octokit } from "@octokit/rest"
import type { GetResponseDataTypeFromEndpointMethod } from "@octokit/types/dist-types/GetResponseTypeFromEndpointMethod.js"

export type User = GetResponseDataTypeFromEndpointMethod<
  InstanceType<typeof Octokit>["users"]["getByUsername"]
>

export type Repo = GetResponseDataTypeFromEndpointMethod<
  InstanceType<typeof Octokit>["repos"]["get"]
>
