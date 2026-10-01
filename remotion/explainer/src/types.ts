export type Line = {
  speech: string;
  caption: string;
};

export type SceneType =
  | "title_card"
  | "research_citation"
  | "concept_reveal"
  | "case_intro"
  | "case_data"
  | "case_quote"
  | "mechanism_term"
  | "summary"
  | "outro_fade";

export type Citation = {
  authors: string;
  year: string;
  publication?: string;
  label?: string;
};

export type CaseMeta = {
  label: string;
  subject: string;
  age?: number;
  occupation?: string;
};

export type DiagramMeta = {
  population?: string;
  variable_left?: string;
  variable_right?: string;
  relation?: string;
};

export type ConceptRevealMeta = {
  keyword: string;
  subtitle?: string;
  motif?: "stacked_arrows" | "spiral" | "split_arrows" | "cycle" | "none";
};

export type CaseDataStat = {
  label: string;
  value: string;
  unit?: string;
  emphasize?: boolean;
};

export type CaseDataMeta = {
  stats: CaseDataStat[];
  caption?: string;
};

export type CaseQuoteMeta = {
  text: string;
  attribution?: string;
};

export type MechanismTermMeta = {
  term: string;
  definition?: string;
  authors?: string;
  year?: string;
};

export type SummaryItem = {
  number: string;
  title: string;
  subtitle?: string;
};

export type SummaryMeta = {
  items: SummaryItem[];
};

export type OutroFadeMeta = {
  closing_keyword?: string;
  closing_subtitle?: string;
};

export type LineTiming = {
  line_idx: number;
  caption: string;
  speech: string;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
};

export type ImageSegment = {
  from_line_idx: number;
  image: string;
};

export type CentralBlock = {
  from_line_idx: number;
  type:
    | "kinetic_keyword"
    | "number_counter"
    | "phone_mockup"
    | "mock_sns_feed"
    | "notification_cascade"
    | "clock_timer"
    | "chart_bar"
    | "comparison_split"
    | "silhouette_group"
    | "brain_network"
    | "calendar_grid"
    | "spotlight_reveal"
    | "text_highlight"
    | "particle_explosion"
    | "pulsing_figure"
    | "image_callout"
    // round 3.2  — 追加の演出 type 8 種
    | "year_stamp"
    | "quote_frame"
    | "statistic_ticker"
    | "word_dissolve"
    | "timeline_progression"
    | "photo_montage"
    | "document_zoom"
    | "brain_heatmap"
    // round 3.3  — Tier 1+2+3 = 10 新規 type
    | "mirror_split"
    | "day_clock"
    | "fading_contacts"
    | "crowd_anonymous"
    | "overlay_words"
    | "text_typewriter"
    | "era_transition"
    | "zoom_into_eye"
    | "receipt_scroll"
    | "heartbeat_pulse";
  // kinetic_keyword
  text?: string;
  subtitle?: string;
  // number_counter
  number_from?: number;
  number_to?: number;
  unit?: string;
  label?: string;
  emphasize?: boolean;
  prefix?: string;
  // phone_mockup
  phone_content?: "sns_feed" | "notifications" | "blank";
  timer_label?: string;
  // mock_sns_feed (also used inside phone)
  posts?: number;
  scroll_speed?: number;
  // notification_cascade
  notification_count?: number;
  // clock_timer
  clock_hours?: number;
  clock_minutes?: number;
  clock_label?: string;
  // chart_bar
  chart_data?: { label: string; value: number; emphasize?: boolean }[];
  chart_direction?: "up" | "down";
  chart_max?: number;
  // comparison_split
  left_label?: string;
  left_value?: string;
  right_label?: string;
  right_value?: string;
  right_emphasize?: boolean;
  // silhouette_group
  silhouette_variant?: "downward" | "upward" | "left_behind" | "tribe" | "row" | "comparison";
  // calendar_grid
  marked_days?: number[];
  calendar_label?: string;
  // spotlight_reveal
  reveal_text?: string;
  reveal_subtext?: string;
  // text_highlight (sequential word reveal)
  highlight_words?: string[]; // ordered words/phrases to highlight in sequence
  // particle_explosion
  explosion_color?: "red" | "white" | "gold";
  explosion_label?: string;
  // pulsing_figure
  figure_subject?: "female" | "male" | "neutral";
  figure_glow?: boolean;
  figure_orbits?: string[]; // small SNS-like icon labels orbiting (text only, no emoji)
  // image_callout
  callout_image?: string; // path under public/
  callout_caption?: string;
  callout_kenburns?: boolean;
  // round 3.2: 8 新規 type のフィールド
  // year_stamp
  year_text?: string;       // 例: "2000"
  year_subtext?: string;    // 例: "Journal Name"
  // quote_frame
  quote_text?: string;      // 例: "サンプルの引用文"
  quote_attribution?: string;  // 例: "— 出典の例"
  // statistic_ticker
  ticker_items?: string[];  // 例: ["100 回", "5 割", "20 万円", "3 年"]
  // word_dissolve
  dissolve_word?: string;   // 例: "キーワード"
  dissolve_subtitle?: string;
  // timeline_progression
  timeline_points?: { label: string; marker?: string }[];  // age waypoints
  current_index?: number;   // 0-based, focused point
  // photo_montage
  montage_images?: string[];  // public/-relative paths
  montage_speed?: number;   // sec per image, default 1.5
  // document_zoom
  document_image?: string;  // public/-relative path
  document_highlight_bbox?: { x: number; y: number; w: number; h: number };  // % of image
  document_caption?: string;
  // brain_heatmap
  heatmap_intensity_curve?: number[];  // 例: [1.0, 0.7, 0.4, 0.1]
  // round 3.3: Tier 1+2+3 = 10 新規 type
  // mirror_split
  mirror_left_image?: string;
  mirror_right_image?: string;
  mirror_left_label?: string;
  mirror_right_label?: string;
  // day_clock
  day_clock_active_hours?: number[];  // 例: [18,19,20,21,22,23,0,1,2,3,4]
  day_clock_label?: string;
  day_clock_subtitle?: string;
  // fading_contacts
  contacts_names?: string[];
  contacts_label?: string;
  // crowd_anonymous
  crowd_count?: number;  // default 12
  crowd_label?: string;
  // overlay_words
  overlay_words?: string[];
  overlay_circle_label?: string;
  // text_typewriter
  typewriter_text?: string;
  typewriter_attribution?: string;
  typewriter_speed?: number;  // chars/sec, default 8
  // era_transition
  era_years?: { year: string; label?: string }[];
  era_current_index?: number;
  // zoom_into_eye
  eye_image?: string;
  eye_zoom_target?: string;
  // receipt_scroll
  receipt_lines?: { date?: string; item: string; amount?: string }[];
  receipt_title?: string;
  receipt_total?: string;
  // heartbeat_pulse
  heartbeat_bpm_curve?: number[];
  heartbeat_label?: string;
};

export type LineOverlay = {
  line_idx: number;
  type: "term_highlight" | "number_callout" | "year_badge" | "quote_frame" | "icon_text" | "list_reveal";
  // term_highlight / icon_text
  text?: string;
  icon?: string;
  // number_callout
  number?: string;
  unit?: string;
  label?: string;
  emphasize?: boolean;
  // year_badge
  year?: string;
  author?: string;
  // quote_frame
  quote?: string;
  attribution?: string;
  // list_reveal
  items?: string[];
  // position override
  position?: "top_left" | "top_center" | "top_right" | "center_left" | "center" | "center_right" | "bottom_center";
};

export type Slide = {
  title: string;
  scene_type: SceneType;
  lines: Line[];
  slide_prompt?: string;
  citation?: Citation;
  case?: CaseMeta;
  diagram?: DiagramMeta;
  concept?: ConceptRevealMeta;
  case_data?: CaseDataMeta;
  quote?: CaseQuoteMeta;
  mechanism?: MechanismTermMeta;
  summary?: SummaryMeta;
  outro?: OutroFadeMeta;
  bg_image?: string;
  image_track?: ImageSegment[]; // per-section bg image swap segments
  line_overlays?: LineOverlay[]; // per-line micro-overlays (callouts, highlights, etc.)
  central_track?: CentralBlock[]; // per-phrase-block dynamic center depictions (~3 lines per block)
  duration_sec?: number;
  section_audio?: string;       // path to section mp3 (relative to public/)
  section_timing?: LineTiming[]; // per-line start/end_sec from ElevenLabs alignment
};

export type SlidesPayload = {
  title: string;
  voice?: string;
  slides: Array<Slide | string>;
};
