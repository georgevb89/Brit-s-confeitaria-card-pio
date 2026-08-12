console.log("O script.js foi carregado com sucesso!");

// Array de produtos (agora com a propriedade 'disponivel' e 'categoria')
const produtos = [
    {
        nome: "Bolo de Cenoura com Brigadeiro",
        descricao: "Delicioso bolo de cenoura fofinho com uma generosa cobertura de brigadeiro cremoso.",
        preco: 45.00,
        imagem: "bolo_cenoura.jpg",
        disponivel: true, // NOVO: Disponibilidade do produto
        categoria: "Bolo" // NOVO: Categoria do produto
    },
    {
        nome: "Torta de Limão",
        descricao: "Clássica torta de limão com base crocante e merengue suíço maçaricado.",
        preco: 38.00,
        imagem: "torta_limao.jpg",
        disponivel: true,
        categoria: "Sobremesa"
    },
    {
        nome: "Brigadeiro Gourmet",
        descricao: "Caixa com 6 unidades de brigadeiros gourmet variados (tradicional, ninho, churros).",
        preco: 25.00,
        imagem: "brigadeiro_gourmet.jpg",
        disponivel: true,
        categoria: "Brigadeiro"
    },
    {
        nome: "Cupcake de Chocolate",
        descricao: "Cupcake macio de chocolate com cobertura de ganache e granulado.",
        preco: 12.00,
        imagem: "cupcake_chocolate.jpg",
        disponivel: true, // Exemplo de produto indisponível
        categoria: "Bolo"
    },
    {
        nome: "Pudim de Leite Condensado",
        descricao: "Tradicional pudim de leite condensado com calda de caramelo.",
        preco: 30.00,
        imagem: "pudim_leite.jpg",
        disponivel: true,
        categoria: "Sobremesa"
    },
    {
        nome: "Bolo de Chocolate Trufado",
        descricao: "Bolo intenso de chocolate com recheio e cobertura de trufa cremosa.",
        preco: 60.00,
        imagem: "bolo_chocolate_trufado.jpg",
        disponivel: true,
        categoria: "Bolo"
    },
    {
        nome: "Bolo no Pote de Morango",
        descricao: "Delicioso bolo no pote com camadas de massa, creme e morangos frescos.",
        preco: 18.00,
        imagem: "bolo_pote_morango.jpg",
        disponivel: true,
        categoria: "Bolo no Pote"
    },
    {
        nome: "Copo da Felicidade",
        descricao: "Camadas de brownie, brigadeiro, chantilly e frutas vermelhas no copo.",
        preco: 25.00,
        imagem: "copo_felicidade.jpg",
        disponivel: true,
        categoria: "Copo"
    },
    {
        nome: "Coxinha de Frango",
        descricao: "Tradicional coxinha de frango com catupiry, crocante por fora e cremosa por dentro.",
        preco: 8.00,
        imagem: "coxinha_frango.jpg",
        disponivel: true,
        categoria: "Salgados"
    },
    {
        nome: "Refrigerante Lata",
        descricao: "Coca-Cola, Guaraná ou Soda Limonada, Laranja (350ml).",
        preco: 6.00,
        imagem: "refrigerante.jpg",
        disponivel: true,
        categoria: "Bebidas"
    }
];

// Carrega o carrinho do Local Storage ou inicializa como vazio
let carrinho = JSON.parse(localStorage.getItem('carrinhoBritS')) || [];

// Referências aos elementos HTML
const listaProdutosDiv = document.querySelector('.lista-produtos');
const carrinhoItensDiv = document.querySelector('.carrinho-itens');
const totalCarrinhoSpan = document.getElementById('total-carrinho');
// MUDANÇA AQUI: Selecionando o botão pelo ID
const botaoFinalizarCompra = document.getElementById('confirmar-pedido-btn');
const categoriasNav = document.getElementById('categorias-nav'); // NOVO: Referência para a navegação de categorias

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

// Variável para armazenar a categoria atualmente selecionada
let categoriaAtual = 'Todos';


// Função para salvar o carrinho no Local Storage
function salvarCarrinho() {
    localStorage.setItem('carrinhoBritS', JSON.stringify(carrinho));
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

        produtoItemDiv.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <p class="descricao">${produto.descricao}</p>
            <p class="preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
            ${produto.disponivel
                ? `<button class="adicionar-carrinho" data-nome="${produto.nome}" data-preco="${produto.preco}">Adicionar ao Carrinho</button>`
                : `<button class="adicionar-carrinho indisponivel-btn" disabled>Indisponível</button>`
            }
        `;
        listaProdutosDiv.appendChild(produtoItemDiv);
    });

    // Adiciona event listeners apenas para botões de produtos disponíveis
    document.querySelectorAll('.adicionar-carrinho:not(.indisponivel-btn)').forEach(botao => {
        botao.addEventListener('click', (evento) => {
            const nomeProduto = evento.target.dataset.nome;
            const precoProduto = parseFloat(evento.target.dataset.preco);

            const produtoExistente = carrinho.find(item => item.nome === nomeProduto);

            if (produtoExistente) {
                produtoExistente.quantidade++;
            } else {
                const produtoAdicionar = {
                    nome: nomeProduto,
                    preco: precoProduto,
                    quantidade: 1
                };
                carrinho.push(produtoAdicionar);
            }

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
                <span>${item.nome}</span>
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

    totalCarrinhoSpan.textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;

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
}


// Funcionalidade para o botão Finalizar Compra
botaoFinalizarCompra.addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('Seu pedido está vazio. Adicione alguns produtos antes de finalizar a compra!');
        return;
    }

    // Coleta os dados do formulário de endereço
    const nome = nomeClienteInput.value.trim();
    const telefone = telefoneClienteInput.value.trim();
    const rua = ruaClienteInput.value.trim();
    const numero = numeroClienteInput.value.trim();
    const complemento = complementoClienteInput.value.trim();
    const bairro = bairroClienteInput.value.trim();
    const cidade = cidadeClienteInput.value.trim();
    const estado = estadoClienteInput.value.trim();
    const cep = cepClienteInput.value.trim();

    // Validação simples dos campos obrigatórios
    if (!nome || !telefone || !rua || !numero || !bairro || !cidade || !estado || !cep) {
        alert('Por favor, preencha todos os campos obrigatórios de entrega.');
        return;
    }

    // Formata os itens do carrinho para a mensagem
    let itensPedido = '';
    carrinho.forEach(item => {
        itensPedido += `- ${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}\n`;
    });

    const totalPedido = totalCarrinhoSpan.textContent; // Pega o total já formatado

    // Monta a mensagem final
    const mensagemPedido = `
Olá! Tenho um novo pedido da Brit's Confeitaria:

*Itens:*
${itensPedido}
*Total:* ${totalPedido}

*Dados para Entrega:*
Nome: ${nome}
Telefone: ${telefone}
Endereço: ${rua}, ${numero} ${complemento ? `(${complemento})` : ''}
Bairro: ${bairro}
Cidade/Estado: ${cidade}/${estado}
CEP: ${cep}

Aguardando a confirmação!
    `;

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

// Chama as funções iniciais ao carregar a página
renderizarProdutos();
atualizarCarrinhoHTML();
renderizarCategorias(); // NOVO: Renderiza as categorias ao carregar a página
