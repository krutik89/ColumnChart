# IOsense Widget — Architecture Rules

Read the four skill files below **before touching any widget code**. They are the source of truth.

| Skill file | What it covers |
|---|---|
| `.claude/skills/Envelope.md` | Widget/configurator/mini-engine contract, envelope shape, DO/DON'T checklist |
| `.claude/skills/Bindable.md` | How `{{topic}}` bindings work, `buildDynamicBindingPathList` implementation |
| `.claude/skills/MiniEngine.md` | `resolve()` data pipeline, `resolveAndCompute` API, DataEntry contract |
| `.claude/skills/DevHarness.md` | `App.tsx` wiring, auth flow, console logs to expect |

---

## Non-Negotiable Rules

1. **Widget never fetches data** — all data arrives through the `data: DataEntry[]` prop from the mini-engine
2. **Envelope shape**: `{ _id, type, general, uiConfig, dynamicBindingPathList }` — **no `apiConfig`**
3. **Configurator always calls `buildDynamicBindingPathList(uiConfig)`** before emitting via `onChange()`
4. **One resolveAndCompute call** covers all bindings — no per-field fetch loops
5. **All UI uses `@faclon-labs/design-sdk`** components and CSS tokens — no custom components, no hardcoded colors or spacing

---

## Starting a New Widget

1. Run `./init-widget.sh YourWidgetName` — renames all `WidgetTemplate` placeholders
2. Add widget-specific types to `src/iosense-sdk/types.ts`
3. Implement the configurator in `src/components/YourWidgetNameConfiguration/`
4. Implement the widget renderer in `src/components/YourWidgetName/`
5. Run `npm start` — dev harness shows live preview at `http://localhost:3000`
6. Authenticate once: visit `http://localhost:3000/?token=<SSO_TOKEN>`
