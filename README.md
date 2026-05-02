# share-music

Next.js 16 + Prisma。**本机只要 Node**；数据库用 **`DATABASE_URL` 指向的 Postgres**（云端托管即可，不必在本机装 Postgres）。

## 本地开发

日常：**改代码 → `npm run dev`**，连的是你在 `.env.local` 里配置的远端库。

1. **环境变量**

   ```bash
   cp .env.example .env.local
   ```

   把 `DATABASE_URL` 换成托管方给的连接串（Neon、Supabase、RDS、`*.postgres.database.azure.com` 等均可）。  
   `JWT_SECRET` 开发可先随便填，上线换成强随机串。

2. **依赖与表结构**

   ```bash
   npm install              # 会 postinstall → prisma generate
   npm run db:prepare       # prisma db push → 把 schema 同步到你配置的库里
   npm run seed             # 可选
   ```

3. **启动**

   ```bash
   npm run dev
   ```

4. **本地预览生产构建**

   ```bash
   npm run build && npm run start
   ```

Makefile：`make dev`、`make db-prepare`、`make seed`。

### 可选：非要本机跑 Postgres

若你希望数据库进程也在自己电脑上，可以用 **`npm run db:up`**（Podman 起容器或检测本机 `:5432`），脚本见 `scripts/ensure-local-db.sh`。默认文档不按这条路假设。

## 测试与代码检查

```bash
npm run lint
npm run test
```

## Next.js

项目基于 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)。更多见 [nextjs.org/docs](https://nextjs.org/docs)。
