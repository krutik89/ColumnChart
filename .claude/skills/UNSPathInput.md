# UNSPathInput Skill

Read this before adding any UNS topic browsing field to a widget configurator.

**Triggers:** "add UNS topic", "add UNS field", "let user browse UNS nodes", "add variable with UNS support", "add UNSPathInput"

---

## What UNSPathInput Does

`UNSPathInput` (from `@faclon-labs/design-sdk/UNSPathInput`) is an input that works in two modes:

1. **Direct entry** — user types any string including `{{topic}}` syntax
2. **Tree browser** — user types `/` to open a dropdown of UNS workspaces → nodes

When the user selects a leaf node, `onChange` fires with `{{WorkspaceName/nodeName}}`. Call `resolveUNSValue()` to convert it to the canonical binding: `{{uns:wsId://nodePath}}`.

---

## onFolderSelect Patch (required — not in published SDK)

After every `npm install`, apply this one-time patch to:
```
node_modules/@faclon-labs/design-sdk/dist/components/product/UNSPathInput/UNSPathInput.js
```

**Change 1** — props destructuring (~line 33–36), add before `name: ot,`:
```js
onFolderSelect: ot2,
name: ot,
```

**Change 2** — folder-click handler `z` (~line 105–112), add after `u(e);`:
```js
ot2 && ot2(t.name, t.fullPath);
```

The result:
```js
), z = o(
  (t) => {
    if (s) return;
    k();
    const e = w.commitFolder(r, t.name);
    u(e);
    ot2 && ot2(t.name, t.fullPath);   // ← add this line
  },
  [s, w, r, u, k, ot2]               // ← add ot2 to deps
),
```

Also fix the TDZ bug in the same file if present (see git history of Gauge project for details).

---

## UNS Binding Value Format

```
{{uns:wsId://nodePath}}
```

Example: `{{uns:ws_abc123://plant1/line1/voltage}}`

`buildDynamicBindingPathList` extracts the inner string as the topic sent to `resolveAndCompute`.

---

## Code Already in WidgetTemplateConfiguration.tsx

The template configurator already contains all the UNS state, refs, and functions. They are ready to use — no changes needed to activate them.

**State + refs (already declared):**
```typescript
const [unsTree, setUnsTree] = useState<UNSTree>({});
const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);
const workspaceMapRef = useRef<Record<string, string>>({});   // wsName → wsId
const fetchedWsRef = useRef<Set<string>>(new Set());          // prevents duplicate fetches
const nodeMetaRef = useRef<Map<string, { wsId: string; nodePath: string }>>(new Map());
```

**Functions (already declared):**
- `loadWorkspaces()` — fetches `uns:_workspaces`, seeds tree with workspace folders. Call from `onOpen`.
- `loadWorkspaceNodes(wsName)` — fetches `uns:${wsId}` with `label=Operational`, populates children. Call from `onFolderSelect`.
- `resolveUNSValue(rawValue)` — transforms `{{WsName/node}}` → `{{uns:wsId://nodePath}}`. Call inside every `onChange`.

---

## Copy-Paste: Adding a UNSPathInput Field

For each bindable field in the configurator (variable, min, max, threshold, etc.):

**1. Add field state** (alongside other `useState` calls):
```typescript
const [myField, setMyField] = useState<string>('');
```

**2. Add to `emit()`** (in the overrides + uiConfig):
```typescript
function emit(overrides?: Partial<{ myField: string; ... }>) {
  const resolved = { myField: overrides?.myField ?? myField, ... };
  const uiConfig = { myField: resolved.myField, ... };
  onChange(buildEnvelope(config, uiConfig));
}
```

**3. Add to JSX**:
```tsx
<UNSPathInput
  label="My Field"
  placeholder="Type / to browse UNS or paste {{topic}} directly"
  value={myField}
  tree={unsTree}
  isLoading={isLoadingTree}
  onChange={(value: string) => {
    const resolved = resolveUNSValue(value);
    setMyField(resolved);
    emit({ myField: resolved });
  }}
  onOpen={() => loadWorkspaces()}
  onFolderSelect={(name: string) => loadWorkspaceNodes(name)}
/>
```

**4. Sync from prop** (in the `useEffect` that syncs config):
```typescript
useEffect(() => {
  if (config) {
    setMyField(config.uiConfig.myField ?? '');
    // ...other fields
  }
}, [config?._id]);
```

Multiple UNSPathInput fields in the same configurator share one `unsTree` — the same `onOpen`/`onFolderSelect` handlers work for all of them.

---

## Two-Step Lazy Fetch Flow

```
User types "/"
  → onOpen fires → loadWorkspaces()
    → GET /uns/nodes?graph=uns:_workspaces
      → seeds unsTree: { "WorkspaceA": {}, "WorkspaceB": {} }

User clicks "WorkspaceA"
  → onFolderSelect("WorkspaceA") fires → loadWorkspaceNodes("WorkspaceA")
    → GET /uns/nodes?graph=uns:ws_abc&label=Operational
      → updates unsTree: { "WorkspaceA": { "Sensor1": null, "Sensor2": null }, ... }

User clicks leaf "Sensor1"
  → onChange("{{WorkspaceA/Sensor1}}")
    → resolveUNSValue("{{WorkspaceA/Sensor1}}")
      → returns "{{uns:ws_abc://sensor1-path}}"
```

---

## Checklist

- [ ] `onFolderSelect` patch applied to `node_modules/...UNSPathInput.js`
- [ ] `tree={unsTree}` and `isLoading={isLoadingTree}` on every UNSPathInput
- [ ] `onOpen={() => loadWorkspaces()}` on every UNSPathInput
- [ ] `onFolderSelect={(name) => loadWorkspaceNodes(name)}` on every UNSPathInput
- [ ] Every `onChange` pipes value through `resolveUNSValue(value)` before storing
- [ ] Field state type is `string` (bindable fields are always strings — see Bindable.md)
- [ ] Field synced from prop in the `useEffect([config?._id])` block

---

## When to Use UNSPathInput vs TextInput

| Field type | Component |
|---|---|
| Data value, threshold, dynamic label — anything that can be `{{topic}}` | `UNSPathInput` |
| Unit, chart title, color, boolean, dropdown selection | `TextInput` / `Switch` / `SelectInput` |

See Bindable.md for the full bindable vs. non-bindable field classification.
