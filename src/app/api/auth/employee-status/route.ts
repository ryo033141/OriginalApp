// HTTPレスポンスを作成するためのNextResponseを読み込む
import { NextResponse } from "next/server";
// Supabaseのサーバー用クライアントを作成する関数を読み込む
import { createClient } from "@utils/supabase/server";
// データベースを操作するための共通PrismaClientを読み込む
import { prisma } from "@utils/prisma";

// ログイン中の社員が存在するか確認するGET APIを定義する
export async function GET() {
    try {
        // Supabaseのサーバー用クライアントを作成する
        const supabase = await createClient();
        // ログイン中のユーザーのJWT claimsを取得する
        const {data,error} = await supabase.auth.getClaims();

        // 認証情報の取得に失敗した場合、またはユーザーIDが存在しない場合に実行する
        if(error || !data?.claims?.sub) {
            // 未認証であることを示すレスポンスを返す
            return NextResponse.json(
                {
                    // 社員が存在するかどうかは確認できていないためfalseを設定する
                    exists: false,
                    // ログイン状態が確認できないことを示す
                    authenticated: false,
                },
                {
                    // HTTP 401は認証されていないことを示す
                    status: 401,
                }
            );
        }

        // JWT claimsからSupabaseのユーザーIDを取得する
        const authUserId = data.claims.sub;
        // SupabaseのユーザーIDに紐づく社員情報をデータベースから検索する
        const employee = await prisma.employee.findUnique({
            // 検索条件を指定する
            where: {
                // SupabaseのユーザーIDと一致する社員を検索する
                auth_user_id: authUserId,
            },
            // 取得する社員情報の項目を指定する
            select: {
                // 社員IDだけを取得する
                id: true,
            },
        });

        // 社員の存在確認結果をサーバーログに出力する
        console.log("社員存在確認:", {
            authUserId,
            employeeExists: employee !== null,
            employeeId: employee?.id ?? null,
        });

        // 社員情報が存在するかどうかをレスポンスとして返す
        return NextResponse.json(
            {
                // 社員情報が見つかった場合はtrue、見つからない場合はfalseを返す
                exists: employee !== null,
                // 認証情報が確認できていることを示す
                authenticated: true,
            }
        );
    } catch(error) {
        // エラーの詳細をサーバー側のコンソールに出力する
        console.error("社員の存在確認に失敗しました。", error);

        // エラーが発生したことをクライアントに返す
        return NextResponse.json(
            {
                // クライアントに返すエラーメッセージを設定する
                 message: "社員の存在確認に失敗しました。",
            },
            {
                // HTTP 500はサーバー側でエラーが発生したことを示す
                status: 500,
            }
        );
    }
}