// Next.jsのAPIレスポンスを作成するための機能を読み込む
import { NextResponse } from "next/server";
// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";
// Supabaseのサーバー用クライアントを作成する関数を読み込む
import { createClient } from "@utils/supabase/server";

// GETリクエストのAPI
export async function GET(request: Request) {
    // Supabaseのサーバー用クライアントを作成する
    const supabase = await createClient();
    // ログインしているユーザーの認証情報を取得する
    const {
        data:{user},
        error
    } = await supabase.auth.getUser();

    // 認証エラーが発生した場合、またはログインユーザーが存在しない場合
    if(error || !user) {
        // ログインが必要であることを示すJSONレスポンスを返す
        return NextResponse.json(
            {
                // クライアントに返すエラーメッセージを設定する
                message: "ログインが必要です。",
            },
            {
                // HTTPステータスコード401（認証されていない）を設定する
                status: 401,
            }
        );
    }

    try {
        // リクエストURLからURLオブジェクトを作成する
        const {searchParams} = new URL(request.url);
        // クエリパラメータ「excludeRetired」の値を取得する
        const excludeRetired = searchParams.get("excludeRetired");
        // 部署、役職、雇用区分、在籍区分の4つのテーブルを同時に取得する
        const [
            department,
            position,
            employmentStatus,
            enrollmentStatus
        ] = await Promise.all([
            // Departmentテーブルのデータを取得する
            prisma.department.findMany({
                // idの昇順（小さい順）で並び替える
                orderBy: {
                    id: "asc",
                },
            }),
            // Positionテーブルのデータを取得する
            prisma.position.findMany({
                // idの昇順（小さい順）で並び替える
                orderBy: {
                    id: "asc",
                },
            }),
            // EmploymentStatusテーブルのデータを取得する
            prisma.employmentStatus.findMany({
                // idの昇順（小さい順）で並び替える
                orderBy: {
                    id: "asc",
                },
            }),

            // EnrollmentStatusテーブルのデータを取得する
            prisma.enrollmentStatus.findMany({
                // excludeRetiredが「true」の場合は「退職」を除外する
                where:
                    excludeRetired === "true"
                        ? {
                            enrollment_status: {
                                not: "退職",
                            },
                        }
                        // falseまたは指定なしの場合は全件取得する
                        : {},
                // idの昇順（小さい順）で並び替える
                orderBy: {
                    id: "asc",
                },
            }),
        ]);

        // 取得した4つのマスタデータをまとめてJSON形式で返す
        return Response.json(
            {
                // 部署一覧
                department,
                // 役職一覧
                position,
                // 雇用区分一覧
                employmentStatus,
                // 在籍区分一覧
                enrollmentStatus,
            },
            {
                // 取得成功
                status: 200,
            }
        );
    } catch(e) {
        // エラー内容をサーバーのコンソールに出力する
        console.log(e);

        // エラーが発生したことをクライアントに返す
        return Response.json(
            {
                // エラーメッセージ
                message: "部署、役職、雇用区分、在籍区分の取得に失敗しました。",
            },
            {
                // サーバーエラー
                status: 500,
            }
        );
    }
}