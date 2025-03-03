import { createAction } from "@reduxjs/toolkit"
import { Actions } from "redux-sonnet"
import type { User } from "./models/user.js"
import type { Repo } from "./models/repo.js"
import { GithubError } from "./services/github.js"
import { ParseError } from "effect/ParseResult"
import { NoSuchElementException } from "effect/Cause"

export const USER = Actions.make("USER")<string, User, ParseError | GithubError>()
export const REPO = Actions.make("REPO")<
  { owner: string; repo: string },
  Repo,
  GithubError
>()
export const STARRED = Actions.make("STARRED")<string, Repo[], ParseError | GithubError | NoSuchElementException>()
export const STARGAZERS = Actions.make("STARGAZERS")<unknown, User[], unknown>()

export const NAVIGATE = createAction<{ pathname: string }>("NAVIGATE")
export const LOAD_USER_PAGE = createAction<string>("LOAD_USER_PAGE")
export const LOAD_REPO_PAGE = createAction<{
  owner: string
  repo: string
}>("LOAD_REPO_PAGE")
export const LOAD_MORE_STARRED = createAction<string>("LOAD_MORE_STARRED")
export const LOAD_MORE_STARGAZERS = createAction<{ fullName: string }>(
  "LOAD_MORE_STARGAZERS",
)
export const RESET_ERROR_MESSAGE = createAction<void>("RESET_ERROR_MESSAGE")
