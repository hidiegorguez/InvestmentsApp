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

Tu función es ayudar al desarrollador con:
- Leer, escribir y modificar archivos del proyecto
- Debugging y solución de errores
- Explicar conceptos de programación
- Sugerir mejores prácticas
- Ejecutar comandos en terminal y git
- Navegar por todo el proyecto

CAPACIDADES DISPONIBLES:
1. READ_FILE: <ruta> - Lee cualquier archivo del proyecto
2. WRITE_FILE: <ruta> - Crea o sobrescribe un archivo
3. EDIT_FILE: <ruta> - Modifica un archivo existente
4. LIST_FILES: <directorio> - Lista archivos en un directorio
5. EXECUTE_TERMINAL: <comando> - Ejecuta comandos en terminal

FORMATO DE RESPUESTA:
- Para leer archivos: "READ_FILE: src/app.ts"
- Para crear archivos: "WRITE_FILE: src/nuevo.ts" seguido del contenido en bloque de código
- Para editar: "EDIT_FILE: src/app.ts" seguido del código modificado
- Para terminal: "EXECUTE_TERMINAL: npm install express"
- Para listar: "LIST_FILES: src/"

IMPORTANTE:
- Siempre confirma antes de modificar o ejecutar comandos
- Usa bloques de código markdown con el lenguaje especificado
- Puedes leer múltiples archivos para entender el contexto completo
- Sé proactivo: si necesitas ver más archivos para dar una mejor respuesta, léelos

Ejemplos:
Usuario: "muéstrame el archivo package.json"
Tú: "READ_FILE: package.json"

Usuario: "agrega validación al archivo user.ts"
Tú: "Primero déjame ver el archivo: READ_FILE: src/user.ts"

Usuario: "crea un componente Button en React"
Tú: "WRITE_FILE: src/components/Button.tsx" + código`;
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