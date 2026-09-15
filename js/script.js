const URL_API = (typeof CONFIG !== "undefined" ? CONFIG.API_BASE_URL : "https://financeiro-api-lopes-h7hcgub8f3aggmdn.centralus-01.azurewebsites.net/api") + "/Pagamentos";

let enviandoPagamento = false;

function validarCnpj(cnpj) {
    if (!cnpj) return false;
    const numeros = cnpj.replace(/\D/g, "");
    if (numeros.length !== 14) return false;
    if (/^(\d)\1+$/.test(numeros)) return false;

    const multiplicador1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const multiplicador2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let soma = 0;
    for (let i = 0; i < 12; i++) {
        soma += parseInt(numeros.charAt(i), 10) * multiplicador1[i];
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;

    soma = 0;
    for (let i = 0; i < 13; i++) {
        soma += parseInt((numeros.substring(0, 12) + digito1).charAt(i), 10) * multiplicador2[i];
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;

    return numeros.endsWith(`${digito1}${digito2}`);
}

function normalizarValor(valor) {
    if (!valor) return "";
    let v = valor.trim().replace(/^R\$\s?/, "");
    if (v.includes(".") && !v.includes(",")) {
        const partes = v.split(".");
        if (partes.length === 2 && partes[1].length <= 2) {
            v = `${partes[0]},${partes[1]}`;
        }
    }
    return v;
}

async function extrairMensagemErro(resposta, mensagemPadrao) {
    try {
        const texto = await resposta.text();
        if (!texto || !texto.trim()) {
            return `${mensagemPadrao} (HTTP ${resposta.status})`;
        }
        try {
            const erroJson = JSON.parse(texto);
            if (erroJson.mensagem) return erroJson.mensagem;
            if (erroJson.message) return erroJson.message;
            if (erroJson.errors && typeof erroJson.errors === "object") {
                const mensagens = Object.values(erroJson.errors).flat();
                if (mensagens.length > 0) return mensagens.join("\n");
            }
            if (erroJson.title) return erroJson.title;
        } catch {
            return texto.trim();
        }
        return texto.trim();
    } catch {
        return `${mensagemPadrao} (HTTP ${resposta.status})`;
    }
}

async function salvarPagamento() {
    if (enviandoPagamento) return;

    const token = sessionStorage.getItem("tokenAcesso");
    if (!token) {
        sessionStorage.clear();
        window.location.href = "index.html";
        return;
    }

    const razaoSocialPagador = document.getElementById("razaoSocialPagador").value.trim();
    const cnpjPagador = document.getElementById("cnpjPagador").value.trim();
    const fornecedor = document.getElementById("fornecedor").value.trim();
    const cnpjFornecedor = document.getElementById("cnpjFornecedor").value.trim();
    const valorTotalRaw = document.getElementById("valorTotal").value;
    const valorTotal = normalizarValor(valorTotalRaw);
    const dataVencimento = document.getElementById("dataVencimento").value.trim();
    const observacoes = document.getElementById("observacoes").value.trim();

    if (!razaoSocialPagador) {
        alert("Por favor, preencha a Razão Social do Pagador.");
        document.getElementById("razaoSocialPagador").focus();
        return;
    }
    if (!cnpjPagador) {
        alert("Por favor, preencha o CNPJ do Pagador.");
        document.getElementById("cnpjPagador").focus();
        return;
    }
    if (!validarCnpj(cnpjPagador)) {
        alert("CNPJ do pagador inválido. Digite um CNPJ válido com 14 dígitos.");
        document.getElementById("cnpjPagador").focus();
        return;
    }
    if (!fornecedor) {
        alert("Por favor, preencha o Fornecedor.");
        document.getElementById("fornecedor").focus();
        return;
    }
    if (!cnpjFornecedor) {
        alert("Por favor, preencha o CNPJ do Fornecedor.");
        document.getElementById("cnpjFornecedor").focus();
        return;
    }
    if (!validarCnpj(cnpjFornecedor)) {
        alert("CNPJ do fornecedor inválido. Digite um CNPJ válido com 14 dígitos.");
        document.getElementById("cnpjFornecedor").focus();
        return;
    }
    if (!valorTotal) {
        alert("Por favor, informe o Valor Total (ex: 150,00).");
        document.getElementById("valorTotal").focus();
        return;
    }
    if (!dataVencimento) {
        alert("Por favor, selecione a Data de Vencimento.");
        document.getElementById("dataVencimento").focus();
        return;
    }

    const btnSalvar = document.getElementById("btnSalvarPagamento") || document.querySelector("button[onclick*='salvarPagamento']");
    const textoOriginal = btnSalvar ? btnSalvar.textContent : "Salvar";

    const formData = new FormData();
    formData.append("razaoSocialPagador", razaoSocialPagador);
    formData.append("cnpjPagador", cnpjPagador);
    formData.append("fornecedor", fornecedor);
    formData.append("cnpjFornecedor", cnpjFornecedor);
    formData.append("valorTotal", valorTotal);
    formData.append("dataVencimento", dataVencimento);
    formData.append("observacoes", observacoes);

    const arquivoInput = document.getElementById("anexo");
    if (arquivoInput.files && arquivoInput.files.length > 0) {
        formData.append("anexo", arquivoInput.files[0]);
    }

    try {
        enviandoPagamento = true;
        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.textContent = "Salvando...";
        }

        const resposta = await fetch(URL_API, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        if (resposta.status === 401) {
            sessionStorage.clear();
            window.location.href = "index.html";
            return;
        }

        if (resposta.ok) {
            const dados = await resposta.json();
            alert(dados.mensagem || "Pagamento salvo com sucesso!");
            limparFormulario();
        } else {
            const mensagemErro = await extrairMensagemErro(resposta, "Erro ao salvar o pagamento.");
            alert("Erro ao salvar: " + mensagemErro);
        }
    } catch (erro) {
        alert("Não foi possível conectar à API. Verifique se ela está rodando.");
        console.error(erro);
    } finally {
        enviandoPagamento = false;
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.textContent = textoOriginal;
        }
    }
}

function limparFormulario() {
    document.getElementById("formPagamentos").reset();
}