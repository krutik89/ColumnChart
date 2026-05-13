import { useState, useEffect } from 'react';
import { UNSPathInput } from '@faclon-labs/design-sdk/UNSPathInput';
import { WidgetTemplateEnvelope, WidgetTemplateUIConfig } from '../../iosense-sdk/types';
import { useUNSTree } from '../../iosense-sdk/useUNSTree';
import './WidgetTemplateConfiguration.css';

interface WidgetTemplateConfigurationProps {
  config: WidgetTemplateEnvelope | undefined;
  authentication?: string;
  onChange: (config: WidgetTemplateEnvelope) => void;
}

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

  // UNS tree — see src/iosense-sdk/useUNSTree.ts
  const { unsTree, isLoadingTree, loadWorkspaces, resolveUNSValue } = useUNSTree(authentication);

  // Sync state when an existing config is loaded
  useEffect(() => {
    if (config) {
      setWrapInCard(config.uiConfig.style.card.wrapInCard);
    }
  }, [config?._id]);

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
        {/* Bindable fields → UNSPathInput. See .claude/skills/UNSPathInput.md for copy-paste block. */}
        {/* Example:
          <UNSPathInput
            label="Variable"
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
        */}
        {/* Static fields → TextInput, Select, Switch, color picker, etc. */}

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
