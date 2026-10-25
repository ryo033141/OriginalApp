// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";
// NextResponseを読み込む
import { NextResponse } from "next/server";
// 共通ファイルから管理者権限チェック関数を読み込む
import { checkAdminPermission } from "@utils/checkAdminPermission";

// GETリクエストを受け取るAPI
export async function GET() {
    // 管理者権限を確認する関数を呼び出し、確認結果が返るまで待つ
    const permission = await checkAdminPermission();

    // 管理者権限がなく、処理が許可されていない場合に実行する
    if(!permission.allowed) {
        // エラーメッセージとHTTPステータスコードをJSON形式で返す
        return NextResponse.json(
            {
                // 権限チェック関数から返されたエラーメッセージを設定する
                message: permission.message,
            },
            {
                // 権限チェック関数から返されたHTTPステータスコードを設定する
                status: permission.status
            }
        );
    }

    try{
        // 社員一覧を取得する
        const employees = await prisma.employee.findMany({
            include: {
                // 部署情報を取得する
                department: true,
                // 役職情報を取得する
                position: true,
                // 雇用区分情報を取得する
                employmentstatus: true,
                // 在籍区分情報を取得する
                enrollmentstatus: true,
            },
        });

        // 社員一覧をJSON形式で返す
        return NextResponse.json(
            {
                employees,
            },
            {
                status: 200
            }
        );
    } catch(error) {
        // エラー内容をコンソールに表示する
        console.error(error);

        // エラーメッセージを返す
        return NextResponse.json(
            {
                message: "社員一覧の取得に失敗しました。",
            },
            {
                status: 500
            }
        );
    }
}

// POSTリクエストを受け取るAPI
export async function POST(request: Request) {
    // 管理者権限を確認する関数を呼び出し、確認結果が返るまで待つ
    const permission = await checkAdminPermission();

    // 管理者権限がなく、処理が許可されていない場合に実行する
    if(!permission.allowed) {
        // エラーメッセージとHTTPステータスコードをJSON形式で返す
        return NextResponse.json(
            {
                // 権限チェック関数から返されたエラーメッセージを設定する
                message: permission.message,
            },
            {
                // 権限チェック関数から返されたHTTPステータスコードを設定する
                status: permission.status
            }
        );
    }

    try {
        // リクエストボディ(JSON形式)を取得する
        const body = await request.json();

        // 社員番号が入力されているか確認する
        if(body.id === undefined || body.id === null || body.id === "") {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    message: "社員番号を入力してください。",
                },
                {
                    status: 400,
                }
            );
        }

        // 氏名が入力されているか確認する
        if(typeof body.name !== "string" || body.name.trim() === "") {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    message: "氏名を入力してください。",
                },
                {
                    status: 400,
                }
            );
        }
        
        // メールアドレスが入力されているか確認する
        if(typeof body.email !== "string" || body.email.trim() === "") {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    message: "メールアドレスを入力してください。",
                },
                {
                    status: 400,
                }
            );
        }

        // 所属部署が入力されているか確認する
        if(body.department_id === undefined || body.department_id === null || body.department_id === "") {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    message: "所属部署を入力してください。",
                },
                {
                    status: 400,
                }
            );
        }

        // 役職が入力されているか確認する
        if(body.position_id === undefined || body.position_id === null || body.position_id === "") {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    message: "役職を入力してください。",
                },
                {
                    status: 400,
                }
            );
        }

        // 雇用区分が入力されているか確認する
        if(body.employee_status_id === undefined || body.employee_status_id === null || body.employee_status_id === "") {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    message: "雇用区分を入力してください。",
                },
                {
                    status: 400,
                }
            );
        }

        // 在籍区分が入力されているか確認する
        if(body.enrollment_status_id === undefined || body.enrollment_status_id === null || body.enrollment_status_id === "") {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    message: "在籍区分を入力してください。",
                },
                {
                    status: 400,
                }
            );
        }

        // 同じ社員番号の社員が存在するか確認する
        const existtingEmployee = await prisma.employee.findUnique({
            // 社員番号を検索条件にする
            where: {
                id: Number(body.id),
            },
        });

        // 同じ社員番号の社員が存在する場合
        if(existtingEmployee) {
            // 同じ社員番号の社員が存在する場合
            return NextResponse.json(
                {
                    message: "すでに同じ社員番号の社員が存在します。",
                },
                {
                    status: 400,
                }
            );
        }

        // 同じメールアドレスの社員が存在するか確認する
        const existtingEmail = await prisma.employee.findFirst({
            // メールアドレスを検索条件にする
            where: {
                email: body.email.trim(),
            },
        });

        // 同じメールアドレスの社員が存在する場合
        if(existtingEmail) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    message: "すでに存在しているメールアドレスです。",
                },
                {
                    status: 400,
                }
            );
        }

         // Employeeテーブルに新しいデータを登録する
         const employee = await prisma.employee.create({
            // 登録するデータ
            data: {
                // 社員番号を登録する
                id: Number(body.id),
                // 氏名を登録する
                name: body.name.trim(),
                // メールアドレスを登録する
                email: body.email.trim(),
                // 選択した部署IDを保存する
                department_id: Number(body.department_id),
                // 選択した役職IDを保存する
                position_id: Number(body.position_id),
                // 選択した雇用区分IDを保存する
                employee_status_id: Number(body.employee_status_id),
                // 選択した在籍区分IDを保存する
                enrollment_status_id: Number(body.enrollment_status_id),
            },
         });

         // 登録したデータをJSON形式で返す
         return NextResponse.json(
            {
                // 成功メッセージを返す
                message: "社員登録が完了しました。",
                // 登録した社員情報を返す
                employee,
            },
            {
                // 登録成功
                status: 201,
            }
        );
    } catch(error) {
        // エラー内容をサーバーのコンソールに出力する
        console.log(error);

        // エラーが発生した事をクライアントに返す
        return NextResponse.json(
            {
                message: "社員の登録に失敗しました。",
            },
            {
                // サーバーエラー
                status: 500,
            }
        );
    }
}