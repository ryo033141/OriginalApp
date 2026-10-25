// Supabaseのサーバー用クライアントを作成する機能を読み込む
import { createServerClient } from "@supabase/ssr";
// Next.jsでリクエストのCookieを取得する機能を読み込む
import { cookies } from "next/headers";
// Next.jsで別のページへリダイレクトする機能を読み込む
import { redirect } from "next/navigation";
// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";

// Employee配下のページを保護するレイアウトを定義する
export default async function EmployeeLayout({
    // 子ページの内容を受け取る
    children,
}: {
    // 子ページの型をReactNodeとして定義する
    children: React.ReactNode
}) {
    // リクエストのCookieを取得する
    const cookiesStore = await cookies();
    // 管理者ログインを示すCookieからユーザーIDを取得する
    const adminLoginUserId = cookiesStore.get("admin_login_user_id")?.value;
    // Supabaseのサーバー用クライアントを作成する
    const supabase = createServerClient(
        // SupabaseプロジェクトのURLを設定する
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // Supabaseの公開用キーを設定する
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            // Cookieの読み書き方法を設定する
            cookies: {
                // 保存されているCookieをすべて取得する
                getAll() {
                    return cookiesStore.getAll();
                },
                // Supabaseが更新したCookieを保存する
                setAll(cookiesToset) {
                    try {
                        // 更新対象のCookieを順番に保存する
                        cookiesToset.forEach(({name,value,options}) => {
                            cookiesStore.set(name,value,options);
                        });
                    } catch {
                        // Server ComponentでCookieを書き込めない場合は何もしない
                    }
                },
            },
        }
    );

    // Supabaseから認証済みユーザーのクレームを取得する
    const {data,error} = await supabase.auth.getClaims();
    // 認証ユーザーのUUIDを取得する
    const authUserId = data?.claims?.sub;

    // 認証エラーまたは未ログインの場合はサインイン画面へ移動する
    if(error || !authUserId) {
        redirect("/signin");
    }

    // 認証ユーザーのUUIDに一致する社員情報をデータベースから取得する
    const employee = await prisma.employee.findUnique({
        // SupabaseのユーザーIDと社員情報を照合する
        where: {
            auth_user_id: authUserId,
        },
        // 管理者フラグだけを取得する
        select: {
            admin_flag: true
        },
    });

    // 社員情報が存在しない場合、管理者でない場合、
    // または管理者ログイン時のユーザーIDと一致しない場合は移動する
    if(
        !employee || 
        !employee.admin_flag || 
        !adminLoginUserId ||
        adminLoginUserId !== authUserId
    ) {
        // サインイン画面へリダイレクトする
        redirect("/signin");
    }

    // 管理者であれば子ページを表示する
    return <>{children}</>
}