import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const artists = ["周杰伦", "林俊杰", "陈奕迅", "Taylor Swift", "Adele", "Ed Sheeran", "Coldplay", "Imagine Dragons"];
const albums = ["黄金时代", "城市光谱", "Midnights", "25", "Divide", "Ghost Stories", "Evolve", "Origins"];
const genres = ["流行", "摇滚", "R&B", "电子", "民谣", "说唱"];

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
    const song = await prisma.song.create({
      data: {
        name: songNames[i],
        artist: artists[i % artists.length],
        album: albums[i % albums.length],
        durationSec: 140 + (i % 180),
        releaseDate: new Date(Date.now() - i * 24 * 3600 * 1000),
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
