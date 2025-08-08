document.addEventListener('DOMContentLoaded', function () {
  checkFileAccessStatus();
  checkCipherStatus();
  setupEventListeners();
});

function checkFileAccessStatus() {
  const statusContainer = document.getElementById('status-container');

  try {
    // Try to check file access permission
    if (chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
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
      // API not available (Manifest V3 or other restrictions)
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

function checkCipherStatus() {
  // Check cipher service status
  chrome.runtime.sendMessage(
    { action: 'checkCipherStatus' },
    function (response) {
      const cipherContainer = document.getElementById(
        'cipher-status-container'
      );
      if (!cipherContainer) {
        // Create cipher status container if it doesn't exist
        const statusContainer = document.getElementById('status-container');
        const cipherDiv = document.createElement('div');
        cipherDiv.id = 'cipher-status-container';
        statusContainer.parentNode.insertBefore(
          cipherDiv,
          statusContainer.nextSibling
        );
      }

      const container = document.getElementById('cipher-status-container');
      if (response && response.success) {
        if (response.autoStart) {
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

function setupEventListeners() {
  // Open extensions page
  document
    .getElementById('open-extensions')
    .addEventListener('click', function () {
      chrome.tabs.create({
        url: 'chrome://extensions/?id=' + chrome.runtime.id,
      });
      window.close();
    });

  // Open test file
  document.getElementById('test-file').addEventListener('click', function () {
    const testFileUrl = chrome.runtime.getURL('test-file-access.md');
    chrome.tabs.create({
      url: testFileUrl,
    });
    window.close();
  });

  // Toggle debug section
  document
    .getElementById('toggle-debug')
    .addEventListener('click', function () {
      const debugSection = document.getElementById('debug-section');
      const toggleButton = document.getElementById('toggle-debug');

      if (debugSection.style.display === 'none') {
        debugSection.style.display = 'block';
        toggleButton.textContent = '🧪 デバッグ機能を隠す';
      } else {
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

// Refresh status every few seconds when popup is open
setInterval(() => {
  checkFileAccessStatus();
  checkCipherStatus();
}, 3000);
