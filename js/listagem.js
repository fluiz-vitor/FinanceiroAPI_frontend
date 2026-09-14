const URL_API = (typeof CONFIG !== "undefined" ? CONFIG.API_BASE_URL : "https://financeiro-api-lopes-h7hcgub8f3aggmdn.centralus-01.azurewebsites.net/api") + "/Pagamentos";

function exibirMensagemTabela(mensagem) {
    const corpoTabela = document.getElementById("corpoTabela");
    corpoTabela.replaceChildren();
    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 9;
    celula.textContent = mensagem;
    linha.appendChild(celula);
    corpoTabela.appendChild(linha);
}

async function carregarPagamentos() {
    const token = sessionStorage.getItem("tokenAcesso");
    if (!token) {
        sessionStorage.clear();
        window.location.href = "index.html";
        return;
    }

    const corpoTabela = document.getElementById("corpoTabela");

    try {
        const resposta = await fetch(URL_API, {
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
            exibirMensagemTabela("Erro ao carregar os pagamentos.");
            return;
        }

        const pagamentos = await resposta.json();

        if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
            exibirMensagemTabela("Nenhum pagamento cadastrado ainda.");
            return;
        }

        corpoTabela.replaceChildren();

        pagamentos.forEach(pagamento => {
            const linha = document.createElement("tr");

            const tdRazaoSocial = document.createElement("td");
            tdRazaoSocial.textContent = pagamento.razaoSocialPagador || "";
            linha.appendChild(tdRazaoSocial);

            const tdCnpjPagador = document.createElement("td");
            tdCnpjPagador.textContent = formatarCnpj(pagamento.cnpjPagador);
            linha.appendChild(tdCnpjPagador);

            const tdFornecedor = document.createElement("td");
            tdFornecedor.textContent = pagamento.fornecedor || "";
            linha.appendChild(tdFornecedor);

            const tdCnpjFornecedor = document.createElement("td");
            tdCnpjFornecedor.textContent = formatarCnpj(pagamento.cnpjFornecedor);
            linha.appendChild(tdCnpjFornecedor);

            const tdValorTotal = document.createElement("td");
            tdValorTotal.textContent = formatarValor(pagamento.valorTotal);
            linha.appendChild(tdValorTotal);

            const tdVencimento = document.createElement("td");
            tdVencimento.textContent = formatarData(pagamento.dataVencimento);
            linha.appendChild(tdVencimento);

            const tdObservacoes = document.createElement("td");
            tdObservacoes.textContent = pagamento.observacoes || "";
            linha.appendChild(tdObservacoes);

            const tdAnexo = document.createElement("td");
            if (pagamento.caminhoArquivoAnexo && pagamento.caminhoArquivoAnexo.trim() !== "") {
                const nomeArquivo = pagamento.caminhoArquivoAnexo.split(/[\\/]/).pop();
                const linkAnexo = document.createElement("a");
                linkAnexo.href = "#";
                linkAnexo.className = "link-anexo";
                linkAnexo.textContent = "Baixar anexo";
                linkAnexo.addEventListener("click", (evento) => {
                    evento.preventDefault();
                    baixarAnexo(pagamento.id, nomeArquivo);
                });
                tdAnexo.appendChild(linkAnexo);
            } else {
                tdAnexo.textContent = "Sem anexo";
            }
            linha.appendChild(tdAnexo);

            const tdAcoes = document.createElement("td");

            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.className = "btn-editar";
            btnEditar.type = "button";
            btnEditar.addEventListener("click", () => editarPagamento(pagamento.id));

            const btnExcluir = document.createElement("button");
            btnExcluir.textContent = "Excluir";
            btnExcluir.className = "btn-excluir";
            btnExcluir.type = "button";
            btnExcluir.addEventListener("click", () => excluirPagamento(pagamento.id));

            tdAcoes.appendChild(btnEditar);
            tdAcoes.appendChild(btnExcluir);
            linha.appendChild(tdAcoes);

            corpoTabela.appendChild(linha);
        });

    } catch (erro) {
        exibirMensagemTabela("Não foi possível conectar à API.");
        console.error(erro);
    }
}

function formatarCnpj(cnpj) {
    if (!cnpj || cnpj.length !== 14) return cnpj || "";
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatarValor(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return "R$ 0,00";
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data) {
    if (!data) return "";
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return data;
    return dataObj.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

async function baixarAnexo(id, nomeArquivo) {
    const token = sessionStorage.getItem("tokenAcesso");
    if (!token) {
        sessionStorage.clear();
        window.location.href = "index.html";
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/anexo/${encodeURIComponent(nomeArquivo)}`, {
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
            alert("Não foi possível baixar o anexo.");
            return;
        }

        let urlBlob = null;
        try {
            const blob = await resposta.blob();
            urlBlob = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = urlBlob;
            link.download = nomeArquivo;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } finally {
            if (urlBlob) {
                setTimeout(() => window.URL.revokeObjectURL(urlBlob), 1000);
            }
        }
    } catch (erro) {
        alert("Erro ao conectar à API para baixar o anexo.");
        console.error(erro);
    }
}

function editarPagamento(id) {
    window.location.href = `editar.html?id=${id}`;
}

async function excluirPagamento(id) {
    const confirmacao = confirm("Tem certeza que deseja excluir este pagamento?");
    if (!confirmacao) return;

    const token = sessionStorage.getItem("tokenAcesso");
    if (!token) {
        sessionStorage.clear();
        window.location.href = "index.html";
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (resposta.status === 401) {
            sessionStorage.clear();
            window.location.href = "index.html";
            return;
        }

        if (resposta.ok) {
            alert("Pagamento excluído com sucesso!");
            carregarPagamentos();
        } else {
            const erro = await resposta.text();
            alert(`Erro ao excluir o pagamento: ${erro}`);
        }
    } catch (erro) {
        alert(`Erro ao conectar à API: ${erro.message}`);
        console.error(erro);
    }
}

carregarPagamentos();