/**
 * @fileoverview 検索エンジンクラス - Markdown Viewerの高度な検索機能を提供
 *
 * このファイルは、Chrome拡張機能「Markdown Viewer with Mermaid」の検索機能を実装します。
 * 正規表現検索、リアルタイム検索、ハイライト表示などの機能を提供します。
 *
 * @author 76Hata
 * @version 2.0.0
 * @since 1.0.0
 */

/**
 * 検索エンジンクラス
 * Markdownコンテンツ内の高度な検索機能を提供します（DOM破壊を防ぐ完全安全版）
 *
 * @class SearchEngine
 * @description このクラスは以下の機能を提供します：
 * - リアルタイム検索
 * - 正規表現による高度な検索
 * - 大文字小文字の区別/無視
 * - 完全一致検索
 * - 検索結果のハイライト表示
 * - 検索結果間の移動
 * - DOM構造を破壊しない安全な検索
 *
 * @example
 * // 検索エンジンを初期化
 * const searchEngine = new SearchEngine();
 *
 * // 検索パネルを表示
 * searchEngine.show();
 *
 * // プログラムから検索を実行
 * searchEngine.search('検索語', {regex: true, caseSensitive: false});
 *
 * @author 76Hata
 * @since 1.0.0
 */
class SearchEngine {
  /**
   * SearchEngineクラスのコンストラクタ
   *
   * @constructor
   * @param {Element|HTMLElement} container - 検索対象となるコンテナ要素
   * @description 検索エンジンインスタンスを初期化します。
   *              プロパティの初期化を行い、init()メソッドを呼び出します。
   * @since 1.0.0
   */
  constructor(container) {
    /** @type {Element} 検索対象のコンテナ要素 */
    this.container = container || document;

    /** @type {HTMLElement|null} 検索パネルのDOM要素 */
    this.searchPanelElement = null;

    /** @type {boolean} 検索パネルの表示状態 */
    this.isVisible = false;

    /** @type {string} 現在の検索クエリ */
    this.currentQuery = '';

    /** @type {Array} 検索結果の配列 */
    this.currentResults = [];

    /** @type {number} 現在選択中の検索結果のインデックス */
    this.currentIndex = 0;

    /** @type {string} 元のHTMLコンテンツ（ハイライト除去用） */
    this.originalHTML = '';

    this.init();
  }

  /**
   * 検索エンジンの初期化処理
   *
   * @method init
   * @description 検索パネルの作成とイベントバインディングを実行します
   * @returns {void}
   * @since 1.0.0
   */
  init() {
    this.createSearchPanel();
    this.bindEvents();
  }

  /**
   * 検索パネルのDOM要素を作成する
   *
   * @method createSearchPanel
   * @description 検索パネルのHTML構造を動的に生成し、ページに追加します。
   *              検索入力フィールド、ナビゲーションボタン、オプションを含む
   *              完全なUI要素を構築します。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // 検索パネルを手動で再作成する場合
   * this.createSearchPanel();
   */
  createSearchPanel() {
    // 検索パネルの親要素を作成
    this.searchPanelElement = document.createElement('div');
    this.searchPanelElement.className = 'search-panel';
    this.searchPanelElement.innerHTML = `
            <div class="search-header">
                <input type="text" class="search-input" placeholder="検索..." />
                <div class="search-controls">
                    <button class="search-btn search-prev" title="前の結果">↑</button>
                    <button class="search-btn search-next" title="次の結果">↓</button>
                    <span class="search-status">0/0</span>
                    <button class="search-btn search-close" title="閉じる">×</button>
                </div>
            </div>
            <div class="search-options">
                <label><input type="checkbox" class="search-case-sensitive"> 大文字小文字を区別</label>
            </div>
        `;

    // 初期状態では非表示に設定
    this.searchPanelElement.style.display = 'none';
    // ページに検索パネルを追加
    document.body.appendChild(this.searchPanelElement);
  }

  /**
   * 検索パネルのイベントリスナーを設定する
   *
   * @method bindEvents
   * @description 検索パネル内の各UI要素にイベントリスナーを追加します。
   *              入力イベント、キーボードナビゲーション、ボタンクリックなど
   *              すべてのユーザーインタラクションを処理します。
   * @returns {void}
   * @since 1.0.0
   */
  /**
   * 検索パネルのイベントリスナーをバインド
   *
   * @method bindEvents
   * @memberof SearchEngine
   * @description 検索パネルの各要素とドキュメント全体のイベントハンドラーを設定します：
   * - 検索入力フィールド: リアルタイム検索とキーボードナビゲーション
   * - ナビゲーションボタン: 前/次の結果への移動
   * - 閉じるボタン: 検索パネルの非表示
   * - オプションチェックボックス: 検索オプションの変更
   * - グローバルキーボードショートカット: Ctrl+F（検索パネル表示）
   *
   * @example
   * // イベントリスナーのバインド例
   * this.bindEvents();
   *
   * // 設定されるイベント：
   * // - input: リアルタイム検索実行
   * // - Enter/Shift+Enter: 結果ナビゲーション
   * // - Escape: 検索パネル終了
   * // - Ctrl+F: 検索パネル表示（グローバル）
   *
   * @since 1.0.0
   */
  bindEvents() {
    /** @type {HTMLInputElement} 検索入力フィールド */
    const input = this.searchPanelElement.querySelector('.search-input') /** @type {HTMLInputElement} */ ;

    /** @type {HTMLButtonElement} 前の結果へのナビゲーションボタン */
    const prevBtn = this.searchPanelElement.querySelector('.search-prev');

    /** @type {HTMLButtonElement} 次の結果へのナビゲーションボタン */
    const nextBtn = this.searchPanelElement.querySelector('.search-next');

    /** @type {HTMLButtonElement} 検索パネルを閉じるボタン */
    const closeBtn = this.searchPanelElement.querySelector('.search-close');

    // 検索入力フィールドのイベントリスナー群

    /**
     * 検索入力変更イベントハンドラー
     * リアルタイム検索を実行する
     */
    input.addEventListener('input', e => {
      e.preventDefault();
      e.stopPropagation();
      try {
        // 入力値でリアルタイム検索を実行
        this.performSearch(e.target.value);
      } catch (error) {
        console.error('Search input error:', error);
        this.safeResetSearch();
      }
    });

    /**
     * 検索入力キーボードイベントハンドラー
     * Enter/Shift+Enter（次へ/前へ）、Escape（検索終了）をハンドル
     */
    input.addEventListener('keydown', e => {
      e.stopPropagation(); // 重要: イベントの伝播を停止

      if (e.key === 'Enter') {
        e.preventDefault();
        try {
          if (e.shiftKey) {
            // Shift+Enter: 前の結果へ移動
            this.navigateResults('prev');
          } else {
            // Enter: 次の結果へ移動
            this.navigateResults('next');
          }
        } catch (error) {
          console.error('Navigation error:', error);
        }
      } else if (e.key === 'Escape') {
        // Escape: 検索パネルを閉じる
        e.preventDefault();
        this.hide();
      }
    });

    /**
     * 前の結果ボタンクリックイベントハンドラー
     */
    prevBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.navigateResults('prev');
    });

    /**
     * 次の結果ボタンクリックイベントハンドラー
     */
    nextBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.navigateResults('next');
    });

    /**
     * 閉じるボタンクリックイベントハンドラー
     */
    closeBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
    });

    // 検索オプション変更時の再検索処理
    /** @type {NodeList} 検索オプションのチェックボックス要素一覧 */
    const options = this.searchPanelElement.querySelectorAll(
      '.search-options input[type="checkbox"]'
    );

    /**
     * 検索オプション変更イベントハンドラー
     * 大文字小文字区別などのオプションが変更された際に再検索を実行
     */
    options.forEach(option => {
      option.addEventListener('change', e => {
        e.stopPropagation();
        try {
          // 現在のクエリがある場合は再検索を実行
          if (this.currentQuery) {
            this.performSearch(this.currentQuery);
          }
        } catch (error) {
          console.error('Options change error:', error);
        }
      });
    });

    /**
     * グローバルキーボードショートカットイベントハンドラー
     * Ctrl+F（またはCmd+F）で検索パネルを表示
     */
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        // 検索パネルを表示
        this.show();
      }
    });
  }

  /**
   * 検索を実行する
   *
   * @method performSearch
   * @param {string} query - 検索クエリ文字列
   * @description 指定されたクエリで検索を実行し、結果をハイライト表示します。
   *              空のクエリの場合は検索結果をクリアします。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // 検索を実行
   * this.performSearch('JavaScript');
   */
  performSearch(query) {
    /** @type {string} 現在の検索クエリを保存 */
    this.currentQuery = query;

    // 以前の検索結果をクリア
    this.clearHighlights();
    this.currentResults = [];
    this.currentIndex = 0;

    // 空のクエリの場合は状態更新のみ
    if (!query.trim()) {
      this.updateStatus();
      return;
    }

    // Performing safe search

    // 元のHTMLを保存（初回のみ）
    /** @type {Element} 検索対象のコンテンツコンテナ */
    const contentContainer =
      document.querySelector('#markdown-content') || document.body;
    if (!this.originalHTML) {
      this.originalHTML = contentContainer.innerHTML;
    }

    // 安全な検索実行
    try {
      this.safeSearch(query, contentContainer);
    } catch (error) {
      console.error('Search error:', error);
      this.safeResetSearch();
    }
  }

  /**
   * 検索可能なテキストコンテンツを取得する
   *
   * @method getSearchableTextContent
   * @param {Element} container - 検索対象のコンテナ要素
   * @description MermaidやSVG要素を除外したプレーンテキストを取得します。
   *              図表要素は検索対象から除外されます。
   * @returns {string} 検索可能なテキストコンテンツ
   * @since 1.0.0
   *
   * @example
   * // コンテナからテキストを取得
   * const text = this.getSearchableTextContent(document.body);
   */
  getSearchableTextContent(container) {
    // コンテナのクローンを作成（元の要素を変更しないため）
    /** @type {Element} コンテナのクローン */
    const clone = container.cloneNode(true);

    // Mermaid図表要素を取得して削除
    /** @type {NodeList} Mermaid要素のリスト */
    const mermaidElements = clone.querySelectorAll('.mermaid');

    // SVG要素を取得して削除
    /** @type {NodeList} SVG要素のリスト */
    const svgElements = clone.querySelectorAll('svg');

    // 各要素を削除
    mermaidElements.forEach(element => element.remove());
    svgElements.forEach(element => element.remove());

    // プレーンテキストを返す
    return clone.textContent || clone.innerText || '';
  }

  /**
   * DOM構造を破壊しない安全な検索を実行する
   *
   * @method safeSearch
   * @param {string} query - 検索クエリ
   * @param {Element} container - 検索対象のコンテナ要素
   * @description 正規表現を使用してテキスト検索を実行し、結果をハイライト表示します。
   *              DOM構造を破壊することなく、安全に検索とハイライトを行います。
   * @returns {void}
   * @since 1.0.0
   */
  safeSearch(query, container) {
    // Mermaid要素を除外したテキストコンテンツを取得
    /** @type {string} 検索可能なテキストコンテンツ */
    const textContent = this.getSearchableTextContent(container);

    /** @type {Object} 検索オプション設定 */
    const options = this.getSearchOptions();

    /** @type {string} 正規表現フラグ */
    const flags = options.caseSensitive ? 'g' : 'gi';

    /** @type {RegExp} 検索用正規表現 */
    let searchRegex;

    try {
      // 常にリテラル検索のみ（正規表現特殊文字を完全エスケープ）
      /** @type {string} エスケープされた検索クエリ */
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchRegex = new RegExp(escapedQuery, flags);
    } catch {
      // 無効な検索パターンの場合はリセットして終了
      this.updateStatus();
      return;
    }

    // マッチ箇所を検索（テキストコンテンツのみ）
    /** @type {RegExpExecArray|null} 正規表現のマッチ結果 */
    let match;

    /** @type {number} マッチ数のカウンタ */
    let matchCount = 0;

    /** @type {number} 最大マッチ数（無限ループ防止） */
    const maxMatches = 1000;

    searchRegex.lastIndex = 0; // 検索開始位置をリセット

    while (
      (match = searchRegex.exec(textContent)) !== null &&
      matchCount < maxMatches
    ) {
      this.currentResults.push({
        text: match[0],
        index: match.index,
        length: match[0].length,
      });

      matchCount++;

      // ゼロ幅マッチの無限ループを防ぐ
      if (match[0].length === 0) {
        searchRegex.lastIndex++;
      }

      if (!searchRegex.global) {
        break;
      }
    }

    // Search completed

    // 安全なハイライト表示
    if (this.currentResults.length > 0) {
      this.safeHighlight(query, searchRegex, container);
      this.currentIndex = 0;
      this.scrollToFirstMatch();
    }

    this.updateStatus();
  }

  safeHighlight(query, regex, container) {
    try {
      // HTMLタグを避けてテキストのみハイライト
      // シンプルな置換で安全に実装
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.originalHTML;

      this.highlightTextNodes(tempDiv, regex);

      container.innerHTML = tempDiv.innerHTML;
    } catch (error) {
      console.error('Highlight error:', error);
      // エラー時は元に戻す
      container.innerHTML = this.originalHTML;
    }
  }

  /**
   * テキストノードにハイライトマークアップを適用する
   *
   * @method highlightTextNodes
   * @param {Element} element - ハイライト対象の親要素
   * @param {RegExp} regex - ハイライト対象を検索する正規表現
   * @description DOM TreeWalkerを使用してテキストノードを走査し、
   *              正規表現にマッチするテキストを<span class="search-highlight">で囲みます。
   *              スクリプト、スタイル、Mermaid図表、SVG要素は除外されます。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // 要素内のテキストをハイライト
   * const regex = new RegExp('JavaScript', 'gi');
   * this.highlightTextNodes(document.body, regex);
   */
  highlightTextNodes(element, regex) {
    /** @type {TreeWalker} DOM TreeWalker - テキストノードのみを対象とする */
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      /**
       * ノードフィルター関数 - ハイライト対象ノードを選別
       *
       * @param {Node} node - 評価対象のテキストノード
       * @description スクリプト、スタイル、既存のハイライト、
       *              Mermaid図表、SVG要素内のテキストを除外します。
       * @returns {number} NodeFilter定数（ACCEPT/REJECT）
       */
      acceptNode: node => {
        /** @type {Element|null} テキストノードの親要素 */
        const parent = node.parentElement;

        // 親要素が存在しない、またはスクリプト/スタイル/既存ハイライトの場合は除外
        if (
          !parent ||
          parent.tagName === 'SCRIPT' ||
          parent.tagName === 'STYLE' ||
          parent.classList.contains('search-highlight')
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        // 祖先要素を遡ってMermaid図表とSVG要素を検索対象から除外
        /** @type {Element|null} 現在チェック中の要素 */
        let currentElement = parent;
        while (currentElement) {
          // Mermaid図表の場合は除外
          if (
            currentElement.classList &&
            currentElement.classList.contains('mermaid')
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          // SVG要素内のテキストも除外
          if (
            currentElement.tagName === 'SVG' ||
            currentElement.tagName === 'svg'
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          currentElement = currentElement.parentElement;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    /** @type {Node[]} 処理対象のテキストノード配列 */
    const nodesToProcess = [];

    /** @type {Node|null} TreeWalkerから取得した現在のノード */
    let node;

    // TreeWalkerでテキストノードを走査し、正規表現にマッチするものを収集
    while ((node = walker.nextNode())) {
      if (regex.test(node.textContent)) {
        nodesToProcess.push(node);
      }
    }

    // 逆順で処理してDOMインデックスのずれを防ぐ
    nodesToProcess.reverse().forEach(textNode => {
      try {
        /** @type {Element|null} テキストノードの親要素 */
        const parent = textNode.parentElement;
        if (!parent) {
          return;
        }

        /** @type {string} 元のテキストコンテンツ */
        const text = textNode.textContent;

        /** @type {string} ハイライトマークアップを適用したテキスト */
        const highlightedText = text.replace(regex, match => {
          return `<span class="search-highlight">${match}</span>`;
        });

        // テキストが変更された場合のみDOM操作を実行
        if (text !== highlightedText) {
          /** @type {HTMLDivElement} 一時的なHTML解析用要素 */
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = highlightedText;

          // 一時要素の子ノードを元の位置に移動
          while (tempDiv.firstChild) {
            parent.insertBefore(tempDiv.firstChild, textNode);
          }
          // 元のテキストノードを削除
          parent.removeChild(textNode);
        }
      } catch (error) {
        console.warn('Text node highlight error:', error);
      }
    });
  }

  /**
   * 検索ハイライトをクリアする
   *
   * @method clearHighlights
   * @description 保存されている元のHTMLコンテンツを使用して、
   *              すべての検索ハイライト（<span class="search-highlight">）を除去し、
   *              コンテンツを元の状態に復元します。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // 検索ハイライトをクリア
   * this.clearHighlights();
   */
  clearHighlights() {
    // 安全なクリーンアップ処理
    /** @type {Element} コンテンツコンテナ要素 */
    const container =
      document.querySelector('#markdown-content') || document.body;

    if (this.originalHTML) {
      try {
        // 元のHTMLを復元してハイライトを除去
        container.innerHTML = this.originalHTML;
      } catch (error) {
        console.error('Clear highlights error:', error);
      }
    }
  }

  /**
   * 最初の検索結果にスクロールする
   *
   * @method scrollToFirstMatch
   * @description 検索結果の最初のマッチにアクティブクラスを付与し、
   *              該当位置にスムーズにスクロールします。
   * @returns {void}
   * @since 1.0.0
   */
  scrollToFirstMatch() {
    setTimeout(() => {
      /** @type {Element|null} 最初のハイライト要素 */
      const firstHighlight = document.querySelector('.search-highlight');
      if (firstHighlight) {
        firstHighlight.classList.add('search-highlight-active');
        firstHighlight.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);
  }

  /**
   * 検索結果間を移動する
   *
   * @method navigateResults
   * @param {string} direction - 移動方向（'next' または 'prev'）
   * @description 検索結果を順番に移動し、該当位置にスクロールします。
   *              循環的に移動するため、最後の結果から最初の結果に戻ることができます。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // 次の結果に移動
   * this.navigateResults('next');
   * // 前の結果に移動
   * this.navigateResults('prev');
   */
  navigateResults(direction) {
    // 検索結果が存在しない場合は何もしない
    if (this.currentResults.length === 0) {
      return;
    }

    // 現在のアクティブハイライトを全て削除
    document.querySelectorAll('.search-highlight-active').forEach(el => {
      el.classList.remove('search-highlight-active');
    });

    // インデックスを更新（循環的に移動）
    if (direction === 'next') {
      this.currentIndex = (this.currentIndex + 1) % this.currentResults.length;
    } else {
      this.currentIndex =
        (this.currentIndex - 1 + this.currentResults.length) %
        this.currentResults.length;
    }

    // 新しいアクティブ要素を設定してスクロール
    /** @type {NodeList} 全てのハイライト要素 */
    const highlights = document.querySelectorAll('.search-highlight');
    if (highlights[this.currentIndex]) {
      highlights[this.currentIndex].classList.add('search-highlight-active');
      highlights[this.currentIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }

    this.updateStatus();
  }

  /**
   * 検索結果のステータス表示を更新する
   *
   * @method updateStatus
   * @description 検索パネル内のステータス表示（例：「2/5」）を
   *              現在の検索結果数と選択中のインデックスで更新します。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // ステータス表示を更新
   * this.updateStatus();
   */
  updateStatus() {
    /** @type {Element} ステータス表示要素 */
    const status = this.searchPanelElement.querySelector('.search-status');

    if (this.currentResults.length === 0) {
      // 検索結果なしの場合
      status.textContent = '0/0';
    } else {
      // 現在の位置/総数を表示（1ベースのインデックス）
      status.textContent = `${this.currentIndex + 1}/${this.currentResults.length}`;
    }
  }

  /**
   * 検索オプション設定を取得する
   *
   * @method getSearchOptions
   * @description 検索パネル内のオプション設定（大文字小文字の区別など）を
   *              オブジェクトとして取得します。
   * @returns {Object} 検索オプション設定オブジェクト
   * @returns {boolean} returns.caseSensitive - 大文字小文字を区別するかどうか
   * @since 1.0.0
   *
   * @example
   * // 検索オプションを取得
   * const options = this.getSearchOptions();
   * console.log(options.caseSensitive); // true または false
   */
  getSearchOptions() {
    /** @type {Element} 検索パネル要素 */
    const panel = this.searchPanelElement;

    return {
      /** @type {boolean} 大文字小文字の区別設定 */
      caseSensitive: panel.querySelector('.search-case-sensitive').checked,
    };
  }

  /**
   * 検索状態を安全にリセットする
   *
   * @method safeResetSearch
   * @description 検索結果、ハイライト、入力フィールドなど
   *              検索関連のすべての状態を初期状態にリセットします。
   *              エラーが発生しても処理を続行する安全な実装です。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // 検索状態をリセット
   * this.safeResetSearch();
   */
  safeResetSearch() {
    try {
      // ハイライトをクリア
      this.clearHighlights();

      // 検索結果関連の状態をリセット
      this.currentResults = [];
      this.currentIndex = 0;
      this.currentQuery = '';

      // ステータス表示を更新
      this.updateStatus();

      // 入力フィールドをクリア
      /** @type {HTMLInputElement} 検索入力フィールド */
      const input = this.searchPanelElement.querySelector('.search-input') /** @type {HTMLInputElement} */ ;
      if (input) {
        input.value = '';
      }
    } catch (error) {
      console.error('Reset error:', error);
    }
  }

  /**
   * 検索パネルを表示する
   *
   * @method show
   * @description 検索パネルを表示し、入力フィールドにフォーカスを設定します。
   *              元のHTMLコンテンツを保存して、後でハイライトを除去できるようにします。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // 検索パネルを表示
   * searchEngine.show();
   */
  show() {
    // 検索パネルを表示状態に変更
    this.searchPanelElement.style.display = 'block';
    this.isVisible = true;

    // 元のHTMLを保存（ハイライト除去用）
    /** @type {Element} コンテンツコンテナ */
    const contentContainer =
      document.querySelector('#markdown-content') || document.body;
    this.originalHTML = contentContainer.innerHTML;

    // 検索入力フィールドにフォーカスを設定
    /** @type {HTMLInputElement} 検索入力フィールド */
    const input = this.searchPanelElement.querySelector('.search-input') /** @type {HTMLInputElement} */ ;
    setTimeout(() => {
      input.focus();
      input.select();
    }, 50);
  }

  /**
   * 検索パネルを非表示にする
   *
   * @method hide
   * @description 検索パネルを非表示にし、検索結果とハイライトをクリアします。
   *              検索状態を完全にリセットします。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // 検索パネルを非表示
   * searchEngine.hide();
   */
  hide() {
    // 検索パネルを非表示状態に変更
    this.searchPanelElement.style.display = 'none';
    this.isVisible = false;

    // ハイライトと検索状態をクリア
    this.clearHighlights();
    this.safeResetSearch();
  }

  /**
   * 検索エンジンを破棄する
   *
   * @method destroy
   * @description 検索エンジンインスタンスを完全に破棄し、
   *              DOM要素を削除してメモリリークを防ぎます。
   * @returns {void}
   * @since 1.0.0
   *
   * @example
   * // 検索エンジンを破棄
   * searchEngine.destroy();
   * searchEngine = null;
   */
  destroy() {
    // ハイライトをクリア
    this.clearHighlights();

    // DOM要素を削除
    if (this.searchPanelElement) {
      this.searchPanelElement.remove();
    }
  }
}

// Ensure class is available globally
window.SearchEngine = SearchEngine;
