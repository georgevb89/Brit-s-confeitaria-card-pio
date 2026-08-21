console.log("O script.js foi carregado com sucesso!");

// Produtos e cupons agora vêm do Firebase (gerenciados pelo painel admin.html).
// Começam vazios e são preenchidos assim que a função escutarProdutos()/escutarCupons() carregar os dados.
let produtos = [];

// Carrega o carrinho do Local Storage ou inicializa como vazio
let carrinho = JSON.parse(localStorage.getItem('carrinhoBritS')) || [];

/* ===================================================================
   TABELA DE BAIRROS E DISTÂNCIA EM KM ATÉ A CONFEITARIA
   (mesma tabela usada no catálogo de referência)
   =================================================================== */
const bairrosEntrega = {
    "barbados": 0,
    "colatina velha": 8,
    "centro": 9,
    "lace": 10,
    "esplanada": 9.7,
    "mario giurizatto": 6.2,
    "sao silvano": 11,
    "marista": 11,
    "fazenda vitali": 10.5,
    "maria ismenia": 11,
    "maria esmenia": 11,
    "vila lenira": 11,
    "vila nova": 10,
    "vila amelia": 12,
    "vila real": 12,
    "operario": 9,
    "bela vista": 9,
    "residencial nobre": 10,
    "vista da serra": 10,
    "honorio fraga": 15,
    "castelo branco": 10,
    "maria das gracas": 9,
    "morada do sol": 14,
    "perpetuo socorro": 10,
    "nossa senhora aparecida": 12,
    "jardim planalto": 11,
    "moacir brotas": 11,
    "moacyr brotas": 11,
    "por do sol": 9,
    "sao pedro": 15,
    "sao judas tadeu": 9,
    "sao braz": 10,
    "santo antonio": 12,
    "santa helena": 7,
    "santa margarida": 7,
    "santa monica": 11,
    "riviera": 8,
    "francisco simonassi": 12.3,
    "fioravante marino": 12,
    "cidade jardim": 14,
    "aeroporto": 12,
    "ayrton senna": 20,
    "alto sao vicente": 10,
    "alto vila nova": 10,
    "adelia giuberti": 10,
    "antonio damiani": 12,
    "benjamin carlos dos santos": 7,
    "carlos germano naumann": 14,
    "industrial alves marques": 12,
    "novo horizonte": 14,
    "sao marcos": 14,
    "vicente soella i": 25,
    "vicente soella ii": 27,
    "vicente soella iii": 29,
    "vila verde": 15,
    "vista linda": 15,
    "santos dumont": 15,
    "raul giuberti": 12,
    "olivio zanoteli": 13,
    "padre jose de anchieta": 12.3,
    "parque dos jacarandas": 12
};
const valorPorKm = 0.70;

// Estado atual do cálculo de frete (retirada é a opção padrão, então começa sem frete)
let freteAtual = 0;
let freteConfirmado = true;

// Referências aos elementos HTML
const listaProdutosDiv = document.querySelector('.lista-produtos');
const carrinhoItensDiv = document.querySelector('.carrinho-itens');
const subtotalCarrinhoSpan = document.getElementById('subtotal-carrinho');
const freteCarrinhoSpan = document.getElementById('frete-carrinho');
const totalCarrinhoSpan = document.getElementById('total-carrinho');
const botaoFinalizarCompra = document.querySelector('.finalizar-compra');
const categoriasNav = document.getElementById('categorias-nav'); // NOVO: Referência para a navegação de categorias
const infoFreteDiv = document.getElementById('infoFrete');

// Referências aos campos do formulário de endereço
const nomeClienteInput = document.getElementById('nomeCliente');
const telefoneClienteInput = document.getElementById('telefoneCliente');
const ruaClienteInput = document.getElementById('ruaCliente');
const numeroClienteInput = document.getElementById('numeroCliente');
const complementoClienteInput = document.getElementById('complementoCliente');
const bairroClienteInput = document.getElementById('bairroCliente');
const cidadeClienteInput = document.getElementById('cidadeCliente');
const estadoClienteInput = document.getElementById('estadoCliente');
const cepClienteInput = document.getElementById('cepCliente');
const clienteTrocoInput = document.getElementById('clienteTroco');
const clienteObsInput = document.getElementById('clienteObs');
const areaEntregaDiv = document.getElementById('areaEntrega');
const areaTrocoDiv = document.getElementById('areaTroco');

// Variável para armazenar a categoria atualmente selecionada
let categoriaAtual = 'Todos';

// Estado de como o cliente quer receber o pedido e a forma de pagamento
let tipoEntregaAtual = 'retirada';
let formaPagamentoAtual = 'Pix';

/* ===================================================================
   Os cupons de desconto agora são gerenciados pelo painel (admin.html),
   dentro da seção "🎟️ Cupons de desconto". Aqui só carregamos o que
   estiver cadastrado no Firebase.
   =================================================================== */
let cupons = {};

let cupomAplicado = null; // { codigo, tipo, valor }

function calcularDesconto(subtotal) {
    if (!cupomAplicado) return 0;
    if (cupomAplicado.tipo === 'percentual') return subtotal * (cupomAplicado.valor / 100);
    if (cupomAplicado.tipo === 'fixo') return Math.min(cupomAplicado.valor, subtotal);
    return 0; // frete_gratis não desconta o subtotal
}

function aplicarCupom() {
    const input = document.getElementById('cupomInput');
    const msg = document.getElementById('cupomMensagem');
    const codigo = input.value.trim().toUpperCase();

    if (!codigo) {
        msg.textContent = 'Digite um cupom.';
        msg.className = 'cupom-mensagem erro';
        return;
    }

    const cupom = cupons[codigo];
    if (!cupom) {
        cupomAplicado = null;
        msg.textContent = 'Cupom inválido.';
        msg.className = 'cupom-mensagem erro';
        atualizarCarrinhoHTML();
        return;
    }

    cupomAplicado = { codigo, ...cupom };
    msg.textContent = '✅ Cupom aplicado!';
    msg.className = 'cupom-mensagem sucesso';
    atualizarCarrinhoHTML();
}

// Salva o pedido no Firebase para aparecer em tempo real no painel da loja (admin.html)
// Horário padrão de funcionamento, usado enquanto a loja não configura nada no painel.
// Índice: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
const horariosPadrao = [
    { aberto: true, abre: '09:00', fecha: '13:00' }, // Domingo
    { aberto: true, abre: '10:00', fecha: '18:00' }, // Segunda
    { aberto: true, abre: '09:00', fecha: '21:00' }, // Terça
    { aberto: true, abre: '09:00', fecha: '18:00' }, // Quarta
    { aberto: true, abre: '09:00', fecha: '21:00' }, // Quinta
    { aberto: true, abre: '09:00', fecha: '21:00' }, // Sexta
    { aberto: true, abre: '09:00', fecha: '16:00' }  // Sábado
];

let lojaAbertaAtual = true;

function horarioParaMinutos(hhmm) {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

// Calcula se a loja está aberta agora, considerando o horário do dia da semana atual
function calcularAbertoPorHorario(horarios) {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const diaConfig = (horarios && horarios[diaSemana]) || horariosPadrao[diaSemana];

    if (!diaConfig || !diaConfig.aberto) return false;

    const abre = horarioParaMinutos(diaConfig.abre);
    const fecha = horarioParaMinutos(diaConfig.fecha);
    return minutosAgora >= abre && minutosAgora < fecha;
}

// Atualiza a faixa de status da loja e bloqueia/libera o botão de finalizar compra
function atualizarStatusLoja(config) {
    const banner = document.getElementById('statusLojaBanner');
    const texto = document.getElementById('statusLojaTexto');
    if (!banner || !texto) return;

    const horarios = config && config.horarios;
    const modoManual = config && config.modoManual;

    let aberta;
    if (modoManual === 'aberto') aberta = true;
    else if (modoManual === 'fechado') aberta = false;
    else aberta = calcularAbertoPorHorario(horarios);

    lojaAbertaAtual = aberta;

    banner.classList.remove('loja-aberta', 'loja-fechada');
    if (aberta) {
        banner.classList.add('loja-aberta');
        texto.textContent = '🟢 Estamos abertos! Pode fazer seu pedido.';
        if (botaoFinalizarCompra) {
            botaoFinalizarCompra.disabled = false;
            botaoFinalizarCompra.textContent = 'Finalizar Compra';
        }
    } else {
        banner.classList.add('loja-fechada');
        texto.textContent = '🔴 Estamos fechados no momento. Você pode ver o cardápio, mas os pedidos abrem no nosso próximo horário de funcionamento.';
        if (botaoFinalizarCompra) {
            botaoFinalizarCompra.disabled = true;
            botaoFinalizarCompra.textContent = 'Loja fechada no momento';
        }
    }
}

// Escuta o status da loja em tempo real e reavalia a cada minuto (pra fechar/abrir sozinho no horário)
function escutarStatusLoja() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
        atualizarStatusLoja(null);
        return;
    }
    firebase.database().ref('configuracao/loja').on('value', snap => {
        atualizarStatusLoja(snap.val());
    });
    setInterval(() => {
        firebase.database().ref('configuracao/loja').once('value').then(snap => atualizarStatusLoja(snap.val()));
    }, 60000);
}

// Carrega o cardápio do Firebase e re-renderiza sozinho sempre que algo mudar no painel
function escutarProdutos() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
        listaProdutosDiv.innerHTML = '<p class="cardapio-erro">Não foi possível carregar o cardápio agora. Recarregue a página em instantes.</p>';
        return;
    }
    firebase.database().ref('produtos').on('value', snap => {
        const val = snap.val() || {};
        const lista = Object.values(val).filter(p => p && p.nome);
        lista.sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));
        produtos = lista;
        sincronizarPrecosCarrinho();
        renderizarCategorias();
        renderizarProdutos();
        atualizarCarrinhoHTML();
        atualizarAvisoOferta();
    });
}

// Mostra um aviso chamativo quando algum produto disponível está em oferta
function atualizarAvisoOferta() {
    const banner = document.getElementById('ofertaBanner');
    if (!banner) return;
    const temOferta = produtos.some(p => p.disponivel && p.precoOriginal && p.precoOriginal > p.preco);
    banner.style.display = (temOferta && !ofertaBannerFechadoPeloUsuario) ? 'flex' : 'none';
}

let ofertaBannerFechadoPeloUsuario = false;

function fecharAvisoOferta() {
    ofertaBannerFechadoPeloUsuario = true;
    const banner = document.getElementById('ofertaBanner');
    if (banner) banner.style.display = 'none';
}

// Carrega os cupons de desconto cadastrados no painel
function escutarCupons() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
    firebase.database().ref('cupons').on('value', snap => {
        cupons = snap.val() || {};
    });
}

function salvarPedidoNoPainel(dadosPedido) {
    try {
        if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
            console.log('Firebase indisponível — pedido seguirá só pelo WhatsApp.');
            return null;
        }
        const novoPedidoRef = firebase.database().ref('pedidos').push();
        novoPedidoRef.set({
            ...dadosPedido,
            status: 'pendente',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).catch(err => console.log('Não foi possível salvar o pedido no painel:', err));
        return novoPedidoRef.key;
    } catch (err) {
        console.log('Não foi possível salvar o pedido no painel:', err);
        return null;
    }
}

// Acompanha em tempo real o status (pendente/aceito/recusado) de um pedido pro cliente
let refStatusPedidoAtual = null;

function mostrarStatusPedido(pedidoId) {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
    const banner = document.getElementById('statusPedidoBanner');
    const texto = document.getElementById('statusPedidoTexto');
    if (!banner || !texto) return;

    if (refStatusPedidoAtual) {
        refStatusPedidoAtual.off();
    }

    const ref = firebase.database().ref('pedidos/' + pedidoId + '/status');
    refStatusPedidoAtual = ref;

    ref.on('value', snap => {
        const status = snap.val();
        if (!status) return;
        banner.classList.remove('status-pendente', 'status-aceito', 'status-recusado');
        if (status === 'pendente') {
            banner.classList.add('status-pendente');
            texto.textContent = '🕒 Pedido enviado! Aguardando a confirmação da loja...';
        } else if (status === 'aceito') {
            banner.classList.add('status-aceito');
            texto.textContent = '✅ Seu pedido foi aceito e já está sendo preparado!';
        } else if (status === 'recusado') {
            banner.classList.add('status-recusado');
            texto.textContent = '❌ Seu pedido foi recusado. Fale com a gente pelo WhatsApp para mais detalhes.';
        }
        banner.style.display = 'flex';
    });
}

function fecharStatusPedido() {
    const banner = document.getElementById('statusPedidoBanner');
    if (banner) banner.style.display = 'none';
    if (refStatusPedidoAtual) {
        refStatusPedidoAtual.off();
        refStatusPedidoAtual = null;
    }
    localStorage.removeItem('ultimoPedidoBritS');
}

// Se o cliente tem um pedido recente rastreado (últimas 48h), volta a mostrar o status dele
function verificarPedidoSalvo() {
    try {
        const dados = JSON.parse(localStorage.getItem('ultimoPedidoBritS'));
        if (dados && dados.id) {
            const QUARENTA_OITO_HORAS = 48 * 60 * 60 * 1000;
            if (Date.now() - dados.criadoEm < QUARENTA_OITO_HORAS) {
                mostrarStatusPedido(dados.id);
            } else {
                localStorage.removeItem('ultimoPedidoBritS');
            }
        }
    } catch (e) {
        // localStorage vazio ou inválido, ignora
    }
}

// Preenche o formulário com os dados salvos da última compra (nome, telefone, endereço)
function carregarDadosClienteSalvos() {
    try {
        const dados = JSON.parse(localStorage.getItem('dadosClienteBritS'));
        if (!dados) return;
        if (dados.nome) nomeClienteInput.value = dados.nome;
        if (dados.telefone) telefoneClienteInput.value = dados.telefone;
        if (dados.rua) ruaClienteInput.value = dados.rua;
        if (dados.numero) numeroClienteInput.value = dados.numero;
        if (dados.complemento) complementoClienteInput.value = dados.complemento;
        if (dados.bairro) bairroClienteInput.value = dados.bairro;
        if (dados.cidade) cidadeClienteInput.value = dados.cidade;
        if (dados.estado) estadoClienteInput.value = dados.estado;
        if (dados.cep) cepClienteInput.value = dados.cep;
        if (dados.tipoEntrega === 'entrega') {
            selecionarTipoEntrega('entrega');
            if (dados.cep) calcularFrete(); // recalcula o frete, o valor pode ter mudado
        }
    } catch (e) {
        // localStorage vazio ou inválido, ignora
    }
}


// Função para salvar o carrinho no Local Storage
function salvarCarrinho() {
    localStorage.setItem('carrinhoBritS', JSON.stringify(carrinho));
}

// Alterna entre "Retirar no local" e "Entrega", mostrando/escondendo o endereço
function selecionarTipoEntrega(tipo) {
    tipoEntregaAtual = tipo;
    document.getElementById('btnRetirada').classList.toggle('selecionado', tipo === 'retirada');
    document.getElementById('btnEntrega').classList.toggle('selecionado', tipo === 'entrega');
    areaEntregaDiv.style.display = tipo === 'entrega' ? 'block' : 'none';

    if (tipo === 'retirada') {
        freteAtual = 0;
        freteConfirmado = true; // não há entrega, então não há valor "a confirmar"
        infoFreteDiv.style.display = 'none';
    } else if (!cepClienteInput.value) {
        freteConfirmado = false;
    }
    atualizarCarrinhoHTML();
}

// Alterna a forma de pagamento e mostra o campo de troco quando for "Dinheiro"
function selecionarPagamento(forma) {
    formaPagamentoAtual = forma;
    document.getElementById('btnPix').classList.toggle('selecionado', forma === 'Pix');
    document.getElementById('btnCartao').classList.toggle('selecionado', forma === 'Cartão');
    document.getElementById('btnDinheiro').classList.toggle('selecionado', forma === 'Dinheiro');
    areaTrocoDiv.style.display = forma === 'Dinheiro' ? 'block' : 'none';
}

// Remove acentos e padroniza texto para comparar nomes de bairro
function normalizar(txt) {
    return (txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Consulta o ViaCEP, calcula o valor da entrega pelo bairro e auto-preenche o endereço
async function calcularFrete() {
    const cep = cepClienteInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        return;
    }

    infoFreteDiv.style.display = 'block';
    infoFreteDiv.textContent = 'Calculando taxa de entrega...';

    try {
        const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await resp.json();

        if (dados.erro) {
            infoFreteDiv.textContent = 'CEP não encontrado. Confirme o valor da entrega pelo WhatsApp.';
            freteAtual = 0;
            freteConfirmado = false;
        } else {
            // Auto-preenche os campos de endereço com o retorno do ViaCEP
            if (dados.logradouro) ruaClienteInput.value = dados.logradouro;
            if (dados.bairro) bairroClienteInput.value = dados.bairro;
            if (dados.localidade) cidadeClienteInput.value = dados.localidade;
            if (dados.uf) estadoClienteInput.value = dados.uf;

            const bairroNormalizado = normalizar(dados.bairro || '');
            if (bairrosEntrega.hasOwnProperty(bairroNormalizado)) {
                const km = bairrosEntrega[bairroNormalizado];
                freteAtual = km * valorPorKm;
                freteConfirmado = true;
                infoFreteDiv.textContent = `Entrega em ${dados.bairro}: R$ ${freteAtual.toFixed(2).replace('.', ',')}`;
            } else {
                freteAtual = 0;
                freteConfirmado = false;
                infoFreteDiv.textContent = `Bairro (${dados.bairro || 'não identificado'}) fora da área calculada automaticamente. O valor da entrega será confirmado pelo WhatsApp.`;
            }
        }
    } catch (err) {
        freteAtual = 0;
        freteConfirmado = false;
        infoFreteDiv.textContent = 'Não foi possível calcular automaticamente. O valor da entrega será confirmado pelo WhatsApp.';
    }

    atualizarCarrinhoHTML();
}

// Função para renderizar os produtos na página
function renderizarProdutos() {
    listaProdutosDiv.innerHTML = '';

    // Filtra os produtos pela categoria atual, se não for 'Todos'
    const produtosFiltrados = categoriaAtual === 'Todos'
        ? produtos
        : produtos.filter(produto => produto.categoria === categoriaAtual);

    produtosFiltrados.forEach(produto => {
        const produtoItemDiv = document.createElement('div');
        produtoItemDiv.classList.add('produto-item');

        // Adiciona a classe 'indisponivel' se o produto não estiver disponível
        if (!produto.disponivel) {
            produtoItemDiv.classList.add('indisponivel');
        }

        // Verifica se o produto está em oferta (tem precoOriginal maior que o preco atual)
        const emOferta = produto.precoOriginal && produto.precoOriginal > produto.preco;

        const temVariantes = Array.isArray(produto.variantes) && produto.variantes.length > 0;

        produtoItemDiv.innerHTML = `
            ${emOferta ? `<div class="produto-tag">🔥 Oferta</div>` : ''}
            <img src="${produto.imagem}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <p class="descricao">${produto.descricao}</p>
            <p class="preco">
                ${emOferta ? `<span class="preco-original">R$ ${produto.precoOriginal.toFixed(2).replace('.', ',')}</span> ` : ''}R$ ${produto.preco.toFixed(2).replace('.', ',')}
            </p>
            ${produto.disponivel
                ? (temVariantes
                    ? `<div class="variantes-lista">${produto.variantes.map(v => `<button type="button" class="variante-pill" data-variante="${v}">${v}</button>`).join('')}</div>`
                    : `<input type="text" class="observacao-item" placeholder="Personalizar (opcional): sabor, tamanho..." maxlength="80">`)
                : ''
            }
            ${produto.disponivel
                ? `<button class="adicionar-carrinho" data-nome="${produto.nome}" data-preco="${produto.preco}">Adicionar ao Carrinho</button>`
                : `<button class="adicionar-carrinho indisponivel-btn" disabled>Indisponível</button>`
            }
        `;
        listaProdutosDiv.appendChild(produtoItemDiv);
    });

    // Clique num "sabor" seleciona ele e desmarca os outros do mesmo produto
    document.querySelectorAll('.variante-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            pill.closest('.variantes-lista').querySelectorAll('.variante-pill').forEach(p => p.classList.remove('selecionada'));
            pill.classList.add('selecionada');
        });
    });

    // Adiciona event listeners apenas para botões de produtos disponíveis
    document.querySelectorAll('.adicionar-carrinho:not(.indisponivel-btn)').forEach(botao => {
        botao.addEventListener('click', (evento) => {
            const nomeProduto = evento.target.dataset.nome;
            const precoProduto = parseFloat(evento.target.dataset.preco);

            const cardProduto = evento.target.closest('.produto-item');
            const varianteSelecionada = cardProduto.querySelector('.variante-pill.selecionada');
            const inputObs = cardProduto.querySelector('.observacao-item');
            const observacaoValor = varianteSelecionada ? varianteSelecionada.dataset.variante : (inputObs ? inputObs.value.trim() : '');

            const produtoExistente = carrinho.find(item => item.nome === nomeProduto && (item.observacao || '') === observacaoValor);

            if (produtoExistente) {
                produtoExistente.quantidade++;
                produtoExistente.preco = precoProduto; // Garante que o preço fica sempre atualizado (ex: entrou em oferta)
            } else {
                const produtoAdicionar = {
                    nome: nomeProduto,
                    preco: precoProduto,
                    quantidade: 1,
                    observacao: observacaoValor || null
                };
                carrinho.push(produtoAdicionar);
            }

            if (inputObs) inputObs.value = '';
            cardProduto.querySelectorAll('.variante-pill').forEach(p => p.classList.remove('selecionada'));

            alert(`${nomeProduto} adicionado ao carrinho!`);
            console.log('Carrinho atual:', carrinho);
            salvarCarrinho();
            atualizarCarrinhoHTML();
        });
    });
}

// NOVO: Função para renderizar as categorias
function renderizarCategorias() {
    // Pega todas as categorias únicas dos produtos
    const categorias = ['Todos', ...new Set(produtos.map(produto => produto.categoria))];

    categoriasNav.innerHTML = ''; // Limpa a navegação de categorias

    categorias.forEach(categoria => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = categoria;
        button.classList.add('categoria-btn');
        if (categoria === categoriaAtual) {
            button.classList.add('active'); // Adiciona classe 'active' para a categoria selecionada
        }
        button.addEventListener('click', () => {
            categoriaAtual = categoria;
            // Remove a classe 'active' de todos os botões e adiciona ao clicado
            document.querySelectorAll('.categoria-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderizarProdutos(); // Renderiza os produtos da nova categoria
        });
        li.appendChild(button);
        categoriasNav.appendChild(li);
    });
}


// Função para atualizar a exibição do carrinho na página
function atualizarCarrinhoHTML() {
    carrinhoItensDiv.innerHTML = '';

    let totalGeral = 0;

    if (carrinho.length === 0) {
        carrinhoItensDiv.innerHTML = '<p>Seu carrinho está vazio.</p>';
    } else {
        carrinho.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('carrinho-item');
            itemDiv.innerHTML = `
                <span>${item.nome}${item.observacao ? ` <em class="obs-mini">(${item.observacao})</em>` : ''}</span>
                <div class="quantidade-controle">
                    <button class="btn-quantidade" data-index="${index}" data-acao="diminuir">-</button>
                    <span>${item.quantidade}</span>
                    <button class="btn-quantidade" data-index="${index}" data-acao="aumentar">+</button>
                </div>
                <span>R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
            `;
            carrinhoItensDiv.appendChild(itemDiv);
            totalGeral += item.preco * item.quantidade;
        });
    }

    subtotalCarrinhoSpan.textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;

    const desconto = calcularDesconto(totalGeral);
    const linhaDesconto = document.getElementById('linhaDesconto');
    const descontoSpan = document.getElementById('desconto-carrinho');
    if (desconto > 0) {
        linhaDesconto.style.display = 'block';
        descontoSpan.textContent = `- R$ ${desconto.toFixed(2).replace('.', ',')}`;
    } else {
        linhaDesconto.style.display = 'none';
    }

    const freteGratisCupom = cupomAplicado && cupomAplicado.tipo === 'frete_gratis';
    const subtotalComDesconto = totalGeral - desconto;

    if (freteConfirmado) {
        const freteFinal = freteGratisCupom ? 0 : freteAtual;
        freteCarrinhoSpan.textContent = freteGratisCupom ? 'Grátis 🎉' : `R$ ${freteAtual.toFixed(2).replace('.', ',')}`;
        totalCarrinhoSpan.textContent = `R$ ${(subtotalComDesconto + freteFinal).toFixed(2).replace('.', ',')}`;
    } else {
        freteCarrinhoSpan.textContent = 'A confirmar';
        totalCarrinhoSpan.textContent = `R$ ${subtotalComDesconto.toFixed(2).replace('.', ',')} + entrega`;
    }

    document.querySelectorAll('.btn-quantidade').forEach(botao => {
        botao.addEventListener('click', (event) => {
            const index = parseInt(event.target.dataset.index);
            const acao = event.target.dataset.acao;
            gerenciarQuantidade(index, acao);
        });
    });
}

// Função para gerenciar a quantidade de um item no carrinho
function gerenciarQuantidade(index, acao) {
    if (acao === 'aumentar') {
        carrinho[index].quantidade++;
    } else if (acao === 'diminuir') {
        if (carrinho[index].quantidade > 1) {
            carrinho[index].quantidade--;
        } else {
            const confirmarRemocao = confirm(`Deseja remover "${carrinho[index].nome}" do carrinho?`);
            if (confirmarRemocao) {
                carrinho.splice(index, 1);
            }
        }
    }
    salvarCarrinho();
    atualizarCarrinhoHTML();
    console.log('Carrinho atual:', carrinho);
}

// Função para limpar os campos do formulário de endereço
function limparFormularioEndereco() {
    nomeClienteInput.value = '';
    telefoneClienteInput.value = '';
    ruaClienteInput.value = '';
    numeroClienteInput.value = '';
    complementoClienteInput.value = '';
    bairroClienteInput.value = '';
    cidadeClienteInput.value = '';
    estadoClienteInput.value = '';
    cepClienteInput.value = '';
    clienteTrocoInput.value = '';
    clienteObsInput.value = '';
    infoFreteDiv.style.display = 'none';
    selecionarTipoEntrega('retirada');
    selecionarPagamento('Pix');

    cupomAplicado = null;
    const cupomInput = document.getElementById('cupomInput');
    const cupomMsg = document.getElementById('cupomMensagem');
    if (cupomInput) cupomInput.value = '';
    if (cupomMsg) { cupomMsg.textContent = ''; cupomMsg.className = 'cupom-mensagem'; }
}


// Funcionalidade para o botão Finalizar Compra
botaoFinalizarCompra.addEventListener('click', () => {
    if (!lojaAbertaAtual) {
        alert('Estamos fechados no momento. Assim que reabrirmos, você já pode finalizar seu pedido!');
        return;
    }
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio. Adicione alguns produtos antes de finalizar a compra!');
        return;
    }

    // Coleta os dados do formulário
    const nome = nomeClienteInput.value.trim();
    const telefone = telefoneClienteInput.value.trim();
    const rua = ruaClienteInput.value.trim();
    const numero = numeroClienteInput.value.trim();
    const complemento = complementoClienteInput.value.trim();
    const bairro = bairroClienteInput.value.trim();
    const cidade = cidadeClienteInput.value.trim();
    const estado = estadoClienteInput.value.trim();
    const cep = cepClienteInput.value.trim();
    const troco = clienteTrocoInput.value.trim();
    const obs = clienteObsInput.value.trim();

    // Validação simples dos campos obrigatórios
    if (!nome || !telefone) {
        alert('Por favor, preencha seu nome e telefone.');
        return;
    }
    if (tipoEntregaAtual === 'entrega' && (!rua || !numero || !bairro || !cidade || !estado || !cep)) {
        alert('Por favor, preencha todos os campos obrigatórios de entrega.');
        return;
    }

    // Formata os itens do carrinho para a mensagem
    let itensPedido = '';
    let subtotalPedido = 0;
    carrinho.forEach(item => {
        const subitem = item.preco * item.quantidade;
        subtotalPedido += subitem;
        itensPedido += `- ${item.nome}${item.observacao ? ` (${item.observacao})` : ''} (x${item.quantidade}) - R$ ${subitem.toFixed(2).replace('.', ',')}\n`;
    });

    const desconto = calcularDesconto(subtotalPedido);
    const freteGratisCupom = cupomAplicado && cupomAplicado.tipo === 'frete_gratis';
    const subtotalTexto = `R$ ${subtotalPedido.toFixed(2).replace('.', ',')}`;
    const frete = (tipoEntregaAtual === 'entrega' && !freteGratisCupom) ? freteAtual : 0;
    const freteTexto = tipoEntregaAtual === 'entrega'
        ? (freteGratisCupom ? 'Grátis (cupom)' : (freteConfirmado ? `R$ ${frete.toFixed(2).replace('.', ',')}` : 'A confirmar pelo WhatsApp'))
        : 'Não se aplica (retirada no local)';
    const totalPedido = (tipoEntregaAtual === 'retirada' || freteConfirmado)
        ? `R$ ${(subtotalPedido - desconto + frete).toFixed(2).replace('.', ',')}`
        : `${subtotalTexto} + entrega (a confirmar)`;

    // Monta a mensagem final
    let mensagemPedido = `🍰 *Novo Pedido - Brit's Confeitaria* 🍰\n\n`;
    mensagemPedido += `*Cliente:* ${nome}\n`;
    mensagemPedido += `*Telefone:* ${telefone}\n`;
    mensagemPedido += `*Tipo:* ${tipoEntregaAtual === 'entrega' ? 'Entrega' : 'Retirada no local'}\n`;
    if (tipoEntregaAtual === 'entrega') {
        mensagemPedido += `*Endereço:* ${rua}, ${numero} ${complemento ? `(${complemento})` : ''}\n`;
        mensagemPedido += `*Bairro:* ${bairro}\n`;
        mensagemPedido += `*Cidade/Estado:* ${cidade}/${estado}\n`;
        mensagemPedido += `*CEP:* ${cep}\n`;
    }
    mensagemPedido += `*Forma de pagamento:* ${formaPagamentoAtual}\n`;
    if (formaPagamentoAtual === 'Dinheiro' && troco) mensagemPedido += `*Troco para:* ${troco}\n`;
    mensagemPedido += `\n*Itens:*\n${itensPedido}\n`;
    mensagemPedido += `*Subtotal:* ${subtotalTexto}\n`;
    if (cupomAplicado) mensagemPedido += `*Cupom:* ${cupomAplicado.codigo}${desconto > 0 ? ` (- R$ ${desconto.toFixed(2).replace('.', ',')})` : ''}\n`;
    if (tipoEntregaAtual === 'entrega') mensagemPedido += `*Taxa de entrega:* ${freteTexto}\n`;
    mensagemPedido += `*Total:* ${totalPedido}\n`;
    if (obs) mensagemPedido += `\n*Observações:* ${obs}\n`;
    mensagemPedido += `\nAguardando a confirmação!`;

    // Salva o pedido no painel da loja (Firebase), sem travar o fluxo caso falhe
    const pedidoId = salvarPedidoNoPainel({
        nome, telefone,
        tipoEntrega: tipoEntregaAtual,
        endereco: tipoEntregaAtual === 'entrega' ? { rua, numero, complemento, bairro, cidade, estado, cep } : null,
        formaPagamento: formaPagamentoAtual,
        troco: (formaPagamentoAtual === 'Dinheiro' && troco) ? troco : null,
        observacoes: obs || null,
        itens: carrinho.map(item => ({ nome: item.nome, preco: item.preco, quantidade: item.quantidade, observacao: item.observacao || null })),
        subtotal: subtotalPedido,
        cupom: cupomAplicado ? cupomAplicado.codigo : null,
        desconto: desconto > 0 ? desconto : 0,
        frete: tipoEntregaAtual === 'entrega' ? (freteConfirmado ? frete : null) : 0,
        total: (tipoEntregaAtual === 'retirada' || freteConfirmado) ? (subtotalPedido - desconto + frete) : null
    });

    // Guarda esse pedido pra mostrar o status (aceito/recusado) pro cliente
    if (pedidoId) {
        localStorage.setItem('ultimoPedidoBritS', JSON.stringify({ id: pedidoId, criadoEm: Date.now() }));
        mostrarStatusPedido(pedidoId);
    }

    // Guarda os dados do cliente pra já vir preenchido na próxima compra
    localStorage.setItem('dadosClienteBritS', JSON.stringify({
        nome, telefone, rua, numero, complemento, bairro, cidade, estado, cep,
        tipoEntrega: tipoEntregaAtual
    }));

    // Configuração e abertura do WhatsApp
    const numeroWhatsApp = '5527997633871'; // Seu número de WhatsApp configurado
    const linkWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(mensagemPedido)}`;

    // Abre o WhatsApp em uma nova aba
    window.open(linkWhatsApp, '_blank');

    // Limpa o carrinho e o formulário após o envio para o WhatsApp
    carrinho = [];
    salvarCarrinho();
    atualizarCarrinhoHTML();
    limparFormularioEndereco();
    console.log('Pedido enviado para o WhatsApp. Carrinho e formulário limpos.');
});

// Atualiza os preços de itens que já estavam salvos no carrinho do navegador,
// caso o preço do produto tenha mudado (ex: entrou ou saiu de oferta) desde a última visita
function sincronizarPrecosCarrinho() {
    let mudou = false;
    carrinho.forEach(item => {
        const produtoAtual = produtos.find(p => p.nome === item.nome);
        if (produtoAtual && produtoAtual.preco !== item.preco) {
            item.preco = produtoAtual.preco;
            mudou = true;
        }
    });
    if (mudou) {
        salvarCarrinho();
    }
}

// Chama as funções iniciais ao carregar a página
escutarProdutos(); // Carrega o cardápio do Firebase (e re-renderiza sozinho quando o painel mudar algo)
escutarCupons(); // Carrega os cupons de desconto cadastrados no painel
atualizarCarrinhoHTML();
carregarDadosClienteSalvos(); // Preenche nome/telefone/endereço da última compra
verificarPedidoSalvo(); // Mostra o status do último pedido, se ainda for recente
escutarStatusLoja(); // Mostra se a loja está aberta ou fechada agora

// Registra o Service Worker (pra permitir instalar como app / carregar mais rápido)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(err => {
            console.log('Não foi possível registrar o service worker:', err);
        });
    });
}
