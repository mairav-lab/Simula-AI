/* ============================================================
   SIMULA AI — MOTOR DE AVALIAÇÃO
   Avaliação por IA via Cloudflare Workers AI
   Escala: 0 a 10
   ============================================================ */

(() => {
    "use strict";

    window.SimulaAI = window.SimulaAI || {};

    /* ============================================================
       CONFIGURAÇÃO
       ============================================================ */

    const API_URL =
        "https://simula-ai-api.maira-pinto2026.workers.dev/";

    const STORAGE_KEY =
        "simulaAI_evaluations";

    const CRITERIA = {
    abertura: {
        scoreId: "scoreAbertura",
        progressId: "progressAbertura",
        descriptionId: "descriptionAbertura"
    },

    sondagem: {
        scoreId: "scoreSondagem",
        progressId: "progressSondagem",
        descriptionId: "descriptionSondagem"
    },

    argumentacao: {
        scoreId: "scoreArgumentacao",
        progressId: "progressArgumentacao",
        descriptionId: "descriptionArgumentacao"
    },

    checkout: {
        scoreId: "scoreCheckout",
        progressId: "progressCheckout",
        descriptionId: "descriptionCheckout"
    }
};


    /* ============================================================
       UTILITÁRIOS
       ============================================================ */

    function getElement(id) {
        return document.getElementById(id);
    }


    function clampScore(value) {

        const number =
            Number(value);

        if (!Number.isFinite(number)) {
            return 0;
        }

        return Math.max(
            0,
            Math.min(
                10,
                number
            )
        );
    }


function formatScore(value) {

    return String(
        Math.round(
            clampScore(value)
        )
    );
}


    function normalizeText(value) {

        if (Array.isArray(value)) {
            return value
                .filter(Boolean)
                .join("\n");
        }

        return String(
            value || ""
        ).trim();
    }


    function normalizeMessages(messages) {

        if (!Array.isArray(messages)) {
            return [];
        }

        return messages
            .map(item => {

                const originalRole =
                    String(
                        item?.role ||
                        item?.sender ||
                        item?.type ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                let role = originalRole;

                if (
                    role === "agent" ||
                    role === "user" ||
                    role === "operador"
                ) {
                    role = "operator";
                }

                if (
                    role === "assistant" ||
                    role === "client" ||
                    role === "cliente"
                ) {
                    role = "customer";
                }

                const content =
                    String(
                        item?.content ||
                        item?.text ||
                        item?.message ||
                        ""
                    ).trim();

                if (
                    !content ||
                    (
                        role !== "operator" &&
                        role !== "customer"
                    )
                ) {
                    return null;
                }

                return {
                    role,
                    content
                };
            })
            .filter(Boolean);
    }


    /* ============================================================
       ESTADO VISUAL
       ============================================================ */

    function setEvaluationLoading() {

        const finalScore =
            getElement("finalScore");

        if (finalScore) {
            finalScore.textContent = "—";
        }


        Object.values(CRITERIA)
            .forEach(config => {

                const score =
                    getElement(
                        config.scoreId
                    );

                const progress =
                    getElement(
                        config.progressId
                    );

                const description =
                    getElement(
                        config.descriptionId
                    );

                if (score) {
                    score.textContent = "—";
                }

                if (progress) {
                    progress.style.width = "0%";
                }

                if (description) {
                    description.textContent =
                        "Avaliação em processamento...";
                }
            });


        const positive =
            getElement(
                "positiveFeedback"
            );

        const improvement =
            getElement(
                "improvementFeedback"
            );

        if (positive) {
            positive.textContent =
                "Analisando o atendimento...";
        }

        if (improvement) {
            improvement.textContent =
                "Analisando oportunidades de melhoria...";
        }
    }


    function showResultScreen() {

        /*
         * Primeiro usamos o próprio controle de telas
         * do simulation.js.
         */

        if (
            window.SimulaAI?.simulation &&
            typeof window.SimulaAI.simulation
                .showResultScreen === "function"
        ) {

            window.SimulaAI.simulation
                .showResultScreen();

            return;
        }


        /*
         * Fallback caso a API pública da simulação
         * ainda não esteja disponível.
         */

        const screens = [
            "loginScreen",
            "operatorDashboard",
            "adminDashboard",
            "scenarioScreen",
            "simulationScreen"
        ];

        screens.forEach(id => {

            const element =
                getElement(id);

            if (element) {
                element.classList.add(
                    "hidden"
                );
            }
        });


        const resultScreen =
            getElement("resultScreen");

        if (resultScreen) {
            resultScreen.classList.remove(
                "hidden"
            );
        }
    }


    /* ============================================================
       API — CLOUDFLARE
       ============================================================ */

    async function requestEvaluation(
        simulationData
    ) {

        const scenario =
            simulationData?.scenario ||
            {};

        const difficulty =
            simulationData?.difficulty ||
            scenario?.difficulty ||
            "medio";

        const messages =
            normalizeMessages(
                simulationData?.messages
            );


        if (
            !messages.some(
                item =>
                    item.role === "operator"
            )
        ) {

            throw new Error(
                "Não há falas do operador para avaliar."
            );
        }


       const evaluationUrl =
            `${API_URL.replace(/\/+$/, "")}/evaluate`;

        const response =
            await fetch(
                evaluationUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },
body: JSON.stringify({

    action: "evaluate",

    /* =========================================
       OPERADOR
       ========================================= */

    operator:
        simulationData?.operator || null,

    operatorId:
        simulationData?.operatorId || null,

    operatorName:
        simulationData?.operatorName || "Operador",

    operatorEmail:
        simulationData?.operatorEmail || null,


    /* =========================================
       CENÁRIO
       ========================================= */

    scenario:
        scenario,

    scenarioId:
        simulationData?.scenarioId || null,

    scenarioName:
        simulationData?.scenarioName || "",

    customerName:
        simulationData?.customerName || "",

    category:
        simulationData?.category || "",

    difficulty:
        difficulty,


    /* =========================================
       CONVERSA
       ========================================= */

    messages:
        messages,


    /* =========================================
       TEMPO DA SIMULAÇÃO
       ========================================= */

    startedAt:
        simulationData?.startedAt ||
        (
            simulationData?.startTime instanceof Date
                ? simulationData.startTime.toISOString()
                : simulationData?.startTime || null
        ),

    finishedAt:
        simulationData?.finishedAt ||
        (
            simulationData?.endTime instanceof Date
                ? simulationData.endTime.toISOString()
                : simulationData?.endTime || null
        ),

    durationSeconds:
        Number(
            simulationData?.durationSeconds || 0
        ),


    /* =========================================
       DESFECHO
       ========================================= */

    outcome:
        simulationData?.outcome || null,

    retentionOutcome:
        simulationData?.retentionOutcome ||
        simulationData?.outcome ||
        null,

    retained:
        simulationData?.retained === true,

    retentionStatus:
        simulationData?.retentionStatus || "",

    retentionLabel:
        simulationData?.retentionLabel || ""
})
                }
            );


        let data = null;

        try {
            data =
                await response.json();
        } catch {
            throw new Error(
                "O servidor retornou uma resposta inválida."
            );
        }


        if (!response.ok) {

            throw new Error(
                data?.error ||
                `Erro HTTP ${response.status}`
            );
        }


        if (
            !data?.success ||
            !data?.evaluation
        ) {

            throw new Error(
                data?.error ||
                "A avaliação não foi retornada."
            );
        }


        return data.evaluation;
    }


    /* ============================================================
       NORMALIZAÇÃO DA AVALIAÇÃO
       ============================================================ */

    function normalizeEvaluation(
    rawEvaluation,
    simulationData
) {

    const rawPillars =
        Array.isArray(rawEvaluation?.pillars)
            ? rawEvaluation.pillars
            : [];


    const rawCriteria =
        rawEvaluation?.criteria ||
        {};


    const pillarMap = {

        abertura:
            "opening",

        sondagem:
            "probing",

        argumentacao:
            "argumentation",

        checkout:
            "checkout"
    };


    const criteria = {};


    Object.keys(CRITERIA)
        .forEach(key => {

            const englishKey =
                pillarMap[key];


            const pillar =
                rawPillars.find(
                    item =>
                        item?.id === englishKey
                );


            const legacyItem =
                rawCriteria?.[key] ||
                rawCriteria?.[englishKey] ||
                {};


            const rawScore =
                pillar?.score ??
                legacyItem?.score ??
                legacyItem?.nota ??
                0;


            const rawDescription =
    pillar?.feedback ||
    (
        Array.isArray(pillar?.evidence) &&
        pillar.evidence.length
            ? pillar.evidence.join(" • ")
            : ""
    ) ||
    legacyItem?.feedback ||
    legacyItem?.description ||
    (
        Array.isArray(legacyItem?.evidence) &&
        legacyItem.evidence.length
            ? legacyItem.evidence.join(" • ")
            : ""
    ) ||
    "";


            criteria[key] = {

                score:
                    Math.round(
                        clampScore(
                            rawScore
                        )
                    ),


                description:
                    normalizeText(
                        rawDescription
                    ) ||
                    "Não houve detalhamento para este critério.",


                items:
    Array.isArray(pillar?.criteria) &&
    pillar.criteria.length
        ? pillar.criteria
        : Array.isArray(pillar?.evidence) &&
          pillar.evidence.length
            ? pillar.evidence
            : Array.isArray(legacyItem?.items) &&
              legacyItem.items.length
                ? legacyItem.items
                : Array.isArray(legacyItem?.evidence)
                    ? legacyItem.evidence
                    : []
            };
        });


    /*
     * NOTA GERAL
     *
     * Sempre inteira.
     */

    const rawFinalScore =
        rawEvaluation?.finalScore ??
        rawEvaluation?.score ??
        rawEvaluation?.notaFinal ??
        rawEvaluation?.nota ??
        0;


    const finalScore =
        Math.round(
            clampScore(
                rawFinalScore
            )
        );


    /*
     * RESULTADO DA RETENÇÃO
     */

    const rawOutcome =
        rawEvaluation?.outcome ||
        rawEvaluation?.retentionOutcome ||
        {};


    const retained =
        rawOutcome?.retained === true ||
        rawOutcome?.status === "retido" ||
        rawEvaluation?.retained === true ||
        rawEvaluation?.retentionStatus === "retido";


    const outcome = {

        status:
            retained
                ? "retido"
                : "nao_retido_cancelado",

        label:
            retained
                ? "Retido"
                : "Não retido - Cancelado",

        retained
    };


    /*
     * PONTOS POSITIVOS
     */

    const strengths =
        Array.isArray(
            rawEvaluation?.strengths
        )
            ? rawEvaluation.strengths
            : Array.isArray(
                rawEvaluation?.positive
            )
                ? rawEvaluation.positive
                : Array.isArray(
                    rawEvaluation?.positives
                )
                    ? rawEvaluation.positives
                    : [];


    /*
     * OPORTUNIDADES DE MELHORIA
     */

    const improvements =
        Array.isArray(
            rawEvaluation?.improvements
        )
            ? rawEvaluation.improvements
            : Array.isArray(
                rawEvaluation?.improvement
            )
                ? rawEvaluation.improvement
                : [];


    /*
     * ERROS CRÍTICOS
     */

    const criticalErrors =
        Array.isArray(
            rawEvaluation?.criticalErrors
        )
            ? rawEvaluation
                .criticalErrors
                .map(
                    item =>
                        String(
                            item || ""
                        ).trim()
                )
                .filter(Boolean)
            : [];


    /*
     * OBJETO NORMALIZADO
     */

    return {

        score:
            finalScore,

        finalScore,


        outcome,


        criteria,


        positiveFeedback:
            strengths.length
                ? strengths.join("\n• ")
                : normalizeText(
                    rawEvaluation
                        ?.positiveFeedback
                ) ||
                "Não foram identificados destaques suficientes para gerar um feedback específico.",


        improvementFeedback:
            improvements.length
                ? improvements.join("\n• ")
                : normalizeText(
                    rawEvaluation
                        ?.improvementFeedback
                ) ||
                "Não foram identificadas orientações adicionais.",


        summary:
            normalizeText(
                rawEvaluation?.summary ||
                rawEvaluation?.feedback
            ),


        criticalErrors,


        /*
         * Guardamos também os pilares completos.
         * Isso será útil quando quisermos mostrar
         * os subcritérios na interface.
         */

        pillars:
            rawPillars,


        scenario:
            simulationData?.scenario ||
            null,


        difficulty:
            simulationData?.difficulty ||
            null,


        messages:
            normalizeMessages(
                simulationData?.messages
            ),


        startTime:
            simulationData?.startTime ||
            null,


        endTime:
            simulationData?.endTime ||
            new Date().toISOString(),


        evaluatedAt:
            new Date().toISOString()
    };
}
    /* ============================================================
       RENDER — NOTA FINAL
       ============================================================ */

function renderFinalScore(
    evaluation
) {

    /* =========================================
       NOTA FINAL
    ========================================= */

    const scoreElement =
        getElement(
            "finalScore"
        );

    if (scoreElement) {

        scoreElement.textContent =
            formatScore(
                evaluation.finalScore
            );
    }


    /* =========================================
       RESULTADO DA RETENÇÃO
    ========================================= */

    const outcomeElement =
        getElement(
            "retentionOutcome"
        );

    const outcomeCard =
        getElement(
            "retentionOutcomeCard"
        );

    const outcomeIcon =
        getElement(
            "retentionOutcomeIcon"
        );

    const retained =
        evaluation?.outcome?.retained === true ||
        evaluation?.outcome?.status === "retido";


    if (outcomeElement) {

        outcomeElement.textContent =
            retained
                ? "Retido"
                : "Não retido - Cancelado";
    }


    if (outcomeCard) {

        outcomeCard.classList.remove(
            "is-retained",
            "is-cancelled"
        );

        outcomeCard.classList.add(
            retained
                ? "is-retained"
                : "is-cancelled"
        );
    }


    if (outcomeIcon) {

        outcomeIcon.innerHTML =
            retained
                ? '<i class="bi bi-check-lg"></i>'
                : '<i class="bi bi-x-lg"></i>';
    }
}
    /* ============================================================
       RENDER — CRITÉRIOS
       ============================================================ */

    function renderCriterion(
        key,
        item
    ) {

        const config =
            CRITERIA[key];

        if (!config) {
            return;
        }


        const score =
            clampScore(
                item?.score
            );

        const scoreElement =
            getElement(
                config.scoreId
            );

        const progressElement =
            getElement(
                config.progressId
            );

        const descriptionElement =
            getElement(
                config.descriptionId
            );


        if (scoreElement) {

            scoreElement.textContent =
                `${formatScore(score)}/10`;
        }


        if (progressElement) {

            progressElement.style.width =
                `${score * 10}%`;

            progressElement.setAttribute(
                "aria-valuenow",
                String(score)
            );

            progressElement.setAttribute(
                "aria-valuemin",
                "0"
            );

            progressElement.setAttribute(
                "aria-valuemax",
                "10"
            );
        }


        if (descriptionElement) {

            descriptionElement.textContent =
                normalizeText(
                    item?.description
                ) ||
                "Sem descrição.";
        }
    }


    function renderCriteria(
        evaluation
    ) {

        Object.keys(CRITERIA)
            .forEach(key => {

                renderCriterion(
                    key,
                    evaluation
                        ?.criteria
                        ?.[key]
                );
            });
    }


    /* ============================================================
       RENDER — FEEDBACK
       ============================================================ */

    function renderFeedback(
        evaluation
    ) {

        const positive =
            getElement(
                "positiveFeedback"
            );

        const improvement =
            getElement(
                "improvementFeedback"
            );


        if (positive) {

            positive.textContent =
                evaluation
                    .positiveFeedback;
        }


        if (improvement) {

            let improvementText =
                evaluation
                    .improvementFeedback;


            if (
                Array.isArray(
                    evaluation
                        .criticalErrors
                ) &&
                evaluation
                    .criticalErrors
                    .length
            ) {

                improvementText +=
                    "\n\nPontos críticos: " +
                    evaluation
                        .criticalErrors
                        .join(" • ");
            }


            improvement.textContent =
                improvementText;
        }
    }


    /* ============================================================
       RENDER COMPLETO
       ============================================================ */

/* ============================================================
   TRANSCRIÇÃO DA SIMULAÇÃO
   ============================================================ */

function renderTranscript(
    evaluation
) {

    const transcriptBody =
        getElement(
            "transcriptBody"
        );

    const transcriptMessages =
        getElement(
            "transcriptMessages"
        );

    const toggleButton =
        getElement(
            "toggleTranscriptButton"
        );


    if (
        !transcriptBody ||
        !transcriptMessages
    ) {
        return;
    }


    const messages =
        normalizeMessages(
            evaluation?.messages
        );


    /*
     * Começa fechado.
     */

    transcriptBody.classList.add(
        "hidden"
    );


    if (toggleButton) {

        toggleButton.innerHTML =
            '<i class="bi bi-chevron-down"></i> Ver conversa';

        toggleButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }


    /*
     * Sem mensagens
     */

    if (!messages.length) {

        transcriptMessages.innerHTML = `
            <div class="empty-state">
                Nenhuma mensagem foi registrada nesta simulação.
            </div>
        `;

        return;
    }


    /*
     * Limpa conteúdo anterior.
     */

    transcriptMessages.innerHTML = "";


    /*
     * Renderiza Cliente / Você
     * na ordem real da conversa.
     */

    messages.forEach(
        message => {

            const item =
                document.createElement(
                    "div"
                );

            const isOperator =
                message.role ===
                "operator";


            item.className =
                isOperator
                    ? "transcript-message transcript-operator"
                    : "transcript-message transcript-customer";


            const author =
                document.createElement(
                    "div"
                );

            author.className =
                "transcript-author";

            author.textContent =
                isOperator
                    ? "Você"
                    : "Cliente";


            const text =
                document.createElement(
                    "div"
                );

            text.className =
                "transcript-text";

            text.textContent =
                message.content;


            item.appendChild(
                author
            );

            item.appendChild(
                text
            );

            transcriptMessages.appendChild(
                item
            );
        }
    );


    /*
     * Abre / fecha a conversa.
     *
     * onclick é usado aqui para impedir
     * listeners duplicados entre avaliações.
     */

    if (toggleButton) {

        toggleButton.onclick =
            function () {

                const isHidden =
                    transcriptBody
                        .classList
                        .contains(
                            "hidden"
                        );


                transcriptBody
                    .classList
                    .toggle(
                        "hidden"
                    );


                toggleButton.innerHTML =
                    isHidden
                        ? '<i class="bi bi-chevron-up"></i> Ocultar conversa'
                        : '<i class="bi bi-chevron-down"></i> Ver conversa';


                toggleButton.setAttribute(
                    "aria-expanded",
                    isHidden
                        ? "true"
                        : "false"
                );
            };
    }
}


/* ============================================================
   RENDER COMPLETO
   ============================================================ */

function renderEvaluation(
    evaluation
) {

    showResultScreen();


    renderFinalScore(
        evaluation
    );


    renderCriteria(
        evaluation
    );


    renderFeedback(
        evaluation
    );


    renderTranscript(
        evaluation
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


    /* ============================================================
       ARMAZENAMENTO LOCAL
       ============================================================ */

    function getEvaluations() {

        try {

            const stored =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!stored) {
                return [];
            }

            const parsed =
                JSON.parse(stored);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.warn(
                "Simula AI: não foi possível carregar avaliações.",
                error
            );

            return [];
        }
    }


    function saveEvaluation(
        evaluation
    ) {

        try {

            const evaluations =
                getEvaluations();

            evaluations.unshift(
                evaluation
            );


            /*
             * Evita crescimento infinito do
             * localStorage durante desenvolvimento.
             */

            const limited =
                evaluations.slice(
                    0,
                    100
                );


            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    limited
                )
            );


            localStorage.setItem(
                "simulaAI_lastEvaluation",
                JSON.stringify(
                    evaluation
                )
            );

        } catch (error) {

            console.warn(
                "Simula AI: não foi possível salvar a avaliação.",
                error
            );
        }


        /*
         * Atualiza dashboard caso o módulo
         * possua alguma dessas funções.
         */

        try {

            if (
                window.SimulaAI?.dashboard
            ) {

                const dashboard =
                    window.SimulaAI.dashboard;

                if (
                    typeof dashboard
                        .refresh === "function"
                ) {

                    dashboard.refresh();

                } else if (
                    typeof dashboard
                        .render === "function"
                ) {

                    dashboard.render();

                } else if (
                    typeof dashboard
                        .load === "function"
                ) {

                    dashboard.load();
                }
            }

        } catch (error) {

            console.warn(
                "Simula AI: dashboard não pôde ser atualizado.",
                error
            );
        }
    }


    function getLastEvaluation() {

        try {

            const stored =
                localStorage.getItem(
                    "simulaAI_lastEvaluation"
                );

            if (!stored) {
                return null;
            }

            return JSON.parse(
                stored
            );

        } catch {
            return null;
        }
    }


    /* ============================================================
       ERRO DE AVALIAÇÃO
       ============================================================ */

    function renderEvaluationError(
        error
    ) {

        console.error(
            "SIMULA AI - erro na avaliação:",
            error
        );


        showResultScreen();


        const finalScore =
            getElement(
                "finalScore"
            );

        if (finalScore) {
            finalScore.textContent = "—";
        }


        Object.values(CRITERIA)
            .forEach(config => {

                const score =
                    getElement(
                        config.scoreId
                    );

                const progress =
                    getElement(
                        config.progressId
                    );

                const description =
                    getElement(
                        config.descriptionId
                    );

                if (score) {
                    score.textContent =
                        "—/10";
                }

                if (progress) {
                    progress.style.width =
                        "0%";
                }

                if (description) {
                    description.textContent =
                        "Avaliação indisponível.";
                }
            });


        const positive =
            getElement(
                "positiveFeedback"
            );

        const improvement =
            getElement(
                "improvementFeedback"
            );


        if (positive) {

            positive.textContent =
                "Não foi possível gerar a avaliação deste atendimento.";
        }


        if (improvement) {

            improvement.textContent =
                error?.message ||
                "Tente realizar uma nova simulação.";
        }
    }


    /* ============================================================
       FUNÇÃO PRINCIPAL
       ============================================================ */

    async function evaluateSimulation(
        simulationData
    ) {

        console.log(
            "Simula AI: iniciando avaliação por IA..."
        );


        if (!simulationData) {

            const error =
                new Error(
                    "Dados da simulação não encontrados."
                );

            renderEvaluationError(
                error
            );

            return null;
        }


        /*
         * Mostramos imediatamente a tela de resultado.
         * Assim o usuário percebe que a avaliação está
         * sendo processada, em vez de ficar parado em
         * "Simulação finalizada".
         */

        showResultScreen();

        setEvaluationLoading();


        try {

            const rawEvaluation =
                await requestEvaluation(
                    simulationData
                );


            const evaluation =
                normalizeEvaluation(
                    rawEvaluation,
                    simulationData
                );


            window.SimulaAI
                .lastEvaluation =
                evaluation;


            window.SimulaAI
                .currentEvaluation =
                evaluation;


            saveEvaluation(
                evaluation
            );


            renderEvaluation(
                evaluation
            );


            console.log(
                "Simula AI: avaliação concluída.",
                evaluation
            );


            return evaluation;

        } catch (error) {

            renderEvaluationError(
                error
            );

            return null;
        }
    }


    /* ============================================================
       API PÚBLICA
       ============================================================ */

    window.SimulaAI.evaluation = {
        evaluate:
            evaluateSimulation,

        evaluateSimulation,

        requestEvaluation,

        renderEvaluation,

        saveEvaluation,

        getEvaluations,

        getLastEvaluation
    };


    /*
     * Mantemos também a função global antiga.
     * Isso garante compatibilidade com o
     * simulation.js atual.
     */

    window.SimulaAI
        .evaluateSimulation =
        evaluateSimulation;


    console.log(
        "Simula AI: módulo de avaliação por IA carregado."
    );

})();