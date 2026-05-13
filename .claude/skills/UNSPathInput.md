# UNSPathInput Skill

Read this before adding any UNS topic browsing field to a widget configurator.

**Triggers:** "add UNS topic", "add UNS field", "let user browse UNS nodes", "add variable with UNS support", "add UNSPathInput"

---

## What UNSPathInput Does

`UNSPathInput` (from `@faclon-labs/design-sdk/UNSPathInput`) works in two modes:

1. **Direct entry** — user types any string including `{{topic}}` syntax
2. **Tree browser** — user types `/` to open a dropdown of UNS workspaces → nodes

When the user selects a leaf node, `onChange` fires with `{{WorkspaceName/nodeName}}`.
Call `resolveUNSValue()` (from `useUNSTree`) to convert it to the canonical binding:
`{{uns:wsId://nodePath}}`.

---

## How It Works (no node_modules patch needed)

All UNS logic lives in `src/iosense-sdk/useUNSTree.ts`. It uses a two-level JavaScript Proxy
and a **module-level cache** shared across every widget on the page:

- **Workspaces**: fetched once on first `onOpen()`. If 10 widgets are open, only 1 request fires.
- **Nodes per workspace**: fetched lazily via `childProxy.ownKeys()` — fires automatically
  when UNSPathInput enumerates a workspace's children (user navigated into it). No
  `onFolderSelect` prop, no node_modules patching required.
- **Cache**: workspace list + node data persists at module scope. Widget B gets Widget A's
  already-fetched node data instantly.

---

## UNS Binding Value Format

```
{{uns:wsId://nodePath}}
```

Example: `{{uns:ws_abc123://plant1/line1/voltage}}`

`buildDynamicBindingPathList` extracts the inner string as the topic for `resolveAndCompute`.

---

## Step 1 — Import the hook (1 line)

```typescript
import { useUNSTree } from '../../iosense-sdk/useUNSTree';
```

---

## Step 2 — Call the hook (1 line, replaces ~65 lines of boilerplate)

Inside the configurator component, after other `useState` calls:

```typescript
const { unsTree, isLoadingTree, loadWorkspaces, resolveUNSValue } = useUNSTree(authentication);
```

---

## Copy-Paste: Adding a UNSPathInput Field

For each bindable field (variable, min, max, threshold, etc.):

**1. Add field state:**
```typescript
const [myField, setMyField] = useState<string>('');
```

**2. Add to `emit()`:**
```typescript
function emit(overrides?: Partial<{ myField: string }>) {
  const resolved = { myField: overrides?.myField ?? myField };
  const uiConfig = { myField: resolved.myField };
  onChange(buildEnvelope(config, uiConfig));
}
```

**3. Add to JSX:**
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
/>
```

**4. Sync from prop:**
```typescript
useEffect(() => {
  if (config) setMyField(config.uiConfig.myField ?? '');
}, [config?._id]);
```

Multiple UNSPathInput fields in the same configurator all share the same `useUNSTree` call.

---

## Lazy Fetch Flow

```
User types "/"
  → onOpen fires → loadWorkspaces()
    → GET /uns/nodes?graph=uns:_workspaces  (only 1 request across all widgets)
      → workspace names appear in dropdown

User clicks "WorkspaceA"
  → childProxy.ownKeys() fires automatically
    → GET /uns/nodes?graph=uns:ws_abc&label=Operational
      → "Sensor1", "Sensor2" appear in dropdown

User clicks leaf "Sensor1"
  → onChange("{{WorkspaceA/Sensor1}}")
    → resolveUNSValue("{{WorkspaceA/Sensor1}}")
      → returns "{{uns:ws_abc://sensor1-path}}"
```

---

## Checklist

- [ ] `import { useUNSTree } from '../../iosense-sdk/useUNSTree'` in configurator
- [ ] `const { unsTree, isLoadingTree, loadWorkspaces, resolveUNSValue } = useUNSTree(authentication)` inside component
- [ ] `tree={unsTree}` and `isLoading={isLoadingTree}` on every UNSPathInput
- [ ] `onOpen={() => loadWorkspaces()}` on every UNSPathInput
- [ ] Every `onChange` pipes through `resolveUNSValue(value)` before storing
- [ ] Field state type is `string` (bindable fields are always strings — see Bindable.md)
- [ ] Field synced from prop in `useEffect([config?._id])`
- [ ] NO `onFolderSelect` prop — proxy handles it automatically
- [ ] NO local refs (`workspaceMapRef`, `fetchedWsRef`, etc.) — all inside the hook
- [ ] NO `fetchUNSNodes` import in configurator — only the hook uses it

---

## TDZ Bug (some SDK versions)

If you see `ReferenceError: Cannot access 'i' before initialization` on mount, find the
`useEffect` inside UNSPathInput's source that references `i` (the isOpen state) and
ensure `const [i, f] = useState(false)` is declared above that `useEffect`. Bug is in the
SDK bundle, not your code.

---

## When to Use UNSPathInput vs TextInput

| Field | Component |
|---|---|
| Data value, threshold, dynamic label — anything that can be `{{topic}}` | `UNSPathInput` |
| Unit, title, color, boolean, selection | `TextInput` / `Switch` / `SelectInput` |

See Bindable.md for the full classification.
