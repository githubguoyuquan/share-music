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

export const songCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  artist: z.string().trim().min(1).max(100),
  album: z.string().trim().min(1).max(100),
  durationSec: z.number().int().positive().max(3600),
  releaseDate: z.string(),
  genre: z.string().trim().min(1).max(50),
  coverUrl: z.string().url().optional().nullable(),
  qqMusicUrl: z.string().optional().nullable(),
  neteaseUrl: z.string().optional().nullable(),
  qishuiUrl: z.string().optional().nullable(),
  kuwoUrl: z.string().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional(),
});
