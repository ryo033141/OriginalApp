// Supabaseのクライアントを作成するための関数をインポートする
import { createClient } from "@supabase/supabase-js";

// Supabaseの管理者用クライアントを作成し、
// supabaseAdminという名前で他のファイルから利用できるようにする
export const supabaseAdmin = createClient(
    // 環境変数からSupabaseのプロジェクトURLを取得する
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // 環境変数からSupabaseの管理者用秘密鍵を取得する
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            // アクセストークンの自動更新を無効にする
            autoRefreshToken: false,
            // ログインセッションをクライアント内に保存しない
            persistSession: false,
        },
    }
);