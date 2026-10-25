"use client";

// ReactのuseStateを読み込む
import { useEffect,useState } from "react";
// Next.jsの画面遷移に使用するuseRouterを読み込む
import { useRouter } from "next/navigation";
// Headerコンポーネントの読み込み
import Header from "@/components/Header";
// Toast通知を表示するためのtoastを読み込む
import toast from "react-hot-toast";

export default function Page() {
  // ページ遷移に使用するrouterを取得する
  const router = useRouter();
  
  // 会議タイトルを管理する
  const [title,setTitle] = useState("");
  // 主催者のメールアドレスを管理する
  const [organizerEmail,setOrganizerEmail] = useState("");
  // 必須参加者入力欄の現在の入力値を管理する
  const [requiredEmailInput,setRequiredEmailInput] = useState("");
  // 任意参加者入力欄の現在の入力値を管理する
  const [optionalEmailInput,setOptionalEmailInput] = useState("");
  // 会議場所を管理する
  const [place,setPlace] = useState("");
  // 開始日時を管理する
  const [startDate,setStartDate] = useState("");
  // 終了日時を管理する
  const [endDate,setEndDate] = useState("");
  // 説明を管理する
  const[description,setDescription] = useState("");
  // API通信中かどうかを管理する
  const [isSubmitting,setIsSubmitting] = useState(false);

  // 画面表示時にログインユーザーの情報を取得する
  useEffect(() => {
    // ログインユーザー情報を取得する関数
    const fetchMe = async () => {
        // 自分の情報を取得するAPIを呼び出す
        const response = await fetch("/api/me");
        // APIから返ってきたJSONデータを取得する
        const data = await response.json();
        
        // APIの取得に失敗した場合
        if(!response.ok) {
            // エラーメッセージをToast表示する
            toast.error(data.message ?? "ユーザー情報の取得に失敗しました");
            // 処理を終了する
            return;
        }

        // ログインユーザーのメールアドレスを主催者に設定する
        setOrganizerEmail(data.email);
    }

    // ログインユーザー情報を取得する
    fetchMe();
  },[]);

  // datetime-localの値をAPI用の日時形式へ変換する
  const formatDateTime = (value: string) => {
    // 入力値が空の場合は空文字を返す
    if(value === "") {
        return "";
    }

    // 「T」を「 」に変更する
    return value
        .replace("T", " ")
        .replace(/-/g, "/");
  }

  // フォーム送信時の処理
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // ブラウザ標準のフォーム送信を停止する
    event.preventDefault();
    
    // すでに送信中の場合は何もしない
    if(isSubmitting) {
        return;
    }

    // API通信中にする
    setIsSubmitting(true);

    try {
        // 必須参加者をカンマ区切りから配列へ変換する
        const requiredEmails = requiredEmailInput
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email !== "");
        // 任意参加者をカンマ区切りから配列へ変換する
        const optionalEmails = optionalEmailInput
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email !== "");
        
        // 必須参加者と任意参加者がどちらも空か確認する
        if(requiredEmails.length === 0 && optionalEmails.length === 0) {
            // エラーメッセージを表示する
            toast.error("主催者以外に1人以上の参加者を入力してください");
            // 送信中状態を解除する
            setIsSubmitting(false);

            // 処理を終了する
            return;
        }

        // 必須参加者に重複があるか確認する
        if(new Set(requiredEmails).size !== requiredEmails.length) {
            // エラーメッセージを表示する
            toast.error("必須参加者に同じメールアドレスを重複して入力できません");

            // 処理を終了する
            return;
        }

        // 任意参加者に重複があるか確認する
        if(new Set(optionalEmails).size !== optionalEmails.length) {
            // エラーメッセージを表示する
            toast.error("任意参加者に同じメールアドレスを重複して入力できません");

            // 処理を終了する
            return;
        }

        // 必須参加者と任意参加者が重複しているか確認する
        if(requiredEmails.some((email) => optionalEmails.includes(email))) {
            // エラーメッセージを表示する
            toast.error("同じ参加者を必須と任意の両方に指定できません");

            // 処理を終了する
            return;
        }

        // 必須参加者に主催者自身が含まれているか確認する
        if(requiredEmails.includes(organizerEmail)) {
            // エラーメッセージを表示する
            toast.error("主催者を必須参加者に指定することはできません");

            // 処理を終了する
            return;
        }

        // 任意参加者に主催者自身が含まれているか確認する
        if(optionalEmails.includes(organizerEmail)) {
            // エラーメッセージを表示する
            toast.error("主催者を任意参加者に指定することはできません");

            // 処理を終了する
            return;
        }

        // APIへPOSTリクエストを送信する
        const response = await fetch(
            "/api/meetings",
            {
                // HTTPメソッドをPOSTにする
                method: "POST",
                // JSONを送信することを指定する
                headers: {
                    "Content-Type": "application/json",
                },

                // APIへ送信するデータ
                body: JSON.stringify({
                    // 会議タイトル
                    title: title,
                    // 会議場所
                    place: place,
                    // 開始日時
                    startDate: formatDateTime(startDate),
                    // 終了日時
                    endDate: formatDateTime(endDate),
                    // 説明
                    description: description,
                    // カンマ区切りから配列に変換した必須参加者
                    requiredEmails: requiredEmails,
                    // カンマ区切りから配列に変換した任意参加者
                    optionalEmails: optionalEmails,
                }),
            }
        );

        // APIから返ってきたJSONを取得する
        const result = await response.json();

        // APIがエラーを返した場合
        if(!response.ok) {
            // 失敗メッセージをToast表示する
            toast.error(result.error ?? "会議の登録に失敗しました");
            // 処理を終了する
            return;
        }

        // 成功メッセージをToast表示する
        toast.success("会議を新規作成しました");
        // 1秒後に/meetingへ移動する
        setTimeout(() => {
            router.push("/meeting");
        },1000);
    } catch(error) {
        // コンソールにエラーを出力する
        console.error(error);
        // 失敗メッセージをToast表示する
        toast.error("会議の登録に失敗しました");
    } finally {
        // API通信中を解除する
        setIsSubmitting(false);
    }
  };

  return (
    <>
        <Header backPath="/meeting"/>
        <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
            <h1 className="text-xl ml-5 mt-5">会議新規作成</h1>
            <form onSubmit={handleSubmit}>
                <div className="mt-4 ml-5 flex items-center">
                    <label htmlFor="title" className="w-32 text-xl font-bold">タイトル</label>
                    <input 
                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                        id="title" 
                        type="text"
                        placeholder="タイトルを入力してください"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                    />
                </div>
                <div className="mt-4 ml-5 flex items-center">
                    <label htmlFor="organizer" className="w-32 text-xl font-bold">主催者</label>
                    <input 
                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                        id="organizer" 
                        type="text"
                        placeholder="主催者を入力してください"
                        value={organizerEmail}
                        readOnly
                    />
                </div>
                <div className="mt-4 ml-5 flex items-center">
                    <label htmlFor="requiredParticipant" className="w-32 text-xl font-bold">必須参加者</label>
                    <div className="ml-3 w-full">
                        <div className="border border-gray-400 rounded px-3 py-2 min-h-12 flex flex-warp items-center gap-2">
                            <input 
                                className="outline-none text-xl flex-1 min-w-50" 
                                id="requiredParticipant"
                                placeholder="メールアドレスをカンマ区切りで入力してください"
                                type="text"
                                value={requiredEmailInput}
                                onChange={(event) => setRequiredEmailInput(event.target.value)}
                            />                      
                        </div>
                    </div>
                </div>
                <div className="mt-4 ml-5 flex items-center">
                    <label htmlFor="optionalParticipant" className="w-32 text-xl font-bold">任意参加者</label>
                    <input 
                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                        id="optionalParticipant" 
                        placeholder="メールアドレスをカンマ区切りで入力してください"
                        type="text"
                        value={optionalEmailInput}
                        onChange={(event) => setOptionalEmailInput(event.target.value)}
                    />
                </div>
                <div className="mt-4 ml-5 flex items-center">
                    <label htmlFor="meetingplace" className="w-32 text-xl font-bold">開催場所</label>
                    <input 
                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                        id="meetingplace" 
                        type="text"
                        placeholder="開催場所を入力してください"
                        value={place}
                        onChange={(event) => setPlace(event.target.value)}
                        required
                    />
                </div>
                <div className="mt-4 ml-5 flex items-center">
                    <label htmlFor="startdate" className="w-32 text-xl font-bold">開始日時</label>
                    <input 
                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                        id="startdate" 
                        type="datetime-local"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        required
                    />
                </div>
                <div className="mt-4 ml-5 flex items-center">
                    <label htmlFor="enddate" className="w-32 text-xl font-bold">終了日時</label>
                    <input 
                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                        id="enddate" 
                        type="datetime-local"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        required
                    />
                </div>
                <div className="mt-4 ml-5 flex items-start">
                    <label htmlFor="description" className="w-32 text-xl font-bold">説明</label>
                    <textarea 
                        className="border border-gray-400 rounded ml-3 px-3 py-4 text-xl h-30 w-full"
                        id="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    >
                    </textarea>
                </div>

                <div className="flex justify-center gap-10 mt-8">
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-35 h-10 bg-[#8ba6e0] text-white text-lg cursor-pointer disabled:opacity-50"
                    >
                        {isSubmitting ? "登録中..." : "新規作成"}
                    </button>
                </div>
            </form>
        </main>
    </>
  );
}