/* ============================================================
   SIMULA AI — CENÁRIOS DE ATENDIMENTO
   Versão: 1.0
   ============================================================ */

(function () {
    "use strict";

    /* ============================================================
       NAMESPACE
       ============================================================ */

    window.SimulaAI = window.SimulaAI || {};


    /* ============================================================
       DADOS DOS 10 CENÁRIOS
       ============================================================ */

const SCENARIOS = [

    /* ========================================================
       01 — CARLOS SILVA | REPARO TÉCNICO | MÉDIO
       ======================================================== */

    {
        id: 1,
        number: "01",
        title: "Carlos Silva — Seis dias sem internet",

        customer: {
            name: "Carlos Silva",
            plan: "500MB Fibra",
            speed: 500,
            price: 139.90,
            baseTime: "2 anos e 4 meses",
            mood: "Irritado",
            category: "Problema técnico"
        },

        problem: "Seis dias sem internet",

        description:
            "Cliente está há seis dias sem internet e demonstra insatisfação com a demora para resolver o problema.",

        difficulty: "médio",

        visibleInfo: {
            customerName: "Carlos Silva",
            plan: "500MB Fibra",
            speed: "500 Mbps",
            price: "R$ 139,90",
            baseTime: "2 anos e 4 meses",
            problem: "Seis dias sem internet"
        },

        hiddenInfo: [
            "Está há seis dias sem internet.",
            "Já entrou em contato anteriormente buscando uma solução.",
            "Existe histórico recente relacionado ao problema técnico.",
            "A falta de internet está prejudicando sua rotina.",
            "Está frustrado com a demora, mas ainda aceita ouvir uma solução.",
            "Não quer apenas promessas; precisa perceber uma ação técnica concreta.",
            "Os dias em que permaneceu sem serviço podem se tornar uma preocupação durante a negociação."
        ],

        objective:
            "Investigar corretamente o problema técnico, reconhecer o impacto da interrupção, direcionar uma solução técnica concreta e trabalhar a permanência somente depois do tratamento do problema.",

        objections: [
            "Estou há seis dias sem internet.",
            "Já entrei em contato antes e ainda não resolveram.",
            "Não quero continuar esperando.",
            "Estou pagando por um serviço que não estou conseguindo usar.",
            "Por isso estou pensando em cancelar."
        ],

        triggers: [
            "Demonstrar empatia pela interrupção do serviço.",
            "Investigar há quanto tempo o problema ocorre.",
            "Investigar o histórico de atendimento ou reparo.",
            "Identificar corretamente a situação técnica.",
            "Apresentar uma ação técnica concreta.",
            "Tratar as preocupações ainda pendentes antes de considerar o cliente satisfeito."
        ],

        evaluationCriteria: {
            sondagem: true,
            empatia: true,
            causaRaiz: true,
            argumentacao: true,
            retencao: true,
            checkout: true
        }
    },


    /* ========================================================
       02 — ROBERTO ALMEIDA | REPARO TÉCNICO | DIFÍCIL
       ======================================================== */

    {
        id: 2,
        number: "02",
        title: "Roberto Almeida — Dez dias sem internet",

        customer: {
            name: "Roberto Almeida",
            plan: "500MB Fibra",
            speed: 500,
            price: 139.90,
            baseTime: "3 anos e 8 meses",
            mood: "Muito irritado",
            category: "Problema técnico"
        },

        problem: "Dez dias sem internet e contestação da cobrança",

        description:
            "Cliente está há dez dias sem internet, está muito insatisfeito com a demora e questiona ter que pagar normalmente pelos dias em que permaneceu sem sinal.",

        difficulty: "difícil",

        visibleInfo: {
            customerName: "Roberto Almeida",
            plan: "500MB Fibra",
            speed: "500 Mbps",
            price: "R$ 139,90",
            baseTime: "3 anos e 8 meses",
            problem: "Dez dias sem internet"
        },

        hiddenInfo: [
            "Está há dez dias sem internet.",
            "Já buscou atendimento anteriormente.",
            "A demora na solução aumentou muito sua insatisfação.",
            "Está cansado de receber orientações sem perceber uma solução definitiva.",
            "Considera injusto pagar normalmente pelo período em que ficou sem serviço.",
            "Possui duas preocupações distintas: recuperar a conexão e tratar o impacto dos dias sem serviço.",
            "Uma solução técnica isolada não elimina automaticamente sua insatisfação com o período sem internet.",
            "Está resistente à permanência, mas pode reconsiderar se todas as preocupações forem tratadas de forma coerente."
        ],

        objective:
            "Investigar o histórico e a situação técnica, reconhecer o impacto dos dez dias sem serviço, apresentar uma solução técnica concreta e conduzir corretamente a preocupação do cliente com o período de interrupção antes de trabalhar sua permanência.",

        objections: [
            "Já são dez dias sem internet.",
            "Eu já procurei vocês antes e continuo sem solução.",
            "Não adianta só dizer que vão resolver.",
            "Eu quero saber o que vai acontecer com esses dias que fiquei sem serviço.",
            "Não acho justo pagar a fatura inteira ficando tantos dias sem internet.",
            "Nesse ponto eu prefiro cancelar."
        ],

        triggers: [
            "Reconhecer de forma clara a gravidade da interrupção.",
            "Investigar os contatos e reparos anteriores.",
            "Investigar a situação técnica antes de apresentar oferta comercial.",
            "Apresentar uma ação concreta para restabelecimento do serviço.",
            "Não ignorar a preocupação com os dias sem utilização.",
            "Não declarar o problema resolvido enquanto houver uma objeção relevante pendente.",
            "Trabalhar as objeções progressivamente, sem despejar várias soluções de uma vez."
        ],

        evaluationCriteria: {
            sondagem: true,
            empatia: true,
            causaRaiz: true,
            argumentacao: true,
            retencao: true,
            checkout: true
        }
    },


    /* ========================================================
       03 — FERNANDA COSTA | CONCORRENTE INSTALADO | MÉDIO
       ======================================================== */

    {
        id: 3,
        number: "03",
        title: "Fernanda Costa — Concorrente já instalado",

        customer: {
            name: "Fernanda Costa",
            plan: "500MB Fibra",
            speed: 500,
            price: 139.90,
            baseTime: "2 anos e 6 meses",
            mood: "Decidida",
            category: "Concorrência"
        },

        problem: "Concorrente já instalado",

        description:
            "Cliente informa que já possui a fibra de outra empresa instalada e está avaliando o cancelamento da Nio Fibra.",

        difficulty: "médio",

        visibleInfo: {
            customerName: "Fernanda Costa",
            plan: "500MB Fibra",
            speed: "500 Mbps",
            price: "R$ 139,90",
            baseTime: "2 anos e 6 meses",
            problem: "Concorrente já instalado"
        },

        hiddenInfo: [
            "A fibra da concorrente já foi instalada.",
            "A instalação ocorreu há poucos dias.",
            "A cliente ainda está dentro do período inicial da contratação da concorrente.",
            "O principal motivo da mudança não deve ser revelado antes de ser investigado.",
            "Está disposta a explicar a proposta da concorrência quando o operador fizer perguntas relevantes.",
            "Apesar de ter outra internet instalada, ainda aceita ouvir uma alternativa coerente da Nio Fibra.",
            "A decisão de permanecer depende da qualidade da investigação e da solução apresentada."
        ],

        objective:
            "Confirmar a instalação da concorrente, investigar quando ocorreu, compreender a proposta e o motivo real da troca e somente então construir uma alternativa de retenção adequada.",

        objections: [
            "Eu já instalei a internet de outra empresa.",
            "Achei que agora seria melhor cancelar a Nio.",
            "A outra internet já está funcionando.",
            "Não sei se faz sentido continuar com dois serviços.",
            "Eu já estava praticamente decidida a sair."
        ],

        triggers: [
            "Perguntar quando a concorrente foi instalada.",
            "Investigar qual é a concorrente.",
            "Investigar preço, velocidade e condições da proposta.",
            "Descobrir o principal motivo da troca.",
            "Explorar a situação antes de apresentar uma alternativa.",
            "Apresentar uma solução relacionada ao motivo identificado."
        ],

        evaluationCriteria: {
            sondagem: true,
            empatia: true,
            causaRaiz: true,
            argumentacao: true,
            retencao: true,
            checkout: true
        }
    },


    /* ========================================================
       04 — RENATA OLIVEIRA | CONCORRENTE INSTALADO | DIFÍCIL
       ======================================================== */

    {
        id: 4,
        number: "04",
        title: "Renata Oliveira — Concorrente já instalado",

        customer: {
            name: "Renata Oliveira",
            plan: "500MB Fibra",
            speed: 500,
            price: 139.90,
            baseTime: "2 anos e 6 meses",
            mood: "Muito resistente",
            category: "Concorrência"
        },

        problem: "Concorrente já instalado",

        description:
            "Cliente já possui a fibra de outra empresa instalada e está bastante decidida a cancelar a Nio Fibra, exigindo uma condução mais aprofundada para reconsiderar.",

        difficulty: "difícil",

        visibleInfo: {
            customerName: "Renata Oliveira",
            plan: "500MB Fibra",
            speed: "500 Mbps",
            price: "R$ 139,90",
            baseTime: "2 anos e 6 meses",
            problem: "Concorrente já instalado"
        },

        hiddenInfo: [
            "A fibra da concorrente já foi instalada.",
            "A instalação ocorreu há poucos dias, no mesmo contexto temporal do cenário da Fernanda.",
            "A cliente está dentro do período inicial da contratação da concorrente.",
            "Está mais resistente do que Fernanda e inicialmente acredita que a troca já está decidida.",
            "Não revelará todos os detalhes da proposta espontaneamente.",
            "O operador precisa investigar a empresa concorrente, a proposta recebida e o principal motivo da troca.",
            "Uma primeira tentativa genérica de retenção não será suficiente.",
            "Pode apresentar uma nova objeção mesmo depois de receber uma alternativa.",
            "Pode reconsiderar a decisão se perceber vantagem concreta e se suas objeções forem tratadas de forma coerente."
        ],

        objective:
            "Realizar uma sondagem completa sobre a concorrência e o motivo da troca, compreender o que realmente levou à instalação do outro serviço e trabalhar as objeções progressivamente antes de buscar a permanência.",

        objections: [
            "Eu já instalei a outra internet e quero cancelar.",
            "Não vejo motivo para continuar com a Nio.",
            "A outra empresa me ofereceu uma condição que parece melhor.",
            "Eu já passei pelo trabalho de instalar outro serviço.",
            "Não quero manter duas internets.",
            "Vocês teriam que me mostrar uma vantagem real para eu reconsiderar."
        ],

        triggers: [
            "Não aceitar a primeira objeção como encerramento automático da negociação.",
            "Perguntar quando ocorreu a instalação.",
            "Investigar qual é a concorrente.",
            "Investigar preço, velocidade, benefícios e condições da proposta.",
            "Identificar o principal motivo da troca.",
            "Utilizar as informações descobertas na argumentação.",
            "Tratar uma objeção por vez.",
            "Evitar repetir a mesma oferta ou argumento sem considerar a resposta da cliente.",
            "Somente demonstrar mudança de decisão quando houver motivo concreto para isso."
        ],

        evaluationCriteria: {
            sondagem: true,
            empatia: true,
            causaRaiz: true,
            argumentacao: true,
            retencao: true,
            checkout: true
        }
    }

];


    /* ============================================================
       ESTADO
       ============================================================ */

    const state = {
        all: SCENARIOS,
        selectedScenario: null,
        selectedDifficulty: "medio",
        loaded: true
    };


    /* ============================================================
       FUNÇÕES AUXILIARES
       ============================================================ */

    function normalizeDifficulty(value) {

        if (!value) {
            return "medio";
        }

        const normalized = String(value)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (
            normalized.includes("facil") ||
            normalized.includes("fácil")
        ) {
            return "facil";
        }

        if (
            normalized.includes("dificil") ||
            normalized.includes("difícil")
        ) {
            return "dificil";
        }

        return "medio";
    }


    function formatCurrency(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "R$ 0,00";
        }

        return number.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }


    function formatSpeed(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "—";
        }

        if (number >= 1000) {
            return `${number / 1000} Gbps`;
        }

        return `${number} Mbps`;
    }


    /* ============================================================
       CRIAÇÃO DOS CARDS
       ============================================================ */

   function createScenarioCard(scenario, index) {
    const card = document.createElement("article");

    card.className = "scenario-card";
    card.dataset.scenarioId = scenario.id;
    card.setAttribute("tabindex", "0");

    const customerName =
        scenario.customer?.name ||
        scenario.customer?.nome ||
        "Cliente";

    const category =
        scenario.customer?.category ||
        scenario.customer?.categoria ||
        scenario.category ||
        scenario.categoria ||
        "Atendimento";

    const difficultyRaw =
        scenario.difficulty ||
        scenario.dificuldade ||
        "medio";

    const normalizedDifficulty = String(difficultyRaw)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const difficultyLabels = {
        facil: "Fácil",
        medio: "Médio",
        dificil: "Difícil"
    };

    const difficulty =
        difficultyLabels[normalizedDifficulty] ||
        String(difficultyRaw);

    card.innerHTML = `
        <div class="scenario-number">
            ${String(index + 1).padStart(2, "0")}
        </div>

        <div class="scenario-card-content">

            <h3 class="scenario-card-title">
                ${customerName}
            </h3>

            <p class="scenario-card-problem">
                ${category}
            </p>

            <div class="scenario-card-footer">

                <span
    class="scenario-difficulty"
    data-difficulty="${
        String(difficulty || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
    }"
>
    <span class="scenario-difficulty-dot"></span>
    ${difficulty}
</span>

                <button
                    type="button"
                    class="scenario-button"
                    data-scenario-id="${scenario.id}"
                >
                    Iniciar simulação
                </button>

            </div>

        </div>
    `;

    return card;
}

    /* ============================================================
       RENDERIZAÇÃO
       ============================================================ */

    function renderScenarios() {

        const container =
            document.getElementById("scenariosContainer");

        if (!container) {
            console.warn(
                "Simula AI: #scenariosContainer não encontrado."
            );

            return;
        }

        container.innerHTML = "";

        state.all.forEach((scenario, index) => {

            const card =
                createScenarioCard(scenario, index);

            container.appendChild(card);

        });

        bindScenarioCards();
    }


    /* ============================================================
       EVENTOS DOS CARDS
       ============================================================ */

    function bindScenarioCards() {

        const container =
            document.getElementById("scenariosContainer");

        if (!container) {
            return;
        }

        const buttons =
            container.querySelectorAll(".scenario-button");

        buttons.forEach(button => {

            button.addEventListener("click", function (event) {

                event.stopPropagation();

                const scenarioId =
                    Number(this.dataset.scenarioId);

                selectScenario(scenarioId);

            });

        });


        const cards =
            container.querySelectorAll(".scenario-card");

        cards.forEach(card => {

            card.addEventListener("click", function () {

                const scenarioId =
                    Number(this.dataset.scenarioId);

                selectScenario(scenarioId);

            });


            card.addEventListener("keydown", function (event) {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    const scenarioId =
                        Number(this.dataset.scenarioId);

                    selectScenario(scenarioId);

                }

            });

        });
    }


    /* ============================================================
       SELECIONAR CENÁRIO
       ============================================================ */

    function selectScenario(id) {

        const scenario =
            state.all.find(item => Number(item.id) === Number(id));

        if (!scenario) {

            console.error(
                "Simula AI: cenário não encontrado:",
                id
            );

            return null;
        }

        state.selectedScenario = scenario;

        window.SimulaAI.selectedScenario = scenario;

        document.dispatchEvent(
            new CustomEvent("simulaAI:scenarioSelected", {
                detail: scenario
            })
        );

        prepareSimulation(scenario);

        return scenario;
    }


    /* ============================================================
       PREPARAR SIMULAÇÃO
       ============================================================ */

  function prepareSimulation(scenario) {

    if (!scenario) {
        return;
    }

    const scenarioDifficulty =
        normalizeDifficulty(
            scenario.difficulty ||
            scenario.dificuldade ||
            "medio"
        );

    state.selectedDifficulty =
        scenarioDifficulty;

    if (
        window.SimulaAI.simulation &&
        typeof window.SimulaAI.simulation.start === "function"
    ) {

        window.SimulaAI.simulation.start(
            scenario,
            scenarioDifficulty
        );

        return;
    }

    if (
        typeof window.SimulaAI.startSimulation === "function"
    ) {

        window.SimulaAI.startSimulation(
            scenario,
            scenarioDifficulty
        );

        return;
    }

    document.dispatchEvent(
        new CustomEvent("simulaAI:startSimulation", {
            detail: {
                scenario: scenario,
                difficulty: scenarioDifficulty
            }
        })
    );
}

    /* ============================================================
       DIFICULDADE
       ============================================================ */

    function setDifficulty(value) {

        state.selectedDifficulty =
            normalizeDifficulty(value);

        return state.selectedDifficulty;
    }


    /* ============================================================
       BUSCAR CENÁRIO
       ============================================================ */

    function getScenarioById(id) {

        return state.all.find(
            scenario =>
                Number(scenario.id) === Number(id)
        ) || null;
    }


    /* ============================================================
       BUSCA POR CLIENTE
       ============================================================ */

    function getScenarioByCustomerName(name) {

        if (!name) {
            return null;
        }

        const search =
            String(name)
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

        return state.all.find(scenario => {

            const customerName =
                String(scenario.customer.name)
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

            return customerName.includes(search);

        }) || null;
    }


    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */

    function initialize() {

        state.loaded = true;

        renderScenarios();

        document.dispatchEvent(
            new CustomEvent("simulaAI:scenariosLoaded", {
                detail: state.all
            })
        );

        return state.all;
    }


    /* ============================================================
       API PÚBLICA
       ============================================================ */

    window.SimulaAI.scenarios = {

        all: state.all,

        state: state,

        initialize: initialize,

        render: renderScenarios,

        getAll: function () {
            return state.all;
        },

        getScenarioById: getScenarioById,

        getScenarioByCustomerName:
            getScenarioByCustomerName,

        selectScenario: selectScenario,

        setDifficulty: setDifficulty,

        getSelectedScenario: function () {
            return state.selectedScenario;
        },

        getSelectedDifficulty: function () {
            return state.selectedDifficulty;
        },

        formatCurrency: formatCurrency,

        formatSpeed: formatSpeed

    };


    /* ============================================================
       ALIASES PARA COMPATIBILIDADE
       ============================================================ */

    window.SimulaAI.getScenarios = function () {
        return state.all;
    };


    window.SimulaAI.getScenarioById =
        getScenarioById;


    window.SimulaAI.selectScenario =
        selectScenario;


    /* ============================================================
       AUTO INICIALIZAÇÃO
       ============================================================ */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})();