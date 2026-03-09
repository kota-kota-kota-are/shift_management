"use client";

import { useRef } from "react";

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  error?: string;
}

export function PinInput({ value, onChange, error }: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(4, "").slice(0, 4).split("");

  const handleChange = (index: number, char: string) => {
    // 数字のみ許可
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    const newPin = newDigits.join("").trim();
    onChange(newPin);

    // 次のボックスへ自動フォーカス
    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // 現在のボックスが空ならば前のボックスへ移動して消去
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join("").trim());
        inputRefs.current[index - 1]?.focus();
      } else {
        // 現在のボックスの値を消去
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join("").trim());
      }
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, 3);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] ? "\u25CF" : ""}
            onChange={(e) => handleChange(index, e.target.value.slice(-1))}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            className={`
              w-14 h-14
              text-center text-xl font-semibold
              bg-bg-tertiary rounded-lg
              border-none outline-none
              transition-all duration-fast
              focus:ring-2 focus:ring-system-blue/40
              caret-transparent
              ${error ? "ring-2 ring-system-red/40" : ""}
            `}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-system-red">{error}</p>
      )}
    </div>
  );
}
