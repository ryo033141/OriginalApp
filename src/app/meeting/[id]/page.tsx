"use client";

// Next.jsの画面遷移に使用するuseRouterを読み込む
import Header from "@/components/Header";
// ReactのuseEffectとuseStateを読み込む
import { useEffect,useState } from "react";
// Headerコンポーネントを読み込む
import { useRouter } from "next/navigation";
// URLから会議IDを取得するためにuseParamsを読み込む
import { useParams } from "next/navigation";

// 会議データの型を定義する
type Meeting = {
    // 会議ID
    id: number;
    // 会議タイトル
    title: string;
    // 開催場所
    place: string;
    // 開始日時
    start_datetime: string;
    // 終了日時
    end_datetime: string;
    // 説明
    description: string | null;
}

//「YYYY年M月D日 HH:mm」形式で日時を表示する関数
const formatDateTime = (dateString: string) => {
    // APIから取得した日時をDateオブジェクトに変換する
    const date = new Date(dateString);

    // 日時を日本語形式に変換して返す
    return new Intl.DateTimeFormat("ja-JP",{
        // DBに保存したUTCの数字をそのまま表示する
        timeZone: "UTC",
        // 年を表示する
        year: "numeric",
        // 月を表示する
        month: "numeric",
        // 日を表示する
        day: "numeric",
        // 時間を表示する
        hour: "2-digit",
        // 分を表示する
        minute: "2-digit",
        // 24時間表示にする
        hour12: false,
    }).format(date);
}

export default function Page() {
  // 画面遷移を行うためのrouterを取得する
  const router = useRouter();
  // URLのパラメータを取得する
  const params = useParams();
  // URLの[id]から会議IDを取得する
  const id = params.id as string;
  // APIから取得した会議情報を保存する
  const [meeting,setMeeting] = useState<Meeting | null>(null);
  // 会議詳細の読み込み状態を保存する
  const [loading,setLoading] = useState(true);
  // エラーメッセージを保存する
  const [error,setError] = useState("");

  // ページが表示されたときに会議詳細を取得する
  useEffect(() => {
    // 会議詳細を取得する非同期関数を定義する
    const fetchMeeting = async () => {
        try {
            // 会議IDを指定して会議詳細取得APIを呼び出す
            const response = await fetch(`/api/meetings/${id}`);

            // 会議が存在しない場合
            if(response.status === 404) {
                setError("この会議は存在しません。");
                return;
            }

            // APIのレスポンスが正常か確認する
            if(!response.ok) {
                // エラーを発生させる
                throw new Error("会議詳細の取得に失敗しました");
            }

            // APIから返ってきたJSONデータを取得する
            const data = await response.json();   
            // 取得した会議情報をstateに保存する
            setMeeting(data.meeting);
        } catch(error) {
            // エラーが発生した場合はコンソールに表示する
            console.error(error);
            // 画面に表示するエラーメッセージを設定する
            setError("会議詳細の取得に失敗しました");
        } finally {
            // 読み込み処理が終了したことを設定する
            setLoading(false);
        }
    };

    // 会議詳細を取得する
    fetchMeeting();
  },[id]);

  // 会議情報を取得中の場合
  if(loading) {
    return (
        <>
            <Header backPath="/meeting"/>
            <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                <h1 className="text-xl ml-5 mt-5">会議詳細</h1>
                <p className="mt-8 ml-5">読み込み中...</p>
            </main>
        </>
    );
  }

  // 会議情報の取得に失敗した場合
  if(error || !meeting) {
    return (
        <>
            <Header backPath="/meeting"/>
            <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                <h1 className="text-xl ml-5 mt-5">会議詳細</h1>
                <p className="mt-8 ml-5 text-red-500">
                    {error || "この会議は存在しません"} 
                </p>
            </main>
        </>
    );
  }

  return (
    <>
        <Header backPath="/meeting"/>
        <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
            <h1 className="text-xl ml-5 mt-5">会議詳細</h1>
                <table className="w-full border-collapse">
                    <tbody>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8  text-xl font-bold">タイトル</th>
                            <td className="text-xl font-normal">{meeting.title}</td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 text-xl font-bold">開催場所</th>
                            <td className="text-xl font-normal">{meeting.place}</td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 text-xl font-bold">開始日時</th>
                            <td className="text-xl font-normal">
                                {formatDateTime(meeting.start_datetime)}
                            </td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 text-xl font-bold">終了日時</th>
                            <td className="text-xl font-normal">
                                {formatDateTime(meeting.end_datetime)}
                            </td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 text-xl font-bold">説明</th>
                            <td className="text-xl font-normal">{meeting.description}</td>
                        </tr>
                    </tbody>
                </table>
            <div className="flex justify-center gap-10 mt-8">
                <button 
                    className="w-35 h-10 bg-[#9FD77F] text-white text-lg cursor-pointer"
                    onClick={() => router.push(`/meeting/${meeting.id}/edit`)}
                    >編集
                </button>
                <button 
                    className="w-35 h-10 bg-[#E7AD8A] text-white text-lg cursor-pointer"
                    onClick={() => router.push(`/meeting/${meeting.id}/delete`)}
                    >削除
                </button>
            </div>
        </main>
    </>
  );
}