import { Effect } from "effect"
import { dual } from "effect/Function"
import type * as Actions from "../Actions.js"

/**
 * Gates a type T such that it cannot be `never`, `void`, or `undefined`.
 * @internal
 */
export type Defined<T> = [T] extends [never] | [undefined] | [void] ? never
  : T

export const match: {
  <P extends string, A, E>(
    action: Actions.AsyncActionSetWithPayload<P, any, A, E>
  ): <R = never>(
    self: Effect.Effect<Defined<A>, Defined<E>, R>
  ) => Effect.Effect<
    | ReturnType<
      Actions.AsyncActionSetWithPayload<
        P,
        any,
        Defined<A>,
        Defined<E>
      >["fulfilled"]
    >
    | ReturnType<
      Actions.AsyncActionSetWithPayload<
        P,
        any,
        Defined<A>,
        Defined<E>
      >["rejected"]
    >,
    never,
    R
  >
  <P extends string, A, E, R = never>(
    self: Effect.Effect<Defined<A>, Defined<E>, R>,
    action: Actions.AsyncActionSetWithPayload<P, any, A, E>
  ): Effect.Effect<
    | ReturnType<
      Actions.AsyncActionSetWithPayload<
        P,
        any,
        Defined<A>,
        Defined<E>
      >["fulfilled"]
    >
    | ReturnType<
      Actions.AsyncActionSetWithPayload<
        P,
        any,
        Defined<A>,
        Defined<E>
      >["rejected"]
    >,
    never,
    R
  >
} = dual<
  <P extends string, A, E>(
    action: Actions.AsyncActionSetWithPayload<P, any, A, E>
  ) => <R = never>(
    self: Effect.Effect<Defined<A>, Defined<E>, R>
  ) => Effect.Effect<
    | ReturnType<
      Actions.AsyncActionSetWithPayload<
        P,
        any,
        Defined<A>,
        Defined<E>
      >["fulfilled"]
    >
    | ReturnType<
      Actions.AsyncActionSetWithPayload<
        P,
        any,
        Defined<A>,
        Defined<E>
      >["rejected"]
    >,
    never,
    R
  >,
  <P extends string, A, E, R = never>(
    self: Effect.Effect<Defined<A>, Defined<E>, R>,
    action: Actions.AsyncActionSetWithPayload<P, any, A, E>
  ) => Effect.Effect<
    | ReturnType<
      Actions.AsyncActionSetWithPayload<
        P,
        any,
        Defined<A>,
        Defined<E>
      >["fulfilled"]
    >
    | ReturnType<
      Actions.AsyncActionSetWithPayload<
        P,
        any,
        Defined<A>,
        Defined<E>
      >["rejected"]
    >,
    never,
    R
  >
>(2, (self, action) =>
  Effect.match(self, {
    onFailure: action.rejected,
    onSuccess: action.fulfilled
  }))
