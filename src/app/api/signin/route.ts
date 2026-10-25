// Next.jsから、JSON形式のレスポンスを返すためのNextResponseを読み込む
import { NextResponse } from "next/server";
// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";
// Supabaseを使うためのcreateClientを読み込む
import { createClient } from "@supabase/supabase-js";

// Supabaseの接続を作成する
const supabase = createClient(
    // SupabaseプロジェクトのURLを環境変数から取得する
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // サーバー専用のservice_roleキーを環境変数から取得する
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POSTリクエストを受け取ったときに実行される処理を定義する
export async function POST(request: Request) {
    // クライアントから送られてきたリクエストのJSONデータを取得する
    const body = await request.json();
    // 取得したJSONデータから社員番号とパスワードを取り出す
    const {employeeNumber,password} = body;

    // 社員番号が入力されているか確認する
    if(!employeeNumber) {
        return NextResponse.json(
            {
                message: "社員番号を入力してください"
            },
            {
                status: 400
            }
        )
    };

    // パスワードが入力されているか確認する
    if(!password) {
        return NextResponse.json(
            {
                message: "パスワードを入力してください"
            },
            {
                status: 400
            }
        );
    }

    // 社員番号を使ってEmployeeテーブルから社員を検索する
    const employee = await prisma.employee.findUnique({
        where: {
            id: Number(employeeNumber)
        },
    });

    // 社員番号に一致する社員が見つからなかったか確認する
    if(!employee) {
        return NextResponse.json(
            {
                message: "社員番号またはパスワードが正しくありません"
            },
            {
                status: 401
            }
        );
    }

    // Supabase Authを使ってログインする
    const {data,error} = await supabase.auth.signInWithPassword({
        // Employeeテーブルに登録されているメールアドレスを使用する
        email: employee.email,
        // ログイン画面で入力されたパスワードを使用する
        password: password,
    });

    // Supabase Authへのログインでエラーが発生したか確認する
    if(error) {
        // エラー内容をターミナルに表示する
        console.error("Supabase Authログインエラー:", error);

        return NextResponse.json(
            {
                message: "社員番号またはパスワードが正しくありません"
            },
            {
                status: 401
            }
        );
    }

    // ログインしたユーザーの情報が取得できたか確認する
    if(!data.user) {
        return NextResponse.json(
            {
                message: "ログインに失敗しました"
            },
            {
                status: 401
            }
        );
    }

    // ログイン成功のレスポンスを作成する
    const response = NextResponse.json(
        {
            // ログイン成功メッセージ
            message: "ログインしました",
            // Supabaseのログインセッションを返す
            session: data.session,
        }
    );

    // 管理者ログイン用のCookieを削除する
    response.cookies.set("admin_login_user_id", "", {
        // Cookieの有効期限を過去に設定して削除する
        maxAge: 0,
        // Cookieをアプリ全体で削除対象にする
        path: "/",
    });

    // ログイン成功のレスポンスを返す
    return response;
}