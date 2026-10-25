"use client";

// ReactのuseEffectとuseStateを読み込む
import { useEffect,useState } from "react";
// Next.jsの画面遷移に使用するuseRouterとuseParamsを読み込む
import { useParams,useRouter } from "next/navigation";
// Headerコンポーネントの読み込み
import Header from "@/components/Header";
// Toast表示用
import toast from "react-hot-toast";

// 会議情報の型を定義する
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
    // 会議の参加者一覧
    MeetingParticipants: {
        // 社員番号
        employee_id: number;
        // 参加区分
        attendance_type: "required" | "optional";
        // 社員情報
        employee: {
            // 社員のメールアドレス
            email: string;
        };
    }[];
}

export default function Page() {
    // Next.jsの画面遷移機能を取得する
    const router = useRouter();
    // URLの[id]から会議IDを取得する
    const params = useParams();
    // URLから取得した会議IDを文字列として取得する
    const id = params.id as string;
    // APIから取得した会議情報を保存する
    const [meeting,setMeeting] = useState<Meeting | null>(null);
    // 会議情報を取得中かどうかを管理する
    const [loading,setLoading] = useState(true);
    // エラーメッセージを保存する
    const [error,setError] = useState("");
    // ログインしているユーザーのメールアドレスを保存する
    const [organizerEmail,setOrganizerEmail] = useState("");

    // ページが表示されたときに会議情報とログインユーザー情報を取得する
    useEffect(() => {
        // 会議情報とログインユーザー情報を取得する非同期関数を定義する
        const fetchMeeting = async () => {
            try {
                // ログインユーザーの情報を取得する
                const meResponse = await fetch("/api/me");

                // ログインユーザー情報の取得が正常か確認する
                if(!meResponse.ok) {
                    // エラーを発生させる
                    throw new Error("ログインユーザー情報の取得に失敗しました");
                }

                // ログインユーザー情報を取得する
                const meData = await meResponse.json();
                // ログインユーザーのメールアドレスをstateに保存する
                setOrganizerEmail(meData.email);

                // 会議IDを指定して会議詳細APIを呼び出す
                const response = await fetch(`/api/meetings/${id}`);

                // 会議が存在しない場合
                if(response.status === 404) {
                    setError("この会議は存在しません");
                    return;
                }

                // APIのレスポンスが正常か確認する
                if(!response.ok) {
                    // エラーを発生させる
                    throw new Error("会議情報の取得に失敗しました");
                }

                // APIから返ってきたJSONデータを取得する
                const data = await response.json();
                // 取得した会議情報をstateに保存する
                setMeeting(data.meeting);
            } catch(error) {
                // エラー内容をコンソールに表示する
                console.error(error);
                // 画面に表示するエラーメッセージを設定する
                setError("会議情報の取得に失敗しました");
            } finally {
                // 読み込みが終了したことを設定する
                setLoading(false);
            }
        };

        // 会議情報を取得する
        fetchMeeting();
    },[id]);

    // 保存ボタンを押したときに実行する処理を定義する
    const handleSubmit = async(event: React.FormEvent<HTMLFormElement>) => {
        // フォーム送信によるページの再読み込みを防ぐ
        event.preventDefault();
        try {
            // 現在のフォームに入力されている値を取得する
            const form = event.currentTarget;
            // フォーム内の入力値を取得する
            const formData = new FormData(form);
            // タイトルを取得する
            const title = formData.get("title") as string;
            // 必須参加者の入力値を取得する
            const requiredParticipant = formData.get("requiredParticipant") as string;
            // 任意参加者の入力値を取得する
            const optionalParticipant = formData.get("optionalParticipant") as string;
            // 開催場所の入力値を取得する
            const place = formData.get("meetingplace") as string;
            // 開始日時の入力値を取得する
            const startDateInput = formData.get("startdate") as string;
            // 終了日時の入力値を取得する
            const endDateInput = formData.get("enddate") as string;
            // datetime-localの形式をバリデーションで使用する形式に変換する
            const startDate = startDateInput.replace("T", " ").replace(/-/g, "/");
            // datetime-localの形式をバリデーションで使用する形式に変換する
            const endDate = endDateInput.replace("T", " ").replace(/-/g, "/");
            // 説明の入力値を取得する
            const description = formData.get("description") as 
            string;

            // 必須参加者をカンマで分割して配列にする
            const requiredEmails = requiredParticipant
                .split(",")
                .map((email) => email.trim())
                .filter((email) => email !== "");

            // 任意参加者をカンマで分割して配列にする
            const optionalEmails = optionalParticipant
                .split(",")
                .map((email) => email.trim())
                .filter((email) => email !== "");

            // 主催者以外の参加者が1人以上いるか確認する
            if(requiredEmails.length === 0 && optionalEmails.length === 0) {
                // エラーメッセージを表示する
                toast.error("主催者以外に1人以上の参加者を入力してください");

                // 処理を終了する
                return;
            }

            // PUT APIへ送信するデータを作成する
            const body = {
                // 会議タイトルを設定する
                title: title,
                // 開催場所を設定する
                place: place,
                // 開始日時を設定する
                startDate: startDate,
                // 終了日時を設定する
                endDate: endDate,
                // 説明を設定する
                description: description,
                // 必須参加者を設定する
                requiredEmails: requiredEmails,
                // 任意参加者を設定する
                optionalEmails: optionalEmails,
            }

            // 会議更新APIを呼び出す
            const response = await fetch(`/api/meetings/${id}`,{
                // HTTPメソッドにPUTを指定する
                method: "PUT",
                // JSON形式でデータを送信することを指定する
                headers: {
                    "Content-Type": "application/json",
                },

                // 作成した会議情報をJSON文字列に変換して送信する
                body: JSON.stringify(body),
            });

            // APIから返ってきたJSONデータを取得する
            const data = await response.json();

            // APIの処理が失敗したか確認する
            if(!response.ok) {
                // APIから返されたエラーメッセージをToast表示する
                toast.error(data.error || "会議の更新に失敗しました");
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
            toast.error(error instanceof Error
                ? error.message
                : "会議の更新に失敗しました"
            );
        }
    };

    // 会議情報を取得中の場合
    if(loading) {
        return (
            <>
                <Header backPath={`/meeting/${id}`}/>
                <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                    <h1 className="text-xl ml-5 mt-5">会議編集</h1>
                    <p className="mt-8 ml-5">読み込み中...</p>
                </main>
            </>
        );
    }

    // 会議情報の取得に失敗した場合
    if(error || !meeting) {
        return (
            <>
                <Header backPath={`/meeting/${id}`}/>
                <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                    <h1 className="text-xl ml-5 mt-5">会議編集</h1>
                    <p className="mt-8 ml-5 text-red-500">
                        {error || "この会議は存在しません"}
                    </p>
                </main>
            </>
        );
    }

    // 必須参加者のメールアドレスだけを取得する
    const requiredEmails = meeting.MeetingParticipants
        // 必須参加者だけに絞り込む
        .filter((participant) => participant.attendance_type === "required")
        // ログインユーザーを除外する
        .filter((participant) => participant.employee.email !== organizerEmail)
        // 社員のメールアドレスを取得する
        .map((participant) => participant.employee.email)
        // 複数のメールアドレスをコンマ区切りにする
        .join(",");

    // 任意参加者のメールアドレスだけを取得する
    const optionalEmails = meeting.MeetingParticipants
        // 任意参加者だけに絞り込む
        .filter((participant) => participant.attendance_type === "optional")
        // ログインユーザーを除外する
        .filter((participant) => participant.employee.email !== organizerEmail)        
        // 社員のメールアドレスを取得する
        .map((participant) => participant.employee.email)
        // 複数のメールアドレスをコンマ区切りにする
        .join(",");

    // DBから取得した日時をdatetime-local用の形式に変換する
    const formatDateTimeLocal = (dataString: string) => {
        // APIから取得した日時をDateオブジェクトに変換する
        const date = new Date(dataString);
        // 年を取得する
        const year = date.getUTCFullYear();
        // 月を取得する
        const month = String(date.getUTCMonth() + 1).padStart(2,"0");
        // 日を取得する
        const day = String(date.getUTCDate()).padStart(2,"0");
        // 時間を取得する
        const hour = String(date.getUTCHours()).padStart(2,"0");
        // 分を取得する
        const minute = String(date.getUTCMinutes()).padStart(2,"0");

        // datetime-localで使用できる形式にして返す
        return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    return (
        <>
            <Header backPath={`/meeting/${id}`}/>
            <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                <h1 className="text-xl ml-5 mt-5">会議編集</h1>

                <form onSubmit={handleSubmit}>
                    <div className="mt-4 ml-5 flex items-center">
                        <label htmlFor="title" className="w-32 text-xl font-bold">タイトル</label>
                        <input 
                            className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full"
                            id="title" 
                            name="title" 
                            type="text"
                            placeholder="タイトルを入力してください"
                            defaultValue={meeting.title}
                            required
                        />
                    </div>
                    <div className="mt-4 ml-5 flex items-center">
                        <label htmlFor="organizer" className="w-32 text-xl font-bold">主催者</label>
                        <div className="ml-3 w-full">
                            <div className="border border-gray-400 rounded px-3 py-2 min-h-12 flex flex-warp items-center gap-2">
                                <input 
                                    className="outline-none text-xl flex-1 min-w-50" 
                                    id="organizer"
                                    name="organizer"
                                    placeholder="メールアドレスを入力してください"
                                    type="text"
                                    defaultValue={organizerEmail}
                                    readOnly
                                />                      
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 ml-5 flex items-center">
                        <label htmlFor="requiredParticipant" className="w-32 text-xl font-bold">必須参加者</label>
                        <div className="ml-3 w-full">
                            <div className="border border-gray-400 rounded px-3 py-2 min-h-12 flex flex-warp items-center gap-2">
                                <input 
                                    className="outline-none text-xl flex-1 min-w-50" 
                                    id="requiredParticipant"
                                    name="requiredParticipant"
                                    placeholder="メールアドレスをカンマ区切りで入力してください"
                                    type="text"
                                    defaultValue={requiredEmails}
                                />                      
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 ml-5 flex items-center">
                        <label htmlFor="optionalParticipant" className="w-32 text-xl font-bold">任意参加者</label>
                        <input 
                            className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                            id="optionalParticipant" 
                            name="optionalParticipant"
                            placeholder="メールアドレスをカンマ区切りで入力してください"
                            type="text"
                            defaultValue={optionalEmails}
                        />
                    </div>
                    <div className="mt-4 ml-5 flex items-center">
                        <label htmlFor="meetingplace" className="w-32 text-xl font-bold">開催場所</label>
                        <input 
                            className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                            id="meetingplace" 
                            name="meetingplace"
                            type="text"
                            placeholder="開催場所を入力してください"
                            defaultValue={meeting.place}
                            required
                        />
                    </div>
                    <div className="mt-4 ml-5 flex items-center">
                        <label htmlFor="startdate" className="w-32 text-xl font-bold">開始日時</label>
                        <input 
                            className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                            id="startdate" 
                            name="startdate"
                            type="datetime-local"
                            defaultValue={formatDateTimeLocal(meeting.start_datetime)}
                            required
                        />
                    </div>
                    <div className="mt-4 ml-5 flex items-center">
                        <label htmlFor="enddate" className="w-32 text-xl font-bold">終了日時</label>
                        <input 
                            className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                            id="enddate" 
                            name="enddate"
                            type="datetime-local"
                            defaultValue={formatDateTimeLocal(meeting.end_datetime)}
                            required
                        />
                    </div>
                    <div className="mt-4 ml-5 flex items-start">
                        <label htmlFor="description" className="w-32 text-xl font-bold">説明</label>
                        <textarea 
                            className="border border-gray-400 rounded ml-3 px-3 py-4 text-xl h-30 w-full"
                            id="description"
                            name="description"
                            defaultValue={meeting.description ?? ""}
                        >
                        </textarea>
                    </div>

                    <div className="flex justify-center gap-10 mt-8">
                        <button 
                            type="submit"
                            className="w-35 h-10 bg-[#8ba6e0] text-white text-lg cursor-pointer"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </main>
        </>
    );
}