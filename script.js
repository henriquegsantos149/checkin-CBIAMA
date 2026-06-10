const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('chat-response-field');
const sendButton = document.getElementById('send-button');

// Substitua esta URL pelo link do seu Google Apps Script (Executar como Web App)
const APPS_SCRIPT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbweL2D91roBYKIwRPuxDl5oMaUFrWaJhDd0twt-ze5PdOpZpgELkmAE95t0Qza6tnFuag/exec';

const initialMessages = [
    "Faaaala, tudo bem por aí? 👋 Sou o <b>Agente Pro</b> e serei o responsável por fazer o seu check-in oficial no Congresso Brasileiro de Inteligência Artificial aplicada ao Meio Ambiente. Que alegria ter você com a gente!",
    "Estamos preparando um evento inesquecível! Mas antes de pegar seus dados, deixa eu te contar rapidinho: a Ambiental Pro é muito mais que uma instituição de ensino. Somos um ecossistema do setor ambiental que transforma conhecimento em diferencial competitivo, e conexões em negócios estratégicos. 🌍",
    "Para você ter ideia, já impactamos a carreira de mais de <b>80 mil alunos</b> através dos nossos cursos de extensão e das nossas 5 pós-graduações (todas reconhecidas pelo MEC). 🚀 Bora começar o seu check-in?"
];

const questionSteps = [
    { key: "nome", text: "Para começarmos a preparar tudo, como posso te chamar? Digita seu nome completo aqui embaixo, por favor.", type: "text", placeholder: "Digite o seu nome completo" },
    { key: "nome_cracha", text: "Prazer em te conhecer, {nome}! E me diz uma coisa, no seu crachá do evento, como você prefere que a gente te chame?", type: "text", placeholder: "Ex: João Silva" },
    { key: "email", text: "Anotado! Para te enviarmos todas as informações importantes sobre o evento, qual é o seu melhor e-mail?", type: "text", placeholder: "Digite o seu e-mail" },
    { key: "telefone", text: "Show! E se a nossa equipe precisar te mandar uma mensagem rápida, qual é o seu WhatsApp? (Não esquece de colocar o DDD, tá?)", type: "text", placeholder: "Ex: 11999999999" },
    { key: "genero", text: "Agora, para a gente te conhecer um pouco melhor: com qual gênero você mais se identifica?", type: "select", options: ["Feminino", "Masculino", "Não binário", "Prefiro não especificar", "Outro"], placeholder: "Selecione seu gênero" },
    { key: "nascimento", text: "Legal! E em que dia, mês e ano você nasceu?", type: "date" },
    { key: "escolaridade", text: "Mudando um pouquinho de assunto, como está a sua jornada de estudos? Qual a sua escolaridade atual?", type: "select", options: ["Doutorado", "Mestrado", "Especialização", "Ensino superior completo (bacharelado, licenciatura ou tecnólogo)", "Ensino superior incompleto", "Ensino técnico", "Ensino médio", "Ensino fundamental"], placeholder: "Selecione sua escolaridade" },
    { key: "formacao", text: "Que bacana! E qual é a sua área do coração? Seleciona a sua formação principal aqui.", type: "select", options: ["Engenharia Ambiental", "Engenharia Cartográfica", "Agrária ou Florestal", "Biologia", "Geografia", "Geologia", "Ciências Ambientais", "Outro"], placeholder: "Selecione sua formação" },
    { key: "momento_profissional", text: "Muito bom! E profissionalmente falando, em que momento você está agora?", type: "select", options: ["CLT", "Funcionário Público", "Estudante", "Aposentado", "Empresário", "Autônomo", "Outro"], placeholder: "Selecione" },
    { key: "cargo_empresa", text: "Maravilha! Compartilha com a gente: qual é o seu cargo atual e em qual empresa você trabalha?", type: "text", placeholder: "Digite seu cargo e empresa" },
    { key: "renda", text: "Essa pergunta é para entender melhor o perfil da nossa comunidade para prepararmos conteúdos sob medida: em qual faixa de renda você se encaixa hoje?", type: "select", options: ["Até R$2.000", "De R$2.000 a R$4.000", "De R$4.000 a R$5.000", "De R$5.000 a R$10.000", "De R$10.000 a R$20.000", "Acima de R$20.000", "Prefiro não responder"], placeholder: "Selecione sua renda" },
    { key: "tempo_setor", text: "Estamos quase lá! Há quanto tempo você atua ou estuda no setor ambiental?", type: "select", options: ["Menos de 1 ano", "De 3 a 5 anos", "De 5 a 10 anos", "Há mais de 10 anos"], placeholder: "Selecione o tempo" },
    { key: "restricao_alimentar", text: "Para o nosso Coffee Break ser perfeito para todo mundo, me avisa: você tem alguma restrição alimentar ou alergia?", type: "select", options: ["Não possuo restrições", "Vegetariano(a)", "Vegano(a)", "Intolerância à lactose", "Sem glúten (Celíaco)", "Alergia a castanhas/amendoim"], placeholder: "Selecione" },
    { key: "termo_aceite", text: "E por último, mas super importante: dá uma lida rápida nesse termo para confirmarmos a sua participação:<br><br><i>Autorizo o uso da minha imagem, voz e/ou depoimento captados durante o Congresso Brasileiro de Mapeamento e Inteligência Geográfica pela Ambiental Pro, para fins institucionais, promocionais e educacionais, sem ônus e por prazo indeterminado.</i>", type: "checkbox", label: "Li e concordo com os termos acima." }
];

let userData = {};
let currentStepIndex = 0;
let isAskingQuestions = false;

const inputContainer = document.getElementById('input-container');
const buttonChoices = document.getElementById('button-choices');

// Função para rolar o chat para baixo
function scrollToBottom() {
    chatHistory.scrollTo({
        top: chatHistory.scrollHeight,
        behavior: 'smooth'
    });
}

// Cria o elemento de "digitando"
function createTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot typing-wrapper';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    wrapper.appendChild(indicator);
    return wrapper;
}

// Adiciona uma mensagem ao chat
function addMessage(text, isUser = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isUser ? 'user' : 'bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (isUser) {
        bubble.textContent = text;
    } else {
        bubble.innerHTML = text;
    }

    wrapper.appendChild(bubble);
    chatHistory.appendChild(wrapper);
    scrollToBottom();
}

// Simula o processo do bot digitando e enviando mensagem
async function processBotMessage(text, delayMs = 700) {
    // Adiciona indicador de digitando
    const typingIndicator = createTypingIndicator();
    chatHistory.appendChild(typingIndicator);
    scrollToBottom();

    // Aguarda o tempo simulado de digitação
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Remove o indicador
    typingIndicator.remove();

    // Adiciona a mensagem real
    addMessage(text, false);
}

// Inicia o fluxo de mensagens do bot
async function startChatFlow() {
    for (let i = 0; i < initialMessages.length; i++) {
        // Calcula um tempo mais rápido de digitação
        const typingDelay = Math.min(400 + (initialMessages[i].length * 10), 1200);

        // Pausa reduzida entre as mensagens
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        await processBotMessage(initialMessages[i], typingDelay);
    }

    // Após as mensagens iniciais, inicia a fase de perguntas
    isAskingQuestions = true;
    await processBotMessage(questionSteps[0].text); // Usa o delay padrão
    showInputArea(questionSteps[0]);
}

function showInputArea(step) {
    inputContainer.classList.add('visible');

    // Limpa inputs customizados se houver
    const customInputBox = document.getElementById('custom-input-box');
    if (customInputBox) customInputBox.remove();

    if (step && step.type === 'button') {
        chatForm.style.display = 'none';
        buttonChoices.style.display = 'flex';
        buttonChoices.innerHTML = '';
        step.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = option;
            btn.onclick = () => submitAnswer(option);
            buttonChoices.appendChild(btn);
        });
    } else if (step && step.type === 'select') {
        chatForm.style.display = 'none';
        buttonChoices.style.display = 'none';

        const selectContainer = document.createElement('div');
        selectContainer.id = 'custom-input-box';
        selectContainer.className = 'custom-input-container';

        const select = document.createElement('select');
        select.className = 'custom-select';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = step.placeholder || 'Selecione uma opção...';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);

        step.options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });

        const btn = document.createElement('button');
        btn.className = 'choice-btn send-custom-btn';
        btn.textContent = 'Enviar';
        btn.disabled = true;

        select.addEventListener('change', () => {
            btn.disabled = !select.value;
        });

        btn.onclick = () => submitAnswer(select.value);

        selectContainer.appendChild(select);
        selectContainer.appendChild(btn);
        inputContainer.insertBefore(selectContainer, inputContainer.firstChild);

    } else if (step && step.type === 'date') {
        chatForm.style.display = 'none';
        buttonChoices.style.display = 'none';

        const dateContainer = document.createElement('div');
        dateContainer.id = 'custom-input-box';
        dateContainer.className = 'custom-input-container';

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.className = 'custom-date';

        const btn = document.createElement('button');
        btn.className = 'choice-btn send-custom-btn';
        btn.textContent = 'Enviar';
        btn.disabled = true;

        dateInput.addEventListener('change', () => {
            btn.disabled = !dateInput.value;
        });

        btn.onclick = () => {
            const [ano, mes, dia] = dateInput.value.split('-');
            const dataFormatada = `${dia}/${mes}/${ano}`;
            submitAnswer(dataFormatada);
        };

        dateContainer.appendChild(dateInput);
        dateContainer.appendChild(btn);
        inputContainer.insertBefore(dateContainer, inputContainer.firstChild);

    } else if (step && step.type === 'checkbox') {
        chatForm.style.display = 'none';
        buttonChoices.style.display = 'none';

        const checkContainer = document.createElement('div');
        checkContainer.id = 'custom-input-box';
        checkContainer.className = 'custom-checkbox-container';

        const label = document.createElement('label');
        label.className = 'custom-checkbox-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'custom-checkbox';

        const span = document.createElement('span');
        span.textContent = step.label;

        label.appendChild(checkbox);
        label.appendChild(span);

        const btn = document.createElement('button');
        btn.className = 'choice-btn send-custom-btn';
        btn.textContent = 'Confirmar';
        btn.disabled = true;

        checkbox.addEventListener('change', () => {
            btn.disabled = !checkbox.checked;
        });

        btn.onclick = () => submitAnswer("Sim"); // Sempre que confirmar é "Sim"

        checkContainer.appendChild(label);
        checkContainer.appendChild(btn);
        inputContainer.insertBefore(checkContainer, inputContainer.firstChild);

    } else {
        chatForm.style.display = 'flex';
        buttonChoices.style.display = 'none';

        // Define o texto de exemplo (placeholder) baseado na pergunta
        if (step && step.placeholder) {
            userInput.placeholder = step.placeholder;
        } else {
            userInput.placeholder = "Digite sua resposta...";
        }

        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }

    // Rola para baixo para garantir que o input ou botões estejam visíveis
    setTimeout(scrollToBottom, 100);
}

function disableInput() {
    inputContainer.classList.remove('visible');
    userInput.disabled = true;
    sendButton.disabled = true;
    chatForm.style.display = 'none';
    buttonChoices.style.display = 'none';

    const customInputBox = document.getElementById('custom-input-box');
    if (customInputBox) customInputBox.style.display = 'none';
}

// Lida com o envio do texto
sendButton.addEventListener('click', () => {
    submitAnswer(userInput.value);
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitAnswer(userInput.value);
    }
});

async function submitAnswer(rawAnswer) {
    const answer = rawAnswer.trim();
    if (!answer) return;

    // Mostra mensagem do usuário
    addMessage(answer, true);

    // Limpa e desabilita input
    userInput.value = '';
    disableInput();

    if (isAskingQuestions && currentStepIndex < questionSteps.length) {
        // Salva a resposta do passo atual
        const currentStep = questionSteps[currentStepIndex];
        userData[currentStep.key] = answer;

        currentStepIndex++;

        // Pula os passos que não atendem à condição (ex: se Não for formado, pula formação)
        while (currentStepIndex < questionSteps.length) {
            const nextStep = questionSteps[currentStepIndex];
            if (!nextStep.condition || nextStep.condition(userData)) {
                break;
            }
            currentStepIndex++;
        }

        // Verifica se ainda tem perguntas
        if (currentStepIndex < questionSteps.length) {
            let nextStep = questionSteps[currentStepIndex];
            let nextQuestionText = nextStep.text;
            // Personaliza a mensagem se tiver a tag {nome}
            if (nextQuestionText.includes("{nome}")) {
                let firstName = userData.nome.split(" ")[0];
                nextQuestionText = nextQuestionText.replace("{nome}", firstName);
            }
            await processBotMessage(nextQuestionText);
            showInputArea(nextStep);
        } else {
            // Finalizou as perguntas
            isAskingQuestions = false;
            let firstName = userData.nome.split(" ")[0];
            await processBotMessage(`Obrigado, ${firstName}! Aguarde enquanto processo seu cadastro...`);
            await sendDataToWebhook(userData);
        }
    }
}

// Integração com Apps Script
async function sendDataToWebhook(data) {
    try {
        // Adiciona indicador de 'enviando' invisível visualmente mas para dar tempo
        const typingIndicator = createTypingIndicator();
        chatHistory.appendChild(typingIndicator);
        scrollToBottom();

        // Envia para o webhook. Usa 'no-cors' para evitar erro de CORS
        const payload = {
            ...data,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(APPS_SCRIPT_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        typingIndicator.remove();

        // Sucesso
        await processBotMessage("Checkin finalizado com sucesso!<br><br>No dia 15 de agosto de 2026, temos um encontro marcado. Vamos pra cima! 🚀");

    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        // Em caso de falha (mesmo sendo no-cors, falhas de rede caem aqui)
        // Remove indicador se existir (precisaria achar ele no DOM)
        const indicator = document.querySelector('.typing-wrapper');
        if (indicator) indicator.remove();

        await processBotMessage("Oops, ocorreu um pequeno erro de conexão. Mas não se preocupe, no ambiente real isso estará conectado à planilha!");
    }
}

// Inicia ao carregar a tela
window.addEventListener('load', () => {
    // Pequeno atraso antes de começar a falar para simular entrada na página
    setTimeout(startChatFlow, 800);
});

// Atualiza o estado do botão dependendo do input
userInput.addEventListener('input', () => {
    if (userInput.value.trim().length > 0) {
        sendButton.style.opacity = '1';
    } else {
        sendButton.style.opacity = '0.7';
    }
});
