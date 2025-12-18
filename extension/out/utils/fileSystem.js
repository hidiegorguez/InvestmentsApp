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
exports.FileSystemUtils = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class FileSystemUtils {
    /**
     * Aplica código al editor actual
     */
    static async applyCode(editor, code) {
        const selection = editor.selection;
        await editor.edit(editBuilder => {
            if (selection.isEmpty) {
                // Si no hay selección, reemplazar todo el documento
                const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
                editBuilder.replace(fullRange, code);
            }
            else {
                // Reemplazar solo la selección
                editBuilder.replace(selection, code);
            }
        });
        await editor.document.save();
        vscode.window.showInformationMessage('Código aplicado correctamente');
    }
    /**
     * Crea un nuevo archivo en el workspace
     */
    static async createFile(relativePath, content) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No hay workspace abierto');
        }
        const filePath = path.join(workspaceFolder.uri.fsPath, relativePath);
        const dirPath = path.dirname(filePath);
        // Crear directorio si no existe
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        // Si el archivo existe, actualizar en lugar de sobrescribir
        const exists = fs.existsSync(filePath);
        const action = exists ? 'actualizado' : 'creado';
        // Escribir archivo
        fs.writeFileSync(filePath, content, 'utf-8');
        // Abrir el archivo creado
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Archivo ${action}: ${relativePath}`);
    }
    /**
     * Edita un archivo existente o lo crea si no existe
     */
    static async editFile(relativePath, content) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No hay workspace abierto');
        }
        const filePath = path.join(workspaceFolder.uri.fsPath, relativePath);
        // Si no existe, crearlo
        if (!fs.existsSync(filePath)) {
            await this.createFile(relativePath, content);
            return;
        }
        // Si existe, abrir y editar
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);
        await this.applyCode(editor, content);
    }
    /**
     * Lee el contenido de un archivo
     */
    static async readFile(relativePath) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No hay workspace abierto');
        }
        // Si la ruta es absoluta y está dentro del workspace, usarla directamente
        let filePath = relativePath;
        if (!path.isAbsolute(relativePath)) {
            filePath = path.join(workspaceFolder.uri.fsPath, relativePath);
        }
        if (!fs.existsSync(filePath)) {
            throw new Error(`Archivo no encontrado: ${relativePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        // Límite de tamaño para no saturar el contexto
        if (content.length > 50000) {
            return content.substring(0, 50000) + '\n\n... (archivo truncado, muy largo)';
        }
        return content;
    }
    /**
     * Lista archivos en el directorio actual
     */
    static async listFiles(dirPath = '.') {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No hay workspace abierto');
        }
        const fullPath = path.join(workspaceFolder.uri.fsPath, dirPath);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Directorio no encontrado: ${dirPath}`);
        }
        return fs.readdirSync(fullPath);
    }
    /**
     * Obtiene información del workspace actual
     */
    static getWorkspaceInfo() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return 'No hay workspace abierto';
        }
        return `Workspace: ${workspaceFolder.name} (${workspaceFolder.uri.fsPath})`;
    }
}
exports.FileSystemUtils = FileSystemUtils;
//# sourceMappingURL=fileSystem.js.map