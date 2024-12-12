import { Console, Effect, Layer } from "effect"
import { Middleware } from "redux-sonnet/src"
import { rootReducer, type RootState } from "../reducers"

import { FetchHttpClient } from "@effect/platform"
import type { Action } from "@reduxjs/toolkit"
import { configureStore } from "@reduxjs/toolkit"
import { rootSonnets } from "../sagas"

// TODO: type initial state (probably don't parameterize it?)
const createStore = (initialState: any) =>
  Effect.gen(function*() {
    yield* Effect.addFinalizer((exit) =>
      Console.log(`[configureStore] finalizer after ${exit._tag}`)
    )

    const { middleware, run } = Middleware.make(
      Layer.mergeAll(
        FetchHttpClient.layer,
        Middleware.layer({ capacity: 32 })
      )
    )

    const store = configureStore({
      reducer: rootReducer,
      preloadedState: initialState,
      devTools: true,
      middleware: (getDefaultMiddleware) =>
        // TODO: understand how this impacts types and if we must force on/off ??
        getDefaultMiddleware({ thunk: true })
          .concat(middleware)
    })

    run(rootSonnets)

    return store
  })

type Store = Effect.Effect.Success<ReturnType<typeof createStore>>
export type AppDispatch = Store["dispatch"]

export { createStore }
