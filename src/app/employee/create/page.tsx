"use client";

// Headerコンポーネントの読み込み
import Header from "@/components/Header";
// ReactのuseEffect,useStateフックを読み込む
import { useEffect,useState } from "react";
// Next.jsの画面遷移に使用するuseRouterを読み込む
import { useRouter } from "next/navigation";
// Toast通知を表示するためのtoastを読み込む
import toast from "react-hot-toast"; 

export default function Page() {
  // ページ遷移に使用するrouterを取得する
  const router = useRouter();

  // 社員番号を保持するstate
  const [employeeNumber,setEmployeeNumber] = useState("");
  // 氏名を保持するstate
  const [name,setName] = useState("");
  // メールアドレスを保持するstate
  const [email,setEmail] = useState("");
  // 部署IDを保持するstate
  const [departmentId,setDepartmentId] = useState("");
  // 部署一覧を保持するstate
  const [department,setDepartment] = useState<{id: number,department_name: string}[]>([]);
  // 役職IDを保持するstate
  const [positionId,setPositionId] = useState("");
  // 役職一覧を保持するstate
  const [position,setPosition] = useState<{id: number,position_name: string}[]>([]);
  // 雇用区分IDを保持するstate
  const [employmentStatusId,setEmploymetnStatusId] = useState("");
  // 雇用区分一覧を保持するstate
  const [employmentStatus,setEmploymentStatus] = useState<{id: number,employee_status: string}[]>([]);
  // 在籍区分IDを保持するstate
  const [enrollmentStatusId,setEnrollmentStatusId] = useState("");
  // 在籍区分一覧を保持するstate
  const [enrollmentStatus,setEnrollmentStatus] = useState<{id: number,enrollment_status: string}[]>([]);

  // 画面表示時にマスタデータを取得する
  useEffect(() => {
    // マスタデータを取得する関数
    const fetchMasterData = async () => {
        // 部署、役職、雇用区分、在籍区分をまとめて呼び出すAPIにリクエストを送信する
        const response = await fetch("/api/EmployeeSelection?excludeRetired=true");
        // APIから返ってきたレスポンスをJSON形式に変換する
        const data = await response.json();

        // 取得した部署一覧をdepartmentに保存する
        setDepartment(data.department);
        // 取得した役職一覧をpositionに保存する
        setPosition(data.position);
        // 取得した雇用区分一覧をemploymentStatusに保存する
        setEmploymentStatus(data.employmentStatus);
        // 取得した在籍区分一覧をenrollmentStatusに保存する
        setEnrollmentStatus(data.enrollmentStatus);
    };

    // マスタデータを取得する
    fetchMasterData();
  },[]);

  // 登録ボタンが押された時に実行される関数
  const handleSubmit = async (e: React.FormEvent) => {
    // フォーム送信時の画面リロードを防ぐ
    e.preventDefault();
    
    // 社員登録APIを呼び出す
    const response = await fetch("/api/employees",{
        // POSTメソッドで送信する
        method: "POST",
        // リクエストヘッダーを設定する
        headers: {
            // JSON形式のデータを送信することを指定する
            "Content-Type": "application/json",
        },
        // APIへ送信するデータをJSON文字列に変換する
        body: JSON.stringify({
            // 社員番号
            id: Number(employeeNumber),
            // 氏名
            name,
            // メールアドレス
            email,
            // 所属部署
            department_id: Number(departmentId),
            // 役職
            position_id: Number(positionId),
            // 雇用区分
            employee_status_id: Number(employmentStatusId),
            // 在籍区分
            enrollment_status_id: Number(enrollmentStatusId),
        }),
    });

    // APIから返ってきたJSONデータを取得する
    const data = await response.json();

    // レスポンスがOKの時
    if(response.ok) {
        // APIから返された成功メッセージをToast表示する
        toast.success(data.message);
        // 1秒後に社員一覧画面に移動する
        setTimeout(() => {
            router.push("/employee");
        },1000);
    } else { 
        // APIから返されたエラーメッセージをToast表示する
        toast.error(data.message || "社員登録に失敗しました。");
    }
  };

  return (
    <>
        <Header backPath="/employee"/>
        <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
            <h1 className="text-xl ml-5">社員登録</h1>

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
                                    onChange={(e) => setEmployeeNumber(e.target.value)}
                                    required
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
                                    value={departmentId}
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
                                    onChange={(e) => setEmploymetnStatusId(e.target.value)}
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
                        className="w-35 h-10 bg-[#8ba6e0] text-white text-lg cursor-pointer"
                    >
                        新規登録
                    </button>
                </div>
            </form>
        </main>
    </>
  );
}
