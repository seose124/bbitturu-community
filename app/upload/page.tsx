"use client";

import { FormEvent, useRef, useState } from "react";
import { Camera, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBbiduru } from "@/components/app-provider";
import { Page, TopBar } from "@/components/layout";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽을 수 없어요"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 처리할 수 없어요"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const router = useRouter();
  const { user, addChallenge, showToast } = useBbiduru();
  const [image, setImage] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [unreadable, setUnreadable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const valid = Boolean(image && (answer.trim() || unreadable));

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImage(await compressImage(file));
    } catch {
      showToast("이미지를 처리할 수 없어요");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid || submitting) return;
    if (!user) {
      showToast("로그인이 필요해요");
      router.push("/login");
      return;
    }
    setSubmitting(true);
    try {
      await addChallenge({
        imageData: image!,
        answer: unreadable ? "나도 못읽겠어요 🤷" : answer.trim(),
        hint: hint.trim() || undefined,
      });
      showToast("챌린지가 공개됐어요!");
      router.push("/");
    } catch {
      showToast("업로드에 실패했어요. 다시 시도해주세요.");
      setSubmitting(false);
    }
  };

  return (
    <Page className="white-page">
      <div className="page-column">
        <TopBar title="악필 업로드" backHref="/" />
        <form className="scroll-content upload-content" onSubmit={submit}>
          <div>
            <h1 className="page-heading">악필을 공개해봐요</h1>
            <p className="page-subtitle">판독단이 읽어드릴게요 😈</p>
          </div>

          <div className="field">
            <span>악필 사진 업로드</span>
            <label className="upload-image-area">
              {image ? (
                <img src={image} alt="악필 미리보기" className="upload-image-preview" />
              ) : (
                <div className="upload-image-placeholder">
                  <Camera size={30} />
                  <span>탭하여 사진 선택</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="upload-image-input"
              />
            </label>
            {image ? (
              <button
                type="button"
                className="button button-ghost button-small"
                onClick={() => {
                  setImage(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                다시 선택
              </button>
            ) : null}
          </div>

          <div className="field">
            <span>실제 정답</span>
            <input
              className="input"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                if (unreadable) setUnreadable(false);
              }}
              placeholder="올바른 텍스트를 입력하세요"
              disabled={unreadable}
              maxLength={50}
            />
            <button
              type="button"
              className={`button button-ghost button-small${unreadable ? " button-unreadable-active" : ""}`}
              onClick={() => {
                setUnreadable(!unreadable);
                setAnswer("");
              }}
            >
              나도 못읽겠어요 🤷
            </button>
          </div>

          <div className="field">
            <span>
              힌트&nbsp;<em className="field-optional">(선택)</em>
            </span>
            <input
              className="input"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="예: 총 5글자예요"
              maxLength={40}
            />
          </div>

          <button
            className="button button-primary upload-submit"
            type="submit"
            disabled={!valid || submitting}
          >
            <Rocket size={18} /> {submitting ? "업로드 중..." : "챌린지 공개하기"}
          </button>
        </form>
      </div>
    </Page>
  );
}
