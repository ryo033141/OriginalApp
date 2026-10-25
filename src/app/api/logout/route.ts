// Next.jsのレスポンス機能を読み込む
import { NextResponse } from "next/server";
// Supabaseのサーバー用クライアントを読み込む
import { createClient } from "../../../../utils/supabase/server";

// POSTリクエストを受け取る
export async function POST() {
    // Supabaseのクライアントを作成
    const supabase = await createClient();
    // Supabaseからログアウト
    const {error} = await supabase.auth.signOut();

    // ログアウトに失敗した場合
    if(error) {
        // エラーメッセージを返す
        return NextResponse.json(
            {
                message: "ログアウトに失敗しました"
            },
            {
                status: 500
            }
        );
    }

    // ログアウト成功のレスポンスを作成する
    const response = NextResponse.json(
        {
            // ログアウト成功のメッセージを返す
            message: "ログアウトしました"
        },
        {
            // HTTPステータス200を返す
            status: 200
        }
    );

    // 管理者ログインを示すCookieを削除する
    response.cookies.set("admin_login_user_id", "", {
        // Cookieの有効期限を過去にして削除する
        maxAge: 0,
        // Cookieをアプリ全体で削除対象にする
        path: "/"
    });

    // Cookieの削除指示を含むレスポンスを返す
    return response;
}