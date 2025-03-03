import "isomorphic-fetch"
import { String as ST, Effect, flow, Stream, Struct } from "effect"
import { Github, GithubError } from "./github.js"
import { apply } from "effect/Function"
import { Repo, User } from "../models.js"

const structureFullName = flow(ST.split("/"), ([owner, repo]) => ({
  owner,
  repo,
}))

export const fetchUser = (
  username: string,
): Effect.Effect<User, GithubError, Github> =>
  Github.pipe(
    Effect.andThen((_) => _.wrap((_) => _.users.getByUsername)),
    Effect.flatMap(apply({ username })),
  )

export const fetchRepo = (
  fullName: string,
): Effect.Effect<Repo, GithubError, Github> =>
  Github.pipe(
    Effect.andThen((_) => _.wrap((_) => _.repos.get)),
    Effect.flatMap(apply(structureFullName(fullName))),
  )

export const fetchStarred = Github.pipe(
  Effect.andThen((_) => _.wrap((_) => _.activity.listReposStarredByUser)),
)

export const fetchStarred$ = (username: string) =>
  Github.pipe(
    Effect.andThen((_) =>
      _.stream((_, page) =>
        _.activity.listReposStarredByUser({ username, page }).then(
          Struct.evolve({
            data: (xs) => xs.map((x) => ("repo" in x ? x.repo : x)),
          }),
        ),
      ),
    ),
    Stream.unwrap,
  )

export const fetchStargazers = Github.pipe(
  Effect.andThen((_) => _.wrap((_) => _.activity.listStargazersForRepo)),
)

export const fetchStargazers$ = (fullName: string) =>
  Github.pipe(
    Effect.andThen((_) =>
      _.stream((_, page) =>
        _.activity
          .listStargazersForRepo({
            ...structureFullName(fullName),
            page,
          })
          .then(
            Struct.evolve({
              data: (xs) => xs.map((x) => ("user" in x ? x.user : x)),
            }),
          ),
      ),
    ),
    Stream.unwrap,
  )
