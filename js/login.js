const URL_API = (typeof CONFIG !== "undefined" ? CONFIG.API_BASE_URL : "https://financeiro-api-lopes-h7hcgub8f3aggmdn.centralus-01.azurewebsites.net/api") + "/Auth";

async function fazerLogin() {
    const nomeUsuario = document.getElementById("nomeUsuario").value;
    const senha = document.getElementById("senha").value;
    const botao = document.querySelector(".btn");

    esconderErro();

    if (!nomeUsuario || !senha) {
        mostrarErro("Preencha usuário e senha.");
        return;
    }

    if (botao && botao.disabled) {
        return;
    }

    botao.disabled = true;
    const textoOriginalBotao = botao.textContent;
    botao.textContent = "Entrando...";

    try {
        const resposta = await fetch(`${URL_API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nomeUsuario: nomeUsuario, senha: senha })
        });

        if (!resposta.ok) {
            mostrarErro("Usuário ou senha inválidos.");
            return;
        }

        const dados = await resposta.json();
        sessionStorage.setItem("tokenAcesso", dados.token);
        sessionStorage.setItem("nomeUsuario", dados.nomeUsuario);
        window.location.href = "cadastro.html";

    } catch (erro) {
        mostrarErro("Não foi possível conectar ao servidor.");
        console.error(erro);
    } finally {
        botao.disabled = false;
        botao.textContent = textoOriginalBotao;
    }
}

function mostrarErro(texto) {
    const mensagemErro = document.getElementById("mensagemErro");
    mensagemErro.textContent = texto;
    mensagemErro.classList.add("visivel");
}

function esconderErro() {
    const mensagemErro = document.getElementById("mensagemErro");
    mensagemErro.textContent = "";
    mensagemErro.classList.remove("visivel");
}

function alternarVisibilidadeSenha() {
    const campoSenha = document.getElementById("senha");
    campoSenha.type = campoSenha.type === "password" ? "text" : "password";
}

document.getElementById("formLogin").addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        evento.preventDefault();
        fazerLogin();
    }
});