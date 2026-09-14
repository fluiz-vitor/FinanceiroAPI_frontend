const URL_API = (typeof CONFIG !== "undefined" ? CONFIG.API_BASE_URL : "https://financeiro-api-lopes-h7hcgub8f3aggmdn.centralus-01.azurewebsites.net/api") + "/Pagamentos";

function obterIdDaUrl() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("id");
}

async function carregarDadosParaEdicao() {
    const id = obterIdDaUrl();

    if (!id) {
        alert("Nenhum pagamento selecionado para edição.");
        window.location.href = "listagem.html";
        return;
    }

    const token = sessionStorage.getItem("tokenAcesso");
    if (!token) {
        sessionStorage.clear();
        window.location.href = "index.html";
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/${id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (resposta.status === 401) {
            sessionStorage.clear();
            window.location.href = "index.html";
            return;
        }

        if (!resposta.ok) {
            alert("Pagamento não encontrado.");
            window.location.href = "listagem.html";
            return;
        }

        const pagamento = await resposta.json();

        document.getElementById("razaoSocialPagador").value = pagamento.razaoSocialPagador || "";
        document.getElementById("cnpjPagador").value = pagamento.cnpjPagador || "";
        document.getElementById("fornecedor").value = pagamento.fornecedor || "";
        document.getElementById("cnpjFornecedor").value = pagamento.cnpjFornecedor || "";
        document.getElementById("valorTotal").value = pagamento.valorTotal != null ? pagamento.valorTotal.toString().replace(".", ",") : "";
        document.getElementById("observacoes").value = pagamento.observacoes || "";

        if (pagamento.dataVencimento) {
            const dataFormatada = pagamento.dataVencimento.split("T")[0];
            document.getElementById("dataVencimento").value = dataFormatada;
        }

    } catch (erro) {
        alert("Não foi possível carregar os dados do pagamento.");
        console.error(erro);
    }
}

let atualizandoPagamento = false;

async function atualizarPagamento() {
    if (atualizandoPagamento) return;

    const id = obterIdDaUrl();
    if (!id) {
        alert("Nenhum pagamento selecionado para edição.");
        return;
    }

    const token = sessionStorage.getItem("tokenAcesso");
    if (!token) {
        sessionStorage.clear();
        window.location.href = "index.html";
        return;
    }

    const btnAtualizar = document.getElementById("btnAtualizarPagamento") || document.querySelector("button[onclick*='atualizarPagamento']");
    const textoOriginal = btnAtualizar ? btnAtualizar.textContent : "Atualizar";

    const formData = new FormData();
    formData.append("razaoSocialPagador", document.getElementById("razaoSocialPagador").value);
    formData.append("cnpjPagador", document.getElementById("cnpjPagador").value);
    formData.append("fornecedor", document.getElementById("fornecedor").value);
    formData.append("cnpjFornecedor", document.getElementById("cnpjFornecedor").value);
    formData.append("valorTotal", document.getElementById("valorTotal").value);
    formData.append("dataVencimento", document.getElementById("dataVencimento").value);
    formData.append("observacoes", document.getElementById("observacoes").value);

    const arquivoInput = document.getElementById("anexo");
    if (arquivoInput.files && arquivoInput.files.length > 0) {
        formData.append("anexo", arquivoInput.files[0]);
    }

    try {
        atualizandoPagamento = true;
        if (btnAtualizar) {
            btnAtualizar.disabled = true;
            btnAtualizar.textContent = "Atualizando...";
        }

        const resposta = await fetch(`${URL_API}/${id}`, {
            method: "PUT",
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
            alert(dados.mensagem || "Pagamento atualizado com sucesso!");
            window.location.href = "listagem.html";
        } else {
            let mensagemErro = "Erro ao atualizar o pagamento.";
            try {
                const erro = await resposta.json();
                if (erro && erro.mensagem) {
                    mensagemErro = erro.mensagem;
                }
            } catch {
                const textoErro = await resposta.text();
                if (textoErro) {
                    mensagemErro = textoErro;
                }
            }
            alert("Erro ao atualizar: " + mensagemErro);
        }
    } catch (erro) {
        alert("Não foi possível conectar à API.");
        console.error(erro);
    } finally {
        atualizandoPagamento = false;
        if (btnAtualizar) {
            btnAtualizar.disabled = false;
            btnAtualizar.textContent = textoOriginal;
        }
    }
}

function limparFormulario() {
    document.getElementById("formPagamentos").reset();
}

carregarDadosParaEdicao();