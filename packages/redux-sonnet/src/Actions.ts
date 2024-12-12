/**
 * This module provides utility for creating custom Redux actions.
 *
 * @since 0.0.0
 */

import type { PayloadActionCreator } from "@reduxjs/toolkit"
import { createAction } from "@reduxjs/toolkit"

/**
 * @since 0.0.0
 * @category models
 */
export interface AsyncActionSet<
  Prefix extends string,
  TriggerPayload = void,
  FulfilledPayload = void,
  RejectedPayload = void
> {
  trigger: PayloadActionCreator<TriggerPayload, `${Prefix}/trigger`>
  fulfilled: PayloadActionCreator<FulfilledPayload, `${Prefix}/fulfilled`>
  rejected: PayloadActionCreator<RejectedPayload, `${Prefix}/rejected`>
}

type B = AsyncActionSet<"HELLO", void, void, void>

type C = B["fulfilled"]

/**
 * Constructs trigger, fulfillment, and rejection actions based on a prefix.
 *
 * @example
 * ```
 * import * as Actions from "redux-sonnet/Actions"
 *
 * const {
 *   trigger,
 *   fulfilled,
 *   rejected,
 * } = Actions.make("increment")<void, void, never>()
 *
 * assert.strictEqual(trigger.type, "increment/trigger")
 * assert.strictEqual(fulfilled.type, "increment/fulfilled")
 * assert.strictEqual(rejected.type, "increment/rejected")
 * ```
 *
 * @since 0.0.0
 * @category constructors
 */
export const make = <
  Prefix extends string
>(prefix: Prefix) =>
<
  TriggerPayload = void,
  FulfilledPayload = void,
  RejectedPayload = void
>(): AsyncActionSet<
  Prefix,
  TriggerPayload,
  FulfilledPayload,
  RejectedPayload
> => ({
  trigger: createAction(`${prefix}/trigger`),
  fulfilled: createAction(`${prefix}/fulfilled`),
  rejected: createAction(`${prefix}/rejected`)
})
