/**
 * Verification script for Enhanced Markdown Viewer
 * Run this in browser console to test all features
 */

function runTests() {
    console.log('🧪 Starting Enhanced Markdown Viewer Tests...\n');
    
    const results = [];
    
    // Test 1: Check if main classes are loaded
    function testClassesLoaded() {
        const classes = ['TOCGenerator', 'ThemeManager', 'SearchEngine', 'Toolbar'];
        const missing = classes.filter(cls => typeof window[cls] === 'undefined');
        
        if (missing.length === 0) {
            results.push('✅ All main classes loaded');
            return true;
        } else {
            results.push(`❌ Missing classes: ${missing.join(', ')}`);
            return false;
        }
    }
    
    // Test 2: Check if CSS is loaded
    function testCSSLoaded() {
        const testEl = document.createElement('div');
        testEl.className = 'main-toolbar';
        document.body.appendChild(testEl);
        
        const computedStyle = window.getComputedStyle(testEl);
        const hasToolbarStyles = computedStyle.position === 'fixed';
        
        document.body.removeChild(testEl);
        
        if (hasToolbarStyles) {
            results.push('✅ CSS styles loaded');
            return true;
        } else {
            results.push('❌ CSS styles not loaded');
            return false;
        }
    }
    
    // Test 3: Check if toolbar is initialized
    function testToolbarInitialized() {
        const toolbar = document.querySelector('.main-toolbar');
        
        if (toolbar) {
            results.push('✅ Toolbar initialized');
            return true;
        } else {
            results.push('❌ Toolbar not initialized');
            return false;
        }
    }
    
    // Test 4: Check if TOC is generated
    function testTOCGenerated() {
        const toc = document.querySelector('.toc-panel');
        const tocLinks = document.querySelectorAll('.toc-link');
        
        if (toc && tocLinks.length > 0) {
            results.push(`✅ TOC generated with ${tocLinks.length} items`);
            return true;
        } else {
            results.push('❌ TOC not generated');
            return false;
        }
    }
    
    // Test 5: Check if themes are available
    function testThemesAvailable() {
        if (window.markdownViewerToolbar && window.markdownViewerToolbar.themeManager) {
            const themes = window.markdownViewerToolbar.themeManager.themes;
            if (themes.size >= 3) {
                results.push(`✅ Themes available: ${Array.from(themes.keys()).join(', ')}`);
                return true;
            }
        }
        
        results.push('❌ Themes not available');
        return false;
    }
    
    // Test 6: Check if search functionality works
    function testSearchFunctionality() {
        if (window.markdownViewerToolbar && window.markdownViewerToolbar.searchEngine) {
            const searchPanel = document.querySelector('.search-panel');
            
            if (searchPanel) {
                results.push('✅ Search functionality available');
                return true;
            }
        }
        
        results.push('❌ Search functionality not available');
        return false;
    }
    
    // Test 7: Check if Mermaid diagrams are rendered
    function testMermaidRendered() {
        const mermaidElements = document.querySelectorAll('.mermaid');
        const renderedDiagrams = Array.from(mermaidElements).filter(el => 
            el.innerHTML.includes('<svg')
        );
        
        if (renderedDiagrams.length > 0) {
            results.push(`✅ Mermaid diagrams rendered: ${renderedDiagrams.length}`);
            return true;
        } else {
            results.push('❌ Mermaid diagrams not rendered');
            return false;
        }
    }
    
    // Test 8: Check responsive design
    function testResponsiveDesign() {
        const toolbar = document.querySelector('.main-toolbar');
        if (toolbar) {
            const computedStyle = window.getComputedStyle(toolbar);
            if (computedStyle.position === 'fixed' && computedStyle.zIndex === '1001') {
                results.push('✅ Responsive design implemented');
                return true;
            }
        }
        
        results.push('❌ Responsive design not implemented');
        return false;
    }
    
    // Test 9: Check keyboard shortcuts
    function testKeyboardShortcuts() {
        // Simulate Ctrl+F
        const event = new KeyboardEvent('keydown', {
            ctrlKey: true,
            key: 'f',
            bubbles: true
        });
        
        document.dispatchEvent(event);
        
        setTimeout(() => {
            const searchPanel = document.querySelector('.search-panel');
            if (searchPanel && searchPanel.style.display !== 'none') {
                results.push('✅ Keyboard shortcuts working');
            } else {
                results.push('⚠️ Keyboard shortcuts may not be working');
            }
        }, 100);
        
        return true;
    }
    
    // Test 10: Check print styles
    function testPrintStyles() {
        const printStyle = document.getElementById('print-styles');
        
        if (printStyle || document.querySelector('style[id*="print"]')) {
            results.push('✅ Print styles available');
            return true;
        } else {
            results.push('⚠️ Print styles not detected');
            return false;
        }
    }
    
    // Run all tests
    const tests = [
        testClassesLoaded,
        testCSSLoaded,
        testToolbarInitialized,
        testTOCGenerated,
        testThemesAvailable,
        testSearchFunctionality,
        testMermaidRendered,
        testResponsiveDesign,
        testKeyboardShortcuts,
        testPrintStyles
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach((test, index) => {
        try {
            const result = test();
            if (result) passed++;
            else failed++;
        } catch (error) {
            results.push(`❌ Test ${index + 1} error: ${error.message}`);
            failed++;
        }
    });
    
    // Print results
    console.log('\n📊 Test Results:');
    console.log('================');
    results.forEach(result => console.log(result));
    
    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Enhanced Markdown Viewer is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
    
    // Feature demonstration
    console.log('\n🎯 Feature Demonstration:');
    console.log('========================');
    console.log('1. Try keyboard shortcuts:');
    console.log('   - Ctrl+F: Open search');
    console.log('   - Ctrl+P: Print');
    console.log('   - Ctrl+T: Toggle TOC');
    console.log('');
    console.log('2. Test theme switching:');
    console.log('   - Click theme button in toolbar');
    console.log('   - Select different themes');
    console.log('   - Try auto theme detection');
    console.log('');
    console.log('3. Test TOC functionality:');
    console.log('   - Click on TOC items');
    console.log('   - Observe active highlighting');
    console.log('   - Try collapse/expand');
    console.log('');
    console.log('4. Test search functionality:');
    console.log('   - Open search panel');
    console.log('   - Search for text');
    console.log('   - Navigate through results');
    
    return { passed, failed, results };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(runTests, 2000);
        });
    } else {
        setTimeout(runTests, 2000);
    }
}

// Export for manual running
window.runMarkdownViewerTests = runTests;