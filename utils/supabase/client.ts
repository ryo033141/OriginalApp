// Supabaseのブラウザ用クライアントを作成する機能を読み込む
import { createBrowserClient } from "@supabase/ssr";

// Supabaseのブラウザ用クライアントを作成する
export function createClient() {
    // Supabaseのブラウザ用クライアントを作成する
    return createBrowserClient(
        // SupabaseプロジェクトのURLを取得する
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // SupabaseのPublishable Keyを取得する
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
}