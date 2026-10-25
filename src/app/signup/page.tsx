"use client";

// // Reactの状態管理機能であるuseStateを読み込む
import { useState } from "react";
// Next.jsの画面遷移機能を使うためのuseRouterを読み込む
import { useRouter } from "next/navigation";
// Font Awesomeのアイコンを表示するためのコンポーネントを読み込む
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Font Awesomeの目のアイコンと目に斜線が入ったアイコンを読み込む
import { faEye,faEyeSlash } from "@fortawesome/free-solid-svg-icons";
// signupのバリデーション機能を読み込む
import { validateEmployeeNumber,validatePassword } from "../../../utils/validation/signup";
// Toast表示用
import toast from "react-hot-toast";

export default function Page() {
  // Next.jsの画面遷移機能を取得する
  const router = useRouter();
  // パスワードを表示するかどうかを管理するstateを作成する
  const [showPassword,setShowPassword] = useState(false);
  // 入力した社員番号を管理するstateを追加
  const [employeeNumber,setEmployeeNumber] = useState("");
  // 入力したパスワードを管理するstateを追加
  const [password,setPassword] = useState("");

  // 新規登録ボタンを押したときに実行する
  const handleSignup = async () => {
    // 社員番号のバリデーションを実行
    const employeeNumberErrorMessage = validateEmployeeNumber(employeeNumber);
    // パスワードのバリデーションを実行
    const passwordErrorMessage = validatePassword(password);

    // 社員番号にエラーがある場合
    if(employeeNumberErrorMessage) {
      // 社員番号のエラーメッセージをToast表示する
      toast.error(employeeNumberErrorMessage);
    }

    // パスワードにエラーがある場合
    if(passwordErrorMessage) {
      // パスワードのエラーメッセージをToast表示する
      toast.error(passwordErrorMessage);
    }

    // 社員番号またはパスワードにエラーがある場合は処理を終了
    if(employeeNumberErrorMessage || passwordErrorMessage) {
      return;
    }

    try {
      // APIに社員番号とパスワードを送信する
      const response = await fetch("/api/signup",{
        // HTTPメソッドをPOSTに指定する
        method: "POST",
        // JSON形式のデータを送信することを指定する
        headers: {
          "Content-Type": "application/json",
        },
        // 社員番号とパスワードをJSON形式にして送信する
        body: JSON.stringify({
          employeeNumber,
          password,
        }),
      });

      // APIから返ってきたJSONデータを取得する
      const data = await response.json();

      // APIから登録成功のレスポンスが返ってきたか確認する
      if(response.ok) {
        // 登録成功メッセージをToastで表示する
        toast.success(data.message);

        // 1秒後にサインイン画面へ移動する
        setTimeout(() => {
          router.push("/signin");
        },1000);
      } else {
        // APIから返されたエラーメッセージをToastで表示する
        toast.error(data.message);
      }
    } catch(error) {
      // API通信でエラーが発生した場合はエラーを表示する
      toast.error("新規登録に失敗しました");
    }
  }

  return (
    <>
      <div className="text-center">
        <h1 className="mt-10 text-3xl font-bold text-[#2F6EBA]">会議ポータル</h1>
        <p className="mt-5 text-2xl font-bold">新規登録</p>

        <form 
          className="mx-auto w-150 mt-7"
          onSubmit={(e) => {
            // フォーム送信時のページ再読み込みを防ぐ
            e.preventDefault();

            // 新規登録処理を実行する
            handleSignup();
          }}
        >
          <div className="flex flex-col">
            <label 
              htmlFor="employeenumber" 
              className="text-left text-xl font-bold">
                社員番号
              </label>
            <input 
              className="h-11 w-150 border-2 border-gray-400 rounded-sm pl-2 mt-2"
              type="text" 
              id="employeenumber" 
              placeholder="登録する社員番号を入力してください" 
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              required
            />
            <label 
              htmlFor="password" 
              className="text-left text-xl font-bold mt-7">
                パスワード
            </label>
            <div className="relative mt-2">
              <input 
                className="h-11 w-150 border-2 border-gray-400 rounded-sm pl-2 pr-10"
                type={showPassword ? "text" : "password"}
                id="password" 
                placeholder="登録するパスワードを入力してください" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                pattern="(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]+"
                title="8文字以上の英数字を組み合わせて入力してください"
              />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye}/>
                </button>
            </div>
            <button 
              type="submit"
              className="w-45 h-10 bg-sky-700 text-white text-lg cursor-pointer mx-auto mt-7"
            >
              新規登録
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
