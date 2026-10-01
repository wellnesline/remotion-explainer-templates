// explainer theme system (色などの値はすべてサンプル。用途に合わせて差し替える)
//
// 範囲:
// - ThemeContext + useTheme() hook
// - documentary_serious 1 theme のみ token 化
// - KineticKeyword 1 component が theme tokens を参照
//
// theme.yaml と本 TS module の同期は手動。 将来 `scripts/gen_theme_tokens_ts.py` で
// theme.yaml → theme_tokens.ts を auto-gen 化予定。
import React, { createContext, useContext } from "react";

export type ThemeTokens = {
  color: {
    primary: string;
    accent_text: string;
    background: string;
    foreground: string;
    subtle_grey: string;
  };
  font_family_primary: string;
  font_family_secondary: string;
  font: {
    kinetic_serif_weight: number;
    subtitle_weight: number;
  };
  kinetic_max_widthunits: number;
  layout: {
    letterbox_height: number;
    subtitle_band_height: number;
    subtitle_bottom_offset: number;
  };
};

// theme.yaml の `documentary_serious` と同期 (theme.yaml は非同梱)
export const DOCUMENTARY_SERIOUS: ThemeTokens = {
  color: {
    primary: "#6B7C85",
    accent_text: "#A7B8C2",
    background: "#121212",
    foreground: "#F0F0F0",
    subtle_grey: "#8C8C8C",
  },
  font_family_primary: "Noto Serif CJK JP",
  font_family_secondary: "Noto Sans CJK JP",
  font: {
    kinetic_serif_weight: 700,
    subtitle_weight: 600,
  },
  kinetic_max_widthunits: 30,
  layout: {
    letterbox_height: 72,
    subtitle_band_height: 150,
    subtitle_bottom_offset: 96,
  },
};

// theme.yaml の `documentary_uplifting` と同期 (theme.yaml は非同梱)
export const DOCUMENTARY_UPLIFTING: ThemeTokens = {
  color: {
    primary: "#8A7F6B",            // サンプル(border / accent)
    accent_text: "#C9BFA8",        // サンプル
    background: "#14130F",          // 暗背景
    foreground: "#E3F2EF",          // 明るい前景(寒色寄りのオフホワイト)
    subtle_grey: "#85806F",         // subtle
  },
  font_family_primary: "Noto Serif CJK JP",
  font_family_secondary: "Noto Sans CJK JP",
  font: {
    kinetic_serif_weight: 700,
    subtitle_weight: 600,
  },
  kinetic_max_widthunits: 30,
  layout: {
    letterbox_height: 72,
    subtitle_band_height: 150,
    subtitle_bottom_offset: 96,
  },
};

const ThemeContext = createContext<ThemeTokens>(DOCUMENTARY_SERIOUS);

export const ThemeProvider: React.FC<{ value?: ThemeTokens; children: React.ReactNode }> = ({
  value,
  children,
}) => {
  return (
    <ThemeContext.Provider value={value ?? DOCUMENTARY_SERIOUS}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}

/**
 * design_template 名 → ThemeTokens を解決。
 * theme を追加するときは switch case を拡張する。
 */
export function resolveTheme(designTemplate: string | undefined | null): ThemeTokens {
  switch (designTemplate) {
    case "documentary_serious":
      return DOCUMENTARY_SERIOUS;
    case "documentary_uplifting":
      return DOCUMENTARY_UPLIFTING;
    case undefined:
    case null:
    case "":
      return DOCUMENTARY_SERIOUS;
    default:
      // eslint-disable-next-line no-console
      console.warn(
        `[theme] unknown design_template '${designTemplate}', fallback to documentary_serious`,
      );
      return DOCUMENTARY_SERIOUS;
  }
}
