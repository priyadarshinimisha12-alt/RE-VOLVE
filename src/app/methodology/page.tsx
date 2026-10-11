import { AppShell } from "@/components/AppShell";
import { DATA_SOURCES, METHOD_STEPS } from "@/lib/methodology-data";
import { architectureStatus } from "@/lib/aws";

export default function MethodologyPage() {
  const aws = architectureStatus();
  return (
    <AppShell>
      <div className="grid max-w-4xl gap-10">
        <header>
          <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta">Data sources & methodology</p>
          <h1 className="font-display mt-1 text-4xl tracking-tight">What we know, what we estimate, what we refuse to claim</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal/85">
            RE-VOLVE is a decision-support prototype. It helps identify vehicle
            populations that deserve environmental inspection first, using available
            evidence rather than the assumption that every old vehicle is highly polluting.
          </p>
        </header>

        <section>
          <h2 className="font-display text-3xl">Scoring model</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Inspection priority is a rules-based index from 0 to 100. Prototype bands:
            0–24 lower, 25–49 moderate, 50–74 elevated, 75–100 high. These are not
            official government classifications.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[10px] uppercase tracking-[0.12em] text-mist">
                <tr className="border-b border-[rgba(52,48,46,0.1)]">
                  <th className="py-2 pr-3">Factor</th>
                  <th className="py-2 pr-3">Max points</th>
                  <th className="py-2">Design choice</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Vehicle age", "16", "Weak prior. Two vehicles of equal age can score very differently."],
                  ["Bharat Stage", "22", "Primary technology generation marker — not an in-use gram/km rate."],
                  ["Fuel type", "10", "Typical pollutant profile only. Electric is not treated as a pollution event."],
                  ["Duty class", "8", "Commercial-duty utilisation, not an emission factor library."],
                  ["PUC / test status", "18", "Failed tests are treated as evidence of a test concern."],
                  ["Repeated failures", "10", "Down-weighted if the current test is already failed."],
                  ["Fitness", "10", "Expected for commercial duty and private vehicles ≥ 15 years."],
                  ["Annual usage", "8", "Kilometres are utilisation, not dynamometer results."],
                  ["Missing documents", "6", "Investigation weight. Missing ≠ maximum pollution."],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-[rgba(52,48,46,0.06)] align-top">
                    <td className="py-2 pr-3">{row[0]}</td>
                    <td className="py-2 pr-3 tabular">{row[1]}</td>
                    <td className="py-2 text-mist">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl">Process</h2>
          <ol className="mt-4 grid gap-4">
            {METHOD_STEPS.map((s) => (
              <li key={s.title} className="border-t border-[rgba(52,48,46,0.08)] pt-4">
                <h3 className="font-medium">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mist">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-3xl">Sources</h2>
          <div className="mt-4 grid gap-4">
            {DATA_SOURCES.map((s) => (
              <article key={s.name} className="revolve-card p-4">
                <h3 className="font-display text-xl">{s.name}</h3>
                <p className="text-[13px] text-mist">{s.publisher}</p>
                <p className="mt-2 text-sm">
                  <a className="text-terracotta underline" href={s.url} target="_blank" rel="noreferrer">
                    {s.url}
                  </a>
                </p>
                <dl className="mt-3 grid gap-1 text-[13px]">
                  <div>
                    <span className="text-mist">Fields: </span>
                    {s.fields}
                  </div>
                  <div>
                    <span className="text-mist">Coverage: </span>
                    {s.coverage}
                  </div>
                  <div>
                    <span className="text-mist">Accessed: </span>
                    {s.accessed}
                  </div>
                  <div>
                    <span className="text-mist">Licence / access: </span>
                    {s.license}
                  </div>
                  <div>
                    <span className="text-mist">Used as: </span>
                    {s.usedAs}
                  </div>
                  <div>
                    <span className="text-mist">API claim: </span>
                    {s.apiClaim}
                  </div>
                  <div>
                    <span className="text-mist">Limitation: </span>
                    {s.limitation}
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl">AWS architecture (modular)</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Runtime mode: <strong>{aws.mode}</strong>. The product runs fully without AWS
            credentials. Adapters keep the same seams for a later deploy.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[10px] uppercase tracking-[0.12em] text-mist">
                <tr className="border-b border-[rgba(52,48,46,0.1)]">
                  <th className="py-2 pr-3">Service</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {aws.components.map((c) => (
                  <tr key={c.service} className="border-b border-[rgba(52,48,46,0.06)] align-top">
                    <td className="py-2 pr-3">{c.service}</td>
                    <td className="py-2 pr-3">{c.role}</td>
                    <td className="py-2 pr-3">{c.status}</td>
                    <td className="py-2 text-mist">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl">Limitations</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-relaxed">
            <li>· Synthetic demo rows are labelled and are not a census of Indian vehicles.</li>
            <li>· No restricted government API is integrated.</li>
            <li>· Priority scores are not grams of CO₂, PM2.5, or NOx.</li>
            <li>· The map is schematic; it is not an air-quality surface.</li>
            <li>· Fitness and ELV law is simplified; always check current MoRTH notifications.</li>
            <li>· This is not an official government system.</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
