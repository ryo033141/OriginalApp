// Next.jsのリクエスト型を読み込む
import { type NextRequest } from "next/server";
// Supabaseの認証状態を確認する処理を読み込む
import { updateSession } from "@/lib/supabase/proxy";

// Next.jsのProxy処理を定義する
export async function proxy(request: NextRequest) {
    // Supabaseの認証状態を確認する
    return await updateSession(request);
}

// Proxyを実行するURLを指定する
export const config = {
    // 静的ファイル以外のリクエストでProxyを実行する
    matcher: [
        // Next.jsの静的ファイルや画像などを除外する
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};