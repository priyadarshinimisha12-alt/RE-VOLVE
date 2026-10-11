import type { Filters } from "./types";
import { qs } from "./format";

export function filterQuery(f: Filters): string {
  return qs({
    state: f.state,
    rto: f.rto,
    category: f.category,
    fuel: f.fuel,
    emission: f.emission,
    fitness: f.fitness,
    puc: f.puc,
    source: f.source,
    yearFrom: f.yearFrom,
    yearTo: f.yearTo,
    ageBand: f.ageBand,
    q: f.q,
    flagged: f.flagged ? "1" : undefined,
  });
}
