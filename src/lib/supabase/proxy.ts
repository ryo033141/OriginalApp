// Supabaseのサーバー用クライアントを作成する機能を読み込む
import { createServerClient } from "@supabase/ssr";
// Next.jsでレスポンスとリクエストを扱う機能を読み込む
import { NextResponse, type NextRequest } from "next/server";

// リクエストごとのSupabase認証状態を確認する関数を定義する
export async function updateSession(request: NextRequest) {
    // Supabaseから返すレスポンスを作成する
    let supabaseResponse = NextResponse.next({
        // 現在のリクエストをレスポンスに渡す
        request,
    });

    // Supabaseのサーバー用クライアントを作成する
    const supabase = createServerClient(
        // SupabaseのURLを環境変数から取得する
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // Supabaseの公開キーを環境変数から取得する
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,

        // Supabaseの設定を指定する
        {
            // Cookieを使って認証情報を管理する
            cookies: {
                // リクエストに含まれているすべてのCookieを取得する
                getAll() {
                    // 現在のリクエストからCookieを取得して返す
                    return request.cookies.getAll();
                },

                // Supabaseが更新したCookieを保存する
                setAll(cookieToset) {
                    // 更新されたCookieを1つずつ処理する
                    cookieToset.forEach(({name,value}) => {
                        // リクエスト側のCookieを更新する
                        request.cookies.set(name,value);
                    });

                    // Cookieが更新されたリクエストを使ってレスポンスを作り直す
                    supabaseResponse = NextResponse.next({
                        // 更新されたリクエストを渡す
                        request,
                    });

                    // 更新されたCookieを1つずつ処理する
                    cookieToset.forEach(({name,value,options}) => {
                        // レスポンス側にCookieを保存する
                        supabaseResponse.cookies.set(name,value,options);
                    });
                },
            },
        }
    );

    // Cookieに保存されている認証情報を検証する
    const {data} = await supabase.auth.getClaims();
    // 認証済みユーザーの情報を取得する
    const user = data?.claims;
    // ログインが必要なページかどうかを確認する
    const isProtectedPage =
        // /meetingから始まるページをログイン必須にする
        request.nextUrl.pathname.startsWith("/meeting") ||
        // /employeeから始まるページをログイン必須にする
        request.nextUrl.pathname.startsWith("/employee");
    
    // ログイン必須ページに未ログインでアクセスしたか確認する
    if(isProtectedPage && !user) {
        // 現在アクセスしているURLをコピーする
        const url = request.nextUrl.clone();
        // リダイレクト先をサインイン画面に変更する
        url.pathname = "/signin";

        // サインイン画面へリダイレクトする
        return NextResponse.redirect(url);
    }

    // 認証確認後のレスポンスを返す
    return supabaseResponse;
}