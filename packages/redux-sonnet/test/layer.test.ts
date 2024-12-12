import { assert, describe, it } from "@effect/vitest"
import { Effect, Fiber, Layer, ManagedRuntime, pipe } from "effect"
import { Sonnet } from "redux-sonnet"

describe("layer", () => {
  it("memoizes layer across builds", async () => {
    let count = 0
    const layer = Layer.effectDiscard(Effect.sync(() => {
      count++
    }))
    const runtimeA = ManagedRuntime.make(layer)
    const runtimeB = Sonnet.make(
      Effect.void,
      Layer.mergeAll(
        layer,
        Sonnet.defaultLayer
      ),
      runtimeA.memoMap
    )
    await runtimeA.runPromise(Effect.void)
    await pipe(
      runtimeB.fiber,
      Fiber.await,
      Effect.asVoid,
      Effect.runPromise
    )
    await runtimeA.dispose()
    await runtimeB.runtime.dispose()
    assert.strictEqual(count, 1)
  })
})
