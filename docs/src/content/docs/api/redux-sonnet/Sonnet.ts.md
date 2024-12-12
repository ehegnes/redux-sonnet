---
title: Sonnet.ts
description: This module provides the core Redux middleware for instantiating a Redux Sonnet.
sidebar:
  order: 4
tableOfContents:
  minHeadingLevel: 1
---

This module provides the core Redux middleware for instantiating a Redux Sonnet.

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# constructors

## make

Construct a `redux-sonnet` middleware.

**NOTE:** side-effect handlers are provided up-front to guarantee declarative
behavior.

**Signature**

```ts
export declare const make: <LA, LE>(
  rootEffect: Effect<void, never, LA>,
  layer: Layer.Layer<LA | Sonnet.Context, LE, never>,
  memoMap?: Layer.MemoMap | undefined
) => Sonnet<LA, LE>
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
import { configureStore, Tuple as RTKTuple } from "@reduxjs/toolkit"
import { Layer, Stream } from "effect"
import { Sonnet, Stanza } from "redux-sonnet"

const stanza = Stanza.fromStream(
  Stream.make({ type: "ACTION-1" }, { type: "ACTION-2" }, { type: "ACTION-3" })
)

const sonnet = Sonnet.make(
  //    ^?
  stanza,
  Sonnet.defaultLayer
)

const store = configureStore({
  //    ^?
  reducer: () => {},
  middleware: () => new RTKTuple(sonnet)
})
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# context

## SonnetService (class)

**Signature**

```ts
export declare class SonnetService
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# layers

## defaultLayer

**Signature**

```ts
export declare const defaultLayer: Layer.Layer<SonnetService, never, never>
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

## layer

**Signature**

```ts
export declare const layer: (
  options: Sonnet.Options
) => Layer.Layer<SonnetService, never, never>
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# models

## Sonnet (interface)

**Signature**

```ts
export interface Sonnet<LA, LE>
  extends
    Pipeable,
    Equal.Equal,
    Hash.Hash,
    Inspectable.Inspectable,
    Sonnet.Middleware
{
  readonly [TypeId]: TypeId
  readonly runtime: ManagedRuntime.ManagedRuntime<LA, LE>
  readonly fiber: Fiber.RuntimeFiber<void, LE>
}
```

_Added in [v1.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v1.0.0)_

## Sonnet (namespace)

_Added in [v1.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v1.0.0)_

### Options (interface)

**Signature**

```ts
export interface Options {
  /**
   * Number of actions to replay to late subscribers.
   *
   * @default 0
   */
  readonly replay?: number | undefined
  /**
   * Configuration for queue-backed action stream.
   *
   * @defaultValue `{ strategy: "unbounded" }`
   */
  readonly backing?:
    | { strategy: "unbounded" }
    | { strategy: "bounded"; capacity: number }
    | { strategy: "dropping"; capacity: number }
    | { strategy: "sliding"; capacity: number }
    | undefined
}
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

### Service (interface)

**Signature**

```ts
export interface Service {
  readonly action: {
    readonly queue: Queue.Queue<Action>
    readonly stream: Stream.Stream<Action>
  }
  readonly state: {
    readonly changes: Stream.Stream<any>
    readonly latest: Stream.Stream<any>
    readonly ref: SynchronizedRef.SynchronizedRef<any>
  }
  readonly dispatch: {
    readonly stream: Stream.Stream<Take.Take<Action>>
    readonly queue: Queue.Queue<Take.Take<Action>>
  }
}
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

### Context (type alias)

**Signature**

```ts
export type Context = SonnetService
```

_Added in [v1.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v1.0.0)_

### Middleware (type alias)

**Signature**

```ts
export type Middleware = ReduxMiddleware<any, any, any>
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# refinements

## isSonnet

Returns `true` if the specified value is a `Sonnet`, `false` otherwise.

**Signature**

```ts
export declare const isSonnet: (u: unknown) => u is Sonnet<unknown, unknown>
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# type ids

## TypeId

**Signature**

```ts
export declare const TypeId: typeof TypeId
```

_Added in [v1.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v1.0.0)_

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

_Added in [v1.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v1.0.0)_
