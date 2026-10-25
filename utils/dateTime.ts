// 日本時間の現在日時を取得する関数
export function getCurrentJapanWallClock(): Date {
    // 現在の日時を、日本時間の年月日・時分秒に分解する
    const parts = new Intl.DateTimeFormat("en-GB",{
        // 日本のタイムゾーンを指定する
        timeZone: "Asia/Tokyo",
        // 年を取得する
        year: "numeric",
        // 月を2桁で取得する
        month: "2-digit",
        // 日を2桁で取得する
        day: "2-digit",
        // 時間を2桁で取得する
        hour: "2-digit",
        // 分を2桁で取得する
        minute: "2-digit",
        // 秒を2桁で取得する
        second: "2-digit",
        // 時刻を24時間表記にする
        hourCycle: "h23",
    }).formatToParts(new Date());

    // 分解した日時の部品を、名前から値を取り出せるオブジェクトに変換する
    const values = Object.fromEntries(
        // 各部品から種類（type）と値（value）を取り出す
        parts.map(({type,value}) => [type,value])
    );

    // 日本時間の年月日時分秒を使ってDateオブジェクトを作成する
    return new Date(
        // 指定した日時をUTCの年月日時分秒として組み立てる
        Date.UTC(
            // 年を数値に変換して設定する
            Number(values.year),
            // 月を数値に変換し、1を引いて設定する
            Number(values.month) - 1,
            // 日を数値に変換して設定する
            Number(values.day),
            // 時を数値に変換して設定する
            Number(values.hour),
            // 分を数値に変換して設定する
            Number(values.minute),
            // 秒を数値に変換して設定する
            Number(values.second)
        )
    );
}