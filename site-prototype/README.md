# PROTOTYPE — public page on Astro (throwaway)

Answers [Rough public page prototype on Astro](https://github.com/jloosli/ecclespark-info/issues/272):
how should the public page look and behave once rebuilt on EmDash?

Three variants on one route, switchable via `?variant=A|B|C`, plus fixture scenarios via
`?scenario=` and a clock override via `?now=` (all driven from the floating bar).

- No EmDash, no database: fixtures live in `src/fixtures.ts` and are placed relative to "now".
- Visibility rules from [Content model for Broadcasts and Announcements](https://github.com/jloosli/ecclespark-info/issues/270)
  are applied on the server per request (`src/visibility.ts`), as decided in
  [Keeping time-based visibility correct under EmDash route caching](https://github.com/jloosli/ecclespark-info/issues/275).
- Times render in `America/Denver` (an assumption: timezone display is still fog on the map).

Run: `cd site-prototype && npm install && npm run dev` then open http://localhost:4321/
