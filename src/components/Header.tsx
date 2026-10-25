"use client";

// Next.jsで画像を表示するためのImageコンポーネントを読み込む
import Image from "next/image";
// Next.jsの画面遷移に使うuseRouterと、現在のURLを取得するusePathnameを読み込む
import { useRouter,usePathname } from "next/navigation";
// Reactの状態管理とデータ取得後の処理に使う
import { useEffect,useState } from "react";
// Toast表示用
import toast from "react-hot-toast";

// Headerコンポーネントに渡すPropsの型を定義する
type HeaderProps = {
    // 戻るパスを指定する変数（指定がある時だけ戻るボタンを表示）
    backPath?: string;
}

export default function Header({backPath}: HeaderProps) {
    // Next.jsの画面遷移機能を取得する
    const router = useRouter();
    // 現在表示しているページのURLパスを取得する
    const pathName = usePathname();
    // 現在のページが「/employee」系のページかどうかを判定する
    const isEmployeePage = 
      pathName === "/employee" || pathName.startsWith("/employee/");
    // ログイン中の社員名を保存する
    const [userName,setUserName] = useState("");

    // /api/meからログイン中の社員情報を取得する
    useEffect(() => {
      // ログインユーザーを取得するための非同期関数を作る
      const getUser = async () => {
        try {
          // 自分のアプリ内にある /api/me にアクセスする
          const response = await fetch("/api/me");

          // APIの処理が失敗した場合はここで終了する
          if(!response.ok) {
            return;
          }

          // APIから返ってきたJSONデータを取得する
          const data = await response.json();
          // 取得した社員名をuserNameに保存する
          setUserName(data.name);
        } catch(error) {
          // API通信などでエラーが発生した場合エラーを表示する
          console.error("ユーザー情報の取得に失敗しました", error);
        }
      }
      
      // 作成したgetUser関数を実行する
      getUser();
    },[]);

    // ログアウト処理を行う関数
    const handleLogout = async () => {
      // /api/logoutにPOSTリクエストを送る
      const response = await fetch("/api/logout",{
        method: "POST",
      });

      // JSONデータを取得
      const data = await response.json();

      // ログアウト成功の場合
      if(response.ok) {
        // 成功メッセージをToast表示
        toast.success(data.message);
        
        // 1秒後にログイン画面へ移動する
        setTimeout(() => {
          router.push("/signin");
        },1000);
      } else {
        // 失敗メッセージをToast表示
        toast.error(data.message);
      }
    }

    return (
        <header>
          <div className="flex justify-between items-center h-16 bg-sky-600 px-6">
            <h1 
              className="text-white font-bold ml-10 text-xl cursor-pointer"
              onClick={() => router.push(isEmployeePage ? "/employee" : "/meeting")}
              >
                会議ポータル
              </h1>
            <nav>
              <ul className="flex items-center gap-6">
                <li className="text-white mr-5">
                  ユーザー名：{userName}{isEmployeePage ? "（管理者）" : ""}
                </li>
                <li 
                  className="flex items-center gap-2 text-white cursor-pointer mr-10"
                  onClick={handleLogout}
                >
                  <Image src="/image/signout_icon.png" alt="サインアウトアイコン" width={25} height={25}/>
                  ログアウト</li>
              </ul>
            </nav>
          </div>

          {isEmployeePage && (
            <div className="flex justify-between items-center h-12 bg-blue-100 px-6">
              <h1 className="ml-10 text-lg">管理者画面</h1> 
              {backPath && (
                  <nav>
                  <ul className="flex items-center gap-6">
                      <li 
                          className="flex items-center gap-2 cursor-pointer mr-10"
                          onClick={() => router.push(backPath)}
                      >
                        <Image src="/image/back_icon.png" alt="戻るアイコン" width={25} height={25}/>
                      戻る</li>
                  </ul>
                  </nav>
              )}
            </div>
          )}

          {!isEmployeePage && backPath && (
            <div className="flex justify-end items-center h-0 px-6">
              <nav>
                <ul className="mt-15">
                  <li
                    className="flex items-center gap-2 cursor-pointer mr-10"
                    onClick={() => router.push(backPath)}
                  >
                  <Image 
                    src="/image/back_icon.png"
                    alt="戻るアイコン" 
                    width={25} 
                    height={25}/>
                  戻る
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </header>
    );
}