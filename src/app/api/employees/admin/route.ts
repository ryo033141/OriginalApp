// Next.jsから、APIのレスポンスを作成するNextResponseを読み込む
import { NextResponse } from "next/server";
// Prisma Clientを読み込む
import { prisma } from "@utils/prisma";
import { checkAdminPermission } from "@utils/checkAdminPermission";

// POSTリクエストを受け取ったときに実行される関数
export async function POST(request: Request) {
    // ログイン状態と管理者権限を確認する
    const permission = await checkAdminPermission();

    // 管理者権限がない場合の処理を行う
    if(!permission.allowed) {
        // JSON形式でエラーメッセージを返す
        return NextResponse.json(
            {
                // 権限確認関数から返されたメッセージを設定する
                message: permission.message,
            },
            {
                // 権限確認関数から返されたHTTPステータスコードを設定する
                status: permission.status,
            }
        );
    }

    try {
        // リクエストの本文（JSON形式）を読み取る
        const body = await request.json();
        // 文字列なら前後の空白を取り除き、そうでなければ空文字にする
        const name = typeof body.name === "string"
            ? body.name.trim()
            : "";
        
        // 名前が空文字の場合、処理を中断する
        if(!name) {
            return NextResponse.json(
                {
                    // 画面側に表示するメッセージ
                    message: "社員の名前を入力してください"
                },
                {
                    // レスポンスのHTTPステータスを400に設定する
                    status: 400
                }
            );
        }

        // Employeeテーブルから、入力された名前と完全一致する社員を検索する
        const employees = await prisma.employee.findMany({
            // 検索条件はnameが入力された名前と一致すること
            where: {
                name
            },
            // 社員に紐づく在籍区分の情報も一緒に取得する
            include: {
                enrollmentstatus: true,
            },
            // 同姓同名を検出できるよう、最大2人まで取得する
            take: 2,
        });

        // 検索結果が0件なら、該当する社員はいない
        if(employees.length === 0) {
            return NextResponse.json(
                {
                    // 画面側に表示するメッセージ
                    message: "該当する社員が見つかりません"
                },
                {
                    // レスポンスのHTTPステータスを404に設定する
                    status: 404
                }
            );
        }

        // 同じ名前の社員が2人以上いる場合、対象を特定できないため中断する
        if(employees.length > 1) {
            return NextResponse.json(
                {
                    // 同姓同名がいることを伝えるメッセージ
                    message: "同じ名前の社員が複数います。社員を特定できません",
                },
                {
                    // レスポンスのHTTPステータスを409に設定する
                    status: 409
                }
            );
        }

        // 検索結果が1人だけなので、その社員の情報を取り出す
        const employee = employees[0];

        // auth_user_idがnullの場合、まだ会員登録が完了していない
        if(employee.auth_user_id === null) {
            return NextResponse.json(
                {
                    // 会員登録が未完了であることを伝える
                    message: `${employee.name}はまだ会員ではないため権限付与はできません`,
                },
                {
                    // HTTPステータス400（不正なリクエスト）を返す
                    status: 400
                }
            );
        }

        // admin_flagがtrueなら、すでに管理者である
        if(employee.admin_flag) {
            return NextResponse.json(
                {
                    // 社員名をメッセージに埋め込む
                    message: `${employee.name}はすでに管理者です`,
                },
                {
                    // HTTPステータス409（競合）を返す
                    status: 409
                }
            );
        }

        // 在籍区分が「在籍」以外なら、権限を付与しない
        if(employee.enrollmentstatus.enrollment_status !== "在籍") {
            return NextResponse.json(
                {
                    // 社員名とエラーメッセージを返す
                    message: `${employee.name}は在籍中ではないため、権限を付与できません`,
                },
                {
                    // HTTPステータス400（リクエストを処理できない）を返す
                    status: 400
                }
            );
        }

        // ここまでのチェックを通過した社員の管理者権限を更新する
        const result = await prisma.employee.updateMany({
            // 更新対象を指定する
            where: {
                // 検索した社員のIDが一致すること
                id: employee.id,
                // 現在、管理者ではないこと（falseであること）
                admin_flag: false,
                // 検索時と在籍区分のIDが変わっていないこと
                enrollment_status_id: employee.enrollment_status_id,
            },
            // 更新する項目と値を指定する
            data: {
                // 管理者権限を付与する
                admin_flag: true,
            },
        });

        // 条件に一致するレコードが更新されなかった場合
        if(result.count === 0) {
            return NextResponse.json(
                {
                    // 更新できなかった理由を画面側に伝える
                    message: "社員情報が変更されたため、権限を付与できませんでした。再度確認してください",
                },
                {
                    // HTTPステータス409（競合）を返す
                    status: 409
                }
            );
        }

        // DBの更新に成功した場合、成功メッセージを返す
        return NextResponse.json(
            {
                // 対象の社員名を含むメッセージを作成する
                message: `${employee.name}に管理者権限が付与されました`,
            },
            {
                // HTTPステータス200（成功）を返す
                status: 200
            }
        );
    } catch(error) {
        // 処理中にエラーが発生した場合、サーバーのターミナルに詳細を出力する
        console.error("管理者権限付与APIエラー:", error);

        return NextResponse.json(
            {
                // 画面に返すエラーメッセージ
                message: "処理中にエラーが発生しました"
            },
            {
                // HTTPステータス500（サーバー内部のエラー）を返す
                status: 500
            }
        );
    }
}