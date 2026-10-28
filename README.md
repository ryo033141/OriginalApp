# 会議ポータル
## アプリ概要
OutlookやGoogle Meetsなどの一般的な会議作成アプリはありますが作成された会議を見るには
<br/>
カレンダーを確認する必要があり、確認する手間を感じたり自分が関係する会議をうっかり失念して
<br>
しまうという課題を感じておりました。

この課題を解決するために自分に関係がある会議のみを一覧表示する掲示板アプリを開発いたしました。
<br/>
このアプリを利用する事で自分に関係がある会議が一目でわかるので会議をうっかり忘れてしまうという
<br/>
懸念が軽減できるのではないかと考えております。

またこのアプリは社内で使用する想定をしており、管理者機能で社員情報の管理ができ、在籍している
<br/>
社員のみに会議作成や通知、会議の一覧表示ができるような仕様になっております。

## デモ
公開用URL：https://original-app-ebon.vercel.app/signin

## デモアカウント
### デモユーザー1（ユーザー側）
- 社員番号：124542
- パスワード：re3141592
#### 会議登録可能なメールアドレス一覧
- yamaguchi@example.com
- aoyama@example.com
- sato@example.com
- hamano@example.com

### デモユーザー2（管理者側）
- 社員番号：234252
- パスワード：re3141592
#### 管理者権限付与が可能な社員
- 青山智
- 佐藤佳菜子

### 新規会員登録が可能な社員番号
- 432421
- 725321

## 使用技術
- フロントエンド：Next.js 16.2.9、React 19.2.4、TypeScript
- CSSフレームワーク：TailWind CSS
- バックエンド：Next.js Route Handlers、TypeScript
- データベース：Supabase、Prisma
- アイコン：Font Awesome
- 通知機能：React Hot Toast
- デプロイ：Vercel

## 主な機能
【ユーザー側（社員側）】
- ユーザーの新規登録、ログイン
- ログインした自身の会議一覧の表示（必須会議か任意会議かで絞り込みが可能）
- 会議の新規作成、会議の詳細確認、会議の編集、会議の削除
- 会議通知（その人に関係する会議が作成されたら通知のポップアップが出る）

【管理者側】
- 管理者用ログイン
- 社員一覧の表示（所属部署、役職、雇用区分でそれぞれ絞り込みが可能）
- 新規社員の登録、社員情報の詳細確認、社員情報の編集、社員情報の削除
- 管理者権限の付与

## 工夫した点
- 社員専用アプリの想定のため社員名簿に登録していない社員は新規会員登録</br>
  できないようにした点
- 会議登録をする際に在籍している社員のみ会議登録可能とし、在籍していない<br/>
  社員がいたら登録を不可にしたり、元々在籍していて、その後在籍しなくなった<br/>
  場合は会議の参加者から削除するように実装した点
- 会議が終了した会議については24時関経過後、自動的に一覧から非表示にし、開催予定の会議のみ一覧で<br/>
  見れるようにした点
- React Hot Toastを利用して、ログインした人自身に向けて会議が作成されたり<br/>
  編集されたりした場合はリアルタイムに近い形で通知が出るようにした点

## ER図
<img width="982" height="867" alt="オリジナルアプリ_ER図" src="https://github.com/user-attachments/assets/fb270bc8-6b74-4334-959b-03c8997232b6" />

## ファイル構成
```
├── AGENTS.md
├── CLAUDE.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── prisma
│   ├── migrations
│   ├── migrations_backup
│   └── schema.prisma
├── prisma.config.ts
├── public
│   └── image
│       ├── back_icon.png
│       ├── detail.png
│       └── signout_icon.png
├── README.md
├── skills-lock.json
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   └── employee-status
│   │   │   │       └── route.ts
│   │   │   ├── employees
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   ├── admin
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── EmployeeSelection
│   │   │   │   └── route.ts
│   │   │   ├── logout
│   │   │   │   └── route.ts
│   │   │   ├── me
│   │   │   │   └── route.ts
│   │   │   ├── MeetingActivities
│   │   │   │   └── route.ts
│   │   │   ├── meetings
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── signin
│   │   │   │   ├── admin
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── signup
│   │   │       └── route.ts
│   │   ├── employee
│   │   │   ├── [id]
│   │   │   │   ├── delete
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── edit
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── admin
│   │   │   │   └── page.tsx
│   │   │   ├── create
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── meeting
│   │   │   ├── [id]
│   │   │   │   ├── delete
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── edit
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── create
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── signin
│   │   │   ├── admin
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── signup
│   │       └── page.tsx
│   ├── components
│   │   ├── EmployeeDeletionWatcher.tsx
│   │   └── Header.tsx
│   ├── lib
│   │   └── supabase
│   │       └── proxy.ts
│   └── proxy.ts
├── tsconfig.json
└── utils
    ├── checkAdminPermission.ts
    ├── dateTime.ts
    ├── prisma.ts
    ├── supabase
    │   ├── admin.ts
    │   ├── client.ts
    │   └── server.ts
    └── validation
        └── signup.ts
```

## 動作確認環境
Mac / Google Chrome / Safariで動作確認済み

## ローカルでの実行方法
```
git clone https://github.com/ryo033141/OriginalApp.git
cd OriginalApp
npm install
```
プロジェクト配下に```.env.local```を作成し、Supabase接続用の以下の項目を<br/>
設定します。
```
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url

SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_SUPABASE_URL=your_next_public_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_next_public_supabase_publishable_key
```
設定後、以下を実行します。
```
npm run dev
```
ブラウザで```http://localhost:3000```を開きます。

## 画面イメージ
### トップ画面
<img width="1440" height="776" alt="“0” 2026-10-29 0 11 35" src="https://github.com/user-attachments/assets/7b66fa6b-b913-4884-b434-f92083d36a12" />

### 会議一覧画面
<img width="1438" height="773" alt="“0” 2026-10-29 0 22 30" src="https://github.com/user-attachments/assets/876b2739-a63e-4628-af2d-79866d9a8fc5" />

### 社員一覧画面（管理者側）
<img width="1440" height="777" alt="“0” 2026-10-29 0 24 56" src="https://github.com/user-attachments/assets/2ef4520d-f99d-460f-9bc2-905ed72b1d42" />




