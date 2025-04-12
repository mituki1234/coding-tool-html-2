// モナコエディタの設定と初期化
const initializeEditor = () => {
    // モナコエディタのロード
    require.config({
        paths: {
            'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
        }
    });

    require(['vs/editor/editor.main'], function() {
        // デフォルトのモナコテーマをカスタマイズ
        monaco.editor.defineTheme('customTheme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'tag', foreground: 'ff6b6b' },  // HTML要素
                { token: 'attribute.name', foreground: '4d96ff' }, // CSS属性
                { token: 'keyword', foreground: 'ffd166' } // JavaScript構文
            ],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#e1e1e1',
                'editorCursor.foreground': '#61dafb',
                'editor.lineHighlightBackground': '#2d2d3055',
                'editor.selectionBackground': '#61dafb33'
            }
        });

        // 初期ファイル作成とエディタ初期化（rootフォルダに配置）
        createNewFile('root/index.html', getDefaultHTML());
        createNewFile('root/style.css', getDefaultCSS());
        createNewFile('root/script.js', getDefaultJS());

        // ファイルツリーを更新
        updateFileTree();
        
        // rootフォルダを自動的に開く
        setTimeout(() => {
            const rootFolder = document.querySelector('.folder-toggle');
            if (rootFolder) {
                rootFolder.click();
            }
            
            // 最初のHTMLファイルを開く
            openFile('root/index.html');
        }, 100);
    });
};
// プロジェクトの状態を管理するオブジェクト
const projectState = {
    files: {},
    activeFile: null,
    lastHtmlFile: null,  // 最後に開いたHTMLファイル
    autoPreviewEnabled: true, // 自動プレビューの有効/無効状態
    fileStructure: {
        name: 'root',
        type: 'folder',
        children: []
    }
};

// エディタインスタンスを保持する変数
let editor = null;

// デフォルトのファイル内容を返す関数
function getDefaultHTML() {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Welcome to Web Code Editor</h1>
    <p>Start coding your amazing project!</p>
    
    <script src="script.js"></script>
</body>
</html>`;
}

function getDefaultCSS() {
    return `body {
    font-family: 'Segoe UI', sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
    color: #333;
}

h1 {
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
}

p {
    font-size: 18px;
}`;
}

function getDefaultJS() {
    return `// Welcome to the JavaScript file
console.log('Hello from Web Code Editor!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    
    // You can write your JavaScript code here
});`;
}

// 新しいファイルを作成する関数
function createNewFile(filename, content = '') {
    // ファイルをプロジェクト状態に追加
    projectState.files[filename] = {
        name: filename,
        content: content,
        language: getLanguageFromFilename(filename)
    };

    // ファイル構造にファイルを追加
    addFileToStructure(filename);

    // タブの作成
    addFileTab(filename);

    // ファイルツリーの更新
    updateFileTree();
}

// ファイル名から言語を判定する関数
function getLanguageFromFilename(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
        case 'html':
            return 'html';
        case 'css':
            return 'css';
        case 'js':
            return 'javascript';
        case 'json':
            return 'json';
        case 'md':
            return 'markdown';
        default:
            return 'plaintext';
    }
}

// ファイルをファイル構造に追加する関数
function addFileToStructure(filename) {
    // パスの解析
    const parts = filename.split('/');
    let currentLevel = projectState.fileStructure;

    // ディレクトリが存在しない場合は作成
    for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        let folderExists = false;
        
        for (let j = 0; j < currentLevel.children.length; j++) {
            if (currentLevel.children[j].name === folderName && currentLevel.children[j].type === 'folder') {
                currentLevel = currentLevel.children[j];
                folderExists = true;
                break;
            }
        }
        
        if (!folderExists) {
            const newFolder = {
                name: folderName,
                type: 'folder',
                children: []
            };
            currentLevel.children.push(newFolder);
            currentLevel = newFolder;
        }
    }

    // ファイルを追加
    const fileName = parts[parts.length - 1];
    const fileExists = currentLevel.children.some(child => child.name === fileName && child.type === 'file');
    
    if (!fileExists) {
        currentLevel.children.push({
            name: fileName,
            type: 'file',
            path: filename
        });
    }
}

// ファイルタブを追加する関数
function addFileTab(filename) {
    const tabsContainer = document.getElementById('editor-tabs');
    
    // タブの作成
    const tab = document.createElement('div');
    tab.className = 'editor-tab';
    tab.dataset.filename = filename;
    
    // ファイルアイコンとファイル名
    const fileExt = filename.split('.').pop().toLowerCase();
    tab.innerHTML = `
        <i class="fa-regular fa-file file-icon ${fileExt}"></i>
        <span>${filename}</span>
        <span class="tab-close">×</span>
    `;
    
    // タブクリックイベント
    tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
            closeFile(filename);
        } else {
            openFile(filename);
        }
    });
    
    tabsContainer.appendChild(tab);
}

// ファイルツリーを更新する関数
function updateFileTree() {
    const fileTreeContainer = document.getElementById('file-tree');
    fileTreeContainer.innerHTML = '';
    
    // ルートフォルダの内容を再帰的に表示
    const treeContent = generateFileTreeHTML(projectState.fileStructure.children);
    fileTreeContainer.innerHTML = treeContent;
    
    // ファイルクリックイベントの追加
    const fileItems = fileTreeContainer.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', () => {
            const filePath = item.dataset.path;
            if (projectState.files[filePath]) {
                openFile(filePath);
            }
        });
    });
    
    // フォルダトグルイベントの追加
    const folderToggles = fileTreeContainer.querySelectorAll('.folder-toggle');
    folderToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const folderItem = e.target.closest('.folder-item');
            const folderContent = folderItem.nextElementSibling;
            
            if (folderContent.style.display === 'none') {
                folderContent.style.display = 'block';
                e.target.classList.replace('fa-folder', 'fa-folder-open');
            } else {
                folderContent.style.display = 'none';
                e.target.classList.replace('fa-folder-open', 'fa-folder');
            }
            
            e.stopPropagation();
        });
    });
}

// ファイルツリーのHTML生成（再帰関数）
function generateFileTreeHTML(items, level = 0) {
    if (!items || items.length === 0) return '';
    
    let html = '<ul' + (level === 0 ? ' class="root-tree"' : '') + '>';
    
    // フォルダを先に表示
    const folders = items.filter(item => item.type === 'folder');
    const files = items.filter(item => item.type === 'file');
    
    // フォルダの処理
    folders.forEach(folder => {
        html += `
            <li>
                <div class="folder-item">
                    <i class="fa-solid fa-folder folder-toggle"></i>
                    <span>${folder.name}</span>
                </div>
                <div class="folder-children" style="display: none;">
                    ${generateFileTreeHTML(folder.children, level + 1)}
                </div>
            </li>
        `;
    });
    
    // ファイルの処理
    files.forEach(file => {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const iconClass = getFileIconClass(fileExt);
        
        html += `
            <li>
                <div class="file-item" data-path="${file.path}">
                    <i class="fa-regular fa-file file-icon ${fileExt}"></i>
                    <span>${file.name}</span>
                </div>
            </li>
        `;
    });
    
    html += '</ul>';
    return html;
}

// ファイル拡張子からアイコンクラスを取得
function getFileIconClass(ext) {
    switch (ext) {
        case 'html':
            return 'html';
        case 'css':
            return 'css';
        case 'js':
            return 'js';
        case 'json':
            return 'json';
        default:
            return '';
    }
}

// ファイルを開く関数
function openFile(filename) {
    if (!projectState.files[filename]) return;
    
    // 現在のファイル内容を保存（編集中の場合）
    saveCurrentFile();
    
    // 新しいファイルをアクティブにする
    projectState.activeFile = filename;
    
    // HTMLファイルを開く場合、最後に開いたHTMLファイルとして記録
    if (filename.toLowerCase().endsWith('.html')) {
        projectState.lastHtmlFile = filename;
    }
    
    // タブをアクティブにする
    const tabs = document.querySelectorAll('.editor-tab');
    tabs.forEach(tab => {
        if (tab.dataset.filename === filename) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // ファイルツリーでもファイルをアクティブにする
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        if (item.dataset.path === filename) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // エディタの内容を更新
    updateEditor();
    
    // プレビューを更新
    updatePreview();
}

// 現在開いているファイルの内容を保存する関数
function saveCurrentFile() {
    if (!projectState.activeFile || !editor) return;
    
    // 現在のエディタの内容を保存
    projectState.files[projectState.activeFile].content = editor.getValue();
}

// エディタの内容を更新する関数
function updateEditor() {
    const file = projectState.files[projectState.activeFile];
    if (!file) return;
    
    // エディタが既に初期化されている場合は内容とモデルを変更
    if (editor) {
        const model = monaco.editor.createModel(
            file.content,
            file.language
        );
        editor.setModel(model);
    } else {
        // エディタの初期化
        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: file.content,
            language: file.language,
            theme: 'customTheme',
            automaticLayout: true,
            minimap: {
                enabled: true
            },
            scrollBeyondLastLine: false,
            fontSize: parseInt(document.getElementById('font-size').value),
            fontFamily: 'Fira Code, Consolas, Monaco, monospace',
            fontLigatures: true
        });
        
        // 変更イベントのリスナーを追加
        editor.onDidChangeModelContent(() => {
            // 自動保存
            saveCurrentFile();
            // 自動プレビュー更新
            updatePreview();
        });
    }
}

// プレビューを更新する関数
function updatePreview() {
    // 自動プレビューがオフの場合は更新しない
    if (projectState.autoPreviewEnabled === false) return;
    
    // アクティブなファイルの取得
    const activeFile = projectState.activeFile;
    let htmlFileToPreview = null;
    
    // HTMLファイルを特定する
    if (activeFile && activeFile.toLowerCase().endsWith('.html')) {
        // アクティブファイルがHTMLなら直接それを使用
        htmlFileToPreview = activeFile;
    } else {
        // 直近に開いたHTMLファイルを使用（あれば）
        htmlFileToPreview = projectState.lastHtmlFile;
        
        if (!htmlFileToPreview && activeFile) {
            // 同じディレクトリにHTMLがあれば使用
            const dir = activeFile.substring(0, activeFile.lastIndexOf('/') + 1);
            
            for (const filename in projectState.files) {
                if (filename.toLowerCase().endsWith('.html') && filename.startsWith(dir)) {
                    htmlFileToPreview = filename;
                    break;
                }
            }
        }
        
        // それでもなければindex.htmlを探す
        if (!htmlFileToPreview) {
            if (projectState.files['root/index.html']) {
                htmlFileToPreview = 'root/index.html';
            } else {
                // プロジェクト内の任意のHTMLファイルを探す
                for (const filename in projectState.files) {
                    if (filename.toLowerCase().endsWith('.html')) {
                        htmlFileToPreview = filename;
                        break;
                    }
                }
            }
        }
    }
    
    // プレビューするHTMLファイルが見つかったかどうか
    if (!htmlFileToPreview || !projectState.files[htmlFileToPreview]) {
        showNoPreviewMessage();
        return;
    }
    
    // HTMLファイルが見つかった場合は記憶しておく
    projectState.lastHtmlFile = htmlFileToPreview;
    
    // HTMLコンテンツの取得
    const htmlContent = projectState.files[htmlFileToPreview].content;
    const iframe = document.getElementById('preview-iframe');
    
    // ファイルパスを記憶して相対パスの解決に使用
    const htmlFilePath = htmlFileToPreview;
    
    // HTMLを処理（相対パスの解決も行う）
    let processedHTML = processHTML(htmlContent, htmlFilePath);
    
    // iframeの内容を更新
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(processedHTML);
    iframeDoc.close();
    
    // コンソールリダイレクト
    redirectConsole(iframe);
    
    // プレビューパネルのタイトルを更新
    updatePreviewTitle(htmlFileToPreview);
}

// プレビューするHTMLがない場合のメッセージ表示
function showNoPreviewMessage() {
    const iframe = document.getElementById('preview-iframe');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    iframeDoc.open();
    iframeDoc.write(`
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f5f5f5;
                    color: #333;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .message {
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: white;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    max-width: 80%;
                }
            </style>
        </head>
        <body>
            <div class="message">
                <h2>プレビューするHTMLファイルがありません</h2>
                <p>HTMLファイルを開くか作成してください</p>
            </div>
        </body>
        </html>
    `);
    iframeDoc.close();
    
    // プレビューパネルのタイトルをリセット
    updatePreviewTitle(null);
}

// プレビュータイトルの更新
function updatePreviewTitle(htmlFilePath) {
    const previewTitle = document.getElementById('preview-title');
    if (previewTitle) {
        if (htmlFilePath) {
            previewTitle.textContent = `プレビュー: ${htmlFilePath}`;
        } else {
            previewTitle.textContent = 'プレビュー';
        }
    }
}

// processHTML関数を改善して、HTMLファイル内のスクリプトを安全に実行
function processHTML(html, htmlFilePath) {
    // ファイルのディレクトリパスを取得
    const dirPath = htmlFilePath ? htmlFilePath.substring(0, htmlFilePath.lastIndexOf('/') + 1) : '';
    
    // CSSのインライン化（相対パスを考慮）
    html = html.replace(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
        // 絶対パスやCDNの場合はそのまま
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
            return match;
        }
        
        // 相対パスの解決
        const cssPath = resolveRelativePath(dirPath, href);
        
        if (projectState.files[cssPath] && cssPath.toLowerCase().endsWith('.css')) {
            // プロジェクト内のCSSファイルをインライン化
            return `<style>/* ${cssPath} */\n${projectState.files[cssPath].content}</style>`;
        }
        
        // 該当ファイルが見つからなければそのまま返す
        return match;
    });
    
    // JavaScriptのインライン化（相対パスを考慮）
    html = html.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi, (match, src) => {
        // 絶対パスやCDNの場合はそのまま
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
            return match;
        }
        
        // 相対パスの解決
        const jsPath = resolveRelativePath(dirPath, src);
        
        if (projectState.files[jsPath] && jsPath.toLowerCase().endsWith('.js')) {
            // プロジェクト内のJSファイルをインライン化 - スコープ保護のため即時関数で囲む
            return `<script>
            /* ${jsPath} */
            (function() {
                ${projectState.files[jsPath].content}
            })();
            </script>`;
        }
        
        // 該当ファイルが見つからなければそのまま返す
        return match;
    });
    
    // 変数再宣言の問題を回避するため、ヘッドに防止スクリプトを追加
    html = html.replace('</head>', `
        <script>
        // 変数再宣言エラーを防止するため、iframeリロード時にグローバル変数をクリア
        if (window._previewInitialized) {
            // 2回目以降のロード - キャンバス要素などをクリア
            document.addEventListener('DOMContentLoaded', function() {
                // すでに存在するcanvasなどの要素を処理
                console.log('Preview refreshed - clearing previous state');
            });
        } else {
            // 初回ロード
            window._previewInitialized = true;
        }
        </script>
        </head>
    `);
    
    return html;
}

// プレビュー更新関数の修正
function updatePreview() {
    // 自動プレビューがオフの場合は更新しない
    if (projectState.autoPreviewEnabled === false) return;
    
    // アクティブなファイルの取得
    const activeFile = projectState.activeFile;
    let htmlFileToPreview = null;
    
    // HTMLファイルを特定する
    if (activeFile && activeFile.toLowerCase().endsWith('.html')) {
        // アクティブファイルがHTMLなら直接それを使用
        htmlFileToPreview = activeFile;
    } else {
        // 直近に開いたHTMLファイルを使用（あれば）
        htmlFileToPreview = projectState.lastHtmlFile;
        
        if (!htmlFileToPreview && activeFile) {
            // 同じディレクトリにHTMLがあれば使用
            const dir = activeFile.substring(0, activeFile.lastIndexOf('/') + 1);
            
            for (const filename in projectState.files) {
                if (filename.toLowerCase().endsWith('.html') && filename.startsWith(dir)) {
                    htmlFileToPreview = filename;
                    break;
                }
            }
        }
        
        // それでもなければindex.htmlを探す
        if (!htmlFileToPreview) {
            if (projectState.files['root/index.html']) {
                htmlFileToPreview = 'root/index.html';
            } else {
                // プロジェクト内の任意のHTMLファイルを探す
                for (const filename in projectState.files) {
                    if (filename.toLowerCase().endsWith('.html')) {
                        htmlFileToPreview = filename;
                        break;
                    }
                }
            }
        }
    }
    
    // プレビューするHTMLファイルが見つかったかどうか
    if (!htmlFileToPreview || !projectState.files[htmlFileToPreview]) {
        showNoPreviewMessage();
        return;
    }
    
    // HTMLファイルが見つかった場合は記憶しておく
    projectState.lastHtmlFile = htmlFileToPreview;
    
    // HTMLコンテンツの取得
    const htmlContent = projectState.files[htmlFileToPreview].content;
    const iframe = document.getElementById('preview-iframe');
    
    try {
        // ファイルパスを記憶して相対パスの解決に使用
        const htmlFilePath = htmlFileToPreview;
        
        // HTMLを処理（相対パスの解決も行う）
        let processedHTML = processHTML(htmlContent, htmlFilePath);
        
        // 既存のiframeをリセットし、新しいiframeに入れ替える（変数再宣言問題を回避）
        const newIframe = document.createElement('iframe');
        newIframe.id = 'preview-iframe';
        newIframe.className = 'preview-iframe';
        
        // 親ノードが存在する場合、既存のiframeと入れ替え
        if (iframe.parentNode) {
            iframe.parentNode.replaceChild(newIframe, iframe);
        }
        
        // 新しいiframeにコンテンツを書き込み
        const iframeDoc = newIframe.contentDocument || newIframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(processedHTML);
        iframeDoc.close();
        
        // コンソールリダイレクト
        redirectConsole(newIframe);
        
        // プレビューパネルのタイトルを更新
        updatePreviewTitle(htmlFileToPreview);
    } catch (error) {
        console.error('プレビュー更新中にエラーが発生しました:', error);
        
        // エラーメッセージを表示
        const errorHTML = `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #2d2d30;
                        color: #e1e1e1;
                        padding: 20px;
                        margin: 0;
                    }
                    .error {
                        background-color: rgba(255, 0, 0, 0.1);
                        border-left: 4px solid #ff6b6b;
                        padding: 10px;
                        margin-bottom: 10px;
                        border-radius: 0 4px 4px 0;
                    }
                    pre {
                        background-color: #1e1e1e;
                        padding: 10px;
                        border-radius: 4px;
                        overflow: auto;
                    }
                </style>
            </head>
            <body>
                <h2>プレビューエラー</h2>
                <div class="error">
                    <p>${error.message}</p>
                    <pre>${error.stack}</pre>
                </div>
                <p>HTMLファイル内のコードにエラーがあります。修正してください。</p>
            </body>
            </html>
        `;
        
        // エラー表示用のiframeを新しく作成
        const errorIframe = document.createElement('iframe');
        errorIframe.id = 'preview-iframe';
        errorIframe.className = 'preview-iframe';
        
        if (iframe.parentNode) {
            iframe.parentNode.replaceChild(errorIframe, iframe);
        }
        
        const errorDoc = errorIframe.contentDocument || errorIframe.contentWindow.document;
        errorDoc.open();
        errorDoc.write(errorHTML);
        errorDoc.close();
    }
}

// redirectConsole関数を修正して、エラーハンドリングを改善
function redirectConsole(iframe) {
    try {
        const consoleOutput = document.getElementById('console-output');
        
        // まずグローバルエラーハンドラを設定
        iframe.contentWindow.addEventListener('error', (event) => {
            addConsoleMessage(`${event.message} at line ${event.lineno}:${event.colno}`, 'error');
            event.preventDefault();  // エラーの伝播を停止
        });
        
        // コンソールメソッドの上書き
        iframe.contentWindow.console.log = function() {
            const args = Array.from(arguments);
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return arg;
            }).join(' ');
            
            addConsoleMessage(message, 'info');
        };
        
        iframe.contentWindow.console.error = function() {
            const args = Array.from(arguments);
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return arg;
            }).join(' ');
            
            addConsoleMessage(message, 'error');
        };
        
        iframe.contentWindow.console.warn = function() {
            const args = Array.from(arguments);
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return arg;
            }).join(' ');
            
            addConsoleMessage(message, 'warning');
        };
    } catch (error) {
        console.error('コンソールリダイレクト中にエラーが発生しました:', error);
    }
}
// 相対パスを解決する関数
function resolveRelativePath(basePath, relativePath) {
    // ../などを含む相対パスを解決
    if (relativePath.startsWith('/')) {
        // ルートからの絶対パス
        return relativePath.substring(1);
    }
    
    // 通常の相対パス
    const pathParts = basePath.split('/').filter(Boolean);
    const relativeParts = relativePath.split('/');
    
    // パスコンポーネントを処理
    for (const part of relativeParts) {
        if (part === '.') {
            continue;
        } else if (part === '..') {
            if (pathParts.length > 0) {
                pathParts.pop();
            }
        } else {
            pathParts.push(part);
        }
    }
    
    // 解決されたパスを返す
    return pathParts.join('/');
}

// プレビューiframeのコンソール出力をリダイレクトする関数
function redirectConsole(iframe) {
    const consoleOutput = document.getElementById('console-output');
    
    // iframeのコンソールメソッドをオーバーライド
    iframe.contentWindow.console.log = function() {
        const args = Array.from(arguments);
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return arg;
        }).join(' ');
        
        addConsoleMessage(message, 'info');
    };
    
    iframe.contentWindow.console.error = function() {
        const args = Array.from(arguments);
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return arg;
        }).join(' ');
        
        addConsoleMessage(message, 'error');
    };
    
    iframe.contentWindow.console.warn = function() {
        const args = Array.from(arguments);
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return arg;
        }).join(' ');
        
        addConsoleMessage(message, 'warning');
    };
    
    // エラーハンドリング
    iframe.contentWindow.addEventListener('error', (event) => {
        addConsoleMessage(`${event.message} at line ${event.lineno}:${event.colno}`, 'error');
    });
}

// コンソールにメッセージを追加する関数
function addConsoleMessage(message, type = 'info') {
    const consoleOutput = document.getElementById('console-output');
    const messageEl = document.createElement('div');
    messageEl.className = `console-message console-${type}`;
    messageEl.textContent = message;
    consoleOutput.appendChild(messageEl);
    
    // 自動スクロール
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// ファイルを閉じる関数
function closeFile(filename) {
    // ファイルが開いていない場合は何もしない
    if (!projectState.files[filename]) return;
    
    // タブの削除
    const tabs = document.querySelectorAll('.editor-tab');
    tabs.forEach(tab => {
        if (tab.dataset.filename === filename) {
            tab.remove();
        }
    });
    
    // アクティブファイルの更新
    if (projectState.activeFile === filename) {
        projectState.activeFile = null;
        
        // 他のタブをアクティブにする
        const remainingTabs = document.querySelectorAll('.editor-tab');
        if (remainingTabs.length > 0) {
            const newActiveFile = remainingTabs[0].dataset.filename;
            openFile(newActiveFile);
        } else {
            // タブがなくなった場合はエディタをクリア
            if (editor) {
                editor.setValue('');
            }
        }
    }
}

// 新規ファイルをダイアログで作成する関数
function createNewFileDialog() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '新規ファイル作成';
    modalBody.innerHTML = `
        <div class="modal-form">
            <div class="form-group">
                <label for="new-file-name">ファイル名:</label>
                <input type="text" id="new-file-name" placeholder="例: page.html">
            </div>
            <div class="form-group">
                <label for="new-file-content">内容:</label>
                <textarea id="new-file-content" rows="10"></textarea>
            </div>
            <div class="modal-buttons">
                <button class="btn btn-secondary" id="modal-cancel">キャンセル</button>
                <button class="btn btn-primary" id="modal-create">作成</button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    
    // キャンセルボタン
    document.getElementById('modal-cancel').addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // 閉じるボタン
    document.getElementById('modal-close').addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // 作成ボタン
    document.getElementById('modal-create').addEventListener('click', () => {
        const filename = document.getElementById('new-file-name').value.trim();
        const content = document.getElementById('new-file-content').value;
        
        if (filename) {
            createNewFile(filename, content);
            openFile(filename);
            modal.classList.remove('show');
        } else {
            alert('ファイル名を入力してください');
        }
    });
}

// 新規フォルダを作成する関数
function createNewFolderDialog() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '新規フォルダ作成';
    modalBody.innerHTML = `
        <div class="modal-form">
            <div class="form-group">
                <label for="new-folder-name">フォルダ名:</label>
                <input type="text" id="new-folder-name" placeholder="例: images">
            </div>
            <div class="modal-buttons">
                <button class="btn btn-secondary" id="modal-cancel">キャンセル</button>
                <button class="btn btn-primary" id="modal-create">作成</button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    
    // キャンセルボタン
    document.getElementById('modal-cancel').addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // 閉じるボタン
    document.getElementById('modal-close').addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // 作成ボタン
    document.getElementById('modal-create').addEventListener('click', () => {
        const folderName = document.getElementById('new-folder-name').value.trim();
        
        if (folderName) {
            // フォルダ構造にフォルダを追加
            const newFolder = {
                name: folderName,
                type: 'folder',
                children: []
            };
            
            projectState.fileStructure.children.push(newFolder);
            updateFileTree();
            modal.classList.remove('show');
        } else {
            alert('フォルダ名を入力してください');
        }
    });
}

// ファイルをダウンロードする関数
function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
}

// プロジェクト全体をZIPファイルとしてダウンロードする関数
function downloadProject() {
    // 外部ライブラリが必要 - JSZipを使用
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    document.head.appendChild(script);
    
    script.onload = function() {
        const zip = new JSZip();
        
        // ファイルを追加
        for (const filename in projectState.files) {
            zip.file(filename, projectState.files[filename].content);
        }
        
        // ZIPを生成
        zip.generateAsync({type: 'blob'}).then(function(content) {
            const element = document.createElement('a');
            element.href = URL.createObjectURL(content);
            element.download = 'project.zip';
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        });
    };
}

// ファイルアップロード関数
function uploadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    input.addEventListener('change', (event) => {
        const files = event.target.files;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                createNewFile(file.name, content);
            };
            
            reader.readAsText(file);
        }
    });
    
    input.click();
}

// フォルダアップロード関数
function uploadFolder() {
    // フォルダアップロード用の入力要素を作成
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true; // Webkitブラウザ用
    input.directory = true; // Firefox用
    input.multiple = true;
    
    // アップロード進捗を表示するためのモーダルを表示
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = 'フォルダをアップロード中...';
    
    // ファイル選択ダイアログを表示
    input.addEventListener('change', (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // アップロード開始を表示
        modalBody.innerHTML = `
            <div class="upload-progress">
                <div class="progress-text">フォルダ構造を分析中...</div>
                <div class="progress-bar-container">
                    <div id="progress-bar" class="progress-bar"></div>
                </div>
                <div id="progress-status">0/${files.length} ファイル</div>
            </div>
        `;
        modal.classList.add('show');
        
        // ファイル処理を少し遅らせて、UIを更新する時間を確保
        setTimeout(() => {
            processFiles(files);
        }, 100);
    });
    
    // ファイル選択ダイアログを表示
    input.click();
    
    // アップロードされたファイルを処理する関数
    async function processFiles(files) {
        const progressBar = document.getElementById('progress-bar');
        const progressStatus = document.getElementById('progress-status');
        const progressText = document.querySelector('.progress-text');
        
        // フォルダ構造の分析
        const folders = {};
        let rootFolder = null;
        
        // 最も短いパスを持つフォルダをルートとして特定
        let shortestPath = Infinity;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const path = file.webkitRelativePath || file.relativePath || file.mozRelativePath || file.name;
            const parts = path.split('/');
            
            if (parts.length > 0 && parts.length < shortestPath) {
                shortestPath = parts.length;
                rootFolder = parts[0];
            }
        }
        
        progressText.textContent = `${rootFolder} フォルダを処理中...`;
        
        // ファイルを順番に処理
        let processedCount = 0;
        
        // フォルダ構造を先に作成
        const uniqueFolders = new Set();
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const path = file.webkitRelativePath || file.relativePath || file.mozRelativePath || file.name;
            const parts = path.split('/');
            
            // パスからファイル名を除いたフォルダパスを構築
            if (parts.length > 1) {
                for (let j = 1; j < parts.length; j++) {
                    const folderPath = parts.slice(0, j).join('/');
                    if (!uniqueFolders.has(folderPath)) {
                        uniqueFolders.add(folderPath);
                    }
                }
            }
        }
        
        // フォルダ構造を作成（ルートフォルダは既に存在するものとする）
        progressText.textContent = 'フォルダ構造を作成中...';
        
        // 一時的なファイル読み込み集合
        const filePromises = [];
        
        // ファイルを順番に処理
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const path = file.webkitRelativePath || file.relativePath || file.mozRelativePath || file.name;
            
            filePromises.push(new Promise((resolve) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const content = e.target.result;
                    
                    // ファイルをプロジェクトに追加
                    createNewFile(path, content);
                    
                    // 進捗を更新
                    processedCount++;
                    progressBar.style.width = `${(processedCount / files.length) * 100}%`;
                    progressStatus.textContent = `${processedCount}/${files.length} ファイル`;
                    progressText.textContent = `${path} を処理中...`;
                    
                    resolve();
                };
                
                reader.onerror = () => {
                    console.error(`ファイルの読み込みに失敗しました: ${path}`);
                    processedCount++;
                    progressBar.style.width = `${(processedCount / files.length) * 100}%`;
                    progressStatus.textContent = `${processedCount}/${files.length} ファイル (エラー発生)`;
                    resolve();
                };
                
                // ファイル内容を取得（テキストファイルのみ）
                try {
                    if (isTextFile(file)) {
                        reader.readAsText(file);
                    } else {
                        // バイナリファイルの場合は未対応と表示
                        addConsoleMessage(`バイナリファイル ${path} はサポートされていません`, 'warning');
                        processedCount++;
                        progressBar.style.width = `${(processedCount / files.length) * 100}%`;
                        progressStatus.textContent = `${processedCount}/${files.length} ファイル`;
                        resolve();
                    }
                } catch (err) {
                    console.error(`ファイル ${path} の処理中にエラーが発生しました:`, err);
                    processedCount++;
                    progressBar.style.width = `${(processedCount / files.length) * 100}%`;
                    progressStatus.textContent = `${processedCount}/${files.length} ファイル (エラー発生)`;
                    resolve();
                }
            }));
        }
        
        // すべてのファイルが処理されるのを待つ
        await Promise.all(filePromises);
        
        // 完了後の処理
        progressText.textContent = 'アップロード完了';
        
        // 少し待機してからモーダルを閉じる
        setTimeout(() => {
            modal.classList.remove('show');
            
            // ファイルツリーを更新
            updateFileTree();
            
            // 成功メッセージをコンソールに表示
            addConsoleMessage(`${rootFolder} フォルダのアップロードが完了しました。${processedCount}個のファイルが処理されました。`, 'info');
            
            // もしindex.htmlがあれば開く
            if (projectState.files[`${rootFolder}/index.html`]) {
                openFile(`${rootFolder}/index.html`);
            }
        }, 1000);
    }
    
    // テキストファイルかどうかを判定する関数
    function isTextFile(file) {
        // ファイルの拡張子をチェック
        const fileName = file.name.toLowerCase();
        const textExtensions = [
            '.txt', '.html', '.htm', '.css', '.js', '.json', '.md', '.xml', '.svg',
            '.less', '.scss', '.sass', '.styl', '.jsx', '.ts', '.tsx', '.vue', '.php',
            '.py', '.rb', '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rust', '.sh',
            '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.log'
        ];
        
        for (const ext of textExtensions) {
            if (fileName.endsWith(ext)) {
                return true;
            }
        }
        
        // MIMEタイプをチェック（可能な場合）
        const mimeType = file.type;
        if (mimeType && mimeType.startsWith('text/')) {
            return true;
        }
        
        // サイズが大きすぎるファイルはバイナリとみなす（任意）
        // テキストファイルはMB単位で読み込みが遅くなるため
        if (file.size > 1024 * 1024 * 2) { // 2MB以上
            return false;
        }
        
        // 判断できない場合はテキストファイルと仮定
        return true;
    }
}

// リサイズハンドルの初期化
function initResizeHandles() {
    // 水平リサイズハンドル
    const horizontalHandles = document.querySelectorAll('.horizontal-handle');
    horizontalHandles.forEach(handle => {
        let startX, startWidth, resizeTarget;
        let isResizing = false; // リサイズ中かどうかのフラグを追加
        
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            // リサイズ対象の決定
            resizeTarget = handle.closest('.panel');
            
            // 初期位置と幅を記憶
            startX = e.clientX;
            startWidth = resizeTarget.offsetWidth;
            
            // リサイズ中フラグをオンに
            isResizing = true;
            
            // マウスの移動イベントを追加
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
        
        function resize(e) {
            // リサイズ中フラグがオフならリサイズしない
            if (!isResizing || !resizeTarget) return;
            
            const panel = resizeTarget.classList;
            let newWidth;
            
            if (panel.contains('file-explorer')) {
                // 左パネルは右にドラッグすると幅が増加
                newWidth = startWidth + (e.clientX - startX);
            } else if (panel.contains('preview-panel')) {
                // 右パネルは左にドラッグすると幅が増加
                newWidth = startWidth - (e.clientX - startX);
            }
            
            if (newWidth >= 100 && newWidth <= window.innerWidth * 0.8) {
                resizeTarget.style.width = `${newWidth}px`;
            }
        }
        
        function stopResize() {
            // リサイズ中フラグをオフに
            isResizing = false;
            
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    });
    
    // 垂直リサイズハンドル
    const verticalHandles = document.querySelectorAll('.vertical-handle');
    verticalHandles.forEach(handle => {
        let startY, startHeight, resizeTarget;
        let isResizing = false; // リサイズ中フラグを追加
        
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            // リサイズ対象の決定
            resizeTarget = handle.closest('.panel');
            
            // 初期位置と高さを記憶
            startY = e.clientY;
            startHeight = resizeTarget.offsetHeight;
            
            // リサイズ中フラグをオンに
            isResizing = true;
            
            // マウスの移動イベントを追加
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
        
        function resize(e) {
            // リサイズ中フラグがオフならリサイズしない
            if (!isResizing || !resizeTarget) return;
            
            const panel = resizeTarget.classList;
            let newHeight;
            
            if (panel.contains('console-panel')) {
                // 下部パネルは上にドラッグすると高さが増加
                newHeight = startHeight - (e.clientY - startY);
            }
            
            if (newHeight >= 100 && newHeight <= window.innerHeight * 0.5) {
                resizeTarget.style.height = `${newHeight}px`;
            }
        }
        
        function stopResize() {
            // リサイズ中フラグをオフに
            isResizing = false;
            
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    });
}

// パネル折りたたみトグルの初期化
function initPanelToggles() {
    const toggleButtons = document.querySelectorAll('.panel-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const panelId = button.id.replace('collapse-', '');
            const panel = document.querySelector(`.${panelId}-panel`);
            
            if (panel) {
                panel.classList.toggle('collapsed');
                
                // アイコン変更
                const icon = button.querySelector('i');
                if (icon) {
                    // 方向に応じてアイコンを変更
                    if (panelId === 'explorer') {
                        icon.classList.toggle('fa-angles-left');
                        icon.classList.toggle('fa-angles-right');
                    } else if (panelId === 'preview') {
                        icon.classList.toggle('fa-angles-right');
                        icon.classList.toggle('fa-angles-left');
                    } else if (panelId === 'console') {
                        icon.classList.toggle('fa-angles-down');
                        icon.classList.toggle('fa-angles-up');
                    }
                }
            }
        });
    });
}

// フォントサイズ変更の初期化
function initFontSizeChange() {
    const fontSizeSelect = document.getElementById('font-size');
    fontSizeSelect.addEventListener('change', () => {
        if (editor) {
            const newSize = parseInt(fontSizeSelect.value);
            editor.updateOptions({ fontSize: newSize });
        }
    });
}

// プレビューサイズ変更の初期化
function initPreviewSizeChange() {
    const previewSizeSelect = document.getElementById('preview-size');
    const previewIframe = document.getElementById('preview-iframe');
    
    previewSizeSelect.addEventListener('change', () => {
        const value = previewSizeSelect.value;
        
        // 値に応じてiframeの幅を変更
        if (value === 'responsive') {
            previewIframe.style.width = '100%';
        } else if (value === 'mobile') {
            previewIframe.style.width = '375px';
        } else if (value === 'tablet') {
            previewIframe.style.width = '768px';
        } else if (value === 'desktop') {
            previewIframe.style.width = '1200px';
        }
        
        // プレビューパネルの幅が足りない場合はスクロール可能に
        const previewPanel = document.querySelector('.preview-panel .panel-content');
        previewPanel.style.overflowX = value !== 'responsive' ? 'auto' : 'hidden';
    });
}

// デタッチ可能なプレビューの初期化
function initDetachablePreview() {
    const detachButton = document.getElementById('detach-preview');
    let previewWindow = null;
    
    detachButton.addEventListener('click', () => {
        // 現在のファイル内容を保存
        saveCurrentFile();
        
        // 現在プレビュー中のHTMLファイルを特定
        let htmlFileToPreview = null;
        const activeFile = projectState.activeFile;
        
        // HTMLファイルを特定する（updatePreview関数と同じロジック）
        if (activeFile && activeFile.toLowerCase().endsWith('.html')) {
            // アクティブファイルがHTMLなら直接それを使用
            htmlFileToPreview = activeFile;
        } else {
            // 最後に開いたHTMLファイルを使用（あれば）
            htmlFileToPreview = projectState.lastHtmlFile;
            
            if (!htmlFileToPreview && activeFile) {
                // 同じディレクトリにHTMLがあれば使用
                const dir = activeFile.substring(0, activeFile.lastIndexOf('/') + 1);
                
                for (const filename in projectState.files) {
                    if (filename.toLowerCase().endsWith('.html') && filename.startsWith(dir)) {
                        htmlFileToPreview = filename;
                        break;
                    }
                }
            }
            
            // それでもなければindex.htmlを探す
            if (!htmlFileToPreview) {
                if (projectState.files['root/index.html']) {
                    htmlFileToPreview = 'root/index.html';
                } else {
                    // プロジェクト内の任意のHTMLファイルを探す
                    for (const filename in projectState.files) {
                        if (filename.toLowerCase().endsWith('.html')) {
                            htmlFileToPreview = filename;
                            break;
                        }
                    }
                }
            }
        }
        
        // HTMLが見つからなかった場合はメッセージを表示
        if (!htmlFileToPreview || !projectState.files[htmlFileToPreview]) {
            addConsoleMessage('プレビューするHTMLファイルが見つかりません', 'error');
            return;
        }
        
        try {
            // 新しいウィンドウを開くか、既存のウィンドウにフォーカス
            if (!previewWindow || previewWindow.closed) {
                // プレビューウィンドウを開く
                previewWindow = window.open('', 'webCodeEditorPreview', 'width=800,height=600');
                
                // HTMLを処理してCSSとJSを含めたものを作成
                const htmlContent = projectState.files[htmlFileToPreview].content;
                const processedHTML = processHTML(htmlContent, htmlFileToPreview);
                
                // 新しいウィンドウに書き込み
                previewWindow.document.open();
                previewWindow.document.write(processedHTML);
                previewWindow.document.close();
                
                // ウィンドウにタイトルを設定
                previewWindow.document.title = `プレビュー: ${htmlFileToPreview}`;
                
                // ウィンドウが閉じられたとき、変数をリセット
                previewWindow.addEventListener('beforeunload', () => {
                    previewWindow = null;
                });
                
                // エディタ更新時にプレビューも更新する機能を追加
                if (editor) {
                    const updateHandler = editor.onDidChangeModelContent(() => {
                        // ウィンドウが閉じられていたらリスナーを削除
                        if (!previewWindow || previewWindow.closed) {
                            updateHandler.dispose();
                            return;
                        }
                        
                        // 現在のファイルを保存
                        saveCurrentFile();
                        
                        // 関連するHTMLファイルの内容を再取得
                        const newHTML = projectState.files[htmlFileToPreview].content;
                        const newProcessedHTML = processHTML(newHTML, htmlFileToPreview);
                        
                        // プレビューを更新
                        try {
                            previewWindow.document.open();
                            previewWindow.document.write(newProcessedHTML);
                            previewWindow.document.close();
                        } catch (err) {
                            console.error('プレビューウィンドウ更新中にエラーが発生しました:', err);
                            addConsoleMessage('プレビューウィンドウの更新に失敗しました', 'error');
                        }
                    });
                }
                
                // 成功メッセージ
                addConsoleMessage(`${htmlFileToPreview} を別ウィンドウでプレビュー中`, 'info');
            } else {
                // 既存のウィンドウにフォーカス
                previewWindow.focus();
                
                // 既存のウィンドウのコンテンツを更新
                const htmlContent = projectState.files[htmlFileToPreview].content;
                const processedHTML = processHTML(htmlContent, htmlFileToPreview);
                
                previewWindow.document.open();
                previewWindow.document.write(processedHTML);
                previewWindow.document.close();
                
                addConsoleMessage('プレビューウィンドウを更新しました', 'info');
            }
        } catch (err) {
            console.error('プレビューウィンドウ作成中にエラーが発生しました:', err);
            addConsoleMessage('プレビューウィンドウの作成に失敗しました', 'error');
        }
    });
}

// ドラッグ&ドロップでのファイル追加
function initDragAndDrop() {
    // ドラッグイベントの抑制
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // ドラッグエフェクト
    ['dragenter', 'dragover'].forEach(eventName => {
        document.body.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        document.body.classList.add('drop-zone');
        
        // ドロップ指示メッセージを表示
        if (!document.getElementById('drop-message')) {
            const message = document.createElement('div');
            message.id = 'drop-message';
            message.className = 'drop-message';
            message.innerHTML = '<i class="fa-solid fa-upload"></i><div>ファイルやフォルダをドロップしてアップロード</div>';
            document.body.appendChild(message);
        }
    }
    
    function unhighlight() {
        document.body.classList.remove('drop-zone');
        
        // ドロップ指示メッセージを削除
        const message = document.getElementById('drop-message');
        if (message) {
            message.remove();
        }
    }
    
    // ドロップ処理
    document.body.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        
        // webkitGetAsEntryでフォルダをサポート
        if (dt.items && dt.items.length > 0) {
            const entries = [];
            
            // アイテムからエントリを取得
            for (let i = 0; i < dt.items.length; i++) {
                const entry = dt.items[i].webkitGetAsEntry();
                if (entry) {
                    entries.push(entry);
                }
            }
            
            // アップロード状態モーダルの表示
            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            
            modalTitle.textContent = 'ファイル/フォルダをアップロード中...';
            modalBody.innerHTML = `
                <div class="upload-progress">
                    <div class="progress-text">処理を開始中...</div>
                    <div class="progress-bar-container">
                        <div id="progress-bar" class="progress-bar"></div>
                    </div>
                    <div id="progress-status">準備中...</div>
                </div>
            `;
            modal.classList.add('show');
            
            // エントリを処理
            if (entries.length > 0) {
                processEntries(entries);
            } else {
                // 通常のファイルドロップ
                processFiles(dt.files);
                modal.classList.remove('show');
            }
        } else {
            // 通常のファイルドロップ
            processFiles(dt.files);
        }
    }
    
    // ファイル処理関数
    function processFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                createNewFile(file.name, content);
                
                addConsoleMessage(`ファイル ${file.name} がアップロードされました`, 'info');
            };
            
            if (isTextFile(file)) {
                reader.readAsText(file);
            } else {
                addConsoleMessage(`バイナリファイル ${file.name} はサポートされていません`, 'warning');
            }
        }
    }
    
    // エントリ（フォルダまたはファイル）の処理
    async function processEntries(entries) {
        // 読み込まれたすべてのファイルを追跡
        const allFiles = [];
        
        // エントリを再帰的に処理するためのプロミスを作成
        const readEntry = async (entry, path = '') => {
            return new Promise((resolve) => {
                if (entry.isFile) {
                    // ファイルエントリを処理
                    entry.file(file => {
                        // ファイルにパス情報を追加
                        file.relativePath = path + entry.name;
                        allFiles.push(file);
                        resolve();
                    }, () => {
                        console.error(`ファイル ${entry.name} の読み込みに失敗しました`);
                        resolve();
                    });
                } else if (entry.isDirectory) {
                    // ディレクトリの内容を読み込む
                    const dirReader = entry.createReader();
                    const readEntries = () => {
                        dirReader.readEntries(async (entries) => {
                            if (entries.length === 0) {
                                resolve();
                            } else {
                                // すべてのエントリを処理
                                const promises = entries.map(e => 
                                    readEntry(e, path + entry.name + '/')
                                );
                                await Promise.all(promises);
                                
                                // 追加のエントリがないか確認（ディレクトリリーダーの制限による）
                                readEntries();
                            }
                        }, () => {
                            console.error(`ディレクトリ ${entry.name} の読み込みに失敗しました`);
                            resolve();
                        });
                    };
                    readEntries();
                }
            });
        };
        
        // プログレスバーと状態テキスト
        const progressBar = document.getElementById('progress-bar');
        const progressStatus = document.getElementById('progress-status');
        const progressText = document.querySelector('.progress-text');
        
        progressText.textContent = 'フォルダ構造を分析中...';
        
        // エントリを処理
        try {
            const promises = entries.map(entry => readEntry(entry));
            await Promise.all(promises);
            
            // ファイルが取得できたら処理
            if (allFiles.length > 0) {
                progressText.textContent = 'ファイルを処理中...';
                progressStatus.textContent = `0/${allFiles.length} ファイル`;
                
                // ファイルを処理
                let processedCount = 0;
                
                for (const file of allFiles) {
                    await new Promise(resolve => {
                        if (isTextFile(file)) {
                            const reader = new FileReader();
                            
                            reader.onload = (e) => {
                                const content = e.target.result;
                                createNewFile(file.relativePath, content);
                                
                                // 進捗更新
                                processedCount++;
                                progressBar.style.width = `${(processedCount / allFiles.length) * 100}%`;
                                progressStatus.textContent = `${processedCount}/${allFiles.length} ファイル`;
                                progressText.textContent = `${file.relativePath} を処理中...`;
                                
                                resolve();
                            };
                            
                            reader.onerror = () => {
                                console.error(`ファイル ${file.relativePath} の読み込みに失敗しました`);
                                processedCount++;
                                progressBar.style.width = `${(processedCount / allFiles.length) * 100}%`;
                                progressStatus.textContent = `${processedCount}/${allFiles.length} ファイル (エラー発生)`;
                                resolve();
                            };
                            
                            reader.readAsText(file);
                        } else {
                            // バイナリファイル
                            addConsoleMessage(`バイナリファイル ${file.relativePath} はサポートされていません`, 'warning');
                            processedCount++;
                            progressBar.style.width = `${(processedCount / allFiles.length) * 100}%`;
                            progressStatus.textContent = `${processedCount}/${allFiles.length} ファイル`;
                            resolve();
                        }
                    });
                }
                
                // 完了
                progressText.textContent = 'アップロード完了';
                
                // ファイルツリーを更新
                updateFileTree();
                
                // 成功メッセージをコンソールに表示
                addConsoleMessage(`${allFiles.length}個のファイルが正常にアップロードされました。`, 'info');
                
                // モーダルを閉じる（少し待機）
                setTimeout(() => {
                    document.getElementById('modal').classList.remove('show');
                    
                    // もし最初のエントリがディレクトリでindex.htmlがあれば自動的に開く
                    if (entries.length > 0 && entries[0].isDirectory) {
                        const dirName = entries[0].name;
                        if (projectState.files[`${dirName}/index.html`]) {
                            openFile(`${dirName}/index.html`);
                        }
                    }
                }, 1000);
            } else {
                // ファイルが見つからなかった場合
                document.getElementById('modal').classList.remove('show');
                addConsoleMessage('アップロード可能なファイルが見つかりませんでした', 'warning');
            }
        } catch (error) {
            console.error('エントリの処理中にエラーが発生しました:', error);
            document.getElementById('modal').classList.remove('show');
            addConsoleMessage('ファイル処理中にエラーが発生しました', 'error');
        }
    }
    
    // テキストファイルかどうかを判定する関数
    function isTextFile(file) {
        // ファイルの拡張子をチェック
        const fileName = file.name.toLowerCase();
        const textExtensions = [
            '.txt', '.html', '.htm', '.css', '.js', '.json', '.md', '.xml', '.svg',
            '.less', '.scss', '.sass', '.styl', '.jsx', '.ts', '.tsx', '.vue', '.php',
            '.py', '.rb', '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rust', '.sh',
            '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.log'
        ];
        
        for (const ext of textExtensions) {
            if (fileName.endsWith(ext)) {
                return true;
            }
        }
        
        // MIMEタイプをチェック（可能な場合）
        const mimeType = file.type;
        if (mimeType && mimeType.startsWith('text/')) {
            return true;
        }
        
        // サイズが大きすぎるファイルはバイナリとみなす
        if (file.size > 1024 * 1024 * 2) { // 2MB以上
            return false;
        }
        
        // 判断できない場合はテキストファイルと仮定
        return true;
    }
}

// 全画面モード切替
function initFullscreenToggle() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`エラー: ${err.message}`);
            });
            fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
            }
        }
    });
    
    // 全画面状態変更を検知
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
        } else {
            fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    });
}

// コンソールクリア機能
function initConsoleActions() {
    const clearConsoleBtn = document.getElementById('clear-console');
    
    clearConsoleBtn.addEventListener('click', () => {
        const consoleOutput = document.getElementById('console-output');
        consoleOutput.innerHTML = '';
    });
}

// イベントリスナーの設定
function setupEventListeners() {
    // 新規ファイル作成ボタン
    document.getElementById('new-file-btn').addEventListener('click', createNewFileDialog);
    
    // ファイル追加ボタン
    document.getElementById('add-file').addEventListener('click', createNewFileDialog);
    
    // フォルダ追加ボタン
    document.getElementById('add-folder').addEventListener('click', createNewFolderDialog);
    
    // ファイルアップロードボタン
    document.getElementById('upload-file').addEventListener('click', uploadFile);
    document.getElementById('upload-btn').addEventListener('click', uploadFile);
    
    // フォルダアップロードボタン
    document.getElementById('upload-btn-folder').addEventListener('click', uploadFolder);

        // ダウンロードボタン
        document.getElementById('download-btn').addEventListener('click', () => {
            if (projectState.activeFile) {
                saveCurrentFile();
                downloadFile(projectState.activeFile, projectState.files[projectState.activeFile].content);
            } else {
                downloadProject();
            }
       });

        // プレビュー更新ボタン
        const refreshPreviewBtn = document.getElementById('refresh-preview');
        if (refreshPreviewBtn) {
            refreshPreviewBtn.addEventListener('click', updatePreview);
        }
}

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
    // モナコエディタの初期化
    initializeEditor();
    
    // リサイズハンドルの初期化
    initResizeHandles();
    
    // パネル折りたたみの初期化
    initPanelToggles();
    
    // フォントサイズ変更の初期化
    initFontSizeChange();
    
    // プレビューサイズ変更の初期化
    initPreviewSizeChange();
    
    // デタッチ可能なプレビューの初期化
    initDetachablePreview();
    
    // プレビュー自動更新切り替えの初期化
    initTogglePreview();
    
    // ドラッグ&ドロップの初期化
    initDragAndDrop();
    
    // 全画面モード切替の初期化
    initFullscreenToggle();
    
    // コンソールアクションの初期化
    initConsoleActions();
    
    // イベントリスナーのセットアップ
    setupEventListeners();
    
    // ウィンドウのリサイズイベント
    window.addEventListener('resize', () => {
        if (editor) {
            editor.layout();
        }
    });
    
    // 初期メッセージをコンソールに出力
    addConsoleMessage('Web Code Editorへようこそ! コーディングを始めましょう。');
});
// プレビュー自動更新切り替えの初期化
function initTogglePreview() {
    const toggleBtn = document.getElementById('toggle-preview');
    
    // 初期状態を設定
    toggleBtn.classList.toggle('active', projectState.autoPreviewEnabled);
    
    toggleBtn.addEventListener('click', () => {
        // 自動プレビュー状態を切り替え
        projectState.autoPreviewEnabled = !projectState.autoPreviewEnabled;
        
        // ボタンの表示を更新
        toggleBtn.classList.toggle('active', projectState.autoPreviewEnabled);
        
        // アイコンを切り替え
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            if (projectState.autoPreviewEnabled) {
                icon.className = 'fa-solid fa-eye';
            } else {
                icon.className = 'fa-solid fa-eye-slash';
            }
        }
        
        // 自動プレビューが有効になった場合は即時更新
        if (projectState.autoPreviewEnabled) {
            updatePreview();
        } else {
            // プレビューを無効化したことを示すメッセージを表示
            const iframe = document.getElementById('preview-iframe');
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            iframeDoc.open();
            iframeDoc.write(`
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #2d2d30;
                            color: #e1e1e1;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            text-align: center;
                        }
                        .message {
                            padding: 20px;
                            border: 1px solid #444;
                            border-radius: 5px;
                            background-color: #1e1e1e;
                            max-width: 80%;
                        }
                        i {
                            font-size: 2rem;
                            margin-bottom: 1rem;
                            color: #61dafb;
                        }
                    </style>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                </head>
                <body>
                    <div class="message">
                        <i class="fa-solid fa-eye-slash"></i>
                        <h2>プレビューは一時停止されています</h2>
                        <p>再開するには「プレビュー自動更新」ボタンをクリックしてください</p>
                    </div>
                </body>
                </html>
            `);
            iframeDoc.close();
        }
    });
}