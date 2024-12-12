import { constFalse } from "effect/Function"
import * as S from "effect/Schema"
import { UrlFromString } from "./utils.js"

export const User = S.Struct({
  // login is the 'idAttribute'
  login: S.String,
  id: S.Number.pipe(S.positive()),
  node_id: S.String,
  avatar_url: UrlFromString,
  gravatar_id: S.OptionFromNullOr(S.String),
  url: UrlFromString,
  html_url: UrlFromString,
  followers_url: UrlFromString,
  following_url: S.String,
  gists_url: S.String,
  starred_url: S.String,
  subscriptions_url: UrlFromString,
  organizations_url: UrlFromString,
  repos_url: UrlFromString,
  events_url: S.String,
  received_events_url: UrlFromString,
  type: S.String,
  user_view_type: S.String,
  site_admin: S.Boolean,
  name: S.OptionFromNullOr(S.String),
  company: S.OptionFromNullOr(S.String),
  blog: S.OptionFromNullOr(S.String),
  location: S.OptionFromNullOr(S.String),
  email: S.OptionFromNullOr(S.String),
  hireable: S.optionalWith(S.Boolean, { nullable: true, default: constFalse }),
  bio: S.OptionFromNullOr(S.String),
  twitter_username: S.OptionFromNullOr(S.String),
  public_repos: S.Number.pipe(S.positive()),
  public_gists: S.Number.pipe(S.positive()),
  followers: S.Number.pipe(S.positive()),
  following: S.Number.pipe(S.positive()),
  created_at: S.DateFromString,
  updated_at: S.DateFromString
})
export type User = S.Schema.Type<typeof User>
