// Next.jsの「redirect」というリダイレクト機能を読み込む
import { redirect } from "next/navigation";

export default function Home() {
  // 現在のページ「/」にアクセスした場合「/signin」へ自動的にリダイレクトする
  redirect("/signin");
}
