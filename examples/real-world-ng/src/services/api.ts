import "isomorphic-fetch"
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse
} from "@effect/platform"
import { Array as A, Effect, flow, pipe, Tuple as T } from "effect"
import { GitHubHeaders } from "../models/GitHubPaginationHeaders"
import { Repo } from "../models/Repo"
import { User } from "../models/User"
import { Users } from "../models/Users"

// Extracts the next page URL from Github API response.
function getNextPageUrl(response) {
  const link = response.headers.get("link")
  if (!link) {
    return null
  }

  const nextLink = link.split(",").find((s) => s.indexOf("rel=\"next\"") > -1)
  if (!nextLink) {
    return null
  }

  return nextLink.split(";")[0].slice(1, -1)
}

const API_ROOT = new URL(`http://localhost:${VITE_PORT}/api/`)
const GitHubClient = HttpClientRequest.get(API_ROOT)

// Fetches an API response and normalizes the result JSON according to schema.
// This makes every API response have the same shape, regardless of how nested it was.
// function callApi(endpoint, schema) {
//  const fullUrl = endpoint.indexOf(API_ROOT) === -1 ? API_ROOT + endpoint : endpoint
//
//  return fetch(fullUrl)
//    .then((response) => response.json().then((json) => ({ json, response })))
//    .then(({ json, response }) => {
//      if (!response.ok) {
//        return Promise.reject(json)
//      }
//
//      const camelizedJson = camelizeKeys(json)
//      const nextPageUrl = getNextPageUrl(response)
//
//      return Object.assign({}, normalize(camelizedJson, schema), { nextPageUrl })
//    })
//    .then(
//      (response) => ({ response }),
//      (error) => ({ error: error.message || 'Something bad happened' }),
//    )
// }

// We use this Normalizr schemas to transform API responses from a nested form
// to a flat form where repos and users are placed in `entities`, and nested
// JSON objects are replaced with their IDs. This is very convenient for
// consumption by reducers, because we can easily build a normalized tree
// and keep it updated as we fetch more data.

// Read more about Normalizr: https://github.com/gaearon/normalizr

// Schemas for Github API responses.
// const userSchema = new schema.Entity('users', {
//  idAttribute: 'login',
// })

// const repoSchema = new schema.Entity('repos', {
//  idAttribute: 'fullName',
// })

// repoSchema.define({
//  owner: userSchema,
// })

// const userSchemaArray = new schema.Array(userSchema)

// const repoSchemaArray = new schema.Array(repoSchema)

// api services
// export const fetchUser = (login) => callApi(`users/${login}`, userSchema)
export const fetchUser = (login: string) =>
  pipe(
    GitHubClient,
    HttpClientRequest.appendUrl(`/users/${login}`),
    HttpClient.execute,
    Effect.flatMap(HttpClientResponse.schemaBodyJson(User))
    // Effect.catchTag('ParseError', () => Effect.succeed(0))
  )

// export const fetchRepo = (fullName) => callApi(`repos/${fullName}`, repoSchema)
export const fetchRepo = (fullName: string) =>
  pipe(
    GitHubClient,
    HttpClientRequest.appendUrl(`/repos/${fullName}`),
    HttpClient.execute,
    Effect.flatMap(HttpClientResponse.schemaBodyJson(Repo))
  )
export const fetchStarred = (url: string) =>
  pipe(
    GitHubClient,
    HttpClientRequest.appendUrl(url),
    HttpClient.execute,
    Effect.map(flow(A.replicate(2), T.make))
    // Effect.map(T.mapBoth({
    //  onFirst: (x) => HttpClientResponse.schemaHeaders(GitHubHeaders)(x),
    //  onSecond: (x) => HttpClientResponse.schemaBodyJson(Repo)(x),
    // })),
    // x =>
    // Effect.flatMap(Effect.allWith({ concurrency: 2, discard: false })),
    // x =>
    // Effect.flatMap(HttpClientResponse.schemaBodyJson(Repos)),
  )

export const fetchStargazers = (url: string) =>
  pipe(
    GitHubClient,
    HttpClientRequest.appendUrl(url),
    HttpClient.execute,
    Effect.flatMap(HttpClientResponse.schemaBodyJson(Users))
  )
