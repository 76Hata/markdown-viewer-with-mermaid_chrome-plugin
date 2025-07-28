let mermaidCounter = 0;

function initializeMermaid() {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true
        }
    });
}

function processMermaidDiagrams(html) {
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    
    return html.replace(mermaidRegex, (match, mermaidCode) => {
        const id = `mermaid-${mermaidCounter++}`;
        return `<div class="mermaid" id="${id}">${mermaidCode.trim()}</div>`;
    });
}

async function renderMermaidDiagrams() {
    const mermaidElements = document.querySelectorAll('.mermaid');
    
    for (const element of mermaidElements) {
        try {
            const graphDefinition = element.textContent.trim();
            const { svg } = await mermaid.render(`graph-${element.id}`, graphDefinition);
            element.innerHTML = svg;
        } catch (error) {
            console.error('Mermaid rendering error:', error);
            element.innerHTML = `<pre style="color: red;">Mermaid diagram error: ${error.message}</pre>`;
        }
    }
}

function renderMarkdown(markdownText) {
    const renderer = new marked.Renderer();
    
    renderer.code = function(code, language) {
        if (language === 'mermaid') {
            const id = `mermaid-${mermaidCounter++}`;
            return `<div class="mermaid" id="${id}">${code}</div>`;
        }
        return `<pre><code class="language-${language || ''}">${marked.escape(code)}</code></pre>`;
    };
    
    marked.setOptions({
        renderer: renderer,
        highlight: function(code, lang) {
            return code;
        },
        pedantic: false,
        gfm: true,
        breaks: false,
        sanitize: false,
        smartLists: true,
        smartypants: false,
        xhtml: false
    });
    
    let html = marked.parse(markdownText);
    html = processMermaidDiagrams(html);
    
    return html;
}

async function displayMarkdown(content) {
    const container = document.getElementById('markdown-content');
    const html = renderMarkdown(content);
    container.innerHTML = html;
    
    await renderMermaidDiagrams();
}

window.addEventListener('message', async function(event) {
    if (event.data.type === 'markdown') {
        await displayMarkdown(event.data.content);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    initializeMermaid();
});