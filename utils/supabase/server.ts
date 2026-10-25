// SupabaseのSSR（Server Side Rendering）用のClientを作成する関数を読み込む
import { createServerClient } from "@supabase/ssr";
// Next.jsでCookieを取得・操作するための関数を読み込む
import { cookies } from "next/headers";

// SupabaseのServer Clientを作成する関数を定義する
export async function createClient() {
    // 現在のリクエストで使用されているCookieを取得する
    const cookiesStore = await cookies();

    // SupabaseのServer Clientを作成して返す
    return createServerClient(
        // .envに設定したSupabaseプロジェクトのURLを取得する
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // .envに設定したSupabaseのPublishable Keyを取得する
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        // Supabase Clientの設定を指定する
        {
            // SupabaseがCookieを利用できるようにCookieの処理方法を設定する
            cookies: {
                // 現在保存されているCookieをすべて取得する関数
                getAll() {
                    // Next.jsから取得したCookieをすべて返す
                    return cookiesStore.getAll();
                },
                // SupabaseがCookieを保存・更新するときに呼び出される関数
                setAll(cookiesToSet) {
                    // Cookieの保存処理でエラーが発生する可能性があるためtryで囲む
                    try {
                        // Supabaseから渡されたCookieを1つずつ処理する
                        cookiesToSet.forEach(({name,value,options}) => {
                            // CookieをNext.js側に保存する
                            cookiesStore.set(name,value,options);
                        });
                        // Cookieを保存できなかった場合の処理
                    } catch {
                    }
                },
            },
        }
    );
}