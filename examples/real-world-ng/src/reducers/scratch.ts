import type { Selector } from "@reduxjs/toolkit"
import { createSelector } from "@reduxjs/toolkit"
import * as R from "effect/Record"
import type { RootState } from "."

// Input selectors:
const selectItems = (state: RootState) => state.entities
const selectItemName = (state: RootState, itemName: string) => itemName

// Create the selector and then annotate it:
const selectItemIndex: Selector<RootState, number, [string]> = createSelector(
  [selectItems, selectItemName],
  (items, itemName) => R.get(items, itemName)
)

// Usage:
const state: RootState = { items: ["apple", "banana", "cherry"] }
const index = selectItemIndex(state, "banana") // index = 1
