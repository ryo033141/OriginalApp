// APIのレスポンスを返すために使用する
import { NextResponse } from "next/server";
// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";
// SupabaseのServer Clientを作成する関数を読み込む
import { createClient } from "../../../../../utils/supabase/server";
// 日本時間の現在日時を取得する関数
import { getCurrentJapanWallClock } from "@utils/dateTime";

// 「YYYY/MM/DD HH:mm」形式の日時をDate型へ変換する関数
export function parseDateTime(
    value: string
): Date | null {
    // 入力値が正しい形式か確認する
    const match = value.match(
        /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/
    );

    // 正しい形式でなければnullを返す
    if(!match) {
        return null;
    }

    // 年を取得
    const year = Number(match[1]);
    // 月を取得
    const month = Number(match[2]);
    // 日を取得
    const day = Number(match[3]);
    // 時を取得
    const hour = Number(match[4]);
    // 分を取得
    const minute = Number(match[5]);

    // 入力された年月日時分が正しいか検証する
    const check = new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute
        )
    );

    // 日付の自動補正が発生していないか確認する
    if(
        check.getUTCFullYear() !== year ||
        check.getUTCMonth() !== month - 1 ||
        check.getUTCDate() !== day ||
        check.getUTCHours() !== hour ||
        check.getUTCMinutes() !== minute
    ) {
        // 存在しない日時の場合はnullを返す
        return null;
    }

    // 日本時間の年月日時分をUTC成分にそのまま格納する
    return new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute
        )
    );
}

// 会議APIで受け取るデータの型を定義する
export interface MeetingRequest {
    // 会議タイトル
    title: unknown;
    // 会議場所
    place: unknown;
    // 開始日時
    startDate: unknown;
    // 終了日時
    endDate: unknown;
    // 説明
    description: unknown;
    // 必須参加者
    requiredEmails: unknown;
    // 任意参加者
    optionalEmails: unknown;
}


// バリデーション済みデータの型を定義する
export interface ValidatedMeetingRequest {
    // 会議タイトル
    title: string;
    // 会議場所
    place: string;
    // 開始日時
    startDate: Date;
    // 終了日時
    endDate: Date;
    // 説明
    description: string | null;
    // 必須参加者
    requiredEmails: string[];
    // 任意参加者
    optionalEmails: string[];
}


// 会議登録・更新用の入力値を検証する
export function validateMeetingRequest(
    body: MeetingRequest
): {
    data?: ValidatedMeetingRequest;
    error?: string;
} {
    // 会議タイトルが文字列か確認する
    if(
        typeof body.title !== "string" ||
        body.title.trim() === ""
    ) {
        // エラー内容を返す
        return {
            error: "会議タイトルは必須です",
        };
    }

    // 会議場所が文字列か確認する
    if(
        typeof body.place !== "string" ||
        body.place.trim() === ""
    ) {
        // エラー内容を返す
        return {
            error: "会議場所は必須です",
        };
    }

    // 開始日時が文字列か確認する
    if(
        typeof body.startDate !== "string"
    ) {
        // エラー内容を返す
        return {
            error: "開始日時は必須です",
        };
    }

    // 終了日時が文字列か確認する
    if(
        typeof body.endDate !== "string"
    ) {
        // エラー内容を返す
        return {
            error: "終了日時は必須です",
        };
    }

    // 必須参加者が配列か確認する
    if(
        !Array.isArray(body.requiredEmails)
    ) {
        // エラー内容を返す
        return {
            error: "必須参加者は配列で指定してください",
        };
    }

    // 任意参加者が配列か確認する
    if(
        !Array.isArray(body.optionalEmails)
    ) {
        // エラー内容を返す
        return {
            error: "任意参加者は配列で指定してください",
        };
    }

    // 必須参加者がすべて文字列か確認する
    if(
        !body.requiredEmails.every(
            (email: unknown) =>
                typeof email === "string"
        )
    ) {
        // エラー内容を返す
        return {
            error: "必須参加者にはメールアドレスを指定してください",
        };
    }

    // 任意参加者がすべて文字列か確認する
    if(
        !body.optionalEmails.every(
            (email: unknown) =>
                typeof email === "string"
        )
    ) {
        // エラー内容を返す
        return {
            error: "任意参加者にはメールアドレスを指定してください",
        };
    }

    // 必須参加者の空白を削除する
    const requiredEmails = body.requiredEmails.map(
        (email: string) => email.trim()
    );

    // 任意参加者の空白を削除する
    const optionalEmails = body.optionalEmails
        .map(
            (email: string) => email.trim()
        )
        .filter(
            (email: string) => email !== ""
        );

    // 必須参加者に空のメールアドレスがないか確認する
    if(
        requiredEmails.some(
            (email: string) => email === ""
        )
    ) {
        // エラー内容を返す
        return {
            error: "必須参加者に空のメールアドレスがあります",
        };
    }

    // 必須参加者をSetに変換する
    const requiredEmailSet = new Set(requiredEmails);
    // 任意参加者をSetに変換する
    const optionalEmailSet = new Set(optionalEmails);

    // 必須参加者に重複がないか確認する
    if(
        requiredEmailSet.size !==
        requiredEmails.length
    ) {
        // エラー内容を返す
        return {
            error: "必須参加者に同じ社員が重複しています",
        };
    }

    // 任意参加者に重複がないか確認する
    if(
        optionalEmailSet.size !==
        optionalEmails.length
    ) {
        // エラー内容を返す
        return {
            error: "任意参加者に同じ社員が重複しています",
        };
    }

    // 必須と任意の両方に存在するメールを取得する
    const duplicatedEmails = requiredEmails.filter(
        (email: string) => optionalEmailSet.has(email)
    );

    // 必須と任意の両方に同じ社員がいないか確認する
    if(duplicatedEmails.length > 0) {
        // エラー内容を返す
        return {
            error: "同じ社員を必須参加者と任意参加者の両方に登録することはできません",
        };
    }

    // 開始日時をDate型へ変換する
    const startDate = parseDateTime(body.startDate);
    // 終了日時をDate型へ変換する
    const endDate = parseDateTime(body.endDate);

    // 開始日時が正しい形式か確認する
    if(!startDate) {
        // エラー内容を返す
        return {
            error: "開始日時は「YYYY/MM/DD HH:mm」形式で入力してください",
        };
    }

    // 終了日時が正しい形式か確認する
    if(!endDate) {
        // エラー内容を返す
        return {
            error: "終了日時は「YYYY/MM/DD HH:mm」形式で入力してください",
        };
    }

    // 開始日時が終了日時より前か確認する
    if(startDate >= endDate) {
        // エラー内容を返す
        return {
            error: "開始日時は終了日時より前にしてください",
        };
    }

    // 日本時間の現在日時を取得する
    const currentTime = getCurrentJapanWallClock();

    // 開始日時が現在日時より前か確認する
    if(startDate < currentTime) {
        return {
            error: "現在時刻より前の時間帯なので会議を更新できません",
        };
    }

    // 会議場所の前後の空白を削除する
    const place = body.place.trim();

    // 説明を文字列として取得する
    const description =
        typeof body.description === "string"
            ? body.description.trim()
            : null;

    // 検証済みデータを返す
    return {
        data: {
            // 会議タイトルを返す
            title: body.title.trim(),
            // 会議場所を返す
            place: place,
            // 開始日時を返す
            startDate: startDate,
            // 終了日時を返す
            endDate: endDate,
            // 説明を返す
            description: description,
            // 必須参加者を返す
            requiredEmails: requiredEmails,
            // 任意参加者を返す
            optionalEmails: optionalEmails,
        },
    };
}

// 会議IDを指定して会議詳細を取得するGETリクエスト
export async function GET(
    request: Request,
    context: {
        params: Promise<{id: string;}>;
    }
) {
    try {
        // URLから会議IDを取得する
        const {id} = await context.params;
        // 会議IDを数値に変換する
        const meetingId = Number(id);

        // 会議IDが数字か確認する
        if(Number.isNaN(meetingId)) {
            // 400を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error: "会議IDが正しくありません",
                },
                {
                    // 不正なリクエストを表す
                    status: 400,
                }
            );
        }

        // Supabaseのサーバー側クライアントを作成する
        const supabase = await createClient();
        // Supabaseを使って現在ログインしているユーザーを取得する
        const {data,error} = await supabase.auth.getUser();

        // 認証エラーが発生した、またはログインユーザーがいない場合
        if(error || !data.user) {
            return NextResponse.json(
                {
                    error: "ログインが必要です。"
                },
                {
                    status: 401
                }
            );
        }

        // ログインユーザーのSupabase IDを使って社員情報を検索する
        const employee = await prisma.employee.findUnique({
            // SupabaseのユーザーIDと社員テーブルのauth_user_idを照合する
            where: {
                auth_user_id: data.user.id,
            },
        });

        // ログインユーザーに対応する社員情報が存在しない場合
        if(!employee) {
            // 社員情報が見つからないことを示す404を返す
            return NextResponse.json(
                {
                    error: "社員情報が見つかりません。"
                },
                {
                    status: 404
                }
            );
        }

        // 指定された会議を取得する
        const meeting = await prisma.meeting.findUnique({
            // 会議IDを検索条件にする
            where: {
                id: meetingId,
            },

            // 参加者情報も取得する
            include: {
                MeetingParticipants: {
                    // 社員情報も取得する
                    include: {
                        employee: true,
                    },
                },
            },
        });

        // 会議が存在するか確認する
        if(!meeting) {
            // 404を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error: "会議が見つかりません",
                },
                {
                    // データが存在しないことを表す
                    status: 404,
                }
            );
        }

        // 会議情報をJSONで返す
        return NextResponse.json(
            {
                // meetingとして会議情報を返す
                meeting: meeting,
            },
            {
                // 正常取得を表す
                status: 200,
            }
        );

    } catch(error) {
        // エラー内容を表示する
        console.error(error);

        // 500を返す
        return NextResponse.json(
            {
                // エラーメッセージを返す
                error: "会議詳細の取得に失敗しました",
            },
            {
                // サーバーエラーを表す
                status: 500,
            }
        );
    }
}

// 会議IDを指定して会議を更新するPUTリクエスト
export async function PUT(
    request: Request,
    context: {
        params: Promise<{id: string}>;
    }
) {
    try {
        // URLから会議IDを取得する
        const {id} = await context.params;

        // 会議IDを数値に変換する
        const meetingId = Number(id);

        // 会議IDが数字か確認する
        if(!Number.isInteger(meetingId) || meetingId <= 0) {
            // 400を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error: "会議IDが正しくありません",
                },
                {
                    // 不正なリクエストを表す
                    status: 400,
                }
            );
        }

        // SupabaseのServer Clientを作成する
        const supabase = await createClient();
        // ログインユーザーの情報を取得する
        const {data,error} = await supabase.auth.getUser();

        // ログインしていない場合
        if(error || !data.user) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    // ログインしていないことを伝える
                    error: "ログインしていません",
                },
                {
                    // 未認証を表す
                    status: 401,
                }
            );
        }
        
        // ログインユーザーに紐づく社員情報を取得する
        const organizer = await prisma.employee.findUnique({
            // SupabaseのユーザーIDで検索する
            where: {
                auth_user_id: data.user.id,
            },
            // 在籍区分の情報も取得する
            include: {
                enrollmentstatus: true,
            },
        });

        // 社員情報が見つからない場合
        if(!organizer) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    // 社員情報がないことを伝える
                    error: "社員情報が見つかりません",
                },
                {
                    // 対象が見つからないことを表す
                    status: 404,
                }
            );
        }

        // 対象会議と既存の参加者情報を取得する
        const existtingMeeting =
            await prisma.meeting.findUnique({
                // 会議IDで検索する
                where: {
                    id: meetingId,
                },
                include: {
                    MeetingParticipants: {
                        select: {
                            employee_id: true,
                        },
                    },
                },
            });

        // 会議が存在するか確認する
        if(!existtingMeeting) {
            // 404を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error: "会議が見つかりません",
                },
                {
                    // データが存在しないことを表す
                    status: 404,
                }
            );
        }

        // リクエストからJSONを取得する
        let body: MeetingRequest;

        try {
            // リクエストからJSONを取得する
            body = await request.json() as MeetingRequest;
        } catch {
            // JSON形式が正しくない場合は400を返す
            return NextResponse.json(
                {
                    error: "リクエストのJSON形式が正しくありません",
                },
                {
                    status: 400,
                }
            );
        }

        // 入力値をバリデーションする
        const validationRequest =
            validateMeetingRequest(body);

        // バリデーションエラーがあるか確認する
        if(validationRequest.error) {
            // 400を返す
            return NextResponse.json(
                {
                    // バリデーションエラーを返す
                    error: validationRequest.error,
                },
                {
                    // 入力エラーを表す
                    status: 400,
                }
            );
        }

        // バリデーション済みデータを取得する
        const {
            title,
            place,
            startDate,
            endDate,
            description,
            requiredEmails,
            optionalEmails,
        } = validationRequest.data!;

        // 主催者の在籍区分が「在籍」以外か確認する
        if(organizer.enrollmentstatus.enrollment_status !== "在籍") {
            // 編集を拒否してエラーレスポンスを返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定する
                    error: "主催者が在籍していないため、会議を編集できません。",
                },
                {
                    // 入力条件に問題があることを表すステータス400を返す
                    status: 400,
                }
            );
        }

        // 主催者のメールアドレスを取得する
        const organizerEmail = organizer.email;

        // 主催者が必須参加者に含まれていないか確認する
        if(requiredEmails.includes(organizerEmail)) {
            return NextResponse.json(
                {
                    error: "主催者を必須参加者に指定することはできません",
                },
                {
                    status: 400,
                }
            );
        }

        // 主催者が任意参加者に含まれていないか確認する
        if(optionalEmails.includes(organizerEmail)) {
            return NextResponse.json(
                {
                    error: "主催者を任意参加者に指定することはできません",
                },
                {
                    status: 400,
                }
            );
        }

        // 主催者以外の参加者が1人以上いるか確認する
        if(requiredEmails.length === 0 && optionalEmails.length === 0) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    // 主催者以外の参加者が必要であることを伝える
                    error: "主催者以外の参加者を1人以上登録してください",
                },
                {
                    // 入力エラーを表す
                    status: 400,
                }
            );
        }

        // 必須参加者と任意参加者をまとめる
        const participantEmails = [
            ...requiredEmails,
            ...optionalEmails,
        ];

        // メールアドレスの重複を削除する
        const uniqueEmails = [
            ...new Set(participantEmails),
        ];

        // 社員情報を取得する
        const employees =
            await prisma.employee.findMany({
                // メールアドレスで検索する
                where: {
                    email: {
                        // 入力されたメールを検索する
                        in: uniqueEmails,
                    },
                },
                // 在籍区分の情報も取得する
                include: {
                    enrollmentstatus: true,
                },
            });

        // DBに存在するメールをSetにする
        const registeredEmailSet = new Set(
            employees.map(
                (employee) => employee.email
            )
        );

        // DBに存在しないメールを取得する
        const notFoundEmails = uniqueEmails.filter(
            (email: string) =>
                !registeredEmailSet.has(email)
        );

        // 未登録メールがあるか確認する
        if(notFoundEmails.length > 0) {
            // 400を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error:
                        "社員名簿に登録されていないメールアドレスがあります",
                    // 未登録メールを返す
                    emails: notFoundEmails,
                },
                {
                    // 入力エラーを表す
                    status: 400,
                }
            );
        }

        // 在籍区分が「在籍」以外の社員を取得する
        const inactiveEmployees = employees.filter(
            // 社員の在籍区分を確認する
            (employee) => employee.enrollmentstatus.enrollment_status !== "在籍"
        );

        // 在籍していない社員が含まれているか確認する
        if(inactiveEmployees.length > 0) {
            // 会議を編集せず、エラーレスポンスを返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定する
                    error: "在籍していない社員が参加者に含まれているため、会議を編集できません。",
                    // 対象となった社員の情報を返す
                    employees: inactiveEmployees.map((employee) => ({
                        // 社員名を設定する
                        name: employee.name,
                        // メールアドレスを設定する
                        email: employee.email,
                        enrollStatus: employee.enrollmentstatus.enrollment_status,
                    })),
                },
                {
                    // 入力条件に問題があることを表すステータス400を返す
                    status: 400,
                }
            );
        }

        // メールと従業員番号を対応させる
        const employeeMap = new Map(
            employees.map(
                (employee) => [
                    employee.email,
                    employee.id,
                ]
            )
        );

        // 必須参加者の従業員番号を取得する
        const requiredEmployeeIds = [
            // 主催者を必須参加者として含める
            organizer.id,
            // 画面から指定された必須参加者を追加する
            ...requiredEmails.map(
                (email: string) => employeeMap.get(email)!
            ),
        ];

        // 時間が重複する必須参加者を検索する
        const confllicitingParticipants =
            await prisma.meetingParticipant.findMany({
                // 検索条件を指定する
                where: {
                    // 必須参加者と同じ社員を検索する
                    employee_id: {
                        in: requiredEmployeeIds,
                    },

                    // 必須参加者であることを確認する
                    attendance_type: "required",

                    // 既存会議の条件を指定する
                    meeting: {
                        // 現在の会議を除外する
                        id: {
                            not: meetingId,
                        },

                        // 既存会議の開始時刻を確認する
                        start_datetime: {
                            lt: endDate,
                        },

                        // 既存会議の終了時刻を確認する
                        end_datetime: {
                            gt: startDate,
                        },
                    },
                },

                // 会議と社員情報を取得する
                include: {
                    // 会議情報を取得する
                    meeting: true,
                    // 社員情報を取得する
                    employee: true,
                },
            });

        // 重複する必須参加者がいるか確認する
        if(confllicitingParticipants.length > 0) {
            // 重複しているメールを取得する
            const conflicitingEmails = [
                ...new Set(
                    confllicitingParticipants.map(
                        (participant) =>
                            participant.employee.email
                    )
                ),
            ];

            // 400を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error:
                        "必須参加者の会議時間が他の会議と重複しています",
                    // 重複メールを返す
                    emails: conflicitingEmails,
                },
                {
                    // 入力エラーを表す
                    status: 400,
                }
            );
        }

        // Meetingと参加者をTransactionで更新する
        const result = await prisma.$transaction(
            async(tx) => {
                // Meetingを更新する
                const meeting =
                    await tx.meeting.update({
                        // 更新対象を指定する
                        where: {
                            id: meetingId,
                        },

                        // 更新内容を指定する
                        data: {
                            // 会議タイトルを更新する
                            title: title,
                            // 会議場所を更新する
                            place: place,
                            // 開始日時を更新する
                            start_datetime: startDate,
                            // 終了日時を更新する
                            end_datetime: endDate,
                            // 説明を更新する
                            description: description,
                        },
                    });

                // 既存の参加者を削除する
                await tx.meetingParticipant.deleteMany({
                    // 現在の会議だけを対象にする
                    where: {
                        meeting_id: meetingId,
                    },
                });

                // 新しい参加者データを作成する
                const participantData = [
                    // ログインユーザーを必須参加者として登録する
                    {
                        // 主催者の社員IDを設定する
                        employee_id: organizer.id,
                        // 会議IDを設定する
                        meeting_id: meeting.id,
                        // 必須参加者として登録する
                        attendance_type: "required" as const,
                    },

                    // 必須参加者を登録する
                    ...requiredEmails.map(
                        (email: string) => ({
                            // 社員IDを設定する
                            employee_id:
                                employeeMap.get(email)!,

                            // 会議IDを設定する
                            meeting_id: meeting.id,

                            // 必須参加者として登録する
                            attendance_type:
                                "required" as const,
                        })
                    ),

                    // 任意参加者を登録する
                    ...optionalEmails.map(
                        (email: string) => ({
                            // 社員IDを設定する
                            employee_id:
                                employeeMap.get(email)!,

                            // 会議IDを設定する
                            meeting_id: meeting.id,

                            // 任意参加者として登録する
                            attendance_type:
                                "optional" as const,
                        })
                    ),
                ];

                // 新しい参加者をまとめて登録する
                await tx.meetingParticipant.createMany({
                    // 作成した参加者を登録する
                    data: participantData,
                });

                // 会議タイトルが変更されたか確認する
                const oldMeetingTitle = 
                    existtingMeeting.title !== title
                        ? existtingMeeting.title
                        : null;
                
                // 変更前と変更後の参加者を通知対象にする
                const notificationEmployeeIds = [
                    ...new Set([
                        // 変更前の主催者
                        existtingMeeting.organizer_id,
                        // 変更前の参加者
                        ...existtingMeeting.MeetingParticipants.map(
                            (participant) => participant.employee_id
                        ),
                        // 変更後の主催者
                        organizer.id,
                        // 変更後の参加者
                        ...participantData.map(
                            (participant) => participant.employee_id,
                        ),
                    ]),
                ];
                
                // 会議編集のアクティビティをDBに登録する
                await tx.meetingActivity.create({
                    // DBに登録するデータを指定する
                    data: {
                        // 会議を編集した社員のIDを登録する
                        employee_id: organizer.id,
                        // 編集した会議のIDを登録する
                        meeting_id: meeting.id,
                        // 通知対象の社員ID
                        notification_employee_ids: notificationEmployeeIds,
                        // 会議タイトルを変更した場合は変更前のタイトルを登録する
                        old_meeting_title: oldMeetingTitle,
                        // 編集後の会議タイトルを登録する
                        meeting_title: meeting.title,
                        // 「会議を編集した」というアクションを登録する
                        action: "update",
                    },
                });

                // 更新したMeetingを返す
                return meeting;
            }
        );

        // 会議更新成功を返す
        return NextResponse.json(
            {
                // 成功メッセージを返す
                message: "会議を更新しました",
                // 更新したMeetingを返す
                meeting: result,
            },
            {
                // 更新成功を表す
                status: 200,
            }
        );

    } catch(error) {
        // エラー内容を表示する
        console.error(error);

        // 500を返す
        return NextResponse.json(
            {
                // エラーメッセージを返す
                error: "会議の更新に失敗しました",
            },
            {
                // サーバーエラーを表す
                status: 500,
            }
        );
    }
}

// 会議IDを指定して会議を削除するDELETEリクエスト
export async function DELETE(
    request: Request,
    context: {
        params: Promise<{id: string}>;
    }
) {
    try {
        // URLから会議IDを取得する
        const {id} = await context.params;

        // 会議IDを数値に変換する
        const meetingId = Number(id);

        // 会議IDが数字か確認する
        if(!Number.isInteger(meetingId) || meetingId <= 0) {
            // 400を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error: "会議IDが正しくありません",
                },
                {
                    // 不正なリクエストを表す
                    status: 400,
                }
            );
        }

        // SupabaseのServer Clientを作成する
        const supabase = await createClient();
        // ログインユーザーの情報を取得する
        const {data,error} = await supabase.auth.getUser();

        // ログインしていない場合
        if(error || !data.user) {
           // エラーメッセージを返す
           return NextResponse.json(
                {
                    // ログインしていないことを伝える
                    error: "ログインしていません",
                },
                {
                    // 未認証を表す
                    status: 401,
                }
           ); 
        }

        // ログインユーザーに紐づく社員情報を取得する
        const organizer = await prisma.employee.findUnique({
            // SupabaseのユーザーIDで検索する
            where: {
                auth_user_id: data.user.id,
            },
        });

        // 社員情報が見つからない場合
        if(!organizer) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    // 社員情報がないことを伝える
                    error: "社員情報が見つかりません",
                },
                {
                    // 対象が見つからないことを表す
                    status: 404,
                }
            );
        }

        // 削除対象の会議と参加者情報を取得する
        const existtingMeeting =
            await prisma.meeting.findUnique({
                // 会議IDで検索する
                where: {
                    id: meetingId,
                },
                include: {
                    MeetingParticipants: {
                        select: {
                            employee_id: true,
                        },
                    },
                },
            });

        // 会議が存在するか確認する
        if(!existtingMeeting) {
            // 404を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error: "会議が見つかりません",
                },
                {
                    // データが存在しないことを表す
                    status: 404,
                }
            );
        }

        // Meetingと参加者をTransactionで削除する
        await prisma.$transaction(
            async(tx) => {
                // 削除前の主催者と参加者を通知対象として取得する
                const notificationEmployeeIds = [
                    ...new Set([
                        // 主催者
                        existtingMeeting.organizer_id,
                        // 参加者
                        ...existtingMeeting.MeetingParticipants.map(
                            (participant) => participant.employee_id,
                        )
                    ]),
                ];

                // 会議削除のアクティビティをDBに登録する
                await tx.meetingActivity.create({
                    // DBに登録するデータを指定する
                    data: {
                        // 会議を削除した社員のIDを登録する
                        employee_id: organizer.id,
                        // 削除する会議のIDを登録する
                        meeting_id: meetingId,
                        // 削除前の主催者と参加者を登録する
                        notification_employee_ids: notificationEmployeeIds,
                        // 削除前の会議タイトルを登録する
                        old_meeting_title: existtingMeeting.title,
                        // 削除した会議のタイトルを登録する
                        meeting_title: existtingMeeting.title,
                        // 「会議を削除した」というアクションを登録する
                        action: "delete",
                    },
                });

                // 参加者を削除する
                await tx.meetingParticipant.deleteMany({
                    // 現在の会議だけを対象にする
                    where: {
                        meeting_id: meetingId,
                    },
                });

                // Meetingを削除する
                await tx.meeting.delete({
                    // 削除対象を指定する
                    where: {
                        id: meetingId,
                    },
                });
            }
        );

        // 会議削除成功を返す
        return NextResponse.json(
            {
                // 成功メッセージを返す
                message: "会議を削除しました",
            },
            {
                // 削除成功を表す
                status: 200,
            }
        );

    } catch(error) {
        // エラー内容を表示する
        console.error(error);

        // 500を返す
        return NextResponse.json(
            {
                // エラーメッセージを返す
                error: "会議の削除に失敗しました",
            },
            {
                // サーバーエラーを表す
                status: 500,
            }
        );
    }
}