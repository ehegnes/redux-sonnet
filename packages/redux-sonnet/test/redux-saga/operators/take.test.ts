import { applyMiddleware, legacy_createStore as createStore } from "redux"

import { describe, expect, it } from "@effect/vitest"
// import deferred from "@redux-saga/deferred"
import { Exit, Queue, Stream } from "effect"
import {
  Channel,
  Chunk,
  Effect,
  Either,
  Fiber,
  Option,
  Predicate,
  PubSub
} from "effect"
import type { Action } from "redux"
import { Operators as Op, Sonnet } from "redux-sonnet"

/**
 * @see https://github.com/redux-saga/redux-saga/blob/9a6210bf891d3d74d4bab8d0f55c171e3c68355e/packages/core/__tests__/interpreter/take.js
 */
describe("take", () => {
  it.skip("saga take from default channel", async ({ expect }) => {
    const typeSymbol = Symbol("action-symbol")
    const actual: Array<Action> = []

    const genFn = Effect.gen(function*() {
      try {
        actual.push(yield* Op.unsafeTake(Predicate.isUnknown)) // take all actions

        console.log("took unsafe 1")

        actual.push(yield* Op.unsafeTake(Op.ofType("action-1"))) // take only actions of type 'action-1'

        console.log("took unsafe 2")

        actual.push(
          yield* Op.unsafeTake(Predicate.or(
            Op.ofType("action-2"),
            Op.ofType("action-2222")
          ))
        ) // take either type

        console.log("took unsafe 3")

        actual.push(
          yield* Op.unsafeTake(
            (a) => Predicate.hasProperty(a, "isAction") && Boolean(a.isAction)
          )
        ) // take if match predicate

        console.log("took unsafe 4")

        const matchMixed = Predicate.or(
          Op.ofType("action-3"),
          (a) =>
            Predicate.hasProperty(a, "isMixedWithPredicate") &&
            Boolean(a.isMixedWithPredicate)
        )

        console.log("took unsafe 5")

        actual.push(yield* Op.unsafeTake(matchMixed)) // take if match any from the mixed array
        actual.push(yield* Op.unsafeTake(matchMixed)) // take if match any from the mixed array

        console.log("took unsafe 6 & 7")

        actual.push(
          // yield* Op.unsafeTake((x) => Predicate.isSymbol(x) && x === typeSymbol)
          yield* Op.unsafeTake((x) => x.type === typeSymbol.toString())
        ) // take only actions of a Symbol type

        console.log("took unsafe 8")

        actual.push(yield* Op.unsafeTake(Op.ofType("never-happening-action"))) //  should get END

        console.log("took unsafe 9")
        // TODO: never-happening-action replaced with such case is not working
        // END is not handled properly on channels?
        // const chan = channel()
        // actual.push( yield io.take(chan) ) //  should get END
      } finally {
        actual.push("auto ended" as unknown as Action)
      }
    })

    const middleware = Sonnet.make(genFn, Sonnet.defaultLayer)
    const store = applyMiddleware(middleware)(createStore)(() => {})

    const task = middleware.fiber
    const expected = [
      {
        type: "action-*"
      },
      {
        type: "action-1"
      },
      {
        type: "action-2"
      },
      {
        type: "",
        isAction: true
      },
      {
        type: "",
        isMixedWithPredicate: true
      },
      {
        type: "action-3"
      },
      {
        type: typeSymbol
      },
      "auto ended"
    ]

    setTimeout(() =>
      store.dispatch({
        type: "action-*"
      }), 0)
    setTimeout(() =>
      store.dispatch({
        type: "action-1"
      }), 0)
    setTimeout(() =>
      store.dispatch({
        type: "action-2"
      }), 0)
    setTimeout(() =>
      store.dispatch({
        type: "unnoticeable-action"
      }), 0)
    setTimeout(() =>
      store.dispatch({
        type: "",
        isAction: true
      }), 0)
    setTimeout(() =>
      store.dispatch({
        type: "",
        isMixedWithPredicate: true
      }), 0)
    setTimeout(() =>
      store.dispatch({
        type: "action-3"
      }), 0)
    setTimeout(() =>
      store.dispatch({
        // XXX: this shouldn't have to be cast to a string
        type: typeSymbol.toString()
      }), 0)
    // .then(() =>
    //  store.dispatch({
    //    ...END,
    //    timestamp: Date.now()
    //  })
    // ) // see #316
    // saga must fulfill take Effects from default channel

    await Effect.runPromise(Fiber.join(task))

    expect(actual).toEqual(expected)
  })

  /**
   * @see https://github.com/redux-saga/redux-saga/blob/01f425c/packages/core/__tests__/interpreter/take.js#L120
   * XXX: This scenario underscores the importance of understanding how
   *      channel/stream termination impacts blocking behavior.
   */
  it.scoped.skip("saga take from provided channel", () =>
    Effect.gen(function*() {
      const queue = yield* Queue.bounded<
        Either.Either<Chunk.Chunk<number>, Exit.Exit<unknown, never>>
      >(8)

      const chan = Channel.fromQueue(queue).pipe(
        Channel.ensuringWith((exit) => Effect.log("Exit:", exit))
      )

      const actual: Array<unknown> = []

      const genFn = Effect.gen(function*() {
        actual.push(yield* Op.takeFrom(chan, Predicate.isUnknown))
        actual.push(yield* Op.takeFrom(chan, Predicate.isUnknown))
        actual.push(yield* Op.takeFrom(chan, Predicate.isUnknown))
        actual.push(yield* Op.takeFrom(chan, Predicate.isUnknown))
        actual.push(yield* Op.takeFrom(chan, Predicate.isUnknown))
        actual.push(yield* Op.takeFrom(chan, Predicate.isUnknown))
      })

      const middleware = Sonnet.make(genFn, Sonnet.defaultLayer)
      applyMiddleware(middleware)(createStore)(() => {})

      const task = middleware.fiber
      const expected = [1, 2, 3, 4].map(Option.some).concat(
        new Array(2).fill(0).map(Option.none)
      )

      return Promise.resolve()
        /**
         * fill
         */
        .then(() =>
          Effect.runSync(Queue.offer(queue, Either.right(Chunk.of(1))))
        )
        .then(() =>
          Effect.runPromise(Queue.offer(queue, Either.right(Chunk.of(2))))
        )
        .then(() =>
          Effect.runPromise(Queue.offer(queue, Either.right(Chunk.of(3))))
        )
        .then(() =>
          Effect.runPromise(Queue.offer(queue, Either.right(Chunk.of(4))))
        )
        /**
         * shutdown
         */
        // .then(() => Effect.runPromise(Queue.shutdown(queue)))
        .then(() =>
          Effect.runPromise(Queue.offer(queue, Either.left(Exit.void)))
        )
        // .then(() =>
        //   Effect.runPromise(Queue.offer(queue, Either.left(Exit.void)))
        // )
        // .then(() =>
        //   Effect.runPromise(Queue.offer(queue, Either.right(Chunk.of(5))))
        // )
        /**
         * await saga finalization
         */
        .then(() => Effect.runPromise(Fiber.join(task)))
        .then(() =>
          Effect.runPromise(Queue.offer(queue, Either.left(Exit.void)))
        )
        // test
        .then(() => {
          // saga must fulfill take Effects from a provided channel
          expect(actual).toEqual(expected)
        })
    }))

  /**
   * @see https://github.com/redux-saga/redux-saga/blob/01f425c/packages/core/__tests__/interpreter/take.js#L120
   *
   * **NOTE:** `eventChannel` is replaced by core Effect usage.
   */
  it("saga take from eventChannel", () => {
    const em = mitt.default()
    const error = new Error("ERROR")
    // const chan = eventChannel((emit) => {
    //   em.on("*", emit)
    //   return () => em.off("*", emit)
    // })

    const chan = Stream.async((emit) => {
      em.on("*", (msg) => emit(Effect.succeed(Chunk.of(msg))))
    }).pipe(
      Stream.concat(Stream.finalizer(Effect.sync(() => em.off("*")))),
      Stream.toChannel
    )

    const actual: Array<Option.Option<unknown>> = []

    const genFn = Effect.gen(function*() {
      try {
        actual.push(yield* Op.takeChannel(chan, Predicate.isUnknown))
        // actual.push(yield* Op.takeChannel(chan, Predicate.isUnknown))
        // actual.push(yield* Op.takeChannel(chan, Predicate.isUnknown))
      } catch (e) {
        actual.push(Option.some("in-catch-block"))
        actual.push(Option.some(e))
      }
    })

    const middleware = Sonnet.make(genFn, Sonnet.defaultLayer)
    applyMiddleware(middleware)(createStore)(() => {})

    const task = middleware.fiber
    const expected = ["action-1", "action-2", "in-catch-block", error]
    return Promise.resolve()
      .then(() => em.emit("action-1"))
      .then(() => em.emit("action-2"))
      .then(() => em.emit(error as unknown as any))
      .then(() => em.emit("action-after-error"))
      .then(() => Effect.runPromise(Fiber.join(task)))
      .then(() => {
        // saga must take payloads from the eventChannel, and errors from eventChannel will make the saga jump to the catch block
        expect(actual).toEqual(expected)
      })
  })
})
