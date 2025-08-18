/**
 * @fileoverview 目次生成クラス - Markdown Viewerの目次自動生成機能を提供
 *
 * このファイルは、Chrome拡張機能「Markdown Viewer with Mermaid」の目次生成機能を実装します。
 * 見出しから階層構造を持つ目次を自動生成し、ナビゲーション機能を提供します。
 *
 * @author 76Hata
 * @version 2.0.0
 * @since 1.0.0
 */

/**
 * 目次生成クラス
 * Markdownの見出しから目次を自動生成し、ナビゲーション機能を提供します
 *
 * @class TOCGenerator
 * @description このクラスは以下の機能を提供します：
 * - 見出し（h1-h6）からの目次自動生成
 * - 階層構造を持つ目次の作成
 * - 目次項目クリックによるスムーズスクロール
 * - 現在の位置のハイライト表示
 * - 折りたたみ可能な目次パネル
 * - 目次の表示/非表示切り替え
 * - レスポンシブデザイン対応
 *
 * @example
 * // 目次生成器を初期化
 * const tocGenerator = new TOCGenerator();
 *
 * // オプション付きで初期化
 * const tocGenerator = new TOCGenerator({
 *     maxDepth: 4,
 *     includeNumbers: true
 * });
 *
 * @author 76Hata
 * @since 1.0.0
 */
class TOCGenerator {
  /**
   * TOCGeneratorクラスのコンストラクタ
   *
   * @constructor
   * @param {Object} options - 目次生成の設定オプション
   * @param {number} [options.maxDepth=6] - 目次に含める最大の見出しレベル（h1-h6）
   * @param {number} [options.minDepth=1] - 目次に含める最小の見出しレベル
   * @param {boolean} [options.includeNumbers=false] - 見出し番号を含めるかどうか
   * @param {boolean} [options.smoothScroll=true] - スムーズスクロールを有効にするかどうか
   * @param {boolean} [options.autoCollapse=false] - 自動折りたたみを有効にするかどうか
   * @param {string} [options.position='left'] - 目次の表示位置（left/right）
   * @param {string} [options.width='250px'] - 目次パネルの幅
   * @description 目次生成器インスタンスを初期化します。
   * @since 1.0.0
   */
  constructor(options = {}) {
    /** @type {Object} 目次生成の設定オプション */
    this.options = {
      maxDepth: 6,
      minDepth: 1,
      includeNumbers: false,
      smoothScroll: true,
      autoCollapse: false,
      position: 'left',
      width: '250px',
      ...options,
    };

    /** @type {Array} 抽出された見出し要素の配列 */
    this.headings = [];

    /** @type {HTMLElement|null} 目次のDOM要素 */
    this.tocElement = null;

    /** @type {HTMLElement|null} 現在アクティブな見出し要素 */
    this.activeHeading = null;

    /** @type {IntersectionObserver|null} スクロール監視用のオブザーバー */
    this.observer = null;

    /** @type {boolean} 目次の折りたたみ状態 */
    this.isCollapsed = false;

    /** @type {HTMLElement|null} フローティングボタン要素 */
    this.floatingButton = null;

    this.init();
  }

  /**
   * TOCGeneratorクラスの初期化処理
   *
   * @method init
   * @memberof TOCGenerator
   * @description 目次生成器の初期化を順次実行します：
   * 1. 見出し要素の抽出と階層構造の構築
   * 2. 目次DOM構造の作成
   * 3. 目次パネルの画面描画
   * 4. スクロール監視（Intersection Observer）の設定
   * 5. イベントリスナーのバインディング
   *
   * @example
   * // 初期化処理の実行例
   * const tocGenerator = new TOCGenerator();
   * // 上記のコンストラクタ内で自動的にthis.init()が呼び出される
   *
   * @since 1.0.0
   */
  init() {
    this.extractHeadings();
    this.createTOCStructure();
    this.renderTOC();
    this.setupScrollSpy();
    this.bindEvents();
  }

  /**
   * HTML文書から見出し要素（h1-h6）を抽出し、目次データ構造を構築
   *
   * @method extractHeadings
   * @memberof TOCGenerator
   * @description 以下の処理を実行します：
   * 1. マークダウンコンテナまたはbodyから見出し要素を検索
   * 2. 設定されたminDepth-maxDepth範囲内の見出しを抽出
   * 3. 見出しにIDが未設定の場合は自動生成
   * 4. 見出し情報をオブジェクトとして格納
   * 5. 階層構造を構築
   *
   * @example
   * // 見出し抽出の実行例
   * this.extractHeadings();
   * // this.headingsに以下のような構造が格納される：
   * // [
   * //   { id: 'introduction', level: 1, text: 'はじめに', element: HTMLElement, ... },
   * //   { id: 'overview', level: 2, text: '概要', element: HTMLElement, ... }
   * // ]
   *
   * @since 1.0.0
   */
  extractHeadings() {
    const container = document.querySelector('#markdown-content, body');
    const selector = this.generateHeadingSelector();
    const headingElements = container.querySelectorAll(selector);

    this.headings = Array.from(headingElements).map((element, index) => {
      if (!element.id) {
        element.id = this.generateHeadingId(element.textContent, index);
      }

      return {
        id: element.id,
        level: parseInt(element.tagName.charAt(1)),
        text: element.textContent.trim(),
        element: element,
        children: [],
        parent: null,
        index: index,
      };
    });

    this.buildHierarchy();
  }

  /**
   * 見出し要素のCSSセレクターを生成
   *
   * @method generateHeadingSelector
   * @memberof TOCGenerator
   * @description 設定されたminDepth-maxDepth範囲内の見出しタグのセレクター文字列を生成します。
   *              例：minDepth=1, maxDepth=3の場合 → "h1, h2, h3"
   *
   * @returns {string} 見出し要素選択用のCSSセレクター文字列
   *
   * @example
   * // セレクター生成の例
   * this.options = { minDepth: 2, maxDepth: 4 };
   * const selector = this.generateHeadingSelector();
   * console.log(selector); // "h2, h3, h4"
   *
   * @since 1.0.0
   */
  generateHeadingSelector() {
    const levels = [];
    for (let i = this.options.minDepth; i <= this.options.maxDepth; i++) {
      levels.push(`h${i}`);
    }
    return levels.join(', ');
  }

  /**
   * 見出しテキストからURL用のIDを生成
   *
   * @method generateHeadingId
   * @memberof TOCGenerator
   * @description 見出しテキストをURL安全なスラッグ形式に変換してIDを生成します。
   *              日本語や特殊文字は除去し、スペースはハイフンに変換されます。
   *
   * @param {string} text - 見出しのテキスト内容
   * @param {number} index - 見出しのインデックス（フォールバック用）
   * @returns {string} URL安全なID文字列
   *
   * @example
   * // ID生成の例
   * this.generateHeadingId("概要について", 0);
   * // → "概要について"（日本語含む場合）
   *
   * this.generateHeadingId("Getting Started!", 1);
   * // → "getting-started"
   *
   * this.generateHeadingId("", 2);
   * // → "heading-2"（空文字の場合のフォールバック）
   *
   * @since 1.0.0
   */
  generateHeadingId(text, index) {
    const slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();

    return slug || `heading-${index}`;
  }

  /**
   * 見出し要素間の親子関係（階層構造）を構築
   *
   * @method buildHierarchy
   * @memberof TOCGenerator
   * @description スタックアルゴリズムを使用して、見出しレベルに基づく階層構造を構築します。
   *              各見出し要素にparentプロパティとchildrenプロパティを設定し、
   *              ツリー構造のデータモデルを作成します。
   *
   * @example
   * // 階層構造構築前後の例
   * // 構築前: [h1, h2, h2, h3, h1]
   * // 構築後:
   * // h1 (parent: null, children: [h2, h2])
   * //   ├─ h2 (parent: h1, children: [])
   * //   └─ h2 (parent: h1, children: [h3])
   * //        └─ h3 (parent: h2, children: [])
   * // h1 (parent: null, children: [])
   *
   * @algorithm
   * 1. 空のスタックを初期化
   * 2. 各見出しを順次処理
   * 3. 現在の見出しレベル以上の要素をスタックから除去
   * 4. スタック最上位要素を親として設定
   * 5. 現在の見出しをスタックにプッシュ
   *
   * @since 1.0.0
   */
  buildHierarchy() {
    const stack = [];

    this.headings.forEach(heading => {
      while (
        stack.length > 0 &&
        stack[stack.length - 1].level >= heading.level
      ) {
        stack.pop();
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        heading.parent = parent;
        parent.children.push(heading);
      }

      stack.push(heading);
    });
  }

  /**
   * 目次パネルのDOM構造を作成
   *
   * @method createTOCStructure
   * @memberof TOCGenerator
   * @description 目次パネル全体のHTMLDOM構造を構築します：
   * - ヘッダー部分（タイトル + 折りたたみボタン）
   * - コンテンツ部分（ナビゲーション + 目次リスト）
   * - アクセシビリティ属性の設定（ARIA属性等）
   * - インタラクティブ要素の初期状態設定
   *
   * @example
   * // DOM構造作成の実行例
   * this.createTOCStructure();
   * // 作成される構造：
   * // <div class="toc-panel">
   * //   <div class="toc-header">
   * //     <h3>目次</h3>
   * //     <button class="toc-toggle">...</button>
   * //   </div>
   * //   <div class="toc-content">
   * //     <nav class="toc-nav">...</nav>
   * //   </div>
   * // </div>
   *
   * @since 1.0.0
   */
  createTOCStructure() {
    this.tocElement = document.createElement('div');
    this.tocElement.className = 'toc-panel';
    this.tocElement.innerHTML = `
            <div class="toc-header">
                <h3>目次</h3>
                <button class="toc-toggle" title="目次を折りたたむ" aria-label="目次を折りたたむ">
                    <svg class="toc-toggle-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </button>
            </div>
            <div class="toc-content">
                <nav class="toc-nav" role="navigation" aria-label="目次">
                    ${this.generateTOCHTML()}
                </nav>
            </div>
        `;
  }

  /**
   * 目次全体のHTMLマークアップを生成
   *
   * @method generateTOCHTML
   * @memberof TOCGenerator
   * @description ルートレベルの見出し（親を持たない見出し）から開始して、
   *              完全な目次のHTMLマークアップを再帰的に生成します。
   *
   * @returns {string} 目次全体のHTMLマークアップ文字列
   *
   * @example
   * // 目次HTML生成の実行例
   * const tocHTML = this.generateTOCHTML();
   * // 戻り値例：
   * // '<ul class="toc-list">
   * //   <li class="toc-item" data-level="1">
   * //     <a href="#intro" class="toc-link">はじめに</a>
   * //   </li>
   * //   ...
   * // </ul>'
   *
   * @since 1.0.0
   */
  generateTOCHTML() {
    const rootHeadings = this.headings.filter(h => !h.parent);
    return `<ul class="toc-list">${this.generateHeadingHTML(rootHeadings)}</ul>`;
  }

  /**
   * 見出しオブジェクト配列からHTMLマークアップを再帰生成
   *
   * @method generateHeadingHTML
   * @memberof TOCGenerator
   * @description 見出しオブジェクトの配列を受け取り、階層構造を維持しながら
   *              目次のHTMLマークアップを再帰的に生成します。各見出しには：
   *              - 展開/折りたたみボタン（子要素がある場合）
   *              - 見出し番号（オプション有効時）
   *              - リンクとテキスト
   *              - 子要素のネストしたリスト
   *
   * @param {Array<Object>} headings - 見出しオブジェクトの配列
   * @param {string} headings[].id - 見出しのID
   * @param {number} headings[].level - 見出しレベル（1-6）
   * @param {string} headings[].text - 見出しテキスト
   * @param {Array} headings[].children - 子見出しの配列
   * @returns {string} 見出しリストのHTMLマークアップ文字列
   *
   * @example
   * // 見出しHTML生成の実行例
   * const headings = [
   *   { id: 'intro', level: 1, text: 'はじめに', children: [] },
   *   { id: 'overview', level: 2, text: '概要', children: [...] }
   * ];
   * const html = this.generateHeadingHTML(headings);
   *
   * @recursive この関数は子見出しに対して自分自身を再帰呼び出しします
   * @since 1.0.0
   */
  generateHeadingHTML(headings) {
    return headings
      .map(heading => {
        const hasChildren = heading.children.length > 0;
        const childrenHTML = hasChildren
          ? `<ul class="toc-sublist">${this.generateHeadingHTML(heading.children)}</ul>`
          : '';

        const numberPrefix = this.options.includeNumbers
          ? `<span class="toc-number">${this.getHeadingNumber(heading)}</span>`
          : '';

        return `
                <li class="toc-item" data-level="${heading.level}">
                    ${hasChildren ? '<button class="toc-expand" aria-expanded="true">▼</button>' : ''}
                    <a href="#${heading.id}" class="toc-link" data-heading-id="${heading.id}">
                        ${numberPrefix}
                        <span class="toc-text">${this.escapeHTML(heading.text)}</span>
                    </a>
                    ${childrenHTML}
                </li>
            `;
      })
      .join('');
  }

  /**
   * 見出しの階層番号を生成（例：1.2.3）
   *
   * @method getHeadingNumber
   * @memberof TOCGenerator
   * @description 見出しの階層構造に基づいて、ドット区切りの番号を生成します。
   *              ルートから現在の見出しまでの各レベルでの位置を計算し、
   *              「1.2.3」のような形式の番号文字列を返します。
   *
   * @param {Object} heading - 番号を生成する見出しオブジェクト
   * @param {Object|null} heading.parent - 親見出し（ルートの場合はnull）
   * @param {Array} heading.children - 子見出しの配列
   * @returns {string} ドット区切りの階層番号（例："1.2.3"）
   *
   * @example
   * // 階層番号生成の実行例
   * // 構造: Chapter 1 > Section 1 > Subsection 2
   * const number = this.getHeadingNumber(subsection2);
   * console.log(number); // "1.1.2"
   *
   * @algorithm
   * 1. 再帰的に親見出しを辿ってルートまで到達
   * 2. 各レベルで兄弟要素内での位置（インデックス+1）を計算
   * 3. 階層順に番号を配列に格納
   * 4. ドット区切りで結合して返す
   *
   * @since 1.0.0
   */
  getHeadingNumber(heading) {
    const getNumber = (h, numbers = []) => {
      if (h.parent) {
        getNumber(h.parent, numbers);
      }
      const siblings = h.parent
        ? h.parent.children
        : this.headings.filter(h => !h.parent);
      numbers.push(siblings.indexOf(h) + 1);
      return numbers;
    };

    return getNumber(heading).join('.');
  }

  /**
   * HTML特殊文字をエスケープして安全な文字列に変換
   *
   * @method escapeHTML
   * @memberof TOCGenerator
   * @description 見出しテキスト内のHTML特殊文字（<, >, &, "など）を
   *              エスケープして、XSS攻撃を防ぐ安全な文字列に変換します。
   *              DOMメソッドを使用して確実なエスケープを実行します。
   *
   * @param {string} text - エスケープするテキスト
   * @returns {string} HTMLエスケープ済みの安全な文字列
   *
   * @example
   * // HTMLエスケープの実行例
   * const safeText = this.escapeHTML('<script>alert("XSS")</script>');
   * console.log(safeText);
   * // → "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
   *
   * const safeTitle = this.escapeHTML('タイトル & サブタイトル');
   * console.log(safeTitle);
   * // → "タイトル &amp; サブタイトル"
   *
   * @security XSS攻撃防止のための重要なセキュリティ機能
   * @since 1.0.0
   */
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 目次パネルをDOMに描画し、レイアウトを調整
   *
   * @method renderTOC
   * @memberof TOCGenerator
   * @description 作成された目次パネルをドキュメントに追加し、表示設定を適用します：
   *              1. 既存の目次パネルがあれば削除
   *              2. 新しい目次パネルをbodyに追加
   *              3. 表示位置とサイズの調整
   *              4. メインコンテンツのマージン調整
   *
   * @example
   * // 目次パネル描画の実行例
   * this.renderTOC();
   * // 結果：
   * // - ドキュメントに目次パネルが追加される
   * // - 設定された位置（left/right）に表示
   * // - メインコンテンツのマージンが調整される
   *
   * @see {@link adjustTOCPosition} パネル位置の調整
   * @see {@link adjustContentMargin} コンテンツマージンの調整
   * @since 1.0.0
   */
  renderTOC() {
    const existingTOC = document.querySelector('.toc-panel');
    if (existingTOC) {
      existingTOC.remove();
    }

    document.body.appendChild(this.tocElement);
    this.adjustTOCPosition();
    this.adjustContentMargin();
  }

  /**
   * 目次パネルの表示位置とスタイルを調整
   *
   * @method adjustTOCPosition
   * @memberof TOCGenerator
   * @description 設定された位置（left/right）に基づいて、目次パネルの表示位置を設定します。
   *              フィックスドポジションでビューポート全体の高さを使用し、
   *              適切なz-indexで他の要素の上に表示します。
   *
   * @example
   * // 位置調整の実行例
   * this.options.position = 'left';
   * this.options.width = '300px';
   * this.adjustTOCPosition();
   * // 結果：左端に幅300pxでフィックスド表示
   *
   * this.options.position = 'right';
   * this.adjustTOCPosition();
   * // 結果：右端にフィックスド表示
   *
   * @note スタイルは cssText プロパティで一括設定し、既存スタイルを上書きします
   * @since 1.0.0
   */
  adjustTOCPosition() {
    const toc = this.tocElement;

    switch (this.options.position) {
      case 'left':
        toc.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: ${this.options.width};
                    height: 100vh;
                    z-index: 1000;
                `;
        break;
      case 'right':
        toc.style.cssText = `
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: ${this.options.width};
                    height: 100vh;
                    z-index: 1000;
                `;
        break;
    }
  }

  /**
   * メインコンテンツのマージンを目次パネルに合わせて調整
   *
   * @method adjustContentMargin
   * @memberof TOCGenerator
   * @description 目次パネルの表示状態と位置に応じて、メインコンテンツのマージンを動的に調整します。
   *              目次パネルが表示されている場合はコンテンツが重ならないようにマージンを追加し、
   *              折りたたまれている場合はマージンをリセットします。
   *
   * @example
   * // マージン調整の実行例
   * this.isCollapsed = false;
   * this.options.position = 'left';
   * this.options.width = '250px';
   * this.adjustContentMargin();
   * // 結果：コンテンツの左マージン = 'calc(250px + 20px)'
   *
   * this.isCollapsed = true;
   * this.adjustContentMargin();
   * // 結果：コンテンツの左マージン = '20px'（リセット）
   *
   * @note コンテンツ要素は '#markdown-content' または document.body を対象とします
   * @since 1.0.0
   */
  adjustContentMargin() {
    const content =
      document.querySelector('#markdown-content') || document.body;

    if (this.isCollapsed) {
      // 折りたたまれている場合はマージンをリセット
      content.style.marginLeft = '20px';
      content.style.marginRight = '20px';
    } else {
      // 展開されている場合は通常のマージン
      switch (this.options.position) {
        case 'left':
          content.style.marginLeft = `calc(${this.options.width} + 20px)`;
          content.style.marginRight = '20px';
          break;
        case 'right':
          content.style.marginLeft = '20px';
          content.style.marginRight = `calc(${this.options.width} + 20px)`;
          break;
      }
    }
  }

  /**
   * スクロール監視機能（Intersection Observer）を設定
   *
   * @method setupScrollSpy
   * @memberof TOCGenerator
   * @description Intersection Observer APIを使用して、ユーザーのスクロール位置に応じて
   *              目次内のアクティブな見出しを動的に更新します。
   *              ビューポートの上部20%から下部30%の範囲を監視対象とし、
   *              この範囲内に入った見出しをアクティブとしてマークします。
   *
   * @example
   * // スクロール監視設定の実行例
   * this.setupScrollSpy();
   * // 結果：
   * // - 各見出し要素がIntersection Observerに登録される
   * // - ユーザーのスクロールに応じて目次のアクティブ表示が更新される
   *
   * @see {@link https://developer.mozilla.org/docs/Web/API/Intersection_Observer_API}
   *      Intersection Observer APIの詳細
   * @performance スクロールイベントよりも高パフォーマンスで効率的な監視を実現
   * @since 1.0.0
   */
  setupScrollSpy() {
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.setActiveHeading(entry.target.id);
        }
      });
    }, options);

    this.headings.forEach(heading => {
      this.observer.observe(heading.element);
    });
  }

  /**
   * 目次内のアクティブ見出しを更新
   *
   * @method setActiveHeading
   * @memberof TOCGenerator
   * @description 現在アクティブな見出しを更新し、目次内でのハイライト表示を切り替えます。
   *              前のアクティブ要素からスタイルを除去し、新しい要素にアクティブスタイルを適用します。
   *              さらに、アクティブな要素が目次パネル内で見える位置にスクロールします。
   *
   * @param {string} headingId - アクティブにする見出しのID
   *
   * @example
   * // アクティブ見出し更新の実行例
   * this.setActiveHeading('introduction');
   * // 結果：
   * // - 以前のアクティブ要素から '.active' クラスを除去
   * // - IDが'introduction'の見出しに '.active' クラスを追加
   * // - 目次パネルがその要素を中央に表示するようスクロール
   *
   * @see {@link scrollTOCToActive} 目次パネル内スクロール機能
   * @since 1.0.0
   */
  setActiveHeading(headingId) {
    const prevActive = this.tocElement.querySelector('.toc-link.active');
    if (prevActive) {
      prevActive.classList.remove('active');
    }

    const newActive = this.tocElement.querySelector(
      `[data-heading-id="${headingId}"]`
    );
    if (newActive) {
      newActive.classList.add('active');
      this.activeHeading = headingId;
      this.scrollTOCToActive(newActive);
    }
  }

  /**
   * 目次パネル内でアクティブ要素が見える位置にスクロール
   *
   * @method scrollTOCToActive
   * @memberof TOCGenerator
   * @description アクティブな目次項目が目次パネルの可視範囲内（中央付近）に表示されるよう、
   *              目次パネル内でスムーズスクロールを実行します。
   *              アクティブ要素がパネルの中央に来るようにスクロール位置を計算します。
   *
   * @param {HTMLElement} activeElement - スクロール対象のアクティブ要素
   *
   * @example
   * // 目次パネル内スクロールの実行例
   * const activeLink = this.tocElement.querySelector('.toc-link.active');
   * this.scrollTOCToActive(activeLink);
   * // 結果：アクティブな目次リンクがパネルの中央付近に表示される
   *
   * @algorithm
   * 1. アクティブ要素のパネル内位置（offsetTop）を取得
   * 2. パネルの高さの半分を引いて中央配置用オフセットを計算
   * 3. スムーズスクロールで目標位置に移動
   *
   * @since 1.0.0
   */
  scrollTOCToActive(activeElement) {
    const tocContent = this.tocElement.querySelector('.toc-content');
    const elementTop = activeElement.offsetTop;
    const containerHeight = tocContent.clientHeight;
    const scrollTop = elementTop - containerHeight / 2;

    tocContent.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    });
  }

  /**
   * 目次要素およびドキュメント全体のイベントリスナーをバインド
   *
   * @method bindEvents
   * @memberof TOCGenerator
   * @description 以下のイベントリスナーを設定します：
   * 1. 目次項目クリック時のスムーズスクロール
   * 2. サブリスト展開/折りたたみ
   * 3. 目次パネルのトグル（表示/非表示）
   * 4. キーボードショートカット（Ctrl/Cmd + 上下キー）による見出し間ナビゲーション
   *
   * @example
   * // イベントリスナーのバインド例
   * this.bindEvents();
   *
   * // 設定されるイベント：
   * // - 目次リンククリック → scrollToHeading()実行
   * // - 展開ボタンクリック → toggleSublist()実行
   * // - トグルボタンクリック → toggleTOC()実行
   * // - Ctrl+↑/↓キー → navigateToHeading()実行
   *
   * @since 1.0.0
   */
  bindEvents() {
    // 目次パネル内のクリックイベントハンドラー
    this.tocElement.addEventListener('click', e => {
      // 目次リンクがクリックされた場合のハンドリング
      if (e.target.classList.contains('toc-link')) {
        e.preventDefault();
        const headingId = e.target.dataset.headingId;
        this.scrollToHeading(headingId);
      }

      // サブリスト展開ボタンがクリックされた場合のハンドリング
      if (e.target.classList.contains('toc-expand')) {
        this.toggleSublist(e.target);
      }

      // 目次トグルボタン（SVG子要素含む）がクリックされた場合のハンドリング
      const toggleButton = e.target.closest('.toc-toggle');
      if (toggleButton) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleTOC();
      }
    });

    // ドキュメント全体のキーボードショートカットハンドラー
    document.addEventListener('keydown', e => {
      // Ctrl/Cmdキーと組み合わせた矢印キーによる見出し間ナビゲーション
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            this.navigateToHeading('prev');
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.navigateToHeading('next');
            break;
        }
      }
    });
  }

  /**
   * 指定した見出しにスムーズスクロールで移動
   *
   * @method scrollToHeading
   * @memberof TOCGenerator
   * @description 指定IDの見出し要素にページ内でスクロールし、アクセシビリティのためにフォーカスを設定します。
   *              ツールバーや固定ヘッダーとの重なりを避けるためのオフセットを考慮し、
   *              スムーススクロールの有無を設定に応じて切り替えます。
   *
   * @param {string} headingId - スクロール先の見出しID
   *
   * @example
   * // 見出しへのスクロール実行例
   * this.scrollToHeading('introduction');
   * // 結果：
   * // - IDが'introduction'の見出しにスムーズスクロールで移動
   * // - スクロール完了後、見出し要素にフォーカスが当たる
   * // - ツールバーとの重なりを避けた適切な位置に表示
   *
   * @accessibility スクリーンリーダー対応のため、スクロール後にfocus()を実行
   * @see {@link smoothScrollTo} カスタムスムーススクロール実装
   * @since 1.0.0
   */
  scrollToHeading(headingId) {
    const heading = document.getElementById(headingId);
    if (!heading) {
      return;
    }

    // 右側ツールバーなので、上部オフセットのみ考慮
    const baseOffset = 100; // 十分な上部余白
    const targetPosition = heading.offsetTop - baseOffset;

    if (this.options.smoothScroll) {
      // より確実なスムーススクロール実装
      this.smoothScrollTo(targetPosition);
    } else {
      window.scrollTo(0, targetPosition);
    }

    // 見出しにフォーカスを当てる
    setTimeout(
      () => {
        heading.focus();
      },
      this.options.smoothScroll ? 800 : 0
    );
  }

  /**
   * カスタムスムーズスクロールアニメーションを実行
   *
   * @method smoothScrollTo
   * @memberof TOCGenerator
   * @description requestAnimationFrameを使用した高パフォーマンスなスムーズスクロールを実装します。
   *              easeInOutCubicイージング関数を使用して、自然で滑らかなアニメーションを提供します。
   *              ブラウザのネイティブスムーズスクロールが利用できない場合の代替手段です。
   *
   * @param {number} targetY - スクロール先のY座標（px）
   *
   * @example
   * // カスタムスムーススクロールの実行例
   * this.smoothScrollTo(1000);
   * // 結果：現在位置からY=1000pxの位置まで600msかけてスムーズスクロール
   *
   * @algorithm
   * 1. 開始位置と目標位置の差分を計算
   * 2. requestAnimationFrameでアニメーションループを開始
   * 3. 経過時間に基づいて進行率（0-1）を計算
   * 4. easeInOutCubic関数で進行率を滑らかに変換
   * 5. 変換された進行率で中間位置を計算してスクロール
   * 6. 指定時間が経過するまで繰り返し
   *
   * @performance 60FPSでのスムーズアニメーションを目指したrequestAnimationFrame使用
   * @since 1.0.0
   */
  smoothScrollTo(targetY) {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const duration = 600; // ミリ秒
    let startTime = null;

    const animation = currentTime => {
      if (startTime === null) {
        startTime = currentTime;
      }
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // easeInOutCubic イージング関数
      const easeProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startY + distance * easeProgress);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }

  /**
   * 目次サブリストの展開/折りたたみを切り替え
   *
   * @method toggleSublist
   * @memberof TOCGenerator
   * @description 階層構造を持つ目次の子要素（サブリスト）の表示/非表示を切り替えます。
   *              ARIA属性を適切に更新し、スクリーンリーダーや支援技術での
   *              アクセシビリティを保ちます。展開/折りたたみ状態を表すアイコンも同期します。
   *
   * @param {HTMLButtonElement} button - 展開/折りたたみボタン要素
   *
   * @example
   * // サブリストトグルの実行例
   * const expandButton = document.querySelector('.toc-expand');
   * this.toggleSublist(expandButton);
   * // 結果：
   * // - 現在展開中の場合 → 折りたたみ（▶アイコン、display:none）
   * // - 現在折りたたみ中の場合 → 展開（▼アイコン、display:block）
   * // - aria-expanded属性が適切に更新される
   *
   * @accessibility
   * - aria-expanded属性で展開状態を通知
   * - 視覚アイコン（▶/▼）で状態を明示化
   *
   * @since 1.0.0
   */
  toggleSublist(button) {
    const sublist = button.parentElement.querySelector('.toc-sublist');
    if (!sublist) {
      return;
    }

    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    button.setAttribute('aria-expanded', !isExpanded);
    // 開く時も閉じる時も同じ位置に表示するために、アイコンの位置を統一
    if (isExpanded) {
      button.innerHTML = '▶'; // 閉じる時（展開時→折りたたみ時）
      sublist.style.display = 'none';
    } else {
      button.innerHTML = '▼'; // 開く時（折りたたみ時→展開時）
      sublist.style.display = 'block';
    }
  }

  /**
   * 目次パネル全体の表示/非表示を切り替え
   *
   * @method toggleTOC
   * @memberof TOCGenerator
   * @description 目次パネルの展開/折りたたみ状態を切り替えます。折りたたみ時には
   *              フローティングボタンを表示し、展開時にはメインパネルを表示します。
   *              コンテンツエリアのマージンも状態に応じて動的に調整し、
   *              ユーザーエクスペリエンスを最適化します。
   *
   * @example
   * // 目次パネルトグルの実行例
   * this.toggleTOC();
   * // 結果（現在展開中の場合）：
   * // - 目次パネルが完全に非表示
   * // - フローティングボタンが表示
   * // - メインコンテンツのマージンリセット
   *
   * // 結果（現在折りたたみ中の場合）：
   * // - フローティングボタンが非表示
   * // - 目次パネルがフルサイズで表示
   * // - メインコンテンツのマージン調整
   *
   * @error 必要なDOM要素が見つからない場合、エラーをログ出力して処理を中止
   * @see {@link showFloatingButton} フローティングボタン表示機能
   * @see {@link hideFloatingButton} フローティングボタン非表示機能
   * @see {@link adjustContentMargin} コンテンツマージン調整機能
   * @since 1.0.0
   */
  toggleTOC() {
    try {
      if (!this.tocElement) {
        console.error('TOC element not found');
        return;
      }

      const content = this.tocElement.querySelector('.toc-content');
      const toggle = this.tocElement.querySelector('.toc-toggle');
      const icon = toggle ? toggle.querySelector('.toc-toggle-icon') : null;
      const headerElement = this.tocElement.querySelector('.toc-header');
      const headerTitle = headerElement
        ? headerElement.querySelector('h3')
        : null;

      if (!content || !toggle || !icon || !headerElement || !headerTitle) {
        console.error('TOC elements not found:', {
          content: !!content,
          toggle: !!toggle,
          icon: !!icon,
          headerElement: !!headerElement,
          headerTitle: !!headerTitle,
        });
        return;
      }

      this.isCollapsed = !this.isCollapsed;

      if (this.isCollapsed) {
        // 折りたたむ - サイドバーを完全に非表示
        this.tocElement.style.display = 'none';
        this.showFloatingButton();
      } else {
        // 展開する
        this.tocElement.style.display = 'block';
        this.hideFloatingButton();
        content.style.display = 'block';
        this.tocElement.style.width = this.options.width;
        this.tocElement.classList.remove('collapsed');

        // アイコンを閉じる形（左向き矢印）に変更
        icon.innerHTML = `<path d="M15 18l-6-6 6-6"/>`;
        toggle.title = '目次を折りたたむ';
        toggle.setAttribute('aria-label', '目次を折りたたむ');
      }

      // コンテンツのマージンを調整
      this.adjustContentMargin();
    } catch (error) {
      console.error('Error in toggleTOC:', error);
    }
  }

  /**
   * 目次再表示用のフローティングボタンを作成・表示
   *
   * @method showFloatingButton
   * @memberof TOCGenerator
   * @description 目次パネルが折りたたまれたときに、再度表示するための
   *              フローティングボタンを作成して表示します。ボタンにはメニューアイコンを表示し、
   *              クリックで目次パネルを再度展開できます。アクセシビリティ対応も含みます。
   *
   * @example
   * // フローティングボタン表示の実行例
   * this.showFloatingButton();
   * // 結果：
   * // - 既存のフローティングボタンがあれば削除
   * // - 新しいフローティングボタンを作成
   * // - メニューアイコン（三本線）を表示
   * // - クリックイベントでtoggleTOC()を呼び出し
   * // - document.bodyに追加して表示
   *
   * @accessibility
   * - title属性でツールチップを表示
   * - aria-label属性でスクリーンリーダー対応
   *
   * @see {@link hideFloatingButton} フローティングボタン非表示機能
   * @since 1.0.0
   */
  showFloatingButton() {
    // フローティングボタンが既に存在する場合は削除
    this.hideFloatingButton();

    // フローティングボタンを作成
    this.floatingButton = document.createElement('button');
    this.floatingButton.className = 'toc-floating-button';
    this.floatingButton.title = '目次を表示';
    this.floatingButton.setAttribute('aria-label', '目次を表示');
    this.floatingButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
            </svg>
        `;

    // クリックイベントを追加
    this.floatingButton.addEventListener('click', () => {
      this.toggleTOC();
    });

    // ドキュメントに追加
    document.body.appendChild(this.floatingButton);
  }

  /**
   * フローティングボタンをDOMから削除・非表示
   *
   * @method hideFloatingButton
   * @memberof TOCGenerator
   * @description 現在表示されているフローティングボタンを安全に削除します。
   *              ボタンの存在チェック、親要素の存在チェックを行い、
   *              安全にDOMから除去して参照をクリアします。
   *
   * @example
   * // フローティングボタン非表示の実行例
   * this.hideFloatingButton();
   * // 結果：
   * // - フローティングボタンが存在する場合はDOMから削除
   * // - this.floatingButton参照をnullにリセット
   * // - ボタンが存在しない場合は何もしない（エラーなし）
   *
   * @safety ヌルチェックと親要素チェックで安全な削除を保証
   * @see {@link showFloatingButton} フローティングボタン作成機能
   * @since 1.0.0
   */
  hideFloatingButton() {
    if (this.floatingButton && this.floatingButton.parentNode) {
      this.floatingButton.parentNode.removeChild(this.floatingButton);
      this.floatingButton = null;
    }
  }

  /**
   * キーボードショートカットで前後の見出しにナビゲーション
   *
   * @method navigateToHeading
   * @memberof TOCGenerator
   * @description 現在アクティブな見出しを基準に、指定された方向（前/後）の見出しに
   *              スムーズスクロールで移動します。キーボードショートカット（Ctrl+↑/↓）
   *              による高速なドキュメントナビゲーションを実現します。
   *
   * @param {string} direction - ナビゲーションの方向（'prev' | 'next'）
   *
   * @example
   * // 見出し間ナビゲーションの実行例
   * this.navigateToHeading('prev');
   * // 結果：現在の見出しの1つ前の見出しにスクロール
   *
   * this.navigateToHeading('next');
   * // 結果：現在の見出しの1つ後の見出しにスクロール
   *
   * @algorithm
   * 1. 現在アクティブな見出しのIDを取得
   * 2. 全見出し配列内でのインデックスを検索
   * 3. 指定方向に1つ移動したインデックスを計算
   * 4. 配列範囲内にクランプ（最初/最後で停止）
   * 5. 目標見出しにscrollToHeading()でスクロール
   *
   * @requires this.activeHeading 現在アクティブな見出しが設定されていること
   * @since 1.0.0
   */
  navigateToHeading(direction) {
    if (!this.activeHeading) {
      return;
    }

    const currentIndex = this.headings.findIndex(
      h => h.id === this.activeHeading
    );
    if (currentIndex === -1) {
      return;
    }

    let targetIndex;
    if (direction === 'prev') {
      targetIndex = Math.max(0, currentIndex - 1);
    } else {
      targetIndex = Math.min(this.headings.length - 1, currentIndex + 1);
    }

    const targetHeading = this.headings[targetIndex];
    this.scrollToHeading(targetHeading.id);
  }

  /**
   * TOCGeneratorインスタンスを完全に破棄し、リソースをクリーンアップ
   *
   * @method destroy
   * @memberof TOCGenerator
   * @description TOCGeneratorの全機能を停止し、作成した全てのDOM要素を削除し、
   *              メモリリークやパフォーマンスの問題を防ぐためにリソースを適切にクリーンアップします。
   *              ページ移動時やコンポーネント破棄時に呼び出してください。
   *
   * @example
   * // TOCGeneratorインスタンス破棄の実行例
   * const tocGenerator = new TOCGenerator();
   * // ... 使用 ...
   * tocGenerator.destroy();
   * // 結果：
   * // - Intersection Observerが停止・切断される
   * // - 目次パネルがDOMから完全削除
   * // - メインコンテンツのマージンがリセット
   * // - フローティングボタンがあれば削除
   *
   * @lifecycle コンポーネントのライフサイクル終了時に必ず呼び出してください
   * @cleanup メモリリーク防止とパフォーマンス最適化のための重要な処理
   * @since 1.0.0
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.tocElement) {
      this.tocElement.remove();
    }

    // フローティングボタンも削除
    this.hideFloatingButton();

    const content =
      document.querySelector('#markdown-content') || document.body;
    content.style.marginLeft = '';
    content.style.marginRight = '';
    content.style.marginTop = '';
  }
}

// Ensure class is available globally
window.TOCGenerator = TOCGenerator;
