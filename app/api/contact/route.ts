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

  const web3formsKey = process.env.WEB3FORMS_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Primary: Web3Forms email delivery
  if (web3formsKey && web3formsKey !== "your_key_here") {
    const formRes = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: web3formsKey,
        subject: `[삐뚜루 문의] ${type || "기타"}`,
        name: name?.trim() || "익명",
        email: email?.trim() || "없음",
        type: type || "기타",
        message: content.trim(),
      }),
    });
    if (!formRes.ok) {
      return NextResponse.json({ error: "전송 실패" }, { status: 500 });
    }
  } else if (supabaseUrl && serviceKey) {
    // Fallback: Supabase DB (requires contact_messages table to be created)
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
  } else {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  // Best-effort DB record (silent, won't block response)
  if (web3formsKey && web3formsKey !== "your_key_here" && supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    void admin.from("contact_messages").insert({
      name: name?.trim() || null,
      email: email?.trim() || null,
      type: type || "기타",
      content: content.trim(),
    });
  }

  return NextResponse.json({ ok: true });
}
