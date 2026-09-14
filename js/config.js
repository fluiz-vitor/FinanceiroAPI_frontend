// Configurações centralizadas de API para o frontend
const CONFIG = {
    API_BASE_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api"
        : "https://financeiro-api-lopes-h7hcgub8f3aggmdn.centralus-01.azurewebsites.net/api"
};
