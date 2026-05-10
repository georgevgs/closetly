# Closetly — Code Style

## Language & Platform
- ES6+ JavaScript / TypeScript only.
- Expo (React Native) for the app layer.
- Native iOS code follows Apple's official documentation and Human Interface Guidelines (Swift / SwiftUI conventions, naming, lifecycle).

## Readability First
- Code must read like prose. Optimize for the next person reading it, not for cleverness or line count.
- Names describe intent (`hasBackgroundRemoved`, not `bg`). No abbreviations unless they are domain-standard.
- **Full noun names everywhere** — including throwaway callback parameters, loop counters, catch params, and mutation-hook locals. No `s`, `i`, `c`, `it`, `n`, `w`, `d`, `a`, `b`, `lo`, `hi`, `qc`, `e`, `idx`. Examples:
  - `.map((suggestion) => …)` not `.map((s) => …)`
  - `(item) => item.id` not `(it) => it.id`
  - `(color, colorIndex) => …` not `(c, i) => …`
  - `clamp(value, low, high)` not `clamp(v, lo, hi)`
  - `const queryClient = useQueryClient()` not `const qc = useQueryClient()`
  - `} catch (error) {` not `} catch (e) {`

## Control Flow
- **Avoid ternaries.** Use `if` / `else` or early returns.
- **Avoid `||` for defaulting** (and avoid `??` chains used the same way). Use explicit `if` checks or a small helper.
- Prefer early returns over nested branches.
- One condition per `if`; extract compound conditions into a named boolean.

## Functions
- Extract complex inline logic into small **arrow helper functions** with descriptive names.
- A function does one thing. If it needs a comment to explain a section, that section is a new function.
- Keep functions short. If a callback grows past a few lines, lift it out and name it.

## Render Branches (React)
- **Never inline a `const renderX = () => …` arrow inside a component and call it from JSX.** When a render branch has its own filter / empty state / map, or grows past a few JSX lines, lift it to a real component in `src/features/<feature>/components/<Name>.tsx`.
- Screens should read as: hooks → handlers → composition. The actual JSX should be a small tree of named components, not a wall of inline conditionals.
- Conditional rendering with `&&` is fine for tiny one-line branches. Anything bigger becomes a component.

## File Organization
- Files stay focused and small. One responsibility per file.
- The same logic must not live in two places. If you need it twice, extract a utility.
- Shared helpers go in `src/lib/` or a feature-local `utils.ts` — never copy-paste.
- Group by feature (`src/features/<feature>/`), not by type.

## Utilities & Reuse
- Before writing a helper, search for an existing one.
- Utilities are pure where possible: input → output, no hidden state.
- Export named functions, not default exports, so refactors and grep stay honest.

## What Not To Do
- No ternaries (`a ? b : c`).
- No `||` / `??` as defaulting shortcuts in business logic.
- No single-letter or abbreviated identifiers, even in tiny callbacks.
- No inline `renderX = () => …` arrows inside components — extract to a named component file.
- No giant files mixing UI, data fetching, and business rules.
- No duplicated logic — extract.
- No clever one-liners that hide what they do.
- No comments explaining *what* the code does; the code should say it. Comments only for non-obvious *why*.
