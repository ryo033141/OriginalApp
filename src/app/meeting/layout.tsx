// Supabaseのサーバー用クライアントを作成する機能を読み込む
import { createServerClient } from "@supabase/ssr";
// Next.jsでリクエストのCookieを取得する機能を読み込む
import { cookies } from "next/headers";
// Next.jsで別のページへリダイレクトする機能を読み込む
import { redirect } from "next/navigation";
// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";
// 社員が削除されたかを監視するコンポーネントを読み込む
import EmployeeDeletionWatcher from "@/components/EmployeeDeletionWatcher";

// Meeting配下のページへのアクセスを制御するレイアウトを定義する
export default async function MeettingLayout ({
    // 子ページの内容を受け取る
    children,
}: {
    // 子ページの型をReactNodeとして定義する
    children: React.ReactNode;
}) {
    // リクエストに含まれるCookieを取得する
    const cookiesStore = await cookies();
    // 管理者ログインを示すCookieからユーザーIDを取得する
    // Cookieが存在しない場合はundefinedになる
    const adminLoginUserId = cookiesStore.get("admin_login_user_id")?.value;
    // Supabaseのサーバー用クライアントを作成する
    const supabase = createServerClient(
        // SupabaseプロジェクトのURLを環境変数から取得する
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // Supabaseの公開用キーを環境変数から取得する
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            // Supabaseが使用するCookieの取得・更新方法を設定する
            cookies: {
                // リクエストに保存されているすべてのCookieを取得する
                getAll() {
                    // Cookieの一覧を返す
                    return cookiesStore.getAll();
                },

                // Supabaseが更新したCookieを保存する処理を定義する
                setAll(cookiesToset) {
                    try {
                        // 更新対象のCookieを一つずつ処理する
                        cookiesToset.forEach(({name,value,options}) => {
                            // Cookieの名前、値、有効期限などの設定を指定して保存する
                            cookiesStore.set(name,value,options);
                        });
                    } catch {
                        // Server ComponentではCookieを書き込めない場合があるため、
                        // その場合はエラーを無視する
                    }
                },
            },
        }
    );

    // Supabaseからログインユーザーの認証情報（クレーム）を取得する
    const {data,error} = await supabase.auth.getClaims();
    // 認証情報に含まれるユーザーID（UUID）を取得する
    // 認証情報が取得できない場合はundefinedになる
    const authUserId = data?.claims?.sub;

    // 認証エラーが発生した場合、またはユーザーIDが存在しない場合は
    // 未ログインと判断してサインイン画面へ移動する
    if(error || !authUserId) {
        // /signinへリダイレクトする
        redirect("/signin");
    }

    // 管理者ログイン用CookieのユーザーIDと
    // 現在ログインしているSupabaseユーザーのIDが一致するか確認する
    if(adminLoginUserId === authUserId) {
        // 管理者ログイン中に一般画面へアクセスした場合は
        // サインイン画面へリダイレクトする
        redirect("/signin");
    }

    // 社員削除の監視コンポーネントとページ本体を表示する
    return (
        <>
            <EmployeeDeletionWatcher/>
            {children}
        </>
    )
}