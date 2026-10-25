// PrismaClientを読み込む
import { PrismaClient } from "@prisma/client";

// グローバル変数を使用するためのglobalThisを取得する
// PrismaClientを保持するための型を定義する
const globalForPrisma = globalThis as unknown as {
    // PrismaClientまたはundefinedを設定できるようにする
    prisma: PrismaClient | undefined;
}

// グローバル変数に既存のPrismaClientがあればそれを使用する
// 既存のPrismaClientがなければ新しく作成する
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// 開発環境の場合のみ処理する
if(process.env.NODE_ENV !== "production") {
    // 作成したPrismaClientをグローバル変数に保存する
    globalForPrisma.prisma = prisma;
}
