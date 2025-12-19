import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    const apiKey = config.get<string>('apiKey');

    if (!apiKey) {
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      const modelName = config.get<string>('model') || 'gemini-2.0-flash-exp';
      this.model = this.genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: this.getSystemPrompt()
      });
    } catch (error) {
      console.error('Error inicializando Gemini:', error);
    }
  }

  private getSystemPrompt(): string {
    return `Eres un asistente de programación experto integrado en Visual Studio Code.

IMPORTANTE: Los comandos especiales se ejecutan automáticamente por el sistema.

COMANDOS DISPONIBLES (usar FUERA de bloques de código):

1. READ_FILE: <ruta>
   Uso: Escribe "READ_FILE: app/main.py" en texto normal (NO en bloque de código)
   El sistema leerá el archivo y te mostrará su contenido automáticamente.

2. WRITE_FILE: <ruta>
   Uso: Escribe "WRITE_FILE: app/main.py" en texto normal
   INMEDIATAMENTE DESPUÉS, en la siguiente línea, pon un bloque de código con el contenido COMPLETO:
   
   WRITE_FILE: app/main.py
   \`\`\`python
   # Aquí va TODO el código del archivo
   \`\`\`

3. LIST_FILES: <directorio>
   Uso: "LIST_FILES: app/"

4. EXECUTE_TERMINAL: <comando>
   Uso: "EXECUTE_TERMINAL: npm install"

FORMATO CORRECTO - EJEMPLOS:

✅ CORRECTO para leer:
"Voy a leer el archivo actual:

READ_FILE: app/backend/main.py"

✅ CORRECTO para escribir:
"Voy a actualizar el archivo con el nuevo endpoint:

WRITE_FILE: app/backend/main.py
\`\`\`python
from fastapi import FastAPI
# ... TODO el contenido del archivo aquí
\`\`\`"

❌ INCORRECTO - NO hagas esto:
\`\`\`python
WRITE_FILE: app/backend/main.py
\`\`\`

❌ INCORRECTO - NO hagas esto:
\`\`\`
READ_FILE: app/main.py
\`\`\`

REGLAS CRÍTICAS:
1. Los comandos (READ_FILE, WRITE_FILE, etc.) SIEMPRE van en texto normal, NUNCA dentro de bloques de código
2. Solo el CONTENIDO del archivo va dentro del bloque de código markdown
3. Cuando uses WRITE_FILE, incluye TODO el archivo completo, no solo cambios
4. Los comandos se ejecutan automáticamente, no necesitas pedir permiso
5. Después de READ_FILE, el contenido aparecerá en el contexto automáticamente

FLUJO DE TRABAJO TÍPICO:
Usuario: "agrega un endpoint de logout en main.py"

Tu respuesta:
"Primero voy a leer el archivo actual:

READ_FILE: app/backend/main.py

[Esperas a que el sistema te muestre el contenido]

Ahora voy a agregar el endpoint de logout:

WRITE_FILE: app/backend/main.py
\`\`\`python
from fastapi import FastAPI, HTTPException
# ... [AQUÍ VA TODO EL CÓDIGO COMPLETO DEL ARCHIVO CON EL CAMBIO]
\`\`\`"`;
  }

  public async chat(history: Array<{role: string, parts: Array<{text: string}>}>): Promise<string> {
    if (!this.model) {
      // Intentar reinicializar
      this.initialize();
      
      if (!this.model) {
        throw new Error('API Key no configurada. Usa el botón ⚙️ para configurarla.');
      }
    }

    try {
      // Crear sesión de chat
      const chat = this.model.startChat({
        history: history.slice(0, -1), // Todo excepto el último mensaje
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        },
      });

      // Enviar el último mensaje
      const lastMessage = history[history.length - 1];
      const result = await chat.sendMessage(lastMessage.parts[0].text);
      const response = await result.response;
      
      return response.text();
    } catch (error: any) {
      if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('API Key inválida. Verifica tu configuración.');
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('Cuota de API excedida. Intenta más tarde.');
      } else {
        throw new Error(`Error de Gemini: ${error.message}`);
      }
    }
  }

  public async generateResponse(prompt: string): Promise<string> {
    if (!this.model) {
      this.initialize();
      if (!this.model) {
        throw new Error('API Key no configurada.');
      }
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      throw new Error(`Error generando respuesta: ${error.message}`);
    }
  }
}