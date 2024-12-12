import type { Selector } from "@reduxjs/toolkit"
import type { Chunk } from "effect"
import {
  Channel,
  Effect,
  Match,
  Option,
  pipe,
  Predicate,
  Queue,
  Stream,
  Take
} from "effect"
import { dual } from "effect/Function"
import { type Action, isAction as _isAction } from "redux"
import { SonnetService } from "../Sonnet.js"

export const isAction: Predicate.Refinement<unknown, Action<string>> = _isAction

export const ofType = <T extends string>(
  type: T
): Predicate.Refinement<unknown, Action<T>> =>
  pipe(
    isAction,
    Predicate.compose<
      unknown,
      Action,
      Action<T>
    >((x: Action): x is Action<T> => x.type === type)
  )

export const identitySelector: Selector<any, any, any> = (state) => state

export const select = <State, Result, Params extends Array<unknown> = []>(
  selector: Selector<State, Result, Params> | undefined = identitySelector,
  ...params: [Params] extends [never] ? [] : Params
): Effect.Effect<Result, never, SonnetService> =>
  pipe(
    SonnetService,
    Effect.andThen(({ state }) =>
      pipe(
        state.ref,
        Effect.map((state) => selector(state, ...params))
      )
    )
  )

export const put = <A extends Action>(self: A) =>
  pipe(
    SonnetService,
    Effect.andThen(({ dispatch }) =>
      Queue.offer(dispatch.queue, Take.of(self))
    ),
    // XXX: this should propagate an error
    // XXX: should this return anything?
    Effect.as(self.type)
  )

export const unsafeTake = (
  pred: Predicate.Predicate<Action>
): Effect.Effect<Action, never, SonnetService> =>
  pipe(
    SonnetService,
    Effect.andThen(({ action }) =>
      pipe(
        action.stream,
        Stream.find(pred),
        Stream.runHead,
        Effect.map(Option.getOrThrow)
      )
    )
  )

export const take = (
  pred: Predicate.Predicate<Action>
): Effect.Effect<Option.Option<Action>, never, SonnetService> =>
  pipe(
    SonnetService,
    Effect.andThen(({ action }) =>
      pipe(
        action.stream,
        Stream.find(pred),
        Stream.runHead
      )
    )
  )

export const takeFrom = dual<
  {
    <T>(
      pred: Predicate.Predicate<T>
    ): (
      source: Stream.Stream<T, never, never>
    ) => Effect.Effect<Option.Option<T>, never, never>
    <T>(
      pred: Predicate.Predicate<T>
    ): (
      source: Channel.Channel<
        Chunk.Chunk<T>,
        unknown,
        never,
        unknown,
        void,
        unknown
      >
    ) => Effect.Effect<Option.Option<T>, never, never>
    <T>(
      pred: Predicate.Predicate<T>
    ): (
      source: Queue.Queue<T>
    ) => Effect.Effect<Option.Option<T>, never, never>
  },
  {
    <T>(
      source: Stream.Stream<T, never, never>,
      pred: Predicate.Predicate<T>
    ): Effect.Effect<Option.Option<T>, never, never>
    <T>(
      source: Channel.Channel<
        Chunk.Chunk<T>,
        unknown,
        never,
        unknown,
        void,
        unknown
      >,
      pred: Predicate.Predicate<T>
    ): Effect.Effect<Option.Option<T>, never, never>
    <T>(
      source: Queue.Queue<T>,
      pred: Predicate.Predicate<T>
    ): Effect.Effect<Option.Option<T>, never, never>
  }
>(
  2,
  <T>(
    source:
      | Stream.Stream<T, never, never>
      | Channel.Channel<Chunk.Chunk<T>, unknown, never, unknown, void, unknown>
      | Queue.Queue<T>,
    pred: Predicate.Predicate<T>
  ): Effect.Effect<Option.Option<T>, never, never> =>
    Match.value(source).pipe(
      Match.when(
        Queue.isQueue,
        (queue) =>
          pipe(
            Stream.fromQueue(queue as Queue.Queue<T>),
            Stream.find(pred),
            Stream.runHead
          )
      ),
      Match.when(
        Channel.isChannel,
        (channel) =>
          pipe(
            Stream.fromChannel(channel as Channel.Channel<Chunk.Chunk<T>>),
            Stream.find(pred),
            Stream.runHead
          )
      ),
      Match.when(
        (u: unknown): u is Stream.Stream<unknown, unknown, unknown> =>
          Predicate.hasProperty(u, Stream.StreamTypeId) || Effect.isEffect(u),
        (stream) =>
          pipe(
            stream,
            Stream.find(pred),
            Stream.runHead
          )
      ),
      Match.exhaustive
    )
)

export const takeEvery = <
  Params extends Array<unknown>
>(
  pred: Predicate.Predicate<Action>,
  effect: (
    action: Action,
    ...params: Params
  ) => Effect.Effect<void, never, never>,
  ...params: Params
) =>
  pipe(
    SonnetService,
    Effect.andThen(({ action: { stream } }) =>
      stream.pipe(
        Stream.filter(pred),
        Stream.runForEach((action) =>
          pipe(
            effect(action, ...params),
            Effect.andThen(() => Effect.log("EVERY"))
          )
        ),
        Effect.onInterrupt((fibers) => Effect.log("Cleanup completed", fibers)),
        Effect.fork
      )
    )
  )
