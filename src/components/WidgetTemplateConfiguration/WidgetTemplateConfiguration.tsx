import { useState, useEffect, useRef } from 'react';
import { UNSPathInput } from '@faclon-labs/design-sdk/UNSPathInput';
import { WidgetTemplateEnvelope, WidgetTemplateUIConfig } from '../../iosense-sdk/types';
import { fetchUNSNodes } from '../../iosense-sdk/api';
import './WidgetTemplateConfiguration.css';

interface WidgetTemplateConfigurationProps {
  config: WidgetTemplateEnvelope | undefined;
  authentication?: string;
  onChange: (config: WidgetTemplateEnvelope) => void;
}

// UNS tree type — nested object where null = leaf (selectable node), {} = folder
type UNSTree = { [key: string]: UNSTree | null };

const VARIABLE_REGEX = /^\{\{(.+)\}\}$/;

function buildDynamicBindingPathList(uiConfig: unknown): Array<{ key: string; topic: string }> {
  const paths: Array<{ key: string; topic: string }> = [];

  function walk(obj: unknown, currentPath: string): void {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string') {
      const match = VARIABLE_REGEX.exec(obj.trim());
      if (match) paths.push({ key: currentPath, topic: match[1] });
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => walk(item, `${currentPath}[${index}]`));
      return;
    }
    if (typeof obj === 'object') {
      Object.entries(obj as Record<string, unknown>).forEach(([key, val]) => {
        walk(val, currentPath ? `${currentPath}.${key}` : key);
      });
    }
  }

  walk(uiConfig, '');
  return paths;
}

function buildEnvelope(
  existing: WidgetTemplateEnvelope | undefined,
  uiConfig: WidgetTemplateUIConfig,
): WidgetTemplateEnvelope {
  return {
    _id: existing?._id ?? `widget_${Date.now()}`,
    type: 'WidgetTemplate',
    general: existing?.general ?? { title: '' },
    uiConfig,
    dynamicBindingPathList: buildDynamicBindingPathList(uiConfig),
  };
}

export function WidgetTemplateConfiguration({
  config,
  authentication,
  onChange,
}: WidgetTemplateConfigurationProps) {
  const [wrapInCard, setWrapInCard] = useState<boolean>(
    config?.uiConfig.style.card.wrapInCard ?? true,
  );

  // ---------------------------------------------------------------------------
  // UNS tree — shared across all UNSPathInput fields in this configurator.
  // loadWorkspaces() on first open, loadWorkspaceNodes(name) on folder click.
  // Pass unsTree + isLoadingTree to every UNSPathInput; pipe onChange through resolveUNSValue().
  // See .claude/skills/UNSPathInput.md for the full pattern + copy-paste example.
  // ---------------------------------------------------------------------------
  const [unsTree, setUnsTree] = useState<UNSTree>({});
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);
  const workspaceMapRef = useRef<Record<string, string>>({});
  const fetchedWsRef = useRef<Set<string>>(new Set());
  const nodeMetaRef = useRef<Map<string, { wsId: string; nodePath: string }>>(new Map());

  // Sync state when an existing config is loaded
  useEffect(() => {
    if (config) {
      setWrapInCard(config.uiConfig.style.card.wrapInCard);
    }
  }, [config?._id]);

  async function loadWorkspaces() {
    if (!authentication || Object.keys(workspaceMapRef.current).length > 0) return;
    setIsLoadingTree(true);
    try {
      const nodes = await fetchUNSNodes(authentication, 'uns:_workspaces');
      const wsMap: Record<string, string> = {};
      for (const n of nodes) {
        if (n.type === 'Workspace' && n.name) wsMap[n.name] = n.id;
      }
      workspaceMapRef.current = wsMap;
      const tree: UNSTree = {};
      for (const name of Object.keys(wsMap)) tree[name] = {};
      setUnsTree(tree);
    } catch (err) {
      console.error('[UNS] workspace fetch failed:', err);
    } finally {
      setIsLoadingTree(false);
    }
  }

  async function loadWorkspaceNodes(wsName: string) {
    const wsId = workspaceMapRef.current[wsName];
    if (!wsId || !authentication || fetchedWsRef.current.has(wsName)) return;
    fetchedWsRef.current.add(wsName);
    try {
      const nodes = await fetchUNSNodes(authentication, `uns:${wsId}`, 'Operational');
      const children: UNSTree = {};
      for (const node of nodes) {
        if (!node.name) continue;
        const nodePath = node.path ?? node.name;
        children[node.name] = null;
        nodeMetaRef.current.set(`${wsName}/${node.name}`, { wsId, nodePath });
      }
      setUnsTree((prev) => ({ ...prev, [wsName]: children }));
    } catch (err) {
      console.error(`[UNS] node fetch failed for ${wsName}:`, err);
      fetchedWsRef.current.delete(wsName);
    }
  }

  function resolveUNSValue(rawValue: string): string {
    if (rawValue.startsWith('{{') && rawValue.endsWith('}}')) {
      const meta = nodeMetaRef.current.get(rawValue.slice(2, -2));
      if (meta) return `{{uns:${meta.wsId}://${meta.nodePath}}}`;
    }
    return rawValue;
  }

  function emit(overrides?: Partial<{ wrapInCard: boolean }>) {
    const resolved = {
      wrapInCard: overrides?.wrapInCard ?? wrapInCard,
    };

    const uiConfig: WidgetTemplateUIConfig = {
      // TODO: add your widget's config fields here and pass them in the uiConfig
      style: {
        card: { wrapInCard: resolved.wrapInCard, bg: '' },
      },
    };

    onChange(buildEnvelope(config, uiConfig));
  }

  return (
    <div className="wt-config">
      <div className="wt-config__header">
        <span className="wt-config__title LabelMediumDefault">WidgetTemplate</span>
      </div>

      <div className="wt-config__body">
        {/* TODO: replace these placeholder fields with your widget's actual config UI */}
        {/* Use design-sdk TextInput, Switch, SelectInput, Accordion, Tabs, etc. */}
        {/* Bindable fields → UNSPathInput (tree={unsTree} isLoading={isLoadingTree} onOpen/onFolderSelect/onChange already wired above) */}
        {/* Static fields → TextInput, Select, Switch, color picker, etc. */}
        {/* See .claude/skills/UNSPathInput.md for the copy-paste UNSPathInput block */}

        <div className="wt-config__field">
          <label className="LabelSmallDefault wt-config__label">Wrap in card</label>
          <input
            type="checkbox"
            checked={wrapInCard}
            onChange={(e) => {
              setWrapInCard(e.target.checked);
              emit({ wrapInCard: e.target.checked });
            }}
          />
        </div>

        <p className="wt-config__hint BodySmallRegular">
          Add your widget-specific config fields above. See Bindable.md for how to wire bindable
          fields to <code>{'{{topic}}'}</code> syntax.
        </p>
      </div>
    </div>
  );
}
