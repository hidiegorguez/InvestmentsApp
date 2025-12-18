import * as vscode from 'vscode';
import { GeminiService } from './geminiService';
import { FileSystemUtils } from './utils/fileSystem';
import { TerminalUtils } from './utils/terminal';

export class ChatPanel implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private gemini: GeminiService;
  private conversationHistory: Array<{role: string, parts: Array<{text: string}>}> = [];

  constructor(private readonly extensionUri: vscode.Uri) {
    this.gemini = new GeminiService();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
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

  private async handleUserMessage(message: string) {
    try {
      // Obtener contexto del archivo actual
      const context = await this.getCurrentContext();
      
      // Construir prompt con contexto
      const fullMessage = context ? `${context}\n\nUsuario: ${message}` : message;

      // Añadir mensaje del usuario al historial
      this.conversationHistory.push({
        role: 'user',
        parts: [{text: fullMessage}]
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
        parts: [{text: response}]
      });

      // Procesar comandos especiales en la respuesta
      await this.processCommands(response);

      // Enviar respuesta al webview
      this.view?.webview.postMessage({
        type: 'assistantMessage',
        message: response
      });

    } catch (error: any) {
      this.view?.webview.postMessage({
        type: 'error',
        message: error.message || 'Error al comunicarse con Gemini'
      });
    }
  }

  private async getCurrentContext(): Promise<string> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    let context = '';

    if (workspaceFolder) {
      context += `Workspace: ${workspaceFolder.name} (${workspaceFolder.uri.fsPath})\n`;
      
      // Listar archivos principales del proyecto
      try {
        const files = await FileSystemUtils.listFiles('.');
        context += `\nArchivos en raíz: ${files.slice(0, 20).join(', ')}${files.length > 20 ? '...' : ''}\n`;
      } catch (error) {
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
    } else {
      // Incluir contenido completo si el archivo no es muy grande
      const text = document.getText();
      if (text.length < 10000) {
        context += `\nContenido del archivo:\n\`\`\`${document.languageId}\n${text}\n\`\`\``;
      } else {
        context += `\n(Archivo muy grande, ${text.length} caracteres. Usa READ_FILE si necesitas verlo)`;
      }
    }

    return context;
  }

  private async processCommands(response: string) {
    // Detectar READ_FILE
    const readFileRegex = /READ_FILE:\s*(.+)/g;
    let match;
    
    while ((match = readFileRegex.exec(response)) !== null) {
      const filePath = match[1].trim();
      try {
        const content = await FileSystemUtils.readFile(filePath);
        
        // Enviar contenido del archivo al chat
        const fileMessage = `Contenido de ${filePath}:\n\`\`\`\n${content}\n\`\`\``;
        
        // Añadir al historial
        this.conversationHistory.push({
          role: 'user',
          parts: [{text: `[SYSTEM] ${fileMessage}`}]
        });
        
        // Obtener nueva respuesta con el contenido del archivo
        const newResponse = await this.gemini.chat(this.conversationHistory);
        this.conversationHistory.push({
          role: 'model',
          parts: [{text: newResponse}]
        });
        
        // Enviar al webview
        this.view?.webview.postMessage({
          type: 'assistantMessage',
          message: newResponse
        });
        
        // Continuar procesando comandos en la nueva respuesta
        await this.processCommands(newResponse);
        return; // Salir para evitar duplicados
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error leyendo archivo: ${error.message}`);
      }
    }

    // Detectar WRITE_FILE (automático para crear/editar)
    const writeFileRegex = /WRITE_FILE:\s*(.+)/;
    const writeMatch = response.match(writeFileRegex);
    if (writeMatch) {
      const filePath = writeMatch[1].trim();
      
      // Extraer el código del siguiente bloque
      const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
      const codeMatch = response.match(codeBlockRegex);
      
      if (codeMatch) {
        const code = codeMatch[1];
        try {
          await FileSystemUtils.createFile(filePath, code);
          
          // Notificar al chat que se completó
          this.view?.webview.postMessage({
            type: 'systemMessage',
            message: `✅ Archivo ${filePath} creado/actualizado`
          });
        } catch (error: any) {
          vscode.window.showErrorMessage(`Error creando archivo: ${error.message}`);
        }
      }
    }

    // Detectar EDIT_FILE (automático)
    const editFileRegex = /EDIT_FILE:\s*(.+)/;
    const editMatch = response.match(editFileRegex);
    if (editMatch) {
      const filePath = editMatch[1].trim();
      
      const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
      const codeMatch = response.match(codeBlockRegex);
      
      if (codeMatch) {
        const code = codeMatch[1];
        try {
          await FileSystemUtils.editFile(filePath, code);
          
          this.view?.webview.postMessage({
            type: 'systemMessage',
            message: `✅ Archivo ${filePath} editado`
          });
        } catch (error: any) {
          vscode.window.showErrorMessage(`Error editando archivo: ${error.message}`);
        }
      }
    }

    // Detectar LIST_FILES
    const listFilesRegex = /LIST_FILES:\s*(.+)/;
    const listMatch = response.match(listFilesRegex);
    if (listMatch) {
      const dirPath = listMatch[1].trim();
      try {
        const files = await FileSystemUtils.listFiles(dirPath);
        const fileList = `Archivos en ${dirPath}:\n${files.join('\n')}`;
        
        // Añadir al historial
        this.conversationHistory.push({
          role: 'user',
          parts: [{text: `[SYSTEM] ${fileList}`}]
        });
        
        // Obtener nueva respuesta
        const newResponse = await this.gemini.chat(this.conversationHistory);
        this.conversationHistory.push({
          role: 'model',
          parts: [{text: newResponse}]
        });
        
        this.view?.webview.postMessage({
          type: 'assistantMessage',
          message: newResponse
        });
        
        await this.processCommands(newResponse);
        return;
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error listando archivos: ${error.message}`);
      }
    }

    // Detectar comandos de terminal (PEDIR CONFIRMACIÓN para seguridad)
    if (response.includes('EXECUTE_TERMINAL:')) {
      const commandMatch = response.match(/EXECUTE_TERMINAL:\s*(.+)/);
      if (commandMatch) {
        const command = commandMatch[1].trim();
        const execute = await vscode.window.showInformationMessage(
          `¿Ejecutar: ${command}?`,
          'Sí',
          'No'
        );

        if (execute === 'Sí') {
          await TerminalUtils.executeCommand(command);
        }
      }
    }

    // Detectar bloques de código para aplicar al archivo actual
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks: Array<{language?: string, code: string}> = [];
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      // Solo si no es parte de un comando específico
      if (!response.includes('WRITE_FILE:') && !response.includes('EDIT_FILE:')) {
        codeBlocks.push({
          language: match[1],
          code: match[2]
        });
      }
    }

    // Si hay bloques de código y un editor activo, aplicarlos automáticamente
    if (codeBlocks.length > 0) {
      const editor = vscode.window.activeTextEditor;
      if (editor && codeBlocks.length === 1) {
        // Si solo hay un bloque y hay editor activo, aplicar directamente
        await FileSystemUtils.applyCode(editor, codeBlocks[0].code);
        
        this.view?.webview.postMessage({
          type: 'systemMessage',
          message: '✅ Código aplicado al archivo actual'
        });
      }
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'chat.css')
    );

    return `<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>AI Agent</title>
    </head>
    <body>
      <div id="chat-container">
        <div id="messages"></div>
        <div id="input-container">
          <textarea id="user-input" placeholder="Write here..." rows="3"></textarea>
          <div id="button-group">
            <button id="send-btn">Enter</button>
            <button id="clear-btn">Clear</button>
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