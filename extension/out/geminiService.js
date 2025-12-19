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
exports.GeminiService = void 0;
const vscode = __importStar(require("vscode"));
const generative_ai_1 = require("@google/generative-ai");
class GeminiService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.initialize();
    }
    initialize() {
        const config = vscode.workspace.getConfiguration('aiAssistant');
        const apiKey = config.get('apiKey');
        if (!apiKey) {
            return;
        }
        try {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            const modelName = config.get('model') || 'gemini-2.0-flash-exp';
            this.model = this.genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: this.getSystemPrompt()
            });
        }
        catch (error) {
            console.error('Error inicializando Gemini:', error);
        }
    }
    getSystemPrompt() {
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
    async chat(history) {
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
        }
        catch (error) {
            if (error.message?.includes('API_KEY_INVALID')) {
                throw new Error('API Key inválida. Verifica tu configuración.');
            }
            else if (error.message?.includes('QUOTA_EXCEEDED')) {
                throw new Error('Cuota de API excedida. Intenta más tarde.');
            }
            else {
                throw new Error(`Error de Gemini: ${error.message}`);
            }
        }
    }
    async generateResponse(prompt) {
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
        }
        catch (error) {
            throw new Error(`Error generando respuesta: ${error.message}`);
        }
    }
}
exports.GeminiService = GeminiService;
//# sourceMappingURL=geminiService.js.map