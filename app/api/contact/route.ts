import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { name, email, type, content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "문의 내용을 입력해주세요" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin.from("contact_messages").insert({
    name: name?.trim() || null,
    email: email?.trim() || null,
    type: type || "기타",
    content: content.trim(),
  });

  if (error) {
    return NextResponse.json({ error: "전송 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
