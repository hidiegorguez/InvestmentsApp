import * as vscode from 'vscode';
import { ChatPanel } from './chatPanel';

export function activate(context: vscode.ExtensionContext) {
  console.log('AI Assistant activado');

  // Proveedor del webview
  const provider = new ChatPanel(context.extensionUri);
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('aiAssistant.chatView', provider)
  );

  // Comando para abrir chat
  context.subscriptions.push(
    vscode.commands.registerCommand('aiAssistant.openChat', () => {
      vscode.commands.executeCommand('workbench.view.extension.ai-assistant');
    })
  );

  // Comando para configurar API key
  context.subscriptions.push(
    vscode.commands.registerCommand('aiAssistant.setApiKey', async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: 'Introduce tu Google AI API Key',
        password: true,
        placeHolder: 'AIza...'
      });

      if (apiKey) {
        await vscode.workspace.getConfiguration('aiAssistant').update(
          'apiKey',
          apiKey,
          vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage('API Key guardada correctamente');
      }
    })
  );
}

export function deactivate() {}