import { createAction } from "@reduxjs/toolkit"
import { Actions } from "redux-sonnet/src"
import type { User } from "../services/api"

export const USER = Actions.make("USER")<unknown, User, void>()
export const REPO = Actions.make("REPO")<unknown, unknown, unknown>()
export const STARRED = Actions.make("STARRED")<unknown, unknown, unknown>()
export const STARGAZERS = Actions.make("STARGAZERS")<unknown, unknown, unknown>()

export const UPDATE_ROUTER_STATE = createAction<{
  pathname: string
  params: unknown
}>("UPDATE_ROUTER_STATE")

export const NAVIGATE = createAction<{ pathname: string }>("NAVIGATE")
export const LOAD_USER_PAGE = createAction<
  { login: unknown; requiredFields: Array<unknown> }
>("LOAD_USER_PAGE")
export const LOAD_REPO_PAGE = createAction<
  { fullName: string; requiredFields: Array<unknown> }
>("LOAD_REPO_PAGE")
export const LOAD_MORE_STARRED = createAction<{ login: string }>(
  "LOAD_MORE_STARRED"
)
export const LOAD_MORE_STARGAZERS = createAction<{ fullName: string }>(
  "LOAD_MORE_STARGAZERS"
)
export const RESET_ERROR_MESSAGE = createAction<void>("RESET_ERROR_MESSAGE")
