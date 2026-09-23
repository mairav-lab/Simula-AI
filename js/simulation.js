/* ============================================================
   SIMULA AI — MOTOR DE SIMULAÇÃO
   VERSÃO LIMPA — CLOUDFLARE WORKERS AI
   ============================================================ */

(function () {
    "use strict";

    window.SimulaAI = window.SimulaAI || {};

    const API_URL = "https://simula-ai-api.maira-pinto2026.workers.dev/";

    const state = {
        active: false,
        prepared: false,
        scenario: null,
        difficulty: "medio",
        messages: [],
        startTime: null,
        endTime: null,
        customerStarted: false,
        processingResponse: false,
        customerMemory: null,
        timerInterval: null,
        speechEnabled: true
    };

    /* ============================================================
       UTILITÁRIOS
       ============================================================ */

    function getElement(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const element = getElement(id);

        if (!element) return;

        element.textContent =
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
                ? String(value)
                : "—";
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ============================================================
       LEITURA DO CENÁRIO
       ============================================================ */

    function getScenarioData(scenario) {
        const current = scenario || {};

        const customer =
            current.customer ||
            current.cliente ||
            current.perfil_cliente ||
            current.perfil ||
            {};

        const visible =
            current.visibleInfo ||
            current.informacoesVisiveis ||
            current.informacoes_visiveis ||
            current.dadosVisiveis ||
            current.dados_visiveis ||
            {};

        const raw = current.raw || {};

        const rawCustomer =
            raw.customer ||
            raw.cliente ||
            raw.perfil_cliente ||
            raw.perfil ||
            {};

        const rawVisible =
            raw.visibleInfo ||
            raw.informacoesVisiveis ||
            raw.informacoes_visiveis ||
            raw.dadosVisiveis ||
            raw.dados_visiveis ||
            {};

        return {
            current,
            customer,
            visible,
            raw,
            rawCustomer,
            rawVisible
        };
    }

    function readFirstValue(sources, keys) {
        for (const source of sources) {
            if (!source || typeof source !== "object") continue;

            for (const key of keys) {
                if (
                    Object.prototype.hasOwnProperty.call(source, key) &&
                    source[key] !== undefined &&
                    source[key] !== null &&
                    String(source[key]).trim() !== ""
                ) {
                    return source[key];
                }
            }
        }

        return null;
    }

    /* ============================================================
       FORMATAÇÃO DE DADOS
       ============================================================ */

    function parseBrazilianNumber(value) {
        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {
            return null;
        }

        if (typeof value === "number") {
            return Number.isFinite(value) ? value : null;
        }

        let text = String(value)
            .trim()
            .replace(/R\$/gi, "")
            .replace(/\s/g, "");

        if (
            text.includes(",") &&
            text.lastIndexOf(",") > text.lastIndexOf(".")
        ) {
            text = text
                .replace(/\./g, "")
                .replace(",", ".");
        } else if (
            text.includes(".") &&
            !text.includes(",")
        ) {
            const parts = text.split(".");

            if (!(parts.length === 2 && parts[1].length === 2)) {
                text = text.replace(/\./g, "");
            }
        }

        const number = Number(text);

        return Number.isFinite(number)
            ? number
            : null;
    }

    function formatCurrency(value) {
        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {
            return "—";
        }

        const text = String(value).trim();

        if (/R\$\s*[\d.,]+/i.test(text)) {
            return text;
        }

        const number = parseBrazilianNumber(value);

        if (number === null) {
            return text;
        }

        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(number);
    }

    function formatSpeed(value) {
        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {
            return "—";
        }

        const text = String(value).trim();

        if (/Mbps|Gbps|Mega|Giga/i.test(text)) {
            return text;
        }

        const number = Number(
            text
                .replace(",", ".")
                .replace(/[^\d.]/g, "")
        );

        if (!Number.isFinite(number)) {
            return text;
        }

        if (number >= 1000) {
            const giga = number / 1000;

            return `${
                giga % 1 === 0
                    ? giga
                    : giga.toFixed(1)
            } Gbps`;
        }

        return `${number} Mbps`;
    }

    /* ============================================================
       DADOS DO CLIENTE
       ============================================================ */

    function extractCustomerInfo(scenario) {
        const data = getScenarioData(scenario);

        const sources = [
            data.customer,
            data.visible,
            data.rawCustomer,
            data.rawVisible,
            data.current
        ];

        const name = readFirstValue(
            sources,
            [
                "name",
                "nome",
                "nomeCompleto",
                "nome_completo",
                "customerName",
                "clienteNome",
                "cliente_nome"
            ]
        );

        let plan = readFirstValue(
            sources,
            [
                "plan",
                "plano",
                "planoAtual",
                "plano_atual",
                "currentPlan",
                "current_plan"
            ]
        );

        if (plan && typeof plan === "object") {
            plan =
                plan.name ||
                plan.nome ||
                plan.title ||
                plan.titulo ||
                plan.plan ||
                plan.plano ||
                null;
        }

        let speed = readFirstValue(
            sources,
            [
                "speed",
                "velocidade",
                "internetSpeed",
                "internet_speed",
                "downloadSpeed",
                "download_speed",
                "speedMbps",
                "speed_mbps",
                "mbps"
            ]
        );

        let price = readFirstValue(
            sources,
            [
                "price",
                "preco",
                "valor",
                "monthlyPrice",
                "monthly_price",
                "mensalidade",
                "valorMensal",
                "valor_mensal",
                "priceMonthly",
                "precoMensal",
                "preco_mensal",
                "planPrice",
                "plan_price",
                "currentPrice",
                "current_price",
                "valorPlano",
                "valor_plano",
                "mensal",
                "monthly"
            ]
        );

        const planObjects = [
            data.customer?.plan,
            data.customer?.plano,
            data.visible?.plan,
            data.visible?.plano,
            data.rawCustomer?.plan,
            data.rawCustomer?.plano,
            data.rawVisible?.plan,
            data.rawVisible?.plano,
            data.current?.plan,
            data.current?.plano
        ].filter(Boolean);

        if (
            speed === null ||
            speed === undefined ||
            String(speed).trim() === ""
        ) {
            speed = readFirstValue(
                planObjects,
                [
                    "speed",
                    "velocidade",
                    "speedMbps",
                    "speed_mbps",
                    "mbps"
                ]
            );
        }

        if (
            price === null ||
            price === undefined ||
            String(price).trim() === ""
        ) {
            price = readFirstValue(
                planObjects,
                [
                    "price",
                    "preco",
                    "valor",
                    "monthlyPrice",
                    "monthly_price",
                    "mensalidade",
                    "valorMensal",
                    "valor_mensal",
                    "planPrice",
                    "plan_price"
                ]
            );
        }

        const baseTime = readFirstValue(
            sources,
            [
                "baseTime",
                "base_time",
                "tempoBase",
                "tempo_base",
                "customerBaseTime",
                "customer_base_time",
                "timeInBase",
                "time_in_base",
                "tempoDeBase",
                "tempo_de_base",
                "baseDuration",
                "base_duration"
            ]
        );

        const category = readFirstValue(
            sources,
            [
                "category",
                "categoria",
                "type",
                "tipo"
            ]
        );

        return {
            name: name || "Cliente",

            plan: plan || "—",

            speed:
                speed !== null &&
                speed !== undefined
                    ? formatSpeed(speed)
                    : "—",

            price:
                price !== null &&
                price !== undefined
                    ? formatCurrency(price)
                    : "—",

            baseTime:
                baseTime || "—",

            category:
                category || "—"
        };
    }

    /* ============================================================
       TÍTULO / DESCRIÇÃO
       ============================================================ */

    function getScenarioTitle(scenario) {
        if (!scenario) {
            return "Simulação";
        }

        return String(
            scenario.title ||
            scenario.titulo ||
            scenario.problem ||
            scenario.problema ||
            "Simulação"
        );
    }

    function getScenarioDescription(scenario) {
        if (!scenario) {
            return "Atendimento em andamento";
        }

        return String(
            scenario.description ||
            scenario.descricao ||
            scenario.problem ||
            scenario.problema ||
            ""
        );
    }

    /*
     * Impede que informações que deveriam ser descobertas
     * durante a sondagem apareçam antecipadamente na tela.
     */
    function sanitizeVisibleText(value) {
        if (
            value === undefined ||
            value === null
        ) {
            return "";
        }

        return String(value)

            .replace(
                /concorrente\s+instalado\s+(há|a)\s+\d+\s*(dias?|semanas?|meses?|anos?)/gi,
                "concorrente já instalado"
            )

            .replace(
                /concorrente\s+instalada\s+(há|a)\s+\d+\s*(dias?|semanas?|meses?|anos?)/gi,
                "concorrente já instalado"
            )

            .replace(
                /instalado\s+há\s+\d+\s*(dias?|semanas?|meses?|anos?)/gi,
                "já instalado"
            )

            .replace(
                /instalada\s+há\s+\d+\s*(dias?|semanas?|meses?|anos?)/gi,
                "já instalada"
            );
    }

    /* ============================================================
       DIFICULDADE
       ============================================================ */

    function getDifficultyLabel(value) {
        const normalized = String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const labels = {
            facil: "Fácil",
            medio: "Médio",
            dificil: "Difícil"
        };

        return labels[normalized] || "Médio";
    }

    /* ============================================================
       TELAS
       ============================================================ */

    function hideAllMainScreens() {
        [
            "operatorPanel",
            "adminPanel",
            "simulationScreen",
            "resultScreen"
        ].forEach(function (id) {
            const element = getElement(id);

            if (element) {
                element.classList.add("hidden");
            }
        });
    }

    function showOnlySimulationScreen() {
        hideAllMainScreens();

        const screen =
            getElement("simulationScreen");

        if (screen) {
            screen.classList.remove("hidden");
        }
    }

    function showOperatorPanel() {
        hideAllMainScreens();

        const panel =
            getElement("operatorPanel");

        if (panel) {
            panel.classList.remove("hidden");
        }
    }

    /* ============================================================
       PAINEL DE INÍCIO
       ============================================================ */

    function updateStartPanel() {
        if (!state.scenario) {
            return;
        }

        const info =
            extractCustomerInfo(
                state.scenario
            );

        /*
         * IMPORTANTE:
         * Não mostramos o problema específico do cenário aqui.
         * O operador deve descobri-lo durante a sondagem.
         */

        setText(
            "simulationStartTitle",
            info.name
        );

        setText(
            "simulationStartDescription",
            info.category
        );

        setText(
            "simulationStartCustomer",
            info.name
        );

        setText(
            "simulationStartPlan",
            info.plan
        );

        setText(
            "simulationStartPrice",
            info.price
        );

        setText(
            "simulationStartBaseTime",
            info.baseTime
        );

        setText(
            "simulationStartDifficulty",
            getDifficultyLabel(
                state.difficulty
            )
        );
    }

    /* ============================================================
       INFORMAÇÕES DO CLIENTE
       ============================================================ */

    function updateCustomerInformation() {
        if (!state.scenario) {
            return;
        }

        const info =
            extractCustomerInfo(
                state.scenario
            );

        /*
         * PAINEL LATERAL DURANTE O CHAT
         *
         * Cliente
         * Plano
         * Valor
         * Tempo de base
         * Categoria
         * Dificuldade
         *
         * A velocidade separada não é exibida,
         * pois já está representada no nome do plano.
         */

        setText(
            "customerName",
            info.name
        );

        setText(
            "conversationCustomerName",
            info.name
        );

        setText(
            "customerPlan",
            info.plan
        );

        setText(
            "customerPrice",
            info.price
        );

        setText(
            "customerBaseTime",
            info.baseTime
        );

        setText(
            "customerCategory",
            info.category
        );

        setText(
            "customerDifficulty",
            getDifficultyLabel(
                state.difficulty
            )
        );
    }

    /* ============================================================
       CONVERSA
       ============================================================ */

    function clearConversation() {
        state.messages = [];

        const messageList =
            getElement("messageList");

        if (!messageList) {
            return;
        }

        messageList.innerHTML = `
            <div
                id="conversationEmpty"
                class="conversation-empty"
            >
                <div class="conversation-empty-icon">
                    <i class="bi bi-mic-fill"></i>
                </div>

                <h3 class="conversation-empty-title">
                    Simulação pronta
                </h3>

                <p class="conversation-empty-text">
                    Aguardando o início da simulação...
                </p>
            </div>
        `;
    }

    function addMessage(sender, text) {
        const cleanText =
            String(text ?? "").trim();

        if (!cleanText) {
            return;
        }

        const message = {
            sender,
            text: cleanText,
            timestamp:
                new Date().toISOString()
        };

        state.messages.push(message);

        renderMessage(message);
    }

    function renderMessage(message) {
        const messageList =
            getElement("messageList");

        if (!messageList) {
            return;
        }

        const empty =
            getElement(
                "conversationEmpty"
            );

        if (empty) {
            empty.remove();
        }

        const isOperator =
            message.sender === "operator";

        const senderLabel =
            isOperator
                ? "Você"
                : extractCustomerInfo(
                    state.scenario
                ).name;

        const wrapper =
            document.createElement("div");

        wrapper.className =
            `message ${
                isOperator
                    ? "operator"
                    : "customer"
            }`;

        const bubble =
            document.createElement("div");

        bubble.className =
            "message-bubble";

        bubble.innerHTML = `
            <div class="message-sender">
                ${escapeHtml(senderLabel)}
            </div>

            <div class="message-text">
                ${escapeHtml(message.text)}
            </div>
        `;

        wrapper.appendChild(bubble);

        messageList.appendChild(wrapper);

        requestAnimationFrame(
            function () {
                const scrollContainer =
                    messageList.closest(
                        ".conversation-body"
                    ) ||
                    messageList;

                scrollContainer.scrollTop =
                    scrollContainer.scrollHeight;
            }
        );
    }

    /* ============================================================
       ABERTURA DO CLIENTE
       ============================================================ */

    function getScenarioOpening(scenario) {

        /*
         * Todo atendimento de retenção começa
         * com intenção de cancelamento.
         *
         * O cliente NÃO revela o motivo.
         * O operador precisa descobri-lo
         * através da sondagem.
         */

        return "Olá, eu gostaria de cancelar minha internet.";
    }

    function startCustomerConversation() {
        if (
            state.customerStarted ||
            !state.scenario
        ) {
            return;
        }

        state.customerStarted = true;

        const opening =
            getScenarioOpening(
                state.scenario
            );

        addMessage(
            "customer",
            opening
        );

        if (state.speechEnabled) {
            speakCustomer(opening);
        }

        setVoiceStatus(
            "Sua vez de atender"
        );
    }

    /* ============================================================
       PAYLOAD PARA O CLOUDFLARE
       ============================================================ */

    function buildScenarioPayload() {
    const scenario =
        state.scenario || {};

    const info =
        extractCustomerInfo(
            scenario
        );

    /*
     * O cenário completo continua sendo enviado ao Worker.
     *
     * As informações ocultas NÃO aparecem para o operador,
     * mas continuam disponíveis para o cliente virtual.
     */

    const category =
        scenario?.customer?.category ||
        scenario?.customer?.categoria ||
        scenario?.category ||
        scenario?.categoria ||
        (
            info.category !== "—"
                ? info.category
                : ""
        );

    return {
        id:
            scenario.id ||
            scenario.scenarioId ||
            scenario.codigo ||
            null,

        title:
            getScenarioTitle(
                scenario
            ),

        description:
            getScenarioDescription(
                scenario
            ),

        difficulty:
            state.difficulty,

        category:
            category,

        customer: {
            name:
                info.name,

            plan:
                info.plan,

            speed:
                info.speed,

            price:
                info.price,

            baseTime:
                info.baseTime,

            category:
                category
        },

        data:
            scenario
    };
}
    /* ============================================================
       HISTÓRICO PARA IA
       ============================================================ */

    function buildConversationHistory() {
        return state.messages
            .slice(-24)
            .map(
                function (message) {
                    return {
                        role:
                            message.sender ===
                            "operator"
                                ? "operator"
                                : "customer",

                        content:
                            message.text
                    };
                }
            );
    }

    /* ============================================================
       CLOUDFLARE WORKERS AI
       ============================================================ */

    async function requestAIResponse() {
    const payload = {
        action: "chat",

        scenario:
            buildScenarioPayload(),

        difficulty:
            state.difficulty,

        messages:
            buildConversationHistory()
    };

    const customerUrl =
        `${API_URL.replace(/\/+$/, "")}/customer`;

    const response =
        await fetch(
            customerUrl,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

    let data = null;

    try {
        data =
            await response.json();
    } catch (error) {
        throw new Error(
            `A API respondeu em formato inválido (${response.status}).`
        );
    }

    if (
        !response.ok ||
        data?.success === false
    ) {
        throw new Error(
            data?.detail ||
            data?.error ||
            `Erro ${response.status} ao consultar a IA.`
        );
    }

    const reply =
        data?.reply ||
        data?.response ||
        data?.message ||
        "";

    if (
        !String(reply).trim()
    ) {
        throw new Error(
            "A IA retornou uma resposta vazia."
        );
    }

    return String(
        reply
    ).trim();
}

    async function getCustomerResponse() {
        return requestAIResponse();
    }

    /* ============================================================
       FALA DO OPERADOR
       ============================================================ */

    async function handleOperatorSpeech(text) {
        if (
            !state.active ||
            state.processingResponse
        ) {
            return;
        }

        const cleanText =
            String(text || "").trim();

        if (!cleanText) {
            return;
        }

        state.processingResponse = true;

        addMessage(
            "operator",
            cleanText
        );

        setText(
            "conversationStatus",
            "Cliente respondendo"
        );

        setVoiceStatus(
            "Cliente está respondendo..."
        );

        try {
            const response =
                await getCustomerResponse();

            if (!state.active) {
                return;
            }

            addMessage(
                "customer",
                response
            );

            if (state.speechEnabled) {
                speakCustomer(response);
            }

        } catch (error) {

            console.error(
                "Simula AI — erro ao consultar IA:",
                error
            );

            setVoiceStatus(
                "Não foi possível obter a resposta do cliente. Tente novamente."
            );

            return;

        } finally {

            state.processingResponse =
                false;

            if (state.active) {

                setText(
                    "conversationStatus",
                    "Atendimento em andamento"
                );

                if (
                    getElement(
                        "voiceStatus"
                    )?.textContent !==
                    "Não foi possível obter a resposta do cliente. Tente novamente."
                ) {
                    setVoiceStatus(
                        "Sua vez de atender"
                    );
                }
            }
        }
    }
        /* ============================================================
       VOZ DO CLIENTE
       ============================================================ */

    function speakCustomer(text) {
        if (!state.speechEnabled) {
            return;
        }

        /*
         * Primeiro utiliza nosso speech.js,
         * onde já configuramos Maria/Daniel
         * e o comportamento do microfone.
         */
        if (
            window.SimulaAI?.speech &&
            typeof window.SimulaAI
                .speech
                .speak === "function"
        ) {
            window.SimulaAI
                .speech
                .speak(text);

            return;
        }

        /*
         * Compatibilidade com implementação
         * antiga caso exista.
         */
        if (
            window.SimulaAI &&
            typeof window.SimulaAI
                .speak === "function"
        ) {
            window.SimulaAI.speak(
                text
            );

            return;
        }

        /*
         * Último fallback:
         * voz nativa do navegador.
         */
        if (
            "speechSynthesis" in window
        ) {
            window.speechSynthesis
                .cancel();

            const utterance =
                new SpeechSynthesisUtterance(
                    text
                );

            utterance.lang =
                "pt-BR";

            utterance.rate =
                1;

            utterance.pitch =
                1;

            window.speechSynthesis
                .speak(
                    utterance
                );
        }
    }

    /* ============================================================
       STATUS DA VOZ
       ============================================================ */

    function setVoiceStatus(text) {
        setText(
            "voiceStatus",
            text
        );
    }

    /* ============================================================
       TIMER
       ============================================================ */

    function startTimer() {
        stopTimer();

        state.startTime =
            new Date();

        updateTimer();

        state.timerInterval =
            setInterval(
                updateTimer,
                1000
            );
    }

    function stopTimer() {
        if (
            state.timerInterval
        ) {
            clearInterval(
                state.timerInterval
            );

            state.timerInterval =
                null;
        }
    }

    function updateTimer() {
        if (!state.startTime) {
            return;
        }

        const elapsed =
            Math.floor(
                (
                    Date.now() -
                    state.startTime.getTime()
                ) / 1000
            );

        const minutes =
            Math.floor(
                elapsed / 60
            );

        const seconds =
            elapsed % 60;

        setText(
            "simulationTimer",

            `${String(minutes)
                .padStart(2, "0")}:` +

            `${String(seconds)
                .padStart(2, "0")}`
        );
    }

    /* ============================================================
       PAINEL INICIAL
       ============================================================ */
function updateTopFinishButton() {
    const button =
        getElement("topFinishSimulationButton");

    const topbarStatus =
        document.querySelector(
            ".simulation-topbar-status strong"
        );

    if (state.active) {

        /* Atendimento realmente iniciado */
        if (button) {
            button.classList.remove("hidden");
        }

        if (topbarStatus) {
            topbarStatus.textContent =
                "Atendimento em andamento";
        }

    } else {

        /* Apenas preparação */
        if (button) {
            button.classList.add("hidden");
        }

        if (topbarStatus) {
            topbarStatus.textContent =
                "Preparar simulação";
        }
    }
}
    function showStartPanel() {
        const startPanel =
            getElement(
                "simulationStartPanel"
            );

        const conversation =
            getElement(
                "simulationConversationLayout"
            );

        if (startPanel) {
            startPanel.classList
                .remove("hidden");
        }

        if (conversation) {
            conversation.classList
                .add("hidden");
        }

        updateStartPanel();
        updateTopFinishButton();
    }

    /* ============================================================
       PREPARAR SIMULAÇÃO
       ============================================================ */

    function prepareSimulation(
        scenario,
        difficulty
    ) {
        if (!scenario) {
            console.warn(
                "Simula AI: nenhum cenário recebido."
            );

            return false;
        }

        stopTimer();

        if (
            window.speechSynthesis
        ) {
            window.speechSynthesis
                .cancel();
        }

        state.active =
            false;

        state.prepared =
            true;

        state.scenario =
            scenario;

        state.difficulty =
            difficulty ||
            "medio";

        state.messages =
            [];

        state.customerStarted =
            false;

        state.processingResponse =
            false;

        state.customerMemory =
            null;

        state.startTime =
            null;

        state.endTime =
            null;

        /*
         * Objeto compartilhado com os
         * demais módulos do Simula AI.
         */
        window.SimulaAI.currentSimulation = {
            scenario,

            difficulty:
                state.difficulty,

            startedAt:
                new Date()
                    .toISOString()
        };

        showOnlySimulationScreen();

        /*
         * Não exibimos título/problema específico aqui.
         *
         * Essas informações fazem parte do cenário oculto
         * que o operador deverá descobrir na sondagem.
         *
         * Mantemos os elementos preenchidos com informações
         * seguras para compatibilidade com o HTML atual.
         */
        setText(
            "simulationScenarioTitle",
            extractCustomerInfo(
                scenario
            ).name
        );

        setText(
            "simulationScenarioDescription",
            extractCustomerInfo(
                scenario
            ).category
        );

        updateCustomerInformation();

        clearConversation();

        showStartPanel();

        setText(
            "conversationStatus",
            "Aguardando início"
        );

        setText(
            "simulationTimer",
            "00:00"
        );

        setVoiceStatus(
            "Aguardando o cliente iniciar..."
        );

        return true;
    }

    /* ============================================================
       INICIAR CONVERSA
       ============================================================ */

    function beginSimulation() {
        if (!state.scenario) {
            console.warn(
                "Simula AI: nenhum cenário preparado."
            );

            return false;
        }

        state.prepared =
            false;

        state.active =
            true;

        state.customerStarted =
            false;

        state.processingResponse =
            false;

        state.customerMemory =
            null;

        clearConversation();

        updateCustomerInformation();

        const startPanel =
            getElement(
                "simulationStartPanel"
            );

        const conversation =
            getElement(
                "simulationConversationLayout"
            );

        if (startPanel) {
            startPanel.classList
                .add("hidden");
        }
if (conversation) {
    conversation.classList
        .remove("hidden");
}

/* Atualiza a barra superior para o atendimento ativo */
updateTopFinishButton();

startTimer();

        startTimer();

        setText(
            "conversationStatus",
            "Atendimento em andamento"
        );

        setVoiceStatus(
            "Cliente está iniciando..."
        );

        /*
         * Pequena pausa apenas para a
         * transição visual.
         */
        setTimeout(
            startCustomerConversation,
            500
        );

        return true;
    }

    /* ============================================================
       START
       ============================================================ */

    function startSimulation(
        scenario,
        difficulty
    ) {
        if (
            state.prepared &&
            state.scenario === scenario
        ) {
            state.difficulty =
                difficulty ||
                state.difficulty;

            updateStartPanel();

            return beginSimulation();
        }

        const prepared =
            prepareSimulation(
                scenario,
                difficulty
            );

        if (!prepared) {
            return false;
        }

        return beginSimulation();
    }

    /* ============================================================
       FINALIZAR SIMULAÇÃO
       ============================================================ */

function finishSimulation() {

    if (!state.active) {
        return;
    }

    const modal =
        getElement("outcomeModal");

    if (!modal) {
        console.error(
            "Simula AI: modal de resultado não encontrado."
        );

        return;
    }

    modal.classList.remove("hidden");
}
function closeOutcomeModal() {

    const modal =
        getElement("outcomeModal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


function confirmSimulationOutcome(retained) {

    if (!state.active) {
        closeOutcomeModal();
        return;
    }

    const outcome =
        retained
            ? {
                status: "retido",
                label: "Retido",
                retained: true,
                source: "operator_confirmation"
            }
            : {
                status: "nao_retido_cancelado",
                label: "Não retido - Cancelado",
                retained: false,
                source: "operator_confirmation"
            };


    closeOutcomeModal();


    state.active =
        false;


    state.endTime =
        new Date();


    stopTimer();


    setText(
        "conversationStatus",
        "Simulação finalizada"
    );


    setVoiceStatus(
        "Simulação finalizada"
    );


    if (
        window.speechSynthesis
    ) {
        window.speechSynthesis.cancel();
    }
const currentUser =
    window.SimulaAI?.auth &&
    typeof window.SimulaAI.auth.getCurrentUser === "function"
        ? window.SimulaAI.auth.getCurrentUser()
        : null;


const durationSeconds =
    state.startTime && state.endTime
        ? Math.max(
            0,
            Math.floor(
                (
                    state.endTime.getTime() -
                    state.startTime.getTime()
                ) / 1000
            )
        )
        : 0;


const customerInfo =
    extractCustomerInfo(
        state.scenario
    );

   const simulationData = {

    operator: {
        id:
            currentUser?.id || null,

        name:
            currentUser?.name || "Operador",

        email:
            currentUser?.email || null,

        role:
            currentUser?.role || "operador"
    },

    operatorId:
        currentUser?.id || null,

    operatorName:
        currentUser?.name || "Operador",

    operatorEmail:
        currentUser?.email || null,


    scenario:
        state.scenario,

    scenarioId:
        state.scenario?.id ||
        state.scenario?.scenarioId ||
        state.scenario?.codigo ||
        null,

    scenarioName:
        getScenarioTitle(
            state.scenario
        ),

    customerName:
        customerInfo.name,

    category:
        customerInfo.category,

    difficulty:
        state.difficulty,


    messages: [
        ...state.messages
    ],


    startTime:
        state.startTime,

    endTime:
        state.endTime,

    startedAt:
        state.startTime
            ? state.startTime.toISOString()
            : null,

    finishedAt:
        state.endTime
            ? state.endTime.toISOString()
            : null,

    durationSeconds:
        durationSeconds,


    customerMemory:
        state.customerMemory
            ? {
                ...state.customerMemory
            }
            : null,


    outcome:
        outcome,

    retentionOutcome:
        outcome,

    retained:
        outcome.retained,

    retentionStatus:
        outcome.status,

    retentionLabel:
        outcome.label
};


    window.SimulaAI.currentSimulation = {

        ...(window.SimulaAI.currentSimulation || {}),

        ...simulationData,

        finishedAt:
            new Date().toISOString()
    };


    /* ========================================================
       AVALIAÇÃO
    ======================================================== */

    if (
        window.SimulaAI?.evaluation &&
        typeof window.SimulaAI
            .evaluation
            .evaluate === "function"
    ) {

        window.SimulaAI
            .evaluation
            .evaluate(
                simulationData
            );

        return;
    }


    if (
        window.SimulaAI &&
        typeof window.SimulaAI
            .evaluateSimulation === "function"
    ) {

        window.SimulaAI
            .evaluateSimulation(
                simulationData
            );

        return;
    }


    console.warn(
        "Simula AI: módulo de avaliação não encontrado."
    );


    showResultScreen();
}

    /* ============================================================
       RESULTADO
       ============================================================ */

    function showResultScreen() {
        hideAllMainScreens();

        const result =
            getElement(
                "resultScreen"
            );

        if (result) {
            result.classList
                .remove("hidden");
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    /* ============================================================
       RESET
       ============================================================ */

    function resetSimulationState() {
        stopTimer();

        state.active =
            false;

        state.prepared =
            false;

        state.scenario =
            null;

        state.messages =
            [];

        state.customerStarted =
            false;

        state.processingResponse =
            false;

        state.customerMemory =
            null;

        state.startTime =
            null;

        state.endTime =
            null;

        if (
            window.speechSynthesis
        ) {
            window.speechSynthesis
                .cancel();
        }
    }

    /* ============================================================
       VOLTAR AO PAINEL
       ============================================================ */

    function returnToOperatorPanel() {
        resetSimulationState();

        showOperatorPanel();

        if (
            window.SimulaAI?.dashboard &&
            typeof window.SimulaAI
                .dashboard
                .loadOperatorDashboard ===
                "function"
        ) {
            window.SimulaAI
                .dashboard
                .loadOperatorDashboard();
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    /* ============================================================
       NOVA SIMULAÇÃO
       ============================================================ */

    function newSimulation() {
        resetSimulationState();

        showOperatorPanel();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    /* ============================================================
       ÁUDIO ON / OFF
       ============================================================ */

    function toggleSpeech() {
        state.speechEnabled =
            !state.speechEnabled;

        const button =
            getElement(
                "muteButton"
            );

        if (
            !state.speechEnabled &&
            window.speechSynthesis
        ) {
            window.speechSynthesis
                .cancel();
        }

        if (!button) {
            return;
        }

        if (
            state.speechEnabled
        ) {
            button.innerHTML = `
                <i class="bi bi-volume-up"></i>
                Áudio
            `;

            button.setAttribute(
                "aria-pressed",
                "false"
            );

        } else {

            button.innerHTML = `
                <i class="bi bi-volume-mute"></i>
                Áudio
            `;

            button.setAttribute(
                "aria-pressed",
                "true"
            );
        }
    }

    /* ============================================================
       BOTÕES
       ============================================================ */

    function bindButtons() {
        const startButton =
            getElement(
                "startSimulationButton"
            );

        if (startButton) {
            startButton.addEventListener(
                "click",
                beginSimulation
            );
        }

        const finishButton =
            getElement(
                "finishSimulationButton"
            );

        if (finishButton) {
            finishButton.addEventListener(
                "click",
                finishSimulation
            );
        }

        const exitButton =
            getElement(
                "exitSimulationButton"
            );

        if (exitButton) {
            exitButton.addEventListener(
                "click",
                returnToOperatorPanel
            );
        }

        const newButton =
            getElement(
                "newSimulationButton"
            );

        if (newButton) {
            newButton.addEventListener(
                "click",
                newSimulation
            );
        }

        const backButton =
            getElement(
                "backToDashboardButton"
            );

        if (backButton) {
            backButton.addEventListener(
                "click",
                returnToOperatorPanel
            );
        }

        const muteButton =
            getElement(
                "muteButton"
            );

        if (muteButton) {
            muteButton.addEventListener(
                "click",
                toggleSpeech
            );
        }
                const retainedButton =
            getElement(
                "outcomeRetainedButton"
            );

        if (retainedButton) {
            retainedButton.addEventListener(
                "click",
                function () {
                    confirmSimulationOutcome(true);
                }
            );
        }


        const cancelledButton =
            getElement(
                "outcomeCancelledButton"
            );

        if (cancelledButton) {
            cancelledButton.addEventListener(
                "click",
                function () {
                    confirmSimulationOutcome(false);
                }
            );
        }


        const outcomeBackButton =
            getElement(
                "outcomeModalBackButton"
            );

        if (outcomeBackButton) {
            outcomeBackButton.addEventListener(
                "click",
                closeOutcomeModal
            );
        }
    }

    /* ============================================================
       EVENTO RECEBIDO DO SPEECH.JS
       ============================================================ */

    function bindSpeechEvents() {
        document.addEventListener(
            "simulaAI:speech",

            function (event) {
                if (!event?.detail) {
                    return;
                }

                const text =
                    event.detail.text ||
                    event.detail.transcript ||
                    "";

                if (text) {
                    handleOperatorSpeech(
                        text
                    );
                }
            }
        );
    }

    /* ============================================================
       ESTADO PÚBLICO
       ============================================================ */

    function getState() {
        return {
            active:
                state.active,

            prepared:
                state.prepared,

            scenario:
                state.scenario,

            difficulty:
                state.difficulty,

            messages:
                [
                    ...state.messages
                ],

            startTime:
                state.startTime,

            endTime:
                state.endTime,

            customerMemory:
                state.customerMemory
                    ? {
                        ...state.customerMemory
                    }
                    : null
        };
    }

    function getMessages() {
        return [
            ...state.messages
        ];
    }

    /* ============================================================
       API PÚBLICA DO MÓDULO
       ============================================================ */

    window.SimulaAI.simulation = {

        state,

        prepare:
            prepareSimulation,

        prepareSimulation,

        start:
            prepareSimulation,

        begin:
            beginSimulation,

        beginSimulation,

        startSimulation,

        finish:
            finishSimulation,

        finishSimulation,

        handleOperatorSpeech,

        getCustomerResponse,

        getState,

        getMessages,

        showResultScreen,

        returnToOperatorPanel,

        newSimulation
    };

    /*
     * Compatibilidade com os demais
     * arquivos que já usam funções
     * diretamente no window.SimulaAI.
     */

    window.SimulaAI.prepareSimulation =
        prepareSimulation;

    window.SimulaAI.startSimulation =
        startSimulation;

    window.SimulaAI.beginSimulation =
        beginSimulation;

    window.SimulaAI.finishSimulation =
        finishSimulation;

    window.SimulaAI.handleOperatorSpeech =
        handleOperatorSpeech;

    window.SimulaAI.getSimulationState =
        getState;

    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */

    function initialize() {
        bindButtons();
        bindSpeechEvents();
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }

})();
/* ============================================================
   BOTÃO FINALIZAR — TOPO DA SIMULAÇÃO
   ============================================================ */

const topFinishSimulationButton =
    document.getElementById("topFinishSimulationButton");

if (topFinishSimulationButton) {

    topFinishSimulationButton.addEventListener(
        "click",
        function () {

            const originalFinishButton =
                document.getElementById("finishSimulationButton");

            if (originalFinishButton) {
                originalFinishButton.click();
            }

        }
    );
}