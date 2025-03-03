import { Layer, Scope } from "effect"
import { Sonnet } from "redux-sonnet"
import { rootReducer, RootState } from "../reducers/index.js"

import { FetchHttpClient } from "@effect/platform"
import { configureStore } from "@reduxjs/toolkit"
import { rootStanza } from "../sagas.js"

const createStore = (initialState: RootState | undefined = undefined) => {
  const sonnet = Sonnet.make(rootStanza, Sonnet.defaultLayer)

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: initialState,
    devTools: true,
    middleware: (getDefaultMiddleware) =>
      // TODO: understand how this impacts types and if we must force on/off ??
      getDefaultMiddleware({ thunk: true, serializableCheck: false }).concat(
        sonnet,
      ),
  })

  return store
}

type Store = ReturnType<typeof createStore>
export type AppDispatch = Store["dispatch"]

export { createStore }
