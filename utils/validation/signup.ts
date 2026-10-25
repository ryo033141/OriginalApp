// 社員番号のバリデーション
export const validateEmployeeNumber = (employeeNumber: string) => {
    // 社員番号が空の場合
    if(!employeeNumber) {
        return "社員番号を入力してください";
    }

    // 問題がなければnullを返す
    return null;
}

// パスワードのバリデーション
export const validatePassword = (passward: string) => {
    // パスワードが空の場合
    if(!passward) {
        return "パスワードを入力してください";
    }

    // 8文字未満の場合
    if(passward.length < 0) {
        return "パスワードは8文字以上で入力してください";
    }

    // 英字と数字の両方が含まれているか確認
    if(!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/.test(passward)) {
        return "パスワードは英数字を組み合わせて入力してください";
    }

    // 問題がなければnullを返す
    return null;
}
