"use client";

// Headerコンポーネントを読み込む
import Header from "@/components/Header";
// URLの社員番号を取得するuseParamsとページ遷移に使用するuseRouter読み込む
import { useParams,useRouter } from "next/navigation";
// ReactのuseEffectとuseStateを読み込む
import { useEffect,useState } from "react";
import { findAncestor } from "typescript";

export default function Page() {
  // ページ遷移に使用するrouterを取得する
  const router = useRouter();
  // URLのパラメータを取得する
  const params = useParams();
  // 社員番号を取得する
  const id = params.id;
  // 社員情報を保持する
  const [employee,setEmployee] = useState<{
    id: number,
    name: string,
    email: string,
    department: {
        department_name: string,
    },
    position: {
        position_name: string,
    },
    employmentstatus: {
        employee_status: string,
    },
    enrollmentstatus: {
        enrollment_status: string,
    }
  } | null>(null);
  // ログイン中のユーザー情報を保持する
  const [currentUserId,setCurrentUserId] = useState<number | null>(null);
  // 社員情報を取得中かどうかを管理する
  const [loading,setLoading] = useState(true);
  // エラーメッセージを管理する
  const [error,setError] = useState("");

  // ログイン中のユーザー情報を取得する
  useEffect(() => {
    // ログイン中のユーザー情報を取得する関数を定義する
    const fetchCurrentUser = async () => {
        try {
            // /api/me にリクエストを送り、ログイン中のユーザー情報を取得する
            const response = await fetch("/api/me");

            // APIから正常なレスポンスが返ってこなかった場合は、処理を終了する
            if(!response.ok) {
                return;
            }

            // APIから返されたレスポンスの内容をJSON形式に変換する
            const data = await response.json();
            // APIから取得したログインユーザーの社員番号をstateに保存する
            setCurrentUserId(data.id);
        } catch(error) {
            // ユーザー情報の取得中にエラーが発生した場合、コンソールにエラー内容を表示する
            console.error("ログインユーザーの取得に失敗しました", error);
        }
    };

    // 定義した関数を実行して、ログイン中のユーザー情報を取得する
    fetchCurrentUser();
  },[]);

  // 社員情報を取得する
  useEffect(() => {
    // 社員番号がない場合は、API通信を行わない
    if(!id) {
        return
    }

    // 社員情報を取得する関数
    const fetchEmployee = async () => {
        try {
            // 社員詳細APIを取得する
            const response = await fetch(`/api/employees/${id}`);

            // APIが404を返した場合、社員が存在しないと判断する
            if(response.status === 404) {
                // 画面に表示するエラーメッセージを設定する
                setError("この社員は存在しません");

                // これ以降の処理を実行せずに終了する
                return;
            }

            // 404以外のエラーが発生したか確認する
            if(!response.ok) {
                // エラーを発生させてcatchに処理を移す
                throw new Error("社員情報の取得に失敗しました");
            }

            // APIのレスポンスをJSON形式に変換する
            const data = await response.json();

            // 社員情報が存在しない場合もエラーとして扱う
            if(!data.employee) {
                // 社員が存在しないことを示すメッセージを設定する
                setError("この社員は存在しません");

                // これ以降の処理を実行せずに終了する
                return;
            }

            // 取得した社員情報をstateに保存する
            setEmployee(data.employee);
        } catch(error) {
            // 発生したエラーをコンソールに表示する
            console.error(error);

            // 画面に表示するエラーメッセージを設定する
            setError("社員情報の取得に失敗しました");
        } finally {
            // 成功・失敗にかかわらず読み込み状態を解除する
            setLoading(false);
        }
    };

    // 社員情報の取得処理を実行する
    fetchEmployee();
  },[id]);

  // 社員情報を取得中の場合
  if(loading) {
    return (
        <>
            <Header backPath="/employee"/>
            <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                <h1 className="text-xl ml-5">社員詳細</h1>
                <p className="mt-8 ml-5">読み込み中...</p>
            </main>
        </>
    );
  }

  // エラーが発生した場合、または社員情報が存在しない場合
  if(error || !employee) {
    return (
        <>
            <Header backPath="/employee"/>
            <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
                <h1 className="text-xl ml-5">社員詳細</h1>
                <p className="mt-8 ml-5 text-red-500">
                    {error || "この社員は存在しません"}
                </p>
            </main>
        </>
    );
  }

  return (
    <>
        <Header backPath="/employee"/>
        <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
            <h1 className="text-xl ml-5">社員詳細</h1>
            <div className="border border-gray-300 w-300 h-110 mx-auto mt-5">
                <div className="bg-gray-300 h-15 flex items-center px-10">
                    <h2 className="text-xl">基本情報</h2>
                </div>

                <table className="w-full border-collapse">
                    <tbody>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8  text-xl font-normal">社員番号</th>
                            <td className="text-xl font-normal">{employee.id}</td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 font-normal text-xl">氏名</th>
                            <td className="text-xl font-normal">{employee.name}</td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 font-normal text-xl">メールアドレス</th>
                            <td className="text-xl font-normal">{employee.email}</td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 font-medium text-xl">所属部署</th>
                            <td className="text-xl font-normal">{employee.department.department_name}</td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 font-medium text-xl">役職</th>
                            <td className="text-xl font-normal">{employee.position.position_name}</td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 font-medium text-xl">雇用区分</th>
                            <td className="text-xl font-normal">{employee.employmentstatus.employee_status}</td>
                        </tr>
                        <tr className="h-13">
                            <th className="w-64 text-left pl-8 font-medium text-xl">在籍区分</th>
                            <td className="text-xl font-normal">{employee.enrollmentstatus.enrollment_status}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            {currentUserId !== null && currentUserId !== employee.id && (
                <div className="flex justify-center gap-10 mt-8">
                    <button 
                        className="w-35 h-10 bg-[#9FD77F] text-white text-lg cursor-pointer"
                        onClick={() => router.push(`/employee/${employee.id}/edit`)}
                    >
                        編集
                    </button>
                    <button 
                        className="w-35 h-10 bg-[#E7AD8A] text-white text-lg cursor-pointer"
                        onClick={() => router.push(`/employee/${employee.id}/delete`)}
                    >
                        削除
                    </button>
                </div>
            )}
        </main>
    </>
  );
}