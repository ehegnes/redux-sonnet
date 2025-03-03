import { createSelector, type Selector } from "@reduxjs/toolkit"
import { identity, pipe } from "effect/Function"
import type * as O from "effect/Option"
import * as R from "effect/Record"
import type { RootState } from "./index.js"
import { createAppSelector } from "../store/hooks.js"
import { Repo } from "../models.js"

// slice selectors
const selectEntities = (state: RootState) => state.entities

// complex selectors
export const getStarredByUser = (state, login) =>
  state.pagination.starredByUser[login] || {}

export const selectStarredByUser = createAppSelector(
  [selectEntities, (_, login: string) => login],
  (entities, login) => pipe(entities.repos, R.get(login)),
)

export const getStargazersByRepo = (state, fullName) =>
  state.pagination.stargazersByRepo[fullName] || {}

export const selectUser = createAppSelector(
  [selectEntities, (_, login: string) => login],
  (entities, login) => R.get(entities.users, login),
)

const selectItemIndex: Selector<RootState, number, [string]> = createSelector(
  [selectEntities, (_, itemName: string) => itemName],
  (items, itemName) => items.indexOf(itemName),
)

export const selectRepo = createAppSelector(
  [selectEntities, (_, owner: string, repo: string) => ({ owner, repo })],
  (entities, { owner, repo }) => R.get(entities.repos, `${owner}/${repo}`),
)

export const selectErrorMessage = createSelector(
  (state: RootState) => state.error,
  identity<O.Option<string>>,
)
