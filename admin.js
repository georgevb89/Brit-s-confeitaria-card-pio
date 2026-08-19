const auth = firebase.auth();
const db = firebase.database();

let idsRenderizados = new Set();
let primeiraCargaConcluida = false;

// ---------- LOGIN / LOGOUT ----------

function fazerLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const erroEl = document.getElementById('loginErro');
    erroEl.textContent = '';

    if (!email || !senha) {
        erroEl.textContent = 'Preencha e-mail e senha.';
        return;
    }

    auth.signInWithEmailAndPassword(email, senha)
        .catch(() => {
            erroEl.textContent = 'E-mail ou senha incorretos.';
        });
}

function fazerLogout() {
    auth.signOut();
}

// Permite logar apertando Enter no campo de senha
document.getElementById('loginSenha').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fazerLogin();
});

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('painel').style.display = 'block';
        iniciarEscutaPedidos();
    } else {
        document.getElementById('telaLogin').style.display = 'flex';
        document.getElementById('painel').style.display = 'none';
        idsRenderizados = new Set();
        primeiraCargaConcluida = false;
    }
});

// ---------- SOM DE ALERTA ----------

function tocarAlerta() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bip = (freq, atraso) => {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.45);
            }, atraso);
        };
        bip(880, 0);
        bip(1046, 260);
    } catch (e) {
        console.log('Não foi possível tocar o alerta sonoro:', e);
    }
}

// ---------- HELPERS ----------

function formatarPreco(v) {
    return `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
}

function formatarHora(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ---------- MONTAGEM DO CARD DE PEDIDO ----------

function montarCardPedido(id, pedido, comAcoes) {
    const div = document.createElement('div');
    div.classList.add('pedido-card');
    if (comAcoes) {
        div.classList.add('novo');
        div.id = `pendente-${id}`; // id só usado na lista de pendentes, pra remover certinho
    }

    let itensHtml = '';
    (pedido.itens || []).forEach(item => {
        itensHtml += `<li><span>${item.quantidade}x ${item.nome}</span><span>${formatarPreco(item.preco * item.quantidade)}</span></li>`;
    });

    let enderecoHtml = '';
    if (pedido.tipoEntrega === 'entrega' && pedido.endereco) {
        const e = pedido.endereco;
        enderecoHtml = `<div class="pedido-endereco">📍 ${e.rua || ''}, ${e.numero || ''} ${e.complemento ? '(' + e.complemento + ')' : ''} — ${e.bairro || ''}, ${e.cidade || ''}/${e.estado || ''} — CEP ${e.cep || ''}</div>`;
    }

    const obsHtml = pedido.observacoes ? `<div class="pedido-obs">📝 ${pedido.observacoes}</div>` : '';

    const tagStatus = {
        pendente: '<span class="pedido-tag tag-status-pendente">Pendente</span>',
        aceito: '<span class="pedido-tag tag-status-aceito">Aceito</span>',
        recusado: '<span class="pedido-tag tag-status-recusado">Recusado</span>'
    }[pedido.status] || '';

    let freteLinha = '';
    if (pedido.tipoEntrega === 'entrega') {
        freteLinha = `<div class="pedido-total-linha"><span>Entrega</span><span>${pedido.frete != null ? formatarPreco(pedido.frete) : 'A confirmar'}</span></div>`;
    }

    div.innerHTML = `
        <div class="pedido-topo">
            <div>
                <div class="pedido-cliente">${pedido.nome || 'Cliente'}</div>
                <div>
                    <span class="pedido-tag ${pedido.tipoEntrega === 'entrega' ? 'tag-entrega' : 'tag-retirada'}">${pedido.tipoEntrega === 'entrega' ? '🛵 Entrega' : '🏠 Retirada'}</span>
                    <span class="pedido-tag tag-pagamento">💰 ${pedido.formaPagamento || ''}${pedido.troco ? ' (troco p/ ' + pedido.troco + ')' : ''}</span>
                    ${tagStatus}
                </div>
            </div>
            <div class="pedido-hora">${formatarHora(pedido.timestamp)}</div>
        </div>
        <div>📞 ${pedido.telefone || ''}</div>
        <ul class="pedido-itens">${itensHtml}</ul>
        <div class="pedido-total-linha"><span>Subtotal</span><span>${formatarPreco(pedido.subtotal)}</span></div>
        ${freteLinha}
        <div class="pedido-total-linha total-final"><span>Total</span><span>${pedido.total != null ? formatarPreco(pedido.total) : 'A confirmar'}</span></div>
        ${enderecoHtml}
        ${obsHtml}
        ${comAcoes ? `
        <div class="pedido-acoes">
            <button class="btn-aceitar" onclick="responderPedido('${id}', 'aceito')">✅ Aceitar</button>
            <button class="btn-recusar" onclick="responderPedido('${id}', 'recusado')">✖ Recusar</button>
        </div>` : ''}
    `;
    return div;
}

function responderPedido(id, novoStatus) {
    db.ref('pedidos/' + id).update({ status: novoStatus })
        .catch(err => alert('Não foi possível atualizar o pedido: ' + err.message));
}

function atualizarContador() {
    document.getElementById('contadorPendentes').textContent = idsRenderizados.size;
}

// ---------- ESCUTA EM TEMPO REAL ----------

// ---------- STATUS / HORÁRIO DA LOJA ----------

const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const horariosPadraoAdmin = [
    { aberto: true, abre: '09:00', fecha: '13:00' }, // Domingo
    { aberto: true, abre: '10:00', fecha: '18:00' }, // Segunda
    { aberto: true, abre: '09:00', fecha: '21:00' }, // Terça
    { aberto: true, abre: '09:00', fecha: '18:00' }, // Quarta
    { aberto: true, abre: '09:00', fecha: '21:00' }, // Quinta
    { aberto: true, abre: '09:00', fecha: '21:00' }, // Sexta
    { aberto: true, abre: '09:00', fecha: '16:00' }  // Sábado
];

function montarLinhasHorario(horarios) {
    const container = document.getElementById('listaHorarios');
    container.innerHTML = '';
    diasSemana.forEach((nomeDia, i) => {
        const dia = (horarios && horarios[i]) || horariosPadraoAdmin[i];
        const linha = document.createElement('div');
        linha.classList.add('linha-horario');
        linha.innerHTML = `
            <label class="dia-checkbox">
                <input type="checkbox" id="diaAberto${i}" ${dia.aberto ? 'checked' : ''}> ${nomeDia}
            </label>
            <input type="time" id="diaAbre${i}" value="${dia.abre}">
            <span>até</span>
            <input type="time" id="diaFecha${i}" value="${dia.fecha}">
        `;
        container.appendChild(linha);
    });
}

function salvarHorarios() {
    const horarios = diasSemana.map((_, i) => ({
        aberto: document.getElementById('diaAberto' + i).checked,
        abre: document.getElementById('diaAbre' + i).value || '08:00',
        fecha: document.getElementById('diaFecha' + i).value || '18:00'
    }));
    db.ref('configuracao/loja/horarios').set(horarios)
        .then(() => {
            const msg = document.getElementById('horariosSalvosMsg');
            msg.textContent = '✅ Horários salvos!';
            setTimeout(() => { msg.textContent = ''; }, 3000);
        })
        .catch(err => alert('Erro ao salvar horários: ' + err.message));
}

// Só ESCREVE o modo escolhido; quem atualiza os botões na tela é o listener em escutarConfigLoja()
function definirModoLoja(modo) {
    db.ref('configuracao/loja/modoManual').set(modo)
        .catch(err => alert('Erro ao atualizar o status da loja: ' + err.message));
}

function marcarModoSelecionado(modo) {
    document.getElementById('btnModoAuto').classList.toggle('selecionado', modo === 'auto');
    document.getElementById('btnModoAberto').classList.toggle('selecionado', modo === 'aberto');
    document.getElementById('btnModoFechado').classList.toggle('selecionado', modo === 'fechado');
}

function calcularAbertoPorHorarioAdmin(horarios) {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const diaConfig = (horarios && horarios[diaSemana]) || horariosPadraoAdmin[diaSemana];
    if (!diaConfig || !diaConfig.aberto) return false;
    const [ha, ma] = diaConfig.abre.split(':').map(Number);
    const [hf, mf] = diaConfig.fecha.split(':').map(Number);
    return minutosAgora >= (ha * 60 + ma) && minutosAgora < (hf * 60 + mf);
}

function escutarConfigLoja() {
    db.ref('configuracao/loja').on('value', snap => {
        const config = snap.val() || {};
        montarLinhasHorario(config.horarios);

        const modo = config.modoManual || 'auto';
        marcarModoSelecionado(modo);

        let aberta;
        if (modo === 'aberto') aberta = true;
        else if (modo === 'fechado') aberta = false;
        else aberta = calcularAbertoPorHorarioAdmin(config.horarios);

        document.getElementById('lojaStatusAtual').textContent = aberta ? '🟢 Aberta' : '🔴 Fechada';
    });
}

function iniciarEscutaPedidos() {
    document.getElementById('statusConexao').textContent = 'Conectado — atualizando em tempo real';

    escutarConfigLoja();

    const refPendentes = db.ref('pedidos').orderByChild('status').equalTo('pendente');
    const listaPendentesEl = document.getElementById('listaPendentes');

    // Carrega os pedidos pendentes já existentes, sem tocar som
    refPendentes.once('value').then(snapshot => {
        listaPendentesEl.innerHTML = '';
        snapshot.forEach(child => {
            listaPendentesEl.appendChild(montarCardPedido(child.key, child.val(), true));
            idsRenderizados.add(child.key);
        });
        if (idsRenderizados.size === 0) {
            listaPendentesEl.innerHTML = '<p class="vazio">Nenhum pedido novo no momento.</p>';
        }
        atualizarContador();
        primeiraCargaConcluida = true;

        // A partir daqui, qualquer pedido novo dispara som + aparece na hora
        refPendentes.on('child_added', snap => {
            if (idsRenderizados.has(snap.key)) return; // já estava na carga inicial
            const vazio = listaPendentesEl.querySelector('.vazio');
            if (vazio) vazio.remove();
            listaPendentesEl.prepend(montarCardPedido(snap.key, snap.val(), true));
            idsRenderizados.add(snap.key);
            atualizarContador();
            if (primeiraCargaConcluida) tocarAlerta();
        });

        // Quando o pedido é aceito/recusado, some da lista de pendentes
        refPendentes.on('child_removed', snap => {
            idsRenderizados.delete(snap.key);
            const card = document.getElementById('pendente-' + snap.key);
            if (card) card.remove();
            if (idsRenderizados.size === 0) {
                listaPendentesEl.innerHTML = '<p class="vazio">Nenhum pedido novo no momento.</p>';
            }
            atualizarContador();
        });
    });

    // Histórico: últimos 15 pedidos (qualquer status), só pra consulta
    db.ref('pedidos').orderByChild('timestamp').limitToLast(15).on('value', snapshot => {
        const listaHistoricoEl = document.getElementById('listaHistorico');
        const itens = [];
        snapshot.forEach(child => itens.push({ id: child.key, pedido: child.val() }));
        itens.reverse();
        listaHistoricoEl.innerHTML = '';
        if (itens.length === 0) {
            listaHistoricoEl.innerHTML = '<p class="vazio">Ainda não há pedidos no histórico.</p>';
            return;
        }
        itens.forEach(({ id, pedido }) => {
            listaHistoricoEl.appendChild(montarCardPedido(id, pedido, false));
        });
    });
}
