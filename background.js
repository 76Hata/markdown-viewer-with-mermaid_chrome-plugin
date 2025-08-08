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
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Markdown Viewer with Mermaid onInstalled event:', details.reason);
    
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

function handleFirstInstall() {
    // Show welcome notification
    showWelcomeNotification();
    
    // Open setup guide after a short delay
    setTimeout(() => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('setup-guide.html')
        });
    }, 1000);
}

function handleUpdate(previousVersion) {
    console.log(`Updated from version ${previousVersion}`);
    // Could show update notification here if needed
}

// Show welcome notification with setup reminder
function showWelcomeNotification() {
    // Check if this is likely a development environment
    if (chrome.management) {
        chrome.management.getSelf((info) => {
            const isDevelopment = info.installType === 'development';
            console.log('Extension install type:', info.installType);
            
            if (!isDevelopment && chrome.notifications) {
                chrome.notifications.create('welcome', {
                    type: 'basic',
                    iconUrl: 'icons/mdvier-icon_48.png',
                    title: 'Markdown Viewer with Mermaid',
                    message: 'インストール完了！ローカルファイルで使用するには設定が必要です。',
                    buttons: [
                        { title: '設定を開く' },
                        { title: '後で設定' }
                    ]
                });
            } else {
                console.log('Development environment detected - skipping welcome notification');
            }
        });
    }
}

// Handle notification button clicks
if (chrome.notifications) {
    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
        if (notificationId === 'welcome') {
            if (buttonIndex === 0) {
                // Open extensions page
                chrome.tabs.create({
                    url: `chrome://extensions/?id=${chrome.runtime.id}`
                });
            }
            chrome.notifications.clear(notificationId);
        }
    });
}

// Context menu for easy access to settings
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'markdown-viewer-settings',
        title: 'Markdown Viewer 設定',
        contexts: ['action']
    });
    
    chrome.contextMenus.create({
        id: 'enable-file-access',
        title: 'ファイルアクセスを有効にする',
        contexts: ['action']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'markdown-viewer-settings' || info.menuItemId === 'enable-file-access') {
        chrome.tabs.create({
            url: `chrome://extensions/?id=${chrome.runtime.id}`
        });
    }
});

// Badge update based on file access status
function updateBadge() {
    try {
        if (chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
            const hasAccess = chrome.extension.isAllowedFileSchemeAccess();
            
            if (hasAccess) {
                chrome.action.setBadgeText({ text: '' });
                chrome.action.setTitle({ 
                    title: 'Markdown Viewer with Mermaid - ローカルファイル対応済み' 
                });
            } else {
                chrome.action.setBadgeText({ text: '!' });
                chrome.action.setBadgeBackgroundColor({ color: '#ff6b35' });
                chrome.action.setTitle({ 
                    title: 'Markdown Viewer with Mermaid - ファイルアクセス設定が必要' 
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

// Cipher auto-start functionality
function initializeCipher() {
    try {
        // Initialize cipher service on extension startup
        console.log('🔐 Initializing cipher service...');
        
        // Set up cipher auto-start
        chrome.storage.local.set({
            'cipher_auto_start': true,
            'cipher_initialized': Date.now()
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to set cipher config:', chrome.runtime.lastError);
            } else {
                console.log('✅ Cipher auto-start configured');
            }
        });
        
    } catch (error) {
        console.error('Cipher initialization failed:', error);
    }
}

// Start cipher service on extension startup
initializeCipher();

// テスト用の関数群（開発時のみ使用）
window.testFunctions = {
    // 通知テスト
    testWelcomeNotification: function() {
        console.log('🧪 Testing welcome notification...');
        if (chrome.notifications) {
            chrome.notifications.create('test-welcome', {
                type: 'basic',
                iconUrl: 'icons/mdvier-icon_48.png',
                title: 'Markdown Viewer with Mermaid [テスト]',
                message: '【テスト】インストール完了！ローカルファイルで使用するには設定が必要です。',
                buttons: [
                    { title: '設定を開く' },
                    { title: '後で設定' }
                ]
            });
        }
    },
    
    // セットアップガイド表示テスト
    testSetupGuide: function() {
        console.log('🧪 Testing setup guide...');
        chrome.tabs.create({
            url: chrome.runtime.getURL('setup-guide.html')
        });
    },
    
    // バッジ表示テスト
    testBadge: function() {
        console.log('🧪 Testing badge...');
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#ff6b35' });
        chrome.action.setTitle({ 
            title: 'Markdown Viewer with Mermaid - [テスト] ファイルアクセス設定が必要' 
        });
    },
    
    // バッジクリア
    clearBadge: function() {
        console.log('🧪 Clearing badge...');
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setTitle({ 
            title: 'Markdown Viewer with Mermaid' 
        });
    },
    
    // onInstalledイベントのシミュレート
    simulateInstall: function() {
        console.log('🧪 Simulating fresh install...');
        handleFirstInstall();
    },
    
    // Cipher関連テスト
    testCipherInit: function() {
        console.log('🧪 Testing cipher initialization...');
        initializeCipher();
    },
    
    testCipherStatus: function() {
        console.log('🧪 Testing cipher status check...');
        chrome.storage.local.get(['cipher_auto_start', 'cipher_initialized'], (result) => {
            console.log('Cipher status:', result);
        });
    }
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
    
    switch(request.action) {
        case 'initializeCipher':
            // Handle cipher initialization request
            initializeCipher();
            sendResponse({success: true, message: 'Cipher initialized'});
            break;
        case 'checkCipherStatus':
            // Check cipher service status
            chrome.storage.local.get(['cipher_auto_start', 'cipher_initialized'], (result) => {
                sendResponse({
                    success: true, 
                    autoStart: result.cipher_auto_start || false,
                    initialized: result.cipher_initialized || null
                });
            });
            return true;
        case 'checkFileAccess':
            // Handle file access permission check from content script
            try {
                chrome.management.getSelf((info) => {
                    if (chrome.runtime.lastError) {
                        console.error('Background: chrome.management.getSelf error:', chrome.runtime.lastError);
                        sendResponse({success: false, hasFileAccess: false});
                        return;
                    }
                    
                    const hasAccess = info.isAllowedFileSchemeAccess;
                    console.log('Background: File access permission check result:', hasAccess);
                    sendResponse({success: true, hasFileAccess: hasAccess});
                });
                return true; // 非同期レスポンスのため
            } catch (error) {
                console.error('Background: Error checking file access:', error);
                sendResponse({success: false, hasFileAccess: false});
            }
            break;
        case 'testNotification':
            window.testFunctions.testWelcomeNotification();
            sendResponse({success: true});
            break;
        case 'testSetupGuide':
            window.testFunctions.testSetupGuide();
            sendResponse({success: true});
            break;
        case 'testBadge':
            window.testFunctions.testBadge();
            sendResponse({success: true});
            break;
        case 'clearBadge':
            window.testFunctions.clearBadge();
            sendResponse({success: true});
            break;
        case 'simulateInstall':
            window.testFunctions.simulateInstall();
            sendResponse({success: true});
            break;
        default:
            console.log('Unknown action:', request.action);
            sendResponse({success: false});
    }
    
    return true; // Keep message channel open for async response
});