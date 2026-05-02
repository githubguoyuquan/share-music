import { z } from "zod";

export const phoneRegex = /^1[3-9]\d{9}$/;

export const authSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, "手机号格式错误"),
  password: z.string().trim().min(6, "密码至少6位").max(64, "密码过长"),
  nickname: z.string().max(32, "昵称过长").optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "分类名必填").max(30, "分类名过长"),
  color: z.string().max(20).optional().nullable(),
});

export const favoriteSchema = z.object({
  songId: z.string().uuid("songId 非法"),
});

const optionalUrlOrEmpty = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.union([z.string().url(), z.null()]).optional()
);

function todayLocalIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 抓取结果经常缺专辑/流派/日期，入库前补默认值避免 Zod / DB 非空约束失败 */
export const songCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  artist: z.string().trim().min(1).max(100),
  album: z.preprocess((v) => {
    if (v == null) return "未知专辑";
    if (typeof v === "string" && v.trim() === "") return "未知专辑";
    return v;
  }, z.string().trim().min(1).max(100)),
  durationSec: z.coerce.number().int().min(1, "时长须至少 1 秒").max(3600),
  releaseDate: z.preprocess((val) => {
    if (val == null) return todayLocalIsoDate();
    if (typeof val !== "string") return val;
    const s = val.trim();
    if (!s) return todayLocalIsoDate();
    const t = new Date(s).getTime();
    if (Number.isNaN(t)) return todayLocalIsoDate();
    return s;
  }, z.string().trim().min(1, "请填写发行日期").refine((s) => !Number.isNaN(new Date(s).getTime()), "发行日期无效")),
  genre: z.preprocess((v) => {
    if (v == null) return "未分类";
    if (typeof v === "string" && v.trim() === "") return "未分类";
    return v;
  }, z.string().trim().min(1).max(50)),
  coverUrl: optionalUrlOrEmpty,
  qqMusicUrl: z.string().optional().nullable(),
  neteaseUrl: z.string().optional().nullable(),
  qishuiUrl: z.string().optional().nullable(),
  kuwoUrl: z.string().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
});
