// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";
// Supabaseのサーバー用クライアントを作成する機能を読み込む
import { createServerClient } from "@supabase/ssr";
// リクエストのCookieを取得する機能を読み込む
import { cookies } from "next/headers";

/**
 * 社員管理APIを利用できる管理者かどうかを確認する
 * 管理者ログイン経由で、かつ管理者権限がある場合のみ許可する
 */
export async function checkAdminPermission() {
    // リクエストに含まれるCookieを取得する
    const cookisStore = await cookies();
    // 管理者ログインを示すCookieからユーザーIDを取得する
    const adminLoginUserId = cookisStore.get("admin_login_user_id")?.value;
    // Supabaseのサーバー用クライアントを作成する
    const supabase = createServerClient(
        // SupabaseプロジェクトのURLを環境変数から取得する
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // Supabaseの公開用APIキーを環境変数から取得する
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            // Cookieの取得・更新方法を設定する
            cookies: {
                // SupabaseがCookieを取得するときに呼び出す関数を定義する
                getAll() {
                    // 現在のリクエストに含まれるすべてのCookieを返す
                    return cookisStore.getAll();
                },
                // SupabaseがCookieを更新するときに呼び出す関数を定義する(
                setAll(cookiesToSet) {
                    try {
                        // 更新対象のCookieを1つずつ取り出して処理する
                        cookiesToSet.forEach(({name,value,options}) => {
                            // Cookieの名前・値・オプションを指定してCookieを更新する
                            cookisStore.set(name,value,options);
                        });
                    } catch {
                        // この場所ではエラーを無視する
                    }
                },
            },
        }
    );

    // Supabaseに現在の認証情報を確認させ、認証済みユーザーの情報を取得する
   const  {data,error} = await supabase.auth.getClaims();
   // 認証情報に含まれるsub（ユーザーID）を取得する
   const authUserId = data?.claims?.sub;

   // 認証エラーが発生した場合、またはユーザーIDを取得できなかった場合に処理する
   if(error || !authUserId) {
        // 権限がないことを示す情報を返す
        return {
            // このユーザーのアクセスを許可しない
            allowed: false,
            // 認証されていないことを示すHTTPステータスコード401を指定する
            status: 401,
            // 呼び出し元に返すエラーメッセージを指定する
            message: "ログインが必要です。",
        };
   }

   // Prismaを使い、認証済みユーザーに対応する社員情報をデータベースから検索する
   const employee = await prisma.employee.findUnique({
        // 検索条件を指定する
        where: {
            // 社員テーブルのauth_user_idが、ログインユーザーのIDと一致するレコードを検索する
            auth_user_id: authUserId,
        },
        // 検索結果から取得する項目を指定する
        select: {
            // 管理者かどうかを判定するため、admin_flagだけを取得する
            admin_flag: true,
        },
   });

   // 社員情報が存在しない場合、または管理者フラグがtrueでない場合に処理する
   if(!employee || employee.admin_flag !== true) {
        // 権限がないことを示す情報を返す
        return {
            // このユーザーのアクセスを許可しない
            allowed: false,
            // 認証済みだが権限がないことを示すHTTPステータスコード403を指定する
            status: 403,
            // 呼び出し元に返すエラーメッセージを指定する
            message: "この操作を行う権限がありません。",
        };
    }

    // ここまでの認証・権限チェックをすべて通過した場合、管理者としてアクセスを許可する
    return {
        // ここまでの認証・権限チェックをすべて通過した場合、管理者としてアクセスを許可する
        allowed: true,
        // 正常であることを示すHTTPステータスコード200を指定する
        status: 200,
        // 許可された場合はエラーメッセージを空文字にする
        message: "",
    };
}