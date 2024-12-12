# Redux Sonnet

:scroll: :notes:


## Notes
- ? How to architect the configuration
  - We do _not_ want a `Layer` for the config, because it is memoized.
  - ? Could be a `Context` with a default value—a `Context.Reference`
- ? What if we want different backing semantics for different `Stanzas` (e.g. one w/ and one w/o replay)
  - ? Can we update the service