import "isomorphic-fetch"
import { String as ST, Effect, flow, Stream, Struct } from "effect"
import { Github, GithubError } from "./github.js"
import { apply } from "effect/Function"
import { ParseError } from "effect/ParseResult"
import { Repo, User } from "../models/index.js"

const structureFullName = flow(ST.split("/"), ([owner, repo]) => ({
  owner,
  repo,
}))

export const fetchUser = (
  username: string,
): Effect.Effect<User.User, ParseError | GithubError, Github> =>
  Github.pipe(
    Effect.andThen((_) => _.wrap((_) => _.users.getByUsername)),
    Effect.flatMap(apply({ username })),
    Effect.flatMap(User.decode)
  )

export const fetchRepo = (
  fullName: string,
): Effect.Effect<Repo.Repo, ParseError | GithubError, Github> =>
  Github.pipe(
    Effect.andThen((_) => _.wrap((_) => _.repos.get)),
    Effect.flatMap(apply(structureFullName(fullName))),
    Effect.flatMap(Repo.decode) 
  )

export const fetchStarred = Github.pipe(
  Effect.andThen((_) => _.wrap((_) => _.activity.listReposStarredByUser)),
)

export const fetchStarred$ = (
  username: string
): Stream.Stream<Repo.Repo, GithubError | ParseError, Github> =>
  Github.pipe(
    Effect.andThen((_) =>
      _.stream((_, page) =>
        _.activity.listReposStarredByUser({ username, page }).then(
          Struct.evolve({ data: (xs) => xs.map(Repo.decode), }),
        )
      ),
    ),
    Effect.map(Stream.flattenEffect({ concurrency: "unbounded" })),
    Stream.unwrap
  )

export const fetchStargazers = Github.pipe(
  Effect.andThen((_) => _.wrap((_) => _.activity.listStargazersForRepo)),
)

export const fetchStargazers$ = (
  fullName: string
): Stream.Stream<User.User, ParseError | GithubError, Github> =>
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
              data: (xs) => xs.map(User.decode)
            }),
          ),
      ),
    ),
    Effect.map(Stream.flattenEffect({ concurrency: "unbounded" })),
    Stream.unwrap,
  )
