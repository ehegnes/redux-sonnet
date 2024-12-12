---
title: Operators.ts
description: This module provides utility for working `Stream`-based Redux interactions.It includes analogues to Redux Saga helper functions.
sidebar:
  order: 3
tableOfContents:
  minHeadingLevel: 1
---

This module provides utility for working `Stream`-based Redux interactions.
It includes analogues to Redux Saga helper functions.

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# utils

## isAction

A re-export of `isAction` from `redux` typed with `Predicate.Refinement`.

**Signature**

```ts
export declare const isAction: Predicate.Refinement<unknown, Action<string>>
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## ofType

Filter by virtue of `Action.type` matching the given `string`.

**Signature**

```ts
export declare const ofType: <T extends string>(
  type: T
) => Predicate.Refinement<unknown, Action<T>>
```

**Example**

```ts twoslash
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="effect" />
/// <reference types="@reduxjs/toolkit" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as assert from "node:assert"
// ---cut---
import { Stream } from "effect"
import { Operators } from "redux-sonnet"

const actions = Stream.make({ type: "A1" }, { type: "A2" }, { type: "A3" })

const filtered = actions.pipe(Stream.filter(Operators.ofType("A2")))

// Effect.runPromise(Stream.runCollect(filtered)).then(console.log)
// { _id: 'Chunk', values: [ { type: "A2"} ] }
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## put

Dispatch an `Action` to the Redux store.

**Signature**

```ts
export declare const put: <A extends Action>(
  self: A
) => Effect.Effect<string, never, SonnetService>
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## select

Select latest state from Redux given some selector.

**Signature**

```ts
export declare const select: <
  State,
  Result,
  Params extends Array<unknown> = []
>(
  selector?: Selector<State, Result, Params> | undefined,
  ...params: [Params] extends [never] ? [] : Params
) => Effect.Effect<Result, never, SonnetService>
```

**Example**

```ts twoslash
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="effect" />
/// <reference types="@reduxjs/toolkit" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as assert from "node:assert"
// ---cut---
import { Effect } from "effect"
import * as Operators from "redux-sonnet/Operators"

interface State {
  x: number
}

declare const selectX: (_: State) => State["x"]

const program = Effect.gen(function*() {
  const x = yield* Operators.select(selectX)
})
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## takeChannel

Take first from a channel matching the given predicate.

**Signature**

```ts
export declare const takeChannel:
  & (<T>(
    pred: Predicate.Predicate<T>
  ) => (
    channel: Channel.Channel<
      Chunk.Chunk<T>,
      unknown,
      never,
      unknown,
      void,
      unknown
    >
  ) => Effect.Effect<Option.Option<T>, never, never>)
  & (<T>(
    channel: Channel.Channel<
      Chunk.Chunk<T>,
      unknown,
      never,
      unknown,
      void,
      unknown
    >,
    pred: Predicate.Predicate<T>
  ) => Effect.Effect<Option.Option<T>, never, never>)
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## takeEvery

TODO: needs consideration of halting vs interruption behavior

**Signature**

```ts
export declare const takeEvery: <Params extends Array<unknown>>(
  pred: Predicate.Predicate<Action>,
  effect: (
    action: Action,
    ...params: Params
  ) => Effect.Effect<void, never, never>,
  ...params: Params
) => Effect.Effect<RuntimeFiber<void, never>, never, SonnetService>
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## takeFrom

God only knows!

**Signature**

```ts
export declare const takeFrom: {
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
  ): (source: Queue.Queue<T>) => Effect.Effect<Option.Option<T>, never, never>
} & {
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
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## takeMaybe

Maybe take a single `Action` matching the given predicate.

**Note**: This blocks generator execution until the given predicate is matched.

**Signature**

```ts
export declare const takeMaybe: (
  pred: Predicate.Predicate<Action>
) => Effect.Effect<Option.Option<Action>, never, SonnetService>
```

**Example**

```ts twoslash
/// <reference types="effect" />
/// <reference types="@reduxjs/toolkit" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as assert from "node:assert"
// ---cut---
import * as Op from "redux-sonnet/Operators"

const result = Op.takeMaybe(Op.ofType("ACTION"))
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## unsafeTake

Take a single `Action` matching the given predicate.

**Warning:** This will throw an error if the chunk is empty.

**Signature**

```ts
export declare const unsafeTake: (
  pred: Predicate.Predicate<Action>
) => Effect.Effect<Action, never, SonnetService>
```

**Example**

```ts twoslash
/// <reference types="effect" />
/// <reference types="@reduxjs/toolkit" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as assert from "node:assert"
// ---cut---
import * as Op from "redux-sonnet/Operators"

const result = Op.unsafeTake(Op.ofType("ACTION"))
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_
