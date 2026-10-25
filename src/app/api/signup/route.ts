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
    // 取得したJSONデータから、社員番号とパスワードを取り出す
    const {employeeNumber,password} = body;

    // 社員番号が入力されているか確認する
    if(!employeeNumber) {
        // クライアントにJSON形式でエラーメッセージを返す
        return NextResponse.json(
            {
                // クライアントに返すメッセージを指定する
                message: "社員番号を入力してください",
            },
            {
                status: 400
            }
        );
    }

    // パスワードが入力されているか確認する
    if(!password) {
        // クライアントにJSON形式でエラーメッセージを返す
        return NextResponse.json(
            {
                // クライアントに返すメッセージを指定する
                message: "パスワードを入力してください",
            },
            {
                status: 400
            }
        );
    }

    // 社員番号を使って、Employeeテーブルから社員を検索する
    const employee = await prisma.employee.findUnique({
        // Employee.idと入力された社員番号を比較する
        where: {
            // 入力された社員番号は文字列なので、数値に変換する
            id: Number(employeeNumber)
        },
    });

    // 社員番号に一致する社員が見つからなかったか確認する
    if(!employee) {
        // 社員が存在しないことをクライアントに返す
        return NextResponse.json(
            {
                // クライアントに表示するメッセージ
                message: "登録対象の社員が存在しません",
            },
            {
                // 404は対象のデータが存在しないことを表す
                status: 404
            }
        );
    }

    // すでにSupabase Authと紐付いている社員か確認する
    if(employee.auth_user_id) {
        // すでに登録済みの場合はエラーを返す
        return NextResponse.json(
            {
                message: "この社員はすでに登録されています",
            },
            {
                status: 409
            }
        );
    }

    // Supabase Authに新しいユーザーを登録する
    const {data,error} = await supabase.auth.admin.createUser({
        // Employeeに登録されているメールアドレスを使用する
        email: employee.email,
        // サインアップ画面で入力されたパスワードを使用する
        password: password,
        // メール確認を不要にする
        email_confirm: true,
    });

    // Supabase Authへの登録でエラーが発生したか確認する
    if(error) {
        // エラー内容をターミナルに表示する
        console.error("Supabase Auth登録エラー:", error);

        // クライアントにエラーを返す
        return NextResponse.json(
            {
                message: "ユーザー登録に失敗しました",
            },
            {
                status: 500
            }
        );
    }

    // Supabase Authで作成されたユーザーのIDを取得する
    const authUserId = data.user?.id;

    // SupabaseからユーザーIDが返ってこなかった場合
    if(!authUserId) {
        // ターミナルにエラーを表示する
        console.error("Supabase AuthのユーザーIDを取得できませんでした");

        // クライアントにエラーを返す
        return NextResponse.json(
            {
                message: "ユーザー登録に失敗しました",
            },
            {
                status: 500
            }
        );
    }

    // Employeeのauth_user_idにSupabase AuthのユーザーIDを保存する
    await prisma.employee.update({
        // 更新する社員を社員番号で指定する
        where: {
            id: Number(employeeNumber),
        },

        // auth_user_idをSupabaseのユーザーIDに更新する
        data: {
            auth_user_id: authUserId,
        },
    });

    // 新規登録が成功したことをクライアントに返す
    return NextResponse.json({
        // 成功したことを伝えるメッセージ
        message: "新規登録が完了しました",
    });
}