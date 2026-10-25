// Next.jsからJSON形式のレスポンスを返すためのNextResponseを読み込む
import { NextResponse } from "next/server";
// SupabaseのServer Clientを作成する関数を読み込む
import { createClient } from "../../../../utils/supabase/server";
// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";

// GETリクエストを受け取ったときに実行される処理を定義する
export async function GET() {
    try {
        // SupabaseのServer Clientを作成する
        const supabase = await createClient();
        // Supabaseから現在ログインしているユーザーを取得する
        const {data,error} = await supabase.auth.getUser();

        // 認証エラーの詳細をサーバーログに出力する
        console.log("GET /api/me の認証確認:", {
            hasUser: Boolean(data.user),
            errorMessage: error?.message ?? null,
            errorCode: error?.code ?? null,
        });

        // ユーザー情報の取得に失敗したか確認する
        if(error || !data.user) {
            return NextResponse.json(
                {
                    message: "ログインしていません"
                },
                {
                    status: 401
                }
            );
        }

        // Supabase AuthのユーザーIDを使ってEmployeeを検索する
        const employee = await prisma.employee.findUnique({
            // SupabaseのユーザーIDで検索する
            where: {
                auth_user_id: data.user.id
            },
        });

        // Employeeが見つからなかったか確認する
        if(!employee) {
            return NextResponse.json(
                {
                    message: "社員情報が見つかりません"
                },
                {
                    status: 404
                }
            );
        }

        // 社員名とメールアドレスを返す
        return NextResponse.json(
            {
                // 社員テーブルのIDを返す
                id: employee.id,
                // 社員名を返す
                name: employee.name,
                // メールアドレスを返す
                email: employee.email,
            },
            {
                // ステータス200を返す
                status: 200
            }
        );
    } catch(error) {
        // エラー内容をコンソールに表示する
        console.error(error);

        // エラーを返す
        return NextResponse.json(
            {
                error: "ユーザー情報の取得に失敗しました",
            },
            {
                status: 500,
            }
        );
    }
}