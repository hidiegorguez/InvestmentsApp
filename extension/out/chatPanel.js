"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPanel = void 0;
const vscode = __importStar(require("vscode"));
const geminiService_1 = require("./geminiService");
const fileSystem_1 = require("./utils/fileSystem");
const terminal_1 = require("./utils/terminal");
class ChatPanel {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.conversationHistory = [];
        this.gemini = new geminiService_1.GeminiService();
    }
    resolveWebviewView(webviewView, context, token) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
        // Escuchar mensajes del webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    await this.handleUserMessage(data.message);
                    break;
                case 'clearChat':
                    this.conversationHistory = [];
                    break;
                case 'configureApiKey':
                    vscode.commands.executeCommand('aiAssistant.setApiKey');
                    break;
            }
        });
    }
    async handleUserMessage(message) {
        try {
            // Obtener contexto del archivo actual
            const context = await this.getCurrentContext();
            // Construir prompt con contexto
            const fullMessage = context ? `${context}\n\nUsuario: ${message}` : message;
            // Añadir mensaje del usuario al historial
            this.conversationHistory.push({
                role: 'user',
                parts: [{ text: fullMessage }]
            });
            // Enviar a webview que está pensando
            this.view?.webview.postMessage({
                type: 'assistantThinking'
            });
            // Obtener respuesta de Gemini
            const response = await this.gemini.chat(this.conversationHistory);
            // Añadir respuesta al historial
            this.conversationHistory.push({
                role: 'model',
                parts: [{ text: response }]
            });
            // Procesar comandos especiales en la respuesta
            await this.processCommands(response);
            // Enviar respuesta al webview
            this.view?.webview.postMessage({
                type: 'assistantMessage',
                message: response
            });
        }
        catch (error) {
            this.view?.webview.postMessage({
                type: 'error',
                message: error.message || 'Error al comunicarse con Gemini'
            });
        }
    }
    async getCurrentContext() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        let context = '';
        if (workspaceFolder) {
            context += `Workspace: ${workspaceFolder.name} (${workspaceFolder.uri.fsPath})\n`;
            // Listar archivos principales del proyecto
            try {
                const files = await fileSystem_1.FileSystemUtils.listFiles('.');
                context += `\nArchivos en raíz: ${files.slice(0, 20).join(', ')}${files.length > 20 ? '...' : ''}\n`;
            }
            catch (error) {
                // Ignorar error
            }
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return context;
        }
        const document = editor.document;
        const selection = editor.selection;
        context += `\nArchivo actual: ${document.fileName}\n`;
        context += `Lenguaje: ${document.languageId}\n`;
        if (!selection.isEmpty) {
            const selectedText = document.getText(selection);
            context += `\nTexto seleccionado:\n\`\`\`${document.languageId}\n${selectedText}\n\`\`\``;
        }
        else {
            // Incluir contenido completo si el archivo no es muy grande
            const text = document.getText();
            if (text.length < 10000) {
                context += `\nContenido del archivo:\n\`\`\`${document.languageId}\n${text}\n\`\`\``;
            }
            else {
                context += `\n(Archivo muy grande, ${text.length} caracteres. Usa READ_FILE si necesitas verlo)`;
            }
        }
        return context;
    }
    async processCommands(response) {
        // Detectar READ_FILE - EJECUTAR AUTOMÁTICAMENTE
        const readFileRegex = /READ_FILE:\s*(.+)/g;
        let match;
        while ((match = readFileRegex.exec(response)) !== null) {
            const filePath = match[1].trim();
            try {
                const content = await fileSystem_1.FileSystemUtils.readFile(filePath);
                // Enviar contenido del archivo al chat
                const fileMessage = `[Contenido de ${filePath}]:\n\`\`\`\n${content}\n\`\`\``;
                // Añadir al historial como mensaje del sistema
                this.conversationHistory.push({
                    role: 'user',
                    parts: [{ text: fileMessage }]
                });
                // Notificar en el chat
                this.view?.webview.postMessage({
                    type: 'systemMessage',
                    message: `📄 Leído: ${filePath}`
                });
                // Obtener nueva respuesta con el contenido del archivo
                this.view?.webview.postMessage({
                    type: 'assistantThinking'
                });
                const newResponse = await this.gemini.chat(this.conversationHistory);
                this.conversationHistory.push({
                    role: 'model',
                    parts: [{ text: newResponse }]
                });
                // Enviar al webview
                this.view?.webview.postMessage({
                    type: 'assistantMessage',
                    message: newResponse
                });
                // Continuar procesando comandos en la nueva respuesta
                await this.processCommands(newResponse);
                return; // Salir para evitar duplicados
            }
            catch (error) {
                this.view?.webview.postMessage({
                    type: 'error',
                    message: `Error leyendo ${filePath}: ${error.message}`
                });
            }
        }
        // Detectar WRITE_FILE - EJECUTAR AUTOMÁTICAMENTE
        // Asegurarnos de que NO esté dentro de un bloque de código
        const writeFileRegex = /(?:^|\n)WRITE_FILE:\s*(.+?)(?:\n|$)/m;
        const writeMatch = response.match(writeFileRegex);
        if (writeMatch && !response.includes('```\nWRITE_FILE:')) {
            const filePath = writeMatch[1].trim();
            // Extraer el código del siguiente bloque (debe estar DESPUÉS del comando)
            const commandIndex = response.indexOf(writeMatch[0]);
            const afterCommand = response.substring(commandIndex + writeMatch[0].length);
            const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
            const codeMatch = afterCommand.match(codeBlockRegex);
            if (codeMatch) {
                const code = codeMatch[1];
                try {
                    await fileSystem_1.FileSystemUtils.createFile(filePath, code);
                    // Notificar al chat que se completó
                    this.view?.webview.postMessage({
                        type: 'systemMessage',
                        message: `✅ Archivo guardado: ${filePath}`
                    });
                }
                catch (error) {
                    this.view?.webview.postMessage({
                        type: 'error',
                        message: `Error guardando ${filePath}: ${error.message}`
                    });
                }
            }
            else {
                this.view?.webview.postMessage({
                    type: 'error',
                    message: `No se encontró bloque de código después de WRITE_FILE: ${filePath}`
                });
            }
        }
        // Detectar LIST_FILES - EJECUTAR AUTOMÁTICAMENTE
        const listFilesRegex = /LIST_FILES:\s*(.+)/;
        const listMatch = response.match(listFilesRegex);
        if (listMatch) {
            const dirPath = listMatch[1].trim();
            try {
                const files = await fileSystem_1.FileSystemUtils.listFiles(dirPath);
                const fileList = `[Archivos en ${dirPath}]:\n${files.join('\n')}`;
                // Añadir al historial
                this.conversationHistory.push({
                    role: 'user',
                    parts: [{ text: fileList }]
                });
                this.view?.webview.postMessage({
                    type: 'systemMessage',
                    message: `📁 Listados ${files.length} archivos en ${dirPath}`
                });
                // Obtener nueva respuesta
                this.view?.webview.postMessage({
                    type: 'assistantThinking'
                });
                const newResponse = await this.gemini.chat(this.conversationHistory);
                this.conversationHistory.push({
                    role: 'model',
                    parts: [{ text: newResponse }]
                });
                this.view?.webview.postMessage({
                    type: 'assistantMessage',
                    message: newResponse
                });
                await this.processCommands(newResponse);
                return;
            }
            catch (error) {
                this.view?.webview.postMessage({
                    type: 'error',
                    message: `Error listando ${dirPath}: ${error.message}`
                });
            }
        }
        // Detectar comandos de terminal - PEDIR CONFIRMACIÓN
        if (response.includes('EXECUTE_TERMINAL:')) {
            const commandMatch = response.match(/EXECUTE_TERMINAL:\s*(.+)/);
            if (commandMatch) {
                const command = commandMatch[1].trim();
                const execute = await vscode.window.showInformationMessage(`¿Ejecutar: ${command}?`, 'Sí', 'No');
                if (execute === 'Sí') {
                    await terminal_1.TerminalUtils.executeCommand(command);
                    this.view?.webview.postMessage({
                        type: 'systemMessage',
                        message: `⚡ Ejecutado: ${command}`
                    });
                }
            }
        }
    }
    getHtmlForWebview(webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'chat.css'));
        return `<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>AI Assistant</title>
    </head>
    <body>
      <div id="chat-container">
        <div id="messages"></div>
        <div id="input-container">
          <textarea id="user-input" placeholder="Escribe tu mensaje..." rows="3"></textarea>
          <div id="button-group">
            <button id="send-btn">Enviar</button>
            <button id="clear-btn">Limpiar</button>
            <button id="config-btn">⚙️ API Key</button>
          </div>
        </div>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        const messagesDiv = document.getElementById('messages');
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const clearBtn = document.getElementById('clear-btn');
        const configBtn = document.getElementById('config-btn');

        function addMessage(text, isUser) {
          const msgDiv = document.createElement('div');
          msgDiv.className = 'message ' + (isUser ? 'user-message' : 'assistant-message');
          msgDiv.textContent = text;
          messagesDiv.appendChild(msgDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function showThinking() {
          const thinkingDiv = document.createElement('div');
          thinkingDiv.className = 'message assistant-message thinking';
          thinkingDiv.textContent = '🤔 Pensando...';
          thinkingDiv.id = 'thinking-indicator';
          messagesDiv.appendChild(thinkingDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function removeThinking() {
          const thinking = document.getElementById('thinking-indicator');
          if (thinking) {
            thinking.remove();
          }
        }

        sendBtn.addEventListener('click', () => {
          const message = userInput.value.trim();
          if (message) {
            addMessage(message, true);
            vscode.postMessage({ type: 'sendMessage', message });
            userInput.value = '';
          }
        });

        userInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
          }
        });

        clearBtn.addEventListener('click', () => {
          messagesDiv.innerHTML = '';
          vscode.postMessage({ type: 'clearChat' });
        });

        configBtn.addEventListener('click', () => {
          vscode.postMessage({ type: 'configureApiKey' });
        });

        window.addEventListener('message', event => {
          const message = event.data;
          switch (message.type) {
            case 'assistantThinking':
              showThinking();
              break;
            case 'assistantMessage':
              removeThinking();
              addMessage(message.message, false);
              break;
            case 'systemMessage':
              removeThinking();
              const sysMsg = document.createElement('div');
              sysMsg.className = 'message system-message';
              sysMsg.textContent = message.message;
              messagesDiv.appendChild(sysMsg);
              messagesDiv.scrollTop = messagesDiv.scrollHeight;
              break;
            case 'error':
              removeThinking();
              addMessage('❌ Error: ' + message.message, false);
              break;
          }
        });
      </script>
    </body>
    </html>`;
    }
}
exports.ChatPanel = ChatPanel;
//# sourceMappingURL=chatPanel.js.map