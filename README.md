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

## ER図
<img width="982" height="867" alt="オリジナルアプリ_ER図" src="https://github.com/user-attachments/assets/fb270bc8-6b74-4334-959b-03c8997232b6" />

## 使用技術
- フロントエンド：Next.js 16.2.9、React 19.2.4、TypeScript
- CSSフレームワーク：TailWind CSS
- バックエンド：Next.js Route Handlers、TypeScript
- データベース：Supabase、Prisma
- アイコン：Font Awesome
- 通知機能：React Hot Toast
- デプロイ：Vercel
