/* ============================================================
   SIMULA AI — APLICAÇÃO PRINCIPAL
   Arquivo: js/app.js
   Versão: 1.0
   ============================================================ */

(function () {
    "use strict";

    window.SimulaAI = window.SimulaAI || {};

    const state = {
        initialized: false,
        currentScreen: null,
        currentUser: null
    };

    /* ============================================================
       LOG
       ============================================================ */

    function log(message, data) {
        if (data !== undefined) {
            console.log("[Simula AI | App]", message, data);
        } else {
            console.log("[Simula AI | App]", message);
        }
    }

    /* ============================================================
       UTILITÁRIOS
       ============================================================ */

    function findElement(...selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);

            if (element) {
                return element;
            }
        }

        return null;
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ============================================================
       TELAS
       ============================================================ */

    function getScreens() {
        return document.querySelectorAll(".screen");
    }

    function normalizeScreenName(name) {
        const value = String(name || "")
            .toLowerCase()
            .trim();

        const aliases = {
            login: [
                "login",
                "login-screen",
                "loginScreen"
            ],

            operator: [
                "operator",
                "operator-dashboard",
                "operatorDashboard",
                "operatorPanel"
            ],

            simulation: [
                "simulation",
                "simulation-screen",
                "simulationScreen"
            ],

            result: [
                "result",
                "result-screen",
                "resultScreen",
                "evaluationResult"
            ],

            admin: [
                "admin",
                "admin-dashboard",
                "adminDashboard",
                "adminPanel"
            ]
        };

        for (const [canonical, values] of Object.entries(aliases)) {
            if (values.includes(name) || values.includes(value)) {
                return canonical;
            }
        }

        return value;
    }

    function findScreen(name) {
        const normalized = normalizeScreenName(name);

        const selectors = {
            login: [
                "#loginScreen",
                "#login-screen",
                "#login",
                '[data-screen="login"]'
            ],

            operator: [
                "#operatorPanel",
                "#operatorDashboard",
                "#operator-dashboard",
                "#operatorScreen",
                '[data-screen="operator-dashboard"]'
            ],

            simulation: [
                "#simulationScreen",
                "#simulation-screen",
                "#simulation",
                '[data-screen="simulation"]'
            ],

            result: [
                "#resultScreen",
                "#result-screen",
                "#simulationResult",
                "#evaluationResult",
                '[data-screen="result"]'
            ],

            admin: [
                "#adminPanel",
                "#adminDashboard",
                "#admin-dashboard",
                "#adminScreen",
                '[data-screen="admin-dashboard"]'
            ]
        };

        const possibleSelectors =
            selectors[normalized] || [];

        for (const selector of possibleSelectors) {
            const element =
                document.querySelector(selector);

            if (element) {
                return element;
            }
        }

        /*
         * Segunda tentativa:
         * procura por data-screen.
         */
        const dataScreen =
            document.querySelector(
                `[data-screen="${normalized}"]`
            );

        if (dataScreen) {
            return dataScreen;
        }

        return null;
    }

    function showScreen(name) {
        const normalized =
            normalizeScreenName(name);

        const target =
            findScreen(normalized);

        /*
         * Esconde todas as telas.
         */
        getScreens().forEach((screen) => {
            screen.classList.remove("active");
            screen.classList.remove("show");

            /*
             * Não forçamos display:none em elementos que não
             * são controlados por .screen.
             */
            if (screen.dataset.baseDisplay === undefined) {
                screen.dataset.baseDisplay =
                    screen.style.display || "";
            }
        });

        if (!target) {
            log(
                `Tela "${name}" não encontrada.`
            );
            return false;
        }

        target.classList.add("active");
        target.classList.add("show");

        /*
         * Compatibilidade com CSS que utiliza display.
         */
        target.style.display = "";

        state.currentScreen = normalized;

        log(
            `Tela "${normalized}" aberta.`
        );

        return true;
    }

    /* ============================================================
       LOGIN
       ============================================================ */

    function getLoginForm() {
        return findElement(
            "#loginForm",
            "#formLogin",
            "#login-form"
        );
    }

    function setupLogin() {
        const form = getLoginForm();

        if (!form) {
            log("Formulário de login não encontrado.");
            return;
        }

        /*
         * Evita registrar o mesmo evento duas vezes.
         */
        if (form.dataset.simulaLoginReady === "true") {
            return;
        }

        form.dataset.simulaLoginReady = "true";

        form.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                const nameInput =
                    findElement(
                        "#operatorName",
                        "#name",
                        "#userName",
                        "#loginName",
                        'input[name="name"]'
                    );

                const emailInput =
                    findElement(
                        "#operatorEmail",
                        "#email",
                        "#userEmail",
                        "#loginEmail",
                        'input[name="email"]'
                    );

                const name =
                    nameInput?.value?.trim() || "";

                const email =
                    emailInput?.value?.trim() || "";

                if (!name) {
                    showToast(
                        "Digite seu nome para continuar.",
                        "warning"
                    );

                    nameInput?.focus();

                    return;
                }

                if (!email) {
                    showToast(
                        "Digite seu e-mail corporativo.",
                        "warning"
                    );

                    emailInput?.focus();

                    return;
                }

                const user = {
                    name,
                    email,
                    loginAt:
                        new Date().toISOString()
                };

                try {
                    if (
                        window.SimulaAI.auth &&
                        typeof window.SimulaAI.auth.login ===
                            "function"
                    ) {
                        const loggedUser =
                            await window.SimulaAI.auth.login(
                                name,
                                email
                            );

                        state.currentUser =
                            loggedUser || user;
                    } else {
                        localStorage.setItem(
                            "simulaAI_user",
                            JSON.stringify(user)
                        );

                        state.currentUser = user;
                    }

                    openUserArea();
                } catch (error) {
                    console.error(
                        "[Simula AI] Erro no login:",
                        error
                    );

                    showToast(
                        "Não foi possível entrar. Tente novamente.",
                        "error"
                    );
                }
            }
        );

        log("Login configurado.");
    }

    /* ============================================================
       ÁREA DO USUÁRIO
       ============================================================ */

    function getCurrentUser() {
        if (state.currentUser) {
            return state.currentUser;
        }

        if (
            window.SimulaAI.auth &&
            typeof window.SimulaAI.auth.getCurrentUser ===
                "function"
        ) {
            const user =
                window.SimulaAI.auth.getCurrentUser();

            if (user) {
                state.currentUser = user;
                return user;
            }
        }

        try {
            const stored =
                localStorage.getItem(
                    "simulaAI_user"
                );

            if (stored) {
                state.currentUser =
                    JSON.parse(stored);

                return state.currentUser;
            }
        } catch (error) {
            console.warn(
                "[Simula AI] Usuário local inválido.",
                error
            );
        }

        return null;
    }

    function isAdmin() {
        const user = getCurrentUser();

        if (
            window.SimulaAI.auth &&
            typeof window.SimulaAI.auth.isAdmin ===
                "function"
        ) {
            return window.SimulaAI.auth.isAdmin();
        }

        return Boolean(
            user &&
            (
                user.role === "admin" ||
                user.role === "administrador"
            )
        );
    }

    function openUserArea() {
        const user = getCurrentUser();

        if (!user) {
            showScreen("login");
            return;
        }

        updateUserInterface(user);

        if (isAdmin()) {
            showScreen("admin");

            if (
                typeof window.SimulaAI.loadAdminDashboard ===
                    "function"
            ) {
                window.SimulaAI.loadAdminDashboard();
            }
        } else {
            showScreen("operator");

            if (
                typeof window.SimulaAI.loadOperatorDashboard ===
                    "function"
            ) {
                window.SimulaAI.loadOperatorDashboard();
            }
        }
    }

    /* ============================================================
       INTERFACE DO USUÁRIO
       ============================================================ */

    function updateUserInterface(user) {
        if (!user) {
            return;
        }

        const name =
            user.name ||
            user.nome ||
            "Usuário";

        const email =
            user.email ||
            "";

        const role =
            user.role ||
            (
                isAdmin()
                    ? "Administrador"
                    : "Operador"
            );

        const nameElements =
            document.querySelectorAll(
                "#headerUserName, #userNameDisplay, .user-name, [data-user-name]"
            );

        nameElements.forEach((element) => {
            element.textContent = name;
        });

        const emailElements =
            document.querySelectorAll(
                "#headerUserEmail, #userEmailDisplay, [data-user-email]"
            );

        emailElements.forEach((element) => {
            element.textContent = email;
        });

        const roleElements =
            document.querySelectorAll(
                "#headerUserRole, #userRoleDisplay, .user-role, [data-user-role]"
            );

        roleElements.forEach((element) => {
            element.textContent = role;
        });

        const welcomeElements =
            document.querySelectorAll(
                "#operatorWelcomeName, #welcomeName, [data-welcome-name]"
            );

        welcomeElements.forEach((element) => {
            element.textContent = name;
        });

        const avatarElements =
            document.querySelectorAll(
                "#userAvatar, .user-avatar, [data-user-avatar]"
            );

        const initial =
            name
                .trim()
                .charAt(0)
                .toUpperCase();

        avatarElements.forEach((element) => {
            element.textContent = initial || "U";
        });
    }

    /* ============================================================
       LOGOUT
       ============================================================ */

    function setupLogout() {
        const logoutButtons =
            document.querySelectorAll(
                "#logoutButton, #logoutBtn, [data-action='logout']"
            );

        logoutButtons.forEach((button) => {
            if (
                button.dataset.simulaLogoutReady ===
                "true"
            ) {
                return;
            }

            button.dataset.simulaLogoutReady =
                "true";

            button.addEventListener(
                "click",
                async function () {
                    try {
                        if (
                            window.SimulaAI.auth &&
                            typeof window.SimulaAI.auth.logout ===
                                "function"
                        ) {
                            await window.SimulaAI.auth.logout();
                        } else {
                            localStorage.removeItem(
                                "simulaAI_user"
                            );
                        }
                    } catch (error) {
                        console.error(
                            "[Simula AI] Erro ao sair:",
                            error
                        );
                    }

                    state.currentUser = null;

                    showScreen("login");
                }
            );
        });
    }

    /* ============================================================
       CENÁRIOS
       ============================================================ */

    function setupScenarioButtons() {
        document.addEventListener(
            "click",
            function (event) {
                const card =
                    event.target.closest(
                        ".scenario-card"
                    );

                if (!card) {
                    return;
                }

                const scenarioId =
                    card.dataset.scenarioId ||
                    card.dataset.id;

                if (
                    scenarioId &&
                    window.SimulaAI.scenarios &&
                    typeof window.SimulaAI.scenarios
                        .selectScenario === "function"
                ) {
                    window.SimulaAI.scenarios.selectScenario(
                        scenarioId
                    );
                }
            }
        );
    }

    /* ============================================================
       INICIAR SIMULAÇÃO
       ============================================================ */

    function setupStartSimulation() {
        document.addEventListener(
            "click",
            function (event) {
                const button =
                    event.target.closest(
                        "#startSimulationButton, #startSimulationBtn, #btnStartSimulation, [data-action='start-simulation']"
                    );

                if (!button) {
                    return;
                }

                event.preventDefault();

                startSelectedSimulation();
            }
        );
    }

    function startSelectedSimulation() {
        let scenario = null;

        let difficulty = "medio";

        if (
            window.SimulaAI.scenarios &&
            typeof window.SimulaAI.scenarios
                .getSelectedScenario === "function"
        ) {
            scenario =
                window.SimulaAI.scenarios
                    .getSelectedScenario();
        }

        if (
            window.SimulaAI.scenarios &&
            typeof window.SimulaAI.scenarios
                .getSelectedDifficulty === "function"
        ) {
            difficulty =
                window.SimulaAI.scenarios
                    .getSelectedDifficulty() ||
                "medio";
        }

        if (!scenario) {
            showToast(
                "Selecione um cenário antes de iniciar.",
                "warning"
            );

            return false;
        }

        if (
            window.SimulaAI.simulation &&
            typeof window.SimulaAI.simulation
                .startSimulation === "function"
        ) {
            return window.SimulaAI.simulation.startSimulation(
                scenario,
                difficulty
            );
        }

        if (
            typeof window.SimulaAI.startSimulation ===
                "function"
        ) {
            return window.SimulaAI.startSimulation(
                scenario,
                difficulty
            );
        }

        showToast(
            "O módulo de simulação ainda não está disponível.",
            "error"
        );

        return false;
    }

    /* ============================================================
       NAVEGAÇÃO
       ============================================================ */

    function setupNavigation() {
        document.addEventListener(
            "click",
            function (event) {
                const button =
                    event.target.closest(
                        "[data-navigate]"
                    );

                if (!button) {
                    return;
                }

                const destination =
                    button.dataset.navigate;

                if (destination) {
                    showScreen(destination);
                }
            }
        );
    }

    /* ============================================================
       TOAST
       ============================================================ */

    function showToast(
        message,
        type = "info"
    ) {
        let container =
            document.querySelector(
                "#toastContainer"
            );

        if (!container) {
            container =
                document.createElement("div");

            container.id =
                "toastContainer";

            container.className =
                "toast-container";

            document.body.appendChild(
                container
            );
        }

        const toast =
            document.createElement("div");

        toast.className =
            `simula-toast simula-toast-${type}`;

        toast.innerHTML = `
            <div class="simula-toast-content">
                ${escapeHTML(message)}
            </div>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("show");
        });

        setTimeout(() => {
            toast.classList.remove("show");

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    }

    /* ============================================================
       INTEGRAÇÕES
       ============================================================ */

    function initializeModules() {
        /*
         * scenarios.js
         */
        if (
            window.SimulaAI.scenarios &&
            typeof window.SimulaAI.scenarios
                .loadScenarios === "function"
        ) {
            window.SimulaAI.scenarios
                .loadScenarios()
                .catch((error) => {
                    console.error(
                        "[Simula AI] Erro ao carregar cenários:",
                        error
                    );
                });
        }

        /*
         * dashboard.js
         */
        if (
            typeof window.SimulaAI.updateDashboardStats ===
                "function"
        ) {
            try {
                window.SimulaAI.updateDashboardStats();
            } catch (error) {
                console.warn(
                    "[Simula AI] Dashboard ainda não pronto.",
                    error
                );
            }
        }
    }

    /* ============================================================
       RESTAURAR SESSÃO
       ============================================================ */

    function restoreSession() {
        const user =
            getCurrentUser();

        if (!user) {
            showScreen("login");
            return;
        }

        updateUserInterface(user);

        /*
         * Para o desenvolvimento local, mantém a sessão.
         */
        openUserArea();
    }

    /* ============================================================
       API PÚBLICA
       ============================================================ */

    window.SimulaAI.app = {
        state,

        showScreen,

        getCurrentUser,

        isAdmin,

        openUserArea,

        startSelectedSimulation,

        showToast,

        updateUserInterface
    };

    window.SimulaAI.showScreen =
        showScreen;

    window.SimulaAI.showToast =
        showToast;

    window.SimulaAI.getCurrentUser =
        getCurrentUser;

    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */

    function initialize() {
        if (state.initialized) {
            return;
        }

        state.initialized = true;

        log("Simula AI iniciando...");

        setupLogin();
        setupLogout();
        setupScenarioButtons();
        setupStartSimulation();
        setupNavigation();

        /*
         * Primeiro tenta restaurar sessão.
         * Se não houver usuário, permanece no login.
         */
        restoreSession();

        initializeModules();

        log("Simula AI inicializado.");
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }

    log("App.js carregado com sucesso.");

})();
/* =========================================================
   SIMULA AI — VOLTAR AO TOPO
========================================================= */

function bindBrandHomeLink() {
    const brandHomeLink =
        document.getElementById("brandHomeLink");

    if (!brandHomeLink) {
        console.warn(
            "Simula AI | #brandHomeLink não encontrado."
        );
        return;
    }

    if (brandHomeLink.dataset.homeBound === "true") {
        return;
    }

    brandHomeLink.dataset.homeBound = "true";

    brandHomeLink.addEventListener("click", function (event) {
        event.preventDefault();

        // Página
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
        });

        // Compatibilidade caso o scroll esteja no container principal
        document.documentElement.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
        });

        document.body.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
        });

        const mainApp =
            document.getElementById("mainApp");

        if (mainApp) {
            mainApp.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth"
            });
        }
    });
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        bindBrandHomeLink
    );
} else {
    bindBrandHomeLink();
}
/* =========================================================
   SIMULA AI — MICROFONE DO HEADER VOLTA AO TOPO
========================================================= */

document.addEventListener("click", function (event) {

    const microphone =
        event.target.closest(".main-header .brand-icon");

    if (!microphone) {
        return;
    }

    event.preventDefault();

    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
    });

});