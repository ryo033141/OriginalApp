"use client"

// Next.jsで画像を表示するためのImageコンポーネントを読み込む
import Image from "next/image";
// Next.jsの画面遷移機能を使うためのuseRouterを読み込む
import { useRouter } from "next/navigation";
// Reactのフックを読み込む
import { useEffect,useState,useRef } from "react";
// 共通ヘッダーコンポーネントを読み込む
import Header from "@/components/Header";
// Toast通知を表示するためのtoastを読み込む
import toast from "react-hot-toast";

// MeetingParticipantのデータ構造を定義する
type MeetingParticipant = {
    // 社員番号
    employee_id: number;
    // 会議ID
    meeting_id: number;
    // 参加区分
    attendance_type: "required" | "optional";
};

// APIから取得するMeetingのデータ構造を定義する
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
    description: string;
    // 自分の参加区分
    attendanceType: "required" | "optional";
    // この会議に紐づいている参加者一覧
    MeetingParticipants: MeetingParticipant[];
};

// 現在時刻を取得する関数を定義する
const getCurrentTime = () => {
    // 現在の日時を取得する
    const now = new Date();

    // 現在の日本時間の「年月日時分秒」を使ってDateを作成する
    return new Date(
        Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
        )
    );
};

export default function Page() {
  // APIから取得した会議一覧を保存する
  const [meetings,setMeetings] = useState<Meeting[]>([]);
  // 参加区分の選択状態を保存する
  const [attendanceFilter,setAttendanceFilter] = useState("");
  // 現在時刻を保存する
  const [currentTime,setCurrentTime] = useState(getCurrentTime());
  // Next.jsの画面遷移機能を取得する
  const router = useRouter(); 
  // /meetingを開いた時点の時刻を保存する
  const activityStartTime = useRef(new Date().toISOString());
  // 現在表示しているページ番号を保存する
  const [currentPage,setCurrentPage] = useState(1);
  // 1ページに表示する会議数を設定する
  const itemsPerPage = 8;

  // Activityを取得する関数を定義する
  const fetchActivites = async () => {
    // /meetingを開いた時点の時刻を取得する
    const since = activityStartTime.current;

    console.log("今回のsince:", since);

    // since以降に作成されたActivityをAPIから取得する
    const response = await fetch(`/api/MeetingActivities?since=${since}`)

    // ログアウト後はAPIが401を返すため、JSONデータを処理する前に終了する
    if(response.status === 401) {
        return;
    }

    // その他のAPIエラーも処理する
    if(!response.ok) {
        console.error("Activityの取得に失敗しました:", response.status);
        return;
    }

    // APIから返ってきたJSONデータを取得する
    const data = await response.json();
    // APIから取得した通知データを確認する
    console.log("取得したActivity:", data.activities);

    // 想定外のレスポンスでlengthを参照してエラーになるのを防ぐ
    if(!Array.isArray(data.activities)) {
        console.error("Activityのデータ形式が不正です:", data);
        return;
    }

    console.log("Activityを取得しました");
    // 取得したActivityをブラウザのコンソールに表示する
    console.log(data.activities);

    // Activityが1件以上取得できた場合、取得した全件を処理する
    if(data.activities.length > 0) {
        // グループ通知をすでに表示したIDを記録する
        const processedGroupIds = new Set<string>();

        // 最新の1件だけでなく、取得したActivityを1件ずつ確認する
        for(const latestActivity of data.activities) {
            // 履歴に保存された操作担当者名を優先して取得する
            const employeeName = 
                latestActivity.employee_name ?? latestActivity.employee?.name ?? "不明な社員";
            // activity_group_idを取得する
            const activityGroupId = latestActivity.activity_group_id;

            // グループIDがあるActivityはグループ単位で通知する
            if(activityGroupId) {
                // 同じグループの通知をすでに表示していればスキップする
                if(processedGroupIds.has(activityGroupId)) {
                    continue;
                }

                // このグループを通知表示済みとして記録する
                processedGroupIds.add(activityGroupId);
                // 同じグループIDを持つActivityをすべて取得する
                const groupedActivities = data.activities.filter(
                    (activity: {activity_group_id: string | null}) => 
                        activity.activity_group_id === activityGroupId
                );
                // グループ内の編集件数を数える
                const updateCount = groupedActivities.filter(
                    (activity: {action: string}) =>
                        activity.action === "update"
                ).length;
                // グループ内の削除件数を数える
                const deleteCount = groupedActivities.filter(
                    (activity: {action: string}) =>
                        activity.action === "delete"
                ).length;

                // 社員の在籍区分変更に伴う会議操作をまとめて通知する
                toast(
                    `管理者${employeeName}による社員の在籍区分変更に伴い、会議が更新されました。（編集：${updateCount}件、削除：${deleteCount}件）`
                );

                // グループ通知を表示したため、個別通知は行わない
                continue
            }

            // 会議名が変更されたかどうかを判定する
            const isTitleChanged = latestActivity.action === "update" && 
                                    latestActivity.old_meeting_title !== null &&
                                    latestActivity.old_meeting_title !== latestActivity.meeting_title;
            
            // 会議名が変更された場合
            if(isTitleChanged) {
                // 会議名変更のToastを表示する
                toast(
                    `${employeeName}さんが「${latestActivity.old_meeting_title}」から「${latestActivity.meeting_title}」に会議名を変更しました。` 
                );
            }

            // 会議が新規作成された場合
            else if(latestActivity.action === "create") {
                // 会議が新規作成されたことをToastで通知する 
                toast(`${employeeName}さんが会議「${latestActivity.meeting_title}」を新規作成しました。`);
            }

            // 会議名の変更ではなく、Activityのactionが「update」の場合
            else if(latestActivity.action === "update") {
                // 管理者による参加者削除かどうかを確認する
                if(latestActivity.organizer_name) {
                    // 管理者による参加者削除の通知を表示する
                    toast(
                        `管理者${employeeName}によって「${latestActivity.meeting_title}」が編集されました。`
                    );
                } else {
                    // 通常の会議編集の通知を表示する
                    toast(`${employeeName}さんが会議「${latestActivity.meeting_title}」を編集しました。`); 
                }
            }

            // Activityのactionが「delete」の場合 
            else if(latestActivity.action === "delete") { 
                // 管理者による会議削除かどうかを確認する
                if(latestActivity.organizer_name) {
                    // 管理者名と主催者名を含めてToastを表示する
                    toast(
                        `管理者${employeeName}によって主催者${latestActivity.organizer_name}の「${latestActivity.meeting_title}」が削除されました。`
                    );
                } else {
                    // 通常の会議削除の通知を表示する
                    toast(`${employeeName}さんが会議「${latestActivity.meeting_title}」を削除しました。`); 
                }
            }        
        }

        // 次回のsinceに、今回取得した最新Activityの時刻を設定する
        activityStartTime.current = data.activities[0].created_at;
        console.log("更新後のsince:", activityStartTime.current);
    }
  }

  // ページが表示されたときに実行する
  useEffect(() => {
    // 会議一覧を取得する非同期関数
    const fetchMeetings = async () => {
        try {
            // 会議一覧取得APIを呼び出す
            const response = await fetch("/api/meetings");

            // APIのレスポンスが正常か確認する
            if(!response.ok) {
                // エラーを発生させる
                throw new Error("会議一覧の取得に失敗しました");
            }

            // APIから返ってきたJSONデータを取得する
            const data = await response.json();
            // APIから取得した会議一覧をstateに保存する
            setMeetings(data.meetings);
        } catch(error) {
            // API取得時にエラーが発生した場合ブラウザのコンソールにエラーを表示する
            console.error(error);
        }
    };

    // 会議一覧を取得する
    fetchMeetings();
  },[]);

  // ページが表示されている間、5秒ごとにActivityを確認する
  useEffect(() => {
    // 5秒ごとにActivityを取得するタイマーを作成する
    const timer = setInterval(() => {
        // Activityを取得する
        fetchActivites();
    },5000);

    // ページを離れたときにタイマーを停止する
    return () => {
        // タイマーを停止する
        clearInterval(timer);
    };
  },[]);

  // ページが表示されたときにタイマーを開始する
  useEffect(() => {
    // 1秒ごとに処理を実行するタイマーを作成する
    const timer = setInterval(() => {
        // 現在時刻を取得してstateを更新する
        setCurrentTime(getCurrentTime());
    },1000);

    // ページを離れたときにタイマーを停止する
    return () => {
        // タイマーを停止する
        clearInterval(timer);
    };
  },[]);

  // APIから取得した日時を日本時間の表示形式に変換する関数
  const formatDateTime = (dateString: string) => {
    // APIから取得した日時文字列をDateオブジェクトに変換する
    const date = new Date(dateString);

    // 日本時間で日時を表示する
    return new Intl.DateTimeFormat("ja-JP",{
        // 日本時間を指定する
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
  };

  // 開始日時と終了日時から会議のステータスを判定する関数
  const getStatus = (startDatetime: string,endDateTime: string) => {
    // 現在時刻をDateオブジェクトとして取得する
    const now = currentTime;
    // 会議の開始日時をDateオブジェクトに変換する
    const start = new Date(startDatetime);
    // 会議の終了日時をDateオブジェクトに変換する
    const end = new Date(endDateTime);

    // 現在時刻が開始時刻より前の場合
    if(now < start) {
        // 開催予定を返す
        return "開催予定";
    }
    // 現在時刻が開始時刻以上かつかつ終了時刻以下の場合
    if(now >= start && now <= end) {
        // 開催中を返す
        return "開催中";
    }

    // 終了時刻を過ぎている場合
    return "開催終了";
  };

  // 現在時刻から24時間以上経過した会議を除外する
  const visibleMeetings = meetings.filter((meeting) => {
    // 会議の終了日時をDateオブジェクトに変換する
    const end = new Date(meeting.end_datetime);
    // 会議の終了日時から24時間後の日時を計算する
    const deleteTime = new Date(
        end.getTime() + 24 * 60 * 60 * 1000
    );

    // 現在時刻が24時間後より前なら一覧に表示する
    // 24時間を超えた場合はfalseとなり一覧から除外される
    return currentTime < deleteTime;
  });

  // 参加区分で会議一覧を絞り込む
  const filteredMeetings = visibleMeetings.filter((meeting) => {
    // 参加区分が未選択の場合はすべて表示する
    if(attendanceFilter === "") {
        return true;
    }

    // 選択された参加区分と自分の参加区分が一致する会議を表示する
    return meeting.attendanceType === attendanceFilter;
  });

  // 全ページ数を計算する
  const totalPages = Math.ceil(filteredMeetings.length / itemsPerPage);
  // 実際に表示するページ番号を計算する
  const validCurrentPage = totalPages === 0 ? 1 : Math.min(currentPage,totalPages);
  // 現在のページで表示する最初の会議の位置を計算する
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  // 現在のページで表示する会議だけを取得する
  const paginatedMeeting = filteredMeetings.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <>
        <Header/>
        <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
            <h1 className="text-xl">会議一覧</h1>
            <div className="mt-4 flex justify-between items-center">
                <div>
                    <label htmlFor="department" className="text-lg">参加区分</label>
                    <select 
                        id="department" 
                        name="department"
                        className="border border-black ml-2 text-lg"
                        value={attendanceFilter}
                        onChange={(event) => {
                            setAttendanceFilter(event.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">選択して下さい</option>
                        <option value="required">必須</option>
                        <option value="optional">任意</option>
                    </select>
                </div>
                <button 
                    className="bg-sky-700 text-white px-6 px-2 text-lg cursor-pointer"
                    onClick={() => router.push("/meeting/create")}
                >会議新規作成
                </button>
            </div>

            <div className="overflow-x-auto min-h-[540px]">
                <table className="w-full border border-gray-300 border-collapse mt-5">
                    <thead>
                        <tr>
                            <th className="border p-4"></th>
                            <th className="border p-4">タイトル</th>
                            <th className="border p-4">開催場所</th>
                            <th className="border p-4">開始日時</th>
                            <th className="border p-4">終了日時</th>
                            <th className="border p-4">参加区分</th>
                            <th className="border p-4">ステータス</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedMeeting.map((meeting)=> {
                            // 自分の参加区分を日本語に変換する
                            const attendanceType =
                                meeting.attendanceType === "required"
                                ? "必須"
                                : "任意";
                            // 開始日時と終了日時を渡して現在のステータスを取得する
                            const status = getStatus(meeting.start_datetime,meeting.end_datetime);

                            return (
                                <tr 
                                    key={meeting.id}
                                    className="even:bg-gray-300"
                                >
                                    <td className="border p-4 text-center">
                                        <Image 
                                            src="/image/detail.png" 
                                            alt="詳細画像" 
                                            width={20} 
                                            height={20}
                                            className="cursor-pointer"
                                            onClick={() => router.push(`/meeting/${meeting.id}`)}
                                        />
                                    </td>
                                    <td className="border p-4">{meeting.title}</td>
                                    <td className="border p-4">{meeting.place}</td>
                                    <td className="border p-4">{formatDateTime(meeting.start_datetime)}</td>
                                    <td className="border p-4">{formatDateTime(meeting.end_datetime)}</td>
                                    <td className="border p-4">{attendanceType}</td>
                                    <td className="border p-4">{status}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-center items-center gap-4 mt-5">
                <button
                    onClick={() => setCurrentPage(validCurrentPage - 1)}
                    disabled={validCurrentPage === 1}
                    className="border border-black px-4 py-2 cursor-pointer"
                >
                    前へ
                </button>
                <span>
                    {totalPages === 0 ? 0 : validCurrentPage} / {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(validCurrentPage + 1)}
                    disabled={
                        validCurrentPage === totalPages ||
                        totalPages === 0
                    }
                    className="border border-black px-4 py-2 cursor-pointer"
                >
                    次へ
                </button>                
            </div>
        </main>
    </>
  );
}
