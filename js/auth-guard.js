const tokenAcesso = sessionStorage.getItem("tokenAcesso");

if (!tokenAcesso || !tokenAcesso.trim() || tokenAcesso === "token-temporario-sem-api") {
    sessionStorage.clear();
    window.location.href = "index.html";
}
