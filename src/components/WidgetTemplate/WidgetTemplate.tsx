import { Settings, Database } from 'react-feather';
import { DataEntry, WidgetEvent, WidgetTemplateUIConfig } from '../../iosense-sdk/types';
import './WidgetTemplate.css';

interface WidgetTemplateProps {
  config: WidgetTemplateUIConfig;
  data: DataEntry[];
  onEvent: (event: WidgetEvent) => void;
}

// TODO: implement this — return false when required config fields (e.g. a topic path) are not set.
function isConfigured(_config: WidgetTemplateUIConfig): boolean {
  return true;
}

// Read a bindable value: resolved data takes priority, config field is the fallback.
function getValue(key: string, config: unknown, data: DataEntry[]): string | number | null {
  const entry = data.find((d) => d.key === key);
  if (entry !== undefined) {
    const v = entry.value;
    // Series payloads are objects — callers must use getSeriesData() for series keys.
    if (v !== null && typeof v === 'object') return null;
    return v as string | number | null;
  }
  return getValueAtPath(config, key) as string | number | null;
}

function getValueAtPath(obj: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .reduce((acc: unknown, k) => (acc as Record<string, unknown>)?.[k], obj);
}

function NoConfigScreen() {
  return (
    <div className="widget-template widget-template__empty">
      <Settings size={28} className="widget-template__empty-icon" />
      <p className="widget-template__empty-title">Widget not configured</p>
      <p className="widget-template__empty-subtitle">Open the settings panel to configure this widget.</p>
    </div>
  );
}

function NoDataScreen() {
  return (
    <div className="widget-template widget-template__empty">
      <Database size={28} className="widget-template__empty-icon" />
      <p className="widget-template__empty-title">No data available</p>
      <p className="widget-template__empty-subtitle">The configured topic has not returned any data.</p>
    </div>
  );
}

export function WidgetTemplate({ config, data, onEvent }: WidgetTemplateProps) {
  if (!isConfigured(config)) {
    return <NoConfigScreen />;
  }

  if (data.length === 0) {
    return <NoDataScreen />;
  }

  // TODO: replace with your widget's render logic.
  // Use getValue('your.key', config, data) to read bindable values.
  // Call onEvent({ type: 'TIME_CHANGE', payload: { startTime, endTime, periodicity } })
  // or onEvent({ type: 'FILTER_CHANGE', payload: {} }) on user interactions.

  return (
    <div className="widget-template">
      <p className="widget-template__placeholder">
        WidgetTemplate — replace this with your widget render logic.
      </p>
      <pre className="widget-template__debug">
        {JSON.stringify({ config, data }, null, 2)}
      </pre>
    </div>
  );
}
