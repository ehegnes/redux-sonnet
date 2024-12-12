import type { Reducer } from "redux"
import { __DO_NOT_USE__ActionTypes as actionTypes } from "redux"

export const arrayReducer: (arr: Array<unknown>) => Reducer =
  (arr) => (_, action) => arr.push(action)

export const INIT_ACTION = { type: actionTypes.INIT }
