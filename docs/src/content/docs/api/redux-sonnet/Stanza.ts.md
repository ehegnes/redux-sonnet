---
title: Stanza.ts
description: This module provides the core Redux middleware for instantiating a Redux Sonnet.It includes analogues to `redux-observable`'s *Epics*.
sidebar:
  order: 5
tableOfContents:
  minHeadingLevel: 1
---

This module provides the core Redux middleware for instantiating a Redux Sonnet.
It includes analogues to `redux-observable`'s _Epics_.

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# constructors

## fromEffect

Construct a `Stanza` from an `Effect` such that the output dispatches to Redux.

**Signature**

```ts
export declare const fromEffect: <R>(
  self: Effect.Effect<Action, never, R>
) => Effect.Effect<void, never, Sonnet.SonnetService | R>
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
import { Stanza } from "redux-sonnet"

Stanza.fromEffect(Effect.succeed({ type: "ACTION" }))
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## fromStream

Construct a `Stanza` from a `Stream` such that each output dispatches to Redux.

**Signature**

```ts
export declare const fromStream: <R>(
  self: Stream.Stream<Action, never, R>
) => Effect.Effect<void, never, Sonnet.SonnetService | R>
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
import { pipe, Schedule, Stream } from "effect"
import { Stanza } from "redux-sonnet"

Stanza.fromStream(
  pipe(
    Stream.range(1, 3),
    Stream.schedule(Schedule.spaced("1 second")),
    Stream.map((i) => ({ type: `ACTION-${i}` }))
  )
)
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## make

Constructs a `Stanza` from a `effect/Stream` processor.

**Signature**

```ts
export declare const make: <R>(
  processor: (
    action$: Stream.Stream<Action>,
    state: {
      changes: Stream.Stream<any>
      latest: Stream.Stream<any>
      ref: SynchronizedRef.SynchronizedRef<any>
    }
  ) => Stream.Stream<Action, never, R>
) => Stanza<Sonnet.Sonnet.Context | R>
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# models

## Stanza (interface)

A `Stanza` is an `Effect` that produces `void`, never fails, and requires the `SonnetService`.

**Signature**

```ts
export interface Stanza<R = never>
  extends
    Pipeable.Pipeable,
    Effect.Effect<void, never, Sonnet.SonnetService | R>
{
  // [TypeId]: TypeId
}
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# utils

## TypeId

**Signature**

```ts
export declare const TypeId: typeof TypeId
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_
