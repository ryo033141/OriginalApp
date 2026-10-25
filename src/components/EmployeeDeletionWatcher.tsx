"use client";

// Reactの状態管理ではなく、重複実行防止と副作用の管理に使う機能を読み込む
import { useEffect,useRef,useMemo } from "react";
// クライアント側で画面遷移するための機能を読み込む
import { useRouter } from "next/navigation";
// 通知メッセージを表示する機能を読み込む
import toast from "react-hot-toast";
// Supabaseのブラウザ用クライアントを作成する関数を読み込む
import { createClient } from "@utils/supabase/client";

// 社員削除の監視を行うコンポーネントを定義する
export default function EmployeeDeletionWatcher() {
    // クライアント側の画面遷移機能を取得する
    const router = useRouter();
    // 同じコンポーネントの表示中はクライアントを再利用する
    const supabase = useMemo(() => createClient(),[]);
    // 削除検知後に処理が何度も実行されないようにするフラグを用意する
    const handledRef = useRef(false);

    // コンポーネントの表示後に監視処理を開始する
    useEffect(() => {
        // 監視処理が有効かどうかを管理する
        let active = true;

        // 一定間隔で社員の存在を確認する処理を定義する
        const checkEmployeeStatus = async () => {
            // すでに削除対応を開始している場合は何もしない
            if(!active || handledRef.current) {
                return;
            }

            try {
                // 社員の存在確認APIを呼び出す
                const response = await fetch("/api/auth/employee-status",{
                    method: "GET",
                    cache: "no-store",
                });

                // 認証状態を確認できない場合は、社員削除と判断せず処理を終了する
                if(response.status === 401) {
                    return;
                }

                // その他のエラーの場合は次回の確認まで待つ
                if(!response.ok) {
                    return;
                }

                // APIから返された社員の存在確認結果を取得する
                const result: {
                    exists: boolean,
                    authenticated: boolean,
                } = await response.json();

                // 認証済みなのに社員情報が存在しない場合は削除されたと判断する
                if(result.authenticated && !result.exists) {
                    // 重複して削除対応しないようにフラグを立てる
                    handledRef.current = true;
                    // 削除されたことを通知する
                    toast.error("この社員は削除されました");
                    // Supabaseからサインアウトする
                    await supabase.auth.signOut();
                    // サインイン画面へ移動する
                    router.replace("/signin");
                }
            } catch(error) {
                // 通信エラーなどの場合はログを出し、次回の確認を待つ
                console.error("社員の存在確認に失敗しました。", error);
            }
        };

        // コンポーネント表示直後に一度確認する
        void checkEmployeeStatus();
        // 10秒ごとに社員の存在を確認する
        const intervalId = window.setInterval(() => {
            void checkEmployeeStatus();
        },10_000);

        // コンポーネントが破棄されたら定期確認を停止する
        return () => {
            // 監視を停止したことを記録する
            active = false;
            window.clearInterval(intervalId);
        };
    },[router,supabase]);

    // 画面には何も表示しない監視専用コンポーネントにする
    return null;
}