"use client";

import type { AssessmentResult } from "@/lib/types";
import { PriorityBadge } from "./PriorityBadge";

export function ScoreRing({ score, category }: { score: number; category: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color =
    score >= 75 ? "#B5442E" : score >= 50 ? "#C7654A" : score >= 25 ? "#C4A574" : "#8B8580";
  return (
    <div className="flex items-center gap-5">
      <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#E9DFD2" strokeWidth="8" />
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="butt"
          transform="rotate(-90 56 56)"
        />
        <text
          x="56"
          y="52"
          textAnchor="middle"
          className="font-display"
          fill="#34302E"
          fontSize="26"
        >
          {score}
        </text>
        <text x="56" y="70" textAnchor="middle" fill="#8B8580" fontSize="9">
          / 100
        </text>
      </svg>
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-mist">Inspection priority</p>
        <div className="mt-2">
          <PriorityBadge category={category} />
        </div>
        <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-mist">
          Prototype band, not an official class. Not a measurement of tailpipe grams.
        </p>
      </div>
    </div>
  );
}

export function ScorePanel({ result }: { result: AssessmentResult }) {
  return (
    <div className="grid gap-6">
      <ScoreRing score={result.score} category={result.category} />
      <p className="text-[13px] leading-relaxed text-charcoal">{result.rationale}</p>
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-mist">Recommended next step</p>
        <p className="font-display mt-1 text-xl text-terracotta">{result.recommendedNextStep}</p>
      </div>
      <div className="grid gap-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-mist">Contributing factors</p>
        {result.factors.map((f) => (
          <div key={f.key} className="border border-[rgba(52,48,46,0.08)] bg-ivory px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="font-medium">{f.label}</span>
              <span className="tabular text-mist">
                {f.points} / {f.maxPoints}
              </span>
            </div>
            <div className="mt-1.5 h-1 bg-sand">
              <div
                className="h-1 bg-terracotta"
                style={{ width: `${(f.points / f.maxPoints) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-mist">{f.evidence}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-mist">Evidence available</p>
          <ul className="mt-2 grid gap-1 text-[13px] text-charcoal">
            {result.evidence.length ? result.evidence.map((e) => <li key={e}>· {e}</li>) : <li>None beyond empty fields.</li>}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-mist">Missing information</p>
          <ul className="mt-2 grid gap-1 text-[13px] text-charcoal">
            {result.missing.length ? result.missing.map((e) => <li key={e}>· {e}</li>) : <li>No critical gaps listed.</li>}
          </ul>
        </div>
      </div>
      <p className="text-[12px] text-mist">
        Data quality {result.dataQualityScore}/100 · confidence {result.confidenceLabel}
        {result.actualEmissionsKnown
          ? " · test readings present (that test only)"
          : " · actual emissions remain unknown"}
      </p>
      <ul className="grid gap-1 text-[12px] text-mist">
        {result.caveats.map((c) => (
          <li key={c}>— {c}</li>
        ))}
      </ul>

      {/* Machine Learning Model Integration */}
      <div className="border-t border-[rgba(52,48,46,0.1)] pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-terracotta font-semibold">
            Machine Learning Classifier · Decision Support
          </p>
          <span className="text-[11px] text-mist">RandomForest (100 trees)</span>
        </div>

        {result.mlPrediction && result.mlPrediction.status === "success" ? (
          <div className="mt-3 grid gap-3 bg-ivory/60 p-3 border border-[rgba(52,48,46,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-mist">ML Predicted Category:</span>
                <PriorityBadge category={result.mlPrediction.predictedCategory} />
              </div>
              <span className="text-[12px] tabular text-charcoal font-medium">
                Confidence: {Math.round(result.mlPrediction.confidence * 100)}%
              </span>
            </div>

            {result.mlPrediction.probabilities && (
              <div className="grid gap-1.5 pt-1">
                <p className="text-[10px] uppercase tracking-[0.14em] text-mist">
                  Class Probabilities
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(result.mlPrediction.probabilities).map(([cat, prob]) => (
                    <div key={cat} className="bg-sand/30 p-2 text-[11px]">
                      <div className="flex justify-between text-mist">
                        <span className="truncate">{cat.replace(" priority", "")}</span>
                        <span className="tabular font-medium text-charcoal">
                          {Math.round(prob * 100)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1 bg-sand/60">
                        <div
                          className="h-1 bg-terracotta"
                          style={{ width: `${Math.round(prob * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-mist">
              <strong>Ethical Notice:</strong> This model is an empirical rule-imitation prototype
              trained on 1,100 vehicle records. It predicts policy review band, not tailpipe grams or
              air quality.
            </p>
          </div>
        ) : (
          <div className="mt-2 bg-ivory/40 p-2.5 text-[11px] text-mist border border-dashed border-[rgba(52,48,46,0.1)]">
            <p>
              ML inference service offline. Assessment relies entirely on the primary deterministic
              scoring policy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
