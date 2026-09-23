/* ============================================================
   SIMULA AI — DASHBOARD
   Controle dos painéis do operador e informações do dashboard
   ============================================================ */

(function () {
    "use strict";

    window.SimulaAI = window.SimulaAI || {};

    // =========================================================
    // UTILIDADES
    // =========================================================

    function getElement(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const element = getElement(id);

        if (element) {
            element.textContent = value;
        }
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString("pt-BR");
    }

    function formatScore(score) {
        if (
            score === null ||
            score === undefined ||
            score === ""
        ) {
            return "-";
        }

        const number = Number(score);

        if (Number.isNaN(number)) {
            return "-";
        }

        return `${number}/100`;
    }

// =========================================================
// HISTÓRICO DO OPERADOR — D1
// =========================================================

const API_URL =
    "https://simula-ai-api.maira-pinto2026.workers.dev";

let operatorHistoryCache = [];


// =========================================================
// USUÁRIO ATUAL
// =========================================================

function getCurrentOperator() {
    if (
        window.SimulaAI.auth &&
        typeof window.SimulaAI.auth.getCurrentUser === "function"
    ) {
        const user =
            window.SimulaAI.auth.getCurrentUser();

        if (user) {
            return user;
        }
    }

    try {
        const stored =
            localStorage.getItem("simulaAI_user");

        return stored
            ? JSON.parse(stored)
            : null;

    } catch (error) {
        console.warn(
            "Simula AI | Não foi possível recuperar usuário.",
            error
        );

        return null;
    }
}


// =========================================================
// BUSCAR HISTÓRICO NO D1
// =========================================================

async function fetchOperatorHistory() {
    const user = getCurrentOperator();

    const email =
        String(user?.email || "")
            .trim()
            .toLowerCase();

    if (!email) {
        operatorHistoryCache = [];
        return [];
    }

    try {
        const response = await fetch(
            `${API_URL}/history?operatorEmail=${encodeURIComponent(email)}&limit=200`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        const history =
            Array.isArray(data?.simulations)
                ? data.simulations
                : [];

        operatorHistoryCache =
            history.filter(item => {
                const itemEmail =
                    String(
                        item?.operatorEmail || ""
                    )
                        .trim()
                        .toLowerCase();

                return itemEmail === email;
            });

        return operatorHistoryCache;

    } catch (error) {
        console.error(
            "Simula AI | Erro ao carregar histórico do operador:",
            error
        );

        operatorHistoryCache = [];

        return [];
    }
}


// =========================================================
// COMPATIBILIDADE
// =========================================================

function getHistory() {
    return operatorHistoryCache;
}


function saveHistory() {
    /*
       Mantido somente por compatibilidade com módulos antigos.
       O histórico oficial agora é persistido no D1 pelo Worker.
    */
    return true;
}


function addSimulationToHistory(result) {
    /*
       A simulação já é salva no D1 durante a avaliação.

       Aqui apenas atualizamos o painel depois que uma nova
       avaliação for concluída.
    */

    setTimeout(() => {
        refreshOperatorDashboard();
    }, 700);

    return result || null;
}


// =========================================================
// ESTATÍSTICAS DO OPERADOR
// =========================================================

function updateDashboardStats() {
    const history =
        operatorHistoryCache;

    const totalSimulations =
        history.length;


    // NOTAS

    const scores =
        history
            .map(item =>
                Number(
                    item?.finalScore ??
                    item?.score ??
                    item?.nota
                )
            )
            .filter(score =>
                Number.isFinite(score)
            );

    const averageScore =
        scores.length
            ? (
                scores.reduce(
                    (sum, score) =>
                        sum + score,
                    0
                ) / scores.length
            )
            : 0;


    // RETENÇÃO

    const retentionResults =
        history.filter(item => {
            const result =
                String(
                    item?.retentionStatus ??
                    item?.retentionLabel ??
                    ""
                )
                    .trim()
                    .toLowerCase();

            return (
                result === "retido" ||
                result === "cancelado" ||
                typeof item?.retained === "boolean"
            );
        });

    const retainedCount =
        retentionResults.filter(item => {
            if (
                typeof item?.retained === "boolean"
            ) {
                return item.retained;
            }

            const result =
                String(
                    item?.retentionStatus ??
                    item?.retentionLabel ??
                    ""
                )
                    .trim()
                    .toLowerCase();

            return result === "retido";
        }).length;

    const retentionRate =
        retentionResults.length
            ? Math.round(
                (
                    retainedCount /
                    retentionResults.length
                ) * 100
            )
            : 0;


    // TELA

    setText(
        "operatorTotalSimulations",
        totalSimulations
    );

    setText(
        "operatorAverageScore",
        averageScore
            .toFixed(1)
            .replace(".", ",")
    );

    setText(
        "operatorRetentionRate",
        `${retentionRate}%`
    );


    // CENÁRIOS

    if (
        window.SimulaAI.scenarios &&
        Array.isArray(
            window.SimulaAI.scenarios.all
        )
    ) {
        setText(
            "availableScenariosCount",
            window.SimulaAI.scenarios.all.length
        );
    }
}


// =========================================================
// FORMATADORES DO HISTÓRICO
// =========================================================

function getHistoryScenarioName(item) {
    return (
        item?.scenarioName ||
        item?.scenarioTitle ||
        item?.customerName ||
        "Simulação"
    );
}


function getHistoryDate(item) {
    return (
        item?.finishedAt ||
        item?.createdAt ||
        item?.startedAt ||
        item?.date ||
        null
    );
}


function getHistoryScore(item) {
    const score =
        Number(
            item?.finalScore ??
            item?.score ??
            item?.nota
        );

    return Number.isFinite(score)
        ? score
        : null;
}


function getHistoryResult(item) {
    if (item?.retentionLabel) {
        return item.retentionLabel;
    }

    if (item?.retentionStatus) {
        const status =
            String(item.retentionStatus)
                .trim()
                .toLowerCase();

        if (status === "retido") {
            return "Retido";
        }

        if (status === "cancelado") {
            return "Cancelado";
        }

        return item.retentionStatus;
    }

    if (item?.retained === true) {
        return "Retido";
    }

    if (item?.retained === false) {
        return "Cancelado";
    }

    return "—";
}


// =========================================================
// HISTÓRICO — TABELA
// =========================================================

function renderHistory() {
    const tableBody =
        getElement("operatorHistoryTable");

    if (!tableBody) {
        return;
    }

    const history =
        operatorHistoryCache;

    if (!history.length) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-state"
                >
                    Nenhuma simulação realizada ainda.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        history
            .map(item => {
                const score =
                    getHistoryScore(item);

                const result =
                    getHistoryResult(item);

                return `
                    <tr>

                        <td>
                            ${escapeHTML(
                                formatDate(
                                    getHistoryDate(item)
                                )
                            )}
                        </td>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    getHistoryScenarioName(item)
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                formatDifficulty(
                                    item?.difficulty
                                )
                            )}
                        </td>

                        <td>
                            <strong>
                                ${
                                    score !== null
                                        ? score
                                            .toFixed(1)
                                            .replace(".", ",")
                                        : "—"
                                }
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(result)}
                        </td>

                        <td>
                            <button
                                type="button"
                                class="btn btn-outline btn-sm"
                                data-operator-history-id="${escapeHTML(
                                    item?.id
                                )}"
                            >
                                Ver resultado
                            </button>
                        </td>

                    </tr>
                `;
            })
            .join("");

    bindHistoryButtons();
}


// =========================================================
// BOTÕES DO HISTÓRICO
// =========================================================

function bindHistoryButtons() {
    document
        .querySelectorAll(
            "[data-operator-history-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                function () {

                    const id =
                        this.dataset
                            .operatorHistoryId;

                    const result =
                        operatorHistoryCache
                            .find(item =>
                                String(item?.id) ===
                                String(id)
                            );

                    if (result) {
                        showHistoryResult(result);
                    }
                }
            );
        });
}


// =========================================================
// MODAL — RESULTADO ANTIGO
// =========================================================

function showHistoryResult(result) {

    // =====================================================
    // GARANTE QUE EXISTA UM CONTAINER PARA O MODAL
    // =====================================================

 let modal = getElement("modalContainer");

if (!modal) {
    modal = document.createElement("div");
    modal.id = "modalContainer";
}

/*
 * O modal precisa ficar diretamente no BODY.
 * Isso evita que containers da aplicação interfiram
 * no position: fixed, z-index ou recortem o conteúdo.
 */
if (modal.parentElement !== document.body) {
    document.body.appendChild(modal);
}


    // =====================================================
    // DADOS PRINCIPAIS
    // =====================================================

    const score = getHistoryScore(result);
    const outcome = getHistoryResult(result);

    const scenarioName =
        getHistoryScenarioName(result);

    const difficulty =
        formatDifficulty(result?.difficulty);

    const date =
        formatDate(
            getHistoryDate(result)
        );

    const summary =
        result?.summary ||
        result?.feedback ||
        result?.diagnosis ||
        "Avaliação concluída.";


    // =====================================================
    // PILARES
    // =====================================================

    const pillars =
        result?.pillars || {};

    const opening =
        Number(pillars?.opening);

    const probing =
        Number(pillars?.probing);

    const argumentation =
        Number(pillars?.argumentation);

    const checkout =
        Number(pillars?.checkout);


    // =====================================================
    // LISTAS DE FEEDBACK
    // =====================================================

    const normalizeList = value => {

        if (Array.isArray(value)) {
            return value
                .map(item =>
                    typeof item === "string"
                        ? item
                        : item?.text ||
                          item?.feedback ||
                          item?.description ||
                          ""
                )
                .filter(Boolean);
        }

        if (typeof value === "string" && value.trim()) {
            return [value.trim()];
        }

        return [];
    };


    const strengths =
        normalizeList(
            result?.strengths ||
            result?.positive ||
            result?.positives
        );


    const improvements =
        normalizeList(
            result?.improvements ||
            result?.improvement
        );


    // =====================================================
    // FORMATAÇÃO
    // =====================================================

    const formatPillarScore = value => {

        if (!Number.isFinite(value)) {
            return "—";
        }

        return value
            .toFixed(1)
            .replace(".", ",");
    };


    const getOutcomeClass = value => {

        const text =
            String(value || "")
                .toLowerCase();

        if (
            text.includes("não retido") ||
            text.includes("nao retido") ||
            text.includes("cancelado")
        ) {
            return "history-outcome-cancelled";
        }

        if (text.includes("retido")) {
            return "history-outcome-retained";
        }

        return "history-outcome-neutral";
    };


    const difficultyClass =
        difficulty === "Difícil"
            ? "history-difficulty-hard"
            : difficulty === "Fácil"
                ? "history-difficulty-easy"
                : "history-difficulty-medium";


    // =====================================================
    // MODAL
    // =====================================================

    modal.innerHTML = `

        <div class="history-result-backdrop">

            <div
                class="history-result-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="historyResultTitle"
            >

                <!-- CABEÇALHO -->

                <div class="history-result-header">

                    <div class="history-result-heading">

                        <span class="history-result-eyebrow">
                            Feedback da simulação
                        </span>

                        <h2 id="historyResultTitle">
                            ${escapeHTML(scenarioName)}
                        </h2>

                        <div class="history-result-meta">

                            <span>
                                <i class="bi bi-calendar3"></i>
                                ${escapeHTML(date)}
                            </span>

                            <span
                                class="
                                    history-difficulty-badge
                                    ${difficultyClass}
                                "
                            >
                                ${escapeHTML(difficulty)}
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="history-result-close"
                        data-close-operator-history
                        aria-label="Fechar"
                    >
                        <i class="bi bi-x-lg"></i>
                    </button>

                </div>


                <!-- CONTEÚDO -->

                <div class="history-result-body">


                    <!-- DESTAQUE PRINCIPAL -->

                    <div class="history-result-summary-grid">

                        <div class="history-score-card">

                            <span class="history-score-label">
                                Nota final
                            </span>

                            <strong class="history-score-value">
                                ${
                                    score !== null
                                        ? score
                                            .toFixed(1)
                                            .replace(".", ",")
                                        : "—"
                                }
                            </strong>

                            <span class="history-score-max">
                                de 10
                            </span>

                        </div>


                        <div class="history-outcome-card">

                            <span class="history-score-label">
                                Resultado
                            </span>

                            <span
                                class="
                                    history-outcome-badge
                                    ${getOutcomeClass(outcome)}
                                "
                            >
                                ${escapeHTML(outcome)}
                            </span>

                        </div>

                    </div>


                    <!-- PILARES -->

                    <section class="history-feedback-section">

                        <div class="history-section-title">

                            <i class="bi bi-bar-chart-fill"></i>

                            <div>
                                <h3>
                                    Desempenho por pilar
                                </h3>

                                <p>
                                    Resultado da avaliação deste atendimento.
                                </p>
                            </div>

                        </div>


                        <div class="history-pillars-grid">

                            ${createHistoryPillarHTML(
                                "Abertura",
                                opening,
                                "bi-chat-heart"
                            )}

                            ${createHistoryPillarHTML(
                                "Sondagem",
                                probing,
                                "bi-search"
                            )}

                            ${createHistoryPillarHTML(
                                "Argumentação",
                                argumentation,
                                "bi-chat-square-text"
                            )}

                            ${createHistoryPillarHTML(
                                "Checkout",
                                checkout,
                                "bi-check2-circle"
                            )}

                        </div>

                    </section>


                    ${
                        strengths.length
                            ? `
                                <section
                                    class="
                                        history-feedback-section
                                        history-strength-section
                                    "
                                >

                                    <div class="history-section-title">

                                        <i class="bi bi-stars"></i>

                                        <div>
                                            <h3>Pontos fortes</h3>
                                            <p>
                                                O que foi bem conduzido neste atendimento.
                                            </p>
                                        </div>

                                    </div>

                                    <div class="history-feedback-list">

                                        ${strengths
                                            .slice(0, 2)
                                            .map(item => `
                                                <div class="history-feedback-item">
                                                    <i class="bi bi-check-circle-fill"></i>
                                                    <span>
                                                        ${escapeHTML(item)}
                                                    </span>
                                                </div>
                                            `)
                                            .join("")}

                                    </div>

                                </section>
                            `
                            : ""
                    }


                    ${
                        improvements.length
                            ? `
                                <section
                                    class="
                                        history-feedback-section
                                        history-improvement-section
                                    "
                                >

                                    <div class="history-section-title">

                                        <i class="bi bi-lightbulb"></i>

                                        <div>
                                            <h3>
                                                Oportunidade de melhoria
                                            </h3>

                                            <p>
                                                Principal ponto para o próximo atendimento.
                                            </p>
                                        </div>

                                    </div>

                                    <div class="history-feedback-list">

                                        ${improvements
                                            .slice(0, 1)
                                            .map(item => `
                                                <div class="history-feedback-item">
                                                    <i class="bi bi-arrow-up-right-circle-fill"></i>
                                                    <span>
                                                        ${escapeHTML(item)}
                                                    </span>
                                                </div>
                                            `)
                                            .join("")}

                                    </div>

                                </section>
                            `
                            : ""
                    }


                    <!-- RESUMO -->

                    <section class="history-feedback-section">

                        <div class="history-section-title">

                            <i class="bi bi-file-earmark-text"></i>

                            <div>
                                <h3>
                                    Resumo do atendimento
                                </h3>

                                <p>
                                    Síntese da avaliação realizada.
                                </p>
                            </div>

                        </div>

                        <p class="history-summary-text">
                            ${escapeHTML(summary)}
                        </p>

                    </section>


                </div>


                <!-- RODAPÉ -->

                <div class="history-result-footer">

                    <button
                        type="button"
                        class="btn btn-primary"
                        data-close-operator-history
                    >
                        Fechar feedback
                    </button>

                </div>

            </div>

        </div>
    `;


    // =====================================================
    // FECHAR
    // =====================================================

    const closeModal = () => {
        modal.innerHTML = "";
        document.body.classList.remove(
            "history-modal-open"
        );
    };


    modal
        .querySelectorAll(
            "[data-close-operator-history]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                closeModal
            );

        });


    const backdrop =
        modal.querySelector(
            ".history-result-backdrop"
        );


    backdrop?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                event.currentTarget
            ) {
                closeModal();
            }

        }
    );


    const escapeHandler = event => {

        if (event.key === "Escape") {

            closeModal();

            document.removeEventListener(
                "keydown",
                escapeHandler
            );

        }

    };


    document.addEventListener(
        "keydown",
        escapeHandler
    );


    document.body.classList.add(
        "history-modal-open"
    );
}


/* =========================================================
   CARD DE PILAR DO HISTÓRICO
========================================================= */

function createHistoryPillarHTML(
    label,
    score,
    icon
) {

    const value =
        Number.isFinite(score)
            ? score
            : null;


    const percentage =
        value !== null
            ? Math.max(
                0,
                Math.min(
                    100,
                    value * 10
                )
            )
            : 0;


    const formatted =
        value !== null
            ? value
                .toFixed(1)
                .replace(".", ",")
            : "—";


    return `

        <article class="history-pillar-card">

            <div class="history-pillar-top">

                <div class="history-pillar-icon">
                    <i class="bi ${escapeHTML(icon)}"></i>
                </div>

                <strong>
                    ${escapeHTML(label)}
                </strong>

                <span class="history-pillar-score">
                    ${formatted}
                </span>

            </div>

            <div class="history-pillar-progress">

                <span
                    style="
                        width:
                        ${percentage}%;
                    "
                ></span>

            </div>

            <span class="history-pillar-max">
                ${formatted} de 10
            </span>

        </article>
    `;
}

// =========================================================
// ABRIR / FECHAR HISTÓRICO
// =========================================================

function bindOperatorHistoryButton() {
    const button =
        getElement(
            "operatorHistoryButton"
        );

    const section =
        getElement(
            "operatorHistorySection"
        );

    if (!button || !section) {
        return;
    }

    if (
        button.dataset.historyBound ===
        "true"
    ) {
        return;
    }

    button.dataset.historyBound =
        "true";

    button.addEventListener(
        "click",
        async () => {

            await refreshOperatorDashboard();

            section.classList.toggle(
                "hidden"
            );

            if (
                !section.classList.contains(
                    "hidden"
                )
            ) {
                section.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    );
}


// =========================================================
// ATUALIZAÇÃO COMPLETA DO OPERADOR
// =========================================================

async function refreshOperatorDashboard() {
    await fetchOperatorHistory();

    updateDashboardStats();

    renderHistory();
}


// =========================================================
// DASHBOARD DO OPERADOR
// =========================================================

async function loadOperatorDashboard() {
    console.log(
        "Simula AI | Carregando painel do operador..."
    );

    updateUserWelcome();

    bindOperatorHistoryButton();

    await refreshOperatorDashboard();


    // Se os cenários já estiverem carregados,
    // renderiza novamente.

    if (
        window.SimulaAI.scenarios &&
        Array.isArray(
            window.SimulaAI.scenarios.all
        ) &&
        window.SimulaAI.scenarios.all.length > 0
    ) {
        if (
            typeof window.SimulaAI
                .renderOperatorScenarios ===
            "function"
        ) {
            window.SimulaAI
                .renderOperatorScenarios();
        }
    }

    console.log(
        "Simula AI | Painel do operador carregado."
    );
}


// =========================================================
// USUÁRIO / BOAS-VINDAS
// =========================================================

function updateUserWelcome() {
    const user =
        getCurrentOperator();

    if (!user) {
        return;
    }

    const name =
        user.name ||
        user.nome ||
        "Operador";

    const firstName =
        String(name)
            .trim()
            .split(" ")[0];

    const welcomeElements = [
        "operatorWelcomeName",
        "userName",
        "headerUserName"
    ];

    welcomeElements.forEach(id => {
        const element =
            getElement(id);

        if (element) {
            element.textContent =
                id === "operatorWelcomeName"
                    ? firstName
                    : name;
        }
    });


    const roleElement =
        getElement("headerUserRole");

    if (roleElement) {
        if (
            user.role === "admin" ||
            user.perfil === "admin"
        ) {
            roleElement.textContent =
                "Administrador";
        } else {
            roleElement.textContent =
                "Operador";
        }
    }
}
    // =========================================================
    // DASHBOARD ADMINISTRATIVO
    // =========================================================

    function loadAdminDashboard() {
        console.log(
            "Simula AI | Carregando painel administrativo..."
        );

        updateAdminStats();

        if (
            typeof window.SimulaAI
                .renderAdminScenarios ===
            "function"
        ) {
            window.SimulaAI.renderAdminScenarios();
        }

        console.log(
            "Simula AI | Painel administrativo carregado."
        );
    }

    function updateAdminStats() {
        const history = getHistory();

        const scenarios =
            window.SimulaAI.scenarios;

        const totalScenarios =
            scenarios &&
            Array.isArray(scenarios.all)
                ? scenarios.all.length
                : 0;

        setText(
            "adminTotalScenarios",
            totalScenarios
        );

        setText(
            "adminTotalSimulations",
            history.length
        );

        setText(
            "adminTotalOperators",
            getOperatorCount()
        );

        const scores = history
            .map(item => Number(item.score))
            .filter(score =>
                Number.isFinite(score)
            );

        const average =
            scores.length > 0
                ? Math.round(
                    scores.reduce(
                        (sum, score) =>
                            sum + score,
                        0
                    ) / scores.length
                )
                : 0;

        setText(
            "adminAverageScore",
            average > 0
                ? `${average}/100`
                : "—"
        );
    }

    function getOperatorCount() {
        try {
            const users =
                JSON.parse(
                    localStorage.getItem(
                        "simulaAI_users"
                    ) || "[]"
                );

            if (Array.isArray(users)) {
                return users.length;
            }

            return 0;
        } catch (error) {
            return 0;
        }
    }

    // =========================================================
    // DIFICULDADE
    // =========================================================

    function formatDifficulty(value) {
        const text =
            String(value || "")
                .toLowerCase()
                .trim();

        if (
            text === "facil" ||
            text === "fácil" ||
            text === "easy"
        ) {
            return "Fácil";
        }

        if (
            text === "dificil" ||
            text === "difícil" ||
            text === "hard"
        ) {
            return "Difícil";
        }

        return "Médio";
    }

    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHTML(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    // =========================================================
    // API PÚBLICA
    // =========================================================

    window.SimulaAI.dashboard = {
        loadOperatorDashboard,
        loadAdminDashboard,
        updateDashboardStats,
        updateAdminStats,
        renderHistory,
        getHistory,
        saveHistory,
        addSimulationToHistory
    };

    window.SimulaAI.loadOperatorDashboard =
        loadOperatorDashboard;

    window.SimulaAI.loadAdminDashboard =
        loadAdminDashboard;

    window.SimulaAI.getSimulationHistory =
        getHistory;

    window.SimulaAI.saveSimulationResult =
        addSimulationToHistory;

    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    function initialize() {
        console.log(
            "Simula AI | Dashboard.js inicializado."
        );

        bindOperatorHistoryButton();
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