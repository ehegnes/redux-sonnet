import { combineReducers, combineSlices, createSlice, isAnyOf } from "@reduxjs/toolkit"
import { pipe } from "effect"
import * as Cause from "effect/Cause"
import * as O from "effect/Option"
import * as R from "effect/Record"
import * as A from "effect/Array"
import * as Struct from "effect/Struct"
import { REPO, RESET_ERROR_MESSAGE, STARGAZERS, STARRED, USER } from "../actions.js"
import type { User } from '../models/user.js'
import type { Repo } from '../models/repo.js'
import { ParseError } from "effect/ParseResult"

export interface Entities {
  users: Record<string, User>
  repos: Record<string, Repo>
}

const initialState: Entities = {
  users: R.empty(),
  repos: R.empty(),
}

/**
 * TODO
 * ----
 * - add utility fn for union evolution
 */
const mergeUsers = flow(
  ()
)

export const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addMatcher(isAnyOf(USER.fulfilled, STARGAZERS.fulfilled), (state, { payload }) => pipe(
          A.ensure(payload),
          (xs) => R.fromIterableBy(xs, (x) => x.login),
          (a) => Struct.evolve(state, {
            users: (x) => R.union(x, a, (_a, b) => b)
          })
        )
      )
      .addMatcher(
        isAnyOf(REPO.fulfilled, STARRED.fulfilled), (state, { payload }) => pipe(
          A.ensure(payload),
          (xs) => R.fromIterableBy(xs, (x) => x.full_name),
          (a) => Struct.evolve(state, {
            repos: (x) => R.union(x, a, (_a, b) => b)
          })
        )
      )
})

const errorSlice = createSlice({
  name: "error",
  initialState: O.none<string>,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addMatcher(RESET_ERROR_MESSAGE.match, O.none)
      .addDefaultCase((state, action) => {
        if ("payload" in action && (Cause.isCause(action.payload) || action.payload instanceof Error)) {
          console.info("CAUGHT ERROR")
          if (action.payload instanceof Error) {
            return pipe(
              action.payload,
              Cause.die,
              Cause.pretty,
              O.some
            )
          }
          return pipe(action.payload, Cause.pretty, O.some)
        }

        console.log(action)

        return state
      }),
})

export const rootReducer = combineSlices(entitiesSlice, errorSlice)

export type RootState = ReturnType<typeof rootReducer>
