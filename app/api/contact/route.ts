import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, type, content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "문의 내용을 입력해주세요" },
      { status: 400 },
    );
  }

  const accessKey = process.env.WEB3FORMS_KEY;
  if (!accessKey) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `[삐뚜루 문의] ${type}`,
      from_name: name || "익명",
      reply_to: email || "",
      message: `이름: ${name || "미입력"}\n이메일: ${email || "미입력"}\n문의유형: ${type}\n\n${content}`,
    }),
  });

  const data = await res.json();
  if (!data.success) {
    return NextResponse.json({ error: "전송 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
