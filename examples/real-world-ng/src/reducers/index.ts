import { combineReducers, combineSlices, createSlice } from "@reduxjs/toolkit"
import { pipe } from "effect"
import * as Cause from "effect/Cause"
import * as O from "effect/Option"
import * as R from "effect/Record"
import * as Struct from "effect/Struct"
import { REPO, RESET_ERROR_MESSAGE, USER } from "../actions.js"
import type { Repo, User } from "../models.js"

export interface Entities {
  users: Record<number, User>
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
export const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(USER.fulfilled, (state, { payload }) =>
        Struct.evolve(state, {
          users: (x) => R.union(x, { [payload.id]: payload }, (_a, b) => b),
        }),
      )
      .addCase(REPO.fulfilled, (state, { payload }) =>
        Struct.evolve(state, {
          repos: (x) =>
            R.union(x, { [payload.full_name]: payload }, (_a, b) => b),
        }),
      ),
})

const errorSlice = createSlice({
  name: "error",
  initialState: O.none<string>,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addMatcher(RESET_ERROR_MESSAGE.match, O.none)
      .addDefaultCase((state, action) => {
        if ("payload" in action && Cause.isCause(action.payload)) {
          return pipe(action.payload, Cause.pretty, O.some)
        }

        return state
      }),
})

export const rootReducer = combineSlices(entitiesSlice, errorSlice)

export type RootState = ReturnType<typeof rootReducer>
