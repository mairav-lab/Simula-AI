/* ============================================================
   SIMULA AI — ADMIN
   Painel administrativo conectado ao Cloudflare D1
   ============================================================ */

(function () {
    "use strict";

    window.SimulaAI = window.SimulaAI || {};

    const API_URL =
        "https://simula-ai-api.maira-pinto2026.workers.dev";

    const ADMIN_EMAIL =
        "maira.pinto@concentrix.com";

    const SHEETJS_URL =
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

    let history = [];
    let users = [];
    let scenarios = [];

    let initialized = false;


    // =========================================================
    // UTILIDADES
    // =========================================================

    function el(id) {
        return document.getElementById(id);
    }

    function setText(id, value) {
        const element = el(id);

        if (element) {
            element.textContent = value;
        }
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatScore(value) {
        const score = Number(value);

        if (!Number.isFinite(score)) {
            return "—";
        }

        return score
            .toFixed(1)
            .replace(".", ",");
    }

    function formatDifficulty(value) {
        const difficulty =
            String(value || "")
                .toLowerCase()
                .trim();

        if (
            difficulty === "dificil" ||
            difficulty === "difícil"
        ) {
            return "Difícil";
        }

        if (
            difficulty === "facil" ||
            difficulty === "fácil"
        ) {
            return "Fácil";
        }

        return "Médio";
    }

    function getSimulationDate(item) {
        const value =
            item?.finishedAt ||
            item?.createdAt ||
            item?.startedAt;

        if (!value) {
            return null;
        }

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString(
            "pt-BR",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        );
    }

    function formatDateOnly(item) {
        const date =
            getSimulationDate(item);

        if (!date) {
            return "";
        }

        return date.toLocaleDateString(
            "pt-BR"
        );
    }

    function formatTimeOnly(item) {
        const date =
            getSimulationDate(item);

        if (!date) {
            return "";
        }

        return date.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }

    function getCurrentUser() {
        try {
            return JSON.parse(
                localStorage.getItem(
                    "simulaAI_user"
                ) || "null"
            );
        } catch {
            return null;
        }
    }

    function isAdmin() {
        const user =
            getCurrentUser();

        const email =
            String(
                user?.email || ""
            )
                .trim()
                .toLowerCase();

        return (
            email ===
            ADMIN_EMAIL.toLowerCase()
        );
    }

    function showError(message) {
        console.error(
            "Simula AI | Admin:",
            message
        );

        alert(
            message ||
            "Não foi possível concluir a operação."
        );
    }

    function getDateFileName() {
        return new Date()
            .toISOString()
            .slice(0, 10);
    }

    function downloadBlob(
        blob,
        filename
    ) {
        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = filename;

        document.body.appendChild(
            link
        );

        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }


    // =========================================================
    // API
    // =========================================================

    async function requestAPI(
        path,
        options = {}
    ) {
        const response =
            await fetch(
                `${API_URL}${path}`,
                {
                    ...options,

                    headers: {
                        "Accept":
                            "application/json",

                        ...(options.body
                            ? {
                                "Content-Type":
                                    "application/json"
                            }
                            : {}),

                        ...(options.headers || {})
                    }
                }
            );

        let data = {};

        try {
            data =
                await response.json();
        } catch {
            data = {};
        }

        if (
            !response.ok ||
            data?.success === false
        ) {
            throw new Error(
                data?.error ||
                `Erro na API (${response.status})`
            );
        }

        return data;
    }


    // =========================================================
    // HISTÓRICO
    // =========================================================

    async function loadHistory() {
        const data =
            await requestAPI(
                "/history?limit=200"
            );

        history =
            Array.isArray(
                data?.simulations
            )
                ? data.simulations
                : [];

        return history;
    }


    // =========================================================
    // USUÁRIOS
    // =========================================================

    async function loadUsers() {
        const data =
            await requestAPI(
                "/admin/users"
            );

        users =
            Array.isArray(data?.users)
                ? data.users
                : [];

        return users;
    }

    async function saveUser(data) {
        const result =
            await requestAPI(
                "/admin/users",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            data
                        )
                }
            );

        await loadUsers();
        renderUsers();

        return result;
    }

    function renderUsers() {
        const tbody =
            el("adminUsersTable");

        if (!tbody) {
            return;
        }

        if (!users.length) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="empty-state"
                    >
                        Nenhum usuário cadastrado.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            users
                .map(user => {

                    const active =
                        String(
                            user.status || ""
                        ).toLowerCase() ===
                        "ativo";

                    const role =
                        String(
                            user.role || ""
                        ).toLowerCase() ===
                        "admin"
                            ? "Administrador"
                            : "Operador";

                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(
                                        user.name ||
                                        "Usuário"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(
                                    user.email
                                )}
                            </td>

                            <td>
                                <span class="badge badge-blue">
                                    ${escapeHTML(role)}
                                </span>
                            </td>

                            <td>
                                <span class="badge ${
                                    active
                                        ? "badge-green"
                                        : "badge-orange"
                                }">
                                    ${
                                        active
                                            ? "Ativo"
                                            : "Bloqueado"
                                    }
                                </span>
                            </td>

                            <td>
                                <button
                                    type="button"
                                    class="btn btn-outline btn-sm"
                                    data-admin-edit-user="${escapeHTML(
                                        user.id
                                    )}"
                                >
                                    Editar
                                </button>
                            </td>

                        </tr>
                    `;
                })
                .join("");

        tbody
            .querySelectorAll(
                "[data-admin-edit-user]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        openUserModal(
                            button.dataset
                                .adminEditUser
                        );
                    }
                );
            });
    }


    // =========================================================
    // MODAL DE USUÁRIO
    // =========================================================

    function openUserModal(userId = "") {
        const user =
            users.find(
                item =>
                    String(item.id) ===
                    String(userId)
            ) || null;

        const modal =
            document.createElement("div");

        modal.className =
            "outcome-modal";

        modal.innerHTML = `
            <div
                class="outcome-modal-backdrop"
                data-admin-modal-close
            ></div>

            <div
                class="outcome-modal-card"
                style="
                    max-width: 620px;
                    text-align: left;
                    max-height: 90vh;
                    overflow-y: auto;
                "
            >

                <h2 style="margin-bottom: 6px;">
                    ${
                        user
                            ? "Editar usuário"
                            : "Adicionar usuário"
                    }
                </h2>

                <p style="margin-bottom: 24px;">
                    Gerencie o acesso à plataforma Simula AI.
                </p>

                <form id="adminUserForm">

                    <div style="margin-bottom: 18px;">
                        <label
                            for="adminUserName"
                            style="
                                display: block;
                                font-weight: 700;
                                margin-bottom: 7px;
                            "
                        >
                            Nome
                        </label>

                        <input
                            id="adminUserName"
                            type="text"
                            required
                            value="${escapeHTML(
                                user?.name || ""
                            )}"
                            style="
                                width: 100%;
                                padding: 12px 14px;
                                border: 1px solid #d7deea;
                                border-radius: 10px;
                                font: inherit;
                            "
                        >
                    </div>

                    <div style="margin-bottom: 18px;">
                        <label
                            for="adminUserEmail"
                            style="
                                display: block;
                                font-weight: 700;
                                margin-bottom: 7px;
                            "
                        >
                            E-mail
                        </label>

                        <input
                            id="adminUserEmail"
                            type="email"
                            required
                            value="${escapeHTML(
                                user?.email || ""
                            )}"
                            style="
                                width: 100%;
                                padding: 12px 14px;
                                border: 1px solid #d7deea;
                                border-radius: 10px;
                                font: inherit;
                            "
                        >
                    </div>

                    <div style="
                        display: grid;
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                        gap: 16px;
                        margin-bottom: 22px;
                    ">

                        <div>
                            <label
                                for="adminUserRole"
                                style="
                                    display: block;
                                    font-weight: 700;
                                    margin-bottom: 7px;
                                "
                            >
                                Perfil
                            </label>

                            <select
                                id="adminUserRole"
                                style="
                                    width: 100%;
                                    padding: 12px 14px;
                                    border: 1px solid #d7deea;
                                    border-radius: 10px;
                                    font: inherit;
                                    background: white;
                                "
                            >
                                <option
                                    value="operador"
                                    ${
                                        user?.role !==
                                        "admin"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Operador
                                </option>

                                <option
                                    value="admin"
                                    ${
                                        user?.role ===
                                        "admin"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Administrador
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                for="adminUserStatus"
                                style="
                                    display: block;
                                    font-weight: 700;
                                    margin-bottom: 7px;
                                "
                            >
                                Status
                            </label>

                            <select
                                id="adminUserStatus"
                                style="
                                    width: 100%;
                                    padding: 12px 14px;
                                    border: 1px solid #d7deea;
                                    border-radius: 10px;
                                    font: inherit;
                                    background: white;
                                "
                            >
                                <option
                                    value="ativo"
                                    ${
                                        user?.status !==
                                        "bloqueado"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Ativo
                                </option>

                                <option
                                    value="bloqueado"
                                    ${
                                        user?.status ===
                                        "bloqueado"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Bloqueado
                                </option>
                            </select>
                        </div>

                    </div>

                    <div style="
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    ">

                        <button
                            type="button"
                            class="btn btn-outline"
                            data-admin-modal-close
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            class="btn btn-primary"
                        >
                            Salvar usuário
                        </button>

                    </div>

                </form>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        modal
            .querySelectorAll(
                "[data-admin-modal-close]"
            )
            .forEach(element => {

                element.addEventListener(
                    "click",
                    () => modal.remove()
                );
            });

        const form =
            modal.querySelector(
                "#adminUserForm"
            );

        form?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const submitButton =
                    form.querySelector(
                        '[type="submit"]'
                    );

                submitButton.disabled =
                    true;

                try {
                    await saveUser({
                        id:
                            user?.id || undefined,

                        name:
                            modal.querySelector(
                                "#adminUserName"
                            ).value.trim(),

                        email:
                            modal.querySelector(
                                "#adminUserEmail"
                            ).value
                                .trim()
                                .toLowerCase(),

                        role:
                            modal.querySelector(
                                "#adminUserRole"
                            ).value,

                        status:
                            modal.querySelector(
                                "#adminUserStatus"
                            ).value
                    });

                    modal.remove();

                } catch (error) {

                    showError(
                        error?.message ||
                        "Não foi possível salvar o usuário."
                    );

                    submitButton.disabled =
                        false;
                }
            }
        );
    }


    // =========================================================
    // CENÁRIOS
    // =========================================================

    async function loadScenarios() {
        const data =
            await requestAPI(
                "/admin/scenarios"
            );

        scenarios =
            Array.isArray(
                data?.scenarios
            )
                ? data.scenarios
                : [];

        return scenarios;
    }

    async function saveScenario(data) {
        const result =
            await requestAPI(
                "/admin/scenarios",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            data
                        )
                }
            );

        await loadScenarios();

        renderScenarios();
        renderStats();

        return result;
    }

    function renderScenarios() {
        const tbody =
            el("adminScenariosTable");

        if (!tbody) {
            return;
        }

        if (!scenarios.length) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="empty-state"
                    >
                        Nenhum cenário cadastrado.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            scenarios
                .map(scenario => {

                    const active =
                        scenario.active !== false;

                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(
                                        scenario.customerName ||
                                        scenario.title ||
                                        "Cenário"
                                    )}
                                </strong>

                                ${
                                    scenario.title &&
                                    scenario.title !==
                                    scenario.customerName
                                        ? `
                                            <div
                                                style="
                                                    margin-top: 4px;
                                                    font-size: .86rem;
                                                    opacity: .72;
                                                "
                                            >
                                                ${escapeHTML(
                                                    scenario.title
                                                )}
                                            </div>
                                        `
                                        : ""
                                }
                            </td>

                            <td>
                                ${escapeHTML(
                                    scenario.category ||
                                    "—"
                                )}
                            </td>

                            <td>
                                <span class="badge badge-blue">
                                    ${escapeHTML(
                                        formatDifficulty(
                                            scenario.difficulty
                                        )
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="badge ${
                                    active
                                        ? "badge-green"
                                        : "badge-orange"
                                }">
                                    ${
                                        active
                                            ? "Ativo"
                                            : "Inativo"
                                    }
                                </span>
                            </td>

                            <td>
                                <button
                                    type="button"
                                    class="btn btn-outline btn-sm"
                                    data-admin-edit-scenario="${
                                        scenario.id
                                    }"
                                >
                                    Editar
                                </button>
                            </td>

                        </tr>
                    `;
                })
                .join("");

        tbody
            .querySelectorAll(
                "[data-admin-edit-scenario]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        openScenarioModal(
                            button.dataset
                                .adminEditScenario
                        );
                    }
                );
            });
    }


    // =========================================================
    // MODAL DE CENÁRIO
    // =========================================================

    function openScenarioModal(
        scenarioId = ""
    ) {
        const scenario =
            scenarios.find(
                item =>
                    String(item.id) ===
                    String(scenarioId)
            ) || null;

        const modal =
            document.createElement("div");

        modal.className =
            "outcome-modal";

        modal.innerHTML = `
            <div
                class="outcome-modal-backdrop"
                data-admin-modal-close
            ></div>

            <div
                class="outcome-modal-card"
                style="
                    max-width: 680px;
                    text-align: left;
                    max-height: 90vh;
                    overflow-y: auto;
                "
            >

                <h2 style="margin-bottom: 6px;">
                    ${
                        scenario
                            ? "Editar cenário"
                            : "Novo cenário"
                    }
                </h2>

                <p style="margin-bottom: 24px;">
                    Configure os dados administrativos do cenário.
                </p>

                <form id="adminScenarioForm">

                    <div style="margin-bottom: 16px;">
                        <label
                            for="adminScenarioTitle"
                            style="
                                display: block;
                                font-weight: 700;
                                margin-bottom: 7px;
                            "
                        >
                            Título
                        </label>

                        <input
                            id="adminScenarioTitle"
                            type="text"
                            required
                            value="${escapeHTML(
                                scenario?.title || ""
                            )}"
                            style="
                                width: 100%;
                                padding: 12px 14px;
                                border: 1px solid #d7deea;
                                border-radius: 10px;
                                font: inherit;
                            "
                        >
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label
                            for="adminScenarioCustomer"
                            style="
                                display: block;
                                font-weight: 700;
                                margin-bottom: 7px;
                            "
                        >
                            Cliente
                        </label>

                        <input
                            id="adminScenarioCustomer"
                            type="text"
                            required
                            value="${escapeHTML(
                                scenario?.customerName ||
                                ""
                            )}"
                            style="
                                width: 100%;
                                padding: 12px 14px;
                                border: 1px solid #d7deea;
                                border-radius: 10px;
                                font: inherit;
                            "
                        >
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label
                            for="adminScenarioCategory"
                            style="
                                display: block;
                                font-weight: 700;
                                margin-bottom: 7px;
                            "
                        >
                            Categoria
                        </label>

                        <input
                            id="adminScenarioCategory"
                            type="text"
                            required
                            value="${escapeHTML(
                                scenario?.category ||
                                ""
                            )}"
                            style="
                                width: 100%;
                                padding: 12px 14px;
                                border: 1px solid #d7deea;
                                border-radius: 10px;
                                font: inherit;
                            "
                        >
                    </div>

                    <div style="
                        display: grid;
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                        gap: 16px;
                        margin-bottom: 22px;
                    ">

                        <div>
                            <label
                                for="adminScenarioDifficulty"
                                style="
                                    display: block;
                                    font-weight: 700;
                                    margin-bottom: 7px;
                                "
                            >
                                Dificuldade
                            </label>

                            <select
                                id="adminScenarioDifficulty"
                                style="
                                    width: 100%;
                                    padding: 12px 14px;
                                    border: 1px solid #d7deea;
                                    border-radius: 10px;
                                    font: inherit;
                                    background: white;
                                "
                            >
                                <option
                                    value="facil"
                                    ${
                                        scenario?.difficulty ===
                                        "facil"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Fácil
                                </option>

                                <option
                                    value="medio"
                                    ${
                                        !scenario ||
                                        scenario?.difficulty ===
                                        "medio"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Médio
                                </option>

                                <option
                                    value="dificil"
                                    ${
                                        scenario?.difficulty ===
                                        "dificil"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Difícil
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                for="adminScenarioStatus"
                                style="
                                    display: block;
                                    font-weight: 700;
                                    margin-bottom: 7px;
                                "
                            >
                                Status
                            </label>

                            <select
                                id="adminScenarioStatus"
                                style="
                                    width: 100%;
                                    padding: 12px 14px;
                                    border: 1px solid #d7deea;
                                    border-radius: 10px;
                                    font: inherit;
                                    background: white;
                                "
                            >
                                <option
                                    value="ativo"
                                    ${
                                        scenario?.active !== false
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Ativo
                                </option>

                                <option
                                    value="inativo"
                                    ${
                                        scenario?.active === false
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Inativo
                                </option>
                            </select>
                        </div>

                    </div>

                    <div
                        style="
                            padding: 14px 16px;
                            margin-bottom: 22px;
                            border-radius: 10px;
                            background: #f5f8fc;
                            font-size: .9rem;
                            line-height: 1.5;
                        "
                    >
                        ${
                            scenario
                                ? `
                                    Os dados internos já existentes
                                    deste cenário serão preservados.
                                `
                                : `
                                    O novo cenário será cadastrado
                                    no banco. A inteligência detalhada
                                    será configurada na etapa de
                                    conteúdo do cenário.
                                `
                        }
                    </div>

                    <div style="
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    ">

                        <button
                            type="button"
                            class="btn btn-outline"
                            data-admin-modal-close
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            class="btn btn-primary"
                        >
                            Salvar cenário
                        </button>

                    </div>

                </form>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        modal
            .querySelectorAll(
                "[data-admin-modal-close]"
            )
            .forEach(element => {

                element.addEventListener(
                    "click",
                    () => modal.remove()
                );
            });

        const form =
            modal.querySelector(
                "#adminScenarioForm"
            );

        form?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const submitButton =
                    form.querySelector(
                        '[type="submit"]'
                    );

                submitButton.disabled =
                    true;

                try {
                    await saveScenario({
                        id:
                            scenario?.id ||
                            undefined,

                        title:
                            modal.querySelector(
                                "#adminScenarioTitle"
                            ).value.trim(),

                        customerName:
                            modal.querySelector(
                                "#adminScenarioCustomer"
                            ).value.trim(),

                        category:
                            modal.querySelector(
                                "#adminScenarioCategory"
                            ).value.trim(),

                        difficulty:
                            modal.querySelector(
                                "#adminScenarioDifficulty"
                            ).value,

                        active:
                            modal.querySelector(
                                "#adminScenarioStatus"
                            ).value ===
                            "ativo",

                        data:
                            scenario?.data || {}
                    });

                    modal.remove();

                } catch (error) {

                    showError(
                        error?.message ||
                        "Não foi possível salvar o cenário."
                    );

                    submitButton.disabled =
                        false;
                }
            }
        );
    }


    // =========================================================
    // INDICADORES
    // =========================================================

    function renderStats() {
        const total =
            history.length;

        const operators =
            new Set(
                history
                    .map(item =>
                        String(
                            item.operatorEmail ||
                            item.operatorName ||
                            ""
                        )
                            .trim()
                            .toLowerCase()
                    )
                    .filter(Boolean)
            );

        const scores =
            history
                .map(item =>
                    Number(
                        item.finalScore
                    )
                )
                .filter(
                    Number.isFinite
                );

        const average =
            scores.length
                ? (
                    scores.reduce(
                        (sum, score) =>
                            sum + score,
                        0
                    ) /
                    scores.length
                )
                : 0;

        setText(
            "adminTotalOperators",
            operators.size
        );

        setText(
            "adminTotalSimulations",
            total
        );

        setText(
            "adminAverageScore",
            scores.length
                ? formatScore(
                    average
                )
                : "—"
        );

        setText(
            "adminTotalScenarios",
            scenarios.length ||
            (
                window.SimulaAI
                    ?.scenarios
                    ?.all
                    ?.length || 0
            )
        );
    }


    // =========================================================
    // AVALIAÇÕES
    // =========================================================

    function renderEvaluations() {
        const tbody =
            el("adminEvaluationsTable");

        if (!tbody) {
            return;
        }

        if (!history.length) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="empty-state"
                    >
                        Nenhuma avaliação disponível.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            history
                .map(item => `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    item.operatorName ||
                                    "Operador"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                item.scenarioName ||
                                "Simulação"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                formatDate(
                                    item.finishedAt ||
                                    item.createdAt
                                )
                            )}
                        </td>

                        <td>
                            <strong>
                                ${formatScore(
                                    item.finalScore
                                )}
                            </strong>
                        </td>

                        <td>
                            <span class="badge ${
                                item.retained
                                    ? "badge-green"
                                    : item.retentionStatus ===
                                      "nao_concluido"
                                        ? "badge-yellow"
                                        : "badge-orange"
                            }">
                                ${escapeHTML(
                                    item.retentionLabel ||
                                    "Não concluído"
                                )}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="btn btn-outline btn-sm"
                                data-admin-result-id="${escapeHTML(
                                    item.id
                                )}"
                            >
                                Ver
                            </button>
                        </td>

                    </tr>
                `)
                .join("");

        tbody
            .querySelectorAll(
                "[data-admin-result-id]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        showEvaluation(
                            button.dataset
                                .adminResultId
                        );
                    }
                );
            });
    }


    // =========================================================
    // DETALHE DA AVALIAÇÃO
    // =========================================================

    function showEvaluation(id) {
        const item =
            history.find(
                record =>
                    String(record.id) ===
                    String(id)
            );

        if (!item) {
            return;
        }

        const positives =
            Array.isArray(
                item.strengths
            )
                ? item.strengths
                : [];

        const improvements =
            Array.isArray(
                item.improvements
            )
                ? item.improvements
                : [];

        const pillars =
            item.pillars || {};

        const modal =
            document.createElement("div");

        modal.className =
            "outcome-modal";

        modal.innerHTML = `
            <div
                class="outcome-modal-backdrop"
                data-admin-modal-close
            ></div>

            <div
                class="outcome-modal-card"
                style="
                    max-width: 720px;
                    text-align: left;
                    max-height: 88vh;
                    overflow-y: auto;
                "
            >

                <h2 style="margin-bottom: 6px;">
                    Resultado da simulação
                </h2>

                <p style="margin-bottom: 24px;">
                    ${escapeHTML(
                        item.operatorName ||
                        "Operador"
                    )}
                    •
                    ${escapeHTML(
                        item.scenarioName ||
                        "Simulação"
                    )}
                </p>

                <div
                    class="stats-grid"
                    style="
                        grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                        margin-bottom: 24px;
                    "
                >

                    <article class="stat-card">
                        <span class="stat-label">
                            Nota final
                        </span>

                        <div class="stat-value">
                            ${formatScore(
                                item.finalScore
                            )}
                        </div>
                    </article>

                    <article class="stat-card">
                        <span class="stat-label">
                            Resultado
                        </span>

                        <div
                            style="
                                font-weight: 700;
                                margin-top: 10px;
                            "
                        >
                            ${escapeHTML(
                                item.retentionLabel ||
                                "Não concluído"
                            )}
                        </div>
                    </article>

                </div>

                <h3>
                    Desempenho por pilar
                </h3>

                <p>
                    <strong>Abertura:</strong>
                    ${formatScore(
                        pillars.opening
                    )}/10

                    &nbsp; • &nbsp;

                    <strong>Sondagem:</strong>
                    ${formatScore(
                        pillars.probing
                    )}/10
                </p>

                <p>
                    <strong>Argumentação:</strong>
                    ${formatScore(
                        pillars.argumentation
                    )}/10

                    &nbsp; • &nbsp;

                    <strong>Checkout:</strong>
                    ${formatScore(
                        pillars.checkout
                    )}/10
                </p>

                ${
                    item.summary
                        ? `
                            <h3>
                                Resumo
                            </h3>

                            <p>
                                ${escapeHTML(
                                    item.summary
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    positives.length
                        ? `
                            <h3>
                                Pontos positivos
                            </h3>

                            <p>
                                ${escapeHTML(
                                    positives.join(" ")
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    improvements.length
                        ? `
                            <h3>
                                Ponto de melhoria
                            </h3>

                            <p>
                                ${escapeHTML(
                                    improvements.join(" ")
                                )}
                            </p>
                        `
                        : ""
                }

                <div
                    style="
                        display: flex;
                        justify-content: flex-end;
                        margin-top: 26px;
                    "
                >
                    <button
                        type="button"
                        class="btn btn-primary"
                        data-admin-modal-close
                    >
                        Fechar
                    </button>
                </div>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        modal
            .querySelectorAll(
                "[data-admin-modal-close]"
            )
            .forEach(element => {

                element.addEventListener(
                    "click",
                    () => modal.remove()
                );
            });
    }


    // =========================================================
    // NAVEGAÇÃO
    // =========================================================

   const sections = [
    "adminUsersSection",
    "adminScenariosSection",
    "adminKnowledgeSection",
    "adminEvaluationsSection",
    "adminReportsSection"
];

    function hideAdminSections() {
        sections.forEach(id => {
            el(id)?.classList.add(
                "hidden"
            );
        });
    }

    function showSection(id) {
        hideAdminSections();

        const section =
            el(id);

        if (!section) {
            return;
        }

        section.classList.remove(
            "hidden"
        );

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function bindNavigation() {
        el("adminKnowledgeButton")
    ?.addEventListener(
        "click",
        () => {
            showSection(
                "adminKnowledgeSection"
            );
        }
    );
        el("adminUsersButton")
            ?.addEventListener(
                "click",
                () => {
                    renderUsers();

                    showSection(
                        "adminUsersSection"
                    );
                }
            );

        el("adminScenariosButton")
            ?.addEventListener(
                "click",
                () => {
                    renderScenarios();

                    showSection(
                        "adminScenariosSection"
                    );
                }
            );

        el("adminEvaluationsButton")
            ?.addEventListener(
                "click",
                () => {
                    renderEvaluations();

                    showSection(
                        "adminEvaluationsSection"
                    );
                }
            );

        el("adminReportsButton")
            ?.addEventListener(
                "click",
                () => {
                    showSection(
                        "adminReportsSection"
                    );
                }
            );

        el("adminRefreshButton")
            ?.addEventListener(
                "click",
                refresh
            );

        el("addUserButton")
            ?.addEventListener(
                "click",
                () => openUserModal()
            );

        el("addScenarioButton")
            ?.addEventListener(
                "click",
                () => openScenarioModal()
            );
    }


    // =========================================================
    // DADOS PARA RELATÓRIO
    // =========================================================

    function buildReportRows() {
        return history.map(
            item => ({
                "Nome":
                    item.operatorName ||
                    "",

                "E-mail":
                    item.operatorEmail ||
                    "",

                "Data":
                    formatDateOnly(item),

                "Hora":
                    formatTimeOnly(item),

                "Cenário":
                    item.scenarioName ||
                    "",

                "Categoria":
                    item.category ||
                    "",

                "Dificuldade":
                    formatDifficulty(
                        item.difficulty
                    ),

                "Nota":
                    Number.isFinite(
                        Number(
                            item.finalScore
                        )
                    )
                        ? Number(
                            item.finalScore
                        )
                        : "",

                "Resultado":
                    item.retentionLabel ||
                    "",

                "Resumo":
                    item.summary ||
                    ""
            })
        );
    }


    // =========================================================
    // CSV
    // =========================================================

    function exportCSV() {
        if (!history.length) {
            alert(
                "Não há simulações para exportar."
            );

            return;
        }

        const rows =
            buildReportRows();

        const headers = [
            "Nome",
            "E-mail",
            "Data",
            "Hora",
            "Cenário",
            "Categoria",
            "Dificuldade",
            "Nota",
            "Resultado",
            "Resumo"
        ];

        const csvRows = [
            headers,
            ...rows.map(row =>
                headers.map(
                    header =>
                        row[header]
                )
            )
        ];

        const csv =
            csvRows
                .map(row =>
                    row
                        .map(value =>
                            `"${String(
                                value ?? ""
                            ).replace(
                                /"/g,
                                '""'
                            )}"`
                        )
                        .join(";")
                )
                .join("\n");

        const blob =
            new Blob(
                [
                    "\uFEFF" +
                    csv
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );

        downloadBlob(
            blob,
            `simula-ai-resultados-${
                getDateFileName()
            }.csv`
        );
    }


    // =========================================================
    // SHEETJS
    // =========================================================

    function loadSheetJS() {
        if (window.XLSX) {
            return Promise.resolve(
                window.XLSX
            );
        }

        return new Promise(
            (resolve, reject) => {

                const existing =
                    document.querySelector(
                        'script[data-simula-sheetjs]'
                    );

                if (existing) {
                    existing.addEventListener(
                        "load",
                        () =>
                            resolve(
                                window.XLSX
                            ),
                        {
                            once: true
                        }
                    );

                    existing.addEventListener(
                        "error",
                        () =>
                            reject(
                                new Error(
                                    "Não foi possível carregar o gerador de Excel."
                                )
                            ),
                        {
                            once: true
                        }
                    );

                    return;
                }

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    SHEETJS_URL;

                script.async =
                    true;

                script.dataset
                    .simulaSheetjs =
                    "true";

                script.onload =
                    () => resolve(
                        window.XLSX
                    );

                script.onerror =
                    () => reject(
                        new Error(
                            "Não foi possível carregar o gerador de Excel."
                        )
                    );

                document.head.appendChild(
                    script
                );
            }
        );
    }


    // =========================================================
    // EXCEL XLSX REAL
    // =========================================================

    async function exportExcel() {
        if (!history.length) {
            alert(
                "Não há simulações para exportar."
            );

            return;
        }

        const button =
            el("exportExcelButton");

        if (button) {
            button.disabled =
                true;
        }

        try {
            const XLSX =
                await loadSheetJS();

            if (!XLSX) {
                throw new Error(
                    "Biblioteca XLSX indisponível."
                );
            }

            const rows =
                buildReportRows();

            const worksheet =
                XLSX.utils
                    .json_to_sheet(
                        rows,
                        {
                            header: [
                                "Nome",
                                "E-mail",
                                "Data",
                                "Hora",
                                "Cenário",
                                "Categoria",
                                "Dificuldade",
                                "Nota",
                                "Resultado",
                                "Resumo"
                            ]
                        }
                    );

            worksheet["!cols"] = [
                { wch: 24 },
                { wch: 34 },
                { wch: 13 },
                { wch: 10 },
                { wch: 38 },
                { wch: 22 },
                { wch: 14 },
                { wch: 10 },
                { wch: 18 },
                { wch: 65 }
            ];

            if (rows.length) {
                worksheet["!autofilter"] = {
                    ref:
                        `A1:J${
                            rows.length + 1
                        }`
                };
            }

            const workbook =
                XLSX.utils
                    .book_new();

            XLSX.utils
                .book_append_sheet(
                    workbook,
                    worksheet,
                    "Resultados"
                );

            workbook.Props = {
                Title:
                    "Simula AI - Resultados",

                Subject:
                    "Resultados das simulações",

                Author:
                    "Simula AI",

                Company:
                    "Concentrix",

                CreatedDate:
                    new Date()
            };

            XLSX.writeFile(
                workbook,
                `simula-ai-resultados-${
                    getDateFileName()
                }.xlsx`
            );

        } catch (error) {

            console.error(
                "Simula AI | Excel:",
                error
            );

            showError(
                "Não foi possível gerar o arquivo Excel."
            );

        } finally {

            if (button) {
                button.disabled =
                    false;
            }
        }
    }


    // =========================================================
    // EXPORTAÇÕES
    // =========================================================

    function bindExports() {
        el("exportCsvButton")
            ?.addEventListener(
                "click",
                exportCSV
            );

        el("exportExcelButton")
            ?.addEventListener(
                "click",
                exportExcel
            );
    }


    // =========================================================
    // ATUALIZAÇÃO COMPLETA
    // =========================================================

    async function refresh() {
        if (!isAdmin()) {
            return;
        }

        const refreshButton =
            el("adminRefreshButton");

        if (refreshButton) {
            refreshButton.disabled =
                true;
        }

        try {
            const results =
                await Promise.allSettled([
                    loadHistory(),
                    loadUsers(),
                    loadScenarios()
                ]);

            const failures =
                results.filter(
                    result =>
                        result.status ===
                        "rejected"
                );

            results.forEach(
                (result, index) => {

                    if (
                        result.status ===
                        "rejected"
                    ) {
                        console.error(
                            "Simula AI | Falha ao carregar módulo:",
                            index,
                            result.reason
                        );
                    }
                }
            );

            renderStats();
            renderUsers();
            renderScenarios();
            renderEvaluations();

            if (
                failures.length ===
                results.length
            ) {
                throw new Error(
                    "Nenhum dado administrativo pôde ser carregado."
                );
            }

            console.log(
                "Simula AI | Admin atualizado",
                {
                    simulations:
                        history.length,

                    users:
                        users.length,

                    scenarios:
                        scenarios.length
                }
            );

        } catch (error) {

            console.error(
                "Simula AI | Erro no Admin:",
                error
            );

            showError(
                "Não foi possível carregar os dados do painel administrativo."
            );

        } finally {

            if (refreshButton) {
                refreshButton.disabled =
                    false;
            }
        }
    }

// =========================================================
// BASE DE CONHECIMENTO — CONSULTA
// =========================================================

function openKnowledgeModal(type) {
    const contents = {
        reparo: {
            icon: "bi-router-fill",
            title: "Reparo Técnico",
            subtitle: "Referência para cenários de problemas de conexão.",
            html: `
                <div class="knowledge-detail-item">
                    <strong>Diagnóstico do problema</strong>
                    <p>
                        Investigar o motivo do contato e compreender
                        o impacto causado pela indisponibilidade do serviço.
                    </p>
                </div>

                <div class="knowledge-detail-item">
                    <strong>Histórico e contexto</strong>
                    <p>
                        Considerar contatos anteriores, tempo sem serviço
                        e informações relevantes apresentadas pelo cliente.
                    </p>
                </div>

                <div class="knowledge-detail-item">
                    <strong>Tratativa técnica</strong>
                    <p>
                        A solução do problema técnico deve ser conduzida
                        antes da tentativa de retenção.
                    </p>
                </div>

                <div class="knowledge-detail-item">
                    <strong>Impacto financeiro</strong>
                    <p>
                        Quando houver contestação relacionada ao período
                        sem serviço, o tema deve ser tratado durante
                        o atendimento.
                    </p>
                </div>
            `
        },

        concorrencia: {
            icon: "bi-arrow-left-right",
            title: "Concorrência",
            subtitle: "Referência para cenários de retenção por concorrente.",
            html: `
                <div class="knowledge-detail-item">
                    <strong>Identificação do motivo</strong>
                    <p>
                        Investigar por que o cliente decidiu contratar
                        outra operadora e quais fatores influenciaram
                        sua decisão.
                    </p>
                </div>

                <div class="knowledge-detail-item">
                    <strong>Sondagem da proposta</strong>
                    <p>
                        Explorar as informações necessárias sobre
                        a proposta concorrente antes de apresentar
                        uma alternativa de retenção.
                    </p>
                </div>

                <div class="knowledge-detail-item">
                    <strong>Argumentação</strong>
                    <p>
                        A proposta deve estar relacionada ao motivo
                        identificado durante a sondagem, evitando
                        ofertas genéricas.
                    </p>
                </div>

                <div class="knowledge-detail-item">
                    <strong>Condução da retenção</strong>
                    <p>
                        Trabalhar as objeções progressivamente e confirmar
                        a decisão do cliente ao final da negociação.
                    </p>
                </div>
            `
        },

        avaliacao: {
            icon: "bi-clipboard-check-fill",
            title: "Critérios de avaliação",
            subtitle: "Estrutura utilizada na avaliação das simulações.",
            html: `
                <div class="knowledge-pillar">
                    <div>
                        <strong>Abertura</strong>
                        <span>25%</span>
                    </div>

                    <p>
                        Acolhimento, identificação do cliente,
                        confirmação de dados e condução inicial.
                    </p>
                </div>

                <div class="knowledge-pillar">
                    <div>
                        <strong>Sondagem</strong>
                        <span>25%</span>
                    </div>

                    <p>
                        Investigação do motivo do cancelamento,
                        causa raiz e informações necessárias
                        para compreender o cenário.
                    </p>
                </div>

                <div class="knowledge-pillar">
                    <div>
                        <strong>Argumentação</strong>
                        <span>25%</span>
                    </div>

                    <p>
                        Uso das informações descobertas,
                        tratamento da causa, solução,
                        objeções e tentativa de retenção.
                    </p>
                </div>

                <div class="knowledge-pillar">
                    <div>
                        <strong>Checkout</strong>
                        <span>25%</span>
                    </div>

                    <p>
                        Confirmação do resultado do atendimento
                        e encerramento coerente com o desfecho.
                    </p>
                </div>
            `
        }
    };

    const content = contents[type];

    if (!content) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.className = "outcome-modal";

    modal.innerHTML = `
        <div
            class="outcome-modal-backdrop"
            data-knowledge-close
        ></div>

        <div
            class="outcome-modal-card"
            style="
                max-width: 720px;
                text-align: left;
                max-height: 88vh;
                overflow-y: auto;
            "
        >
            <div
                style="
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 22px;
                "
            >
                <div
                    style="
                        width: 50px;
                        height: 50px;
                        border-radius: 14px;
                        background: #e9f5fb;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.35rem;
                        color: #073b68;
                        flex-shrink: 0;
                    "
                >
                    <i class="bi ${content.icon}"></i>
                </div>

                <div>
                    <h2 style="margin: 0 0 4px;">
                        ${content.title}
                    </h2>

                    <p style="margin: 0;">
                        ${content.subtitle}
                    </p>
                </div>
            </div>

            <div class="knowledge-modal-content">
                ${content.html}
            </div>

            <div
                style="
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 26px;
                "
            >
                <button
                    type="button"
                    class="btn btn-primary"
                    data-knowledge-close
                >
                    Fechar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal
        .querySelectorAll(
            "[data-knowledge-close]"
        )
        .forEach(element => {
            element.addEventListener(
                "click",
                () => modal.remove()
            );
        });
}


function bindKnowledgeCards() {
    const section =
        el("adminKnowledgeSection");

    if (!section) {
        return;
    }

    const cards =
        section.querySelectorAll(
            ".scenario-card"
        );

    const types = [
        "reparo",
        "concorrencia",
        "avaliacao"
    ];

    cards.forEach(
        (card, index) => {

            const type =
                types[index];

            if (!type) {
                return;
            }

            card.style.cursor =
                "pointer";

            card.setAttribute(
                "role",
                "button"
            );

            card.setAttribute(
                "tabindex",
                "0"
            );

            card.addEventListener(
                "click",
                () =>
                    openKnowledgeModal(
                        type
                    )
            );

            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                            "Enter" ||
                        event.key ===
                            " "
                    ) {
                        event.preventDefault();

                        openKnowledgeModal(
                            type
                        );
                    }
                }
            );
        }
    );
}
    // =========================================================
    // API PÚBLICA
    // =========================================================

    window.SimulaAI.admin = {
        refresh,

        loadHistory,
        loadUsers,
        loadScenarios,

        renderStats,
        renderUsers,
        renderScenarios,
        renderEvaluations,

        exportCSV,
        exportExcel,

        openUserModal,
        openScenarioModal,

        getHistory:
            () => [...history],

        getUsers:
            () => [...users],

        getScenarios:
            () => [...scenarios]
    };


    // =========================================================
    // INTEGRAÇÃO COM DASHBOARD EXISTENTE
    // =========================================================

    const previousLoadAdminDashboard =
        window.SimulaAI
            .loadAdminDashboard;

    window.SimulaAI
        .loadAdminDashboard =
        async function () {

            if (
                typeof previousLoadAdminDashboard ===
                "function"
            ) {
                previousLoadAdminDashboard();
            }

            await refresh();
        };


    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    function initialize() {
        if (initialized) {
            return;
        }

        initialized =
            true;

        bindNavigation();
        bindExports();
bindKnowledgeCards();

        if (isAdmin()) {
            refresh();
        }

        console.log(
            "Simula AI | Admin.js inicializado."
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );

    } else {
        initialize();
    }

})();