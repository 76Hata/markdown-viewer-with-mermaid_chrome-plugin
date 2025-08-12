/**
 * @fileoverview バックグラウンドサービスワーカー - Markdown Viewer with Mermaid Chrome拡張機能
 *
 * このファイルは、Chrome拡張機能「Markdown Viewer with Mermaid」のバックグラウンド処理を実装します。
 * インストール処理、通知管理、コンテキストメニュー、バッジ更新、ファイルアクセス権限チェックを行います。
 *
 * @author 76Hata
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires chrome.runtime - Chrome拡張機能ランタイムAPI
 * @requires chrome.notifications - Chrome通知API
 * @requires chrome.contextMenus - ChromeコンテキストメニューAPI
 * @requires chrome.action - Chrome拡張機能アクションAPI
 * @requires chrome.extension - Chrome拡張機能API
 */

/**
 * 拡張機能インストール時のイベントハンドラー
 *
 * @description 拡張機能のインストール、更新、再読み込み時に実行されます。
 *              初回インストール時にはウェルカム通知とセットアップガイドを表示し、
 *              更新時には更新通知を表示します。
 * ファースト インストールハンドラー
 */
chrome.runtime.onInstalled.addListener(details => {
  console.log(
    'Markdown Viewer with Mermaid onInstalled event:',
    details.reason
  );

  if (details.reason === 'install') {
    console.log('🎉 First time installation detected');
    handleFirstInstall();
  } else if (details.reason === 'update') {
    console.log('🔄 Extension updated');
    handleUpdate(details.previousVersion);
  } else {
    console.log('🔧 Extension reloaded (development)');
    // Don't show notifications during development
  }
});

/**
 * 初回インストール時の処理を実行する関数
 * 
 * @function handleFirstInstall
 * @description 拡張機能が初回インストールされた際に実行される処理を定義します。
 *              ウェルカム通知の表示と、1秒遅延後のセットアップガイド表示を行います。
 * @returns {void} 戻り値なし
 * @since 1.0.0
 * 
 * @example
 * // 初回インストール処理を手動実行
 * handleFirstInstall();
 */
function handleFirstInstall() {
  // Show welcome notification
  showWelcomeNotification();

  // Open setup guide after a short delay
  setTimeout(() => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('setup-guide.html'),
    });
  }, 1000);
}

/**
 * 拡張機能更新時の処理を実行する関数
 * 
 * @function handleUpdate
 * @description 拡張機能が更新された際に実行される処理を定義します。
 *              現在はログ出力のみですが、将来的に更新通知機能を実装可能です。
 * @param {string} previousVersion - 更新前のバージョン番号文字列
 * @returns {void} 戻り値なし
 * @since 1.0.0
 * 
 * @example
 * // 更新処理を手動実行（バージョン文字列を指定）
 * handleUpdate('1.9.0');
 */
function handleUpdate(previousVersion) {
  console.log(`Updated from version ${previousVersion}`);
  // Could show update notification here if needed
}

/**
 * ウェルカム通知を表示する関数
 * 
 * @function showWelcomeNotification
 * @description 拡張機能インストール後のウェルカム通知を表示します。
 *              開発環境では通知をスキップし、本番環境でのみ通知を表示します。
 *              通知にはセットアップリマインダーとアクションボタンが含まれます。
 * @returns {void} 戻り値なし
 * @since 1.0.0
 * 
 * @example
 * // ウェルカム通知を手動表示
 * showWelcomeNotification();
 */
function showWelcomeNotification() {
  // Check if this is likely a development environment
  if (chrome.management) {
    chrome.management.getSelf(info => {
      /** @type {boolean} 開発環境かどうかの判定フラグ */
      const isDevelopment = info.installType === 'development';
      console.log('Extension install type:', info.installType);

      if (!isDevelopment && chrome.notifications) {
        chrome.notifications.create('welcome', {
          type: 'basic',
          iconUrl: 'icons/mdvier-icon_48.png',
          title: 'Markdown Viewer with Mermaid',
          message:
            'インストール完了！ローカルファイルで使用するには設定が必要です。',
          buttons: [{ title: '設定を開く' }, { title: '後で設定' }],
        });
      } else {
        console.log(
          'Development environment detected - skipping welcome notification'
        );
      }
    });
  }
}

/**
 * 通知ボタンクリックイベントハンドラーの設定
 * 
 * @description Chrome通知APIのボタンクリックイベントをリッスンし、
 *              適切なアクションを実行します。ウェルカム通知の「設定を開く」
 *              ボタンクリック時には拡張機能設定ページを開きます。
 * @since 1.0.0
 */
if (chrome.notifications) {
  /**
   * 通知ボタンクリック時の処理
   * 
   * @param {string} notificationId - 通知の識別ID
   * @param {number} buttonIndex - クリックされたボタンのインデックス（0ベース）
   * @returns {void}
   */
  chrome.notifications.onButtonClicked.addListener(
    (notificationId, buttonIndex) => {
      if (notificationId === 'welcome') {
        if (buttonIndex === 0) {
          // Open extensions page
          chrome.tabs.create({
            url: `chrome://extensions/?id=${chrome.runtime.id}`,
          });
        }
        chrome.notifications.clear(notificationId);
      }
    }
  );
}

// Context menu for easy access to settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'markdown-viewer-settings',
    title: 'Markdown Viewer 設定',
    contexts: ['action'],
  });

  chrome.contextMenus.create({
    id: 'enable-file-access',
    title: 'ファイルアクセスを有効にする',
    contexts: ['action'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (
    info.menuItemId === 'markdown-viewer-settings' ||
    info.menuItemId === 'enable-file-access'
  ) {
    chrome.tabs.create({
      url: `chrome://extensions/?id=${chrome.runtime.id}`,
    });
  }
});

/**
 * バッジ表示をファイルアクセス状態に基づいて更新する関数
 * 
 * @function updateBadge
 * @description Chrome拡張機能のファイルアクセス権限状態をチェックし、
 *              拡張機能アイコンのバッジとツールチップを適切に更新します。
 *              アクセス権がある場合はバッジを非表示、ない場合は警告バッジを表示します。
 * @returns {void} 戻り値なし
 * @since 1.0.0
 * 
 * @example
 * // バッジを手動更新
 * updateBadge();
 * 
 * @see {@link https://developer.chrome.com/docs/extensions/reference/action/} Chrome Action API
 */
function updateBadge() {
  try {
    if (chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
      /** @type {boolean} ファイルアクセス権限の有無 */
      const hasAccess = chrome.extension.isAllowedFileSchemeAccess();

      if (hasAccess) {
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setTitle({
          title: 'Markdown Viewer with Mermaid - ローカルファイル対応済み',
        });
      } else {
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#ff6b35' });
        chrome.action.setTitle({
          title: 'Markdown Viewer with Mermaid - ファイルアクセス設定が必要',
        });
      }
    }
  } catch (error) {
    console.warn('Could not update badge:', error);
  }
}

// Update badge periodically
setInterval(updateBadge, 5000);

// Update badge on startup
updateBadge();

/**
 * Cipherサービスを初期化する関数
 * 
 * @function initializeCipher
 * @description Cipherサービスの自動起動機能を初期化し、
 *              ローカルストレージに設定を保存します。
 *              拡張機能起動時に実行され、自動起動フラグと初期化タイムスタンプを設定します。
 * @returns {void} 戻り値なし
 * @since 1.0.0
 * 
 * @example
 * // Cipher初期化を手動実行
 * initializeCipher();
 * 
 * @see {@link https://developer.chrome.com/docs/extensions/reference/storage/} Chrome Storage API
 */
function initializeCipher() {
  try {
    // Initialize cipher service on extension startup
    console.log('🔐 Initializing cipher service...');

    // Set up cipher auto-start
    chrome.storage.local.set(
      {
        /** @type {boolean} Cipher自動起動フラグ */
        cipher_auto_start: true,
        /** @type {number} 初期化実行時刻のタイムスタンプ */
        cipher_initialized: Date.now(),
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            'Failed to set cipher config:',
            chrome.runtime.lastError
          );
        } else {
          console.log('✅ Cipher auto-start configured');
        }
      }
    );
  } catch (error) {
    console.error('Cipher initialization failed:', error);
  }
}

// Start cipher service on extension startup
initializeCipher();

/**
 * テスト用関数群（開発・デバッグ用途）
 * 
 * @namespace testFunctions
 * @description 開発時のテストとデバッグに使用する関数群を提供します。
 *              本番環境でも利用可能ですが、主に開発者向けの機能です。
 * @since 1.0.0
 * 
 * @example
 * // コンソールからテスト実行
 * testFunctions.testWelcomeNotification();
 */
window.testFunctions = {
  /**
   * ウェルカム通知のテスト表示
   * 
   * @method testWelcomeNotification
   * @memberof testFunctions
   * @description テスト用のウェルカム通知を表示します。
   *              本番の通知と区別するため「[テスト]」マークが付きます。
   * @returns {void} 戻り値なし
   * @since 1.0.0
   * 
   * @example
   * // ウェルカム通知をテスト
   * testFunctions.testWelcomeNotification();
   */
  testWelcomeNotification: function () {
    console.log('🧪 Testing welcome notification...');
    if (chrome.notifications) {
      chrome.notifications.create('test-welcome', {
        type: 'basic',
        iconUrl: 'icons/mdvier-icon_48.png',
        title: 'Markdown Viewer with Mermaid [テスト]',
        message:
          '【テスト】インストール完了！ローカルファイルで使用するには設定が必要です。',
        buttons: [{ title: '設定を開く' }, { title: '後で設定' }],
      });
    }
  },

  /**
   * セットアップガイド表示のテスト
   * 
   * @method testSetupGuide
   * @memberof testFunctions
   * @description セットアップガイドページを新しいタブで開くテストを実行します。
   * @returns {void} 戻り値なし
   * @since 1.0.0
   */
  testSetupGuide: function () {
    console.log('🧪 Testing setup guide...');
    chrome.tabs.create({
      url: chrome.runtime.getURL('setup-guide.html'),
    });
  },

  /**
   * バッジ表示のテスト
   * 
   * @method testBadge
   * @memberof testFunctions
   * @description 警告バッジとタイトルを強制的に表示してテストします。
   * @returns {void} 戻り値なし
   * @since 1.0.0
   */
  testBadge: function () {
    console.log('🧪 Testing badge...');
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ff6b35' });
    chrome.action.setTitle({
      title:
        'Markdown Viewer with Mermaid - [テスト] ファイルアクセス設定が必要',
    });
  },

  /**
   * バッジをクリアする
   * 
   * @method clearBadge
   * @memberof testFunctions
   * @description 表示中のバッジを削除し、デフォルトタイトルに戻します。
   * @returns {void} 戻り値なし
   * @since 1.0.0
   */
  clearBadge: function () {
    console.log('🧪 Clearing badge...');
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({
      title: 'Markdown Viewer with Mermaid',
    });
  },

  /**
   * インストールイベントをシミュレート
   * 
   * @method simulateInstall
   * @memberof testFunctions
   * @description 初回インストール処理を手動実行してテストします。
   * @returns {void} 戻り値なし
   * @since 1.0.0
   */
  simulateInstall: function () {
    console.log('🧪 Simulating fresh install...');
    handleFirstInstall();
  },

  /**
   * Cipher初期化テスト
   * 
   * @method testCipherInit
   * @memberof testFunctions
   * @description Cipherサービスの初期化処理をテスト実行します。
   * @returns {void} 戻り値なし
   * @since 1.0.0
   */
  testCipherInit: function () {
    console.log('🧪 Testing cipher initialization...');
    initializeCipher();
  },

  /**
   * Cipher状態確認テスト
   * 
   * @method testCipherStatus
   * @memberof testFunctions
   * @description Cipherサービスの状態をローカルストレージから取得してコンソール出力します。
   * @returns {void} 戻り値なし
   * @since 1.0.0
   */
  testCipherStatus: function () {
    console.log('🧪 Testing cipher status check...');
    chrome.storage.local.get(
      ['cipher_auto_start', 'cipher_initialized'],
      result => {
        console.log('Cipher status:', result);
      }
    );
  },
};

// コンソールからテストできるように
console.log('🧪 Test functions available:');
console.log('- testFunctions.testWelcomeNotification()');
console.log('- testFunctions.testSetupGuide()');
console.log('- testFunctions.testBadge()');
console.log('- testFunctions.clearBadge()');
console.log('- testFunctions.simulateInstall()');
console.log('- testFunctions.testCipherInit()');
console.log('- testFunctions.testCipherStatus()');

// Message handling for popup and content script communication (Manifest V3)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  switch (request.action) {
    case 'initializeCipher':
      // Handle cipher initialization request
      initializeCipher();
      sendResponse({ success: true, message: 'Cipher initialized' });
      break;
    case 'checkCipherStatus':
      // Check cipher service status
      chrome.storage.local.get(
        ['cipher_auto_start', 'cipher_initialized'],
        result => {
          sendResponse({
            success: true,
            autoStart: result.cipher_auto_start || false,
            initialized: result.cipher_initialized || null,
          });
        }
      );
      return true;
    case 'checkFileAccess':
      // Handle file access permission check from content script
      try {
        chrome.management.getSelf(info => {
          if (chrome.runtime.lastError) {
            console.error(
              'Background: chrome.management.getSelf error:',
              chrome.runtime.lastError
            );
            sendResponse({ success: false, hasFileAccess: false });
            return;
          }

          const hasAccess = info.isAllowedFileSchemeAccess;
          console.log(
            'Background: File access permission check result:',
            hasAccess
          );
          sendResponse({ success: true, hasFileAccess: hasAccess });
        });
        return true; // 非同期レスポンスのため
      } catch (error) {
        console.error('Background: Error checking file access:', error);
        sendResponse({ success: false, hasFileAccess: false });
      }
      break;
    case 'testNotification':
      window.testFunctions.testWelcomeNotification();
      sendResponse({ success: true });
      break;
    case 'testSetupGuide':
      window.testFunctions.testSetupGuide();
      sendResponse({ success: true });
      break;
    case 'testBadge':
      window.testFunctions.testBadge();
      sendResponse({ success: true });
      break;
    case 'clearBadge':
      window.testFunctions.clearBadge();
      sendResponse({ success: true });
      break;
    case 'simulateInstall':
      window.testFunctions.simulateInstall();
      sendResponse({ success: true });
      break;
    default:
      console.log('Unknown action:', request.action);
      sendResponse({ success: false });
  }

  return true; // Keep message channel open for async response
});
