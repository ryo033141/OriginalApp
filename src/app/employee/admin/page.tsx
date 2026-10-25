"use client";

// Headerコンポーネントを読み込む
import Header from "@/components/Header";
// 入力欄の値や通信中の状態を管理するためにuseStateを読み込む
import { useState } from "react";
// 成功・エラーの通知を表示するためにtoastを読み込む
import toast from "react-hot-toast";
// ページ遷移を行うためにuseRouterを読み込む
import { useRouter } from "next/navigation";

export default function Page() {
    // 入力欄に入力された社員名を管理する
    const [name,setName] = useState("");
    // APIとの通信中かどうかを管理する（初期値はfalse）
    const [loading,setLoading] = useState(false);
    // ページ遷移を操作するためのrouterを作成する
    const router = useRouter();

    // 管理者権限を付与する処理を定義する
    const handleGrantAdmin = async () => {
        // 入力された名前の前後にある空白を取り除く
        const trimmedName = name.trim();

        // 名前が空文字の場合は処理を中断する
        if(!trimmedName) {
            // 名前が入力されていないことをエラー通知で表示する
            toast.error("社員の名前を入力してください");

            // これ以降の処理を実行せずに関数を終了する
            return;
        }

        // すでに通信中の場合は、二重送信を防ぐため処理を中断する
        if(loading) {
            return;
        }

        try {
            // 通信中の状態をtrueに変更する
            setLoading(true);

            // 管理者権限付与APIにリクエストを送信する
            const response = await fetch("/api/employees/admin",{
                // HTTPのPOSTメソッドを指定する
                method: "POST",
                // 送信するデータがJSON形式であることを指定する
                headers: {
                    "Content-Type": "application/json",
                },
                // 入力された社員名をJSON形式に変換して送信する
                body: JSON.stringify({
                    name: trimmedName,
                }),
            });

            // APIから返されたレスポンス本文をJSON形式で取得する
            const data = await response.json();

            // APIのレスポンスが成功の場合
            if(response.ok) {
                // APIから返された成功メッセージをToast表示する
                toast.success(data.message);

                // 1秒後に社員一覧画面へ移動する
                setTimeout(() => {
                    router.push("/employee");
                },1000);
            } else {
                // APIから返されたエラーメッセージをToast表示する
                toast.error(
                    data.message || "管理者権限の付与に失敗しました。"
                );
            }
        } catch(error) {
            // エラーの詳細を開発者向けにターミナルへ出力する
            console.error("管理者権限付与エラー:", error);
            // 通信エラーなどが発生したことを画面に通知する
            toast.error("通信エラーが発生しました");
        } finally {
            // 通信中の状態をfalseに戻す
            setLoading(false);
        }
    }

    return (
        <>
            <Header backPath="/employee"/>
            <main className="w-full max-w-[1440px] mx-auto px-10 min-h-[calc(100vh-80px)] flex items-start justify-center pt-32">
                <div className="flex flex-col items-center">
                    <h1 className="font-bold text-xl">管理者権限付与</h1>
                    <p className="text-xl mt-4">管理者に追加したい方の名前を入力してください</p>
                    <div className="mt-4 ml-5 flex items-center">
                        <div className="ml-3 w-full">
                            <div className="border border-gray-400 rounded px-3 py-2 min-h-12 flex flex-warp items-center gap-2">
                                <input 
                                    className="outline-none text-xl flex-1 min-w-100" 
                                    placeholder="名前を入力してください"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                />                      
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-10 mt-8">
                        <button 
                                className="w-35 h-10 bg-[#8ba6e0] text-white text-lg cursor-pointer"
                                onClick={handleGrantAdmin}
                                disabled={loading}
                        >
                            権限付与
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
}