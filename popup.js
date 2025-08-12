/**
 * @fileoverview Popup Script - Markdown Viewer with Mermaid Chrome拡張機能
 * 
 * このファイルは、Chrome拡張機能のポップアップウィンドウの動作を制御します。
 * ファイルアクセス権限の確認、Cipher状態の確認、各種テスト機能の提供を行います。
 * 
 * @author 76Hata
 * @version 2.0.0
 * @since 1.0.0
 * 
 * @requires chrome.extension - Chrome拡張機能API
 * @requires chrome.runtime - Chrome拡張機能ランタイムAPI
 * @requires chrome.tabs - Chrome拡張機能タブAPI
 */

/**
 * DOMContentLoadedイベントリスナー
 * ポップアップウィンドウが読み込み完了したときに実行される初期化関数
 * 
 * @description ファイルアクセス状態の確認、Cipher状態の確認、イベントリスナーの設定を行います
 * @listens DOMContentLoaded
 * @since 1.0.0
 */
document.addEventListener('DOMContentLoaded', function () {
  checkFileAccessStatus();
  checkCipherStatus();
  setupEventListeners();
});

/**
 * ファイルアクセス権限の状態を確認して表示する関数
 * 
 * @description Chrome拡張機能の「ファイルのURLへのアクセスを許可する」設定を確認し、
 *              ポップアップウィンドウに適切な状態メッセージを表示します。
 * @function checkFileAccessStatus
 * @since 1.0.0
 * 
 * @returns {void} 戻り値なし。DOM要素を直接更新します。
 * 
 * @example
 * // ファイルアクセス権限の状態を手動で再確認する場合
 * checkFileAccessStatus();
 */
function checkFileAccessStatus() {
  /** @type {HTMLElement} ステータスメッセージを表示するコンテナ要素 */
  const statusContainer = document.getElementById('status-container');

  try {
    // Chrome拡張機能APIを使用してファイルアクセス権限をチェック
    if (chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
      /** @type {boolean} ファイルアクセス権限の有無 */
      const hasAccess = chrome.extension.isAllowedFileSchemeAccess();

      if (hasAccess) {
        statusContainer.innerHTML = `
                    <div class="status working">
                        ✅ ローカルファイルアクセス: 有効
                        <br><small>Markdownファイルを開いて使用できます</small>
                    </div>
                `;
      } else {
        statusContainer.innerHTML = `
                    <div class="status needs-setup">
                        ⚠️ ローカルファイルアクセス: 無効
                        <br><small>設定が必要です</small>
                    </div>
                `;
      }
    } else {
      // Manifest V3やその他の制限によりAPIが利用できない場合
      statusContainer.innerHTML = `
                <div class="status needs-setup">
                    ❓ ファイルアクセス状態: 確認できません
                    <br><small>設定を確認してください</small>
                </div>
            `;
    }
  } catch (error) {
    console.error('Error checking file access status:', error);
    statusContainer.innerHTML = `
            <div class="status needs-setup">
                ⚠️ 設定確認中にエラーが発生しました
                <br><small>手動で設定を確認してください</small>
            </div>
        `;
  }
}

/**
 * Cipherサービスの状態を確認して表示する関数
 * 
 * @description バックグラウンドスクリプトにメッセージを送信してCipherサービスの
 *              自動起動設定と初期化状態を確認し、ポップアップに表示します。
 * @function checkCipherStatus
 * @since 1.0.0
 * 
 * @returns {void} 戻り値なし。DOM要素を直接更新します。
 * 
 * @example
 * // Cipherサービスの状態を手動で再確認する場合
 * checkCipherStatus();
 */
function checkCipherStatus() {
  // バックグラウンドスクリプトにCipherサービスの状態確認を要求
  chrome.runtime.sendMessage(
    { action: 'checkCipherStatus' },
    function (response) {
      /** @type {HTMLElement|null} Cipher状態表示用コンテナ */
      const cipherContainer = document.getElementById(
        'cipher-status-container'
      );
      if (!cipherContainer) {
        // Cipher状態表示コンテナが存在しない場合は作成
        const statusContainer = document.getElementById('status-container');
        const cipherDiv = document.createElement('div');
        cipherDiv.id = 'cipher-status-container';
        statusContainer.parentNode.insertBefore(
          cipherDiv,
          statusContainer.nextSibling
        );
      }

      /** @type {HTMLElement} Cipher状態表示用コンテナ */
      const container = document.getElementById('cipher-status-container');
      if (response && response.success) {
        if (response.autoStart) {
          /** @type {string} 初期化日時の文字列表記 */
          const initDate = response.initialized
            ? new Date(response.initialized).toLocaleString()
            : '不明';
          container.innerHTML = `
                    <div class="status working">
                        🔐 Cipher: 自動起動有効
                        <br><small>初期化済み (${initDate})</small>
                    </div>
                `;
        } else {
          container.innerHTML = `
                    <div class="status needs-setup">
                        🔐 Cipher: 未設定
                        <br><small>自動起動を有効にしてください</small>
                    </div>
                `;
        }
      } else {
        container.innerHTML = `
                <div class="status needs-setup">
                    🔐 Cipher: 状態確認エラー
                    <br><small>設定を確認してください</small>
                </div>
            `;
      }
    }
  );
}

/**
 * イベントリスナーを設定する関数
 * 
 * @description ポップアップウィンドウ内の各ボタンとUI要素にイベントリスナーを設定し、
 *              ユーザーの操作に応じた処理を定義します。
 * @function setupEventListeners
 * @since 1.0.0
 * 
 * @returns {void} 戻り値なし
 * 
 * @example
 * // ポップアップ初期化時に呼び出される
 * setupEventListeners();
 */
function setupEventListeners() {
  // Chrome拡張機能設定ページを開く
  document
    .getElementById('open-extensions')
    .addEventListener('click', function () {
      chrome.tabs.create({
        url: 'chrome://extensions/?id=' + chrome.runtime.id,
      });
      window.close();
    });

  // テストファイルを開く
  document.getElementById('test-file').addEventListener('click', function () {
    /** @type {string} テストファイルのURL */
    const testFileUrl = chrome.runtime.getURL('test-file-access.md');
    chrome.tabs.create({
      url: testFileUrl,
    });
    window.close();
  });

  // デバッグセクションの表示/非表示を切り替え
  document
    .getElementById('toggle-debug')
    .addEventListener('click', function () {
      /** @type {HTMLElement} デバッグセクション要素 */
      const debugSection = document.getElementById('debug-section');
      
      /** @type {HTMLElement} 切り替えボタン要素 */
      const toggleButton = document.getElementById('toggle-debug');

      if (debugSection.style.display === 'none') {
        // デバッグセクションを表示
        debugSection.style.display = 'block';
        toggleButton.textContent = '🧪 デバッグ機能を隠す';
      } else {
        // デバッグセクションを非表示
        debugSection.style.display = 'none';
        toggleButton.textContent = '🧪 デバッグ機能を表示';
      }
    });

  // Debug/Test functions
  document
    .getElementById('test-notification')
    .addEventListener('click', function () {
      chrome.runtime.getBackgroundPage(backgroundPage => {
        if (backgroundPage && backgroundPage.testFunctions) {
          backgroundPage.testFunctions.testWelcomeNotification();
        } else {
          // Fallback: send message to background script
          chrome.runtime.sendMessage({ action: 'testNotification' });
        }
      });
      window.close();
    });

  document
    .getElementById('test-setup-guide')
    .addEventListener('click', function () {
      chrome.runtime.getBackgroundPage(backgroundPage => {
        if (backgroundPage && backgroundPage.testFunctions) {
          backgroundPage.testFunctions.testSetupGuide();
        } else {
          chrome.runtime.sendMessage({ action: 'testSetupGuide' });
        }
      });
      window.close();
    });

  document.getElementById('test-badge').addEventListener('click', function () {
    chrome.runtime.getBackgroundPage(backgroundPage => {
      if (backgroundPage && backgroundPage.testFunctions) {
        backgroundPage.testFunctions.testBadge();
      } else {
        chrome.runtime.sendMessage({ action: 'testBadge' });
      }
    });
    window.close();
  });

  document.getElementById('clear-badge').addEventListener('click', function () {
    chrome.runtime.getBackgroundPage(backgroundPage => {
      if (backgroundPage && backgroundPage.testFunctions) {
        backgroundPage.testFunctions.clearBadge();
      } else {
        chrome.runtime.sendMessage({ action: 'clearBadge' });
      }
    });
    window.close();
  });

  // Cipher test functions
  document
    .getElementById('test-cipher-init')
    ?.addEventListener('click', function () {
      chrome.runtime.sendMessage(
        { action: 'initializeCipher' },
        function (response) {
          if (response && response.success) {
            console.log('Cipher initialization requested');
            // Refresh cipher status after a short delay
            setTimeout(checkCipherStatus, 500);
          }
        }
      );
    });

  document
    .getElementById('test-cipher-status')
    ?.addEventListener('click', function () {
      checkCipherStatus();
    });
}

/**
 * 定期的な状態更新処理
 * 
 * @description ポップアップが開いている間、3秒おきに
 *              ファイルアクセス権限とCipherサービスの状態を更新します。
 * @type {number} インターバルID（必要に応じてクリア可能）
 * @since 1.0.0
 * 
 * @example
 * // インターバルをクリアする場合
 * clearInterval(_statusUpdateInterval);
 */
const _statusUpdateInterval = setInterval(() => {
  checkFileAccessStatus();
  checkCipherStatus();
}, 3000);
