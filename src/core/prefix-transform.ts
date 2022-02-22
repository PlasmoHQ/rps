import { Transform } from "stream"

const ALL_BR = /\n/g

export type LabelState = {
  enabled?: boolean
  width?: number
  lastPrefix: string
  lastIsLinebreak?: boolean
}

/**
 * The transform stream to insert a specific prefix.
 *
 * Several streams can exist for the same output stream.
 * This stream will insert the prefix if the last output came from other instance.
 * To do that, this stream is using a shared state object.
 *
 * @private
 */
export class PrefixTransform extends Transform {
  prefix: string
  state: LabelState

  constructor(prefix: string, state = {} as LabelState) {
    super()

    this.prefix = prefix
    this.state = state
  }

  _transform(chunk: string | Buffer, _encoding: string, callback: Function) {
    const prefix = this.prefix
    const nPrefix = `\n${prefix}`
    const state = this.state
    const firstPrefix = state.lastIsLinebreak
      ? prefix
      : state.lastPrefix !== prefix
      ? "\n"
      : /* otherwise */ ""
    const prefixed = `${firstPrefix}${chunk}`.replace(ALL_BR, nPrefix)
    const index = prefixed.indexOf(
      prefix,
      Math.max(0, prefixed.length - prefix.length)
    )

    state.lastPrefix = prefix
    state.lastIsLinebreak = index !== -1

    callback(null, index !== -1 ? prefixed.slice(0, index) : prefixed)
  }
}
