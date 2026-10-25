// NextResponseを読み込む
import { NextResponse } from "next/server";
// PrismaClientのインスタンスを読み込む
import { prisma } from "@utils/prisma";
import { createClient } from "../../../../utils/supabase/server";

// MeetingActivityを取得するGETリクエスト
export async function GET(request: Request) {
    // エラーが発生する可能性のある処理をtryで囲む
    try {
        // リクエストされたURLからクエリパラメータを取得する
        const {searchParams} = new URL(request.url);
        // クエリパラメータの「since」の値を取得する
        const since = searchParams.get("since");
        // Supabaseのクライアントを作成する
        const supabase = await createClient();
        // 現在ログインしているユーザーを取得する
        const {data,error} = await supabase.auth.getUser();

        // ログインしていない場合は401を返す
        if(error || !data.user) {
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error: "ログインしてください",
                },
                {
                    // 認証エラーを表すHTTPステータス401を返す
                    status: 401,
                }
            );
        }

        // ログイン中のユーザーに紐づくEmployeeを取得する
        const organizer = await prisma.employee.findUnique({
            // Supabase AuthのユーザーIDとEmployeeのauth_user_idを照合する
            where: {
                auth_user_id: data.user.id,
            },
        });

        // Employeeが見つからない場合は404を返す
        if(!organizer) {
            return NextResponse.json(
                {
                    // Employeeが見つからないことを返す
                    error: "社員情報が見つかりません",
                },
                {
                    // 対象データが存在しないことを表すHTTPステータス404を返す
                    status: 404,
                }
            );
        }

        // MeetingActivityテーブルからActivityを取得する
        const activities = await prisma.meetingActivity.findMany({
            // Activityの取得条件を指定する
            where: {
                // 通知対象の社員に自分の社員IDが含まれているものだけ取得する
                notification_employee_ids: {
                    has: organizer.id,
                },
                // sinceが指定されている場合は、指定した日時より後のActivityだけ取得する
                ...(since && {
                    created_at: {
                        gt: new Date(since),
                    },
                }),
            },
            // Activityに紐づくEmployeeの必要な情報だけ取得する
            include: {
                // employeeテーブルの情報を取得する
                employee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            // Activityを作成日時の新しい順に並べる
            orderBy: {
                // 作成日時を基準に並べる
                created_at: "desc",
            },
        });

        // 取得したActivityをJSON形式で返す
        return NextResponse.json(
            {
                // 取得したActivityの一覧を返す
                activities: activities,
            },
            {
                // 正常に取得できたことを表すHTTPステータス200を返す
                status: 200,
            }
        );
    } catch(error) {
        // エラーの内容をコンソールに表示する
        console.error(error);

        // エラーが発生したことをJSON形式で返す
        return NextResponse.json(
            {
                // エラーメッセージを返す
                error: "MeetingActivityの取得に失敗しました",
            },
            {
                // サーバー側でエラーが発生したことを表すHTTPステータス500を返す
                status: 500,
            }
        );
    }
}
