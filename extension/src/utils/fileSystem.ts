import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileSystemUtils {
  /**
   * Aplica código al editor actual
   */
  static async applyCode(editor: vscode.TextEditor, code: string): Promise<void> {
    const selection = editor.selection;
    
    await editor.edit(editBuilder => {
      if (selection.isEmpty) {
        // Si no hay selección, reemplazar todo el documento
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        editBuilder.replace(fullRange, code);
      } else {
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
  static async createFile(relativePath: string, content: string): Promise<void> {
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
  static async editFile(relativePath: string, content: string): Promise<void> {
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
  static async readFile(relativePath: string): Promise<string> {
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
  static async listFiles(dirPath: string = '.'): Promise<string[]> {
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
  static getWorkspaceInfo(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return 'No hay workspace abierto';
    }

    return `Workspace: ${workspaceFolder.name} (${workspaceFolder.uri.fsPath})`;
  }
}