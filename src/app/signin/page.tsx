"use client";

// // Reactの状態管理機能であるuseStateを読み込む
import React, { useState } from "react";
// Next.jsの画面遷移機能を使うためのuseRouterを読み込む
import { useRouter } from "next/navigation";
// Font Awesomeのアイコンを表示するためのコンポーネントを読み込む
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Font Awesomeの目のアイコンと目に斜線が入ったアイコンを読み込む
import { faEye,faEyeSlash } from "@fortawesome/free-solid-svg-icons";
// Toast通知を表示するためのtoastを読み込む
import toast from "react-hot-toast";
// Supabaseのブラウザ用クライアントを読み込む
import { createClient } from "../../../utils/supabase/client";

export default function Page() {
  // Next.jsの画面遷移機能を取得する
  const router = useRouter();
  // Supabaseのクライアントを作成する
  const supabase = createClient();

  // パスワードを表示するかどうかを管理するstateを作成する
  const [showPassword,setShowPassword] = useState(false);
  // 社員番号を管理するstateを作成する
  const [employeeNumber,setEmployeeNumber] = useState("");
  // パスワードを管理するstateを作成する
  const [password,setPassword] = useState("");

  // ログインボタンを押したときに実行する
  const handleSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    // フォームのデフォルト送信を停止する
    e.preventDefault();

    // ログインAPIに社員番号とパスワードを送信する
    const response = await fetch("/api/signin",{
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

    // ログインが成功したか確認する
    if(response.ok) {
      // Supabaseのログインセッションをブラウザに保存する
      await supabase.auth.setSession({
        // APIから返ってきたアクセストークンを設定する
        access_token: data.session.access_token,
        // APIから返ってきたリフレッシュトークンを設定する
        refresh_token: data.session.refresh_token,
      });

      // 成功メッセージをToastで表示する
      toast.success(data.message);

      // 1秒後に/meetingへ移動する
      setTimeout(() => {
        router.push("/meeting");
      },1000);
    } else {
      // エラーメッセージを確認する
      toast.error(data.message);
    }
  }

  return (
    <>
      <div className="text-center">
        <h1 className="mt-10 text-3xl font-bold text-[#2F6EBA]">会議ポータル</h1>
        <p className="mt-5 text-2xl font-bold">ログイン</p>

        <form 
          className="mx-auto w-150 mt-7"
          onSubmit={handleSignin}
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
              placeholder="社員番号を入力してください" 
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              required/>
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
                placeholder="パスワードを入力してください" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required/>
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
              ログイン
            </button>
            <button 
              type="button"
              onClick={() => router.push("/signin/admin")}
              className="mt-3 text-blue-300 font-bold cursor-pointer"
              >管理者画面へ
            </button>

            <p className="text-xl mt-10">アカウントを持っていませんか？</p>
            <button 
              type="button"
              onClick={() => router.push("/signup")}
              className="w-45 h-10 bg-black text-white text-lg cursor-pointer mx-auto mt-4"
            >
              新規登録
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
