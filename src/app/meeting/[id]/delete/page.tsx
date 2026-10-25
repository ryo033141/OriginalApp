"use client";

// Headerコンポーネントを読み込む
import Header from "@/components/Header";
// Next.jsの画面遷移に使用するuseRouterとuseParamsを読み込む
import { useParams,useRouter } from "next/navigation";
// ReactのuseEffectとuseStateを読み込む
import { useEffect,useState } from "react";
// Toast表示用
import toast from "react-hot-toast";

export default function Page() {
  // 画面遷移を行うためのrouterを取得する
  const router = useRouter();
  // URLの[id]から会議IDを取得する
  const param = useParams();
  // URLから取得した会議IDを文字列として取得する
  const id = param.id as string;
  // 会議情報の確認中かどうかを管理する
  const [loading,setLoading] = useState(true);
  // 会議が存在しない場合などのエラーメッセージを管理する
  const [error,setError] = useState("");

  // 画面が表示されたときに会議の存在を確認する
  useEffect(() => {
    // 会議の存在を確認する非同期関数を定義する
    const checkMeeting = async () => {
        try {
            // 指定した会議IDのGET APIを呼び出す
            const response = await fetch(`/api/meetings/${id}`);

            // APIが404を返した場合、会議が存在しないと判断する
            if(response.status === 404) {
                // 画面に表示するエラーメッセージを設定する
                setError("この会議は存在しません");

                // これ以降の処理を実行せずに終了する
                return;
            }

            // 404以外のエラーが発生したか確認する
            if(!response.ok) {
                // エラーを発生させてcatchに処理を移す
                throw new Error("会議情報の取得に失敗しました");
            }
        } catch(error) {
            // 発生したエラーをコンソールに表示する
            console.error(error);

            // 画面に表示するエラーメッセージを設定する
            setError("会議情報の取得に失敗しました");
        } finally {
            // 成功・失敗にかかわらず読み込みが終了したことを設定する
            setLoading(false);
        }
    };

    // 定義した会議の存在確認処理を実行する
    checkMeeting();
  },[id]);

  // 削除ボタンを押したときに実行する処理を定義する
  const handleDelete = async () => {
    try {
        // 指定した会議IDのDELETE APIを呼び出す
        const response = await fetch(`/api/meetings/${id}`,{
            // HTTPメソッドにDELETEを指定する
            method: "DELETE",
        });

        // APIから返ってきたJSONデータを取得する
        const data = await response.json();

        // APIの処理が失敗したか確認する
        if(!response.ok) {
            // APIから返されたエラーメッセージをToast表示する
            toast.error(
                data.error || "会議の削除に失敗しました"
            );
            // 処理を終了する
            return;
        }

        // APIから返された成功メッセージをToast表示する
        toast.success(data.message);
        // 1秒後に/meetingへ移動する
        setTimeout(() => {
            router.push("/meeting");
        },1000);
    } catch(error) {
        // エラー内容をコンソールに表示する
        console.error(error);
        // エラーメッセージをToast表示する
        toast.error(
            error instanceof Error
                ? error.message
                : "会議の削除に失敗しました"
        );
    }
  }

  // 会議の存在確認が終わっていない場合
  if(loading) {
    return (
        <>
            <Header backPath={`/meeting/${id}/`}/>
            <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                <p className="mt-8 ml-5">読み込み中...</p>
            </main>
        </>
    );
  }

  // エラーメッセージが設定されている場合
  if(error) {
    return (
        <>
            <Header backPath={`/meeting/${id}/`}/>
            <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                <p className="mt-8 ml-5 text-red-500">{error}</p>
            </main>
        </>
    );
  }

  return (
    <>
        <Header backPath={`/meeting/${id}/`}/>
        <main className="w-full max-w-[1440px] mx-auto px-10 min-h-[calc(100vh-80px)] flex items-center justify-center">
            <div className="flex flex-col items-center">
                <h1 className="font-bold text-xl">削除確認</h1>
                <p className="text-xl mt-4">本当に削除してよろしいですか？</p>
                <div className="flex gap-10 mt-8">
                    <button 
                        className="w-35 h-10 bg-orange-400 text-white text-lg cursor-pointer"
                        onClick={() => router.push(`/meeting/${id}/`)}
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
    </>
  );
}