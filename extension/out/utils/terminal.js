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
exports.TerminalUtils = void 0;
const vscode = __importStar(require("vscode"));
class TerminalUtils {
    /**
     * Obtiene o crea un terminal para la extensión
     */
    static getTerminal() {
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
    static async executeCommand(command) {
        const terminal = this.getTerminal();
        terminal.show();
        terminal.sendText(command);
        vscode.window.showInformationMessage(`Ejecutando: ${command}`);
    }
    /**
     * Ejecuta múltiples comandos secuencialmente
     */
    static async executeCommands(commands) {
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
    static clearTerminal() {
        const terminal = this.getTerminal();
        terminal.sendText('clear');
    }
    /**
     * Ejecuta un comando git
     */
    static async executeGitCommand(gitCommand) {
        await this.executeCommand(`git ${gitCommand}`);
    }
    /**
     * Comandos útiles predefinidos
     */
    static async installPackage(packageName, isDev = false) {
        const devFlag = isDev ? '-D' : '';
        await this.executeCommand(`npm install ${devFlag} ${packageName}`);
    }
    static async runScript(scriptName) {
        await this.executeCommand(`npm run ${scriptName}`);
    }
    static async gitCommit(message) {
        await this.executeCommands([
            'git add .',
            `git commit -m "${message}"`
        ]);
    }
    static async gitPush(branch = 'main') {
        await this.executeCommand(`git push origin ${branch}`);
    }
}
exports.TerminalUtils = TerminalUtils;
//# sourceMappingURL=terminal.js.map