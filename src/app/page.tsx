import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-5 text-[13px]">
          <Link href="/methodology" className="text-mist hover:text-charcoal">
            Methodology
          </Link>
          <Link href="/dashboard" className="bg-terracotta px-4 py-2 text-ivory">
            Explore Vehicle Intelligence
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="grid gap-10 border-t border-[rgba(52,48,46,0.1)] pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta">
              Vehicle retirement & environmental intelligence
            </p>
            <h1 className="font-display mt-4 text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.02] tracking-tight">
              Smarter vehicle decisions.
              <span className="block text-terracotta">Cleaner cities.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-charcoal/85">
              India does not have a shortage of ageing vehicles. It has a shortage of
              honest ways to decide which records deserve inspection first. Age is not a
              pollution measurement. RE-VOLVE turns available registration, fuel,
              Bharat Stage, PUC, and fitness evidence into an explainable inspection
              priority — and refuses to pretend that is a lab result.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="bg-terracotta px-5 py-2.5 text-sm text-ivory">
                Explore Vehicle Intelligence
              </Link>
              <Link
                href="/methodology"
                className="border border-[rgba(52,48,46,0.16)] bg-white px-5 py-2.5 text-sm"
              >
                View Methodology
              </Link>
            </div>
            <p className="mt-5 max-w-lg text-[12px] leading-relaxed text-mist">
              Software-only prototype for Amazon Environmental Hacks. No live VAHAN
              microdata, no hardware sensors, no claimed government API.
            </p>
          </div>
          <figure className="self-start">
            <img
              src="/images/fleet-street.jpg"
              alt="Mixed urban bus and vehicle traffic on a busy Indian street"
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="mt-2 text-[12px] leading-relaxed text-mist">
              A mixed urban fleet. Photograph of traffic, not a map of air quality.
              RE-VOLVE never infers a city’s PM2.5 from vehicle age.
            </figcaption>
          </figure>
        </section>

        <section className="mt-20 grid gap-10 border-t border-[rgba(52,48,46,0.1)] pt-10 md:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-mist">The problem</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight">
              Two vehicles of the same age can be entirely different environmental cases.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-charcoal/85">
              Fuel, type-approval generation, maintenance, duty cycle, fitness, and
              pollution-test history all matter. Treating every fifteen-year-old
              vehicle as a scrap candidate wastes inspection capacity and misses the
              records that actually failed a test.
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-mist">What this is not</p>
            <ul className="mt-3 grid gap-3 text-[15px] leading-relaxed">
              <li className="border-l-2 border-terracotta pl-4">
                Not a sensor network and not a live registration database.
              </li>
              <li className="border-l-2 border-sand pl-4">
                Not a ranking of cities by smog. Ambient air quality is a different dataset.
              </li>
              <li className="border-l-2 border-sand pl-4">
                Not an automatic end-of-life order. Fitness rules still require testing.
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-20 border-t border-[rgba(52,48,46,0.1)] pt-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mist">Four distinctions we keep</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              {
                t: "Measured emissions",
                d: "A documented PUC or lab reading. Rare in public files. Shown only when supplied.",
              },
              {
                t: "Regulatory non-compliance",
                d: "Expired fitness, expired PUC, a failed test. Status — not tonnes of pollutant.",
              },
              {
                t: "Estimated inspection risk",
                d: "A transparent 0–100 priority from available fields. Prototype bands, not law.",
              },
              {
                t: "Predicted / modelled",
                d: "Scenario coverage of priority points. Never converted into kg of PM2.5 or CO₂.",
              },
            ].map((item) => (
              <article key={item.t} className="revolve-card p-4">
                <h3 className="font-display text-xl">{item.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-mist">{item.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 grid gap-8 border-t border-[rgba(52,48,46,0.1)] pt-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-mist">How it works</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight">
              Evidence in. Explainable priority out.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-charcoal/85">
              Load the labelled synthetic demo, or import an anonymised CSV. Filters
              recompute every chart from the table. An individual assessment lists
              contributing points, missing fields, and a proportionate next step.
            </p>
          </div>
          <ol className="grid gap-0">
            {[
              "Ingest records without owner identity — synthetic demo or user CSV.",
              "Normalise fuel, category, and Bharat Stage; keep missing values missing.",
              "Score inspection priority with documented weights. Age is a weak prior.",
              "Simulate inspection-first vs replacement-first using a coverage proxy, not invented tonnes.",
            ].map((step, i) => (
              <li
                key={step}
                className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-t border-[rgba(52,48,46,0.08)] py-4"
              >
                <span className="font-display text-2xl text-terracotta">0{i + 1}</span>
                <span className="text-[15px] leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-20 grid gap-6 border-t border-[rgba(52,48,46,0.1)] pt-10 md:grid-cols-3">
          {[
            {
              t: "Environmental analysts",
              d: "See which combinations — not which rumours — concentrate inspection interest.",
            },
            {
              t: "Transport inspectors",
              d: "Queue failed tests, expired fitness, and incomplete files before blanket age raids.",
            },
            {
              t: "Policy & planning",
              d: "Compare a 5 / 10 / 20 percent inspection budget against a replacement-first sketch.",
            },
          ].map((item) => (
            <article key={item.t}>
              <h3 className="font-display text-2xl">{item.t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-mist">{item.d}</p>
            </article>
          ))}
        </section>

        <section className="mt-20 grid gap-8 border-t border-[rgba(52,48,46,0.1)] pt-10 md:grid-cols-2">
          <img
            src="/images/inspection-bay.jpg"
            alt="Vehicle raised on a lift during inspection"
            className="aspect-[16/10] w-full object-cover"
          />
          <div className="flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mist">Environmental value</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight">
              Inspection capacity is finite. Spend it where the evidence is.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-charcoal/85">
              The prototype’s claim is modest and useful: given the fields authorities
              already collect, some vehicle groups deserve attention first. That is how
              cleaner-city programmes avoid both theatre and paralysis.
            </p>
            <Link href="/dashboard" className="mt-6 inline-block text-sm text-terracotta underline decoration-coral">
              Open the dashboard with the synthetic demo fleet →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
