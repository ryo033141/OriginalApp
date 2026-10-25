// APIレスポンス用
import { NextResponse } from "next/server";
// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";
// SupabaseのServer Clientを作成する関数を読み込む
import { createClient } from "../../../../utils/supabase/server";
// 日本時間の現在日時を取得する関数
import { getCurrentJapanWallClock } from "@utils/dateTime";

// 日時文字列をDateに変換
function parseDateTime(value: string): Date | null {
    // 日時の形式を確認
    const match = value.match(
        /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/
    );

    // 形式が違えばnull
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
    // 入力された日時が暦上正しいかを確認
    const localDate = new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute
        )
    );

    // 日時の自動補正を確認
    if(
        localDate.getUTCFullYear() !== year ||
        localDate.getUTCMonth() !== month - 1 ||
        localDate.getUTCDate() !== day ||
        localDate.getUTCHours() !== hour ||
        localDate.getUTCMinutes() !== minute
    ) {
        // 存在しない日時ならnull
        return null;
    }

    // 入力された日本時間の年月日時分をそのまま保持する
    const date = new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            hour,
            minute
        )
    );

    // Dateを返す
    return date;
}

// リクエストデータの型
interface MeetingRequest {
    title: unknown;
    place: unknown;
    startDate: unknown;
    endDate: unknown;
    description: unknown;
    requiredEmails: unknown;
    optionalEmails: unknown;
}

// バリデーション後の型
interface ValidatedMeetingRequest {
    title: string;
    place: string;
    startDate: Date;
    endDate: Date;
    description: string | null;
    requiredEmails: string[];
    optionalEmails: string[];
}

// 会議登録データを検証
function validateMeetingRequest(
    body: MeetingRequest
): {
    data?: ValidatedMeetingRequest;
    error?: string;
} {
    // タイトルを確認
    if(
        typeof body.title !== "string" ||
        body.title.trim() === ""
    ) {
        // タイトルが空ならエラー
        return {
            error: "会議タイトルは必須です",
        };
    }

    // 場所を確認
    if(
        typeof body.place !== "string" ||
        body.place.trim() === ""
    ) {
        // 場所が空ならエラー
        return {
            error: "会議場所は必須です",
        };
    }

    // 開始日時の型を確認
    if(typeof body.startDate !== "string") {
        // 開始日時が不正ならエラー
        return {
            error: "開始日時は必須です",
        };
    }

    // 終了日時の型を確認
    if(typeof body.endDate !== "string") {
        // 終了日時が不正ならエラー
        return {
            error: "終了日時は必須です",
        };
    }

    // 必須参加者の型を確認
    if(!Array.isArray(body.requiredEmails)) {
        // 配列でなければエラー
        return {
            error: "必須参加者は配列で指定してください",
        };
    }

    // 任意参加者の型を確認
    if(!Array.isArray(body.optionalEmails)) {
        // 配列でなければエラー
        return {
            error: "任意参加者は配列で指定してください",
        };
    }

    // 必須参加者の要素を確認
    if(
        !body.requiredEmails.every(
            (email: unknown) => typeof email === "string"
        )
    ) {
        // 文字列でなければエラー
        return {
            error:
                "必須参加者にはメールアドレスを指定してください",
        };
    }

    // 任意参加者の要素を確認
    if(
        !body.optionalEmails.every(
            (email: unknown) => typeof email === "string"
        )
    ) {
        // 文字列でなければエラー
        return {
            error:
                "任意参加者にはメールアドレスを指定してください",
        };
    }

    // 必須参加者の空白を削除
    const requiredEmails = body.requiredEmails.map(
        (email: string) => email.trim()
    );

    // 任意参加者の空白を削除
    const optionalEmails = body.optionalEmails
        .map((email: string) => email.trim())
        .filter((email: string) => email !== "");

    // 必須参加者の空欄を確認
    if(
        requiredEmails.some(
            (email: string) => email === ""
        )
    ) {
        // 空欄があればエラー
        return {
            error:
                "必須参加者に空のメールアドレスがあります",
        };
    }

    // 必須参加者をSetにする
    const requiredEmailSet = new Set(requiredEmails);

    // 任意参加者をSetにする
    const optionalEmailSet = new Set(optionalEmails);

    // 必須参加者の重複を確認
    if(
        requiredEmailSet.size !== requiredEmails.length
    ) {
        // 重複があればエラー
        return {
            error:
                "必須参加者に同じ社員が重複しています",
        };
    }

    // 任意参加者の重複を確認
    if(
        optionalEmailSet.size !== optionalEmails.length
    ) {
        // 重複があればエラー
        return {
            error:
                "任意参加者に同じ社員が重複しています",
        };
    }

    // 必須と任意の重複を取得
    const duplicatedEmails = requiredEmails.filter(
        (email: string) => optionalEmailSet.has(email)
    );

    // 必須と任意の重複を確認
    if(duplicatedEmails.length > 0) {
        // 重複があればエラー
        return {
            error:
                "同じ社員を必須参加者と任意参加者の両方に登録することはできません",
        };
    }

    // 開始日時をDateに変換
    const startDate = parseDateTime(body.startDate);
    // 終了日時をDateに変換
    const endDate = parseDateTime(body.endDate);

    // 開始日時を確認
    if(!startDate) {
        // 形式が違えばエラー
        return {
            error:
                "開始日時は「YYYY/MM/DD HH:mm」形式で入力してください",
        };
    }

    // 終了日時を確認
    if(!endDate) {
        // 形式が違えばエラー
        return {
            error:
                "終了日時は「YYYY/MM/DD HH:mm」形式で入力してください",
        };
    }

    // 日時の前後関係を確認
    if(startDate >= endDate) {
        // 開始が終了以降ならエラー
        return {
            error:
                "開始日時は終了日時より前にしてください",
        };
    }

    // 日本時間の現在時刻を取得
    const currentTime = getCurrentJapanWallClock();

    // 開始日時が現在時刻より前か確認
    if(startDate < currentTime) {
        // 過去の日時ならエラー
        return {
            error: "現在時刻より前の時間帯なので新規会議作成できません",
        };
    }

    // 場所の空白を削除
    const place = body.place.trim();

    // 説明文を整形
    const description =
        typeof body.description === "string"
            ? body.description.trim()
            : null;

    // 検証済みデータを返す
    return {
        data: {
            // タイトルを設定
            title: body.title.trim(),
            // 場所を設定
            place: place,
            // 開始日時を設定
            startDate: startDate,
            // 終了日時を設定
            endDate: endDate,
            // 説明を設定
            description: description,
            // 必須参加者を設定
            requiredEmails: requiredEmails,
            // 任意参加者を設定
            optionalEmails: optionalEmails,
        },
    };
}

// 会議一覧を取得
export async function GET() {
    try {
        // SupabaseのServer Clientを作成する
        const supabase = await createClient();
        // ログインユーザーの情報を取得する
        const {data,error} = await supabase.auth.getUser();

        // ログインしていない場合
        if(error || !data.user) {
            // 401を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error: "ログインしていません",
                },
                {
                    // 未認証を表す
                    status: 401,
                }
            );
        }

        // ログインユーザーに紐づく社員情報を取得する
        const employee = await prisma.employee.findUnique({
            // SupabaseのユーザーIDで検索する
            where: {
                auth_user_id: data.user.id,
            },
        });

        // 社員情報が見つからない場合
        if(!employee) {
            // 404を返す
            return NextResponse.json(
                {
                    // エラーメッセージを返す
                    error: "社員情報が見つかりません",
                },
                {
                    // 対象が存在しないことを表す
                    status: 404,
                }
            );
        }

        // 自分が参加している会議だけを取得する
        const meetings = await prisma.meeting.findMany({
            // 自分が参加者として登録されている会議に絞る
            where: {
                MeetingParticipants: {
                    some: {
                        // ログインユーザーの社員IDで検索する
                        employee_id: employee.id,
                    },
                },
            },
            // 開始日時の早い順に並べる
            orderBy: {
                start_datetime: "asc",
            },
            // 参加者情報も取得する
            include: {
                MeetingParticipants: {
                    // 社員情報も取得する
                    include: {
                        employee: {
                            // 画面表示に必要な項目だけ取得する
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                department: true,
                            },
                        },
                    },
                },
            },
        });

        // 自分の参加区分を付けて会議一覧を作成する
        const result = meetings.map((meeting) => {
            // 自分の参加情報を取得する
            const myParticipantion = meeting.MeetingParticipants.find(
                (participant) => participant.employee_id === employee.id
            );
        
            // 会議情報と自分の参加区分を返す
            return {
                ...meeting,
                attendanceType: myParticipantion?.attendance_type ?? null,
            };
        });

        // 会議一覧を返す
        return NextResponse.json(
            {
                // 会議一覧を返す
                meetings: result,
            },
            {
                // 正常取得を表す
                status: 200,
            }
        );
    } catch(error) {
        // エラーを出力
        console.error(error);

        // エラーを返す
        return NextResponse.json(
            {
                // エラーメッセージを設定
                error:
                    "会議一覧の取得に失敗しました",
            },
            {
                // ステータス500を返す
                status: 500,
            }
        );
    }
}

// 会議登録を処理
export async function POST(request: Request) {
    try {
        // リクエストのJSONを取得
        let body: MeetingRequest;

        try {
            // リクエストのJSONを取得
            body = await request.json() as MeetingRequest;
        } catch {
            return NextResponse.json(
                {
                    error: "リクエストのJSON形式が正しくありません",
                },
                {
                    status: 400,
                }
            );
        }

        // 入力値をバリデーション
        const validationRequest =
            validateMeetingRequest(body);

        // バリデーションエラーを確認
        if(validationRequest.error) {
            // エラー内容を返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定
                    error: validationRequest.error,
                },
                {
                    // ステータス400を返す
                    status: 400,
                }
            );
        }

        // 検証済みデータを取得
        const {
            title,
            place,
            startDate,
            endDate,
            description,
            requiredEmails,
            optionalEmails,
        } = validationRequest.data!;

        // SupabaseのServer Clientを作成する
        const supabase = await createClient();
        // ログインユーザーを取得する
        const {data,error} = await supabase.auth.getUser();

        // ログインしていない場合
        if(error || !data.user) {
            // ログインユーザーを取得する
            return NextResponse.json(
                {
                    // エラーメッセージを設定
                    error: "ログインしてください",
                },
                {
                    // ステータス401を返す
                    status: 401,
                }
            )
        }

        // ログインユーザーの社員情報を取得する
        const organizer = await prisma.employee.findUnique({
            // 検索する条件を指定する
            where: {
                // ログイン中のSupabaseユーザーIDと一致する社員を検索する
                auth_user_id: data.user.id,
            },
            // 社員情報に加えて、在籍区分の情報も取得する
            include: {
                // 在籍区分の関連データを取得する
                enrollmentstatus: true,
            },
        });

        // 社員情報が見つからない場合
        if(!organizer) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定
                    error: "主催者の社員情報が見つかりません",
                },
                {
                    // ステータス404を返す
                    status: 404,
                }
            );
        }

        // 主催者の在籍区分が「在籍」か確認する
        if(organizer.enrollmentstatus.enrollment_status !== "在籍") {
            // 会議を登録せず、エラーレスポンスを返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定する
                    error: "主催者が在籍していないため、会議を設定できません。",
                },
                {
                    // 不正な条件によるリクエストを表すステータス400を返す
                    status: 400,
                }
            );
        }

        // 主催者のメールアドレスを取得する
        const organizerEmail = organizer.email;
        
        // 主催者が必須参加者に含まれているか確認する
        if(requiredEmails.includes(organizerEmail)) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定する
                    error: "主催者を必須参加者に指定することはできません",
                },
                {
                    // 不正な入力を表す
                    status: 400,
                }
            );
        }

        // 主催者が任意参加者に含まれているか確認する
        if(optionalEmails.includes(organizerEmail)) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定する
                    error: "主催者を任意参加者に指定することはできません",
                },
                {
                    // 不正な入力を表す
                    status: 400,
                }
            );
        }
        
        // 主催者以外の参加者がいないか確認する
        if(requiredEmails.length === 0 && optionalEmails.length === 0) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定する
                    error: "主催者以外の参加者を1人以上登録してください",
                },
                {
                    // 不正な入力を表す
                    status: 400,
                }
            );
        }

        // 主催者以外の参加者を取得する
        const otherParticipantEmails = [
            ...requiredEmails,
            ...optionalEmails,
        ].filter(
            (email: string) => email !== organizerEmail
        );

        // 主催者以外の参加者がいない場合
        if(otherParticipantEmails.length === 0) {
            // エラーメッセージを返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定
                    error: "主催者以外の参加者を1人以上登録してください",
                },
                {
                    // ステータス400を返す
                    status: 400
                }
            );
        }

        // 参加者のメールをまとめる
        const participantEmails = [
            ...requiredEmails,
            ...optionalEmails
        ];

        // メールの重複を削除
        const uniqueEmails = [
            ...new Set(participantEmails),
        ];

        // 必須参加者と任意参加者の社員情報をデータベースから取得する
        const employees =
            await prisma.employee.findMany({
                // 社員を検索する条件を指定する
                where: {
                    // メールアドレスを使って検索する
                    email: {
                        // uniqueEmailsに含まれるメールアドレスと一致する社員を取得する
                        in: uniqueEmails,
                    },
                },
                // 社員情報に加えて、関連する在籍区分の情報も取得する
                include: {
                    // 在籍区分の関連データを取得する
                    enrollmentstatus: true,
                },
            });

        // 登録済みメールをSetにする
        const registeredEmailSet = new Set(
            employees.map(
                (employee) => employee.email
            )
        );

        // 未登録メールを取得
        const notFoundEmails = uniqueEmails.filter(
            (email: string) => !registeredEmailSet.has(email)
        );

        // 未登録社員を確認
        if(notFoundEmails.length > 0) {
            // 登録せず400を返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定
                    error:
                        "社員名簿に登録されていないメールアドレスがあります",
                    // 未登録メールを返す
                    emails: notFoundEmails,
                },
                {
                    // ステータス400を返す
                    status: 400,
                }
            );
        }

        // 在籍区分が「在籍」以外の社員を取得する
        const inactiveEmployees = employees.filter(
            // 社員の在籍区分が「在籍」以外かどうかを判定する
            (employee) => employee.enrollmentstatus.enrollment_status !== "在籍"
        );

        // 在籍していない社員が1人以上いるか確認する
        if(inactiveEmployees.length > 0) {
            // 会議を登録せず、エラーレスポンスを返す
            return NextResponse.json(
                {
                   // エラーメッセージを設定する
                    error: "在籍していない社員が参加者に含まれているため、会議を設定できません。",
                    // 在籍していない社員の情報を配列にして返す
                    employees: inactiveEmployees.map((employee) => ({
                        // 社員の名前を設定する
                        name: employee.name,
                        // 社員のメールアドレスを設定する
                        email: employee.email,
                        // 社員の在籍区分を設定する
                        enrollmentStatus: employee.enrollmentstatus.enrollment_status,
                    })),
                },
                {
                    // 入力内容に問題があることを示すステータス400を返す
                    status: 400,
                }
            );
        }

        // メールと社員IDのMapを作成
        const employeeMap = new Map(
            employees.map(
                (employee) => [
                    employee.email,
                    employee.id,
                ]
            )
        );

        // 必須参加者の社員IDを取得
        const requiredEmployeeIds = [
            // 主催者も必須参加者として含める
            organizer.id,
            // 画面から指定された必須参加者を追加する
            ...requiredEmails.map(
                (email: string) => employeeMap.get(email)!
            ),
        ];

        // 参加者の時間重複を検索
        const conflictingParticipants =
            await prisma.meetingParticipant.findMany({
                // 検索条件を指定
                where: {
                    // 同じ社員を検索
                    employee_id: {
                        in: requiredEmployeeIds,
                    },
                    // 必須参加者のみ検索
                    attendance_type: "required",
                    // 会議時間を確認
                    meeting: {
                        // 既存会議の開始を確認
                        start_datetime: {
                            lt: endDate,
                        },
                        // 既存会議の終了を確認
                        end_datetime: {
                            gt: startDate,
                        },
                    },
                },
                // 会議と社員を取得
                include: {
                    // 会議情報を取得
                    meeting: true,
                    // 社員情報を取得
                    employee: true,
                },
            });

        // 時間重複があるか確認
        if(conflictingParticipants.length > 0) {
            // 重複メールを取得
            const conflicitingEmails = [
                // 重複を削除
                ...new Set(
                    // メールアドレスを取得
                    conflictingParticipants.map(
                        (participant) =>
                            participant.employee.email
                    )
                ),
            ];

            // 登録せず400を返す
            return NextResponse.json(
                {
                    // エラーメッセージを設定
                    error:
                        "必須参加者の会議時間が他の会議と重複しています",
                    // 重複メールを返す
                    emails: conflicitingEmails,
                },
                {
                    // ステータス400を返す
                    status: 400,
                }
            );
        }

        // Transactionで登録
        const result = await prisma.$transaction(
            async(tx) => {
                // 会議を登録
                const meeting =
                    await tx.meeting.create({
                        // 登録データを指定
                        data: {
                            // タイトルを登録
                            title: title,
                            // 場所を登録
                            place: place,
                            // 開始日時を登録
                            start_datetime: startDate,
                            // 終了日時を登録
                            end_datetime: endDate,
                            // 説明を登録
                            description: description,
                            // 主催者の社員IDを登録する
                            organizer_id: organizer.id,
                        },
                    });

                // 参加者データを作成
                const participantData = [
                    // 主催者を必須参加者として登録する
                    {
                        // 主催者の社員IDを設定する
                        employee_id: organizer.id,
                        // 会議IDを設定する
                        meeting_id: meeting.id,
                        // 必須として設定する
                        attendance_type: "required" as const,
                    },
                    // 必須参加者を作成
                    ...requiredEmails.map(
                        (email: string) => ({
                            // 社員IDを設定
                            employee_id:
                                employeeMap.get(email)!,
                            // 会議IDを設定
                            meeting_id: meeting.id,
                            // 必須として設定
                            attendance_type: "required" as const,
                        })
                    ),

                    // 任意参加者を作成
                    ...optionalEmails.map(
                        (email: string) => ({
                            // 社員IDを設定
                            employee_id:
                                employeeMap.get(email)!,
                            // 会議IDを設定
                            meeting_id: meeting.id,
                            // 任意として設定
                            attendance_type: "optional" as const,
                        })
                    ),
                ];

                // 参加者を一括登録
                await tx.meetingParticipant.createMany({
                    // 参加者データを登録
                    data: participantData,
                });

                // 会議作成に関するアクティビティをDBに登録する
                await tx.meetingActivity.create({
                    // DBに登録するデータを指定する
                    data: {
                        // 会議を作成した社員のIDを登録する
                        employee_id: organizer.id,
                        // 作成した会議のIDを登録する
                        meeting_id: meeting.id,
                        // 通知対象となる主催者と参加者の社員ID
                        notification_employee_ids: [
                            ...new Set([
                                organizer.id,
                                ...participantData.map(
                                    (participant) => participant.employee_id
                                ),
                            ]),
                        ],
                        // 新規作成なので、変更前の会議名は存在しない
                        old_meeting_title: null,
                        // 作成した会議の名前を登録する
                        meeting_title: meeting.title,
                        // 「会議を作成した」というアクションを登録する
                        action: "create",
                    },
                });

                // 登録した会議を返す
                return meeting;
            }
        );

        // 登録成功を返す
        return NextResponse.json(
            {
                // 成功メッセージを設定
                message: "会議を登録しました",
                // 登録した会議を返す
                meeting: result,
            },
            {
                // ステータス201を返す
                status: 201,
            }
        );
    } catch(error) {
        // エラーを出力
        console.error(error);

        // 登録失敗を返す
        return NextResponse.json(
            {
                // エラーメッセージを設定
                error: "会議の登録に失敗しました",
            },
            {
                // ステータス500を返す
                status: 500,
            }
        );
    }
}