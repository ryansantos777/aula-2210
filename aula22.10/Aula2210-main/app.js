// ===== CONFIGURAÇÃO INICIAL E CONSTANTES =====
const CHAVE_API = "bd1e817c"; 
const URL_BASE = "https://www.omdbapi.com/";
const PLACEHOLDER_POSTER = "https://via.placeholder.com/300x450?text=Sem+Poster";

// ===== CONEXÃO COM O HTML (DOM) =====
const selectTipoBusca = document.getElementById("tipo-busca");
const campoBusca = document.getElementById("campo-busca");
const campoAno = document.getElementById("campo-ano");
const botaoBuscar = document.getElementById("botao-buscar");
const listaResultados = document.getElementById("lista-resultados");
const mensagemStatus = document.getElementById("mensagem-status");
const botaoAnterior = document.getElementById("botao-anterior");
const botaoProximo = document.getElementById("botao-proximo");
const containerPaginacao = document.getElementById("container-paginacao");

// ===== VARIÁVEIS DE ESTADO =====
let estadoBusca = {
    termo: "",
    tipo: "title", // Armazena a intenção do usuário: 'title' ou 'actor'
    paginaAtual: 1,
    totalResultados: 0,
};

// =======================================================
// ===== FUNÇÕES DE CONTROLE E REQUISIÇÃO (FETCH) ========
// =======================================================

// Inicializa a escuta de eventos
function inicializarEventos() {
    botaoBuscar.addEventListener("click", iniciarNovaBusca);
    
    // Suporte para ENTER
    campoBusca.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            iniciarNovaBusca();
        }
    });
    campoAno.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            iniciarNovaBusca();
        }
    });

    botaoAnterior.addEventListener("click", paginaAnterior);
    botaoProximo.addEventListener("click", proximaPagina);
    
    // Captura a intenção (title ou actor)
    selectTipoBusca.addEventListener("change", (e) => {
        estadoBusca.tipo = e.target.value; // CORREÇÃO: Armazena 'title' ou 'actor'
        
        // Ajusta o placeholder baseado no tipo de busca
        if (e.target.value === 'actor') {
             campoBusca.placeholder = "Ex.: Tom Hanks, Angelina Jolie...";
        } else {
             campoBusca.placeholder = "Ex.: Batman, Matrix, Avatar...";
        }
    });

    containerPaginacao.style.display = 'none';
}

// Inicia uma nova busca (sempre começa da página 1)
function iniciarNovaBusca() {
    estadoBusca.termo = campoBusca.value.trim();
    estadoBusca.paginaAtual = 1;
    pesquisarFilmes();
}

function proximaPagina() {
    if (estadoBusca.paginaAtual * 10 < estadoBusca.totalResultados) {
        estadoBusca.paginaAtual++;
        pesquisarFilmes();
    }
}

function paginaAnterior() {
    if (estadoBusca.paginaAtual > 1) {
        estadoBusca.paginaAtual--;
        pesquisarFilmes();
    }
}

function atualizarPaginacao() {
    const totalPaginas = Math.ceil(estadoBusca.totalResultados / 10);
    const temProxima = estadoBusca.paginaAtual < totalPaginas;
    const temAnterior = estadoBusca.paginaAtual > 1;
    
    containerPaginacao.style.display = estadoBusca.totalResultados > 0 ? 'block' : 'none';

    botaoAnterior.disabled = !temAnterior;
    botaoProximo.disabled = !temProxima;
}


// Função principal de pesquisa
async function pesquisarFilmes() {
    if (!estadoBusca.termo) {
        mensagemStatus.textContent = "Digite o termo desejado para pesquisar.";
        listaResultados.innerHTML = "";
        atualizarPaginacao();
        return;
    }

    mensagemStatus.textContent = "🔄 Buscando filmes, aguarde...";
    listaResultados.innerHTML = "";
    
    // 3. Montagem da URL e Parâmetros
    
    const anoBusca = campoAno.value.trim();
    let parametroAno = '';
    
    if (anoBusca && /^\d{4}$/.test(anoBusca)) {
        parametroAno = `&y=${anoBusca}`;
    }
    
    // **NOTA SOBRE OMDb:** A OMDb usa o parâmetro 's' para buscas gerais, independentemente 
    // de ser título ou ator. Ela é fraca para pesquisas por ator/elenco.
    const searchParam = 's'; 
    
    // Constrói a URL
    const url = `${URL_BASE}?apikey=${CHAVE_API}&${searchParam}=${encodeURIComponent(estadoBusca.termo)}&page=${estadoBusca.paginaAtual}${parametroAno}`;
    
    // Determina a palavra-chave para a mensagem
    const tipoBuscaMensagem = estadoBusca.tipo === 'actor' ? 'ator/atriz' : 'título';
    
    try {
        const resposta = await fetch(url);
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP! Status: ${resposta.status}`);
        }
        
        const dados = await resposta.json();

        if (dados.Response === "False") {
            const termoCompleto = estadoBusca.termo + (anoBusca ? ` (${anoBusca})` : '');
            mensagemStatus.textContent = 
                `Nenhum resultado encontrado para "${termoCompleto}" como ${tipoBuscaMensagem}. (Dica: A OMDb é fraca para busca por ator/elenco.)`;
            estadoBusca.totalResultados = 0;
            listaResultados.innerHTML = "";
            
        } else {
            estadoBusca.totalResultados = parseInt(dados.totalResults, 10);
            
            exibirFilmes(dados.Search);
            
            const anoExibicao = anoBusca ? ` (Ano: ${anoBusca})` : '';
            mensagemStatus.textContent = 
                `Pág. ${estadoBusca.paginaAtual} de ${Math.ceil(estadoBusca.totalResultados / 10)} — ${estadoBusca.totalResultados} resultados encontrados para "${estadoBusca.termo}"${anoExibicao} (Tipo: ${tipoBuscaMensagem}).`;
        }

    } catch (erro) {
        console.error("Erro na busca:", erro);
        mensagemStatus.textContent = "❌ Erro ao buscar dados. Verifique sua conexão ou a chave da API.";
        estadoBusca.totalResultados = 0;
        
    } finally {
        atualizarPaginacao();
    }
}

// Função para mostrar filmes
function exibirFilmes(filmes) {
    listaResultados.innerHTML = ""; 
    
    const htmlFilmes = filmes.map(filme => {
        const poster = filme.Poster !== "N/A"
            ? filme.Poster
            : PLACEHOLDER_POSTER;
        
        return `
            <div class="card">
                <img src="${poster}" alt="Pôster do filme ${filme.Title}" loading="lazy">
                <h3>${filme.Title}</h3>
                <p>Ano: ${filme.Year} (${filme.Type})</p>
            </div>
        `;
    }).join(''); 
    
    listaResultados.innerHTML = htmlFilmes;
}

// Inicia a aplicação
inicializarEventos();