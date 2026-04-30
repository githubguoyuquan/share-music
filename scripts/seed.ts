import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

/* 与 Next 类似：先 .env，再 .env.local 覆盖（默认 dotenv 只读 .env，读不到 .env.local） */
const root = process.cwd();
loadEnv({ path: resolve(root, ".env") });
loadEnv({ path: resolve(root, ".env.local"), override: true });

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error(`
未读到 DATABASE_URL（进程环境里为空）。

常见原因（项目能跑 ≠ 本机 shell 里一定有这个变量）：

  1) 用 Docker Compose 跑应用时，DATABASE_URL 写在 compose 里，只注入「容器内」；
     你在 Mac 上执行 make seed 是在「宿主机」上新起一个进程，不会自动带上容器里的环境。

  2) Next.js 会加载 .env、.env.local 等；以前 seed 只等价于读了 .env。
     若你把 DATABASE_URL 只写在 .env.local，next dev 正常而 make seed 会缺变量。
     （现已同时加载 .env 与 .env.local）

请在项目根目录的 .env 或 .env.local 里写上完整连接串，例如连本机映射的 Postgres：

  DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/music_share"

或在容器里灌库（这时用的是 compose 里的环境）：

  docker compose exec app npm run seed
`);
  process.exit(1);
}

/* postgresql://user@host/... 缺少 ":密码" 时，node-pg 在 SCRAM 下会得到非字符串密码并报错 */
const urlLooksMissingPassword =
  /^postgres(ql)?:\/\/[^@/?]+@[^/]/i.test(databaseUrl) &&
  !/^postgres(ql)?:\/\/[^:@]+:[^@]*@/i.test(databaseUrl);
if (urlLooksMissingPassword) {
  console.error(`
DATABASE_URL 里似乎没有「用户名:密码」这一段（例如写成了 postgresql://postgres@127.0.0.1/...）。

请改成带密码，例如（密码与库里一致）：
  DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/music_share"

若数据库确实没有密码（仅本地 trust），也要写出空的密码位：
  DATABASE_URL="postgresql://postgres:@127.0.0.1:5432/music_share"

注意：.env 里不会自动展开 \${POSTGRES_PASSWORD}，须写完整连接串或在本机 shell 里 export 后再执行 seed。
`);
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const artists = ["周杰伦", "林俊杰", "陈奕迅", "Taylor Swift", "Adele", "Ed Sheeran", "Coldplay", "Imagine Dragons"];
const albums = ["黄金时代", "城市光谱", "Midnights", "25", "Divide", "Ghost Stories", "Evolve", "Origins"];
const genres = ["流行", "摇滚", "R&B", "电子", "民谣", "说唱"];

/** 种子数据的「入库」一律早于 new 窗口（见 app/lib/song-new.ts），避免演示库刷屏 new */
const SEED_CREATED_AT_MIN_DAYS_AGO = 30;

const songNames = [
  "青花瓷", "夜曲", "晴天", "稻香", "七里香", "东风破", "双截棍", "告白气球", "简单爱", "一路向北",
  "江南", "曹操", "修炼爱情", "可惜没如果", "关键词", "背对背拥抱", "不为谁而作的歌", "小酒窝", "一千年以后", "醉赤壁",
  "十年", "K歌之王", "浮夸", "爱情转移", "淘汰", "你的背包", "阴天快乐", "因为爱情", "好久不见", "红玫瑰",
  "Love Story", "You Belong With Me", "Blank Space", "Shake It Off", "Anti-Hero", "Cruel Summer", "Style", "Cardigan", "Willow", "Lavender Haze",
  "Rolling in the Deep", "Someone Like You", "Hello", "Set Fire to the Rain", "Skyfall", "Easy On Me", "When We Were Young", "Send My Love", "Rumour Has It", "Turning Tables",
  "Shape of You", "Perfect", "Thinking Out Loud", "Photograph", "Castle on the Hill", "Shivers", "Bad Habits", "Galway Girl", "Afterglow", "Eyes Closed",
  "Yellow", "Fix You", "Viva La Vida", "The Scientist", "Clocks", "Paradise", "Adventure of a Lifetime", "A Sky Full of Stars", "My Universe", "Hymn for the Weekend",
  "Believer", "Demons", "Radioactive", "Thunder", "Whatever It Takes", "Natural", "Enemy", "Bones", "Bad Liar", "On Top of the World",
  "起风了", "演员", "平凡之路", "追光者", "成都", "光年之外", "海阔天空", "突然好想你", "小幸运", "匆匆那年",
  "山丘", "南山南", "消愁", "后来", "说谎", "认真的雪", "多远都要在一起", "年少有为", "像我这样的人", "遇见",
  "孤勇者", "这世界那么多人", "可能", "嘉宾", "乌梅子酱", "Let It Be", "Hey Jude", "Bohemian Rhapsody"
];

async function main() {
  // Keep existing users/categories to avoid wiping real user-created data.
  await prisma.songCategory.deleteMany();
  await prisma.song.deleteMany();

  const admin = await prisma.user.upsert({
    where: { phone: "13800000000" },
    update: {
      nickname: "管理员",
      role: "admin",
      passwordHash: await bcrypt.hash("Admin@123456", 12),
    },
    create: {
      phone: "13800000000",
      nickname: "管理员",
      role: "admin",
      passwordHash: await bcrypt.hash("Admin@123456", 12),
    },
  });

  const user = await prisma.user.upsert({
    where: { phone: "13900000000" },
    update: {
      nickname: "测试用户",
      role: "user",
      passwordHash: await bcrypt.hash("User@123456", 12),
    },
    create: {
      phone: "13900000000",
      nickname: "测试用户",
      role: "user",
      passwordHash: await bcrypt.hash("User@123456", 12),
    },
  });

  const parentCats = await Promise.all([
    prisma.songCategory.create({ data: { name: "语种", color: "#ef4444" } }),
    prisma.songCategory.create({ data: { name: "场景", color: "#3b82f6" } }),
  ]);
  const songCats = await Promise.all([
    prisma.songCategory.create({ data: { name: "华语精选", color: "#ef4444", parentId: parentCats[0].id } }),
    prisma.songCategory.create({ data: { name: "欧美热歌", color: "#ef4444", parentId: parentCats[0].id } }),
    prisma.songCategory.create({ data: { name: "跑步", color: "#3b82f6", parentId: parentCats[1].id } }),
    prisma.songCategory.create({ data: { name: "学习", color: "#3b82f6", parentId: parentCats[1].id } }),
    prisma.songCategory.create({ data: { name: "夜晚", color: "#3b82f6", parentId: parentCats[1].id } }),
    prisma.songCategory.create({ data: { name: "通勤", color: "#3b82f6", parentId: parentCats[1].id } }),
  ]);

  await prisma.userCategory.upsert({
    where: { userId_name: { userId: user.id, name: "喜欢" } },
    update: { isSystem: true },
    create: { userId: user.id, name: "喜欢", isSystem: true },
  });
  // Remove legacy default category.
  await prisma.userCategory.deleteMany({
    where: { userId: user.id, name: "我的歌单" },
  });

  for (let i = 0; i < 108; i++) {
    const releaseDate = new Date(Date.now() - i * 24 * 3600 * 1000);
    /* 入库时间单独压低：演示种子不要挤进「最近 14 天添加」；后台真实录入仍用默认 now() */
    const createdAt = new Date(Date.now() - (SEED_CREATED_AT_MIN_DAYS_AGO + i) * 24 * 3600 * 1000);
    const song = await prisma.song.create({
      data: {
        name: songNames[i],
        artist: artists[i % artists.length],
        album: albums[i % albums.length],
        durationSec: 140 + (i % 180),
        releaseDate,
        createdAt,
        genre: genres[i % genres.length],
        coverUrl: `https://picsum.photos/seed/music-cover-${i + 1}/600/600`,
        qqMusicUrl: `qqmusic://song/${i + 1}`,
        neteaseUrl: `orpheus://song/${i + 1}`,
        qishuiUrl: `qishui://song/${i + 1}`,
        kuwoUrl: `kwplayer://song/${i + 1}`,
        createdById: admin.id,
        status: "active",
      },
    });

    await prisma.songCategoryMap.create({
      data: {
        songId: song.id,
        categoryId: songCats[i % songCats.length].id,
      },
    });
  }

  console.log("Seed done: 108 songs");
  console.log("Test logins (phone / password):");
  console.log("  Admin: 13800000000 / Admin@123456");
  console.log("  User:  13900000000 / User@123456");
}

main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
