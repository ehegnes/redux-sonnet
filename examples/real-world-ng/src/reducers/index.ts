import { combineReducers, combineSlices, createSlice } from "@reduxjs/toolkit"
import { pipe } from "effect"
import * as Cause from "effect/Cause"
import * as O from "effect/Option"
import * as R from "effect/Record"
import * as Struct from "effect/Struct"
import * as Actions from "../actions/index.js"
import type { Repo } from "../models/Repo.js"
import type { User } from "../models/User.js"
import paginate from "./paginate"

export interface State {
  users: Record<string, User>
  repos: Record<string, Repo>
}

const initialState: State = {
  users: R.empty(),
  repos: R.empty()
}

export const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(Actions.USER.fulfilled, (state, { payload }) =>
        Struct.evolve(state, {
          users: (x) =>
            R.union(x, { [payload.id]: payload }, (_a, b) => b)
        }))
      .addCase(Actions.REPO.fulfilled, (state, { payload }) =>
        Struct.evolve(state, {
          repos: (x) =>
            R.union(x, { [payload.id]: payload }, (_a, b) =>
              b)
        }))
})

//// Updates an entity cache in response to any action with response.entities.
// function entities(state: State = { users: {}, repos: {} }, action: Action) {
//  if (action.response && action.response.entities) {
//
//    return R.union({}, state, action.response.entities, (x, y) => y)
//  }
//
//  return state
// }

const errorSlice = createSlice({
  name: "error",
  initialState: O.none<string>,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addMatcher(
        Actions.RESET_ERROR_MESSAGE.match,
        O.none
      )
      .addDefaultCase((state, action) => {
        if ("payload" in action && Cause.isCause(action.payload)) {
          return pipe(
            action.payload,
            Cause.pretty,
            O.some
          )
        }

        return state
      })
})

// Updates the pagination data for different actions.
const pagination = combineReducers({
  starredByUser: paginate({
    mapActionToKey: (action) => action.login,
    types: [
      ActionTypes.STARRED.REQUEST,
      ActionTypes.STARRED.SUCCESS,
      ActionTypes.STARRED.FAILURE
    ]
  }),
  stargazersByRepo: paginate({
    mapActionToKey: (action) => action.fullName,
    types: [
      ActionTypes.STARGAZERS.REQUEST,
      ActionTypes.STARGAZERS.SUCCESS,
      ActionTypes.STARGAZERS.FAILURE
    ]
  })
})

function router(state = { pathname: "/" }, action) {
  switch (action.type) {
    case ActionTypes.UPDATE_ROUTER_STATE:
      return action.state
    default:
      return state
  }
}

export const rootReducer = combineSlices(
  entitiesSlice,
  errorSlice,
  {
    pagination,
    router
  }
)

export type RootState = ReturnType<typeof rootReducer>
