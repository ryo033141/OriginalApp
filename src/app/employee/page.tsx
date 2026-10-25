"use client"

// Next.jsのImageコンポーネントを読み込む
import Image from "next/image";
// ページ遷移に使用するuseRouterを読み込む
import { useRouter } from "next/navigation";
// ReactのuseEffectとuseStateを読み込む
import { useEffect,useState } from "react";
// Headerコンポーネントを読み込む
import Header from "@/components/Header";

export default function Page() {
  // ページ遷移に使用するrouterを取得する
  const router = useRouter(); 

  // 選択した部署IDを保持する
  const [departmentId,setDepartmentId] = useState("");
  // 部署一覧を保持する
  const [department,setDepartment] = useState<{id: number,department_name: string}[]>([]);
  // 選択した役職IDを保持する
  const [positionId,setPositionId] = useState("");
  // 役職一覧を保持する
  const [position,setPosition] = useState<{id: number,position_name: string}[]>([]);
  // 選択した雇用区分IDを保持する
  const [employmentStatusId,setEmploymentStatusId] = useState("");
  // 雇用区分一覧を保持する
  const [employmentStatus,setEmploymentStatus] = useState<{id: number,employee_status: string}[]>([]);
  // 社員一覧を保持する
  const [employees,setEmployees] = useState<{
    // 社員番号を数値として定義する
    id: number,
    // 社員名を文字列として定義する
    name: string,
    // メールアドレスを文字列として定義する
    email: string,
    // 所属部署のIDを数値として定義する
    department_id: number,
    // 役職のIDを数値として定義する
    position_id: number,
    // 雇用区分のIDを数値として定義する
    employee_status_id: number,
    // 所属部署の関連情報を定義する
    department: {
        // 部署名を文字列として定義する
        department_name: string,
    };
    // 役職の関連情報を定義する
    position: {
        // 役職名を文字列として定義する
        position_name: string,
    };
    // 雇用区分の関連情報を定義する
    employmentstatus: {
        // 雇用区分名を文字列として定義する
        employee_status: string,
    };
    // 在籍区分の関連情報を定義する
    enrollmentstatus: {
        // 在籍区分名を文字列として定義する
        enrollment_status: string,
    }
    // 社員情報の配列として初期値を空配列にする
  }[]>([]);
  // 現在表示しているページ番号（最初は1ページ目）
  const [currentPage,setCurrentPage] = useState(1);

  // 1ページに表示する社員数
  const itemsPerPage = 7;

  // 部署、役職、雇用区分、社員一覧をAPIから取得する
  useEffect(() => {
    // マスターデータと社員一覧を取得する関数
    const fetchData = async () => {
        // マスターデータを取得する
        const masterResponse = await fetch("/api/EmployeeSelection");

        // マスターデータ取得APIが正常に完了したか確認する
        if(!masterResponse.ok) {
            // APIから返されたエラー内容をJSON形式で取得する
            const errorData = await masterResponse.json();

            // 取得したエラー内容をブラウザのコンソールに表示する
            console.error(errorData);
            // エラーが発生したため、ここで処理を終了する
            return;
        }

        // マスターデータをJSON形式に変換する
        const masterData = await masterResponse.json();

        // 取得した部署一覧をdepartmentに保存する
        setDepartment(masterData.department);
        // 取得した役職一覧をpositionに保存する
        setPosition(masterData.position);
        // 取得した雇用区分一覧をemploymentStatusに保存する
        setEmploymentStatus(masterData.employmentStatus);

        // 社員一覧を取得する
        const employeeResponse = await fetch("/api/employees");
        // 社員一覧をJSON形式に変換する
        const employeeData = await employeeResponse.json();

        // 取得した社員一覧をemployeesに保存する
        setEmployees(employeeData.employees);
    }

    // マスターデータと社員一覧を取得する
    fetchData();
  },[]);

  // 社員一覧から条件に一致する社員だけを抽出する
  const filteredEmployees = employees.filter((employee) => {
    // 所属部署が未選択かどうかを確認する
    // 未選択なら、所属部署の条件を満たしたことにする
    const matchesDepartment = departmentId === "" ||
        // 選択された部署IDと社員の部署IDが一致するか確認する
        employee.department_id === Number(departmentId);
    // 役職が未選択かどうかを確認する
    // 未選択なら、役職の条件を満たしたことにする
    const matchesPosition = positionId === "" ||
        // 選択された役職IDと社員の役職IDが一致するか確認する
        employee.position_id === Number(positionId);
    // 雇用区分が未選択かどうかを確認する
    // 未選択なら、雇用区分の条件を満たしたことにする
    const matchesmploymentStatus = employmentStatusId === "" ||
        // 選択された雇用区分IDと社員の雇用区分IDが一致するか確認する
        employee.employee_status_id === Number(employmentStatusId);
    
    // 3つの条件すべてを満たす場合だけtrueを返す
    return (
        // 所属部署の条件を満たしていること
        matchesDepartment &&
        // 役職の条件を満たしていること
        matchesPosition &&
        // 雇用区分の条件を満たしていること
        matchesmploymentStatus
    );
  });

  // フィルタリング後の社員数から総ページ数を計算する
  const totalPages = Math.ceil(
    filteredEmployees.length / itemsPerPage
  );
  // 社員が減った場合に、存在しないページを表示しないようにする
  const validCurrentPage = 
    totalPages === 0
        ? 1
        : Math.min(currentPage,totalPages);
  // 現在のページで表示を開始する位置を計算する
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  // 現在のページに表示する社員だけを取得する
  const paginatedEmployees = [...filteredEmployees]
    .sort((a,b) => a.id - b.id)
    .slice(startIndex,startIndex + itemsPerPage);

  return (
    <>
        <Header/>
        <main className="w-full max-w-[1440px] mx-auto px-10 mt-3 mb-8">
            <h1 className="text-xl">社員名簿</h1>
            <div className="mt-4 flex justify-between items-center">
                <div>
                    <label htmlFor="department" className="text-lg">所属部署</label>
                    <select 
                        id="department" 
                        name="department"
                        value={departmentId}
                        onChange={(e) => {
                            setDepartmentId(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="border border-black ml-2 text-lg"
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

                    <label htmlFor="position" className="ml-2 text-lg">役職</label>
                    <select 
                        id="position" 
                        name="position"
                        value={positionId}
                        onChange={(e) => {
                            setPositionId(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="border border-black ml-2 text-lg"
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

                    <label htmlFor="EmploymentStatus" className="ml-2 text-lg">雇用区分</label>
                    <select 
                        id="EmploymentStatus" 
                        name="EmploymentStatus"
                        value={employmentStatusId}
                        onChange={(e) => {
                            setEmploymentStatusId(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="border border-black ml-2 text-lg"
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
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        className="bg-[#264F22] text-white px-6 px-2 text-lg cursor-pointer"
                        onClick={() => router.push("/employee/admin")}
                    >
                        管理者権限付与
                    </button>
                    <button 
                        className="bg-sky-700 text-white px-6 px-2 text-lg cursor-pointer"
                        onClick={() => router.push("/employee/create")}
                    >
                        新規追加
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto min-h-[490px]">
                <table className="w-full border border-gray-300 border-collapse mt-5">
                    <thead>
                        <tr>
                            <th className="border p-4"></th>
                            <th className="border p-4">社員番号</th>
                            <th className="border p-4">氏名</th>
                            <th className="border p-4">メールアドレス</th>
                            <th className="border p-4">所属部署</th>
                            <th className="border p-4">役職</th>
                            <th className="border p-4">雇用区分</th>
                            <th className="border p-4">在籍区分</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEmployees
                            .map((employee,index) => (
                                <tr
                                    key={employee.id}
                                    className={index % 2 === 1 ? "bg-gray-300" : ""}
                                >
                                    <td className="border p-4 text-center">
                                        <Image 
                                            src="/image/detail.png" 
                                            alt="詳細画像" 
                                            width={20} 
                                            height={20}
                                            className="cursor-pointer"
                                            onClick={() => router.push(`/employee/${employee.id}`)}
                                        />
                                    </td>
                                    <td className="border p-4">{employee.id}</td>
                                    <td className="border p-4">{employee.name}</td>
                                    <td className="border p-4">{employee.email}</td>
                                    <td className="border p-4">{employee.department.department_name}</td>
                                    <td className="border p-4">{employee.position.position_name}</td>
                                    <td className="border p-4">{employee.employmentstatus.employee_status}</td>
                                    <td className="border p-4">{employee.enrollmentstatus.enrollment_status}</td>
                                </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-center items-center gap-4 mt-5">
                <button
                    onClick={() => setCurrentPage(validCurrentPage - 1)}
                    disabled={validCurrentPage === 1}
                    className="border border-black px-4 py-2"
                >
                    前へ
                </button>
                <span>
                    {totalPages === 0 ? 0 : validCurrentPage} / {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(validCurrentPage + 1)}
                    disabled={
                        totalPages === 0 || validCurrentPage === totalPages
                    }
                    className="border border-black px-4 py-2"
                >
                    次へ
                </button> 
            </div>
        </main>
    </>
  );
}
