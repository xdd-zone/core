import { z } from "zod";

function parseQueryInt(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (!/^-?\d+$/.test(value)) return value;

    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : value;
  }

  return value;
}

/**
 * 将布尔输入扩展为兼容 query string 的字符串形式。
 */
export function booleanish() {
  return z.preprocess((value) => {
    if (value === undefined) return undefined;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value === "true") return true;
      if (value === "false") return false;
    }

    return value;
  }, z.boolean().optional());
}

/**
 * 将数字输入扩展为兼容 query string 的字符串形式。
 */
export function intFromQuery(message: string) {
  return z.preprocess(parseQueryInt, z.number().int(message).optional());
}
