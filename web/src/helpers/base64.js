import { TextEncoder, TextDecoder } from "text-encoding"
import base64 from "base64-js"

/* window.atob() だと日本語などの Unicode を含む文字列を Base64 に変換できないのでこれを使う.
 *
 * @see: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
 */

/// plain string => Base64 encoded string
export const toBase64FromString = (str) =>
  base64.fromByteArray(
    new TextEncoder().encode(str)
  )

/// Base64 encoded string => plain string
export const toStringFromBase64 = (b64) =>
  new TextDecoder().decode(
    base64.toByteArray(b64)
  )

