"use client";

// Headerコンポーネントを読み込む
import Header from "@/components/Header";
// ReactのuseEffectとuseStateを読み込む
import React, { useEffect,useState } from "react";
// URLのパラメータと画面遷移を取得する
import { useParams,useRouter } from "next/navigation";
// Toastを表示する
import toast from "react-hot-toast";

export default function Page() {
  // URLのidを取得する
  const {id} = useParams();
  // 画面遷移を行うためのrouterを取得する
  const router = useRouter();

  // 社員番号を保持する
  const [employeeNumber,setEmployeeNumber] = useState("");
  // 氏名を保持する
  const [name,setName] = useState("");
  // メールアドレスを保持する
  const [email,setEmail] = useState("");
  // 部署一覧を保持する
  const [department,setDepartment] = useState<{
    id: number,
    department_name: string
  }[]>([]);
  // 役職一覧を保持する
  const [position,setPosition] = useState<{
    id: number,
    position_name: string
  }[]>([]);
  // 雇用区分一覧を保持する
  const [employmentStatus,setEmploymentStatus] = useState<{
    id: number,
    employee_status: string
  }[]>([]);
  // 在籍区分一覧を保持する
  const [enrollmentStatus,setEnrollmentStatus] = useState<{
    id: number,
    enrollment_status: string
  }[]>([]);
  // 選択した部署IDを保持する
  const [departentId,setDepartmentId] = useState("");
  // 選択した役職IDを保持する
  const [positionId,setPositionId] = useState("");
  // 選択した雇用区分IDを保持する
  const [employmentStatusId,setEmploymentStatusId] = useState("");
  // 選択した在籍区分IDを保持する
  const [enrollmentStatusId,setEnrollmentStatusId] = useState("");
  // ログイン中の社員IDを保持する
  const [currentUserId,setCurrentUserId] = useState<number | null>(null);
  // ログイン中の社員情報を取得できたか管理する
  const [currentUserLoaded,setCurrentUserLoaded] = useState(false);
  // 編集対象の社員情報を取得できたか管理する
  const [employeeLoaded,setEmployeeLoaded] = useState(false);
  // 社員情報の取得エラーメッセージを保持する
  const [employeeError,setEmployeeError] = useState("");

  // 更新ボタンが押された時に実行する関数
  const handleSubmit = async (e: React.FormEvent) => {
    // フォーム送信時の画面リロードを防ぐ
    e.preventDefault();

    try {
        // 社員更新APIを呼び出す
        const response = await fetch(`/api/employees/${id}`,{
            // PUTメソッドで送信する
            method: "PUT",
            // JSON形式でデータを送信する
            headers: {
                "Content-Type": "application/json",
            },

            // APIへ送信する社員情報をJSON形式に変換する
            body: JSON.stringify({
                // 氏名を送信する
                name,
                // メールアドレスを送信する
                email,
                // 所属部署IDを送信する
                department_id: departentId,
                // 役職IDを送信する
                position_id: positionId,
                // 雇用区分IDを送信する
                employee_status_id: employmentStatusId,
                // 在籍区分IDを送信する
                enrollment_status_id: enrollmentStatusId,
            }),
        });

        // APIから返ってきたデータをJSON形式に変換する
        const data = await response.json();

        // 更新が成功した場合
        if(response.ok) {
            // 管理者権限を削除した場合も、APIから返されたメッセージを表示する
            toast.success(data.message);

            // 1秒後に社員一覧画面へ移動する
            setTimeout(() => {
                router.push("/employee");
            },1000);
        } else {
            // 更新に失敗した場合はエラーメッセージを表示する
            toast.error(data.message || "社員情報の更新に失敗しました。");
        }

    } catch(error) {
        // エラー内容をコンソールに表示する
        console.error(error);

        // エラーメッセージを表示する
        toast.error("社員情報の更新に失敗しました。");
    }
  }

  // ログイン中の社員情報を取得する
  useEffect(() => {
    // ログイン中の社員情報を取得する関数
    const fetchCurrentUser = async () => {
        try {
            // /api/me からログイン中の社員情報を取得する
            const response = await fetch("/api/me");

            // API取得に失敗した場合は処理を終了する
            if(!response.ok) {
                return;
            }

            // APIのレスポンスをJSON形式に変換する
            const data = await response.json();
            // ログイン中の社員IDを保存する
            setCurrentUserId(data.id);
        } catch(error) {
            // エラー内容をコンソールに表示する
            console.error("ログイン中の社員情報の取得に失敗しました", error);
        } finally {
            // 取得処理が終了したことを記録する
            // 取得に失敗した場合も編集フォームを表示しない
            setCurrentUserLoaded(true);
        }
    };

    // ログイン中の社員情報を取得する
    fetchCurrentUser();
  },[]);

  // 社員情報を取得する
  useEffect(() => {
    // URLから取得した社員番号（id）が存在しない場合
    if(!id) {
        // 社員番号がないため、API通信を行わずに処理を終了する
        return
    }

    // 社員情報を取得する関数
    const fetchEmployee = async () => {
        try {
            // 社員情報を取得する
            const response = await fetch(`/api/employees/${id}`);

            // APIが404（対象の社員が存在しない）を返した場合
            if(response.status === 404) {
                // 社員が存在しないことを示すエラーメッセージを設定する
                setEmployeeError("この社員は存在しません");

                // これ以降の処理を実行せず、関数を終了する
                return;
            }

            // 404以外のエラーが発生した場合
            if(!response.ok) {
                // エラーを発生させ、catchブロックで処理する
                throw new Error("社員情報の取得に失敗しました");
            }

            // レスポンスをJSON形式に変換する
            const data = await response.json();

            // レスポンスに社員情報が含まれていない場合
            if(!data.employee) {
                // 社員が存在しないことを示すエラーメッセージを設定する
                setEmployeeError("この社員は存在しません");

                // これ以降の処理を実行せず、関数を終了する
                return;
            }

            // 社員番号を設定する
            setEmployeeNumber(String(data.employee.id));
            // 氏名を設定する
            setName(data.employee.name);
            // メールアドレスを設定する
            setEmail(data.employee.email);
            // 部署IDを設定する
            setDepartmentId(String(data.employee.department_id));
            // 役職IDを設定する
            setPositionId(String(data.employee.position_id));
            // 雇用区分IDを設定する
            setEmploymentStatusId(String(data.employee.employee_status_id));
            // 在籍区分IDを設定する
            setEnrollmentStatusId(String(data.employee.enrollment_status_id));
        } catch(error) {
            // エラー内容をコンソールに表示する
            console.error("社員情報の取得に失敗しました", error);

            // 画面に表示するエラーメッセージを設定する
            setEmployeeError("社員情報の取得に失敗しました");
        } finally {
            // 社員情報の取得処理が終了したことを記録する
            setEmployeeLoaded(true);
        }
    };


    // 社員情報を取得する
    fetchEmployee();
  },[id]);

  // マスターデータを取得する
  useEffect(() => {
    // マスターデータを取得する関数
    const fetchData = async () => {
        // マスターデータを取得する
        const response = await fetch("/api/EmployeeSelection");
        // レスポンスをJSON形式に変換する
        const data = await response.json();
        // 部署一覧を保存する
        setDepartment(data.department);
        // 役職一覧を保存する
        setPosition(data.position);
        // 雇用区分一覧を保存する
        setEmploymentStatus(data.employmentStatus);
        // 在籍区分一覧を保存する
        setEnrollmentStatus(data.enrollmentStatus);
    }

    // マスターデータを取得する
    fetchData();
  },[]);

  return (
    <>
        <Header backPath={`/employee/${id}`}/>
        <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
            <h1 className="text-xl ml-5">社員編集</h1>
            {!id ? (
                <p className="mt-10 text-red-600">
                    社員番号が指定されていません。
                </p>
            ) : !currentUserLoaded || !employeeLoaded ? (
                <p className="mt-8 ml-5">
                    読み込み中...
                </p>
            ) : employeeError ? (
                <p className="mt-8 ml-5 text-red-600">
                    {employeeError}
                </p>
            ) : currentUserId === null ? (
                <p className="mt-8 ml-5 text-red-600">
                    ログイン中の社員情報を確認できません。編集できません。
                </p>
            ) : currentUserId === Number(id) ? (
                <p className="mt-8 ml-5 text-red-600">
                    自分の社員情報は編集できません。
                </p>                
            ) : (
                <form onSubmit={handleSubmit}>
                    <table className="w-full text-xl border-collapse mt-5">
                        <tbody>
                            <tr>
                                <th className="border text-xl font-medium border-gray-400 text-left px-4 py-3 bg-gray-300">
                                    <label htmlFor="employeenumber">社員番号</label>
                                </th>
                                <td>
                                    <input 
                                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                                        id="employeenumber" 
                                        type="text"
                                        value={employeeNumber}
                                        readOnly
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th className="border text-xl font-medium border-gray-400 text-left px-4 py-3 bg-gray-300">
                                    <label htmlFor="name">氏名</label>
                                </th>
                                <td>
                                    <input 
                                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                                        id="name" 
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th className="border text-xl font-medium border-gray-400 text-left px-4 py-3 bg-gray-300">
                                    <label htmlFor="email">メールアドレス</label>
                                </th>
                                <td>
                                    <input 
                                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full" 
                                        id="email" 
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th className="border text-xl font-medium border-gray-400 text-left px-4 py-3 bg-gray-300">
                                    <label htmlFor="department">所属部署</label>
                                </th>
                                <td>
                                    <select 
                                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full"
                                        id="department"
                                        value={departentId}
                                        onChange={(e) => setDepartmentId(e.target.value)}
                                        required
                                    >
                                        <option value="">選択して下さい</option>
                                        {department.map((department) => (
                                            <option
                                                key={department.id}
                                                value={department.id}
                                            >
                                                {department.department_name}
                                            </option>
                                        ))}                           
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th className="border text-xl font-medium border-gray-400 text-left px-4 py-3 bg-gray-300">
                                    <label htmlFor="position">役職</label>
                                </th>
                                <td>
                                    <select 
                                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full"
                                        id="position"
                                        value={positionId}
                                        onChange={(e) => setPositionId(e.target.value)}
                                        required
                                    >
                                        <option value="">選択して下さい</option>
                                        {position.map((position) => (
                                            <option
                                                key={position.id}
                                                value={position.id}
                                            >
                                                {position.position_name}
                                            </option>
                                        ))}                            
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th className="border text-xl font-medium border-gray-400 text-left px-4 py-3 bg-gray-300">
                                    <label htmlFor="employmentstatus">雇用区分</label>
                                </th>
                                <td>
                                    <select 
                                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full"
                                        id="employmentstatus"
                                        value={employmentStatusId}
                                        onChange={(e) => setEmploymentStatusId(e.target.value)}
                                        required
                                    >
                                        <option value="">選択して下さい</option>
                                        {employmentStatus.map((employmentStatus) => (
                                            <option
                                                key={employmentStatus.id}
                                                value={employmentStatus.id}
                                            >
                                                {employmentStatus.employee_status}
                                            </option>
                                        ))}                        
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th className="border text-xl font-medium border-gray-400 text-left px-4 py-3 bg-gray-300">
                                    <label htmlFor="enrollmentstatus">在籍区分</label>
                                </th>
                                <td>
                                    <select 
                                        className="border border-gray-400 rounded ml-3 px-3 py-2 text-xl w-full"
                                        id="enrollmentstatus"
                                        value={enrollmentStatusId}
                                        onChange={(e) => setEnrollmentStatusId(e.target.value)}
                                        required
                                    >
                                        <option value="">選択して下さい</option>
                                        {enrollmentStatus.map((enrollmentStatus) => (
                                            <option
                                                key={enrollmentStatus.id}
                                                value={enrollmentStatus.id}
                                            >
                                                {enrollmentStatus.enrollment_status}
                                            </option>
                                        ))}                          
                                    </select>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-center gap-10 mt-8">
                        <button 
                            type="submit"
                            className="w-35 h-10 bg-[#82bae0] text-white text-lg cursor-pointer"
                        >
                            保存
                        </button>
                    </div>
                </form>
            )}
        </main>
    </>
  );
}
