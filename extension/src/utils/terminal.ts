import * as vscode from 'vscode';

export class TerminalUtils {
  private static terminal: vscode.Terminal | undefined;

  /**
   * Obtiene o crea un terminal para la extensión
   */
  private static getTerminal(): vscode.Terminal {
    // Si el terminal existe y está activo, usarlo
    if (this.terminal && vscode.window.terminals.includes(this.terminal)) {
      return this.terminal;
    }

    // Crear nuevo terminal
    this.terminal = vscode.window.createTerminal('AI Assistant');
    return this.terminal;
  }

  /**
   * Ejecuta un comando en el terminal
   */
  static async executeCommand(command: string): Promise<void> {
    const terminal = this.getTerminal();
    terminal.show();
    terminal.sendText(command);
    
    vscode.window.showInformationMessage(`Ejecutando: ${command}`);
  }

  /**
   * Ejecuta múltiples comandos secuencialmente
   */
  static async executeCommands(commands: string[]): Promise<void> {
    const terminal = this.getTerminal();
    terminal.show();
    
    for (const command of commands) {
      terminal.sendText(command);
      // Pequeña pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Limpia el terminal
   */
  static clearTerminal(): void {
    const terminal = this.getTerminal();
    terminal.sendText('clear');
  }

  /**
   * Ejecuta un comando git
   */
  static async executeGitCommand(gitCommand: string): Promise<void> {
    await this.executeCommand(`git ${gitCommand}`);
  }

  /**
   * Comandos útiles predefinidos
   */
  static async installPackage(packageName: string, isDev: boolean = false): Promise<void> {
    const devFlag = isDev ? '-D' : '';
    await this.executeCommand(`npm install ${devFlag} ${packageName}`);
  }

  static async runScript(scriptName: string): Promise<void> {
    await this.executeCommand(`npm run ${scriptName}`);
  }

  static async gitCommit(message: string): Promise<void> {
    await this.executeCommands([
      'git add .',
      `git commit -m "${message}"`
    ]);
  }

  static async gitPush(branch: string = 'main'): Promise<void> {
    await this.executeCommand(`git push origin ${branch}`);
  }
}