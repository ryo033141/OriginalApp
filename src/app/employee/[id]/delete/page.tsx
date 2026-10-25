"use client";

// Headerコンポーネントの読み込み
import Header from "@/components/Header"
// URLの社員番号を取得するuseParamsとページ遷移に使用するuseRouter読み込む
import { useParams,useRouter } from "next/navigation";
// ReactのuseEffectとuseStateを読み込む
import { useEffect,useState } from "react";
// Toast通知を表示する
import toast from "react-hot-toast";

export default function Page() {
    // ページ遷移に使用するrouterを取得する
    const router = useRouter();
    // URLのidを取得
    const {id} = useParams();
    // 社員情報の取得が完了したかどうかを管理する
    const [employeeLoaded,setEmployeeLoaded] = useState(false);
    // 社員情報が存在するかどうかを管理する
    const [employeeExists,setEmployeeExists] = useState(false);
    // 社員情報の取得エラーメッセージを管理する
    const [employeeError,setEmployeeError] = useState("");

    // 社員情報を取得する
    useEffect(() => {
        // URLに社員番号がない場合はAPI通信を行わない
        if(!id) {
            return;
        }

        // 社員情報を取得する非同期関数を定義する
        const fetchEmployee = async () => {
            try {
                // 社員情報取得APIを呼び出す
                const response = await fetch(`/api/employees/${id}`);

                // 社員が存在しない場合
                if(response.status === 404) {
                    // エラーメッセージを設定する
                    setEmployeeError("この社員は存在しません");

                    // これ以降の処理を実行せず終了する
                    return;
                }

                // その他のエラーが発生した場合
                if(!response.ok) {
                    // エラーを発生させcatchに処理を移す
                    throw new Error("社員情報の取得に失敗しました");
                }

                // APIから返されたデータをJSON形式に変換する
                const data = await response.json();

                // 社員情報が存在しない場合
                if(!data.employee) {
                    // エラーメッセージを設定する
                    setEmployeeError("この社員は存在しません");

                    // これ以降の処理を実行せず終了する
                    return;
                }

                // 社員情報が存在することを記録する
                setEmployeeExists(true);
            } catch(error) {
                // エラー内容をコンソールに表示する
                console.error("社員情報の取得に失敗しました", error);

                // エラーメッセージを設定する
                setEmployeeError("社員情報の取得に失敗しました");
            } finally {
                // 成功・失敗にかかわらず取得処理の完了を記録する
                setEmployeeLoaded(true);
            }
        };

        // 社員情報の取得を開始する
        fetchEmployee();
    },[id]);

    // 社員を削除する処理
    const handleDelete = async () => {
        try {
            // DELETE APIを呼び出す
            const response = await fetch(`/api/employees/${id}`,{
                // HTTPメソッドにDELETEを指定する
                method: "DELETE",
            });

            // APIから返ってきたデータをJSON形式に変換する
            const data = await response.json();

            // APIの処理が失敗した場合
            if(!response.ok) {
                // APIから返されたエラーメッセージを表示する
                toast.error(data.message ?? "社員情報の削除に失敗しました。");
                // 処理を終了する
                return;
            }

            // 削除成功メッセージを表示する
            toast.success(data.message);
            // 1秒後に社員一覧画面へ移動する
            setTimeout(() => {
                router.push("/employee");
            },1000);
        } catch(error) {
            // エラー内容をコンソールに表示する
            console.error(error);

            // エラーメッセージを表示する
            toast.error("社員情報の削除に失敗しました。");
        }
    };

    return (
        <>
            <Header backPath={`/employee/${id}`}/>
            {!id || employeeLoaded && employeeError ? (
                <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                    <p className="mt-8 ml-5 text-red-600">
                        {!id ? "社員番号が指定されていません。"
                            : employeeError}
                    </p>
                </main>
            ) : !employeeLoaded ? (
                <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                    <p className="mt-8 ml-5">読み込み中...</p>
                </main>                    
            )  : employeeExists ? (
                    <main className="w-full max-w-[1440px] mx-auto px-10 min-h-[calc(100vh-80px)] flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <h1 className="font-bold text-xl">削除確認</h1>
                            <p className="text-xl mt-4">本当に削除してよろしいですか？</p>
                            <div className="flex gap-10 mt-8">
                                <button 
                                    className="w-35 h-10 bg-orange-400 text-white text-lg cursor-pointer"
                                    onClick={() => router.push(`/employee/${id}`)}
                                >
                                    キャンセル
                                </button>
                                <button 
                                    className="w-35 h-10 bg-red-500 text-white text-lg cursor-pointer"
                                    onClick={handleDelete}
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    </main>
            ) : (
                <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                    <p className="mt-8 ml-5 text-red-600">
                        社員情報を確認できません。
                    </p>
                </main>  
            )}
        </>
    )
}