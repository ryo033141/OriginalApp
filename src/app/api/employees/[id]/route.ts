// 共通化したPrismaClientを読み込む
import { prisma } from "@utils/prisma";
// NextResponseを読み込む
import { NextResponse } from "next/server";
// 共通ファイルから管理者権限チェック関数を読み込む
import { checkAdminPermission } from "@utils/checkAdminPermission";
// SupabaseのServer Clientを作成する関数を読み込む
import { createClient } from "@utils/supabase/server";
// Supabase Authのユーザーを管理者権限で操作するクライアントを読み込む
import { supabaseAdmin } from "@utils/supabase/admin";


// GETリクエストを受け取るAPI
export async function GET(request: Request,{params}: {params: Promise<{id: string}>}) {
    // 管理者権限を確認する関数を呼び出し、確認結果が返るまで待つ
    const permission = await checkAdminPermission();

    // 管理者権限がなく、処理が許可されていない場合に実行する
    if(!permission.allowed) {
        // エラーメッセージとHTTPステータスコードをJSON形式で返す
        return NextResponse.json(
            {
                // 権限チェック関数から返されたエラーメッセージを設定する
                message: permission.message,
            },
            {
                // 権限チェック関数から返されたHTTPステータスコードを設定する
                status: permission.status
            }
        );
    }

    try {
        // URLの社員番号を取得する
        const {id} = await params;
        // 社員情報を取得する
        const employee = await prisma.employee.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                department: true,
                position: true,
                employmentstatus: true,
                enrollmentstatus: true,
            },
        });

        // 社員が存在しない場合
        if(!employee) {
            return NextResponse.json(
                {
                    message: "社員情報が見つかりません。",
                },
                {
                    status: 404,
                }
            );
        }

        // 社員情報を返す
        return NextResponse.json(
            {
                employee,
            },
            {
                status: 200,
            }
        );
    } catch(error) {
        // エラー内容を表示する
        console.error(error);

        // エラーメッセージを返す
        return NextResponse.json(
            {
                message: "社員情報の取得に失敗しました。",
            },
            {
                status: 500,
            }
        );
    }
}

// PUTメソッドを定義する
export async function PUT(
    request: Request,
    {params}: {params: Promise<{id: string}>}
) {
    // 管理者権限を確認する関数を呼び出し、確認結果が返るまで待つ
    const permission = await checkAdminPermission();

    // 管理者権限がなく、処理が許可されていない場合に実行する
    if(!permission.allowed) {
        // エラーメッセージとHTTPステータスコードをJSON形式で返す
        return NextResponse.json(
            {
                // 権限チェック関数から返されたエラーメッセージを設定する
                message: permission.message,
            },
            {
                // 権限チェック関数から返されたHTTPステータスコードを設定する
                status: permission.status
            }
        );
    }

    try {
        // URLから社員番号を取得する
        const {id} = await params;
        // リクエストボディを取得する
        const body = await request.json();

        // 氏名が文字列ではない、または空文字の場合はエラーを返す
        if(typeof body.name !== "string" || body.name.trim() === "") {
            // 氏名未入力のエラーレスポンスを返す
            return NextResponse.json(
                {
                    message: "氏名を入力してください。"
                },
                {
                    status: 400
                }
            );
        }

        // メールアドレスが文字列ではない、または空文字の場合はエラーを返す
        if(typeof body.email !== "string" || body.email.trim() === "") {
            // 氏名未入力のエラーレスポンスを返す
            return NextResponse.json(
                {
                    message: "メールアドレスを入力してください。"
                },
                {
                    status: 400
                }
            );
        }

        // 所属部署が未選択の場合はエラーを返す
        if(body.department_id === undefined || body.department_id === null || body.department_id === "") {
            // 所属部署未選択のエラーレスポンスを返す
            return NextResponse.json(
                {
                    message: "所属部署を選択してください。"
                },
                {
                    status: 400
                }
            );
        }

        // 役職が未選択の場合はエラーを返す
        if(body.position_id === undefined || body.position_id === null || body.position_id === "") {
            // 役職未選択のエラーレスポンスを返す
            return NextResponse.json(
                {
                    message: "役職を選択してください。"
                },
                {
                    status: 400
                }
            );
        }

        // 雇用区分が未選択の場合はエラーを返す
        if(body.employee_status_id === undefined || body.employee_status_id === null || body.employee_status_id === "") {
            // 雇用区分未選択のエラーレスポンスを返す
            return NextResponse.json(
                {
                    message: "雇用区分を選択してください。"
                },
                {
                    status: 400
                }
            );
        }

        // 在籍区分が未選択の場合はエラーを返す
        if(body.enrollment_status_id === undefined || body.enrollment_status_id === null || body.enrollment_status_id === "") {
            // 在籍区分未選択のエラーレスポンスを返す
            return NextResponse.json(
                {
                    message: "在籍区分を選択してください。"
                },
                {
                    status: 400
                }
            );
        }

        // URLから取得した社員番号を数値に変換する
        const employeeId = Number(id);
        // 所属部署IDを数値に変換する
        const departmentId = Number(body.department_id);
        // 役職IDを数値に変換する
        const positionId = Number(body.position_id);
        // 雇用区分IDを数値に変換する
        const employeeStatusId = Number(body.employee_status_id);
        // 在籍区分IDを数値に変換する
        const enrollmentStatusId = Number(body.enrollment_status_id);
        // 更新対象の社員を社員番号から検索する
        const existingEmployee = await prisma.employee.findUnique({
            // 社員番号を検索条件に指定する
            where: {
                // 更新対象の社員番号を指定する
                id: employeeId,
            },
            // 更新前の在籍区分も取得する
            include: {
                enrollmentstatus: true,
            },
        });

        // 更新対象の社員が存在しない場合はエラーを返す
        if(!existingEmployee) {
            // 社員が存在しないエラーレスポンスを返す
            return NextResponse.json(
                {
                    message: "更新対象の社員が見つかりません。"
                },
                {
                    status: 404
                }
            );
        }

        // ログイン中のユーザーを取得する
        const supabase = await createClient();
        // Supabaseからログイン中のユーザー情報を取得する
        const {data,error} = await supabase.auth.getUser();
        
        // ログインしていない場合は更新を拒否する
        if(error || !data.user) {
            return NextResponse.json(
                {
                    message: "ログインしてください。",
                },
                {
                    status: 401,
                }
            );
        }

        // ログイン中のユーザーに紐づく社員情報を取得する
        const currentEmployee = await prisma.employee.findUnique({
            where: {
                // SupabaseのユーザーIDから社員情報を検索する
                auth_user_id: data.user.id,
            },
        });

        // ログイン中のユーザーに対応する社員情報がない場合は拒否する
        if(!currentEmployee) {
            return NextResponse.json(
                {
                    message: "ログイン中の社員情報を確認できません。",
                },
                {
                    status: 403,
                }
            );
        }

        // 自分自身の社員情報を更新しようとしている場合は拒否する
        if(currentEmployee.id === existingEmployee.id) {
            return NextResponse.json(
                {
                    message: "自分の社員情報は編集できません。",
                },
                {
                    status: 403,
                }
            );
        }

        // 自分以外の社員に同じメールアドレスが存在するか検索する
        const duplicateEmail = await prisma.employee.findFirst({
            // 検索条件を指定する
            where: {
                // 入力されたメールアドレスと一致する社員を検索する
                email: body.email.trim(),
                // 更新対象本人は重複チェックから除外する
                id: {
                    // 更新対象の社員番号とは異なる社員を対象にする
                    not: employeeId,
                },
            },
        });

        // 同じメールアドレスが存在する場合はエラーを返す
        if(duplicateEmail) {
            // 重複エラーのレスポンスを返す
            return NextResponse.json(
                {
                    message: "同じメールアドレスが既に存在します。"
                },
                {
                    status: 400
                }
            );
        }

        // 更新前の在籍区分が「在籍」かどうかを確認する
        const wasEnrolled = existingEmployee.enrollmentstatus.enrollment_status === "在籍";
        // 更新後に設定する在籍区分を、在籍区分テーブルから取得する
        const willBeEnrolled = await prisma.enrollmentStatus.findUnique({
            // フォームから受け取った在籍区分IDを検索条件に指定する
            where: {
                // 更新後の在籍区分IDを指定する
                id: enrollmentStatusId,
            },
        });

        // 指定された在籍区分が存在しなかった場合の処理
        if(!willBeEnrolled) {
            // エラーメッセージを含むレスポンスを返す
            return NextResponse.json(
                {
                    // 在籍区分が見つからなかったことを伝える
                    message: "指定された在籍区分が見つかりません。",
                },
                {
                    // リクエスト内容に問題があることを示すステータスコードを返す
                    status: 400,
                }
            );
        }

        // 更新後の在籍区分が「在籍」かどうかを確認する
        const isEnrolledAfterUpdate = willBeEnrolled.enrollment_status === "在籍";
        // 更新前に管理者で、在籍中だった社員が在籍以外になる場合は管理者権限を削除する
        const shouldRevokeAdmin = existingEmployee.admin_flag && 
            wasEnrolled &&
            !isEnrolledAfterUpdate;
        // 更新前が「在籍」で、更新後が「在籍以外」の場合だけ会議を整理する
        const shouldUpdateMeting = wasEnrolled && !isEnrolledAfterUpdate;
        // 在籍区分の変更に伴う会議整理が必要な場合だけUUIDを生成する
        const activityGroupId = shouldUpdateMeting ? crypto.randomUUID() : null;

        // 会議の整理と社員情報の更新を、1つのトランザクションで実行する
        const result = await prisma.$transaction(async (tx) => {
            // 会議から外した参加者の人数を初期値0で用意する
            let removedParticipantCount = 0;
            // 削除した会議の件数を初期値0で用意する
            let deletedMeetingCount = 0;

            // 「在籍」から別の区分へ変更された場合だけ、会議の整理を行う
            if(shouldUpdateMeting) {
                // 対象社員が主催している会議をすべて取得する
                const organizerdMeetings = await tx.meeting.findMany({
                    // 主催者の社員IDが対象社員と一致する会議を検索する
                    where: {
                        organizer_id: employeeId,
                    },
                    // 削除前の参加者情報も取得する
                    include: {
                        MeetingParticipants: {
                            select: {
                                employee_id: true,
                            },
                        },
                    },
                });

                // 対象社員が参加している、ほかの社員が主催する会議の参加情報を取得する
                const otherParticipants = await tx.meetingParticipant.findMany({
                    // 対象社員の参加情報に絞り込む
                    where: {
                        // 参加者の社員IDが対象社員と一致する
                        employee_id: employeeId,
                        // 会議の主催者が対象社員ではないことを条件にする
                        meeting: {
                            organizer_id: {
                                not: employeeId,
                            },
                        },
                    },

                    // 参加情報に加えて、会議と主催者、参加者の情報を取得する
                    include: {
                        meeting: {
                            // 会議に紐づく主催者情報と参加者情報を取得する
                            include: {
                                organizer: true,
                                MeetingParticipants: {
                                    select: {
                                        employee_id: true,
                                    },
                                },
                            },
                        },
                    },
                });

                // 対象社員を会議から外す前に、参加者更新の履歴を記録する
                for(const participation of otherParticipants) {
                    // 参加者の更新履歴をMeetingActivityテーブルに登録する
                    await tx.meetingActivity.create({
                        data: {
                            // 操作を行った管理者の社員IDを保存する
                            employee_id: currentEmployee.id,
                            // 操作を行った管理者の氏名を保存する
                            employee_name: currentEmployee.name,
                            // 対象となる会議のIDを保存する
                            meeting_id: participation.meeting_id,
                            // 同じ在籍区分変更で発生した履歴を識別するIDを保存する
                            activity_group_id: activityGroupId,
                            // 主催者と、変更前の参加者を通知対象として保存する
                            notification_employee_ids: [
                                ...new Set([
                                    participation.meeting.organizer_id,
                                    ...participation.meeting.MeetingParticipants.map(
                                        (participant) => participant.employee_id
                                    ),
                                ]),
                            ],
                            // 対象となる会議の名前を保存する
                            meeting_title: participation.meeting.title,
                            // 会議を主催している社員の氏名を保存する
                            organizer_name: participation.meeting.organizer.name,
                            // 参加者情報の更新操作として記録する
                            action: "update",
                        },
                    });
                }

                // 対象社員を、ほかの社員が主催する会議の参加者から削除する
                const removedParticipants = await tx.meetingParticipant.deleteMany({
                    // 削除対象の参加情報を条件で指定する
                    where: {
                        // 対象社員の参加情報に絞り込む
                        employee_id: employeeId,
                        // 対象社員自身が主催する会議は除外する
                        meeting: {
                            organizer_id: {
                                not: employeeId,
                            },
                        },
                    },
                });

                // 実際に削除された参加情報の件数を保存する
                removedParticipantCount = removedParticipants.count;
                // 参加者を外した会議のIDを配列から重複なしで取り出す
                const affectedMeetingIds = [
                    // Setを使って同じ会議IDが重複しないようにする
                    ...new Set(
                        // 取得しておいた参加情報から会議IDだけを取り出す
                        otherParticipants.map(
                            // 各参加情報の会議IDを返す
                            (participation) => participation.meeting_id,
                        )
                    ),
                ];

                // 参加者を外した会議を1件ずつ確認する
                for(const meetingId of affectedMeetingIds) {
                    // 対象の会議をIDで検索し、必要な情報を取得する
                    const meeting = await tx.meeting.findUnique({
                        // 検索する会議のIDを指定する
                        where: {
                            id: meetingId,
                        },
                        // 後続処理で必要な項目だけを取得する
                        select: {
                            // 会議IDを取得する
                            id: true,
                            // 会議名を取得する
                            title: true,
                            // 主催者の社員IDを取得する
                            organizer_id: true,
                            // 主催者の情報から氏名を取得する
                            organizer: {
                                select: {
                                    name: true,
                                },
                            },
                            // 参加者を通知対象として保存する
                            MeetingParticipants: {
                                select: {
                                    employee_id: true,
                                },
                            },
                        },
                    });

                    // 対象の会議が見つからなければ、この会議の確認を終了する
                    if(!meeting) {
                        // 次の会議の処理へ進む
                        continue;
                    }

                    // この会議に残っている「在籍中」の参加者数を数える
                    const activeParticipantCount = await tx.meetingParticipant.count({
                        // 対象の会議に紐づく参加情報だけを数える
                        where: {
                            meeting_id: meetingId,
                            // 主催者本人は参加者数に含めない
                            employee_id: {
                                not: meeting.organizer_id,
                            },
                            // 参加者の在籍区分が「在籍」であることを条件にする
                            employee: {
                                enrollmentstatus: {
                                    enrollment_status: "在籍",
                                },
                            },
                        },
                    });

                    // 在籍中の参加者が1人も残っていない場合は会議を削除する
                    if(activeParticipantCount === 0) {
                        // 会議を削除する前に、削除履歴を記録する
                        await tx.meetingActivity.create({
                            // 履歴として保存するデータを指定する
                            data: {
                                // 操作を行った管理者の社員IDを保存する
                                employee_id: currentEmployee.id,
                                // 操作を行った管理者の氏名を保存する
                                employee_name: currentEmployee.name,
                                // 削除対象となる会議のIDを保存する
                                meeting_id: meeting.id,
                                // 同じ在籍区分変更で発生した履歴を識別するIDを保存する
                                activity_group_id: activityGroupId,
                                // 削除前に取得した参加者一覧を通知対象として保存する
                                notification_employee_ids: [
                                    ...new Set([
                                        meeting.organizer_id,
                                        ...(otherParticipants.find(
                                            (participation) => participation.meeting_id === meetingId
                                        )?.meeting.MeetingParticipants.map(
                                            (participant) => participant.employee_id 
                                        ) ?? []),
                                    ]),
                                ],
                                // 削除対象となる会議の名前を保存する
                                meeting_title: meeting.title,
                                // 会議の主催者名を保存する
                                organizer_name: meeting.organizer.name,
                                // 会議の削除操作として記録する
                                action: "delete",
                            },
                        });

                        // 会議を削除する前に、紐づいている参加情報をすべて削除する
                        await tx.meetingParticipant.deleteMany({
                            // 削除対象の会議IDを指定する
                            where: {
                                meeting_id: meetingId,
                            },
                        });

                        // 参加情報を削除した後、会議本体を削除する
                        await tx.meeting.delete({
                            // 削除対象の会議IDを指定する
                            where: {
                                id: meetingId,
                            },
                        });

                        // 削除した会議の件数を1件加算する
                        deletedMeetingCount++;
                    }
                }

                // 対象社員が主催する会議を削除する前に、会議ごとの削除履歴を記録する
                for(const meeting of organizerdMeetings) {
                    // 主催会議の削除履歴をMeetingActivityテーブルに登録する
                    await tx.meetingActivity.create({
                        // 履歴として保存するデータを指定する
                        data: {
                            // 操作を行った管理者の社員IDを保存する
                            employee_id: currentEmployee.id,
                            // 操作を行った管理者の氏名を保存する
                            employee_name: currentEmployee.name,
                            // 削除対象となる会議のIDを保存する
                            meeting_id: meeting.id,
                            // 同じ在籍区分変更で発生した履歴を識別するIDを保存する
                            activity_group_id: activityGroupId,
                            // 削除前の参加者を通知対象として保存する
                            notification_employee_ids: [
                                ...new Set([
                                    meeting.organizer_id,
                                    ...meeting.MeetingParticipants.map(
                                        (participant) => participant.employee_id,
                                    ),
                                ]),
                            ],
                            // 削除対象となる会議の名前を保存する
                            meeting_title: meeting.title,
                            // 会議の主催者である対象社員の氏名を保存する
                            organizer_name: existingEmployee.name,
                            // 会議の削除操作として記録する
                            action: "delete",
                        },
                    });
                }

                // 対象社員が主催する会議に紐づく参加情報をすべて削除する
                await tx.meetingParticipant.deleteMany({
                    // 主催者が対象社員である会議の参加情報を指定する
                    where: {
                        meeting: {
                            organizer_id: employeeId,
                        },
                    },
                });

                // 対象社員が主催する会議をすべて削除する
                const deletedOrganizedMeetings = await tx.meeting.deleteMany({
                    // 主催者が対象社員である会議を削除対象にする
                    where: {
                        organizer_id: employeeId,
                    },
                });

                // 主催会議の削除件数を、削除した会議の合計に加える
                deletedMeetingCount += deletedOrganizedMeetings.count;
            }

            // 会議の整理が終わったら、社員情報をデータベースで更新する
            const employee = await tx.employee.update({
                // 更新対象の社員を社員番号で指定する
                where: {
                    id: employeeId,
                },
                // 更新する社員情報を指定する
                data: {
                    // 氏名を更新する
                    name: body.name.trim(),
                    // メールアドレスを更新する
                    email: body.email.trim(),
                    // 所属部署を更新する
                    department_id: departmentId,
                    // 役職を更新する
                    position_id: positionId,
                    // 雇用区分を更新する
                    employee_status_id: employeeStatusId,
                    // 在籍区分を更新する
                    enrollment_status_id: enrollmentStatusId,
                    // 条件を満たす場合は管理者権限を削除する
                    ...(shouldRevokeAdmin ? {admin_flag: false} :{}),
                },
            });

            // 社員情報と会議の整理結果を呼び出し元に返す
            return {
                // 更新後の社員情報を返す
                employee,
                // 削除した参加情報の件数を返す
                removedParticipantCount,
                // 削除した会議の件数を返す
                deletedMeetingCount,
                // 管理者権限を削除したかどうかを返す
                adminRevoked: shouldRevokeAdmin,
            };
        });

        // 更新成功のレスポンスを返す
        return NextResponse.json(
            {
                // 管理者権限を削除した場合は、その旨を通知する
                message: result.adminRevoked
                    ? `${result.employee.name}の管理者権限を削除しました`
                    : "社員情報の更新が完了しました。",
                // 更新後の社員情報を返す
                employee: result.employee,
                // 会議から外した参加者数を返す
                removedParticipantCount: result.removedParticipantCount,
                // 削除した会議数を返す
                deleteMeetingCount: result.deletedMeetingCount,
            },
            {
                // リクエストが正常に処理されたことを示す
                status: 200,
            }
        );
    } catch(error) {
        // エラー内容を表示する
        console.error(error);

        // エラーメッセージを返す
        return NextResponse.json(
            {
                message: "社員情報の更新に失敗しました。",
            },
            {
                status: 500,
            }
        );
    }
}

// DELETEリクエストを処理する関数
export async function DELETE(
    // リクエストの情報を受け取る
    request:  Request,
    // URLに含まれる社員IDを受け取る
    {params}: {params: Promise<{id: string}>}
) {
    // 管理者権限を確認する関数を呼び出し、確認結果が返るまで待つ
    const permission = await checkAdminPermission();

    // 管理者権限がなく、処理が許可されていない場合に実行する
    if(!permission.allowed) {
        // エラーメッセージとHTTPステータスコードをJSON形式で返す
        return NextResponse.json(
            {
                // 権限チェック関数から返されたエラーメッセージを設定する
                message: permission.message,
            },
            {
                // 権限チェック関数から返されたHTTPステータスコードを設定する
                status: permission.status
            }
        );
    }

    try {
        // URLから社員IDを取得する
        const {id} = await params;
        // 文字列で取得した社員IDを数値に変換する
        const employeeId = Number(id);

        // 社員IDが整数で、かつ1以上であるかを確認する
        if(!Number.isInteger(employeeId) || employeeId <= 0) {
            // IDが不正な場合は、400 Bad Requestを返して処理を終了する
            return NextResponse.json(
                {
                    // クライアントに返すエラーメッセージ
                    message: "社員IDが正しくありません。"
                },
                {
                    // リクエストの値が不正であることを示すHTTPステータス
                    status: 400
                }
            );
        }

        // Supabaseのサーバー用クライアントを作成する
        const supabase = await createClient();
        // 現在ログインしているユーザーの認証情報を取得する
        const {data,error} = await supabase.auth.getUser();

        // 認証情報を取得できなかった場合、または未ログインの場合は処理を終了する
        if(error || !data.user) {
            // ログインが必要であることをクライアントに返す
            return NextResponse.json(
                {
                    // エラーメッセージをJSON形式で返す
                    message: "ログインしてください。"
                },
                {
                    // HTTP 401は認証されていないことを示す
                    status: 401
                }
            );
        }

        // SupabaseのユーザーIDに紐づく社員情報を取得する
        const currentEmployee = await prisma.employee.findUnique({
            // auth_user_idが一致する社員を検索する
            where: {
                // ログインユーザーのSupabase IDを指定する
                auth_user_id: data.user.id,
            },
        });

        // ログインユーザーに紐づく社員情報が存在しない場合は処理を終了する
        if(!currentEmployee) {
            // 社員情報が確認できないことをクライアントに返す
            return NextResponse.json(
                {
                    // エラーメッセージをJSON形式で返す
                    message: "ログイン中の社員情報を確認できません。"
                },
                {
                    // HTTP 403はアクセスが許可されていないことを示す
                    status: 403
                }
            );
        }

        // 削除対象の社員を社員テーブルから取得する
        const targetEmployee = await prisma.employee.findUnique({
            // 社員テーブルのidがemployeeIdと一致するレコードを検索する
            where: {
                // URLから取得して数値に変換した社員IDを指定する
                id: employeeId,
            },
        });

        // 指定された社員が存在しない場合は処理を終了する
        if(!targetEmployee) {
            // 対象の社員が見つからないことをクライアントに返す
            return NextResponse.json(
                {
                    // エラーメッセージをJSON形式で返す
                    message: "削除対象の社員が見つかりません。"
                },
                {
                    // HTTP 404は対象のリソースが存在しないことを示す
                    status: 404
                }
            );
        }

        // 削除対象の社員に紐づくSupabase AuthのユーザーIDを取得する
        const targetAuthUseId = targetEmployee.auth_user_id;

        // 操作中の管理者自身を削除することを防ぐ
        if(currentEmployee.id === targetEmployee.id) {
            // 自分自身の社員情報は削除できないことをクライアントに返す
            return NextResponse.json(
                {
                    // エラーメッセージをJSON形式で返す
                    message: "自分の社員情報は削除できません。"
                },
                {
                    // HTTP 403は操作が許可されていないことを示す
                    status: 403
                }
            );
        }

        // データベースの処理をトランザクション内で実行する
        const result = await prisma.$transaction(async (tx) => {
            // 削除対象の社員が主催している会議を取得する
            const organizedMeetings = await tx.meeting.findMany({
                // 主催者の社員IDが削除対象の社員IDと一致する会議を検索する
                where: {
                    organizer_id: employeeId,
                },
                // 会議に紐づく参加者の社員IDも取得する
                include: {
                    // 会議の参加者一覧を取得する
                    MeetingParticipants: {
                        // 参加者情報から社員IDだけを取得する
                        select: {
                            // 参加者の社員IDを取得する
                            employee_id: true,
                        },
                    },
                },
            });

            // 削除対象の社員が参加している、ほかの社員主催の会議を取得する
            const otherParticipants = await tx.meetingParticipant.findMany({
                // 取得対象を絞り込む条件を指定する
                where: {
                    // 参加者の社員IDが削除対象の社員IDと一致する
                    employee_id: employeeId,
                    // 主催者が削除対象の社員とは異なる会議だけにする
                    meeting: {
                        organizer_id: {
                            // 削除対象の社員が主催する会議を除外する
                            not: employeeId,
                        },
                    },
                },
                // 参加している会議と、その主催者の情報も取得する
                include: {
                    // 参加している会議の情報を取得する
                    meeting: {
                        // 会議に紐づく主催者の社員情報を取得する
                        include: {
                            organizer: true,
                            // 会議の参加者一覧を取得する
                            MeetingParticipants: {
                                // 参加者情報から社員IDだけを取得する
                                select: {
                                    // 参加者の社員IDを取得する
                                    employee_id: true,
                                },
                            },
                        },
                    },
                },
            });

            // ほかの社員が主催する会議について、参加者削除の履歴を保存する
            for(const participation of otherParticipants) {
                // MeetingActivityテーブルに操作履歴を新規作成する
                await tx.meetingActivity.create({
                    // 保存する履歴の内容を指定する
                    data: {
                        // 操作を行った管理者の社員IDを保存する
                        employee_id: currentEmployee.id,
                        // 操作を行った管理者の名前を保存する
                        employee_name: currentEmployee.name,
                        // 参加者情報を変更する対象の会議IDを保存する
                        meeting_id: participation.meeting_id,
                        // 主催者と削除前の参加者の社員IDを通知対象として保存する
                        notification_employee_ids: [
                            // Setを使って重複する社員IDを除外する
                            ...new Set([
                                // 会議の主催者の社員IDを追加する
                                participation.meeting.organizer_id,
                                // 削除前の参加者全員の社員IDを追加する
                                ...participation.meeting.MeetingParticipants.map(
                                    // 各参加者から社員IDを取り出す
                                    (participant) => participant.employee_id,
                                ),
                            ]),
                        ],
                        // 対象の会議名を保存する
                        meeting_title: participation.meeting.title,
                        // 対象の会議を主催している社員の名前を保存する
                        organizer_name: participation.meeting.organizer.name,
                        // 操作内容が更新であることを記録する
                        action: "update",
                    },
                });
            }

            // 主催会議を削除する前に、会議ごとの削除履歴を記録する
            for(const meeting of organizedMeetings) {
                // 主催会議の削除履歴をMeetingActivityテーブルに登録する
                await tx.meetingActivity.create({
                    // 保存する履歴の内容を指定する
                    data: {
                        // 操作を行った管理者の社員IDを保存する
                        employee_id: currentEmployee.id,
                        // 操作を行った管理者の名前を保存する
                        employee_name: currentEmployee.name,
                        // 削除対象となる会議のIDを保存する
                        meeting_id: meeting.id,
                        // 削除前の主催者と参加者の社員IDを通知対象として保存する
                        notification_employee_ids: [
                            // Setを使って重複する社員IDを除外する
                            ...new Set([
                                // 会議の主催者の社員IDを追加する
                                meeting.organizer_id,
                                // 削除前の参加者全員の社員IDを追加する
                                ...meeting.MeetingParticipants.map(
                                    // 各参加者から社員IDを取り出す
                                    (participant) => participant.employee_id,
                                ),
                            ]),
                        ],
                        // 対象の会議名を保存する
                        meeting_title: meeting.title,
                        // 会議の主催者名を保存する
                        organizer_name: targetEmployee.name,
                        // 操作内容が削除であることを記録する
                        action: "delete",
                    },
                });
            }

            // 削除対象の社員が参加している、ほかの社員主催の会議から参加者情報を削除する
            const deletedParticipants = await tx.meetingParticipant.deleteMany({
                // 削除する参加者情報の条件を指定する
                where: {
                    // 削除対象の社員のIDを指定する
                    employee_id: employeeId,
                    // 削除対象の社員自身が主催する会議は除外する
                    meeting: {
                        organizer_id: {
                            not: employeeId,
                        },
                    },
                },
            });

            // 削除対象の社員が参加していた会議IDを重複しないように取得する
            const affectedMeetingIds = [
                ...new Set(
                    otherParticipants.map((participation) => participation.meeting_id)
                ),
            ];

            // 参加者情報の削除後、対象会議を1件ずつ確認する
            for(const meetingId of affectedMeetingIds) {
                // 対象会議の主催者以外で、残っている参加者数を取得する
                const remainingParticipantCount = await tx.meetingParticipant.count({
                    // 参加者数を数えるための検索条件を指定する
                    where: {
                        // 対象の会議IDと一致する参加者だけを対象にする
                        meeting_id: meetingId,
                        // 参加者の社員IDについて、主催者の社員IDとは異なる条件を指定する
                        employee_id: {
                            // 主催者の社員IDと一致する参加者を除外する
                            not: (
                                // 対象会議の情報をデータベースから取得する
                                await tx.meeting.findUniqueOrThrow({
                                    // 取得する会議をIDで指定する
                                    where: {
                                        // 対象の会議IDを検索条件に指定する
                                        id: meetingId,
                                    },
                                    // 取得する項目を主催者の社員IDだけに絞る
                                    select: {
                                        // 会議の主催者の社員IDを取得する
                                        organizer_id: true,
                                    },
                                    // 取得した会議情報から主催者の社員IDを取り出す
                                })
                            ).organizer_id,
                        },
                    },
                });

                console.log("会議ID:", meetingId);
                console.log("残りの参加者数:", remainingParticipantCount);

                // 参加者が0人の場合は、主催者だけが残っているため会議を削除する
                if(remainingParticipantCount === 0) {
                    // 削除する会議の情報を取得する
                    const meeting = await tx.meeting.findUnique({
                        // 削除対象の会議IDを指定する
                        where: {
                            id: meetingId,
                        },
                        // 履歴作成に必要な主催者と参加者の情報も取得する
                        include: {
                            // 主催者の社員情報を取得する
                            organizer: true,
                            // 削除前の参加者一覧を取得する
                            MeetingParticipants: {
                                select: {
                                    employee_id: true,
                                },
                            },
                        },
                    });

                    // 会議が存在する場合は削除履歴を登録する
                    if(meeting) {
                        // MeetingActivityに削除履歴を登録する
                        await tx.meetingActivity.create({
                            // 保存する履歴の内容を指定する
                            data: {
                                // 操作を行った管理者の社員IDを保存する
                                employee_id: currentEmployee.id,
                                // 操作を行った管理者の氏名を保存する
                                employee_name: currentEmployee.name,
                                // 削除対象の会議IDを保存する
                                meeting_id: meeting.id,
                                // 削除前の主催者と参加者の社員IDを通知対象として保存する
                                notification_employee_ids: [
                                    // Setを使って重複する社員IDを除外する
                                    ...new Set([
                                        // 主催者の社員IDを追加する
                                        meeting.organizer_id,
                                        // 削除前の参加者全員の社員IDを追加する
                                        ...meeting.MeetingParticipants.map(
                                            // 各参加者から社員IDを取り出す
                                            (participant) => participant.employee_id,
                                        ),
                                    ]),
                                ],                                
                                // 削除対象の会議名を保存する
                                meeting_title: meeting.title,
                                // 会議の主催者名を保存する
                                organizer_name: meeting.organizer.name,
                                // 操作内容を削除として記録する
                                action: "delete",
                            },
                        });
                    }

                    // 会議に紐づく参加者レコードをすべて削除する
                    await tx.meetingParticipant.deleteMany({
                        // 削除対象の会議IDを指定する
                        where: {
                            meeting_id: meetingId,
                        },
                    });

                    // 参加者レコードを削除した後に会議を削除する
                    await tx.meeting.delete({
                        // 削除対象の会議IDを指定する
                        where: {
                            id: meetingId,
                        },
                    });
                }
            }

            // 削除対象の社員が主催する会議の参加者データを削除する
            const deletedOrganizedMeetingParticipants = await tx.meetingParticipant.deleteMany({
                // 削除する参加者データの条件を指定する
                where: {
                    // 主催者の社員IDが削除対象の社員IDと一致する会議を対象にする
                    meeting: {
                        organizer_id: employeeId,
                    },
                },
            });

            // 削除対象の社員が主催している会議を削除する
            const deletedMeetings = await tx.meeting.deleteMany({
                // 削除する会議の条件を指定する
                where: {
                    // 主催者の社員IDが削除対象の社員IDと一致する会議に絞る
                    organizer_id: employeeId,
                }
            });

            // 削除対象の社員を社員テーブルから削除する
            const deletedEmployee = await tx.employee.delete({
                // 削除する社員を指定する
                where: {
                    // URLから取得した社員IDを指定する
                    id: employeeId,
                },
            });

            // 削除処理の結果を呼び出し元に返す
            return {
                // 削除した社員のID
                deletedEmployeeId: deletedEmployee.id,
                // 削除した社員の氏名
                deletedEmployeeName: deletedEmployee.name,
                // 削除した主催会議の件数
                deletedMeetingCount: deletedMeetings.count,
                // 削除した主催会議に紐づく参加データの件数
                deletedOrganizedMeetingParticipantCount: deletedOrganizedMeetingParticipants.count,
                // ほかの社員が主催する会議から削除した参加データの件数
                deletedParticipantCount: deletedParticipants.count,
            };
        });

        // Supabase Authのアカウント削除処理
        if(targetAuthUseId) {
            // Supabase Authのユーザーアカウントを削除する
            const {error: authDeleteError} = 
                await supabaseAdmin.auth.admin.deleteUser(targetAuthUseId);
            
            // Authアカウントの削除に失敗した場合
            if(authDeleteError) {
                // エラーの詳細をサーバー側のコンソールに出力する
                console.error(
                    "Supabase Authのユーザー削除に失敗しました。",
                    authDeleteError
                );
                
                // エラーレスポンスを返す
                return NextResponse.json(
                    {
                        message:
                            "社員情報は削除されましたが、ログインアカウントの削除に失敗しました。管理者に確認してください。",
                    },
                    {
                        status: 500,
                    }
                );
            }  
        }

        // 社員の削除が成功したことをレスポンスとして返す
        return NextResponse.json(
            {
                // 削除成功のメッセージ
                message: "社員情報の削除が完了しました。",
                // トランザクションから返された削除結果
                ...result,
            },
            {
                // HTTP 200はリクエストが成功したことを示す
                status: 200,
            }
        );
    } catch(error) {
        // エラーの詳細をサーバー側のコンソールに出力する
        console.error("社員削除APIでエラーが発生しました。", error);

        // エラーレスポンスをJSON形式で返す
        return NextResponse.json(
            {
                // クライアントに返すエラーメッセージ
                message: "社員情報の削除に失敗しました。",
            },
            {
                // HTTP 500はサーバー側でエラーが発生したことを示す
                status: 500,
            }
        );
    }
}
