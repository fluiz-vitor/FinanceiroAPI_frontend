const URL_API = (typeof CONFIG !== "undefined" ? CONFIG.API_BASE_URL : "https://financeiro-api-lopes-h7hcgub8f3aggmdn.centralus-01.azurewebsites.net/api") + "/Pagamentos";

let enviandoPagamento = false;

async function salvarPagamento() {
    if (enviandoPagamento) return;

    const token = sessionStorage.getItem("tokenAcesso");
    if (!token) {
        sessionStorage.clear();
        window.location.href = "index.html";
        return;
    }

    const btnSalvar = document.getElementById("btnSalvarPagamento") || document.querySelector("button[onclick*='salvarPagamento']");
    const textoOriginal = btnSalvar ? btnSalvar.textContent : "Salvar";

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
            let mensagemErro = "Erro ao salvar o pagamento.";
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