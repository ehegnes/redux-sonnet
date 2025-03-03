import type { TypedUseSelectorHook } from "react-redux"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "../reducers/index.js"
import type { AppDispatch } from "./store.js"
import { createSelector } from "@reduxjs/toolkit"

export const useAppDispatch = useDispatch<AppDispatch>
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const createAppSelector = createSelector.withTypes<RootState>()
