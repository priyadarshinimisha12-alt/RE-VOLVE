"use client";

import { useState } from "react";
import { DEMO_QUESTIONS } from "@/lib/constants";
import { Banner, Button, Panel, Textarea } from "./ui";

type Answer = {
  question: string;
  answer: string;
  bullets: string[];
  usedRecords: number;
  refused: boolean;
};

export function AssistantView() {
  const [question, setQuestion] = useState(DEMO_QUESTIONS[0]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to answer");
      return;
    }
    setAnswer(data as Answer);
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">Dataset assistant</p>
        <h1 className="font-display mt-1 text-4xl tracking-tight">Questions the loaded file can actually answer</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          This is not a general chatbot. Answers are computed from the current
          database and the published methodology. Invented statistics are refused.
        </p>
      </header>
      <Banner>
        Amazon Bedrock is not connected in local demo mode. The assistant is a
        deterministic layer over the same queries the dashboard uses.
      </Banner>
      <Panel title="Ask">
        <div className="flex flex-wrap gap-2">
          {DEMO_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="border border-[rgba(52,48,46,0.12)] bg-ivory px-3 py-1.5 text-left text-[12px] hover:bg-sand"
              onClick={() => setQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>
        <Button className="mt-3" onClick={() => void ask(question)} disabled={busy || !question.trim()}>
          {busy ? "Computing…" : "Answer from data"}
        </Button>
        {error ? <p className="mt-3 text-sm text-alert">{error}</p> : null}
      </Panel>
      {answer ? (
        <Panel title={answer.refused ? "Declined or bounded" : "Answer"}>
          <p className="text-sm leading-relaxed">{answer.answer}</p>
          <ul className="mt-4 grid gap-2 text-sm">
            {answer.bullets.map((b) => (
              <li key={b} className="border-l-2 border-terracotta pl-3">
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-mist">Computed on {answer.usedRecords} loaded records.</p>
        </Panel>
      ) : null}
    </div>
  );
}
