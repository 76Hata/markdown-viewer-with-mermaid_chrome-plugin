/**
 * Markdown Viewer Chrome Extension - Constants
 *
 * アプリケーション全体で使用される定数値を定義
 * マジックナンバーの使用を避け、保守性を向上させる
 */

// ===========================================
// タイミング関連の定数
// ===========================================

/** タイムアウト関連 */
const TIMEOUTS = {
  /** 短い遅延（アニメーション等） */
  SHORT_DELAY: 100,

  /** 標準的な遅延 */
  STANDARD_DELAY: 300,

  /** 長い遅延（API呼び出し等） */
  LONG_DELAY: 500,

  /** 非常に長い遅延（重い処理等） */
  VERY_LONG_DELAY: 1000,

  /** ネットワークタイムアウト */
  NETWORK_TIMEOUT: 3000,

  /** 重い処理のタイムアウト */
  HEAVY_PROCESS_TIMEOUT: 5000,

  /** 最大タイムアウト */
  MAX_TIMEOUT: 10000,

  /** 通知の表示時間 */
  NOTIFICATION_DURATION: 3000,

  /** デバウンス用の短い遅延 */
  DEBOUNCE_SHORT: 200,

  /** デバウンス用の標準遅延 */
  DEBOUNCE_STANDARD: 500,

  /** ファイルアクセスチェックの間隔 */
  FILE_ACCESS_CHECK_INTERVAL: 2000,
};

/** インターバル関連 */
const INTERVALS = {
  /** UI更新の間隔 */
  UI_UPDATE: 100,

  /** 状態チェックの間隔 */
  STATUS_CHECK: 500,

  /** 定期処理の間隔 */
  PERIODIC_PROCESS: 1000,

  /** 重い処理の間隔 */
  HEAVY_PROCESS: 5000,

  /** 最大インターバル */
  MAX_INTERVAL: 10000,
};

// ===========================================
// サイズ・寸法関連の定数
// ===========================================

/** サイズ関連 */
const SIZES = {
  /** 小さいサイズ */
  SMALL: 50,

  /** 中サイズ */
  MEDIUM: 100,

  /** 大サイズ */
  LARGE: 200,

  /** 検索結果の最大表示数 */
  MAX_SEARCH_RESULTS: 100,

  /** TOCの最大表示項目数 */
  MAX_TOC_ITEMS: 1000,

  /** アニメーション用の小さな値 */
  ANIMATION_OFFSET: 19,

  /** スクロール用のオフセット */
  SCROLL_OFFSET: 40,

  /** マージン・パディング */
  MARGIN_SMALL: 5,
  MARGIN_MEDIUM: 10,
  MARGIN_LARGE: 20,
  MARGIN_XLARGE: 30,

  /** フォントサイズ */
  FONT_SMALL: 12,
  FONT_MEDIUM: 14,
  FONT_LARGE: 16,
  FONT_XLARGE: 18,
};

/** 透明度関連 */
const OPACITY = {
  /** 半透明 */
  SEMI_TRANSPARENT: 0.5,

  /** わずかに透明 */
  SLIGHTLY_TRANSPARENT: 0.65,

  /** ほぼ不透明 */
  MOSTLY_OPAQUE: 0.85,

  /** 部分的透明 */
  PARTIAL_TRANSPARENT: 1.1,

  /** スケール変更 */
  SCALE_SMALL: 1.2,
};

// ===========================================
// カラー関連の定数
// ===========================================

/** カラー値 */
const COLORS = {
  /** グレー系 */
  LIGHT_GRAY: 245,

  /** パーセンテージ関連 */
  PERCENTAGE_70: 70,

  /** その他の数値 */
  MISC_VALUE_3: 3,
  MISC_VALUE_4: 4,
  MISC_VALUE_6: 6,
  MISC_VALUE_8: 8,
  MISC_VALUE_11: 11,
  MISC_VALUE_15: 15,
  MISC_VALUE_25: 25,
};

// ===========================================
// 機能固有の定数
// ===========================================

/** TOC (目次) 関連 */
const TOC = {
  /** 最大深度 */
  MAX_DEPTH: 6,

  /** 最小深度 */
  MIN_DEPTH: 1,

  /** スムーズスクロールの基準値 */
  SMOOTH_SCROLL_THRESHOLD: 800,

  /** レベル調整用の値 */
  LEVEL_ADJUSTMENT_NEGATIVE: -2,
  LEVEL_ADJUSTMENT_POSITIVE: 3,
};

/** 検索関連 */
const SEARCH = {
  /** デフォルトの最大結果数 */
  DEFAULT_MAX_RESULTS: 50,

  /** 検索インデックスのサイズ */
  INDEX_SIZE: 100,
};

/** パフォーマンス関連 */
const PERFORMANCE = {
  /** メモリ使用量の閾値 */
  MEMORY_THRESHOLD: 50,

  /** CPUタイムの制限 */
  CPU_TIME_LIMIT: 100,

  /** バッチ処理のサイズ */
  BATCH_SIZE: 1000,

  /** 重い処理用の大きなタイムアウト */
  HEAVY_TIMEOUT: 8000,
};

/** UI アニメーション関連 */
const ANIMATION = {
  /** フェード時間 */
  FADE_DURATION: 300,

  /** スライド時間 */
  SLIDE_DURATION: 500,

  /** 拡大縮小の時間 */
  SCALE_DURATION: 200,
};

// ===========================================
// エラー・メッセージ関連
// ===========================================

/** 通知関連 */
const NOTIFICATIONS = {
  /** 通知の最大表示時間 */
  MAX_DISPLAY_TIME: 5000,

  /** 短い通知時間 */
  SHORT_DISPLAY: 2000,

  /** 成功通知の時間 */
  SUCCESS_DISPLAY: 3000,
};

// ===========================================
// デバッグ・開発関連
// ===========================================

/** デバッグ用の値 */
const DEBUG = {
  /** ログレベル */
  LOG_LEVEL: 1,

  /** デバッグモードの閾値 */
  DEBUG_THRESHOLD: 100,

  /** 開発用の遅延 */
  DEV_DELAY: 1000,
};

// ===========================================
// 互換性維持用のエクスポート
// ===========================================

// Node.js環境での互換性確保
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TIMEOUTS,
    INTERVALS,
    SIZES,
    OPACITY,
    COLORS,
    TOC,
    SEARCH,
    PERFORMANCE,
    ANIMATION,
    NOTIFICATIONS,
    DEBUG,
  };
}
