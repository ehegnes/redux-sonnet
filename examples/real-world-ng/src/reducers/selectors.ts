import { createSelector, type Selector } from "@reduxjs/toolkit"
import { identity } from "effect/Function"
import type * as O from "effect/Option"
import * as R from "effect/Record"
import type { Repo, User } from "../services/api.js"
import type { RootState } from "./index.js"

export const getStarredByUser = (state, login) =>
  state.pagination.starredByUser[login] || {}
export const getStargazersByRepo = (state, fullName) =>
  state.pagination.stargazersByRepo[fullName] || {}
const selectEntities = (state: RootState) => state.entities

export const getUser: Selector<RootState, O.Option<User>, [string]> =
  createSelector(
    [selectEntities, (_, login: string) => login],
    (entities, login) => R.get(entities.users, login)
  )

const selectItemIndex: Selector<RootState, number, [string]> = createSelector(
  [selectEntities, (_, itemName: string) => itemName],
  (items, itemName) => items.indexOf(itemName)
)

// export const getRepo = (state, fullName) => state.entities.repos[fullName]
export const getRepo: (
  fullName: string
) => Selector<RootState, O.Option<Repo>> = (fullName) =>
  createSelector(
    (state: RootState) => state.entities,
    (entities) => R.get(entities.repos, fullName)
  )

export const selectErrorMessage = createSelector(
  (state: RootState) => state.error,
  identity<O.Option<string>>
)