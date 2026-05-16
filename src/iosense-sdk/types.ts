export interface UNSNode {
  id: string;
  type: string;
  name?: string;
  path: string | null;
  parentId: string | null;
}

export interface SeriesSlot {
  from: number;
  to: number;
  label: string;
  value: number | null;
  quality: string;
  isPartial?: boolean;
}

export interface SeriesAggregation {
  operator: string;
  downscale: number;
  resolution: string;
}

export interface SeriesMeta {
  type: string;
  key: string;
  unit: string | null;
  dataPrecision: number | null;
  aggregation: SeriesAggregation;
  devID: string;
  sensor: string;
}

export interface SeriesPayload {
  __type: 'series';
  path: string;
  meta: SeriesMeta;
  range: { from: number; to: number };
  slots: SeriesSlot[];
}

export interface ScalarBinding { key: string; topic: string; }
export interface SeriesBinding  { key: string; topic: string; type: 'series'; }
export type BindingEntry = ScalarBinding | SeriesBinding;

export interface DataEntry {
  key: string;
  value: string | number | null | SeriesPayload;
}

export interface Duration {
  id: string;
  label?: string;
  x?: number;
  xPeriod: string; // "minute" | "hour" | "day" | "week" | "month" | "year"
}

export interface TimeConfig {
  timezone: string;
  type: 'local' | 'fixed' | string;
  startTime: number | null;
  endTime: number | null;
  defaultDurationId: string;
  allDurations: Duration[];
  defaultPeriodicity: 'minute' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export type WidgetEvent =
  | { type: 'TIME_CHANGE'; payload: { startTime: string; endTime: string; periodicity: string } }
  | { type: 'FILTER_CHANGE'; payload: Record<string, unknown> };

// ---------------------------------------------------------------------------
// WidgetTemplate — replace with your widget's config shape after init-widget.sh
// ---------------------------------------------------------------------------

export interface WidgetTemplateUIConfig {
  // Add your widget's render config fields here.
  // Example:
  //   title: string;
  //   variable: string;       // bindable — user types {{topic}}
  //   style: { card: { wrapInCard: boolean; bg: string } };
  style: {
    card: { wrapInCard: boolean; bg: string };
  };
}

export interface WidgetTemplateEnvelope {
  _id: string;
  type: 'WidgetTemplate';
  general: { title: string };
  timeConfig?: TimeConfig;
  uiConfig: WidgetTemplateUIConfig;
  dynamicBindingPathList: Array<BindingEntry>;
}
